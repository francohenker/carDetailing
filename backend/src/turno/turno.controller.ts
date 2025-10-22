import {
  Body,
  Controller,
  Get,
  HttpException,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TurnoService } from './turno.service';
import { Turno } from './entities/turno.entity';
import { CreateTurnoDto } from './dto/create.turno.dto';
import { CarService } from '../car/car.service';
import { ModifyTurnoDto } from './dto/modify.turno.dto';
import { TurnoOwnerGuard } from '../auth/turno.owner.guard';
import { AuthService } from '../auth/auth.service';
import { RolesGuard } from '../roles/role.guard';
import { Roles } from '../roles/role.decorator';
import { Role } from '../roles/role.enum';
import { Auditar } from '../auditoria/decorators/auditar.decorator';
import {
  TipoAccion,
  TipoEntidad,
} from '../auditoria/entities/auditoria.entity';

@Controller('turno')
export class TurnoController {
  constructor(
    private carService: CarService,
    private turnoService: TurnoService,
    private authService: AuthService,
  ) {}

  @Post('create')
  @Auditar({
    accion: TipoAccion.CREAR,
    entidad: TipoEntidad.TURNO,
    descripcion: 'Creación de nuevo turno',
  })
  async createTurno(
    @Req() request,
    @Body() createTurnoDto: CreateTurnoDto,
  ): Promise<Turno> {
    try {
      const user = await this.authService.findUserByToken(
        request.headers.authorization,
      );
      const car = await this.carService.findById(createTurnoDto.carId);
      if (car.user.id !== user.id) {
        throw new HttpException('Car does not belong to the user', 403);
      }
      if (!car) {
        throw new HttpException('Car not found', 404);
      }
      return this.turnoService.createTurno(car, createTurnoDto);
    } catch {
      throw new HttpException('User unauthorized', 401);
    }
  }

  @UseGuards(TurnoOwnerGuard)
  @Post('modify')
  async modifyTurno(
    @Req() request,
    @Body() modifyTurnoDto: ModifyTurnoDto,
  ): Promise<Turno> {
    return this.turnoService.modifyTurno(modifyTurnoDto);
  }

  //use in tests only for now
  // @Get(':id')
  // async findTurnoById(@Req() request): Promise<Turno> {
  //   const turnoId = parseInt(request.params.id, 10);
  //   if (isNaN(turnoId)) {
  //     throw new HttpException('Invalid turno ID', 400);
  //   }
  //   const turno = await this.turnoService.findById(turnoId);
  //   if (!turno) {
  //     throw new HttpException('Turno not found', 404);
  //   }
  //   return turno;
  // }

  @Get('/history')
  async getUserTurnos(@Req() request): Promise<Turno[]> {
    const user = await this.authService.findUserByToken(
      request.headers.authorization,
    );
    return this.turnoService.findByUser(user);
  }

  @Get('get-date')
  async getTurnosByDate(): Promise<any> {
    // const date = request.query.date;
    // if (!date) {
    //   throw new HttpException('Date query parameter is required', 400);
    // }
    return this.turnoService.findDate();
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/getAll')
  async getAllTurnos(): Promise<Turno[]> {
    return this.turnoService.findAll();
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post('admin/mark-completed/:id')
  @Auditar({
    accion: TipoAccion.MARCAR_COMPLETADO,
    entidad: TipoEntidad.TURNO,
    descripcion: 'Turno marcado como completado por administrador',
  })
  async markTurnoAsCompleted(@Req() request): Promise<Turno> {
    const turnoId = parseInt(request.params.id, 10);
    if (isNaN(turnoId)) {
      throw new HttpException('Invalid turno ID', 400);
    }
    return this.turnoService.markAsCompleted(turnoId);
  }

  @UseGuards(TurnoOwnerGuard)
  @Post('cancel/:id')
  @Auditar({
    accion: TipoAccion.CANCELAR,
    entidad: TipoEntidad.TURNO,
    descripcion: 'Turno cancelado por el usuario',
  })
  async cancelTurno(@Req() request): Promise<Turno> {
    const turnoId = parseInt(request.params.id, 10);
    if (isNaN(turnoId)) {
      throw new HttpException('Invalid turno ID', 400);
    }
    return this.turnoService.cancelTurno(turnoId);
  }

  // @Post('delete')
  // async deleteTurno(@Req() request): Promise<void> {
  //     return this.turnoService.deleteTurno(user);
  // }

  // @Post('list')
  // async listTurnos(@Req() request): Promise<Turno[]> {
  //     return this.turnoService.listTurnos(user);
  // }
}
