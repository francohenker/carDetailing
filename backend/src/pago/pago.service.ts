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
    if (turno.estado === 'cancelado') {
      throw new HttpException('Cannot mark a canceled turno as paid', 400);
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
      null, // No payment_id for manual payments
    );

    return await this.pagoRepository.save(newPago);
  }

  async createMercadoPagoPreference(
    turnoId: number,
  ): Promise<{ init_point: string }> {
    const turno = await this.turnoRepository.findOne({
      where: { id: turnoId },
      relations: ['car', 'car.user', 'servicio', 'pago'],
    });

    if (!turno) {
      throw new HttpException('Turno not found', 404);
    }
    if (turno.estado === 'cancelado') {
      throw new HttpException('Cannot pay for a canceled turno', 400);
    }

    // Verificar si ya existe un pago PAGADO para este turno
    const existingPaidPayment = turno.pago.find(
      (pago) => pago.estado === estado_pago.PAGADO,
    );

    if (existingPaidPayment) {
      throw new HttpException('This turno is already paid', 400);
    }

    const preference = {
      items: [
        {
          title: turno.servicio.map((s) => s.name).join(', '),
          quantity: 1,
          currency_id: 'ARS',
          unit_price: turno.totalPrice,
        },
      ],
      back_urls: {
        success: `${process.env.URL_FRONTEND}/user/profile`,
        failure: `${process.env.URL_FRONTEND}/pago-fallido`,
        pending: `${process.env.URL_FRONTEND}/pago-pendiente`,
      },
      auto_return: 'approved', // Redirige automáticamente cuando el pago se aprueba
      external_reference: turno.id.toString(), // Usar el ID del turno como referencia externa
    };
    //create a preference in mercado pago
    const response = await fetch(
      'https://api.mercadopago.com/checkout/preferences',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        },
        body: JSON.stringify(preference),
      },
    );
    const data = await response.json();
    return { init_point: data.init_point }; // Esta es la URL de redirección
  }

  async verifyPayment(payment_id: string): Promise<any> {
    const response = await fetch(
      `${process.env.MP_API}/v1/payments/${payment_id}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        },
      },
    );
    const pagoMP = await response.json();
    if (pagoMP.status === 'approved') {
      // Buscar el turno por referencia externa
      const turno = await this.turnoRepository.findOne({
        where: { id: pagoMP.external_reference },
        relations: ['pago'],
      });

      if (!turno) {
        throw new HttpException('Turno not found', 404);
      }

      // Buscar el pago pendiente de MercadoPago
      // const pagoPendiente = turno.pago.find(
      //   (p) =>
      //     p.metodo === metodo_pago.MERCADO_PAGO &&
      //     p.estado === estado_pago.PENDIENTE,
      // );

      // if (!pagoPendiente) {
      //   throw new HttpException('No pending MercadoPago payment found', 404);
      // }

      // Actualizar el pago con el payment_id y estado PAGADO
      // await this.pagoRepository.update(pagoPendiente.id, {
      //   payment_id: payment_id,
      //   estado: estado_pago.PAGADO,
      // });

      // unicamente se acepta un pago por turno (hasta ahora)
      if (turno.pago.length === 0) {
        const newPago = new Pago(
          pagoMP.transaction_amount,
          new Date(),
          metodo_pago.MERCADO_PAGO,
          estado_pago.PAGADO,
          turno,
          payment_id,
        );
        await this.pagoRepository.save(newPago);
      }
      // else {
      //   await this.pagoRepository.update(turno.pago[0].id, {
      //     payment_id: payment_id,
      //     estado: estado_pago.PAGADO,
      //   });
      // }

      return { message: 'Payment verified and turno marked as paid' };
    } else {
      throw new HttpException('Payment not approved', 400);
    }
  }
}
