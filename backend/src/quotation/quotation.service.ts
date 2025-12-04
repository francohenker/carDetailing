import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuotationRequest } from './entities/quotation-request.entity';
import { QuotationResponse } from './entities/quotation-response.entity';
import { Producto } from '../producto/entities/producto.entity';
import { Supplier } from '../supplier/entities/supplier.entity';
import { CreateQuotationRequestDto } from './dto/create-quotation-request.dto';
import {
  QuotationRequestStatus,
  QuotationResponseStatus,
} from '../enums/quotation-status.enum';

@Injectable()
export class QuotationService {
  constructor(
    @InjectRepository(QuotationRequest)
    private quotationRequestRepository: Repository<QuotationRequest>,
    @InjectRepository(QuotationResponse)
    private quotationResponseRepository: Repository<QuotationResponse>,
    @InjectRepository(Producto)
    private productoRepository: Repository<Producto>,
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,
  ) {}

  async createQuotationRequest(
    dto: CreateQuotationRequestDto,
  ): Promise<QuotationRequest> {
    const products = await this.productoRepository.findByIds(dto.productIds);
    const suppliers = await this.supplierRepository.findByIds(dto.supplierIds);

    const quotationRequest = this.quotationRequestRepository.create({
      products,
      suppliers,
      notes: dto.notes,
      status: QuotationRequestStatus.PENDING,
    });

    const savedRequest =
      await this.quotationRequestRepository.save(quotationRequest);

    // Generar respuestas automáticas de prueba
    await this.generateMockResponses(savedRequest, products, suppliers);

    return savedRequest;
  }

  extraerCantidadesSimple(text: string): number[] {
    const cantidades: number[] = [];

    // Buscar todos los números que siguen a "cantidad:"
    const partes = text.split('cantidad:');
    for (let i = 1; i < partes.length; i++) {
      // Tomar la parte después de "cantidad:" y extraer el primer número
      const numeroMatch = partes[i].match(/\d+/);
      if (numeroMatch) {
        const cantidad = parseInt(numeroMatch[0], 10);
        cantidades.push(cantidad);
      }
    }

    return cantidades;
  }

