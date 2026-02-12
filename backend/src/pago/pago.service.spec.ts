import { Test, TestingModule } from '@nestjs/testing';
import { PagoService } from './pago.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Pago } from './entities/pago.entity';
import { Turno } from '../turno/entities/turno.entity';
import { Repository } from 'typeorm';
import { HttpException } from '@nestjs/common';
import { estado_pago } from '../enums/estado_pago.enum';
import { metodo_pago } from '../enums/metodo_pago.enum';

describe('PagoService', () => {
  let service: PagoService;
  let pagoRepository: Repository<Pago>;
  let turnoRepository: Repository<Turno>;

  const mockTurno = {
    id: 1,
    estado: 'completado',
    pago: [],
    car: { user: { email: 'test@example.com' } },
    servicio: [{ name: 'Lavado Completo' }],
    totalPrice: 5000,
  };

  const mockPago = {
    id: 1,
    monto: 5000,
    fecha_pago: new Date(),
    metodo_pago: metodo_pago.EFECTIVO,
    estado: estado_pago.PAGADO,
    turno: mockTurno,
  };

  const mockPagoRepository = {
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockTurnoRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PagoService,
        {
          provide: getRepositoryToken(Pago),
          useValue: mockPagoRepository,
        },
        {
          provide: getRepositoryToken(Turno),
          useValue: mockTurnoRepository,
        },
      ],
    }).compile();

    service = module.get<PagoService>(PagoService);
    pagoRepository = module.get<Repository<Pago>>(getRepositoryToken(Pago));
    turnoRepository = module.get<Repository<Turno>>(
      getRepositoryToken(Turno),
    );

    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('markTurnoAsPaid', () => {
    it('debe marcar un turno como pagado correctamente', async () => {
      mockTurnoRepository.findOne.mockResolvedValue(mockTurno);
      mockPagoRepository.save.mockResolvedValue(mockPago);

      const result = await service.markTurnoAsPaid(
        1,
        5000,
        metodo_pago.EFECTIVO,
      );

      expect(mockTurnoRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['pago'],
      });
      expect(mockPagoRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('debe lanzar HttpException si el turno no existe', async () => {
      mockTurnoRepository.findOne.mockResolvedValue(null);

      await expect(
        service.markTurnoAsPaid(999, 5000, metodo_pago.EFECTIVO),
      ).rejects.toThrow(HttpException);
      await expect(
        service.markTurnoAsPaid(999, 5000, metodo_pago.EFECTIVO),
      ).rejects.toThrow('Turno not found');
    });

    it('debe lanzar HttpException si el turno está cancelado', async () => {
      const turnoCancel = { ...mockTurno, estado: 'cancelado' };
      mockTurnoRepository.findOne.mockResolvedValue(turnoCancel);

      await expect(
        service.markTurnoAsPaid(1, 5000, metodo_pago.EFECTIVO),
      ).rejects.toThrow('Cannot mark a canceled turno as paid');
    });

    it('debe lanzar HttpException si el turno ya está pagado', async () => {
      const turnoConPago = {
        ...mockTurno,
        pago: [{ estado: estado_pago.PAGADO }],
      };
      mockTurnoRepository.findOne.mockResolvedValue(turnoConPago);

      await expect(
        service.markTurnoAsPaid(1, 5000, metodo_pago.EFECTIVO),
      ).rejects.toThrow('This turno is already paid');
    });
  });

  describe('createMercadoPagoPreference', () => {
    beforeEach(() => {
      process.env.URL_FRONTEND = 'http://localhost:3000';
      process.env.ACCESS_TOKEN_MERCADOPAGO = 'test_token';
    });

    it('debe crear una preferencia de MercadoPago correctamente', async () => {
      const mockResponse = {
        init_point: 'https://mercadopago.com/checkout',
        id: 'preference_id',
      };

      mockTurnoRepository.findOne.mockResolvedValue(mockTurno);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await service.createMercadoPagoPreference(1);

      expect(mockTurnoRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['car', 'car.user', 'servicio', 'pago'],
      });
      expect(result).toHaveProperty('init_point');
    });

    it('debe lanzar HttpException si el turno no existe', async () => {
      mockTurnoRepository.findOne.mockResolvedValue(null);

      await expect(service.createMercadoPagoPreference(999)).rejects.toThrow(
        'Turno not found',
      );
    });

    it('debe lanzar HttpException si el turno está cancelado', async () => {
      const turnoCancelado = { ...mockTurno, estado: 'cancelado' };
      mockTurnoRepository.findOne.mockResolvedValue(turnoCancelado);

      await expect(service.createMercadoPagoPreference(1)).rejects.toThrow(
        'Cannot pay for a canceled turno',
      );
    });

    it('debe lanzar HttpException si el turno ya está pagado', async () => {
      const turnoConPago = {
        ...mockTurno,
        pago: [{ estado: estado_pago.PAGADO }],
      };
      mockTurnoRepository.findOne.mockResolvedValue(turnoConPago);

      await expect(service.createMercadoPagoPreference(1)).rejects.toThrow(
        'This turno is already paid',
      );
    });
  });
});
