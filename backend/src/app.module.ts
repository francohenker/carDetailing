import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './users/users.module';
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
import { UserService } from './users/users.service';
import { ConfigModule } from '@nestjs/config';
import { TurnoService } from './turno/turno.service';
import { TurnoModule } from './turno/turno.module';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PagoModule } from './pago/pago.module';
import { ProductoController } from './producto/producto.controller';
import { ProductoModule } from './producto/producto.module';
import { ProductoService } from './producto/producto.service';
import { AuditoriaController } from './auditoria/auditoria.controller';
import { MercadopagoController } from './mercadopago/mercadopago.controller';
import { AuditoriaService } from './auditoria/auditoria.service';
import { MercadopagoService } from './mercadopago/mercadopago.service';
import { MercadopagoModule } from './mercadopago/mercadopago.module';
import { AuditoriaModule } from './auditoria/auditoria.module';
import { PrecioModule } from './precio/precio.module';
import { MailService } from './mail.services';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '30d' },
    }),
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot(configService.getTypeOrmConfig()),
    UserModule,
    AuthModule,
    ServicioModule,
    CarModule,
    TurnoModule,
    PagoModule,
    ProductoModule,
    MercadopagoModule,
    AuditoriaModule,
    PrecioModule,
  ],
  controllers: [
    AppController,
    AuthController,
    ServicioController,
    TurnoController,
    CarController,
    ProductoController,
    AuditoriaController,
    MercadopagoController,
  ],
  providers: [
    AppService,
    CarService,
    UserService,
    TurnoService,
    JwtService,
    ProductoService,
    AuditoriaService,
    MercadopagoService,
    MailService,
    // {
    //   provide: APP_GUARD,
    //   useClass: RolesGuard,
    // },
  ],
  exports: [TypeOrmModule, UserService, TypeOrmModule],
})
export class AppModule {}
