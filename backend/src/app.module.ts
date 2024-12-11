import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AuthController } from './auth/auth.controller';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { configService } from './config/config.service';
import { ProductoController } from './producto/producto.controller';
import { ProductoModule } from './producto/producto.module';
import { OrdenService } from './orden/orden.service';
import { OrdenModule } from './orden/orden.module';
import { CategoriaController } from './categoria/categoria.controller';


@Module({
  
  imports: [
    TypeOrmModule.forRoot(configService.getTypeOrmConfig()),
    UserModule, AuthModule, ProductoModule, OrdenModule],
  controllers: [AppController, AuthController, ProductoController, CategoriaController],
  providers: [AppService, OrdenService],
})
export class AppModule {}
