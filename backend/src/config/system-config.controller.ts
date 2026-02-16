import { Controller, Get, Put, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { SystemConfigService, VehicleTypeDefinition } from './system-config.service';
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
  @Roles(Role.ADMIN, Role.USER, Role.SUPPLIER)
  async getActiveVehicleTypes() {
    return this.systemConfigService.getActiveVehicleTypes();
  }

  @Get('vehicle-types/all')
  @Roles(Role.ADMIN, Role.USER, Role.SUPPLIER)
  async getAllVehicleTypes() {
    return this.systemConfigService.getAllVehicleTypes();
  }

  @Auditar({
    accion: TipoAccion.MODIFICAR,
    entidad: TipoEntidad.SISTEMA,
    descripcion: 'Actualización de tipos de vehículos activos',
    capturarDatosAnteriores: true,
  })
  @Put('vehicle-types')
  async updateActiveVehicleTypes(@Body('types') types: string[]) {
    return this.systemConfigService.updateActiveVehicleTypes(types);
  }

  @Auditar({
    accion: TipoAccion.CREAR,
    entidad: TipoEntidad.SISTEMA,
    descripcion: 'Creación de nuevo tipo de vehículo',
  })
  @Post('vehicle-types')
  async addVehicleType(@Body() definition: VehicleTypeDefinition) {
    return this.systemConfigService.addVehicleType(definition);
  }

  @Auditar({
    accion: TipoAccion.ELIMINAR,
    entidad: TipoEntidad.SISTEMA,
    descripcion: 'Eliminación de tipo de vehículo',
  })
  @Delete('vehicle-types/:key')
  async removeVehicleType(@Param('key') key: string) {
    return this.systemConfigService.removeVehicleType(key);
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
