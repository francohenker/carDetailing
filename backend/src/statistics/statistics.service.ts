import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Turno } from '../turno/entities/turno.entity';
import { Users } from '../users/entities/users.entity';
import { Servicio } from '../servicio/entities/servicio.entity';
import { Pago } from '../pago/entities/pago.entity';
import { MoreThan, Repository, Between } from 'typeorm';
import { estado_turno } from '../enums/estado_turno.enum';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(Turno)
    private readonly turnoRepository: Repository<Turno>,
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
    @InjectRepository(Servicio)
    private readonly servicioRepository: Repository<Servicio>,
    @InjectRepository(Pago)
    private readonly pagoRepository: Repository<Pago>,
  ) {}

  async getDashboardStatistics() {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      1,
    );
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    // 1. Ingresos del mes actual
    const currentMonthRevenue = await this.pagoRepository
      .createQueryBuilder('pago')
      .select('SUM(pago.monto)', 'total')
      .where('pago.fecha_pago >= :startOfMonth', { startOfMonth })
      .getRawOne();

    // 2. Ingresos del mes pasado
    const lastMonthRevenue = await this.pagoRepository
      .createQueryBuilder('pago')
      .select('SUM(pago.monto)', 'total')
      .where('pago.fecha_pago BETWEEN :start AND :end', {
        start: startOfLastMonth,
        end: endOfLastMonth,
      })
      .getRawOne();

    // 3. Total de turnos del mes actual
    const currentMonthTurnos = await this.turnoRepository.count({
      where: { fechaHora: MoreThan(startOfMonth) },
    });

    // 4. Total de turnos completados
    const completedTurnos = await this.turnoRepository.count({
      where: { estado: estado_turno.FINALIZADO },
    });

    // 5. Nuevos usuarios este mes
    const newUsersThisMonth = await this.usersRepository.count({
      where: { createdAt: MoreThan(startOfMonth) },
    });

    // 6. Servicios más populares (Top 5) con estado de turnos
    const popularServices = await this.turnoRepository
      .createQueryBuilder('turno')
      .leftJoinAndSelect('turno.servicio', 'servicio')
      .select('servicio.name', 'name')
      .addSelect('COUNT(servicio.id)', 'total')
      .addSelect(
        `COUNT(CASE WHEN turno.estado = '${estado_turno.FINALIZADO}' THEN 1 END)`,
        'realizados',
      )
      .addSelect(
        `COUNT(CASE WHEN turno.estado = '${estado_turno.PENDIENTE}' THEN 1 END)`,
        'pendientes',
      )
      .addSelect(
        `COUNT(CASE WHEN turno.estado = '${estado_turno.CANCELADO}' THEN 1 END)`,
        'cancelados',
      )
      .groupBy('servicio.name')
      .orderBy('total', 'DESC')
      .limit(5)
      .getRawMany();

    // 7. Ingresos por mes (últimos 6 meses)
    const monthlyRevenue = await this.getMonthlyRevenue();

    // 8. Estado de turnos (distribución)
    const turnosStatus = await this.turnoRepository
      .createQueryBuilder('turno')
      .select('turno.estado', 'estado')
      .addSelect('COUNT(*)', 'count')
      .groupBy('turno.estado')
      .getRawMany();

    // 9. Turnos por día (última semana)
    const weeklyTurnos = await this.getWeeklyTurnos();

    // Calcular el cambio porcentual en ingresos
    const revenueChange = this.calculatePercentageChange(
      lastMonthRevenue.total || 0,
      currentMonthRevenue.total || 0,
    );

    return {
      currentMonthRevenue: currentMonthRevenue.total || 0,
      revenueChange,
      currentMonthTurnos,
      completedTurnos,
      newUsersThisMonth,
      popularServices,
      monthlyRevenue,
      turnosStatus,
      weeklyTurnos,
    };
  }

  private calculatePercentageChange(previous: number, current: number): number {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
  }

  private async getMonthlyRevenue() {
    const monthsData = [];
    const today = new Date();

    // Obtener datos de los últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const nextMonth = new Date(
        today.getFullYear(),
        today.getMonth() - i + 1,
        1,
      );

      const monthRevenue = await this.pagoRepository
        .createQueryBuilder('pago')
        .select('SUM(pago.monto)', 'total')
        .where('pago.fecha_pago >= :start AND pago.fecha_pago < :end', {
          start: targetDate,
          end: nextMonth,
        })
        .getRawOne();

      monthsData.push({
        month: targetDate.toLocaleString('es-AR', {
          month: 'long',
          year: 'numeric',
        }),
        revenue: parseFloat(monthRevenue.total) || 0,
      });
    }

    return monthsData;
  }

  private async getWeeklyTurnos() {
    const weekData = [];
    const today = new Date();

    // Obtener datos de los últimos 7 días
    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date();
      targetDate.setDate(today.getDate() - i);
      targetDate.setHours(0, 0, 0, 0);

      const nextDay = new Date(targetDate);
      nextDay.setDate(targetDate.getDate() + 1);
      nextDay.setHours(0, 0, 0, 0);

      const dayTurnos = await this.turnoRepository.count({
        where: {
          fechaHora: Between(targetDate, nextDay),
        },
      });

      weekData.push({
        day: targetDate.toLocaleDateString('es-AR', {
          weekday: 'short',
          day: 'numeric',
        }),
        turnos: dayTurnos,
      });
    }

    return weekData;
  }

  async getFilteredStatistics(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Ajustar el final del día para incluir todo el día
    end.setHours(23, 59, 59, 999);

    // 1. Ingresos en el período
    const periodRevenue = await this.pagoRepository
      .createQueryBuilder('pago')
      .select('SUM(pago.monto)', 'total')
      .where('pago.fecha_pago BETWEEN :start AND :end', { start, end })
      .getRawOne();

    // 2. Turnos en el período
    const periodTurnos = await this.turnoRepository.count({
      where: {
        fechaHora: Between(start, end),
      },
    });

    // 3. Turnos completados en el período
    const completedTurnos = await this.turnoRepository.count({
      where: {
        estado: estado_turno.FINALIZADO,
        fechaHora: Between(start, end),
      },
    });

    // 4. Nuevos usuarios en el período
    const newUsers = await this.usersRepository.count({
      where: {
        createdAt: Between(start, end),
      },
    });

    // 5. Servicios más populares en el período con estado de turnos
    const popularServices = await this.turnoRepository
      .createQueryBuilder('turno')
      .leftJoinAndSelect('turno.servicio', 'servicio')
      .select('servicio.name', 'name')
      .addSelect('COUNT(servicio.id)', 'total')
      .addSelect(
        `COUNT(CASE WHEN turno.estado = '${estado_turno.FINALIZADO}' THEN 1 END)`,
        'realizados',
      )
      .addSelect(
        `COUNT(CASE WHEN turno.estado = '${estado_turno.PENDIENTE}' THEN 1 END)`,
        'pendientes',
      )
      .addSelect(
        `COUNT(CASE WHEN turno.estado = '${estado_turno.CANCELADO}' THEN 1 END)`,
        'cancelados',
      )
      .where('turno.fechaHora BETWEEN :start AND :end', { start, end })
      .groupBy('servicio.name')
      .orderBy('total', 'DESC')
      .limit(10)
      .getRawMany();

    // 6. Ingresos por mes en el período
    const monthlyRevenue = await this.getMonthlyRevenueFiltered(start, end);

    // 7. Estado de turnos en el período
    const turnosStatus = await this.turnoRepository
      .createQueryBuilder('turno')
      .select('turno.estado', 'estado')
      .addSelect('COUNT(*)', 'count')
      .where('turno.fechaHora BETWEEN :start AND :end', { start, end })
      .groupBy('turno.estado')
      .getRawMany();

    // 8. Turnos por día en el período (máximo 30 días)
    const dailyTurnos = await this.getDailyTurnosFiltered(start, end);

    // 9. Ingresos diarios en el período
    const dailyRevenue = await this.getDailyRevenueFiltered(start, end);

    // 10. Top clientes por facturación en el período
    const topClients = await this.getTopClientsFiltered(start, end);

    return {
      period: {
        startDate: startDate,
        endDate: endDate,
        days: Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)),
      },
      periodRevenue: periodRevenue.total || 0,
      periodTurnos,
      completedTurnos,
      newUsers,
      popularServices,
      monthlyRevenue,
      turnosStatus,
      dailyTurnos,
      dailyRevenue,
      topClients,
    };
  }

  private async getMonthlyRevenueFiltered(startDate: Date, endDate: Date) {
    const monthsData = [];
    const currentDate = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      1,
    );
    const endMonth = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);

    while (currentDate <= endMonth) {
      const monthStart = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1,
      );
      const monthEnd = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0,
        23,
        59,
        59,
      );

      const monthRevenue = await this.pagoRepository
        .createQueryBuilder('pago')
        .select('SUM(pago.monto)', 'total')
        .where('pago.fecha_pago BETWEEN :start AND :end', {
          start: monthStart,
          end: monthEnd,
        })
        .getRawOne();

      monthsData.push({
        month: currentDate.toLocaleString('es-AR', {
          month: 'long',
          year: 'numeric',
        }),
        revenue: parseFloat(monthRevenue.total) || 0,
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return monthsData;
  }

  private async getDailyTurnosFiltered(startDate: Date, endDate: Date) {
    const dailyData = [];
    const daysDiff = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24),
    );

    // Limitar a 30 días para evitar sobrecarga
    const maxDays = Math.min(daysDiff, 30);

    for (let i = 0; i < maxDays; i++) {
      const targetDate = new Date(startDate);
      targetDate.setDate(startDate.getDate() + i);
      targetDate.setHours(0, 0, 0, 0);

      const nextDay = new Date(targetDate);
      nextDay.setDate(targetDate.getDate() + 1);

      const dayTurnos = await this.turnoRepository.count({
        where: {
          fechaHora: Between(targetDate, nextDay),
        },
      });

      dailyData.push({
        date: targetDate.toISOString().split('T')[0],
        day: targetDate.toLocaleDateString('es-AR', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        }),
        turnos: dayTurnos,
      });
    }

    return dailyData;
  }

  private async getDailyRevenueFiltered(startDate: Date, endDate: Date) {
    const dailyData = [];
    const daysDiff = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24),
    );

    // Limitar a 30 días para evitar sobrecarga
    const maxDays = Math.min(daysDiff, 30);

    for (let i = 0; i < maxDays; i++) {
      const targetDate = new Date(startDate);
      targetDate.setDate(startDate.getDate() + i);
      targetDate.setHours(0, 0, 0, 0);

      const nextDay = new Date(targetDate);
      nextDay.setDate(targetDate.getDate() + 1);

      const dayRevenue = await this.pagoRepository
        .createQueryBuilder('pago')
        .select('SUM(pago.monto)', 'total')
        .where('pago.fecha_pago BETWEEN :start AND :end', {
          start: targetDate,
          end: nextDay,
        })
        .getRawOne();

      dailyData.push({
        date: targetDate.toISOString().split('T')[0],
        day: targetDate.toLocaleDateString('es-AR', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        }),
        revenue: parseFloat(dayRevenue.total) || 0,
      });
    }

    return dailyData;
  }

  private async getTopClientsFiltered(startDate: Date, endDate: Date) {
    console.log('🔍 Debug - startDate:', startDate, 'endDate:', endDate);

    try {
      const query = this.pagoRepository
        .createQueryBuilder('pago')
        .innerJoin('pago.turno', 'turno') // Cambiar a innerJoin para evitar NULLs
        .innerJoin('turno.car', 'car') // Cambiar a innerJoin
        .innerJoin('car.user', 'user') // Cambiar a innerJoin
        .select('user.id', 'userId')
        .addSelect("CONCAT(user.firstname, ' ', user.lastname)", 'clientName') // Usar firstname + lastname
        .addSelect('user.email', 'clientEmail')
        .addSelect('COALESCE(SUM(pago.monto), 0)', 'totalSpent') // Manejar NULLs
        .addSelect('COUNT(DISTINCT turno.id)', 'turnosCount')
        .addSelect(
          `COUNT(DISTINCT CASE WHEN turno.estado = '${estado_turno.FINALIZADO}' THEN turno.id END)`,
          'turnosRealizados',
        )
        .where('pago.fecha_pago BETWEEN :start AND :end', {
          start: startDate,
          end: endDate,
        })
        .andWhere('pago.monto IS NOT NULL') // Filtrar pagos nulos
        .andWhere('user.firstname IS NOT NULL') // Filtrar usuarios sin nombre
        .groupBy('user.id, user.firstname, user.lastname, user.email')
        .orderBy('COALESCE(SUM(pago.monto), 0)', 'DESC')
        .limit(10);

      console.log('🔍 SQL Query:', query.getSql());
      console.log('🔍 Parameters:', query.getParameters());

      const topClients = await query.getRawMany();
      console.log('🔍 Raw results:', topClients);

      return topClients.map((client) => ({
        userId: parseInt(client.userId),
        clientName: client.clientName || 'Sin nombre',
        clientEmail: client.clientEmail || 'Sin email',
        totalSpent: parseFloat(client.totalSpent) || 0,
        turnosCount: parseInt(client.turnosCount) || 0,
        turnosRealizados: parseInt(client.turnosRealizados) || 0,
      }));
    } catch (error) {
      console.error('❌ Error en getTopClientsFiltered:', error);
      // Retornar array vacío en caso de error para no romper la aplicación
      return [];
    }
  }
}
