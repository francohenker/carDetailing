import { Injectable, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pago } from './entities/pago.entity';
import { Turno } from '../turno/entities/turno.entity';
import { estado_pago } from '../enums/estado_pago.enum';
import { metodo_pago } from '../enums/metodo_pago.enum';

@Injectable()
export class PagoService {
  constructor(
    @InjectRepository(Pago)
    private readonly pagoRepository: Repository<Pago>,
    @InjectRepository(Turno)
    private readonly turnoRepository: Repository<Turno>,
  ) {}

  async markTurnoAsPaid(
    turnoId: number,
    monto: number,
    metodo: string,
  ): Promise<Pago> {
    // Buscar el turno
    const turno = await this.turnoRepository.findOne({
      where: { id: turnoId },
      relations: ['pago'],
    });

    if (!turno) {
      throw new HttpException('Turno not found', 404);
    }

    // Verificar si ya existe un pago PAGADO para este turno
    const existingPaidPayment = turno.pago.find(
      (pago) => pago.estado === estado_pago.PAGADO,
    );

    if (existingPaidPayment) {
      throw new HttpException('This turno is already paid', 400);
    }

    // Crear nuevo pago
    const newPago = new Pago(
      monto,
      new Date(),
      metodo as metodo_pago,
      estado_pago.PAGADO,
      turno,
    );

    return await this.pagoRepository.save(newPago);
  }
}
