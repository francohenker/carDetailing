import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { Producto } from './entities/producto.entity';
import { ProductoService } from './producto.service';
import { ProductoController } from './producto.controller';

@Module({
    imports: [AuthModule, TypeOrmModule.forFeature([Producto])],
    providers: [ProductoService],
    controllers: [ProductoController],
    exports: [ProductoService, TypeOrmModule],
})
export class ProductoModule {}
