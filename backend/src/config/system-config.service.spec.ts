import { Test, TestingModule } from '@nestjs/testing';
import { SystemConfigService } from './system-config.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SystemConfig } from './entities/system-config.entity';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { UpdateQuotationThresholdsDto } from './dto/update-quotation-thresholds.dto';

describe('SystemConfigService', () => {
  let service: SystemConfigService;
  let repository: Repository<SystemConfig>;

  const mockConfig: SystemConfig = {
    id: 1,
    key: 'quotation_thresholds',
    value: {
      high: 1,
      medium: 2,
      low: 3,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSystemConfigRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemConfigService,
        {
          provide: getRepositoryToken(SystemConfig),
          useValue: mockSystemConfigRepository,
        },
      ],
    }).compile();

    service = module.get<SystemConfigService>(SystemConfigService);
    repository = module.get<Repository<SystemConfig>>(
      getRepositoryToken(SystemConfig),
    );

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getQuotationThresholds', () => {
    it('debe obtener los umbrales de cotización existentes', async () => {
      mockSystemConfigRepository.findOne.mockResolvedValue(mockConfig);

      const result = await service.getQuotationThresholds();

      expect(mockSystemConfigRepository.findOne).toHaveBeenCalledWith({
        where: { key: 'quotation_thresholds' },
      });
      expect(result).toEqual({
        high: 1,
        medium: 2,
        low: 3,
      });
    });

    it('debe retornar valores por defecto si no existe configuración', async () => {
      mockSystemConfigRepository.findOne.mockResolvedValue(null);

      const result = await service.getQuotationThresholds();

      expect(result).toEqual({
        high: 1,
        medium: 2,
        low: 3,
      });
    });
  });

  describe('updateQuotationThresholds', () => {
    it('debe actualizar los umbrales existentes', async () => {
      const updateDto: UpdateQuotationThresholdsDto = {
        high: 2,
        medium: 3,
        low: 5,
      };

      const updatedConfig = {
        ...mockConfig,
        value: { high: 2, medium: 3, low: 5 },
      };

      mockSystemConfigRepository.findOne.mockResolvedValue(mockConfig);
      mockSystemConfigRepository.save.mockResolvedValue(updatedConfig);

      const result = await service.updateQuotationThresholds(updateDto);

      expect(mockSystemConfigRepository.findOne).toHaveBeenCalledWith({
        where: { key: 'quotation_thresholds' },
      });
      expect(mockSystemConfigRepository.save).toHaveBeenCalled();
      expect(result).toEqual({ high: 2, medium: 3, low: 5 });
    });

    it('debe actualizar solo algunos umbrales', async () => {
      const updateDto: UpdateQuotationThresholdsDto = {
        high: 5,
      };

      const updatedConfig = {
        ...mockConfig,
        value: { high: 5, medium: 2, low: 3 },
      };

      mockSystemConfigRepository.findOne.mockResolvedValue(mockConfig);
      mockSystemConfigRepository.save.mockResolvedValue(updatedConfig);

      const result = await service.updateQuotationThresholds(updateDto);

      expect(result.high).toBe(5);
      expect(result.medium).toBe(2);
      expect(result.low).toBe(3);
    });

    it('debe crear configuración si no existe', async () => {
      const updateDto: UpdateQuotationThresholdsDto = {
        high: 2,
        medium: 3,
        low: 5,
      };

      const newConfig = {
        key: 'quotation_thresholds',
        value: { high: 1, medium: 2, low: 3 },
      };

      const savedConfig = {
        ...newConfig,
        value: { high: 2, medium: 3, low: 5 },
      };

      mockSystemConfigRepository.findOne.mockResolvedValue(null);
      mockSystemConfigRepository.create.mockReturnValue(newConfig);
      mockSystemConfigRepository.save.mockResolvedValue(savedConfig);

      const result = await service.updateQuotationThresholds(updateDto);

      expect(mockSystemConfigRepository.create).toHaveBeenCalled();
      expect(mockSystemConfigRepository.save).toHaveBeenCalled();
      expect(result).toEqual({ high: 2, medium: 3, low: 5 });
    });
  });

  describe('getConfig', () => {
    it('debe obtener una configuración por key', async () => {
      const customConfig = {
        id: 2,
        key: 'custom_setting',
        value: { enabled: true },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSystemConfigRepository.findOne.mockResolvedValue(customConfig);

      const result = await service.getConfig('custom_setting');

      expect(mockSystemConfigRepository.findOne).toHaveBeenCalledWith({
        where: { key: 'custom_setting' },
      });
      expect(result).toEqual({ enabled: true });
    });

    it('debe lanzar NotFoundException si la configuración no existe', async () => {
      mockSystemConfigRepository.findOne.mockResolvedValue(null);

      await expect(service.getConfig('non_existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getConfig('non_existent')).rejects.toThrow(
        'Configuration non_existent not found',
      );
    });
  });

  describe('updateConfig', () => {
    it('debe actualizar una configuración existente', async () => {
      const existingConfig = {
        id: 1,
        key: 'test_config',
        value: { old: 'value' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const newValue = { new: 'value' };

      mockSystemConfigRepository.findOne.mockResolvedValue(existingConfig);
      mockSystemConfigRepository.save.mockResolvedValue({
        ...existingConfig,
        value: newValue,
      });

      await service.updateConfig('test_config', newValue);

      expect(mockSystemConfigRepository.findOne).toHaveBeenCalledWith({
        where: { key: 'test_config' },
      });
      expect(mockSystemConfigRepository.save).toHaveBeenCalledWith({
        ...existingConfig,
        value: newValue,
      });
    });

    it('debe crear una nueva configuración si no existe', async () => {
      const newConfig = {
        key: 'new_config',
        value: { test: 'data' },
      };

      mockSystemConfigRepository.findOne.mockResolvedValue(null);
      mockSystemConfigRepository.create.mockReturnValue(newConfig);
      mockSystemConfigRepository.save.mockResolvedValue({
        ...newConfig,
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await service.updateConfig('new_config', { test: 'data' });

      expect(mockSystemConfigRepository.create).toHaveBeenCalledWith({
        key: 'new_config',
        value: { test: 'data' },
      });
      expect(mockSystemConfigRepository.save).toHaveBeenCalled();
    });
  });
});
