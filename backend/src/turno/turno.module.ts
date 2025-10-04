import { Module } from '@nestjs/common';
import { Turno } from './entities/turno.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TurnoService } from './turno.service';
import { TurnoController } from './turno.controller';
import { CarModule } from '../car/car.module';
import { CarService } from '../car/car.service';
import { ServicioModule } from '../servicio/servicio.module';
import { JwtService } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ServicioModule,
    CarModule,
    AuthModule,
    TypeOrmModule.forFeature([Turno]),
  ],
  providers: [TurnoService, CarService, JwtService],
  controllers: [TurnoController],
  exports: [TypeOrmModule],
})
export class TurnoModule {}
