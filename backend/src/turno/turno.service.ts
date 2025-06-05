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

    
    async createTurno(car: Car, turnoView: CreateTurnoDto): Promise<string> {
        const servicios = await this.servicioService.findByIds(turnoView.servicios);
        const newTurno = new Turno(car, turnoView.estado, turnoView.observacion, servicios);
        const turno = this.turnoRepository.create(newTurno);
        this.turnoRepository.save(turno);
        return "Turno created successfully";
    }

    //VERIFICAR!!!!!!!!!!, agregar validaciones con respecto a la fecha (y posiblemente a los demas campos, try no funciona como deberia)
    async modifyTurno(turno: ModifyTurnoDto): Promise<string> {
        const existingTurno = await this.turnoRepository.findOneBy({ id: turno.turnoId });
        if (!existingTurno) {
            throw new HttpException('Turno not found', 404);
        }
        try{
            existingTurno.fechaHora = turno.fechaHora;
            existingTurno.estado = turno.estado;
            existingTurno.observacion = turno.observacion;
    
            const servicios = await this.servicioService.findByIds(turno.servicios);
            existingTurno.servicio = servicios;
            this.turnoRepository.save(existingTurno);

        }catch (error) {
            throw new HttpException('Error modifying Turno: ' + error.message, 500);
        }

        return "Turno modified successfully";
    }


    async deleteTurno(turnoId: number): Promise<void> {
        const turno = await this.turnoRepository.findOneBy({ id: turnoId });
        if (turno) {
            await this.turnoRepository.remove(turno);
        }else {
            throw new HttpException('Turno not found', 404);
        }
    }



    async findById(turnoId: number): Promise<Turno> {
        return await this.turnoRepository.findOne({ 
            where: { id: turnoId },
            relations: ['car', 'car.user', 'servicio'] // Assuming you want to load related entities
        });
    }

    
}
