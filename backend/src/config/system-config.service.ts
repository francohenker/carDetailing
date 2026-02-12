import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemConfig } from './entities/system-config.entity';
import { UpdateQuotationThresholdsDto } from './dto/update-quotation-thresholds.dto';
import { TIPO_AUTO } from '../enums/tipo_auto.enum';

@Injectable()
export class SystemConfigService {
  constructor(
    @InjectRepository(SystemConfig)
    private systemConfigRepository: Repository<SystemConfig>,
  ) {
    this.initializeDefaultConfig();
  }

  private async initializeDefaultConfig() {
    const thresholdsConfig = await this.systemConfigRepository.findOne({
      where: { key: 'quotation_thresholds' },
    });

    if (!thresholdsConfig) {
      await this.systemConfigRepository.save({
        key: 'quotation_thresholds',
        value: {
          high: 1,
          medium: 2,
          low: 3,
        },
      });
    }

    const vehicleTypesConfig = await this.systemConfigRepository.findOne({
      where: { key: 'active_vehicle_types' },
    });

    if (!vehicleTypesConfig) {
      await this.systemConfigRepository.save({
        key: 'active_vehicle_types',
        value: [TIPO_AUTO.AUTO, TIPO_AUTO.CAMIONETA],
      });
    }
  }

  async getQuotationThresholds(): Promise<{
    high: number;
    medium: number;
    low: number;
  }> {
    const config = await this.systemConfigRepository.findOne({
      where: { key: 'quotation_thresholds' },
    });

    if (!config) {
      return { high: 1, medium: 2, low: 3 };
    }

    return config.value;
  }

  async updateQuotationThresholds(
    dto: UpdateQuotationThresholdsDto,
  ): Promise<{ high: number; medium: number; low: number }> {
    let config = await this.systemConfigRepository.findOne({
      where: { key: 'quotation_thresholds' },
    });

    if (!config) {
      config = this.systemConfigRepository.create({
        key: 'quotation_thresholds',
        value: { high: 1, medium: 2, low: 3 },
      });
    }

    const currentValue = config.value;
    config.value = {
      high: dto.high !== undefined ? dto.high : currentValue.high,
      medium: dto.medium !== undefined ? dto.medium : currentValue.medium,
      low: dto.low !== undefined ? dto.low : currentValue.low,
    };

    await this.systemConfigRepository.save(config);
    return config.value;
  }

  async getConfig(key: string): Promise<any> {
    const config = await this.systemConfigRepository.findOne({
      where: { key },
    });

    if (!config) {
      throw new NotFoundException(`Configuration ${key} not found`);
    }

    return config.value;
  }

  async updateConfig(key: string, value: any): Promise<void> {
    let config = await this.systemConfigRepository.findOne({
      where: { key },
    });

    if (!config) {
      config = this.systemConfigRepository.create({ key, value });
    } else {
      config.value = value;
    }

    await this.systemConfigRepository.save(config);
  }

  async getActiveVehicleTypes(): Promise<TIPO_AUTO[]> {
    const config = await this.systemConfigRepository.findOne({
      where: { key: 'active_vehicle_types' },
    });
    if (!config) {
      return [TIPO_AUTO.AUTO, TIPO_AUTO.CAMIONETA];
    }
    return config.value;
  }

  async updateActiveVehicleTypes(types: TIPO_AUTO[]): Promise<TIPO_AUTO[]> {
    await this.updateConfig('active_vehicle_types', types);
    return types;
  }
}
