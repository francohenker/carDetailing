import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuotationController } from './quotation.controller';
import { QuotationService } from './quotation.service';
import { QuotationRequest } from './entities/quotation-request.entity';
import { QuotationResponse } from './entities/quotation-response.entity';
import { Producto } from '../producto/entities/producto.entity';
import { Supplier } from '../supplier/entities/supplier.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      QuotationRequest,
      QuotationResponse,
      Producto,
      Supplier,
    ]),
    // forwardRef(() => StockModule),
  ],
  controllers: [QuotationController],
  providers: [QuotationService],
  exports: [QuotationService],
})
export class QuotationModule {}
