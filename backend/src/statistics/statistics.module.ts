import { Module } from '@nestjs/common';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Turno } from '../turno/entities/turno.entity';
import { Users } from '../users/entities/users.entity';
import { Servicio } from '../servicio/entities/servicio.entity';
import { Pago } from '../pago/entities/pago.entity';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [TypeOrmModule.forFeature([Turno, Users, Servicio, Pago])],
  controllers: [StatisticsController],
  providers: [StatisticsService, JwtService],
})
export class StatisticsModule {}
