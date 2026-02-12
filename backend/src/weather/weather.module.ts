import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WeatherEvaluationService } from './weather-evaluation.service';
import { WeatherController } from './weather.controller';
import { Turno } from '../turno/entities/turno.entity';
import { WorkSpace } from '../turno/entities/workspace.entity';
import { MailService } from '../mail.services';
import { JwtService } from '@nestjs/jwt';
import { WorkspaceService } from '../turno/workspace.service';

@Module({
  imports: [TypeOrmModule.forFeature([Turno, WorkSpace])],
  controllers: [WeatherController],
  providers: [WeatherEvaluationService, MailService, JwtService, WorkspaceService],
  exports: [WeatherEvaluationService],
})
export class WeatherModule {}
