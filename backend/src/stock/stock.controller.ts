import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { StockNotificationService } from './stock-notification.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../roles/role.guard';
import { Roles } from '../roles/role.decorator';
import { Role } from '../roles/role.enum';
import { SendSupplierEmailDto } from './dto/send-supplier-email.dto';

@Controller('stock')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class StockController {
  constructor(
    private readonly stockNotificationService: StockNotificationService,
  ) {}

  @Get('low-stock-products')
  async getLowStockProducts() {
    return await this.stockNotificationService.getProductsWithLowStock();
  }

  @Post('check-and-notify')
  async checkStockAndNotify() {
    await this.stockNotificationService.checkStockLevelsAndNotify();
    return { message: 'Stock levels checked and notifications sent if needed' };
  }

  @Post('send-supplier-email')
  async sendSupplierEmail(@Body() sendEmailDto: SendSupplierEmailDto) {
    await this.stockNotificationService.sendSupplierEmail(
      sendEmailDto.supplierId,
      sendEmailDto.productIds,
      sendEmailDto.message,
    );
    return { message: 'Email sent to supplier successfully' };
  }
}
