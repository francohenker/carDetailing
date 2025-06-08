import { Module } from '@nestjs/common';
import { PagoService } from './pago.service';
import { PagoController } from './pago.controller';

@Module({
  providers: [PagoService],
  controllers: [PagoController]
})
export class PagoModule {}
