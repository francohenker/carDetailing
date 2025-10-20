import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FacturaController } from './factura.controller';
import { FacturaService } from './factura.service';
import { Turno } from '../turno/entities/turno.entity';
import { Pago } from '../pago/entities/pago.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Turno, Pago]), AuthModule],
  controllers: [FacturaController],
  providers: [FacturaService],
  exports: [FacturaService],
})
export class FacturaModule {}
