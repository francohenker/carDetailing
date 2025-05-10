import { Module } from '@nestjs/common';
import { ServicioService } from './servicio.service';

@Module({
  providers: [ServicioService]
})
export class ServicioModule {}
