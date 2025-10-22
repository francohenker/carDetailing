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

          // Obtener información de la solicitud
          const ip = request.ip || request.connection.remoteAddress;
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
