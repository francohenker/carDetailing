import { Controller, Post, UseGuards } from '@nestjs/common';
import {
  WeatherEvaluationService,
  WeatherForecast,
} from './weather-evaluation.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../roles/role.guard';
import { Roles } from '../roles/role.decorator';
import { Role } from '../roles/role.enum';

@Controller('weather')
@UseGuards(AuthGuard, RolesGuard)
export class WeatherController {
  constructor(private readonly weatherService: WeatherEvaluationService) {}

  @Post('evaluate')
  @Roles(Role.ADMIN)
  async manualEvaluate() {
    return await this.weatherService.manualWeatherEvaluation();
  }

  @Post('forecast')
  @Roles(Role.ADMIN)
  async getForecast(): Promise<WeatherForecast[]> {
    return await this.weatherService.getWeatherForecastForTesting(7);
  }
}
