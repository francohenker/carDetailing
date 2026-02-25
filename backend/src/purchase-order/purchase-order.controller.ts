import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { PurchaseOrderService } from './purchase-order.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderStatusDto } from './dto/update-purchase-order-status.dto';
import { UpdatePurchaseOrderItemDto } from './dto/update-purchase-order-item.dto';
import { RolesGuard } from '../roles/role.guard';
import { Roles } from '../roles/role.decorator';
import { Role } from '../roles/role.enum';

@Controller('purchase-orders')
export class PurchaseOrderController {
  constructor(private readonly purchaseOrderService: PurchaseOrderService) {}

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  create(@Body() createPurchaseOrderDto: CreatePurchaseOrderDto) {
    return this.purchaseOrderService.create(createPurchaseOrderDto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.TRABAJADOR)
  @Get()
  findAll() {
    return this.purchaseOrderService.findAll();
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.TRABAJADOR)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.purchaseOrderService.findOne(id);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.TRABAJADOR)
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdatePurchaseOrderStatusDto,
  ) {
    return this.purchaseOrderService.updateStatus(id, updateStatusDto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.TRABAJADOR)
  @Patch(':orderId/items/:itemId')
  updateItem(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() updateItemDto: UpdatePurchaseOrderItemDto,
  ) {
    return this.purchaseOrderService.updateItem(orderId, itemId, updateItemDto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.purchaseOrderService.delete(id);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post('from-quotation/:quotationResponseId')
  createFromQuotation(
    @Param('quotationResponseId', ParseIntPipe) quotationResponseId: number,
  ) {
    return this.purchaseOrderService.createFromQuotationResponse(
      quotationResponseId,
    );
  }
}
