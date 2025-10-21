import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WeatherEvaluationService } from './weather-evaluation.service';
import { WeatherController } from './weather.controller';
import { Turno } from '../turno/entities/turno.entity';
import { MailService } from '../mail.services';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [TypeOrmModule.forFeature([Turno])],
  controllers: [WeatherController],
  providers: [WeatherEvaluationService, MailService, JwtService],
  exports: [WeatherEvaluationService],
})
export class WeatherModule {}
