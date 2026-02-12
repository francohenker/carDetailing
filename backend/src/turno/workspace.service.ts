import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkSpace } from './entities/workspace.entity';

@Injectable()
export class WorkspaceService {
  constructor(
    @InjectRepository(WorkSpace)
    private workspaceRepository: Repository<WorkSpace>,
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

  async toggleActive(id: number): Promise<WorkSpace> {
    const workspace = await this.findOne(id);
    workspace.isActive = !workspace.isActive;
    return await this.workspaceRepository.save(workspace);
  }

  async remove(id: number): Promise<void> {
    const workspace = await this.findOne(id);
    await this.workspaceRepository.remove(workspace);
  }

  async getActiveCount(): Promise<number> {
    return await this.workspaceRepository.count({ where: { isActive: true } });
  }
}
