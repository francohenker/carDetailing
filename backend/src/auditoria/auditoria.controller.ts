import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { AuditoriaService } from './auditoria.service';
import { FilterAuditoriaDto } from './dto/filter-auditoria.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../roles/role.guard';
import { Roles } from '../roles/role.decorator';
import { Role } from '../roles/role.enum';

@Controller('auditoria')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  @Get()
  async obtenerTodos(@Query() filtros: FilterAuditoriaDto) {
    return await this.auditoriaService.obtenerTodos(filtros);
  }

  @Get('estadisticas')
  async obtenerEstadisticas() {
    return await this.auditoriaService.obtenerEstadisticas();
  }

  @Get(':id')
  async obtenerPorId(@Param('id') id: number) {
    return await this.auditoriaService.obtenerPorId(id);
  }
}
