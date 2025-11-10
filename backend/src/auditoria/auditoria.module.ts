import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditoriaController } from './auditoria.controller';
import { AuditoriaService } from './auditoria.service';
import { Auditoria } from './entities/auditoria.entity';
import { AuthModule } from '../auth/auth.module';
import { AuditoriaInterceptor } from './interceptors/auditoria.interceptor';
import { Users } from '../users/entities/users.entity';
import { Turno } from '../turno/entities/turno.entity';
import { Servicio } from '../servicio/entities/servicio.entity';
import { Producto } from '../producto/entities/producto.entity';
import { Supplier } from '../supplier/entities/supplier.entity';
import { Pago } from '../pago/entities/pago.entity';
import { Car } from '../car/entities/car.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Auditoria,
      Users,
      Turno,
      Servicio,
      Producto,
      Supplier,
      Pago,
      Car,
    ]),
    AuthModule,
  ],
  controllers: [AuditoriaController],
  providers: [
    AuditoriaService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditoriaInterceptor,
    },
  ],
  exports: [AuditoriaService],
})
export class AuditoriaModule {}
