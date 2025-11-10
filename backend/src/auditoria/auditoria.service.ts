import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  Auditoria,
  TipoAccion,
  TipoEntidad,
} from './entities/auditoria.entity';
import { CreateAuditoriaDto } from './dto/create-auditoria.dto';
import { FilterAuditoriaDto } from './dto/filter-auditoria.dto';

@Injectable()
export class AuditoriaService {
  constructor(
    @InjectRepository(Auditoria)
    private readonly auditoriaRepository: Repository<Auditoria>,
  ) {}

  async crear(createAuditoriaDto: CreateAuditoriaDto): Promise<Auditoria> {
    const auditoria = this.auditoriaRepository.create(createAuditoriaDto);
    return await this.auditoriaRepository.save(auditoria);
  }

  async registrarAccion(
    accion: TipoAccion,
    entidad: TipoEntidad,
    usuarioId?: number,
    entidadId?: number,
    descripcion?: string,
    datosAnteriores?: any,
    datosNuevos?: any,
    ip?: string,
    userAgent?: string,
    cambios?: any,
  ): Promise<Auditoria> {
    // Si hay cambios calculados, agregarlos a la descripción
    let descripcionFinal = descripcion;
    if (cambios && Object.keys(cambios).length > 0) {
      const cambiosTexto = Object.keys(cambios)
        .map((key) => {
          const cambio = cambios[key];
          return `${key}: "${cambio.anterior}" → "${cambio.nuevo}"`;
        })
        .join(', ');
      descripcionFinal = descripcion
        ? `${descripcion} - Cambios: ${cambiosTexto}`
        : `Cambios: ${cambiosTexto}`;
    }

    const auditoriaDto: CreateAuditoriaDto = {
      accion,
      entidad,
      usuarioId,
      entidadId,
      descripcion: descripcionFinal,
      datosAnteriores,
      datosNuevos,
      ip,
      userAgent,
    };

    return await this.crear(auditoriaDto);
  }

