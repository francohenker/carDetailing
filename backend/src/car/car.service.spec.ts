import { Test, TestingModule } from '@nestjs/testing';
import { CarService } from './car.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Car } from './entities/car.entity';
import { Repository } from 'typeorm';
import { HttpException } from '@nestjs/common';
import { TIPO_AUTO } from '../enums/tipo_auto.enum';
import { Users } from '../users/entities/users.entity';
import { createCarDto } from './dto/create-car.dto';
import { modifyCarDto } from './dto/modify-car.dto';

describe('CarService', () => {
  let service: CarService;
  let repository: Repository<Car>;

  const mockUser: Users = {
    id: 1,
    email: 'test@example.com',
    firstname: 'Test',
    lastname: 'User',
    password: 'hashedPassword',
    phone: '1234567890',
    role: 'user' as any,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    cars: [],
    turnos: [],
  };

  const mockCar: Car = {
    id: 1,
    user: mockUser,
    marca: 'TOYOTA',
    model: 'COROLLA',
    patente: 'ABC123',
    color: 'ROJO',
    type: TIPO_AUTO.AUTO,
    turno: [],
    isDeleted: false,
  };

  const mockCarRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CarService,
        {
          provide: getRepositoryToken(Car),
          useValue: mockCarRepository,
        },
      ],
    }).compile();

    service = module.get<CarService>(CarService);
    repository = module.get<Repository<Car>>(getRepositoryToken(Car));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debe crear un auto correctamente con patente formato antiguo', async () => {
      const createCarDto: createCarDto = {
        marca: 'Toyota',
        model: 'Corolla',
        patente: 'ABC123',
        color: 'Rojo',
        type: TIPO_AUTO.AUTO,
      };

      mockCarRepository.create.mockReturnValue(mockCar);
      mockCarRepository.save.mockResolvedValue(mockCar);

      const result = await service.create(createCarDto, mockUser);

      expect(mockCarRepository.create).toHaveBeenCalled();
      expect(mockCarRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockCar);
    });

    it('debe crear un auto correctamente con patente formato nuevo', async () => {
      const createCarDto: createCarDto = {
        marca: 'Ford',
        model: 'Focus',
        patente: 'AB123CD',
        color: 'Azul',
        type: TIPO_AUTO.AUTO,
      };

      const newCar = { ...mockCar, patente: 'AB123CD' };
      mockCarRepository.create.mockReturnValue(newCar);
      mockCarRepository.save.mockResolvedValue(newCar);

      const result = await service.create(createCarDto, mockUser);

      expect(result.patente).toBe('AB123CD');
    });

    it('debe lanzar error con patente inválida', async () => {
      const createCarDto: createCarDto = {
        marca: 'Toyota',
        model: 'Corolla',
        patente: 'INVALID',
        color: 'Rojo',
        type: TIPO_AUTO.AUTO,
      };

      await expect(service.create(createCarDto, mockUser)).rejects.toThrow(
        'Patente inválida',
      );
    });

    it('debe convertir datos a mayúsculas', async () => {
      const createCarDto: createCarDto = {
        marca: 'toyota',
        model: 'corolla',
        patente: 'abc123',
        color: 'rojo',
        type: TIPO_AUTO.AUTO,
      };

      mockCarRepository.create.mockReturnValue(mockCar);
      mockCarRepository.save.mockResolvedValue(mockCar);

      await service.create(createCarDto, mockUser);

      const carCreated = mockCarRepository.create.mock.calls[0][0];
      expect(carCreated.marca).toBe('TOYOTA');
      expect(carCreated.model).toBe('COROLLA');
      expect(carCreated.patente).toBe('ABC123');
      expect(carCreated.color).toBe('ROJO');
    });
  });

  describe('findAllByUserId', () => {
    it('debe retornar todos los autos de un usuario', async () => {
      const cars = [mockCar, { ...mockCar, id: 2, patente: 'XYZ789' }];
      mockCarRepository.find.mockResolvedValue(cars);

      const result = await service.findAllByUserId(1);

      expect(mockCarRepository.find).toHaveBeenCalledWith({
        where: { user: { id: 1 } },
      });
      expect(result).toEqual(cars);
      expect(result).toHaveLength(2);
    });

    it('debe retornar array vacío si el usuario no tiene autos', async () => {
      mockCarRepository.find.mockResolvedValue([]);

      const result = await service.findAllByUserId(999);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('findById', () => {
    it('debe encontrar un auto por ID', async () => {
      mockCarRepository.findOne.mockResolvedValue(mockCar);

      const result = await service.findById(1);

      expect(mockCarRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['user'],
      });
      expect(result).toEqual(mockCar);
    });

    it('debe lanzar HttpException si el auto no existe', async () => {
      mockCarRepository.findOne.mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow(HttpException);
      await expect(service.findById(999)).rejects.toThrow('Car not found');
    });
  });

  describe('modify', () => {
    it('debe modificar el color del auto correctamente', async () => {
      const modifyDto: modifyCarDto = {
        id: 1,
        color: 'Azul',
      };

      const updatedCar = { ...mockCar, color: 'AZUL' };
      mockCarRepository.findOne.mockResolvedValue(mockCar);
      mockCarRepository.save.mockResolvedValue(updatedCar);

      const result = await service.modify(modifyDto, mockUser);

      expect(mockCarRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, user: { id: 1 } },
      });
      expect(result.color).toBe('AZUL');
    });

    it('debe lanzar HttpException si el auto no existe', async () => {
      const modifyDto: modifyCarDto = {
        id: 999,
        color: 'Azul',
      };

      mockCarRepository.findOne.mockResolvedValue(null);

      await expect(service.modify(modifyDto, mockUser)).rejects.toThrow(
        HttpException,
      );
      await expect(service.modify(modifyDto, mockUser)).rejects.toThrow(
        'Car not found or does not belong to the user',
      );
    });

    it('debe verificar que el auto pertenezca al usuario', async () => {
      const modifyDto: modifyCarDto = {
        id: 1,
        color: 'Verde',
      };

      mockCarRepository.findOne.mockResolvedValue(null);

      await expect(service.modify(modifyDto, mockUser)).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('deleteCar', () => {
    it('debe marcar el auto como eliminado (soft delete)', async () => {
      const deletedCar = { ...mockCar, isDeleted: true };
      mockCarRepository.findOne.mockResolvedValue(mockCar);
      mockCarRepository.save.mockResolvedValue(deletedCar);

      await service.deleteCar(mockUser, 1);

      expect(mockCarRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, user: { id: 1 } },
      });
      expect(mockCarRepository.save).toHaveBeenCalledWith({
        ...mockCar,
        isDeleted: true,
      });
    });

    it('debe lanzar HttpException si el auto no existe', async () => {
      mockCarRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteCar(mockUser, 999)).rejects.toThrow(
        HttpException,
      );
      await expect(service.deleteCar(mockUser, 999)).rejects.toThrow(
        'Car not found or does not belong to user',
      );
    });

    it('debe verificar que el auto pertenezca al usuario', async () => {
      mockCarRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteCar(mockUser, 1)).rejects.toThrow(
        'Car not found or does not belong to user',
      );
    });
  });
});
