import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Producto } from '../producto/entities/producto.entity';
import { Users } from '../users/entities/users.entity';
import { Supplier } from '../supplier/entities/supplier.entity';
import { Role } from '../roles/role.enum';
import { MailService } from '../mail.services';
import { ProductPriority } from '../enums/product-priority.enum';
import { QuotationService } from '../quotation/quotation.service';
import { SystemConfigService } from '../config/system-config.service';

@Injectable()
export class StockNotificationService {
  // Contador de productos bajo stock por prioridad
  private lowStockCounters = {
    [ProductPriority.ALTA]: new Set<number>(),
    [ProductPriority.MEDIA]: new Set<number>(),
    [ProductPriority.BAJA]: new Set<number>(),
  };

  constructor(
    @InjectRepository(Producto)
    private productoRepository: Repository<Producto>,
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,
    private mailService: MailService,
    @Inject(forwardRef(() => QuotationService))
    private readonly quotationService: QuotationService,
    private readonly systemConfigService: SystemConfigService,
  ) {}

  async checkStockLevelsAndNotify(): Promise<void> {
    // Buscar productos con stock por debajo del mínimo
    const lowStockProducts = await this.productoRepository
      .createQueryBuilder('producto')
      .leftJoinAndSelect('producto.suppliers', 'suppliers')
      .where('producto.stock_actual <= producto.stock_minimo')
      .andWhere('producto.isDeleted = false')
      .getMany();

    if (lowStockProducts.length > 0) {
      await this.sendLowStockAlert(lowStockProducts);
    }
  }

  async checkSingleProductStockAndNotify(product: Producto): Promise<void> {
    if (product.stock_actual <= product.stock_minimo) {
      // Obtener el producto con proveedores y prioridad
      const productWithSuppliers = await this.productoRepository.findOne({
        where: { id: product.id },
        relations: ['suppliers'],
      });

      if (productWithSuppliers) {
        // Enviar alerta a administradores
        await this.sendLowStockAlert([productWithSuppliers]);

        // Verificar si se debe crear cotización (ahora consulta la BD en lugar de usar contadores en memoria)
        await this.checkThresholdAndCreateQuotationForAllPriorities();
      }
    }
  }

  private async checkThresholdAndCreateQuotation(
    priority: ProductPriority,
  ): Promise<void> {
    try {
      const thresholds =
        await this.systemConfigService.getQuotationThresholds();
      const productIds = Array.from(this.lowStockCounters[priority]);

      let shouldCreateQuotation = false;
      switch (priority) {
        case ProductPriority.ALTA:
          shouldCreateQuotation = productIds.length >= thresholds.high;
          break;
        case ProductPriority.MEDIA:
          shouldCreateQuotation = productIds.length >= thresholds.medium;
          break;
        case ProductPriority.BAJA:
          shouldCreateQuotation = productIds.length >= thresholds.low;
          break;
      }

      if (shouldCreateQuotation) {
        // Obtener productos con sus proveedores
        const products = await this.productoRepository.find({
          where: productIds.map((id) => ({ id })),
          relations: ['suppliers'],
        });

        // Recopilar todos los proveedores únicos
        const supplierIds = new Set<number>();
        products.forEach((product) => {
          product.suppliers?.forEach((supplier) => {
            supplierIds.add(supplier.id);
          });
        });

        if (supplierIds.size > 0) {
          // Crear solicitud de cotización
          await this.quotationService.createQuotationRequest({
            productIds,
            supplierIds: Array.from(supplierIds),
            notes: `Solicitud automática generada por stock bajo - Prioridad: ${priority}`,
          });

          // Limpiar contador para esta prioridad
          this.lowStockCounters[priority].clear();

          console.log(
            `Cotización creada automáticamente para ${productIds.length} producto(s) de prioridad ${priority}`,
          );
        }
      }
    } catch (error) {
      console.error('Error al verificar umbral y crear cotización:', error);
    }
  }

