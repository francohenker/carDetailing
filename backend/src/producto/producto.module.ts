import { Module } from '@nestjs/common';
import { ProductoService } from './producto.service';

@Module({
  providers: [ProductoService]
})
export class ProductoModule {}
