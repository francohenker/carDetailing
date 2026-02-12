import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { QuotationService, SupplierRespondDto } from './quotation.service';
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
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from '../supplier/entities/supplier.entity';

@Controller('quotation')
@UseGuards(AuthGuard, RolesGuard)
export class QuotationController {
  constructor(
    private readonly quotationService: QuotationService,
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
  ) {}

  // ============ SUPPLIER ENDPOINTS ============

  @Roles(Role.SUPPLIER)
  @Get('supplier/pending')
  async getSupplierPendingQuotations(@Req() request) {
    const supplier = await this.supplierRepository.findOne({
      where: { userId: request.user.userId },
    });
    if (!supplier) {
      throw new Error('Proveedor no encontrado para este usuario');
    }
    return this.quotationService.getPendingForSupplier(supplier.id);
  }

  @Roles(Role.SUPPLIER)
  @Post('supplier/respond/:requestId')
  async supplierRespondToQuotation(
    @Req() request,
    @Param('requestId', ParseIntPipe) requestId: number,
    @Body() dto: SupplierRespondDto,
  ) {
    const supplier = await this.supplierRepository.findOne({
      where: { userId: request.user.userId },
    });
    if (!supplier) {
      throw new Error('Proveedor no encontrado para este usuario');
    }
    return this.quotationService.supplierRespond(requestId, supplier.id, dto);
  }

  @Roles(Role.SUPPLIER)
  @Get('supplier/history')
  async getSupplierQuotationHistory(@Req() request) {
    const supplier = await this.supplierRepository.findOne({
      where: { userId: request.user.userId },
    });
    if (!supplier) {
      throw new Error('Proveedor no encontrado para este usuario');
    }
    return this.quotationService.getSupplierHistory(supplier.id);
  }

  // ============ ADMIN ENDPOINTS ============

  @Roles(Role.ADMIN)
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

  @Roles(Role.ADMIN)
  // @Auditar({
  //   accion: TipoAccion.CONSULTAR,
  //   entidad: TipoEntidad.COTIZACION,
  //   descripcion: 'Consulta de solicitudes de cotización',
  // })
  @Get('requests')
  async getQuotationRequests() {
    return this.quotationService.getQuotationRequests();
  }

  @Roles(Role.ADMIN)
  @Get('requests/:id')
  async getQuotationRequestById(@Param('id', ParseIntPipe) id: number) {
    return this.quotationService.getQuotationRequestById(id);
  }

  @Roles(Role.ADMIN)
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
