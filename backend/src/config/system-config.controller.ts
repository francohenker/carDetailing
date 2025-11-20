import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { SystemConfigService } from './system-config.service';
import { UpdateQuotationThresholdsDto } from './dto/update-quotation-thresholds.dto';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../roles/role.decorator';
import { Role } from '../roles/role.enum';
import { RolesGuard } from '../roles/role.guard';

@Controller('config')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class SystemConfigController {
  constructor(private readonly systemConfigService: SystemConfigService) {}

  @Get('quotation-thresholds')
  async getQuotationThresholds() {
    return this.systemConfigService.getQuotationThresholds();
  }

  @Put('quotation-thresholds')
  async updateQuotationThresholds(@Body() dto: UpdateQuotationThresholdsDto) {
    return this.systemConfigService.updateQuotationThresholds(dto);
  }
}
