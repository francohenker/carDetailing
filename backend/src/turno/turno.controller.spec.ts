import { Test, TestingModule } from '@nestjs/testing';
import { TurnoController } from './turno.controller';
import { TurnoService } from './turno.service';
import { CarService } from '../car/car.service';
import { AuthService } from '../auth/auth.service';
import { CreateTurnoDto } from './dto/create.turno.dto';
import { ModifyTurnoDto } from './dto/modify.turno.dto';
import { HttpException } from '@nestjs/common';
import { estado_turno } from '../enums/estado_turno.enum';

import { TurnoOwnerGuard } from '../auth/turno.owner.guard';
import { RolesGuard } from '../roles/role.guard';
import { JwtService } from '@nestjs/jwt';

describe('TurnoController', () => {
  let controller: TurnoController;
  // let turnoService: TurnoService;
  // let carService: CarService;
  // let authService: AuthService;

  const mockTurnoService = {
    createTurno: jest.fn(),
    modifyTurno: jest.fn(),
    findByUser: jest.fn(),
    // ... (rest same)
    findDate: jest.fn(),
    getAvailableTimeSlots: jest.fn(),
    findAll: jest.fn(),
    markAsCompleted: jest.fn(),
    cancelTurno: jest.fn(),
  };

  const mockCarService = {
    findById: jest.fn(),
  };

  const mockAuthService = {
    findUserByToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TurnoController],
      providers: [
        {
          provide: TurnoService,
          useValue: mockTurnoService,
        },
        {
          provide: CarService,
          useValue: mockCarService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: JwtService,
          useValue: { verify: jest.fn() },
        },
      ],
    })
      .overrideGuard(TurnoOwnerGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TurnoController>(TurnoController);
    // turnoService = module.get<TurnoService>(TurnoService);
    // carService = module.get<CarService>(CarService);
    // authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createTurno', () => {
    it('should create a turno', async () => {
      const createDto: CreateTurnoDto = { carId: 1 } as CreateTurnoDto;
      const req = { headers: { authorization: 'token' } };
      const mockUser = { id: 1 };
      const mockCar = { id: 1, user: { id: 1 } };

      mockAuthService.findUserByToken.mockResolvedValue(mockUser);
      mockCarService.findById.mockResolvedValue(mockCar);
      mockTurnoService.createTurno.mockResolvedValue({ id: 1 });

      const result = await controller.createTurno(req, createDto);

      expect(mockAuthService.findUserByToken).toHaveBeenCalledWith('token');
      expect(mockCarService.findById).toHaveBeenCalledWith(1);
      expect(mockTurnoService.createTurno).toHaveBeenCalledWith(
        mockCar,
        createDto,
      );
      expect(result).toEqual({ id: 1 });
    });

    it('should throw exception if car does not belong to user', async () => {
      const createDto: CreateTurnoDto = { carId: 1 } as CreateTurnoDto;
      const req = { headers: { authorization: 'token' } };
      const mockUser = { id: 1 };
      const mockCar = { id: 1, user: { id: 2 } }; // Different user

      mockAuthService.findUserByToken.mockResolvedValue(mockUser);
      mockCarService.findById.mockResolvedValue(mockCar);

      await expect(controller.createTurno(req, createDto)).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('modifyTurno', () => {
    it('should modify a turno', async () => {
      const modifyDto: ModifyTurnoDto = { turnoId: 1 } as ModifyTurnoDto;
      mockTurnoService.modifyTurno.mockResolvedValue({ id: 1 });

      const result = await controller.modifyTurno({}, modifyDto);
      expect(mockTurnoService.modifyTurno).toHaveBeenCalledWith(modifyDto);
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('getUserTurnos', () => {
    it('should return user turnos', async () => {
      const req = { headers: { authorization: 'token' } };
      const mockUser = { id: 1 };
      mockAuthService.findUserByToken.mockResolvedValue(mockUser);
      mockTurnoService.findByUser.mockResolvedValue([{ id: 1 }]);

      const result = await controller.getUserTurnos(req);

      expect(mockAuthService.findUserByToken).toHaveBeenCalledWith('token');
      expect(mockTurnoService.findByUser).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual([{ id: 1 }]);
    });
  });

  describe('getTurnosByDate', () => {
    it('should return turnos by date', async () => {
      const req = { query: { date: '2026-01-21' } };
      mockTurnoService.findDate.mockResolvedValue([]);

      const result = await controller.getTurnosByDate(req);
      expect(mockTurnoService.findDate).toHaveBeenCalledWith('2026-01-21');
      expect(result).toEqual([]);
    });
  });

  describe('getAvailableTimeSlots', () => {
    it('should return available slots', async () => {
      const req = { query: { date: '2026-01-21', duration: '60' } };
      const mockSlots = { slots: [] };
      mockTurnoService.getAvailableTimeSlots.mockResolvedValue(mockSlots);

      const result = await controller.getAvailableTimeSlots(req);

      expect(mockTurnoService.getAvailableTimeSlots).toHaveBeenCalledWith(
        '2026-01-21',
        60,
      );
      expect(result).toEqual(mockSlots);
    });

    it('should throw exception if date missing', async () => {
      const req = { query: { duration: '60' } };
      await expect(controller.getAvailableTimeSlots(req)).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('getAllTurnos', () => {
    it('should return all turnos', async () => {
      mockTurnoService.findAll.mockResolvedValue([]);
      const result = await controller.getAllTurnos();
      expect(mockTurnoService.findAll).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('markTurnoAsCompleted', () => {
    it('should mark turno as completed', async () => {
      const req = { params: { id: '1' } };
      const mockTurno = {
        id: 1,
        car: {
          marca: 'A',
          model: 'B',
          patente: 'C',
          user: { firstname: 'John', lastname: 'Doe' },
        },
        servicio: [],
        estado: estado_turno.FINALIZADO,
      };
      mockTurnoService.markAsCompleted.mockResolvedValue(mockTurno);

      const result = await controller.markTurnoAsCompleted(req);

      expect(mockTurnoService.markAsCompleted).toHaveBeenCalledWith(1);
      expect(result.id).toBe(1);
      expect(result.estado).toBe(estado_turno.FINALIZADO);
    });
  });

  describe('cancelTurno', () => {
    it('should cancel turno', async () => {
      const req = { params: { id: '1' } };
      mockTurnoService.cancelTurno.mockResolvedValue({
        id: 1,
        estado: estado_turno.CANCELADO,
      });

      const result = await controller.cancelTurno(req);

      expect(mockTurnoService.cancelTurno).toHaveBeenCalledWith(1);
      expect(result.estado).toBe(estado_turno.CANCELADO);
    });
  });
});
