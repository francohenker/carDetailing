import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockController } from './stock.controller';
import { StockNotificationService } from './stock-notification.service';
import { Producto } from '../producto/entities/producto.entity';
import { Users } from '../users/entities/users.entity';
import { Supplier } from '../supplier/entities/supplier.entity';
import { AuthModule } from '../auth/auth.module';
import { MailService } from '../mail.services';
import { SystemConfigModule } from '../config/system-config.module';
import { QuotationModule } from 'src/quotation/quotation.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Producto, Users, Supplier]),
    AuthModule,
    SystemConfigModule,
    QuotationModule,
  ],
  controllers: [StockController],
  providers: [StockNotificationService, MailService],
  exports: [StockNotificationService],
})
export class StockModule {}