  /**
   * Verifica los umbrales y crea cotizaciones para todas las prioridades
   * Consulta directamente la base de datos en lugar de usar contadores en memoria
   */
  private async checkThresholdAndCreateQuotationForAllPriorities(): Promise<void> {
    try {
      const thresholds =
        await this.systemConfigService.getQuotationThresholds();

      // Verificar cada prioridad
      for (const priority of [
        ProductPriority.ALTA,
        ProductPriority.MEDIA,
        ProductPriority.BAJA,
      ]) {
        // Buscar productos con stock bajo de esta prioridad
        const lowStockProducts = await this.productoRepository.find({
          where: {
            isDeleted: false,
            priority: priority,
          },
          relations: ['suppliers'],
        });

        // Filtrar solo los que están en o bajo el stock mínimo
        const productsAtMinimum = lowStockProducts.filter(
          (p) => p.stock_actual <= p.stock_minimo,
        );

        let shouldCreateQuotation = false;
        let threshold = 0;

        switch (priority) {
          case ProductPriority.ALTA:
            threshold = thresholds.high;
            shouldCreateQuotation = productsAtMinimum.length >= thresholds.high;
            break;
          case ProductPriority.MEDIA:
            threshold = thresholds.medium;
            shouldCreateQuotation =
              productsAtMinimum.length >= thresholds.medium;
            break;
          case ProductPriority.BAJA:
            threshold = thresholds.low;
            shouldCreateQuotation = productsAtMinimum.length >= thresholds.low;
            break;
        }

        if (shouldCreateQuotation) {
          const productIds = productsAtMinimum.map((p) => p.id);

          // Verificar si ya existe una cotización pendiente para estos productos
          const hasPendingQuotation =
            await this.quotationService.hasPendingQuotationForProducts(
              productIds,
            );

          if (hasPendingQuotation) {
            console.log(
              `ℹ️ Ya existe una cotización pendiente para productos de prioridad ${priority}. Se omite la creación.`,
            );
            continue;
          }

          // Recopilar todos los proveedores únicos
          const supplierIds = new Set<number>();
          productsAtMinimum.forEach((product) => {
            product.suppliers?.forEach((supplier) => {
              supplierIds.add(supplier.id);
            });
          });

          if (supplierIds.size > 0) {
            // Generar mensaje detallado con cantidades por proveedor
            const suppliers = await this.supplierRepository.findByIds(
              Array.from(supplierIds),
            );

            // Enviar cotización a cada proveedor con sus productos específicos
            for (const supplier of suppliers) {
              const supplierProducts = productsAtMinimum.filter((product) =>
                product.suppliers?.some((s) => s.id === supplier.id),
              );

              if (supplierProducts.length > 0) {
                // Generar lista de productos con cantidades
                const productList = supplierProducts
                  .map((product) => {
                    const cantidad = product.stock_minimo * 2;
                    return `• ${product.name}, cantidad: ${cantidad}`;
                  })
                  .join('\n');

                const notes = `Estimado/a ${supplier.contactPerson},

Esperamos que se encuentre bien. Nos ponemos en contacto con usted para solicitar información sobre la disponibilidad y precios de los siguientes productos que requieren reposición:

${productList}

Por favor, envíenos información sobre:
- Disponibilidad actual
- Precios unitarios
- Tiempo de entrega
- Cantidades mínimas de pedido

Agradecemos su pronta respuesta.

Saludos cordiales,
Equipo de Car Detailing`;

                // Crear solicitud de cotización automática para este proveedor
                await this.quotationService.createQuotationRequest({
                  productIds: supplierProducts.map((p) => p.id),
                  supplierIds: [supplier.id],
                  notes: notes,
                  isAutomatic: true,
                });

                console.log(
                  `✅ Cotización creada automáticamente para proveedor ${supplier.name}: ${supplierProducts.length} producto(s) de prioridad ${priority}`,
                );
              }
            }
          } else {
            console.warn(
              `⚠️ No se pudo crear cotización para ${productsAtMinimum.length} producto(s) de prioridad ${priority}: sin proveedores asignados`,
            );
          }
        } else {
          console.log(
            `ℹ️ Prioridad ${priority}: ${productsAtMinimum.length}/${threshold} productos en stock mínimo. No se alcanzó el umbral.`,
          );
        }
      }
    } catch (error) {
      console.error('Error al verificar umbrales y crear cotizaciones:', error);
    }
  }

  private async sendLowStockAlert(products: Producto[]): Promise<void> {
    // Obtener todos los administradores
    const admins = await this.usersRepository.find({
      where: { role: Role.ADMIN },
    });

    // if (admins.length === 0) {
    // //   console.warn('No hay administradores para notificar sobre stock bajo');
    //   return;
    // }

    const emailContent = this.generateLowStockEmailContent(products);

    // Enviar email a todos los administradores
    for (const admin of admins) {
      try {
        await this.mailService.sendHtmlMail(
          admin.email,
          '🚨 Alerta de Stock Bajo - Car Detailing',
          emailContent,
          `Alerta de Stock Bajo: ${products.length} producto(s) requieren reposición. Revise el panel de administración para más detalles.`,
        );
        // console.log(`Alerta de stock enviada a ${admin.email}`);
      } catch (error) {
        console.error(`Error enviando alerta a ${admin.email}:`, error);
      }
    }
  }

