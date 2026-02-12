import { Test, TestingModule } from '@nestjs/testing';
import { SystemConfigController } from './system-config.controller';
import { SystemConfigService } from './system-config.service';
import { UpdateQuotationThresholdsDto } from './dto/update-quotation-thresholds.dto';

describe('SystemConfigController', () => {
  let controller: SystemConfigController;
  let service: SystemConfigService;

  const mockSystemConfigService = {
    getQuotationThresholds: jest.fn(),
    updateQuotationThresholds: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SystemConfigController],
      providers: [
        {
          provide: SystemConfigService,
          useValue: mockSystemConfigService,
        },
      ],
    }).compile();

    controller = module.get<SystemConfigController>(SystemConfigController);
    service = module.get<SystemConfigService>(SystemConfigService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getQuotationThresholds', () => {
    it('debe obtener los umbrales de cotización', async () => {
      const mockThresholds = {
        high: 1,
        medium: 2,
        low: 3,
      };

      mockSystemConfigService.getQuotationThresholds.mockResolvedValue(
        mockThresholds,
      );

      const result = await controller.getQuotationThresholds();

      expect(service.getQuotationThresholds).toHaveBeenCalled();
      expect(result).toEqual(mockThresholds);
    });
  });

  describe('updateQuotationThresholds', () => {
    it('debe actualizar los umbrales de cotización', async () => {
      const updateDto: UpdateQuotationThresholdsDto = {
        high: 2,
        medium: 4,
        low: 6,
      };

      const updatedThresholds = {
        high: 2,
        medium: 4,
        low: 6,
      };

      mockSystemConfigService.updateQuotationThresholds.mockResolvedValue(
        updatedThresholds,
      );

      const result = await controller.updateQuotationThresholds(updateDto);

      expect(service.updateQuotationThresholds).toHaveBeenCalledWith(updateDto);
      expect(result).toEqual(updatedThresholds);
    });

    it('debe actualizar solo algunos campos', async () => {
      const updateDto: UpdateQuotationThresholdsDto = {
        high: 5,
      };

      const updatedThresholds = {
        high: 5,
        medium: 2,
        low: 3,
      };

      mockSystemConfigService.updateQuotationThresholds.mockResolvedValue(
        updatedThresholds,
      );

      const result = await controller.updateQuotationThresholds(updateDto);

      expect(service.updateQuotationThresholds).toHaveBeenCalledWith(updateDto);
      expect(result.high).toBe(5);
      expect(result.medium).toBe(2);
    });
  });
});
