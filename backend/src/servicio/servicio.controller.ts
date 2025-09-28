import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ServicioService } from './servicio.service';
import { UserService } from 'src/users/users.service';
import { CreateServicioDto } from './dto/create.servicio.dto';
import { UpdateServicioDto } from './dto/update.servicio.dto';
import { Servicio } from './entities/servicio.entity';
import { Role } from 'src/roles/role.enum';
import { Roles } from 'src/roles/role.decorator';
import { RolesGuard } from 'src/roles/role.guard';
import { AuthGuard } from 'src/auth/auth.guard';
import { AuthService } from 'src/auth/auth.service';

@Controller('services')
export class ServicioController {
  constructor(
    private servicioService: ServicioService,
    private authService: AuthService,
  ) {}

  getUserFromRequest(@Req() request): any {
    return this.authService.findUserByToken(request.headers.authorization);
  }

  @Post('create')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async createServicio(
    @Body() servicio: CreateServicioDto,
  ): Promise<Servicio | null> {
    return this.servicioService.create(servicio);
  }

  @Put('update/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updateServicio(
    @Body() servicio: UpdateServicioDto,
    @Param('id') id: number,
  ): Promise<Servicio | null> {
    return this.servicioService.update(servicio, id);
  }
  
  @Delete('delete/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async deleteServicio(@Body() body, @Param('id') id: number): Promise<any> {
    return this.servicioService.delete(id);
  }

  @Get('getAll')
  async getAllServicios(): Promise<Servicio[]> {
    return this.servicioService.getAll();
  }

}
