import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { fetchWeatherApi } from 'openmeteo';
import { Turno } from '../turno/entities/turno.entity';
import { MailService } from '../mail.services';
import { estado_turno } from '../enums/estado_turno.enum';

export interface WeatherForecast {
  date: Date;
  weatherCode: number;
  precipitation: number;
  temperature: number;
}

interface TurnoWeatherEvaluation {
  turno: Turno;
  badWeatherDays: number;
  consecutiveBadDays: number;
  daysUntilTurno: number;
  weatherForecasts: WeatherForecast[];
  turnoDayForecast?: WeatherForecast; // Pronóstico específico para el día del turno
}

@Injectable()
export class WeatherEvaluationService {
  private readonly logger = new Logger(WeatherEvaluationService.name);

  constructor(
    @InjectRepository(Turno)
    private readonly turnoRepository: Repository<Turno>,
    private readonly mailService: MailService,
  ) {}

  // Cronjob que se ejecuta todos los días a las 8:00 AM
  @Cron('0 8 * * *', {
    name: 'weather-evaluation',
    timeZone: 'America/Argentina/Buenos_Aires',
  })
  async evaluateWeatherForTurnos() {
    this.logger.log('Iniciando evaluación de clima para turnos...');

    try {
      // Obtener todos los turnos dentro de los próximos 15 días
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + 15);

      const turnos = await this.turnoRepository.find({
        where: {
          fechaHora: Between(startDate, endDate),
          estado: estado_turno.PENDIENTE,
        },
        relations: ['car', 'car.user', 'servicio'],
      });

      this.logger.log(`Encontrados ${turnos.length} turnos para evaluar`);

      if (turnos.length === 0) {
        return;
      }

      // Obtener pronóstico del tiempo para los próximos 15 días
      const weatherForecasts = await this.getWeatherForecast(15);

      // Evaluar cada turno
      const evaluations: TurnoWeatherEvaluation[] = [];

      for (const turno of turnos) {
        const evaluation = this.evaluateTurnoWeather(turno, weatherForecasts);
        evaluations.push(evaluation);
      }

      // Procesar evaluaciones y enviar emails según las reglas
      const turnosArray = await this.processWeatherEvaluations(evaluations);

      this.logger.log('Evaluación de clima completada exitosamente');
      return turnosArray;
    } catch (error) {
      this.logger.error('Error durante la evaluación de clima:', error);
    }
  }

  // Método para ejecutar manualmente la evaluación (útil para testing)
  async manualWeatherEvaluation() {
    this.logger.log('Ejecutando evaluación manual de clima...');
    return await this.evaluateWeatherForTurnos();
  }

  // Método para obtener solo el pronóstico del tiempo (útil para testing)
  async getWeatherForecastForTesting(days: number = 7) {
    this.logger.log(`Obteniendo pronóstico de ${days} días para testing...`);
    const forecasts = await this.getWeatherForecast(days);

    // Log detallado de cada día
    forecasts.forEach((forecast, index) => {
      const isBad = this.isBadWeatherForCarDetailing(forecast);
      this.logger.log(
        `Día ${index + 1}: ${forecast.date.toISOString().split('T')[0]} - ` +
          `Código: ${forecast.weatherCode} (${this.getWeatherDescription(forecast.weatherCode)}) - ` +
          `Precipitación: ${forecast.precipitation.toFixed(1)}mm - ` +
          `Temperatura: ${forecast.temperature.toFixed(1)}°C - ` +
          `Estado: ${isBad ? '❌ No ideal' : '✅ Bueno'}`,
      );
    });

    return forecasts;
  }

  private async getWeatherForecast(days: number): Promise<WeatherForecast[]> {
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + days);

      const params = {
        latitude: [-27.92], // Apóstoles, Misiones -27.92,-55.74
        longitude: [-55.74],
        daily: [
          'weather_code',
          'precipitation_sum',
          'temperature_2m_max',
          'temperature_2m_min',
        ],
        timezone: 'America/Argentina/Buenos_Aires',
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
      };

      const url = 'https://api.open-meteo.com/v1/forecast';
      const responses = await fetchWeatherApi(url, params);
      const response = responses[0];

      const daily = response.daily()!;
      const forecasts: WeatherForecast[] = [];

      // Obtener los arrays de datos de la API
      const weatherCodeArray = daily.variables(0)!.valuesArray()!;
      const precipitationArray = daily.variables(1)!.valuesArray()!;
      const tempMaxArray = daily.variables(2)!.valuesArray()!;
      const tempMinArray = daily.variables(3)!.valuesArray()!;

      // Crear forecasts para cada día usando datos reales de la API
      for (let i = 0; i < Math.min(weatherCodeArray.length, days); i++) {
        // Calcular la fecha para este índice (cada día desde startDate)
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);

        forecasts.push({
          date,
          weatherCode: weatherCodeArray[i] || 0,
          precipitation: precipitationArray[i] || 0,
          temperature:
            tempMaxArray[i] && tempMinArray[i]
              ? (tempMaxArray[i] + tempMinArray[i]) / 2
              : 20, // fallback temperature
        });
      }

      this.logger.log(
        `Obtenidos ${forecasts.length} días de pronóstico de la API`,
      );

      // Log de algunos datos para verificar
      if (forecasts.length > 0) {
        this.logger.log(
          `Primer día: ${forecasts[0].date.toISOString().split('T')[0]} - Código: ${forecasts[0].weatherCode} - Precipitación: ${forecasts[0].precipitation}mm`,
        );

        // Log de días con mal tiempo para verificar la lógica
        const badWeatherDays = forecasts.filter((f) =>
          this.isBadWeatherForCarDetailing(f),
        );
        if (badWeatherDays.length > 0) {
          this.logger.log(
            `Detectados ${badWeatherDays.length} días con condiciones adversas en el pronóstico`,
          );
        }
      }

      return forecasts;
    } catch (error) {
      this.logger.error('Error obteniendo pronóstico del tiempo:', error);
      this.logger.warn(
        'Usando datos de respaldo (mock) debido al error de API',
      );

      // Return mock data in case of error
      const forecasts: WeatherForecast[] = [];
      const startDate = new Date();

      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);

        forecasts.push({
          date,
          weatherCode: Math.random() > 0.7 ? 61 : 1,
          precipitation: Math.random() > 0.7 ? Math.random() * 5 : 0,
          temperature: 20 + Math.random() * 10,
        });
      }

      return forecasts;
    }
  }

  private evaluateTurnoWeather(
    turno: Turno,
    forecasts: WeatherForecast[],
  ): TurnoWeatherEvaluation {
    const turnoDate = new Date(turno.fechaHora);
    const today = new Date();
    const daysUntilTurno = Math.ceil(
      (turnoDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Obtener pronósticos desde hoy hasta el día del turno
    const relevantForecasts = forecasts.filter((forecast) => {
      const forecastDate = new Date(forecast.date);
      return forecastDate <= turnoDate;
    });

    // Encontrar el pronóstico específico para el día del turno
    const turnoDateOnly = turnoDate.toISOString().split('T')[0];
    const turnoDayForecast = forecasts.find((forecast) => {
      const forecastDateOnly = forecast.date.toISOString().split('T')[0];
      return forecastDateOnly === turnoDateOnly;
    });

    let badWeatherDays = 0;
    let consecutiveBadDays = 0;
    let currentConsecutive = 0;

    for (const forecast of relevantForecasts) {
      const isBadWeather = this.isBadWeatherForCarDetailing(forecast);

      if (isBadWeather) {
        badWeatherDays++;
        currentConsecutive++;
        consecutiveBadDays = Math.max(consecutiveBadDays, currentConsecutive);
      } else {
        currentConsecutive = 0;
      }
    }

    return {
      turno,
      badWeatherDays,
      consecutiveBadDays,
      daysUntilTurno,
      weatherForecasts: relevantForecasts,
      turnoDayForecast, // Agregamos el pronóstico específico del día del turno
    };
  }

  private isBadWeatherForCarDetailing(forecast: WeatherForecast): boolean {
    // Códigos de clima malo para car detailing:
    // 51-99: Diferentes tipos de lluvia, llovizna, nieve
    // Precipitación > 1mm
    return (
      (forecast.weatherCode >= 51 && forecast.weatherCode <= 99) ||
      forecast.precipitation > 1.0
    );
  }

  private async processWeatherEvaluations(
    evaluations: TurnoWeatherEvaluation[],
  ) {
    const turnos = [];
    for (const evaluation of evaluations) {
      const { turno, daysUntilTurno, turnoDayForecast } = evaluation;
      turnos.push(turno);

      // Verificar si el día específico del turno tiene condiciones adversas
      const isTurnoDayBad =
        turnoDayForecast && this.isBadWeatherForCarDetailing(turnoDayForecast);

      if (!isTurnoDayBad) {
        // Si el día del turno tiene buenas condiciones, no enviar email
        this.logger.log(
          `Turno ${turno.id} en ${turnoDayForecast?.date.toISOString().split('T')[0]} tiene buenas condiciones climáticas. No se envía email.`,
        );
        continue;
      }

      // Solo enviar emails si el día del turno tiene condiciones adversas
      // Regla 1: Turnos con 5+ días de anticipación
      if (daysUntilTurno >= 5) {
        await this.sendWeatherRescheduleEmail(evaluation, 'advance');
        this.logger.log(
          `Email de reprogramación enviado para turno ${turno.id} (${daysUntilTurno} días de anticipación) - Día del turno con condiciones adversas: ${this.getWeatherDescription(turnoDayForecast.weatherCode)}, precipitación: ${turnoDayForecast.precipitation}mm`,
        );
      }
      // Regla 2: Turnos con menos de 5 días de anticipación
      else if (daysUntilTurno < 5) {
        await this.sendWeatherRescheduleEmail(evaluation, 'urgent');
        this.logger.log(
          `Email de aviso urgente enviado para turno ${turno.id} (${daysUntilTurno} días restantes) - Día del turno con condiciones adversas: ${this.getWeatherDescription(turnoDayForecast.weatherCode)}, precipitación: ${turnoDayForecast.precipitation}mm`,
        );
      }
    }
    return turnos;
  }

  private async sendWeatherRescheduleEmail(
    evaluation: TurnoWeatherEvaluation,
    type: 'advance' | 'urgent',
  ) {
    const { turno } = evaluation;

    const subject =
      type === 'advance'
        ? '🌧️ Recomendación de Reprogramación - Condiciones Climáticas'
        : '⚠️ Aviso Urgente - Condiciones Climáticas Adversas';

    const htmlContent = this.generateWeatherEmailTemplate(evaluation, type);

    try {
      await this.mailService.sendHtmlMail(
        turno.car.user.email,
        subject,
        htmlContent,
        `Aviso sobre condiciones climáticas para turno del ${this.mailService.formateDate(turno.fechaHora)}`,
      );
    } catch (error) {
      this.logger.error(`Error enviando email para turno ${turno.id}:`, error);
    }
  }

  private generateWeatherEmailTemplate(
    evaluation: TurnoWeatherEvaluation,
    type: 'advance' | 'urgent',
  ): string {
    const { turno, daysUntilTurno, turnoDayForecast, weatherForecasts } =
      evaluation;

    const isAdvance = type === 'advance';
    const weatherSummary = this.generateWeatherSummary(weatherForecasts);

    // Información específica del día del turno
    const turnoDayInfo = turnoDayForecast
      ? {
          description: this.getWeatherDescription(turnoDayForecast.weatherCode),
          icon: this.getWeatherIcon(turnoDayForecast.weatherCode),
          precipitation: turnoDayForecast.precipitation,
          temperature: turnoDayForecast.temperature,
        }
      : null;

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Aviso Climático - Car Detailing</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            background-color: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: ${isAdvance ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 'linear-gradient(135deg, #f59e0b, #d97706)'};
            color: white;
            padding: 30px 25px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
          }
          .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 16px;
          }
          .content {
            padding: 30px 25px;
          }
          .alert-section {
            background-color: ${isAdvance ? '#dbeafe' : '#fef3c7'};
            border: 1px solid ${isAdvance ? '#93c5fd' : '#fcd34d'};
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
          }
          .alert-section h3 {
            margin-top: 0;
            color: ${isAdvance ? '#1d4ed8' : '#d97706'};
            font-size: 20px;
          }
          .turno-info {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .weather-forecast {
            background-color: #f1f5f9;
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
          }
          .weather-day {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
          }
          .weather-day:last-child {
            border-bottom: none;
          }
          .weather-icon {
            font-size: 24px;
          }
          .contact-info {
            background-color: #ecfdf5;
            border: 1px solid #a7f3d0;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
          }
          .btn {
            display: inline-block;
            padding: 12px 24px;
            background-color: #10b981;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 10px 5px;
          }
          .footer {
            background-color: #f8fafc;
            padding: 20px 25px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
            font-size: 14px;
            color: #64748b;
          }
          @media (max-width: 600px) {
            body { padding: 10px; }
            .content { padding: 20px 15px; }
            .header { padding: 20px 15px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${isAdvance ? '🌧️' : '⚠️'} Aviso Climático</h1>
            <p>Información importante sobre tu turno</p>
          </div>

          <div class="content">
            <div class="alert-section">
              <h3>${isAdvance ? 'Recomendación de Reprogramación' : 'Aviso Urgente de Clima'}</h3>
              <p>
                ${
                  isAdvance
                    ? `Hemos detectado condiciones climáticas adversas para el día de tu turno (${turnoDayInfo?.description} con ${turnoDayInfo?.precipitation.toFixed(1)}mm de precipitación) que podrían afectar la calidad de nuestros servicios.`
                    : `Tu turno está programado para dentro de ${daysUntilTurno} día${daysUntilTurno > 1 ? 's' : ''} y el pronóstico indica condiciones climáticas adversas para ese día: ${turnoDayInfo?.description}.`
                }
              </p>
            </div>

            <div class="turno-info">
              <h3 style="margin-top: 0; color: #1976d2;">📅 Detalles de tu Turno</h3>
              <p><strong>Fecha y hora:</strong> ${this.mailService.formateDate(turno.fechaHora)}</p>
              <p><strong>Vehículo:</strong> ${turno.car.marca} ${turno.car.model} - ${turno.car.patente}</p>
              <p><strong>Servicios:</strong></p>
              <ul>
                ${turno.servicio.map((servicio) => `<li>${servicio.name} (${servicio.duration} min)</li>`).join('')}
              </ul>
              <p><strong>Total:</strong> $${turno.totalPrice.toLocaleString('es-AR')}</p>
              <p><strong>Días hasta el turno:</strong> ${daysUntilTurno}</p>
            </div>

            ${
              turnoDayInfo
                ? `
            <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h4 style="margin-top: 0; color: #dc2626;">🌧️ Condiciones del Día del Turno</h4>
              <div style="display: flex; align-items: center; gap: 15px;">
                <span style="font-size: 48px;">${turnoDayInfo.icon}</span>
                <div>
                  <p style="margin: 5px 0;"><strong>Condición:</strong> ${turnoDayInfo.description}</p>
                  <p style="margin: 5px 0;"><strong>Precipitación:</strong> ${turnoDayInfo.precipitation.toFixed(1)}mm</p>
                  <p style="margin: 5px 0;"><strong>Temperatura:</strong> ${turnoDayInfo.temperature.toFixed(1)}°C</p>
                </div>
              </div>
              <p style="margin: 10px 0 0 0; font-size: 14px; color: #7f1d1d;">
                <strong>⚠️ Importante:</strong> Estas condiciones pueden afectar el tiempo de secado y la calidad final del trabajo.
              </p>
            </div>
            `
                : ''
            }

            <div class="weather-forecast">
              <h4 style="margin-top: 0; color: #374151;">🌤️ Pronóstico del Tiempo</h4>
              ${weatherSummary}
            </div>

            ${
              isAdvance
                ? `
              <div class="contact-info">
                <h4 style="margin-top: 0; color: #059669;">💡 Nuestra Recomendación</h4>
                <p>Te sugerimos reprogramar tu turno para garantizar los mejores resultados. Tenés tiempo suficiente para elegir una fecha con mejores condiciones climáticas.</p>
                <p><strong>¿Querés reprogramar tu turno?</strong></p>
                <p>Contactanos para coordinar una nueva fecha:</p>
                <a href="tel:+543764123456" class="btn">📞 Llamar Ahora</a>
                <a href="https://wa.me/543764123456" class="btn">💬 WhatsApp</a>
              </div>
            `
                : `
              <div class="contact-info">
                <h4 style="margin-top: 0; color: #d97706;">⚠️ Aviso Importante</h4>
                <p>Tu turno está próximo y las condiciones climáticas no son ideales. Te contactaremos para evaluar las opciones disponibles.</p>
                <p>Si querés reprogramar urgentemente:</p>
                <a href="tel:+543764123456" class="btn">📞 Llamar Urgente</a>
                <a href="https://wa.me/543764123456" class="btn">💬 WhatsApp</a>
              </div>
            `
            }

            <div style="background-color: #f8fafc; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #64748b;">
                <strong>Nota:</strong> Nuestro objetivo es brindarte el mejor servicio posible. Las condiciones climáticas adversas pueden afectar el tiempo de secado y la calidad final del trabajo.
              </p>
            </div>
          </div>

          <div class="footer">
            <p>Car Detailing - Servicios Premium de Lavado</p>
            <p>📍 Apóstoles, Misiones | 📞 (+54) 3764-123456</p>
            <p style="margin: 5px 0;">Este es un mensaje automático basado en pronósticos meteorológicos.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateWeatherSummary(forecasts: WeatherForecast[]): string {
    return forecasts
      .slice(0, 7)
      .map((forecast) => {
        const date = forecast.date.toLocaleDateString('es-AR', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        });
        const icon = this.getWeatherIcon(forecast.weatherCode);
        const condition = this.getWeatherDescription(forecast.weatherCode);
        const isBad = this.isBadWeatherForCarDetailing(forecast);

        return `
        <div class="weather-day" style="background-color: ${isBad ? '#fee2e2' : '#f0fdf4'};">
          <span><strong>${date}</strong></span>
          <span class="weather-icon">${icon}</span>
          <span>${condition}</span>
          <span style="color: ${isBad ? '#dc2626' : '#16a34a'}; font-weight: bold;">
            ${isBad ? '❌ No ideal' : '✅ Bueno'}
          </span>
        </div>
      `;
      })
      .join('');
  }

  private getWeatherIcon(code: number): string {
    if (code >= 0 && code <= 3) return '☀️';
    if (code >= 45 && code <= 48) return '🌫️';
    if (code >= 51 && code <= 67) return '🌧️';
    if (code >= 71 && code <= 77) return '🌨️';
    if (code >= 80 && code <= 82) return '☔';
    if (code >= 85 && code <= 86) return '❄️';
    if (code >= 95 && code <= 99) return '⛈️';
    return '☁️';
  }

  private getWeatherDescription(code: number): string {
    if (code >= 0 && code <= 3) return 'Despejado';
    if (code >= 45 && code <= 48) return 'Niebla';
    if (code >= 51 && code <= 67) return 'Lluvia';
    if (code >= 71 && code <= 77) return 'Nieve';
    if (code >= 80 && code <= 82) return 'Lluvia intensa';
    if (code >= 85 && code <= 86) return 'Nevada';
    if (code >= 95 && code <= 99) return 'Tormenta';
    return 'Nublado';
  }
}
