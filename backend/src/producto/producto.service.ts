import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Producto } from './entities/producto.entity';
import { Supplier } from '../supplier/entities/supplier.entity';
import { Repository } from 'typeorm/repository/Repository';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { StockNotificationService } from '../stock/stock-notification.service';

@Injectable()
export class ProductoService {
  constructor(
    @InjectRepository(Producto)
    private productoRepository: Repository<Producto>,
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,
    private stockNotificationService: StockNotificationService,
  ) {}

  async create(createProductoDto: CreateProductoDto): Promise<Producto> {
    const producto = new Producto(
      createProductoDto.name,
      createProductoDto.stock_actual,
      createProductoDto.price,
      createProductoDto.stock_minimo,
      createProductoDto.servicios_por_producto || 1,
    );

    // Si se proporcionan supplierIds, buscar y asociar los suppliers
    if (
      createProductoDto.supplierIds &&
      createProductoDto.supplierIds.length > 0
    ) {
      const suppliers = await this.supplierRepository.findByIds(
        createProductoDto.supplierIds,
      );
      producto.suppliers = suppliers;
    }

    return this.productoRepository.save(producto);
  }

  findAll(includeDeleted: boolean = false): Promise<Producto[]> {
    const whereCondition = includeDeleted ? {} : { isDeleted: false };
    return this.productoRepository.find({
      where: whereCondition,
      relations: ['suppliers'],
    });
  }

