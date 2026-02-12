import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Car } from './entities/car.entity';
import { CarController } from './car.controller';
import { CarService } from './car.service';
import { AuthModule } from '../auth/auth.module';
import { SystemConfigModule } from '../config/system-config.module';
import { Turno } from '../turno/entities/turno.entity';
import { MailService } from '../mail.services';

@Module({
  imports: [
    TypeOrmModule.forFeature([Car, Turno]),
    AuthModule,
    SystemConfigModule,
  ],
  controllers: [CarController],
  providers: [CarService, MailService],
  exports: [TypeOrmModule, CarService],
})
export class CarModule {}
