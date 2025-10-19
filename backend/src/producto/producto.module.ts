import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Producto } from './entities/producto.entity';
import { Supplier } from '../supplier/entities/supplier.entity';
import { ProductoService } from './producto.service';
import { ProductoController } from './producto.controller';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Producto, Supplier])],
  providers: [ProductoService],
  controllers: [ProductoController],
  exports: [ProductoService, TypeOrmModule],
})
export class ProductoModule {}
