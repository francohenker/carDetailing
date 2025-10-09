import { Module } from '@nestjs/common';
import { ServicioService } from './servicio.service';
import { ServicioController } from './servicio.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Servicio } from './entities/servicio.entity';
import { Precio } from '../precio/entities/precio.entity';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';
import { Producto } from '../producto/entities/producto.entity';
import { MailService } from 'src/mail.services';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([Servicio, Precio, Producto]),
    JwtModule,
  ],
  providers: [ServicioService, MailService],
  controllers: [ServicioController],
  exports: [ServicioService],
})
export class ServicioModule {}