  async generateMockResponses(
    request: QuotationRequest,
    products: Producto[],
    suppliers: Supplier[],
  ): Promise<void> {
    const paymentTermsOptions = [
      '30 días',
      '15 días',
      'Contado',
      '60 días',
      '50% adelanto, 50% contra entrega',
      '45 días',
      'Contado con 5% descuento',
      '30 días con 2% descuento',
    ];

    const notesOptions = [
      'Precios sujetos a disponibilidad de stock',
      'Incluye envío sin cargo para pedidos mayores a $50,000',
      'Productos de primera calidad',
      'Stock disponible inmediato',
      'Garantía de 6 meses en todos los productos',
      'Descuento por volumen disponible',
      'Envío express disponible con cargo adicional',
    ];

    for (const supplier of suppliers) {
      // Simular diferentes estrategias de pricing por proveedor
      const supplierStrategy = Math.random();
      let priceMultiplier: number;

      if (supplierStrategy < 0.33) {
        // Proveedor económico (precios más bajos)
        priceMultiplier = 0.75 + Math.random() * 0.15; // 0.75 - 0.90
      } else if (supplierStrategy < 0.66) {
        // Proveedor medio (precios competitivos)
        priceMultiplier = 0.9 + Math.random() * 0.2; // 0.90 - 1.10
      } else {
        // Proveedor premium (precios más altos pero mejor servicio)
        priceMultiplier = 1.05 + Math.random() * 0.25; // 1.05 - 1.30
      }
      const quantity1 = this.extraerCantidadesSimple(request.notes);

      const productQuotes = products.map((product, index) => {
        // Generar precio con la estrategia del proveedor
        const basePrice = product.price * priceMultiplier;
        const priceVariation = 0.95 + Math.random() * 0.1; // Pequeña variación adicional
        const unitPrice = Math.round(basePrice * priceVariation * 100) / 100;

        // Calcular cantidad sugerida
        // const quantity = Math.max(
        //   product.stock_minimo - product.stock_actual + 5,
        //   10,
        // );

        // Disponibilidad más realista
        const availabilityRandom = Math.random();
        let availability: string;
        if (availabilityRandom > 0.7) {
          availability = 'Disponible inmediato';
        } else if (availabilityRandom > 0.3) {
          availability = 'Disponible en 2-3 días';
        } else {
          availability = 'Bajo pedido (5-7 días)';
        }
        const quantity = quantity1[index];
        return {
          productId: product.id,
          productName: product.name,
          unitPrice,
          quantity,
          availability,
        };
      });

      const totalAmount = productQuotes.reduce(
        (sum, quote) => sum + quote.unitPrice * quote.quantity,
        0,
      );

      // Días de entrega basados en la estrategia del proveedor
      let deliveryDays: number;
      if (supplierStrategy < 0.33) {
        deliveryDays = Math.floor(Math.random() * 5) + 3; // 3-7 días (más lento)
      } else if (supplierStrategy < 0.66) {
        deliveryDays = Math.floor(Math.random() * 4) + 2; // 2-5 días (medio)
      } else {
        deliveryDays = Math.floor(Math.random() * 2) + 1; // 1-2 días (rápido)
      }

      const response = this.quotationResponseRepository.create({
        quotationRequestId: request.id,
        supplierId: supplier.id,
        productQuotes,
        totalAmount: Math.round(totalAmount * 100) / 100,
        deliveryDays,
        paymentTerms:
          paymentTermsOptions[
            Math.floor(Math.random() * paymentTermsOptions.length)
          ],
        notes: notesOptions[Math.floor(Math.random() * notesOptions.length)],
        status: QuotationResponseStatus.PENDING,
        isWinner: false,
      });

      // Simular delay en la respuesta (entre 0 y 3 segundos)
      const delay = Math.floor(Math.random() * 3000);
      await new Promise((resolve) => setTimeout(resolve, delay));

      await this.quotationResponseRepository.save(response);

<<<<<<< HEAD
      // console.log(
      //   `Respuesta automática generada para proveedor ${supplier.name} - Total: $${response.totalAmount}`,
      // );
=======
      console.log(
        `Respuesta automática generada para proveedor ${supplier.name} - Total: $${response.totalAmount}`,
      );
>>>>>>> dev
    }
  }

  async getQuotationRequests(): Promise<QuotationRequest[]> {
    return this.quotationRequestRepository.find({
      relations: ['products', 'suppliers', 'responses', 'responses.supplier'],
      order: { sentAt: 'DESC' },
    });
  }

  async getQuotationRequestById(id: number): Promise<QuotationRequest> {
    const request = await this.quotationRequestRepository.findOne({
      where: { id },
      relations: ['products', 'suppliers', 'responses', 'responses.supplier'],
    });

    if (!request) {
      throw new NotFoundException(`Quotation request ${id} not found`);
    }

    return request;
  }

  async getQuotationResponses(requestId: number): Promise<QuotationResponse[]> {
    return this.quotationResponseRepository.find({
      where: { quotationRequestId: requestId },
      relations: ['supplier'],
      order: { totalAmount: 'ASC' },
    });
  }

  async selectWinner(
    requestId: number,
    responseId: number,
  ): Promise<QuotationResponse> {
    const request = await this.getQuotationRequestById(requestId);

    // Marcar todas las respuestas como no ganadoras
    await this.quotationResponseRepository.update(
      { quotationRequestId: requestId },
      { isWinner: false, status: QuotationResponseStatus.REJECTED },
    );

    // Marcar la respuesta seleccionada como ganadora
    const response = await this.quotationResponseRepository.findOne({
      where: { id: responseId, quotationRequestId: requestId },
      relations: ['supplier'],
    });

    if (!response) {
      throw new NotFoundException(`Quotation response ${responseId} not found`);
    }

    response.isWinner = true;
    response.status = QuotationResponseStatus.ACCEPTED;
    await this.quotationResponseRepository.save(response);

    // Actualizar estado de la solicitud
    request.status = QuotationRequestStatus.COMPLETED;
    await this.quotationRequestRepository.save(request);

    // Cancelar automáticamente otras cotizaciones pendientes con productos superpuestos
    await this.cancelOverlappingQuotations(request);

    return response;
  }

