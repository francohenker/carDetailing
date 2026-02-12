import { Test, TestingModule } from '@nestjs/testing';
import { AuditoriaController } from './auditoria.controller';
import { AuditoriaService } from './auditoria.service';
import { TipoAccion, TipoEntidad } from './entities/auditoria.entity';
import { FilterAuditoriaDto } from './dto/filter-auditoria.dto';

describe('AuditoriaController', () => {
  let controller: AuditoriaController;
  let service: AuditoriaService;

  const mockAuditoriaService = {
    obtenerTodos: jest.fn(),
    obtenerPorId: jest.fn(),
    obtenerEstadisticas: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditoriaController],
      providers: [
        {
          provide: AuditoriaService,
          useValue: mockAuditoriaService,
        },
      ],
    }).compile();

    controller = module.get<AuditoriaController>(AuditoriaController);
    service = module.get<AuditoriaService>(AuditoriaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('obtenerTodos', () => {
    it('debe obtener todas las auditorías', async () => {
      const filtros: FilterAuditoriaDto = {
        page: 1,
        limit: 10,
      };

      const mockResponse = {
        data: [
          {
            id: 1,
            accion: TipoAccion.CREAR,
            entidad: TipoEntidad.USUARIO,
            descripcion: 'Usuario creado',
            fechaCreacion: new Date(),
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockAuditoriaService.obtenerTodos.mockResolvedValue(mockResponse);

      const result = await controller.obtenerTodos(filtros);

      expect(service.obtenerTodos).toHaveBeenCalledWith(filtros);
      expect(result).toEqual(mockResponse);
    });

    it('debe obtener auditorías con filtros aplicados', async () => {
      const filtros: FilterAuditoriaDto = {
        accion: TipoAccion.MODIFICAR,
        entidad: TipoEntidad.TURNO,
        usuarioId: 5,
        page: 1,
        limit: 20,
      };

      const mockResponse = {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      };

      mockAuditoriaService.obtenerTodos.mockResolvedValue(mockResponse);

      const result = await controller.obtenerTodos(filtros);

      expect(service.obtenerTodos).toHaveBeenCalledWith(filtros);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('obtenerEstadisticas', () => {
    it('debe obtener estadísticas de auditoría', async () => {
      const mockEstadisticas = {
        totalRegistros: 100,
        registrosHoy: 10,
        registrosEstaSemana: 50,
        registrosEsteMes: 80,
        registrosAyer: 8,
        registrosSemanaAnterior: 45,
        crecimientoHoy: 25.0,
        crecimientoSemana: 11.11,
        accionesMasComunes: [
          { accion: 'CREAR', cantidad: 30 },
          { accion: 'MODIFICAR', cantidad: 20 },
        ],
        entidadesMasAuditadas: [
          { entidad: 'USUARIO', cantidad: 40 },
          { entidad: 'TURNO', cantidad: 30 },
        ],
        usuariosMasActivos: [{ usuario: 'admin@test.com', cantidad: 25 }],
        distribucionPorHora: [
          { hora: 9, cantidad: 5 },
          { hora: 14, cantidad: 8 },
        ],
      };

      mockAuditoriaService.obtenerEstadisticas.mockResolvedValue(
        mockEstadisticas,
      );

      const result = await controller.obtenerEstadisticas();

      expect(service.obtenerEstadisticas).toHaveBeenCalled();
      expect(result).toEqual(mockEstadisticas);
      expect(result.totalRegistros).toBe(100);
      expect(result.accionesMasComunes.length).toBeGreaterThan(0);
    });
  });

  describe('obtenerPorId', () => {
    it('debe obtener una auditoría específica por ID', async () => {
      const mockAuditoria = {
        id: 1,
        accion: TipoAccion.CREAR,
        entidad: TipoEntidad.USUARIO,
        entidadId: 123,
        descripcion: 'Usuario creado exitosamente',
        usuarioId: 5,
        fechaCreacion: new Date(),
      };

      mockAuditoriaService.obtenerPorId.mockResolvedValue(mockAuditoria);

      const result = await controller.obtenerPorId(1);

      expect(service.obtenerPorId).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockAuditoria);
      expect(result.id).toBe(1);
    });

    it('debe manejar cuando no se encuentra una auditoría', async () => {
      mockAuditoriaService.obtenerPorId.mockResolvedValue(null);

      const result = await controller.obtenerPorId(999);

      expect(service.obtenerPorId).toHaveBeenCalledWith(999);
      expect(result).toBeNull();
    });
  });
});