  findById(id: number): Promise<Producto> {
    return this.productoRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['suppliers'],
    });
  }

  async restore(id: number): Promise<Producto> {
    const producto = await this.productoRepository.findOne({
      where: { id },
      relations: ['suppliers'],
    });
    if (!producto) {
      throw new HttpException('Producto not found', 404);
    }
    if (!producto.isDeleted) {
      throw new HttpException('Producto is not deleted', 400);
    }
    producto.isDeleted = false;
    return await this.productoRepository.save(producto);
  }

  async update(
    id: number,
    updateProductoDto: UpdateProductoDto,
  ): Promise<Producto> {
    const producto = await this.productoRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['suppliers'],
    });

    if (!producto) {
      throw new HttpException('Producto not found', 404);
    }

    // Actualizar campos básicos
    if (updateProductoDto.name !== undefined) {
      producto.name = updateProductoDto.name;
    }
    if (updateProductoDto.price !== undefined) {
      producto.price = updateProductoDto.price;
    }
    if (updateProductoDto.stock_actual !== undefined) {
      producto.stock_actual = updateProductoDto.stock_actual;
    }
    if (updateProductoDto.stock_minimo !== undefined) {
      producto.stock_minimo = updateProductoDto.stock_minimo;
    }
    if (updateProductoDto.servicios_por_producto !== undefined) {
      producto.servicios_por_producto =
        updateProductoDto.servicios_por_producto;
    }
    if (updateProductoDto.priority !== undefined) {
      producto.priority = updateProductoDto.priority;
    }

    // Actualizar suppliers si se proporcionan
    if (updateProductoDto.supplierIds !== undefined) {
      if (updateProductoDto.supplierIds.length > 0) {
        const suppliers = await this.supplierRepository.findByIds(
          updateProductoDto.supplierIds,
        );
        producto.suppliers = suppliers;
      } else {
        producto.suppliers = [];
      }
    }

    // Guardar stock anterior para comparar
    const stockAnterior = producto.stock_actual;

    const updatedProduct = await this.productoRepository.save(producto);

    // Verificar si el stock cambió y está en o bajo el mínimo
    if (
      updateProductoDto.stock_actual !== undefined &&
      Number(updatedProduct.stock_actual) <= Number(updatedProduct.stock_minimo)
    ) {
      // Ejecutar verificación de stock de forma asíncrona
      this.stockNotificationService
        .checkSingleProductStockAndNotify(updatedProduct)
        .catch((error) => {
          console.error('Error enviando notificación de stock:', error);
        });
    }

    return updatedProduct;
  }

  async updateStock(
    id: number,
    stock_actual: number,
    stock_minimo: number,
  ): Promise<Producto> {
    const producto = await this.productoRepository.findOne({
      where: { id, isDeleted: false },
    });
    if (!producto) {
      throw new HttpException('Producto not found', 404);
    }

    const stockAnterior = producto.stock_actual;

    producto.stock_actual = stock_actual;
    producto.stock_minimo = stock_minimo;

    const updatedProduct = await this.productoRepository.save(producto);

    // Verificar si el stock está en o bajo el mínimo
    if (Number(stock_actual) <= Number(stock_minimo)) {
      // Ejecutar verificación de stock de forma asíncrona
      this.stockNotificationService
        .checkSingleProductStockAndNotify(updatedProduct)
        .catch((error) => {
          console.error('Error enviando notificación de stock:', error);
        });
    }

    return updatedProduct;
  }

  //adjust stock alert (stock_minimo)
  // async ajustStock(id: number, cantidad: number): Promise<Producto> {
  //     const producto = await this.productoRepository.findOne({ where: { id, isDeleted: false } });
  //     if (!producto) {
  //         throw new HttpException('Producto not found', 404);
  //     }
  //     producto.stock_minimo = cantidad;
  //     return this.productoRepository.save(producto);
  // }

  async delete(id: number): Promise<void> {
    const producto = await this.productoRepository.findOne({
      where: { id, isDeleted: false },
    });
    if (!producto) {
      throw new HttpException('Producto not found', 404);
    }
    producto.isDeleted = true;
    await this.productoRepository.save(producto);
  }

  /**
   * Descuenta stock de productos basado en los servicios realizados
   * @param servicios Array de servicios realizados en el turno
   * @returns Array de productos actualizados con stock descontado
   */
  async descontarStockPorServicios(servicios: any[]): Promise<Producto[]> {
    const productosActualizados: Producto[] = [];

    for (const servicio of servicios) {
      if (servicio.Producto && servicio.Producto.length > 0) {
        for (const producto of servicio.Producto) {
          const productoEnBD = await this.productoRepository.findOne({
            where: { id: producto.id, isDeleted: false },
          });

          if (productoEnBD && productoEnBD.servicios_por_producto > 0) {
            // Calcular cuánto stock se debe descontar
            // Si un producto rinde para X servicios, cada servicio consume 1/X unidades
            const cantidadADescontar = 1 / productoEnBD.servicios_por_producto;

            if (Number(productoEnBD.stock_actual) >= cantidadADescontar) {
              const stockAnterior = productoEnBD.stock_actual;
              productoEnBD.stock_actual = Number(productoEnBD.stock_actual) - cantidadADescontar;

              // Redondear a 2 decimales para evitar problemas de precisión
              productoEnBD.stock_actual =
                Math.round(Number(productoEnBD.stock_actual) * 100) / 100;

              const productoActualizado =
                await this.productoRepository.save(productoEnBD);
              productosActualizados.push(productoActualizado);

              // Verificar si el stock está en o bajo el mínimo después del descuento
              if (
                Number(productoActualizado.stock_actual) <=
                Number(productoActualizado.stock_minimo)
              ) {
                // Enviar notificación de stock bajo de forma asíncrona
                this.stockNotificationService
                  .checkSingleProductStockAndNotify(productoActualizado)
                  .catch((error) => {
                    console.error(
                      'Error enviando notificación de stock:',
                      error,
                    );
                  });
              }

              console.log(
                `Stock descontado para ${productoEnBD.name}: ${cantidadADescontar} unidades (1/${productoEnBD.servicios_por_producto}). Stock actual: ${productoActualizado.stock_actual}`,
              );
            } else {
              console.warn(
                `Stock insuficiente para ${productoEnBD.name}. Stock actual: ${productoEnBD.stock_actual}, requerido: ${cantidadADescontar}`,
              );
            }
          }
        }
      }
    }

    return productosActualizados;
  }
}
