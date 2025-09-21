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
import { Car } from 'src/car/entities/car.entity';
import { CarService } from 'src/car/car.service';
import { HttpErrorByCode } from '@nestjs/common/utils/http-error-by-code.util';
import { ModifyTurnoDto } from './dto/modify.turno.dto';
import { TurnoOwnerGuard } from 'src/auth/turno.owner.guard';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/roles/role.guard';

@Controller('turno')
export class TurnoController {
  constructor(
    private carService: CarService,
    private turnoService: TurnoService,
  ) {}

  @Post('create')
  async createTurno(@Req() request,@Body() createTurnoDto: CreateTurnoDto,): Promise<Turno> {
    const car = await this.carService.findById(createTurnoDto.carId);
    return this.turnoService.createTurno(car, createTurnoDto);
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
  @Get(':id')
  async findTurnoById(@Req() request): Promise<Turno> {
    const turnoId = parseInt(request.params.id, 10);
    if (isNaN(turnoId)) {
      throw new HttpException('Invalid turno ID', 400);
    }
    const turno = await this.turnoService.findById(turnoId);
    if (!turno) {
      throw new HttpException('Turno not found', 404);
    }
    return turno;
  }

  @Get('get-date')
  async getTurnosByDate(@Req() request): Promise<any> {
    // const date = request.query.date;
    // if (!date) {
    //   throw new HttpException('Date query parameter is required', 400);
    // }
    return this.turnoService.findDate();
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
