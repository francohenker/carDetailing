import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditoriaService } from '../auditoria.service';
import { AuthService } from '../../auth/auth.service';
import { Users } from '../../users/entities/users.entity';
import { Turno } from '../../turno/entities/turno.entity';
import { Servicio } from '../../servicio/entities/servicio.entity';
import { Producto } from '../../producto/entities/producto.entity';
import { Supplier } from '../../supplier/entities/supplier.entity';
import { Pago } from '../../pago/entities/pago.entity';
import { Car } from '../../car/entities/car.entity';
import {
  AUDITORIA_KEY,
  AuditoriaMetadata,
} from '../decorators/auditar.decorator';
import { AuditFormatterHelper } from '../helpers/audit-formatter.helper';

@Injectable()
export class AuditoriaInterceptor implements NestInterceptor {
  constructor(
    private readonly auditoriaService: AuditoriaService,
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
    @Inject(getRepositoryToken(Users))
    private readonly usersRepository: Repository<Users>,
    @Inject(getRepositoryToken(Turno))
    private readonly turnoRepository: Repository<Turno>,
    @Inject(getRepositoryToken(Servicio))
    private readonly servicioRepository: Repository<Servicio>,
    @Inject(getRepositoryToken(Producto))
    private readonly productoRepository: Repository<Producto>,
    @Inject(getRepositoryToken(Supplier))
    private readonly supplierRepository: Repository<Supplier>,
    @Inject(getRepositoryToken(Pago))
    private readonly pagoRepository: Repository<Pago>,
    @Inject(getRepositoryToken(Car))
    private readonly carRepository: Repository<Car>,
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

  /**
   * Captura los datos actuales de una entidad antes de que sea modificada
   */
  private async capturarDatosAnteriores(
    request: any,
    entidad: string,
  ): Promise<any> {
    const entidadId = request.params?.id;
    if (!entidadId) return null;

    try {
      const repository = this.getRepository(entidad);
      if (!repository) return null;

      // Configurar relaciones según la entidad
      const relations = this.getRelationsForEntity(entidad);

      const entity = await repository.findOne({
        where: { id: parseInt(entidadId) },
        relations: relations,
      });

      return entity ? this.limpiarDatos(entity) : null;
    } catch (error) {
      console.error('Error capturando datos anteriores:', error);
      return null;
    }
  }

  /**
   * Obtiene las relaciones necesarias para capturar según la entidad
   */
  private getRelationsForEntity(entidad: string): string[] {
    const relationsMap: { [key: string]: string[] } = {
      PRODUCTO: ['suppliers'],
      SERVICIO: ['precio', 'Producto'],
      TURNO: ['servicio', 'pago', 'car'],
      USUARIO: [],
      PROVEEDOR: [],
      PAGO: [],
      CAR: ['user'],
    };

    return relationsMap[entidad] || [];
  }

  /**
   * Obtiene el repositorio correspondiente para una entidad
   */
  private getRepository(entidad: string): Repository<any> | null {
    const repositories: { [key: string]: Repository<any> } = {
      USUARIO: this.usersRepository,
      TURNO: this.turnoRepository,
      SERVICIO: this.servicioRepository,
      PRODUCTO: this.productoRepository,
      PROVEEDOR: this.supplierRepository,
      PAGO: this.pagoRepository,
      CAR: this.carRepository,
    };

    return repositories[entidad] || null;
  }

  /**
   * Limpia los datos sensibles antes de guardarlos en auditoría
   */
  private limpiarDatos(datos: any): any {
    if (!datos) return null;

    const datosLimpios = { ...datos };

    // Eliminar campos sensibles
    const camposSensibles = ['password', 'token', 'refreshToken', 'apiKey'];
    camposSensibles.forEach((campo) => {
      if (datosLimpios[campo]) {
        datosLimpios[campo] = '***';
      }
    });

    // Eliminar campos internos que no deben mostrarse en auditoría
    const camposInternos = ['isDeleted', 'createdAt', 'updatedAt'];
    camposInternos.forEach((campo) => {
      delete datosLimpios[campo];
    });

    // Simplificar relación de suppliers en productos (solo id y name)
    if (datosLimpios.suppliers && Array.isArray(datosLimpios.suppliers)) {
      datosLimpios.suppliers = datosLimpios.suppliers.map((supplier) => ({
        id: supplier.id,
        name: supplier.name,
      }));
    }

    // Eliminar relaciones circulares y campos muy grandes
    return JSON.parse(JSON.stringify(datosLimpios, this.getCircularReplacer()));
  }

  /**
   * Formatea los datos según el tipo de entidad para mostrarlos de forma legible
   */
  private formatearDatosParaAuditoria(
    datos: any,
    entidad: string,
    accion: string,
  ): any {
    if (!datos) return null;

    // Primero limpiar datos sensibles
    const datosLimpios = this.limpiarDatos(datos);

    // Luego formatear según el tipo de entidad
    let datosFormateados = datosLimpios;

    switch (entidad) {
      case 'SERVICIO':
        datosFormateados = AuditFormatterHelper.formatServicio(datosLimpios);
        break;
      case 'PRODUCTO':
        datosFormateados = AuditFormatterHelper.formatProducto(datosLimpios);
        break;
      case 'PROVEEDOR':
        datosFormateados = AuditFormatterHelper.formatProveedor(datosLimpios);
        break;
      case 'TURNO':
        datosFormateados = AuditFormatterHelper.formatTurno(datosLimpios);
        break;
      case 'USUARIO':
        datosFormateados = AuditFormatterHelper.formatUsuario(datosLimpios);
        break;
      case 'CAR':
        datosFormateados = AuditFormatterHelper.formatCar(datosLimpios);
        break;
      case 'COTIZACION':
        datosFormateados = AuditFormatterHelper.formatCotizacion(
          datosLimpios,
          accion,
        );
        break;
      case 'PAGO':
        datosFormateados = AuditFormatterHelper.formatPago(datosLimpios);
        break;
      case 'STOCK':
        if (accion === 'ENVIAR_EMAIL') {
          datosFormateados =
            AuditFormatterHelper.formatEmailProveedor(datosLimpios);
        }
        break;
      case 'SISTEMA':
        datosFormateados =
          AuditFormatterHelper.formatConfiguracion(datosLimpios);
        break;
      default:
        // Para otros casos, mantener el formato original limpio
        datosFormateados = datosLimpios;
    }

    return datosFormateados;
  }

  /**
   * Reemplazador para evitar referencias circulares
   */
  private getCircularReplacer() {
    const seen = new WeakSet();
    return (key: string, value: any) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }
      return value;
    };
  }

  /**
   * Calcula los cambios específicos entre datos anteriores y nuevos
   */
  private calcularCambios(datosAnteriores: any, datosNuevos: any): any {
    const cambios: any = {};

    // Campos que deben ser excluidos de la comparación
    const camposExcluidos = [
      'id',
      'createdAt',
      'updatedAt',
      'message',
      'isDeleted',
    ];

    // Comparar todos los campos
    Object.keys(datosNuevos).forEach((key) => {
      // Excluir campos que no deben mostrarse como cambios
      if (camposExcluidos.includes(key)) {
        return;
      }

      const valorAnterior = datosAnteriores[key];
      const valorNuevo = datosNuevos[key];

      // Comparar valores
      if (valorAnterior !== undefined) {
        // Para arrays y objetos, comparar en formato JSON
        if (
          typeof valorAnterior === 'object' ||
          typeof valorNuevo === 'object'
        ) {
          if (JSON.stringify(valorAnterior) !== JSON.stringify(valorNuevo)) {
            cambios[key] = {
              anterior: valorAnterior,
              nuevo: valorNuevo,
            };
          }
        } else if (valorAnterior !== valorNuevo) {
          // Para valores primitivos, comparar directamente
          cambios[key] = {
            anterior: valorAnterior,
            nuevo: valorNuevo,
          };
        }
      }
    });

    return Object.keys(cambios).length > 0 ? cambios : null;
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
    const { accion, entidad, descripcion, capturarDatosAnteriores } =
      auditoriaMetadata;

    // Capturar datos anteriores si es necesario (antes de ejecutar la operación)
    let datosAnterioresPromise: Promise<any> = Promise.resolve(null);

    if (
      capturarDatosAnteriores &&
      (accion === 'ELIMINAR' ||
        accion === 'MODIFICAR' ||
        accion === 'ACTIVAR_DESACTIVAR' ||
        accion === 'MARCAR_COMPLETADO' ||
        accion === 'MARCAR_PAGADO' ||
        accion === 'CANCELAR')
    ) {
      datosAnterioresPromise = this.capturarDatosAnteriores(
        request,
        entidad,
      ).catch(() => null);
    }

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
              return new HttpException('Unauthorized, ' + error.message, 401);
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

          // Obtener datos anteriores (si se capturaron)
          const datosAnteriores = await datosAnterioresPromise;

          // Obtener datos nuevos del body o resultado
          let datosNuevos = null;
          if (accion === 'CREAR') {
            // Para CREAR, usar el resultado (entidad creada con relaciones) en lugar del body (solo IDs)
            if (result && typeof result === 'object') {
              datosNuevos = this.limpiarDatos(result);
            } else {
              datosNuevos = this.limpiarDatos(request.body);
            }
          } else if (
            accion === 'MODIFICAR' ||
            (result && typeof result === 'object')
          ) {
            datosNuevos = this.limpiarDatos(result);
          }

          // Calcular cambios específicos si hay datos anteriores y nuevos
          let cambios = null;
          if (datosAnteriores && datosNuevos) {
            cambios = this.calcularCambios(datosAnteriores, datosNuevos);
          }

          // Registrar la auditoría con datos SIN formatear (guardar datos crudos)
          // El formateo se hará en el frontend al mostrar los datos
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
            cambios,
          );
        } catch (error) {
          console.error('Error al registrar auditoría:', error);
          // No lanzamos el error para no afectar la operación principal
        }
      }),
    );
  }
}
