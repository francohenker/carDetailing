import { Test, TestingModule } from '@nestjs/testing';
import { TurnoService } from './turno.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Turno } from './entities/turno.entity';
import { ServicioService } from '../servicio/servicio.service';
import { MailService } from '../mail.services';
import { ProductoService } from '../producto/producto.service';
import { Car } from '../car/entities/car.entity';
import { CreateTurnoDto } from './dto/create.turno.dto';
import { estado_turno } from '../enums/estado_turno.enum';
import { HttpException } from '@nestjs/common';
import { ModifyTurnoDto } from './dto/modify.turno.dto';
import { Repository } from 'typeorm';

describe('TurnoService', () => {
  let service: TurnoService;
  let turnoRepository: Repository<Turno>;
  let servicioService: ServicioService;
  let mailService: MailService;
  // let productoService: ProductoService;

  const mockTurnoRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    })),
  };

  const mockServicioService = {
    findByIds: jest.fn(),
  };

  const mockMailService = {
    sendHtmlMail: jest.fn(),
    formateDate: jest.fn(),
  };

  const mockProductoService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TurnoService,
        {
          provide: getRepositoryToken(Turno),
          useValue: mockTurnoRepository,
        },
        {
          provide: ServicioService,
          useValue: mockServicioService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
        {
          provide: ProductoService,
          useValue: mockProductoService,
        },
      ],
    }).compile();

    service = module.get<TurnoService>(TurnoService);
    turnoRepository = module.get<Repository<Turno>>(getRepositoryToken(Turno));
    servicioService = module.get<ServicioService>(ServicioService);
    mailService = module.get<MailService>(MailService);
    // productoService = module.get<ProductoService>(ProductoService);

    jest.clearAllMocks();
  });

  describe('createTurno', () => {
    it('should create a turno successfully', async () => {
      const mockCar = {
        id: 1,
        marca: 'Toyota',
        model: 'Corolla',
        patente: 'ABC 123',
        user: { email: 'test@example.com' },
      } as unknown as Car;
      const createTurnoDto: CreateTurnoDto = {
        carId: 1,
        date: new Date('2026-01-21T10:00:00'),
        services: [1],
        observacion: 'Test observation',
        totalPrice: 1000,
        duration: 60,
      };

      const mockServices = [{ id: 1, name: 'Service 1', duration: 60 }];
      const mockTurno = {
        ...createTurnoDto,
        id: 1,
        car: mockCar,
        fechaHora: createTurnoDto.date,
      };

      mockServicioService.findByIds.mockResolvedValue(mockServices);
      mockTurnoRepository.find.mockResolvedValue([]); // No overlapping turnos
      mockTurnoRepository.create.mockReturnValue(mockTurno);
      mockTurnoRepository.save.mockResolvedValue(mockTurno);
      mockMailService.formateDate.mockReturnValue('21/01/2026 10:00');

      const result = await service.createTurno(mockCar, createTurnoDto);

      expect(mockTurnoRepository.create).toHaveBeenCalled();
      expect(mockTurnoRepository.save).toHaveBeenCalled();
      expect(mockMailService.sendHtmlMail).toHaveBeenCalled();
      expect(result).toEqual(mockTurno);
    });

    it('should throw HttpException if there is a time overlap', async () => {
      const mockCar = { id: 1 } as unknown as Car;
      const createTurnoDto: CreateTurnoDto = {
        carId: 1,
        date: new Date('2026-01-21T10:00:00'),
        services: [1],
        observacion: 'Overlap Test',
        totalPrice: 1000,
        duration: 60,
      };

      // Simular turno existente en el mismo horario
      const existingTurno = {
        id: 2,
        fechaHora: new Date('2026-01-21T10:00:00'),
        duration: 60,
      };

      mockTurnoRepository.find.mockResolvedValue([existingTurno]);

      await expect(
        service.createTurno(mockCar, createTurnoDto),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('modifyTurno', () => {
    it('should modify an existing turno', async () => {
      const modifyTurnoDto: ModifyTurnoDto = {
        turnoId: 1,
        fechaHora: new Date('2026-01-22T10:00:00'),
        estado: estado_turno.FINALIZADO,
        observacion: 'Updated observation',
        servicios: [2],
      };

      const existingTurno = {
        id: 1,
        fechaHora: new Date('2026-01-21T10:00:00'),
        estado: estado_turno.PENDIENTE,
        observacion: 'Old observation',
        car: {
          user: { email: 'test@test.com' },
          marca: 'Ford',
          model: 'Focus',
          patente: 'XYZ',
        },
        servicio: [],
      };

      const mockServices = [{ id: 2, name: 'Service 2' }];

      mockTurnoRepository.findOne.mockResolvedValue(existingTurno);
      mockServicioService.findByIds.mockResolvedValue(mockServices);
      mockTurnoRepository.save.mockResolvedValue({
        ...existingTurno,
        ...modifyTurnoDto,
        servicio: mockServices,
      });
      mockMailService.formateDate.mockReturnValue('22/01/2026 10:00');

      const result = await service.modifyTurno(modifyTurnoDto);

      expect(mockTurnoRepository.findOne).toHaveBeenCalled();
      expect(mockTurnoRepository.save).toHaveBeenCalled();
      expect(result.estado).toBe(estado_turno.FINALIZADO);
      expect(mockMailService.sendHtmlMail).toHaveBeenCalled();
    });

    it('should throw exception if turno not found', async () => {
      const modifyTurnoDto: ModifyTurnoDto = { turnoId: 999 } as ModifyTurnoDto;
      mockTurnoRepository.findOne.mockResolvedValue(null);

      await expect(service.modifyTurno(modifyTurnoDto)).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('deleteTurno', () => {
    it('should delete a turno', async () => {
      const mockTurno = {
        id: 1,
        fechaHora: new Date(),
        car: {
          user: { email: 't@t.com' },
          marca: 'A',
          model: 'B',
          patente: 'C',
        },
      };
      mockTurnoRepository.findOneBy.mockResolvedValue(mockTurno);
      mockTurnoRepository.remove.mockResolvedValue(mockTurno);

      await service.deleteTurno(1);

      expect(mockTurnoRepository.remove).toHaveBeenCalledWith(mockTurno);
      expect(mockMailService.sendHtmlMail).toHaveBeenCalled();
    });

    it('should throw exception if turno to delete not found', async () => {
      mockTurnoRepository.findOneBy.mockResolvedValue(null);
      await expect(service.deleteTurno(999)).rejects.toThrow(HttpException);
    });
  });

  describe('findById', () => {
    it('should return a turno', async () => {
      const mockTurno = { id: 1 };
      mockTurnoRepository.findOne.mockResolvedValue(mockTurno);
      const result = await service.findById(1);
      expect(result).toEqual(mockTurno);
    });
  });

  describe('findDate', () => {
    it('should return turnos for a specific date', async () => {
      const date = '2026-01-21';
      const mockTurnos = [{ id: 1 }];
      mockTurnoRepository.find.mockResolvedValue(mockTurnos);

      const result = await service.findDate(date);
      expect(mockTurnoRepository.find).toHaveBeenCalled();
      expect(result).toEqual(mockTurnos);
    });
  });

  describe('findTurnosByDate', () => {
    it('should throw exception for invalid date', async () => {
      await expect(
        service.findTurnosByDate(new Date('invalid')),
      ).rejects.toThrow(HttpException);
    });

    it('should return turnos for valid date object', async () => {
      const date = new Date('2026-01-21');
      const mockTurnos = [{ id: 1 }];
      mockTurnoRepository.find.mockResolvedValue(mockTurnos);

      const result = await service.findTurnosByDate(date);
      expect(result).toEqual(mockTurnos);
    });
  });

  describe('getAvailableTimeSlots', () => {
    it('should return available slots', async () => {
      const targetDate = '2026-01-21';
      const duration = 60;

      mockTurnoRepository.find.mockResolvedValue([]); // No existing turnos

      const result = await service.getAvailableTimeSlots(targetDate, duration);

      expect(result).toBeDefined();
      expect(Array.isArray(result.slots)).toBe(true);
      expect(result.slots.some((slot) => slot.available === true)).toBe(true);
    });
  });
});
