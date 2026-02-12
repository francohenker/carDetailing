import { Test, TestingModule } from '@nestjs/testing';
import { PagoController } from './pago.controller';
import { PagoService } from './pago.service';
import { HttpException } from '@nestjs/common';
import { estado_pago } from '../enums/estado_pago.enum';
import { metodo_pago } from '../enums/metodo_pago.enum';

describe('PagoController', () => {
  let controller: PagoController;
  let service: PagoService;

  const mockPago = {
    id: 1,
    monto: 5000,
    metodo_pago: metodo_pago.EFECTIVO,
    estado: estado_pago.PAGADO,
    fecha_pago: new Date(),
  };

  const mockPagoService = {
    markTurnoAsPaid: jest.fn(),
    createMercadoPagoPreference: jest.fn(),
    verifyPayment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PagoController],
      providers: [
        {
          provide: PagoService,
          useValue: mockPagoService,
        },
      ],
    }).compile();

    controller = module.get<PagoController>(PagoController);
    service = module.get<PagoService>(PagoService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('markTurnoAsPaid', () => {
    it('debe marcar un turno como pagado correctamente', async () => {
      const paymentData = { monto: 5000, metodo: 'EFECTIVO' };
      mockPagoService.markTurnoAsPaid.mockResolvedValue(mockPago);

      const result = await controller.markTurnoAsPaid('1', paymentData);

      expect(service.markTurnoAsPaid).toHaveBeenCalledWith(1, 5000, 'EFECTIVO');
      expect(result).toEqual(mockPago);
    });

    it('debe lanzar HttpException con ID de turno inválido', async () => {
      const paymentData = { monto: 5000, metodo: 'EFECTIVO' };

      await expect(
        controller.markTurnoAsPaid('invalid', paymentData),
      ).rejects.toThrow(HttpException);
      await expect(
        controller.markTurnoAsPaid('invalid', paymentData),
      ).rejects.toThrow('Invalid turno ID');
    });

    it('debe manejar errores del servicio', async () => {
      const paymentData = { monto: 5000, metodo: 'EFECTIVO' };
      mockPagoService.markTurnoAsPaid.mockRejectedValue(
        new Error('Turno not found'),
      );

      await expect(
        controller.markTurnoAsPaid('1', paymentData),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('createMercadoPagoPreference', () => {
    it('debe crear una preferencia de MercadoPago', async () => {
      const turnoData = { turnoId: 1 };
      const mockPreference = {
        init_point: 'https://mercadopago.com/checkout',
      };

      mockPagoService.createMercadoPagoPreference.mockResolvedValue(
        mockPreference,
      );

      const result = await controller.createMercadoPagoPreference(turnoData);

      expect(service.createMercadoPagoPreference).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockPreference);
    });

    it('debe manejar errores al crear preferencia', async () => {
      const turnoData = { turnoId: 999 };
      mockPagoService.createMercadoPagoPreference.mockRejectedValue(
        new Error('Turno not found'),
      );

      await expect(
        controller.createMercadoPagoPreference(turnoData),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('verifyPayment', () => {
    it('debe verificar un pago correctamente', async () => {
      const paymentData = { paymentId: 'payment_123' };
      const mockVerification = { status: 'approved' };

      mockPagoService.verifyPayment.mockResolvedValue(mockVerification);

      const result = await controller.verifyPayment(paymentData);

      expect(service.verifyPayment).toHaveBeenCalledWith('payment_123');
      expect(result).toEqual(mockVerification);
    });

    it('debe manejar errores en la verificación', async () => {
      const paymentData = { paymentId: 'invalid_payment' };
      mockPagoService.verifyPayment.mockRejectedValue(
        new Error('Payment not found'),
      );

      await expect(controller.verifyPayment(paymentData)).rejects.toThrow(
        HttpException,
      );
    });
  });
});
