import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Turno } from './entities/turno.entity';
import { Repository } from 'typeorm';
import { CreateTurnoDto } from './dto/create.turno.dto';
import { Car } from 'src/car/entities/car.entity';
import { ServicioService } from 'src/servicio/servicio.service';
import { ModifyTurnoDto } from './dto/modify.turno.dto';

@Injectable()
export class TurnoService {
    constructor(
        @InjectRepository(Turno)
        private readonly turnoRepository: Repository<Turno>,
        private servicioService: ServicioService, // Assuming you have a ServicioService to handle services
    ) {}

    
    async createTurno(car: Car, turnoView: CreateTurnoDto): Promise<Turno> {
        const servicios = await this.servicioService.findByIds(turnoView.servicios);
        const newTurno = new Turno(car, turnoView.estado, turnoView.observacion, servicios);
        const turno = this.turnoRepository.create(newTurno);
        return this.turnoRepository.save(turno);
    }

    //implementar todavia, VERIFICAR!!!!!!!!!!
    async modifyTurno(turno: ModifyTurnoDto): Promise<Turno> {
        const existingTurno = await this.turnoRepository.findOneBy({ id: turno.id });
        if (!existingTurno) {
            throw new HttpException('Turno not found', 404);
        }

        existingTurno.fechaHora = turno.fechaHora;
        existingTurno.estado = turno.estado;
        existingTurno.observacion = turno.observacion;

        const servicios = await this.servicioService.findByIds(turno.servicios);
        existingTurno.servicio = servicios;

        return this.turnoRepository.save(existingTurno);
    }


    async deleteTurno(turnoId: number): Promise<void> {
        const turno = await this.turnoRepository.findOneBy({ id: turnoId });
        if (turno) {
            await this.turnoRepository.remove(turno);
        }else {
            throw new HttpException('Turno not found', 404);
        }
    }



}
