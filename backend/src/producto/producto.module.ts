import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Producto } from './entities/producto.entity';
import { Supplier } from '../supplier/entities/supplier.entity';
import { Users } from '../users/entities/users.entity';
import { ProductoService } from './producto.service';
import { ProductoController } from './producto.controller';
import { StockNotificationService } from '../stock/stock-notification.service';
import { MailService } from '../mail.services';
import { QuotationModule } from '../quotation/quotation.module';
import { SystemConfigModule } from 'src/config/system-config.module';

@Module({
  imports: [AuthModule, QuotationModule, SystemConfigModule, TypeOrmModule.forFeature([Producto, Supplier, Users])],
  providers: [ProductoService, StockNotificationService, MailService],
  controllers: [ProductoController],
  exports: [ProductoService, StockNotificationService, TypeOrmModule],
})
export class ProductoModule {}
