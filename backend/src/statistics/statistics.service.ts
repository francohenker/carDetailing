import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Turno } from '../turno/entities/turno.entity';
import { Users } from '../users/entities/users.entity';
import { Servicio } from '../servicio/entities/servicio.entity';
import { Pago } from '../pago/entities/pago.entity';
import { MoreThan, Repository } from 'typeorm';
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

    // 6. Servicios más populares (Top 3)
    const popularServices = await this.turnoRepository
      .createQueryBuilder('turno')
      .leftJoinAndSelect('turno.servicio', 'servicio')
      .select('servicio.name', 'name')
      .addSelect('COUNT(servicio.id)', 'count')
      .groupBy('servicio.name')
      .orderBy('count', 'DESC')
      .limit(3)
      .getRawMany();

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
    };
  }

  private calculatePercentageChange(previous: number, current: number): number {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
  }
}
