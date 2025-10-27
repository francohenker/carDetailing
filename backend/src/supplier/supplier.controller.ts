import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
} from '@nestjs/common';
import { SupplierService } from './supplier.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';
import { Supplier } from './entities/supplier.entity';
import { RolesGuard } from '../roles/role.guard';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../roles/role.decorator';
import { Role } from '../roles/role.enum';
import {
  TipoAccion,
  TipoEntidad,
} from '../auditoria/entities/auditoria.entity';
import { Auditar } from '../auditoria/decorators/auditar.decorator';

@Controller('supplier')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Auditar({
    accion: TipoAccion.CREAR,
    entidad: TipoEntidad.PROVEEDOR,
    descripcion: 'Creación de nuevo proveedor',
  })
  @Post('create')
  async create(
    @Body() createSupplierDto: CreateSupplierDto,
  ): Promise<Supplier> {
    return await this.supplierService.create(createSupplierDto);
  }

  @Get('getAll')
  async findAll(): Promise<Supplier[]> {
    return await this.supplierService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Supplier> {
    return await this.supplierService.findOne(id);
  }

  @Auditar({
    accion: TipoAccion.MODIFICAR,
    entidad: TipoEntidad.PROVEEDOR,
    descripcion: 'Actualización de proveedor',
  })
  @Put('update/:id')
  async update(
    @Param('id') id: number,
    @Body() updateSupplierDto: UpdateSupplierDto,
  ): Promise<Supplier> {
    return await this.supplierService.update(id, updateSupplierDto);
  }

  @Auditar({
    accion: TipoAccion.ELIMINAR,
    entidad: TipoEntidad.PROVEEDOR,
    descripcion: 'Eliminación de proveedor',
  })
  @Delete('delete/:id')
  async remove(@Param('id') id: number): Promise<{ message: string }> {
    await this.supplierService.remove(id);
    return { message: 'Supplier deleted successfully' };
  }

  @Auditar({
    accion: TipoAccion.ACTIVAR_DESACTIVAR,
    entidad: TipoEntidad.PROVEEDOR,
    descripcion: 'Activación/Desactivación de proveedor',
  })
  @Post('toggle-active/:id')
  async toggleActive(@Param('id') id: number): Promise<Supplier> {
    return await this.supplierService.toggleActive(id);
  }
}