  /**
   * Cancela automáticamente todas las solicitudes de cotización PENDIENTES
   * que comparten al menos un producto con la solicitud aceptada.
   */
  private async cancelOverlappingQuotations(
    acceptedRequest: QuotationRequest,
  ): Promise<void> {
    const acceptedProductIds = acceptedRequest.products.map((p) => p.id);

    // Buscar todas las solicitudes PENDIENTES
    const pendingRequests = await this.quotationRequestRepository.find({
      where: { status: QuotationRequestStatus.PENDING },
      relations: ['products'],
    });

    // Filtrar solicitudes que comparten productos
    const overlappingRequests = pendingRequests.filter(
      (req) =>
        req.id !== acceptedRequest.id &&
        req.products.some((p) => acceptedProductIds.includes(p.id)),
    );

    // Cancelar solicitudes superpuestas
    for (const req of overlappingRequests) {
      req.status = QuotationRequestStatus.CANCELLED;
      await this.quotationRequestRepository.save(req);

      // console.log(
      //   `Cotización #${req.id} auto-cancelada por superposición de productos con cotización #${acceptedRequest.id}`,
      // );
    }

    // if (overlappingRequests.length > 0) {
    //   console.log(
    //     `Se cancelaron ${overlappingRequests.length} cotización(es) pendiente(s) con productos superpuestos`,
    //   );
    // }
  }

  async rejectQuotation(requestId: number): Promise<void> {
    const request = await this.getQuotationRequestById(requestId);
    request.status = QuotationRequestStatus.CANCELLED;
    await this.quotationRequestRepository.save(request);

    // Marcar todas las respuestas como rechazadas
    await this.quotationResponseRepository.update(
      { quotationRequestId: requestId },
      { status: QuotationResponseStatus.REJECTED },
    );
  }

  async markAsReceived(requestId: number): Promise<void> {
    const request = await this.getQuotationRequestById(requestId);

    if (request.status !== QuotationRequestStatus.COMPLETED) {
      throw new Error('Only completed quotations can be marked as received');
    }

    // Encontrar la respuesta ganadora
    const winningResponse = request.responses.find((r) => r.isWinner);
    if (!winningResponse) {
      throw new Error('No winning response found for this quotation');
    }

<<<<<<< HEAD
    // Extraer cantidades del campo notes si existen
    let customQuantities: Record<number, number> = {};
    if (request.notes) {
      const quantitiesMatch = request.notes.match(
        /\[QUANTITIES\](.+?)\[\/QUANTITIES\]/,
      );
      if (quantitiesMatch && quantitiesMatch[1]) {
        try {
          customQuantities = JSON.parse(quantitiesMatch[1]);
          // console.log(
          //   '📦 Cantidades personalizadas encontradas:',
          //   customQuantities,
          // );
        } catch {
          // console.warn('⚠️ Error parseando cantidades del notes:', error);
        }
      }
    }

    // Actualizar stock de cada producto según las cantidades
=======
    // Actualizar stock de cada producto según las cantidades cotizadas
>>>>>>> dev
    for (const quote of winningResponse.productQuotes) {
      const product = await this.productoRepository.findOne({
        where: { id: quote.productId },
      });

      if (product) {
<<<<<<< HEAD
        // Usar cantidad personalizada si existe, sino usar la de la cotización
        const quantityToAdd =
          customQuantities[quote.productId] || quote.quantity;
        product.stock_actual =
          Number(product.stock_actual) + Number(quantityToAdd);
=======
        product.stock_actual =
          Number(product.stock_actual) + Number(quote.quantity);
>>>>>>> dev
        await this.productoRepository.save(product);
      }
    }

    // Marcar la solicitud como finalizada (stock recibido)
    request.status = QuotationRequestStatus.FINISHED;
    await this.quotationRequestRepository.save(request);
  }
}
