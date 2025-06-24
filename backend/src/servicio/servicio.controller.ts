import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ServicioService } from './servicio.service';
import { UserService } from 'src/users/user.service';
import { CreateServicioDto } from './dto/create.servicio.dto';
import { ModifyServicioDto } from './dto/modify.servicio.dto';
import { Servicio } from './entities/servicio.entity';
import { Role } from 'src/roles/role.enum';
import { Roles } from 'src/roles/role.decorator';
import { RolesGuard } from 'src/roles/role.guard';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('servicio')
export class ServicioController {
  constructor(
    private servicioService: ServicioService,
    private userService: UserService,
  ) {}

  getUserFromRequest(@Req() request): any {
    return this.userService.findUserByToken(request.headers.authorization);
  }

  @Post('create')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async createServicio(
    @Body() servicio: CreateServicioDto,
  ): Promise<Servicio | null> {
    return this.servicioService.create(servicio);
  }

  @Post('modify')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async modifyServicio(
    @Body() servicio: ModifyServicioDto,
  ): Promise<Servicio | null> {
    return this.servicioService.modify(servicio);
  }
  @Post('delete')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async deleteServicio(@Body() body): Promise<any> {
    return this.servicioService.delete(body.id);
  }
}
