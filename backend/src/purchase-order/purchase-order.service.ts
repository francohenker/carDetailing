import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import { Supplier } from '../supplier/entities/supplier.entity';
import { Producto } from '../producto/entities/producto.entity';
import { QuotationResponse } from '../quotation/entities/quotation-response.entity';
import { QuotationRequest } from '../quotation/entities/quotation-request.entity';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderStatusDto } from './dto/update-purchase-order-status.dto';
import { UpdatePurchaseOrderItemDto } from './dto/update-purchase-order-item.dto';
import { PurchaseOrderStatus } from '../enums/purchase-order-status.enum';
import { QuotationRequestStatus } from '../enums/quotation-status.enum';

@Injectable()
export class PurchaseOrderService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private purchaseOrderRepository: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem)
    private purchaseOrderItemRepository: Repository<PurchaseOrderItem>,
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,
    @InjectRepository(Producto)
    private productoRepository: Repository<Producto>,
    @InjectRepository(QuotationResponse)
    private quotationResponseRepository: Repository<QuotationResponse>,
    @InjectRepository(QuotationRequest)
    private quotationRequestRepository: Repository<QuotationRequest>,
  ) {}

  async create(
    createPurchaseOrderDto: CreatePurchaseOrderDto,
  ): Promise<PurchaseOrder> {
    // Verificar que el proveedor exista
    const supplier = await this.supplierRepository.findOne({
      where: { id: createPurchaseOrderDto.supplierId },
    });
    if (!supplier) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    // Verificar cotización si fue especificada
    let quotationResponse = null;
    if (createPurchaseOrderDto.quotationResponseId) {
      quotationResponse = await this.quotationResponseRepository.findOne({
        where: { id: createPurchaseOrderDto.quotationResponseId },
      });
      if (!quotationResponse) {
        throw new NotFoundException('Cotización no encontrada');
      }
    }

    // Validar que no haya productos duplicados
    const productoIds = createPurchaseOrderDto.items.map((item) => item.productoId);
    const uniqueIds = new Set(productoIds);
    if (uniqueIds.size !== productoIds.length) {
      throw new BadRequestException(
        'No se puede agregar el mismo producto más de una vez en una orden de compra',
      );
    }

    // Generar número de orden único
    const orderNumber = await this.generateOrderNumber();

    // Calcular total
    let totalAmount = 0;
    const items = [];

    for (const itemDto of createPurchaseOrderDto.items) {
      // Verificar que el producto exista
      const producto = await this.productoRepository.findOne({
        where: { id: itemDto.productoId },
      });
      if (!producto) {
        throw new NotFoundException(
          `Producto con ID ${itemDto.productoId} no encontrado`,
        );
      }

      const subtotal = itemDto.unitPrice * itemDto.quantityOrdered;
      totalAmount += subtotal;

      const item = this.purchaseOrderItemRepository.create({
        productoId: itemDto.productoId,
        unitPrice: itemDto.unitPrice,
        quantityOrdered: itemDto.quantityOrdered,
        quantityReceived: 0,
        subtotal,
        notes: itemDto.notes,
      });

      items.push(item);
    }

    // Crear orden de compra
    const purchaseOrder = this.purchaseOrderRepository.create({
      orderNumber,
      supplierId: createPurchaseOrderDto.supplierId,
      quotationResponseId: createPurchaseOrderDto.quotationResponseId,
      totalAmount,
      notes: createPurchaseOrderDto.notes,
      isAutomatic: createPurchaseOrderDto.isAutomatic || false,
      status: PurchaseOrderStatus.PENDING,
      items,
    });

    return await this.purchaseOrderRepository.save(purchaseOrder);
  }

  async findAll(): Promise<PurchaseOrder[]> {
    return await this.purchaseOrderRepository.find({
      relations: ['supplier', 'items', 'items.producto', 'quotationResponse', 'receivedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<PurchaseOrder> {
    const order = await this.purchaseOrderRepository.findOne({
      where: { id },
      relations: ['supplier', 'items', 'items.producto', 'quotationResponse', 'receivedBy'],
    });

    if (!order) {
      throw new NotFoundException('Orden de compra no encontrada');
    }

    return order;
  }

  async updateStatus(
    id: number,
    updateStatusDto: UpdatePurchaseOrderStatusDto,
  ): Promise<PurchaseOrder> {
    const order = await this.findOne(id);

    order.status = updateStatusDto.status;

    // Guardar quién recibió la orden
    if (updateStatusDto.receivedById) {
      order.receivedById = updateStatusDto.receivedById;
    }

    // Si se marca como recibida, establecer la fecha
    if (
      updateStatusDto.status === PurchaseOrderStatus.RECEIVED &&
      !order.receivedAt
    ) {
      order.receivedAt = updateStatusDto.receivedAt || new Date();

      // Actualizar stock de productos
      for (const item of order.items) {
        const producto = await this.productoRepository.findOne({
          where: { id: item.productoId },
        });
        if (producto) {
          producto.stock_actual =
            Number(producto.stock_actual) + item.quantityOrdered;
          await this.productoRepository.save(producto);

          // Actualizar cantidad recibida del item
          item.quantityReceived = item.quantityOrdered;
          await this.purchaseOrderItemRepository.save(item);
        }
      }

      // Si la orden está vinculada a una cotización, marcar la cotización como finalizada
      if (order.quotationResponseId) {
        try {
          const quotationResponse = await this.quotationResponseRepository.findOne({
            where: { id: order.quotationResponseId },
            relations: ['quotationRequest'],
          });

          if (quotationResponse && quotationResponse.quotationRequest) {
            const quotationRequest = quotationResponse.quotationRequest;
            
            // Solo marcar como finalizada si está en estado COMPLETED
            if (quotationRequest.status === QuotationRequestStatus.COMPLETED) {
              quotationRequest.status = QuotationRequestStatus.FINISHED;
              await this.quotationRequestRepository.save(quotationRequest);
            }
          }
        } catch (error) {
          console.error('Error al actualizar cotización relacionada:', error);
          // No lanzamos el error para no interrumpir el flujo
        }
      }
    }

    return await this.purchaseOrderRepository.save(order);
  }

  async updateItem(
    orderId: number,
    itemId: number,
    updateItemDto: UpdatePurchaseOrderItemDto,
  ): Promise<PurchaseOrderItem> {
    const order = await this.findOne(orderId);
    const item = order.items.find((i) => i.id === itemId);

    if (!item) {
      throw new NotFoundException('Item de orden no encontrado');
    }

    if (updateItemDto.quantityReceived !== undefined) {
      if (updateItemDto.quantityReceived > item.quantityOrdered) {
        throw new BadRequestException(
          'La cantidad recibida no puede ser mayor a la cantidad ordenada',
        );
      }

      const previousQuantityReceived = item.quantityReceived;
      item.quantityReceived = updateItemDto.quantityReceived;

      // Actualizar stock del producto
      const producto = await this.productoRepository.findOne({
        where: { id: item.productoId },
      });
      if (producto) {
        const quantityDiff =
          updateItemDto.quantityReceived - previousQuantityReceived;
        producto.stock_actual = Number(producto.stock_actual) + quantityDiff;
        await this.productoRepository.save(producto);
      }

      // Guardar el item ANTES de recalcular el estado de la orden
      if (updateItemDto.notes !== undefined) {
        item.notes = updateItemDto.notes;
      }
      await this.purchaseOrderItemRepository.save(item);

      // Actualizar estado de la orden si es necesario
      await this.updateOrderStatusBasedOnItems(orderId, updateItemDto.receivedById);

      return item;
    }

    if (updateItemDto.notes !== undefined) {
      item.notes = updateItemDto.notes;
    }

    return await this.purchaseOrderItemRepository.save(item);
  }

  async delete(id: number): Promise<void> {
    const order = await this.findOne(id);

    if (
      order.status === PurchaseOrderStatus.RECEIVED ||
      order.status === PurchaseOrderStatus.PARTIAL
    ) {
      throw new BadRequestException(
        'No se puede eliminar una orden que ya ha sido recibida o parcialmente recibida',
      );
    }

    await this.purchaseOrderRepository.remove(order);
  }

  async createFromQuotationResponse(
    quotationResponseId: number,
    receivedAt?: Date,
  ): Promise<PurchaseOrder> {
    const quotationResponse = await this.quotationResponseRepository.findOne({
      where: { id: quotationResponseId },
      relations: ['supplier'],
    });

    if (!quotationResponse) {
      throw new NotFoundException('Cotización no encontrada');
    }

    const items = quotationResponse.productQuotes.map((quote) => ({
      productoId: quote.productId,
      unitPrice: quote.unitPrice,
      quantityOrdered: quote.quantity,
      notes: `Disponibilidad: ${quote.availability}`,
    }));

    const createDto: CreatePurchaseOrderDto = {
      supplierId: quotationResponse.supplierId,
      quotationResponseId: quotationResponse.id,
      items,
      notes: `Orden generada automáticamente desde cotización. ${quotationResponse.notes || ''}`,
      isAutomatic: true,
    };

    const order = await this.create(createDto);

    // Si se proporciona fecha de recepción, marcar como recibida
    if (receivedAt) {
      await this.updateStatus(order.id, {
        status: PurchaseOrderStatus.RECEIVED,
        receivedAt,
      });
    }

    return order;
  }

  private async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const lastOrder = await this.purchaseOrderRepository.findOne({
      where: {},
      order: { id: 'DESC' },
    });

    let sequence = 1;
    if (lastOrder) {
      const lastNumber = parseInt(lastOrder.orderNumber.split('-')[1]);
      sequence = lastNumber + 1;
    }

    return `OC-${year}-${sequence.toString().padStart(5, '0')}`;
  }

  private async updateOrderStatusBasedOnItems(orderId: number, receivedById?: number): Promise<void> {
    const order = await this.findOne(orderId);

    const totalOrdered = order.items.reduce(
      (sum, item) => sum + item.quantityOrdered,
      0,
    );
    const totalReceived = order.items.reduce(
      (sum, item) => sum + item.quantityReceived,
      0,
    );

    if (totalReceived === 0) {
      order.status = PurchaseOrderStatus.PENDING;
    } else if (totalReceived < totalOrdered) {
      order.status = PurchaseOrderStatus.PARTIAL;
      // Guardar quién hizo la recepción parcial
      if (receivedById && !order.receivedById) {
        order.receivedById = receivedById;
      }
    } else {
      order.status = PurchaseOrderStatus.RECEIVED;
      if (!order.receivedAt) {
        order.receivedAt = new Date();
      }
      if (receivedById) {
        order.receivedById = receivedById;
      }

      // Finalizar cotización vinculada si corresponde
      if (order.quotationResponseId) {
        try {
          const quotationResponse = await this.quotationResponseRepository.findOne({
            where: { id: order.quotationResponseId },
            relations: ['quotationRequest'],
          });

          if (quotationResponse && quotationResponse.quotationRequest) {
            const quotationRequest = quotationResponse.quotationRequest;
            if (quotationRequest.status === QuotationRequestStatus.COMPLETED) {
              quotationRequest.status = QuotationRequestStatus.FINISHED;
              await this.quotationRequestRepository.save(quotationRequest);
            }
          }
        } catch (error) {
          console.error('Error al actualizar cotización relacionada:', error);
        }
      }
    }

    await this.purchaseOrderRepository.save(order);
  }
}
