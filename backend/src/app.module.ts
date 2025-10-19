import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { configService } from './config/config.service';
import { ServicioModule } from './servicio/servicio.module';
import { CarModule } from './car/car.module';
import { UserService } from './users/users.service';
import { ConfigModule } from '@nestjs/config';
import { TurnoModule } from './turno/turno.module';
import { JwtModule } from '@nestjs/jwt';
import { PagoModule } from './pago/pago.module';
import { ProductoModule } from './producto/producto.module';
import { AuditoriaModule } from './auditoria/auditoria.module';
import { PrecioModule } from './precio/precio.module';
import { MailService } from './mail.services';
import { SupplierModule } from './supplier/supplier.module';

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
    AuditoriaModule,
    PrecioModule,
    SupplierModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    UserService,
    MailService,
    // {
    //   provide: APP_GUARD,
    //   useClass: RolesGuard,
    // },
  ],
  exports: [TypeOrmModule, UserService, TypeOrmModule],
})
export class AppModule {}
