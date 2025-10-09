import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagoService } from './pago.service';
import { PagoController } from './pago.controller';
import { Pago } from './entities/pago.entity';
import { Turno } from '../turno/entities/turno.entity';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [TypeOrmModule.forFeature([Pago, Turno]), JwtModule],
  providers: [PagoService],
  controllers: [PagoController],
})
export class PagoModule {}
