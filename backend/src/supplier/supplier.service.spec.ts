import { Test, TestingModule } from '@nestjs/testing';
import { SupplierService } from './supplier.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Supplier } from './entities/supplier.entity';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

describe('SupplierService', () => {
  let service: SupplierService;
  let repository: Repository<Supplier>;

  const mockSupplier = {
    id: 1,
    name: 'Proveedor Test',
    email: 'proveedor@test.com',
    phone: '123456789',
    isActive: true,
    createdAt: new Date(),
  };

  const mockSupplierRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplierService,
        {
          provide: getRepositoryToken(Supplier),
          useValue: mockSupplierRepository,
        },
      ],
    }).compile();

    service = module.get<SupplierService>(SupplierService);
    repository = module.get<Repository<Supplier>>(
      getRepositoryToken(Supplier),
    );

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debe crear un proveedor correctamente', async () => {
      const createDto = {
        name: 'Proveedor Test',
        email: 'proveedor@test.com',
        phone: '123456789',
      };

      mockSupplierRepository.create.mockReturnValue(mockSupplier);
      mockSupplierRepository.save.mockResolvedValue(mockSupplier);

      const result = await service.create(createDto);

      expect(mockSupplierRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockSupplierRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockSupplier);
    });
  });

  describe('findAll', () => {
    it('debe obtener todos los proveedores', async () => {
      const suppliers = [mockSupplier, { ...mockSupplier, id: 2 }];
      mockSupplierRepository.find.mockResolvedValue(suppliers);

      const result = await service.findAll();

      expect(mockSupplierRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(suppliers);
    });
  });

  describe('findOne', () => {
    it('debe encontrar un proveedor por ID', async () => {
      mockSupplierRepository.findOne.mockResolvedValue(mockSupplier);

      const result = await service.findOne(1);

      expect(mockSupplierRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockSupplier);
    });

    it('debe lanzar NotFoundException si no encuentra el proveedor', async () => {
      mockSupplierRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        'Supplier with ID 999 not found',
      );
    });
  });

  describe('update', () => {
    it('debe actualizar un proveedor correctamente', async () => {
      const updateDto = { name: 'Proveedor Actualizado' };
      const updatedSupplier = { ...mockSupplier, ...updateDto };

      mockSupplierRepository.findOne.mockResolvedValue(mockSupplier);
      mockSupplierRepository.save.mockResolvedValue(updatedSupplier);

      const result = await service.update(1, updateDto);

      expect(mockSupplierRepository.save).toHaveBeenCalled();
      expect(result.name).toBe('Proveedor Actualizado');
    });
  });

  describe('remove', () => {
    it('debe eliminar un proveedor correctamente', async () => {
      mockSupplierRepository.findOne.mockResolvedValue(mockSupplier);
      mockSupplierRepository.remove.mockResolvedValue(mockSupplier);

      await service.remove(1);

      expect(mockSupplierRepository.findOne).toHaveBeenCalled();
      expect(mockSupplierRepository.remove).toHaveBeenCalledWith(mockSupplier);
    });
  });

  describe('toggleActive', () => {
    it('debe cambiar el estado activo de un proveedor', async () => {
      const inactiveSupplier = { ...mockSupplier, isActive: false };
      mockSupplierRepository.findOne.mockResolvedValue(mockSupplier);
      mockSupplierRepository.save.mockResolvedValue(inactiveSupplier);

      const result = await service.toggleActive(1);

      expect(mockSupplierRepository.save).toHaveBeenCalled();
      expect(result.isActive).toBe(false);
    });
  });
});
