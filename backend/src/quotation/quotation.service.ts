import { Injectable, NotFoundException, Inject, forwardRef, BadRequestException } from '@nestjs/common';
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
import { PurchaseOrderService } from '../purchase-order/purchase-order.service';

export interface SupplierRespondDto {
  productQuotes: Array<{
    productId: number;
    unitPrice: number;
    quantity: number;
    availability: string;
  }>;
  deliveryDays: number;
  paymentTerms: string;
  notes?: string;
}

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
    @Inject(forwardRef(() => PurchaseOrderService))
    private purchaseOrderService: PurchaseOrderService,
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
      isAutomatic: dto.isAutomatic || false,
    });

    const savedRequest =
      await this.quotationRequestRepository.save(quotationRequest);

    return savedRequest;
  }

  /**
   * Proveedor responde a una solicitud de cotización
   */
  async supplierRespond(
    requestId: number,
    supplierId: number,
    dto: SupplierRespondDto,
  ): Promise<QuotationResponse> {
    const request = await this.quotationRequestRepository.findOne({
      where: { id: requestId },
      relations: ['products', 'suppliers'],
    });

    if (!request) {
      throw new NotFoundException(`Solicitud de cotización ${requestId} no encontrada`);
    }

    if (request.status !== QuotationRequestStatus.PENDING) {
      throw new BadRequestException('Esta solicitud de cotización ya no está pendiente');
    }

    // Verificar que el proveedor está incluido en la solicitud
    const isSupplierIncluded = request.suppliers.some((s) => s.id === supplierId);
    if (!isSupplierIncluded) {
      throw new BadRequestException('No está autorizado a responder esta solicitud');
    }

    // Verificar que no haya respondido ya
    const existingResponse = await this.quotationResponseRepository.findOne({
      where: { quotationRequestId: requestId, supplierId },
    });
    if (existingResponse) {
      throw new BadRequestException('Ya ha enviado una respuesta para esta solicitud');
    }

    // Enriquecer productQuotes con nombres
    const productQuotes = await Promise.all(
      dto.productQuotes.map(async (quote) => {
        const product = await this.productoRepository.findOne({ where: { id: quote.productId } });
        return {
          ...quote,
          productName: product?.name || 'Producto desconocido',
        };
      }),
    );

    const totalAmount = productQuotes.reduce(
      (sum, quote) => sum + quote.unitPrice * quote.quantity,
      0,
    );

    const response = this.quotationResponseRepository.create({
      quotationRequestId: requestId,
      supplierId,
      productQuotes,
      totalAmount: Math.round(totalAmount * 100) / 100,
      deliveryDays: dto.deliveryDays,
      paymentTerms: dto.paymentTerms,
      notes: dto.notes,
      status: QuotationResponseStatus.PENDING,
      isWinner: false,
    });

    return await this.quotationResponseRepository.save(response);
  }

  /**
   * Obtener solicitudes pendientes para un proveedor específico
   */
  async getPendingForSupplier(supplierId: number): Promise<QuotationRequest[]> {
    const requests = await this.quotationRequestRepository
      .createQueryBuilder('request')
      .innerJoin('request.suppliers', 'supplier')
      .leftJoinAndSelect('request.products', 'product')
      .leftJoinAndSelect('request.suppliers', 'allSuppliers')
      .leftJoinAndSelect('request.responses', 'response')
      .where('supplier.id = :supplierId', { supplierId })
      .andWhere('request.status = :status', { status: QuotationRequestStatus.PENDING })
      .orderBy('request.sentAt', 'DESC')
      .getMany();

    // Filtrar para excluir las que ya respondió
    const responded = await this.quotationResponseRepository.find({
      where: { supplierId },
      select: ['quotationRequestId'],
    });
    const respondedIds = new Set(responded.map((r) => r.quotationRequestId));

    return requests.filter((r) => !respondedIds.has(r.id));
  }

  /**
   * Obtener historial de cotizaciones respondidas por un proveedor
   */
  async getSupplierHistory(supplierId: number): Promise<QuotationResponse[]> {
    return this.quotationResponseRepository.find({
      where: { supplierId },
      relations: ['quotationRequest', 'quotationRequest.products'],
      order: { receivedAt: 'DESC' },
    });
  }

  /**
   * Verifica si ya existe una cotización pendiente que incluye alguno de los productos especificados
   * @param productIds IDs de los productos a verificar
   * @returns true si existe una cotización pendiente, false en caso contrario
   */
  async hasPendingQuotationForProducts(productIds: number[]): Promise<boolean> {
    const pendingQuotation = await this.quotationRequestRepository
      .createQueryBuilder('quotation')
      .innerJoin('quotation.products', 'product')
      .where('quotation.status = :status', {
        status: QuotationRequestStatus.PENDING,
      })
      .andWhere('product.id IN (:...productIds)', { productIds })
      .getOne();

    return !!pendingQuotation;
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

    // Crear orden de compra automáticamente
    try {
      await this.purchaseOrderService.createFromQuotationResponse(responseId);
    } catch (error) {
      console.error('Error al crear orden de compra automática:', error);
    }

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

    // Ya no actualizamos el stock aquí, eso se hace en la orden de compra
    // Buscar la orden de compra asociada y marcarla como recibida
    try {
      const purchaseOrders = await this.purchaseOrderService.findAll();
      const relatedOrder = purchaseOrders.find(
        (order) => order.quotationResponseId === winningResponse.id,
      );

      if (relatedOrder) {
        await this.purchaseOrderService.updateStatus(relatedOrder.id, {
          status: 'RECIBIDA' as any,
          receivedAt: new Date(),
        });
      }
    } catch (error) {
      console.error('Error al actualizar orden de compra:', error);
    }

    // Marcar la solicitud como finalizada (stock recibido)
    request.status = QuotationRequestStatus.FINISHED;
    await this.quotationRequestRepository.save(request);
  }
}
