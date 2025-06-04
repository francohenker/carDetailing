import { Module } from '@nestjs/common';
import { Turno } from './entities/turno.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TurnoService } from './turno.service';
import { TurnoController } from './turno.controller';
import { CarModule } from 'src/car/car.module';
import { CarService } from 'src/car/car.service';
import { ServicioModule } from 'src/servicio/servicio.module';

@Module({
    imports: [ServicioModule, CarModule, TypeOrmModule.forFeature([Turno])],
    providers: [TurnoService, CarService],
    controllers: [TurnoController],
    exports: [TypeOrmModule],
})
export class TurnoModule {}
