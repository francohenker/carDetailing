import { Test, TestingModule } from '@nestjs/testing';
import { ProductoService } from './producto.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Producto } from './entities/producto.entity';
import { Supplier } from '../supplier/entities/supplier.entity';
import { Repository } from 'typeorm';
import { HttpException } from '@nestjs/common';
import { StockNotificationService } from '../stock/stock-notification.service';

describe('ProductoService', () => {
  let service: ProductoService;
  let productoRepository: Repository<Producto>;
  let supplierRepository: Repository<Supplier>;

  const mockProducto = {
    id: 1,
    name: 'Shampoo',
    stock_actual: 100,
    price: 500,
    stock_minimo: 10,
    servicios_por_producto: 5,
    isDeleted: false,
    suppliers: [],
  };

  const mockSupplier = {
    id: 1,
    name: 'Proveedor Test',
    email: 'test@example.com',
  };

  const mockProductoRepository = {
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findByIds: jest.fn(),
  };

  const mockSupplierRepository = {
    findByIds: jest.fn(),
  };

  const mockStockNotificationService = {
    checkAndNotifyLowStock: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductoService,
        {
          provide: getRepositoryToken(Producto),
          useValue: mockProductoRepository,
        },
        {
          provide: getRepositoryToken(Supplier),
          useValue: mockSupplierRepository,
        },
        {
          provide: StockNotificationService,
          useValue: mockStockNotificationService,
        },
      ],
    }).compile();

    service = module.get<ProductoService>(ProductoService);
    productoRepository = module.get<Repository<Producto>>(
      getRepositoryToken(Producto),
    );
    supplierRepository = module.get<Repository<Supplier>>(
      getRepositoryToken(Supplier),
    );

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debe crear un producto correctamente', async () => {
      const createDto = {
        name: 'Shampoo',
        stock_actual: 100,
        price: 500,
        stock_minimo: 10,
        servicios_por_producto: 5,
      };

      mockProductoRepository.save.mockResolvedValue(mockProducto);

      const result = await service.create(createDto);

      expect(mockProductoRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockProducto);
    });

    it('debe crear un producto con proveedores asociados', async () => {
      const createDto = {
        name: 'Shampoo',
        stock_actual: 100,
        price: 500,
        stock_minimo: 10,
        servicios_por_producto: 5,
        supplierIds: [1],
      };

      mockSupplierRepository.findByIds.mockResolvedValue([mockSupplier]);
      mockProductoRepository.save.mockResolvedValue({
        ...mockProducto,
        suppliers: [mockSupplier],
      });

      const result = await service.create(createDto);

      expect(mockSupplierRepository.findByIds).toHaveBeenCalledWith([1]);
      expect(result.suppliers).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('debe obtener todos los productos no eliminados', async () => {
      const productos = [mockProducto];
      mockProductoRepository.find.mockResolvedValue(productos);

      const result = await service.findAll();

      expect(mockProductoRepository.find).toHaveBeenCalledWith({
        where: { isDeleted: false },
        relations: ['suppliers'],
      });
      expect(result).toEqual(productos);
    });

    it('debe incluir productos eliminados si se especifica', async () => {
      const productos = [mockProducto, { ...mockProducto, isDeleted: true }];
      mockProductoRepository.find.mockResolvedValue(productos);

      const result = await service.findAll(true);

      expect(mockProductoRepository.find).toHaveBeenCalledWith({
        where: {},
        relations: ['suppliers'],
      });
    });
  });

  describe('findById', () => {
    it('debe encontrar un producto por ID', async () => {
      mockProductoRepository.findOne.mockResolvedValue(mockProducto);

      const result = await service.findById(1);

      expect(mockProductoRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, isDeleted: false },
        relations: ['suppliers'],
      });
      expect(result).toEqual(mockProducto);
    });
  });

  describe('restore', () => {
    it('debe restaurar un producto eliminado', async () => {
      const deletedProducto = { ...mockProducto, isDeleted: true };
      const restoredProducto = { ...mockProducto, isDeleted: false };

      mockProductoRepository.findOne.mockResolvedValue(deletedProducto);
      mockProductoRepository.save.mockResolvedValue(restoredProducto);

      const result = await service.restore(1);

      expect(result.isDeleted).toBe(false);
      expect(mockProductoRepository.save).toHaveBeenCalled();
    });

    it('debe lanzar HttpException si el producto no existe', async () => {
      mockProductoRepository.findOne.mockResolvedValue(null);

      await expect(service.restore(999)).rejects.toThrow('Producto not found');
    });

    it('debe lanzar HttpException si el producto no está eliminado', async () => {
      mockProductoRepository.findOne.mockResolvedValue(mockProducto);

      await expect(service.restore(1)).rejects.toThrow(
        'Producto is not deleted',
      );
    });
  });

  describe('update', () => {
    it('debe actualizar un producto correctamente', async () => {
      const updateDto = {
        name: 'Shampoo Premium',
        price: 600,
      };

      const updatedProducto = { ...mockProducto, ...updateDto };

      mockProductoRepository.findOne.mockResolvedValue(mockProducto);
      mockProductoRepository.save.mockResolvedValue(updatedProducto);

      const result = await service.update(1, updateDto);

      expect(result.name).toBe('Shampoo Premium');
      expect(result.price).toBe(600);
    });

    it('debe lanzar HttpException si el producto no existe', async () => {
      mockProductoRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, {})).rejects.toThrow(
        'Producto not found',
      );
    });
  });
});
