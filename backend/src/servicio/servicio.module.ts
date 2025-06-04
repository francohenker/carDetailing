import { Module } from '@nestjs/common';
import { ServicioService } from './servicio.service';
import { UserModule } from 'src/users/user.module';
import { ServicioController } from './servicio.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Servicio } from './entities/servicio.entity';
import { JwtModule, JwtService } from '@nestjs/jwt';

@Module({
  imports: [UserModule, TypeOrmModule.forFeature([Servicio]), JwtModule],
  providers: [ServicioService],
  controllers: [ServicioController],
  exports: [ServicioService],
})
export class ServicioModule {}
