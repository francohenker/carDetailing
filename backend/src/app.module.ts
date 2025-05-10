import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './users/user.module';
import { AuthController } from './auth/auth.controller';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { configService } from './config/config.service';
import { ServicioController } from './servicio/servicio.controller';
import { ServicioModule } from './servicio/servicio.module';
import { TurnoController } from './turno/turno.controller';
import { CarController } from './car/car.controller';
import { CarService } from './car/car.service';
import { CarModule } from './car/car.module';
import { UserService } from './users/user.service';


@Module({
  imports: [
    TypeOrmModule.forRoot(configService.getTypeOrmConfig()),
    UserModule, AuthModule, ServicioModule, CarModule],
  controllers: [AppController, AuthController, ServicioController, TurnoController, CarController],
  providers: [AppService, CarService, UserService],
  exports: [TypeOrmModule, UserService, TypeOrmModule],
})
export class AppModule {}
