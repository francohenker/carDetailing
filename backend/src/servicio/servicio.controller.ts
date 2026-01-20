import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ServicioService } from './servicio.service';
import { CreateServicioDto } from './dto/create.servicio.dto';
import { UpdateServicioDto } from './dto/update.servicio.dto';
import { Servicio } from './entities/servicio.entity';
import { Role } from '../roles/role.enum';
import { Roles } from '../roles/role.decorator';
import { RolesGuard } from '../roles/role.guard';
import { AuthGuard } from '../auth/auth.guard';
import { AuthService } from '../auth/auth.service';
import { Auditar } from '../auditoria/decorators/auditar.decorator';
import {
  TipoAccion,
  TipoEntidad,
} from '../auditoria/entities/auditoria.entity';

@Controller('services')
export class ServicioController {
  constructor(
    private servicioService: ServicioService,
    private authService: AuthService,
  ) {}

  getUserFromRequest(@Req() request): any {
    return this.authService.findUserByToken(request.headers.authorization);
  }

  @Auditar({
    accion: TipoAccion.CREAR,
    entidad: TipoEntidad.SERVICIO,
    descripcion: 'Creación de nuevo servicio',
  })
  @Post('create')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async createServicio(
    @Body() servicio: CreateServicioDto,
  ): Promise<Servicio | null> {
    return this.servicioService.create(servicio);
  }

  @Auditar({
    accion: TipoAccion.MODIFICAR,
    entidad: TipoEntidad.SERVICIO,
    descripcion: 'Actualización de servicio',
    capturarDatosAnteriores: true,
  })
  @Put('update/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updateServicio(
    @Body() servicio: UpdateServicioDto,
    @Param('id') id: number,
  ): Promise<Servicio | null> {
    return this.servicioService.update(servicio, id);
  }

  @Auditar({
    accion: TipoAccion.ELIMINAR,
    entidad: TipoEntidad.SERVICIO,
    descripcion: 'Eliminación de servicio',
  })
  @Delete('delete/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async deleteServicio(@Body() body, @Param('id') id: number): Promise<any> {
    // Obtener datos del servicio antes de eliminarlo
    const servicios = await this.servicioService.getAll();
    const servicio = servicios.find((s) => s.id === Number(id));

    await this.servicioService.delete(id);

    // Retornar información del servicio eliminado
    return {
      id: id,
      name: servicio?.name,
      description: servicio?.description,
      message: 'Servicio eliminado correctamente',
    };
  }

  @Get('getAll')
  async getAllServicios(
    @Query('includeDeleted') includeDeleted?: string,
  ): Promise<Servicio[]> {
    const shouldIncludeDeleted = includeDeleted === 'true';
    return this.servicioService.getAll(shouldIncludeDeleted);
  }

  @Auditar({
    accion: TipoAccion.MODIFICAR,
    entidad: TipoEntidad.SERVICIO,
    descripcion: 'Restauración de servicio eliminado',
  })
  @Patch(':id/restore')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async restoreServicio(@Param('id') id: number): Promise<any> {
    const servicio = await this.servicioService.restore(id);
    return {
      id: servicio.id,
      name: servicio.name,
      description: servicio.description,
      message: 'Servicio restaurado correctamente',
    };
  }
}
