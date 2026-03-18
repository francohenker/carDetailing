import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemConfig } from './entities/system-config.entity';
import { Precio } from '../precio/entities/precio.entity';
import { UpdateQuotationThresholdsDto } from './dto/update-quotation-thresholds.dto';

const DEFAULT_VEHICLE_TYPES = [
  { key: 'AUTO', label: 'Auto', emoji: '🚗' },
  { key: 'CAMIONETA', label: 'Camioneta', emoji: '🚙' },
  { key: 'MOTO', label: 'Moto', emoji: '🏍️' },
  { key: 'CAMION', label: 'Camión', emoji: '🚛' },
  { key: 'UTILITARIO', label: 'Utilitario', emoji: '🚐' },
];

export interface VehicleTypeDefinition {
  key: string;
  label: string;
  emoji: string;
}

@Injectable()
export class SystemConfigService {
  constructor(
    @InjectRepository(SystemConfig)
    private systemConfigRepository: Repository<SystemConfig>,
    @InjectRepository(Precio)
    private precioRepository: Repository<Precio>,
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
        value: ['AUTO', 'CAMIONETA'],
      });
    }

    const allVehicleTypesConfig = await this.systemConfigRepository.findOne({
      where: { key: 'all_vehicle_types' },
    });

    if (!allVehicleTypesConfig) {
      await this.systemConfigRepository.save({
        key: 'all_vehicle_types',
        value: DEFAULT_VEHICLE_TYPES,
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

  async getActiveVehicleTypes(): Promise<string[]> {
    const config = await this.systemConfigRepository.findOne({
      where: { key: 'active_vehicle_types' },
    });
    if (!config) {
      return ['AUTO', 'CAMIONETA'];
    }
    return config.value;
  }

  async updateActiveVehicleTypes(
    types: string[],
    deactivatedTypes?: string[],
  ): Promise<string[]> {
    await this.updateConfig('active_vehicle_types', types);

    // If types were deactivated, remove their prices from services
    if (deactivatedTypes && deactivatedTypes.length > 0) {
      for (const deactivatedType of deactivatedTypes) {
        const normalizedType = deactivatedType.toUpperCase();
        const result = await this.precioRepository
          .createQueryBuilder()
          .delete()
          .where('UPPER(tipoVehiculo) = UPPER(:tipoVehiculo)', {
            tipoVehiculo: normalizedType,
          })
          .execute();

        if (result.affected > 0) {
          console.log(
            `Se eliminaron ${result.affected} precios del tipo de vehículo desactivado '${normalizedType}'`,
          );
        }
      }
    }

    return types;
  }

  async getAllVehicleTypes(): Promise<VehicleTypeDefinition[]> {
    const config = await this.systemConfigRepository.findOne({
      where: { key: 'all_vehicle_types' },
    });
    if (!config) {
      return DEFAULT_VEHICLE_TYPES;
    }
    return config.value;
  }

  async addVehicleType(
    definition: VehicleTypeDefinition,
  ): Promise<VehicleTypeDefinition[]> {
    const allTypes = await this.getAllVehicleTypes();
    const exists = allTypes.find(
      (t) => t.key.toUpperCase() === definition.key.toUpperCase(),
    );
    if (exists) {
      throw new NotFoundException(
        `El tipo de vehículo '${definition.key}' ya existe`,
      );
    }
    definition.key = definition.key.toUpperCase();
    allTypes.push(definition);
    await this.updateConfig('all_vehicle_types', allTypes);
    return allTypes;
  }

  async removeVehicleType(key: string): Promise<VehicleTypeDefinition[]> {
    const normalizedKey = key.toUpperCase();
    const allTypes = await this.getAllVehicleTypes();
    const filtered = allTypes.filter(
      (t) => t.key.toUpperCase() !== normalizedKey,
    );

    if (filtered.length === allTypes.length) {
      throw new NotFoundException(`El tipo de vehículo '${key}' no existe`);
    }

    // Remove from all types
    await this.updateConfig('all_vehicle_types', filtered);

    // Also remove from active types if present
    const activeTypes = await this.getActiveVehicleTypes();
    const filteredActive = activeTypes.filter(
      (t) => t.toUpperCase() !== normalizedKey,
    );
    if (filteredActive.length !== activeTypes.length) {
      await this.updateConfig('active_vehicle_types', filteredActive);
    }

    // Remove all service prices associated with this vehicle type
    // Use QueryBuilder for case-insensitive deletion to handle any data inconsistencies
    const result = await this.precioRepository
      .createQueryBuilder()
      .delete()
      .where('UPPER(tipoVehiculo) = UPPER(:tipoVehiculo)', {
        tipoVehiculo: normalizedKey,
      })
      .execute();

    if (result.affected === 0) {
      console.warn(
        `No se encontraron precios para el tipo de vehículo '${normalizedKey}'`,
      );
    } else {
      console.log(
        `Se eliminaron ${result.affected} precios del tipo de vehículo '${normalizedKey}'`,
      );
    }

    return filtered;
  }

  async cleanupOrphanedPrices(): Promise<void> {
    const validTypes = await this.getAllVehicleTypes();
    const validKeys = validTypes.map((t) => t.key.toUpperCase());

    // Find all prices that don't match any valid vehicle type
    const allPrices = await this.precioRepository.find();
    const orphanedPrices = allPrices.filter(
      (p) => !validKeys.includes(p.tipoVehiculo.toUpperCase()),
    );

    if (orphanedPrices.length > 0) {
      console.log(
        `Encontrados ${orphanedPrices.length} precios huérfanos. Eliminando...`,
      );
      await this.precioRepository.remove(orphanedPrices);
      console.log(
        `Se eliminaron ${orphanedPrices.length} precios de tipos de vehículos que no existen`,
      );
    }
  }
}
