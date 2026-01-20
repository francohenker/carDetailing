import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { QuotationService } from './quotation.service';
import { CreateQuotationRequestDto } from './dto/create-quotation-request.dto';
import { SelectWinnerDto } from './dto/select-winner.dto';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../roles/role.decorator';
import { Role } from '../roles/role.enum';
import { RolesGuard } from '../roles/role.guard';
import { Auditar } from '../auditoria/decorators/auditar.decorator';
import {
  TipoAccion,
  TipoEntidad,
} from '../auditoria/entities/auditoria.entity';

@Controller('quotation')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class QuotationController {
  constructor(private readonly quotationService: QuotationService) {}

  @Auditar({
    accion: TipoAccion.CREAR,
    entidad: TipoEntidad.COTIZACION,
    descripcion: 'Creación de solicitud de cotización',
  })
  @Post('requests')
  async createQuotationRequest(@Body() dto: CreateQuotationRequestDto) {
    const result = await this.quotationService.createQuotationRequest(dto);
    // Retornar datos enriquecidos para auditoría
    return {
      id: result.id,
      productIds: dto.productIds,
      products: result.products?.map((p) => ({ id: p.id, name: p.name })),
      supplierIds: dto.supplierIds,
      suppliers: result.suppliers?.map((s) => ({ id: s.id, name: s.name })),
      notes: dto.notes,
    };
  }

  @Get('requests')
  async getQuotationRequests() {
    return this.quotationService.getQuotationRequests();
  }

  @Get('requests/:id')
  async getQuotationRequestById(@Param('id', ParseIntPipe) id: number) {
    return this.quotationService.getQuotationRequestById(id);
  }

  @Get('requests/:id/responses')
  async getQuotationResponses(@Param('id', ParseIntPipe) id: number) {
    return this.quotationService.getQuotationResponses(id);
  }

  @Auditar({
    accion: TipoAccion.SELECCIONAR_GANADOR,
    entidad: TipoEntidad.COTIZACION,
    descripcion: 'Selección de proveedor ganador para cotización',
  })
  @Post('requests/:id/select-winner')
  async selectWinner(
    @Param('id', ParseIntPipe) requestId: number,
    @Body() dto: SelectWinnerDto,
  ) {
    const result = await this.quotationService.selectWinner(
      requestId,
      dto.responseId,
    );
    // Retornar datos enriquecidos para auditoría
    return {
      id: requestId,
      responseId: dto.responseId,
      supplierName: result.supplier?.name,
      totalAmount: result.totalAmount,
      deliveryDays: result.deliveryDays,
    };
  }

  @Auditar({
    accion: TipoAccion.RECHAZAR,
    entidad: TipoEntidad.COTIZACION,
    descripcion: 'Rechazo/cancelación de solicitud de cotización',
  })
  @Post('requests/:id/reject')
  async rejectQuotation(@Param('id', ParseIntPipe) requestId: number) {
    await this.quotationService.rejectQuotation(requestId);
    // Retornar datos enriquecidos para auditoría
    return {
      message: 'Quotation rejected successfully',
      id: requestId,
    };
  }

  @Auditar({
    accion: TipoAccion.MARCAR_RECIBIDO,
    entidad: TipoEntidad.COTIZACION,
    descripcion: 'Marcado de cotización como recibida y actualización de stock',
  })
  @Post('requests/:id/mark-received')
  async markAsReceived(@Param('id', ParseIntPipe) requestId: number) {
    const request =
      await this.quotationService.getQuotationRequestById(requestId);
    await this.quotationService.markAsReceived(requestId);

    // Retornar datos enriquecidos para auditoría
    const winningResponse = request.responses.find((r) => r.isWinner);
    return {
      message: 'Stock updated successfully',
      id: requestId,
      supplierName: winningResponse?.supplier?.name,
      productNames: request.products.map((p) => p.name),
      totalAmount: winningResponse?.totalAmount,
    };
  }
}
