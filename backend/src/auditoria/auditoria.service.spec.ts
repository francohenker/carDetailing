import { Test, TestingModule } from '@nestjs/testing';
import { AuditoriaService } from './auditoria.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  Auditoria,
  TipoAccion,
  TipoEntidad,
} from './entities/auditoria.entity';
import { CreateAuditoriaDto } from './dto/create-auditoria.dto';
import { FilterAuditoriaDto } from './dto/filter-auditoria.dto';

describe('AuditoriaService', () => {
  let service: AuditoriaService;
  let repository: Repository<Auditoria>;

  const mockAuditoriaRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(),
      getCount: jest.fn(),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditoriaService,
        {
          provide: getRepositoryToken(Auditoria),
          useValue: mockAuditoriaRepository,
        },
      ],
    }).compile();

    service = module.get<AuditoriaService>(AuditoriaService);
    repository = module.get<Repository<Auditoria>>(
      getRepositoryToken(Auditoria),
    );

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('crear', () => {
    it('debe crear una auditoría correctamente', async () => {
      const createAuditoriaDto: CreateAuditoriaDto = {
        accion: TipoAccion.CREAR,
        entidad: TipoEntidad.USUARIO,
        usuarioId: 1,
        entidadId: 123,
        descripcion: 'Usuario creado',
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      };

      const auditoriaCreada = {
        id: 1,
        ...createAuditoriaDto,
        fechaCreacion: new Date(),
      };

      mockAuditoriaRepository.create.mockReturnValue(auditoriaCreada);
      mockAuditoriaRepository.save.mockResolvedValue(auditoriaCreada);

      const result = await service.crear(createAuditoriaDto);

      expect(mockAuditoriaRepository.create).toHaveBeenCalledWith(
        createAuditoriaDto,
      );
      expect(mockAuditoriaRepository.save).toHaveBeenCalledWith(
        auditoriaCreada,
      );
      expect(result).toEqual(auditoriaCreada);
    });
  });

  describe('registrarAccion', () => {
    it('debe registrar una acción sin cambios', async () => {
      const auditoriaCreada = {
        id: 1,
        accion: TipoAccion.CREAR,
        entidad: TipoEntidad.TURNO,
        usuarioId: 1,
        fechaCreacion: new Date(),
      };

      mockAuditoriaRepository.create.mockReturnValue(auditoriaCreada);
      mockAuditoriaRepository.save.mockResolvedValue(auditoriaCreada);

      const result = await service.registrarAccion(
        TipoAccion.CREAR,
        TipoEntidad.TURNO,
        1,
        123,
        'Turno creado',
      );

      expect(mockAuditoriaRepository.create).toHaveBeenCalled();
      expect(mockAuditoriaRepository.save).toHaveBeenCalled();
      expect(result).toEqual(auditoriaCreada);
    });

    it('debe registrar una acción con cambios y agregar detalles a la descripción', async () => {
      const cambios = {
        nombre: { anterior: 'Nombre Viejo', nuevo: 'Nombre Nuevo' },
        estado: { anterior: 'activo', nuevo: 'inactivo' },
      };

      const auditoriaCreada = {
        id: 1,
        accion: TipoAccion.MODIFICAR,
        entidad: TipoEntidad.SERVICIO,
        descripcion:
          'Servicio modificado - Cambios: nombre: "Nombre Viejo" → "Nombre Nuevo", estado: "activo" → "inactivo"',
        fechaCreacion: new Date(),
      };

      mockAuditoriaRepository.create.mockReturnValue(auditoriaCreada);
      mockAuditoriaRepository.save.mockResolvedValue(auditoriaCreada);

      const result = await service.registrarAccion(
        TipoAccion.MODIFICAR,
        TipoEntidad.SERVICIO,
        1,
        456,
        'Servicio modificado',
        { nombre: 'Nombre Viejo' },
        { nombre: 'Nombre Nuevo' },
        '192.168.1.1',
        'Mozilla/5.0',
        cambios,
      );

      expect(result).toEqual(auditoriaCreada);
    });
  });

  describe('obtenerTodos', () => {
    it('debe obtener todas las auditorías sin filtros', async () => {
      const mockData = [
        { id: 1, accion: TipoAccion.CREAR, entidad: TipoEntidad.USUARIO },
        { id: 2, accion: TipoAccion.MODIFICAR, entidad: TipoEntidad.TURNO },
      ];

      const queryBuilder = mockAuditoriaRepository.createQueryBuilder();
      queryBuilder.getManyAndCount.mockResolvedValue([mockData, 2]);

      const result = await service.obtenerTodos({});

      expect(result).toEqual({
        data: mockData,
        total: 2,
        page: 1,
        limit: 50,
        totalPages: 1,
      });
    });

    it('debe aplicar filtros correctamente', async () => {
      const filtros: FilterAuditoriaDto = {
        accion: TipoAccion.CREAR,
        entidad: TipoEntidad.USUARIO,
        usuarioId: 1,
        page: 1,
        limit: 10,
      };

      const mockData = [
        { id: 1, accion: TipoAccion.CREAR, entidad: TipoEntidad.USUARIO },
      ];

      const queryBuilder = mockAuditoriaRepository.createQueryBuilder();
      queryBuilder.getManyAndCount.mockResolvedValue([mockData, 1]);

      const result = await service.obtenerTodos(filtros);

      expect(queryBuilder.andWhere).toHaveBeenCalled();
      expect(result.data).toEqual(mockData);
      expect(result.total).toBe(1);
    });

    it('debe aplicar paginación correctamente', async () => {
      const filtros: FilterAuditoriaDto = {
        page: 2,
        limit: 5,
      };

      const queryBuilder = mockAuditoriaRepository.createQueryBuilder();
      queryBuilder.getManyAndCount.mockResolvedValue([[], 15]);

      const result = await service.obtenerTodos(filtros);

      expect(queryBuilder.skip).toHaveBeenCalledWith(5);
      expect(queryBuilder.take).toHaveBeenCalledWith(5);
      expect(result.totalPages).toBe(3);
    });
  });

  describe('obtenerPorId', () => {
    it('debe obtener una auditoría por ID', async () => {
      const mockAuditoria = {
        id: 1,
        accion: TipoAccion.CREAR,
        entidad: TipoEntidad.USUARIO,
        descripcion: 'Test',
      };

      mockAuditoriaRepository.findOne.mockResolvedValue(mockAuditoria);

      const result = await service.obtenerPorId(1);

      expect(mockAuditoriaRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['usuario'],
      });
      expect(result).toEqual(mockAuditoria);
    });
  });

  describe('obtenerEstadisticas', () => {
    it('debe obtener estadísticas de auditoría', async () => {
      const queryBuilder = mockAuditoriaRepository.createQueryBuilder();

      // Mock para totalRegistros
      queryBuilder.getCount.mockResolvedValueOnce(100);
      // Mock para registrosHoy
      queryBuilder.getCount.mockResolvedValueOnce(10);
      // Mock para registrosEstaSemana
      queryBuilder.getCount.mockResolvedValueOnce(50);
      // Mock para registrosEsteMes
      queryBuilder.getCount.mockResolvedValueOnce(80);
      // Mock para registrosAyer
      queryBuilder.getCount.mockResolvedValueOnce(8);
      // Mock para registrosSemanaAnterior
      queryBuilder.getCount.mockResolvedValueOnce(40);
      // Mock para acciones más comunes
      queryBuilder.getRawMany.mockResolvedValueOnce([
        { accion: 'CREAR', cantidad: '30' },
        { accion: 'MODIFICAR', cantidad: '20' },
      ]);
      // Mock para entidades más auditadas
      queryBuilder.getRawMany.mockResolvedValueOnce([
        { entidad: 'USUARIO', cantidad: '40' },
        { entidad: 'TURNO', cantidad: '30' },
      ]);
      // Mock para usuarios más activos
      queryBuilder.getRawMany.mockResolvedValueOnce([
        { usuario: 'admin@test.com', cantidad: '25' },
      ]);
      // Mock para distribución por hora
      queryBuilder.getRawMany.mockResolvedValueOnce([
        { hora: 9, cantidad: '5' },
        { hora: 14, cantidad: '8' },
      ]);

      const result = await service.obtenerEstadisticas();

      expect(result).toHaveProperty('totalRegistros');
      expect(result).toHaveProperty('registrosHoy');
      expect(result).toHaveProperty('accionesMasComunes');
      expect(result).toHaveProperty('entidadesMasAuditadas');
    });
  });
});
