import { Test, TestingModule } from '@nestjs/testing';
import { CarController } from './car.controller';
import { CarService } from './car.service';
import { AuthService } from '../auth/auth.service';
import { createCarDto } from './dto/create-car.dto';
import { modifyCarDto } from './dto/modify-car.dto';
import { TIPO_AUTO } from '../enums/tipo_auto.enum';
import { HttpException } from '@nestjs/common';

describe('CarController', () => {
  let controller: CarController;
  let carService: CarService;
  let authService: AuthService;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    firstname: 'Test',
    lastname: 'User',
    role: 'user',
  };

  const mockCar = {
    id: 1,
    user: mockUser,
    marca: 'TOYOTA',
    model: 'COROLLA',
    patente: 'ABC123',
    color: 'ROJO',
    type: TIPO_AUTO.AUTO,
    isDeleted: false,
  };

  const mockCarService = {
    create: jest.fn(),
    findAllByUserId: jest.fn(),
    modify: jest.fn(),
    deleteCar: jest.fn(),
  };

  const mockAuthService = {
    findUserByToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CarController],
      providers: [
        {
          provide: CarService,
          useValue: mockCarService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<CarController>(CarController);
    carService = module.get<CarService>(CarService);
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createCar', () => {
    it('debe crear un auto correctamente', async () => {
      const createDto: createCarDto = {
        marca: 'Toyota',
        model: 'Corolla',
        patente: 'ABC123',
        color: 'Rojo',
        type: TIPO_AUTO.AUTO,
      };

      const mockRequest = {
        headers: {
          authorization: 'Bearer valid.token',
        },
      };

      mockAuthService.findUserByToken.mockResolvedValue(mockUser);
      mockCarService.create.mockResolvedValue(mockCar);

      const result = await controller.createCar(mockRequest, createDto);

      expect(authService.findUserByToken).toHaveBeenCalledWith(
        'Bearer valid.token',
      );
      expect(carService.create).toHaveBeenCalledWith(createDto, mockUser);
      expect(result).toEqual(mockCar);
    });
  });

  describe('getCarsByUser', () => {
    it('debe obtener todos los autos del usuario autenticado', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer valid.token',
        },
      };

      const cars = [mockCar, { ...mockCar, id: 2, patente: 'XYZ789' }];

      mockAuthService.findUserByToken.mockResolvedValue(mockUser);
      mockCarService.findAllByUserId.mockResolvedValue(cars);

      const result = await controller.getCarsByUser(mockRequest);

      expect(authService.findUserByToken).toHaveBeenCalledWith(
        'Bearer valid.token',
      );
      expect(carService.findAllByUserId).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(cars);
      expect(result).toHaveLength(2);
    });

    it('debe lanzar HttpException si el usuario no está autorizado', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer invalid.token',
        },
      };

      mockAuthService.findUserByToken.mockResolvedValue(null);

      await expect(controller.getCarsByUser(mockRequest)).rejects.toThrow(
        HttpException,
      );
      await expect(controller.getCarsByUser(mockRequest)).rejects.toThrow(
        'User unauthorized',
      );
    });
  });

  describe('modifyCar', () => {
    it('debe modificar un auto correctamente', async () => {
      const modifyDto: modifyCarDto = {
        id: 1,
        color: 'Azul',
      };

      const mockRequest = {
        headers: {
          authorization: 'Bearer valid.token',
        },
      };

      const updatedCar = { ...mockCar, color: 'AZUL' };

      mockAuthService.findUserByToken.mockResolvedValue(mockUser);
      mockCarService.modify.mockResolvedValue(updatedCar);

      const result = await controller.modifyCar(mockRequest, modifyDto);

      expect(authService.findUserByToken).toHaveBeenCalledWith(
        'Bearer valid.token',
      );
      expect(carService.modify).toHaveBeenCalledWith(modifyDto, mockUser);
      expect(result).toEqual({ message: 'Car modified successfully' });
    });
  });

  describe('deleteCar', () => {
    it('debe eliminar un auto correctamente', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer valid.token',
        },
      };

      mockAuthService.findUserByToken.mockResolvedValue(mockUser);
      mockCarService.deleteCar.mockResolvedValue(undefined);

      const result = await controller.deleteCar(mockRequest, 1);

      expect(authService.findUserByToken).toHaveBeenCalledWith(
        'Bearer valid.token',
      );
      expect(carService.deleteCar).toHaveBeenCalledWith(mockUser, 1);
    });
  });
});
