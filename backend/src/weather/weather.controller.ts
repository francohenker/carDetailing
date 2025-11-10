import { Controller, Post, UseGuards, Param, Query, Get } from '@nestjs/common';
import {
  WeatherEvaluationService,
  WeatherForecast,
} from './weather-evaluation.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../roles/role.guard';
import { Roles } from '../roles/role.decorator';
import { Role } from '../roles/role.enum';
import { Between } from 'typeorm';
import { estado_turno } from '../enums/estado_turno.enum';

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

  // Endpoints para testing de correos (solo desarrollo)
  @Post('test-email/:turnoId')
  @Roles(Role.ADMIN)
  async sendTestWeatherEmail(
    @Param('turnoId') turnoId: string,
    @Query('type') emailType: 'advance' | 'urgent' = 'advance',
  ) {
    const turnoIdNum = parseInt(turnoId, 10);
    if (isNaN(turnoIdNum)) {
      throw new Error('ID de turno inválido');
    }

    return await this.weatherService.sendTestWeatherEmail(
      turnoIdNum,
      emailType,
    );
  }

  @Get('test-email/help')
  @Roles(Role.ADMIN)
  async getTestEmailHelp() {
    return {
      description:
        'Endpoints para testing de correos meteorológicos (solo desarrollo)',
      endpoints: {
        'POST /weather/test-email/:turnoId': {
          description: 'Enviar correo de prueba para un turno específico',
          parameters: {
            turnoId: 'ID del turno (número)',
            type: 'Tipo de correo: "advance" (anticipación) o "urgent" (urgente) - opcional, default: "advance"',
          },
          examples: {
            'Correo de anticipación':
              'POST /weather/test-email/123?type=advance',
            'Correo urgente': 'POST /weather/test-email/123?type=urgent',
            'Correo por defecto (anticipación)': 'POST /weather/test-email/123',
          },
        },
        'GET /weather/test-email/help': {
          description: 'Mostrar esta ayuda',
        },
      },
      notes: [
        'Estos endpoints están disponibles solo para administradores',
        'Los correos incluyen datos meteorológicos simulados',
        'El turno debe existir y tener un usuario asociado',
        'Los correos incluyen el botón parametrizado para modificar turnos',
      ],
    };
  }

  @Get('test-email/turnos')
  @Roles(Role.ADMIN)
  async getTurnosForTesting() {
    // Obtener turnos pendientes de los próximos 30 días para testing
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 30);

    const turnos = await this.weatherService['turnoRepository'].find({
      where: {
        estado: estado_turno.PENDIENTE,
        fechaHora: Between(startDate, endDate),
      },
      relations: ['car', 'car.user', 'servicio'],
      order: { fechaHora: 'ASC' },
      take: 20, // Limitar a 20 turnos
    });

    return {
      message: 'Turnos disponibles para testing de correos meteorológicos',
      count: turnos.length,
      turnos: turnos.map((turno) => ({
        id: turno.id,
        fechaHora: turno.fechaHora,
        usuario: `${turno.car.user.firstname} ${turno.car.user.lastname}`,
        email: turno.car.user.email,
        vehiculo: `${turno.car.marca} ${turno.car.model}`,
        servicios: turno.servicio.map((s) => s.name).join(', '),
        diasHastaTurno: Math.ceil(
          (new Date(turno.fechaHora).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      })),
      usage: {
        description: 'Usar el ID de turno con el endpoint de test-email',
        example: `POST /weather/test-email/{turno.id}?type=advance`,
      },
    };
  }
}
