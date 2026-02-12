import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { SystemConfigService } from './system-config.service';
import { UpdateQuotationThresholdsDto } from './dto/update-quotation-thresholds.dto';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../roles/role.decorator';
import { Role } from '../roles/role.enum';
import { RolesGuard } from '../roles/role.guard';
import { Auditar } from '../auditoria/decorators/auditar.decorator';
import {
  TipoAccion,
  TipoEntidad,
} from '../auditoria/entities/auditoria.entity';
import { empresaInfo } from './empresa.config';
import { TIPO_AUTO } from '../enums/tipo_auto.enum';

@Controller('config')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class SystemConfigController {
  constructor(private readonly systemConfigService: SystemConfigService) {}

  @Get('empresa')
  async getEmpresaInfo() {
    return empresaInfo;
  }

  @Get('vehicle-types')
  async getActiveVehicleTypes() {
    return this.systemConfigService.getActiveVehicleTypes();
  }

  @Get('vehicle-types/all')
  async getAllVehicleTypes() {
    return Object.values(TIPO_AUTO);
  }

  @Auditar({
    accion: TipoAccion.MODIFICAR,
    entidad: TipoEntidad.SISTEMA,
    descripcion: 'Actualización de tipos de vehículos activos',
    capturarDatosAnteriores: true,
  })
  @Put('vehicle-types')
  async updateActiveVehicleTypes(@Body('types') types: TIPO_AUTO[]) {
    return this.systemConfigService.updateActiveVehicleTypes(types);
  }

  @Get('quotation-thresholds')
  async getQuotationThresholds() {
    return this.systemConfigService.getQuotationThresholds();
  }

  @Auditar({
    accion: TipoAccion.MODIFICAR,
    entidad: TipoEntidad.SISTEMA,
    descripcion: 'Actualización de umbrales de cotización',
    capturarDatosAnteriores: true,
  })
  @Put('quotation-thresholds')
  async updateQuotationThresholds(@Body() dto: UpdateQuotationThresholdsDto) {
    return this.systemConfigService.updateQuotationThresholds(dto);
  }
}
