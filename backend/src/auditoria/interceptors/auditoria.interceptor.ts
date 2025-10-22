import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { AuditoriaService } from '../auditoria.service';
import { AuthService } from '../../auth/auth.service';
import {
  AUDITORIA_KEY,
  AuditoriaMetadata,
} from '../decorators/auditar.decorator';

@Injectable()
export class AuditoriaInterceptor implements NestInterceptor {
  constructor(
    private readonly auditoriaService: AuditoriaService,
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
  ) {}

  private getRealClientIP(request: any): string {
    // Lista de headers a verificar en orden de prioridad para Vercel
    const ipHeaders = [
      'x-forwarded-for', // Header principal para IPs forwarded
      'x-real-ip', // Header alternativo
      'x-client-ip', // Otro header común
      'x-forwarded', // Header más genérico
      'forwarded-for', // Header estándar
      'forwarded', // Header RFC 7239
    ];

    // Verificar cada header
    for (const header of ipHeaders) {
      const value = request.get(header) || request.headers[header];
      if (value) {
        // Si hay múltiples IPs separadas por comas (caso común con proxies)
        const ips = value.split(',').map((ip: string) => ip.trim());
        // Tomar la primera IP que no sea privada
        for (const ip of ips) {
          if (this.isPublicIP(ip)) {
            return ip;
          }
        }
        // Si no hay IPs públicas, tomar la primera
        return ips[0];
      }
    }

    // Fallback a los métodos tradicionales
    return (
      request.ip ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      request.connection?.socket?.remoteAddress ||
      '127.0.0.1'
    );
  }

  private isPublicIP(ip: string): boolean {
    // Verificar si la IP no es privada/local
    const privateRanges = [
      /^127\./, // 127.x.x.x (localhost)
      /^10\./, // 10.x.x.x (private)
      /^172\.(1[6-9]|2\d|3[01])\./, // 172.16.x.x - 172.31.x.x (private)
      /^192\.168\./, // 192.168.x.x (private)
      /^::1$/, // IPv6 localhost
      /^fc00:/, // IPv6 private
    ];

    return !privateRanges.some((range) => range.test(ip));
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditoriaMetadata = this.reflector.get<AuditoriaMetadata>(
      AUDITORIA_KEY,
      context.getHandler(),
    );

    if (!auditoriaMetadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const { accion, entidad, descripcion } = auditoriaMetadata;

    return next.handle().pipe(
      tap(async (result) => {
        try {
          // Obtener el usuario del token si está disponible
          let usuario = null;
          if (request.headers.authorization) {
            try {
              usuario = await this.authService.findUserByToken(
                request.headers.authorization,
              );
            } catch (error) {
              // Si no se puede obtener el usuario, continuamos sin él
            }
          }

          // Obtener la IP real del cliente
          const ip = this.getRealClientIP(request);
          const userAgent = request.get('User-Agent');

          // Extraer ID de la entidad desde los parámetros o el resultado
          let entidadId = null;
          if (request.params && request.params.id) {
            entidadId = parseInt(request.params.id);
          } else if (result && result.id) {
            entidadId = result.id;
          }

          // Obtener datos anteriores y nuevos
          const datosNuevos = request.body || null;
          const datosAnteriores = null; // Esto se podría mejorar obteniendo los datos antes de la operación

          // Registrar la auditoría
          await this.auditoriaService.registrarAccion(
            accion,
            entidad,
            usuario?.id,
            entidadId,
            descripcion,
            datosAnteriores,
            datosNuevos,
            ip,
            userAgent,
          );
        } catch (error) {
          console.error('Error al registrar auditoría:', error);
          // No lanzamos el error para no afectar la operación principal
        }
      }),
    );
  }
}
