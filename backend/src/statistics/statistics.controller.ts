import { Controller, Get, UseGuards } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../roles/role.guard';
import { Roles } from '../roles/role.decorator';
import { Role } from '../roles/role.enum';

@Controller('statistics')
@UseGuards(AuthGuard, RolesGuard)
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get()
  @Roles(Role.ADMIN)
  async getStatistics() {
    return this.statisticsService.getDashboardStatistics();
  }
}
