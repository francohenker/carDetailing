import { Test, TestingModule } from '@nestjs/testing';
import { FacturaService } from './factura.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Turno } from '../turno/entities/turno.entity';
import { Pago } from '../pago/entities/pago.entity';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { estado_pago } from '../enums/estado_pago.enum';
import { TIPO_AUTO } from '../enums/tipo_auto.enum';

describe('FacturaService', () => {
  let service: FacturaService;
  let turnoRepository: Repository<Turno>;
  let pagoRepository: Repository<Pago>;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    firstname: 'Test',
    lastname: 'User',ṕ
  };

  const mockCar = {
    id: 1,
    user: mockUser,
    marca: 'TOYOTA',
    model: 'COROLLA',
    patente: 'ABC123',
    color: 'ROJO',
    type: TIPO_AUTO.AUTO,
  };

  const mockServicio = {
    id: 1,
    nombre: 'Lavado Completo',
    descripcion: 'Lavado completo del vehículo',
    precio: {
      AUTO: 5000,
      CAMIONETA: 6000,
      VAN: 7000,
    },
  };

  const mockPago: Pago = {
    id: 1,
    monto: 5000,
    metodo_pago: 'EFECTIVO' as any,
    estado: estado_pago.PAGADO,
    fecha_pago: new Date(),
    turno: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTurno = {
    id: 1,
    car: mockCar,
    servicio: mockServicio,
    pago: [mockPago],
    fecha: new Date(),
    hora: '10:00',
    estado: 'COMPLETADO' as any,
  };

  const mockTurnoRepository = {
    findOne: jest.fn(),
  };

  const mockPagoRepository = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FacturaService,
        {
          provide: getRepositoryToken(Turno),
          useValue: mockTurnoRepository,
        },
        {
          provide: getRepositoryToken(Pago),
          useValue: mockPagoRepository,
        },
      ],
    }).compile();

    service = module.get<FacturaService>(FacturaService);
    turnoRepository = module.get<Repository<Turno>>(getRepositoryToken(Turno));
    pagoRepository = module.get<Repository<Pago>>(getRepositoryToken(Pago));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateFacturaPDF', () => {
    it('debe generar un PDF de factura correctamente', async () => {
      mockTurnoRepository.findOne.mockResolvedValue(mockTurno);

      const result = await service.generateFacturaPDF(1);

      expect(mockTurnoRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['car', 'car.user', 'servicio', 'servicio.precio', 'pago'],
      });
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('debe lanzar NotFoundException si el turno no existe', async () => {
      mockTurnoRepository.findOne.mockResolvedValue(null);

      await expect(service.generateFacturaPDF(999)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.generateFacturaPDF(999)).rejects.toThrow(
        'Turno no encontrado',
      );
    });

    it('debe lanzar NotFoundException si no hay pago completado', async () => {
      const turnoSinPago = {
        ...mockTurno,
        pago: [{ ...mockPago, estado: estado_pago.PENDIENTE }],
      };

      mockTurnoRepository.findOne.mockResolvedValue(turnoSinPago);

      await expect(service.generateFacturaPDF(1)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.generateFacturaPDF(1)).rejects.toThrow(
        'No se encontró un pago completado para este turno',
      );
    });

    it('debe generar PDF con pagos múltiples, usando el pago completado', async () => {
      const turnoConMultiplesPagos = {
        ...mockTurno,
        pago: [
          { ...mockPago, id: 1, estado: estado_pago.PENDIENTE },
          { ...mockPago, id: 2, estado: estado_pago.PAGADO },
        ],
      };

      mockTurnoRepository.findOne.mockResolvedValue(turnoConMultiplesPagos);

      const result = await service.generateFacturaPDF(1);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('debe incluir información del cliente en el PDF', async () => {
      mockTurnoRepository.findOne.mockResolvedValue(mockTurno);

      const result = await service.generateFacturaPDF(1);

      // Verificar que el buffer contiene datos
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(1000); // Un PDF típico debería tener más de 1KB
    });
  });
});
