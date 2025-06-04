import { Injectable, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Turno } from './entities/turno.entity';
import { Repository } from 'typeorm';
import { Users } from 'src/users/entities/users.entity';
import { CreateTurnoDto } from './dto/create.turno.dto';
import { Car } from 'src/car/entities/car.entity';

@Injectable()
export class TurnoService {
    constructor(
        @InjectRepository(Turno)
        private readonly turnoRepository: Repository<Turno>,
    ) {}

    @Post('create')
    async createTurno(car: Car, turno: CreateTurnoDto): Promise<Turno> {
        const newTurno = this.turnoRepository.create(turno);
        newTurno.car = car;
        return this.turnoRepository.save(newTurno);
    }

}
