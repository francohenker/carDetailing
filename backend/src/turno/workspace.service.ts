import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkSpace } from './entities/workspace.entity';
import { Turno } from './entities/turno.entity';

@Injectable()
export class WorkspaceService {
  constructor(
    @InjectRepository(WorkSpace)
    private workspaceRepository: Repository<WorkSpace>,
    @InjectRepository(Turno)
    private turnoRepository: Repository<Turno>,
  ) {}

  async create(name: string, description?: string): Promise<WorkSpace> {
    const workspace = this.workspaceRepository.create({ name, description });
    return await this.workspaceRepository.save(workspace);
  }

  async findAll(): Promise<WorkSpace[]> {
    return await this.workspaceRepository.find({
      order: { createdAt: 'ASC' },
    });
  }

  async findActive(): Promise<WorkSpace[]> {
    return await this.workspaceRepository.find({
      where: { isActive: true },
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: number): Promise<WorkSpace> {
    const workspace = await this.workspaceRepository.findOne({ where: { id } });
    if (!workspace) {
      throw new NotFoundException(`Espacio con ID ${id} no encontrado`);
    }
    return workspace;
  }

  async update(
    id: number,
    name: string,
    description?: string,
  ): Promise<WorkSpace> {
    const workspace = await this.findOne(id);
    workspace.name = name;
    if (description !== undefined) workspace.description = description;
    return await this.workspaceRepository.save(workspace);
  }

  async toggleActive(id: number): Promise<WorkSpace & { wasLastActive?: boolean }> {
    const workspace = await this.findOne(id);
    const deactivating = workspace.isActive;

    let wasLastActive = false;
    if (deactivating) {
      const activeCount = await this.workspaceRepository.count({
        where: { isActive: true },
      });
      wasLastActive = activeCount === 1;
    }

    workspace.isActive = !workspace.isActive;
    const saved = await this.workspaceRepository.save(workspace);
    return { ...saved, wasLastActive };
  }

  async remove(id: number): Promise<void> {
    const workspace = await this.findOne(id);
    const turnoCount = await this.turnoRepository.count({
      where: { workspace: { id } },
    });
    if (turnoCount > 0) {
      throw new ConflictException(
        'Este espacio tiene turnos asignados y no puede eliminarse. Para deshabilitarlo, cámbialo a estado inactivo.',
      );
    }
    await this.workspaceRepository.remove(workspace);
  }

  async getActiveCount(): Promise<number> {
    return await this.workspaceRepository.count({ where: { isActive: true } });
  }
}
