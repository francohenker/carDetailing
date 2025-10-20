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
import { MailService } from '../mail.services';
import { ProductoModule } from '../producto/producto.module';

@Module({
  imports: [
    ServicioModule,
    CarModule,
    AuthModule,
    ProductoModule,
    TypeOrmModule.forFeature([Turno]),
  ],
  providers: [TurnoService, CarService, JwtService, MailService],
  controllers: [TurnoController],
  exports: [TypeOrmModule],
})
export class TurnoModule {}
