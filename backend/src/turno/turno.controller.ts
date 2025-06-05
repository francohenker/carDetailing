import { Body, Controller, HttpException, Post, Req } from '@nestjs/common';
import { TurnoService } from './turno.service';
import { Turno } from './entities/turno.entity';
import { CreateTurnoDto } from './dto/create.turno.dto';
import { Car } from 'src/car/entities/car.entity';
import { CarService } from 'src/car/car.service';
import { HttpErrorByCode } from '@nestjs/common/utils/http-error-by-code.util';
import { ModifyTurnoDto } from './dto/modify.turno.dto';

@Controller('turno')
export class TurnoController {
    constructor(
        // private userService: UserService,
        private carService: CarService,
        private turnoService: TurnoService,
    ) { }

    //use only for extracting user from request
    // private getUserFromRequest(@Req() request): any {
    //     return this.userService.findUserByToken(request.headers.authorization);
    // }

    @Post('create')
    async createTurno(@Req() request, @Body() createTurnoDto: CreateTurnoDto): Promise<any> {
        const car = await this.carService.findById(createTurnoDto.carId);
        return this.turnoService.createTurno(car, createTurnoDto);
    }

    @Post('modify')
    async modifyTurno(@Req() request, @Body() modifyTurnoDto: ModifyTurnoDto): Promise<string> {
        return this.turnoService.modifyTurno(modifyTurnoDto);
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
