import { Test, TestingModule } from '@nestjs/testing';
import { ServicioService } from './servicio.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Servicio } from './entities/servicio.entity';
import { Precio } from '../precio/entities/precio.entity';
import { Producto } from '../producto/entities/producto.entity';
import { Repository } from 'typeorm';
import { HttpException } from '@nestjs/common';
import { TIPO_AUTO } from '../enums/tipo_auto.enum';

describe('ServicioService', () => {
  let service: ServicioService;
  let servicioRepository: Repository<Servicio>;
  let precioRepository: Repository<Precio>;
  let productoRepository: Repository<Producto>;

  const mockServicio = {
    id: 1,
    name: 'Lavado Completo',
    description: 'Lavado completo del vehículo',
    duration: 60,
    precio: [],
    Producto: [],
  };

  const mockPrecio = {
    id: 1,
    tipoVehiculo: TIPO_AUTO.AUTO,
    precio: 5000,
  };

  const mockProducto = {
    id: 1,
    name: 'Shampoo',
    stock_actual: 100,
  };

  const mockServicioRepository = {
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const mockPrecioRepository = {
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockProductoRepository = {
    findBy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicioService,
        {
          provide: getRepositoryToken(Servicio),
          useValue: mockServicioRepository,
        },
        {
          provide: getRepositoryToken(Precio),
          useValue: mockPrecioRepository,
        },
        {
          provide: getRepositoryToken(Producto),
          useValue: mockProductoRepository,
        },
      ],
    }).compile();

    service = module.get<ServicioService>(ServicioService);
    servicioRepository = module.get<Repository<Servicio>>(
      getRepositoryToken(Servicio),
    );
    precioRepository = module.get<Repository<Precio>>(
      getRepositoryToken(Precio),
    );
    productoRepository = module.get<Repository<Producto>>(
      getRepositoryToken(Producto),
    );

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debe crear un servicio correctamente', async () => {
      const createDto = {
        name: 'Lavado Completo',
        description: 'Lavado completo del vehículo',
        duration: 60,
        precio: [
          { tipoVehiculo: TIPO_AUTO.AUTO, precio: 5000 },
          { tipoVehiculo: TIPO_AUTO.CAMIONETA, precio: 6000 },
        ],
        productId: [],
      };

      mockServicioRepository.save.mockResolvedValue(mockServicio);
      mockPrecioRepository.save.mockResolvedValue([mockPrecio]);

      const result = await service.create(createDto);

      expect(mockServicioRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('debe crear un servicio con productos asociados', async () => {
      const createDto = {
        name: 'Lavado Premium',
        description: 'Lavado premium con productos especiales',
        duration: 90,
        precio: [{ tipoVehiculo: TIPO_AUTO.AUTO, precio: 8000 }],
        productId: [1],
      };

      mockProductoRepository.findBy.mockResolvedValue([mockProducto]);
      mockServicioRepository.save.mockResolvedValue({
        ...mockServicio,
        Producto: [mockProducto],
      });
      mockPrecioRepository.save.mockResolvedValue([mockPrecio]);

      const result = await service.create(createDto);

      expect(mockProductoRepository.findBy).toHaveBeenCalled();
      expect(mockServicioRepository.save).toHaveBeenCalled();
    });

    it('debe lanzar HttpException si no encuentra todos los productos', async () => {
      const createDto = {
        name: 'Lavado',
        description: 'Test',
        duration: 60,
        precio: [],
        productId: [1, 2],
      };

      mockProductoRepository.findBy.mockResolvedValue([mockProducto]);

      await expect(service.create(createDto)).rejects.toThrow(
        'Uno o más productos no encontrados',
      );
    });
  });

  describe('update', () => {
    it('debe actualizar un servicio correctamente', async () => {
      const updateDto = {
        name: 'Lavado Actualizado',
        description: 'Nueva descripción',
        duration: 75,
        precio: [{ tipoVehiculo: TIPO_AUTO.AUTO, precio: 5500 }],
        productId: [],
      };

      mockServicioRepository.findOne.mockResolvedValue(mockServicio);
      mockServicioRepository.save.mockResolvedValue({
        ...mockServicio,
        ...updateDto,
      });
      mockPrecioRepository.remove.mockResolvedValue([]);
      mockPrecioRepository.save.mockResolvedValue([mockPrecio]);

      const result = await service.update(updateDto, 1);

      expect(mockServicioRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['precio'],
      });
      expect(mockServicioRepository.save).toHaveBeenCalled();
    });

    it('debe lanzar HttpException si el servicio no existe', async () => {
      mockServicioRepository.findOne.mockResolvedValue(null);

      await expect(service.update({} as any, 999)).rejects.toThrow(
        'Servicio not found',
      );
    });
  });
});