  async obtenerTodos(filtros: FilterAuditoriaDto = {}): Promise<{
    data: Auditoria[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      accion,
      entidad,
      entidadId,
      usuarioId,
      fechaInicio,
      fechaFin,
      page = 1,
      limit = 50,
    } = filtros;

    const queryBuilder = this.auditoriaRepository
      .createQueryBuilder('auditoria')
      .leftJoinAndSelect('auditoria.usuario', 'usuario')
      .orderBy('auditoria.fechaCreacion', 'DESC');

    // Aplicar filtros
    if (accion) {
      queryBuilder.andWhere('auditoria.accion = :accion', { accion });
    }

    if (entidad) {
      queryBuilder.andWhere('auditoria.entidad = :entidad', { entidad });
    }

    if (entidadId) {
      queryBuilder.andWhere('auditoria.entidadId = :entidadId', { entidadId });
    }

    if (usuarioId) {
      queryBuilder.andWhere('auditoria.usuarioId = :usuarioId', { usuarioId });
    }

    if (fechaInicio && fechaFin) {
      queryBuilder.andWhere(
        'auditoria.fechaCreacion BETWEEN :fechaInicio AND :fechaFin',
        {
          fechaInicio: new Date(fechaInicio),
          fechaFin: new Date(fechaFin),
        },
      );
    } else if (fechaInicio) {
      queryBuilder.andWhere('auditoria.fechaCreacion >= :fechaInicio', {
        fechaInicio: new Date(fechaInicio),
      });
    } else if (fechaFin) {
      queryBuilder.andWhere('auditoria.fechaCreacion <= :fechaFin', {
        fechaFin: new Date(fechaFin),
      });
    }

    // Paginación
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async obtenerPorId(id: number): Promise<Auditoria> {
    return await this.auditoriaRepository.findOne({
      where: { id },
      relations: ['usuario'],
    });
  }

  async obtenerEstadisticas(): Promise<{
    totalRegistros: number;
    registrosHoy: number;
    registrosEstaSemana: number;
    registrosEsteMes: number;
    registrosAyer: number;
    registrosSemanaAnterior: number;
    crecimientoHoy: number;
    crecimientoSemana: number;
    accionesMasComunes: Array<{ accion: string; cantidad: number }>;
    entidadesMasAuditadas: Array<{ entidad: string; cantidad: number }>;
    usuariosMasActivos: Array<{ usuario: string; cantidad: number }>;
    distribucionPorHora: Array<{ hora: number; cantidad: number }>;
  }> {
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
    );

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Fechas para comparaciones
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const startOfYesterday = new Date(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate(),
    );
    const endOfYesterday = new Date(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate(),
      23,
      59,
      59,
    );

    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfWeek.getDate() - 7);
    const endOfLastWeek = new Date(startOfWeek);
    endOfLastWeek.setMilliseconds(-1);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0,
      23,
      59,
      59,
    );

    // Total de registros
    const totalRegistros = await this.auditoriaRepository.count();

    // Registros de hoy
    const registrosHoy = await this.auditoriaRepository.count({
      where: {
        fechaCreacion: Between(startOfDay, endOfDay),
      },
    });

    // Registros de esta semana
    const registrosEstaSemana = await this.auditoriaRepository.count({
      where: {
        fechaCreacion: Between(startOfWeek, endOfDay),
      },
    });

    // Registros de este mes
    const registrosEsteMes = await this.auditoriaRepository.count({
      where: {
        fechaCreacion: Between(startOfMonth, endOfMonth),
      },
    });

    // Registros de ayer
    const registrosAyer = await this.auditoriaRepository.count({
      where: {
        fechaCreacion: Between(startOfYesterday, endOfYesterday),
      },
    });

    // Registros de la semana anterior
    const registrosSemanaAnterior = await this.auditoriaRepository.count({
      where: {
        fechaCreacion: Between(startOfLastWeek, endOfLastWeek),
      },
    });

    // Cálculo de crecimiento
    const crecimientoHoy =
      registrosAyer > 0
        ? Math.round(((registrosHoy - registrosAyer) / registrosAyer) * 100)
        : registrosHoy > 0
          ? 100
          : 0;

    const crecimientoSemana =
      registrosSemanaAnterior > 0
        ? Math.round(
            ((registrosEstaSemana - registrosSemanaAnterior) /
              registrosSemanaAnterior) *
              100,
          )
        : registrosEstaSemana > 0
          ? 100
          : 0;

    // Acciones más comunes
    const accionesMasComunes = await this.auditoriaRepository
      .createQueryBuilder('auditoria')
      .select('auditoria.accion', 'accion')
      .addSelect('COUNT(auditoria.accion)', 'cantidad')
      .groupBy('auditoria.accion')
      .orderBy('cantidad', 'DESC')
      .limit(5)
      .getRawMany();

    // Entidades más auditadas
    const entidadesMasAuditadas = await this.auditoriaRepository
      .createQueryBuilder('auditoria')
      .select('auditoria.entidad', 'entidad')
      .addSelect('COUNT(auditoria.entidad)', 'cantidad')
      .groupBy('auditoria.entidad')
      .orderBy('cantidad', 'DESC')
      .limit(5)
      .getRawMany();

    // Usuarios más activos
    const usuariosMasActivos = await this.auditoriaRepository
      .createQueryBuilder('auditoria')
      .leftJoin('auditoria.usuario', 'usuario')
      .select("CONCAT(usuario.firstname, ' ', usuario.lastname)", 'usuario')
      .addSelect('COUNT(auditoria.id)', 'cantidad')
      .where('auditoria.usuarioId IS NOT NULL')
      .groupBy('usuario.id, usuario.firstname, usuario.lastname')
      .orderBy('cantidad', 'DESC')
      .limit(5)
      .getRawMany();

    // Distribución por hora (últimas 24 horas)
    const distribucionPorHora = await this.auditoriaRepository
      .createQueryBuilder('auditoria')
      .select('EXTRACT(HOUR FROM auditoria.fechaCreacion)', 'hora')
      .addSelect('COUNT(auditoria.id)', 'cantidad')
      .where('auditoria.fechaCreacion >= :startOfDay', { startOfDay })
      .groupBy('EXTRACT(HOUR FROM auditoria.fechaCreacion)')
      .orderBy('hora', 'ASC')
      .getRawMany();

    return {
      totalRegistros,
      registrosHoy,
      registrosEstaSemana,
      registrosEsteMes,
      registrosAyer,
      registrosSemanaAnterior,
      crecimientoHoy,
      crecimientoSemana,
      accionesMasComunes: accionesMasComunes.map((item) => ({
        accion: item.accion,
        cantidad: parseInt(item.cantidad),
      })),
      entidadesMasAuditadas: entidadesMasAuditadas.map((item) => ({
        entidad: item.entidad,
        cantidad: parseInt(item.cantidad),
      })),
      usuariosMasActivos: usuariosMasActivos.map((item) => ({
        usuario: item.usuario || 'Sistema',
        cantidad: parseInt(item.cantidad),
      })),
      distribucionPorHora: distribucionPorHora.map((item) => ({
        hora: parseInt(item.hora),
        cantidad: parseInt(item.cantidad),
      })),
    };
  }
}