  private generateLowStockEmailContent(products: Producto[]): string {
    const productList = products
      .map(
        (product) => `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 12px; border: 1px solid #ddd; font-weight: 500;">${product.name}</td>
          <td style="padding: 12px; border: 1px solid #ddd; text-align: center; color: #dc3545; font-weight: bold;">${product.stock_actual}</td>
          <td style="padding: 12px; border: 1px solid #ddd; text-align: center; color: #28a745; font-weight: bold;">${product.stock_minimo}</td>
          <td style="padding: 12px; border: 1px solid #ddd;">
            ${
              product.suppliers && product.suppliers.length > 0
                ? product.suppliers.map((s) => s.name).join(', ')
                : '<span style="color: #6c757d; font-style: italic;">Sin proveedores</span>'
            }
          </td>
        </tr>
      `,
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Alerta de Stock Bajo - Car Detailing</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              margin: 0; 
              padding: 0; 
              background-color: #f8f9fa;
            }
            .container { 
              max-width: 700px; 
              margin: 20px auto; 
              background-color: white; 
              border-radius: 10px; 
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header { 
              background: linear-gradient(135deg, #dc3545, #c82333); 
              color: white; 
              padding: 30px 20px; 
              text-align: center; 
            }
            .header h1 { 
              margin: 0; 
              font-size: 28px; 
              font-weight: 600; 
            }
            .header p { 
              margin: 10px 0 0 0; 
              font-size: 16px; 
              opacity: 0.9; 
            }
            .content { 
              padding: 30px 20px; 
            }
            .alert-box {
              background-color: #fff3cd;
              border: 2px solid #ffc107;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              text-align: center;
            }
            .alert-icon {
              font-size: 48px;
              margin-bottom: 10px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 25px 0; 
              background-color: white;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            th { 
              background: linear-gradient(135deg, #007bff, #0056b3); 
              color: white; 
              padding: 15px 12px; 
              font-weight: 600; 
              text-align: left; 
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            th:nth-child(2), th:nth-child(3) {
              text-align: center;
            }
            tr:nth-child(even) {
              background-color: #f8f9fa;
            }
            tr:hover {
              background-color: #e9ecef;
            }
            .actions-section {
              background-color: #e3f2fd;
              border-radius: 8px;
              padding: 25px;
              margin: 25px 0;
            }
            .actions-section h3 {
              color: #1976d2;
              margin-top: 0;
              margin-bottom: 15px;
              font-size: 18px;
            }
            .actions-section ul {
              margin: 0;
              padding-left: 20px;
            }
            .actions-section li {
              margin-bottom: 8px;
              color: #424242;
            }
            .footer { 
              background-color: #f8f9fa;
              padding: 20px; 
              border-top: 1px solid #dee2e6; 
              font-size: 13px; 
              color: #6c757d; 
              text-align: center;
            }
            .footer p {
              margin: 5px 0;
            }
            .stats {
              display: inline-block;
              background-color: #dc3545;
              color: white;
              padding: 8px 16px;
              border-radius: 20px;
              font-weight: bold;
              font-size: 16px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚨 Alerta de Stock Bajo</h1>
              <p>Car Detailing - Sistema de Inventario</p>
            </div>
            
            <div class="content">
              <div class="alert-box">
                <div class="alert-icon">⚠️</div>
                <h2 style="margin: 0; color: #856404;">¡Atención Requerida!</h2>
                <p style="margin: 10px 0 0 0; color: #856404;">Los siguientes productos han alcanzado o están por debajo de su stock mínimo.</p>
              </div>

              <p style="font-size: 16px; text-align: center;">
                Se detectaron <span class="stats">${products.length}</span> producto(s) que requieren reposición inmediata:
              </p>
              
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Stock Actual</th>
                    <th>Stock Mínimo</th>
                    <th>Proveedores</th>
                  </tr>
                </thead>
                <tbody>
                  ${productList}
                </tbody>
              </table>
              
              <div class="actions-section">
                <h3>📋 Acciones Recomendadas:</h3>
                <ul>
                  <li><strong>Revisar el panel de administración</strong> para gestionar el stock</li>
                  <li><strong>Contactar a los proveedores</strong> correspondientes para solicitar cotizaciones</li>
                  <li><strong>Considerar realizar pedidos</strong> de reposición urgente</li>
                  <li><strong>Evaluar el stock mínimo</strong> de productos con alta rotación</li>
                </ul>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>Este es un mensaje automático del sistema de Car Detailing.</strong></p>
              <p>📅 Fecha y hora: ${new Date().toLocaleString('es-AR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}</p>
              <p>💼 Car Detailing - Gestión Profesional de Inventario</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  async getProductsWithLowStock(): Promise<Producto[]> {
    return this.productoRepository
      .createQueryBuilder('producto')
      .leftJoinAndSelect('producto.suppliers', 'suppliers')
      .where('producto.stock_actual <= producto.stock_minimo')
      .andWhere('producto.isDeleted = false')
      .getMany();
  }

  /**
   * Obtiene datos enriquecidos para la auditoría del envío de email
   */
  async getEmailAuditData(
    supplierId: number,
    productIds: number[],
    message: string,
  ): Promise<any> {
    const supplier = await this.supplierRepository.findOne({
      where: { id: supplierId },
    });

    const products = await this.productoRepository.findBy({
      id: In(productIds),
    });

    return {
      supplierId,
      supplierName: supplier?.name || 'Desconocido',
      productIds,
      productNames: products.map((p) => p.name),
      message,
    };
  }

  async sendSupplierEmail(
    supplierId: number,
    productIds: number[],
    message: string,
  ): Promise<void> {
    // Obtener información del proveedor
    const supplier = await this.supplierRepository.findOne({
      where: { id: supplierId },
    });

    if (!supplier) {
      throw new Error('Proveedor no encontrado');
    }

    // Obtener productos seleccionados
    const products = await this.productoRepository.findBy({
      id: In(productIds),
    });

    const emailContent = this.generateSupplierEmailContent(
      supplier,
      products,
      message,
    );

    // Enviar email al proveedor
    // await this.mailService.sendHtmlMail(
    //   supplier.email,
    //   'Solicitud de Cotización - Car Detailing',
    //   emailContent,
    //   `Solicitud de cotización para ${products.length} producto(s). Por favor revise el detalle en el email.`,
    // );

    // Crear solicitud de cotización en el sistema y generar respuestas automáticas
    await this.quotationService.createQuotationRequest({
      productIds,
      supplierIds: [supplierId],
      notes: message || 'Solicitud de cotización manual',
      isAutomatic: false,
    });

    console.log(
      `Email enviado y cotización creada con respuesta automática para proveedor ${supplier.name}`,
    );
  }

  private generateSupplierEmailContent(
    supplier: any,
    products: Producto[],
    customMessage: string,
  ): string {
    const productList = products
      .map(
        (product) => `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${product.name}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${product.stock_actual}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${product.stock_minimo}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
            ${Math.max(product.stock_minimo - product.stock_actual + 5, 10)}
          </td>
        </tr>
      `,
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #007bff; color: white; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background-color: #f8f9fa; padding: 10px; border: 1px solid #ddd; }
            td { padding: 8px; border: 1px solid #ddd; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Solicitud de Cotización</h1>
              <p style="margin: 10px 0 0 0;">Car Detailing</p>
            </div>
            
            <p>Estimado/a ${supplier.name},</p>
            
            <p>Esperamos que se encuentre bien. Nos dirigimos a usted para solicitar una cotización de los siguientes productos:</p>
            
            ${customMessage ? `<div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;"><strong>Mensaje adicional:</strong><br>${customMessage}</div>` : ''}
            
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Stock Actual</th>
                  <th>Stock Mínimo</th>
                  <th>Cantidad Sugerida</th>
                </tr>
              </thead>
              <tbody>
                ${productList}
              </tbody>
            </table>
            
            <p>Agradecemos si pudiera proporcionarnos:</p>
            <ul>
              <li>Precios unitarios actualizados</li>
              <li>Disponibilidad de stock</li>
              <li>Tiempos de entrega</li>
              <li>Condiciones de pago</li>
            </ul>
            
            <p>Quedamos a la espera de su respuesta.</p>
            
            <p>Saludos cordiales,<br>
            <strong>Equipo de Car Detailing</strong></p>
            
            <div class="footer">
              <p>Car Detailing - Servicio profesional de lavado y detailing</p>
              <p>Email: info@cardetailing.com | Teléfono: +54 11 1234-5678</p>
              <p>Fecha: ${new Date().toLocaleString('es-AR')}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}
