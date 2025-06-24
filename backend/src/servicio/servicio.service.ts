import { HttpException, Injectable, UsePipes } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Servicio } from './entities/servicio.entity';
import { In, Repository } from 'typeorm';
import { CreateServicioDto } from './dto/create.servicio.dto';
import { ModifyServicioDto } from './dto/modify.servicio.dto';

@Injectable()
export class ServicioService {
  constructor(
    @InjectRepository(Servicio)
    private servicioRepository: Repository<Servicio>,
  ) {}

  async create(servicio: CreateServicioDto): Promise<Servicio> {
    const service = new Servicio(
      servicio.name,
      servicio.description,
      servicio.precio,
    );
    return this.servicioRepository.save(service);
  }

  async modify(servicio: ModifyServicioDto): Promise<Servicio> {
    const oldService = await this.servicioRepository.findOneBy({
      id: servicio.id,
    });
    if (!oldService) {
      throw new HttpException('Servicio not found', 404);
    }
    oldService.name = servicio.name;
    oldService.description = servicio.description;
    oldService.precio = servicio.precio;
    return await this.servicioRepository.save(oldService);
  }

  async delete(id: number): Promise<void> {
    const servicio = await this.servicioRepository.findOneBy({ id });
    if (!servicio) {
      throw new HttpException('Servicio not found', 404);
    }
    servicio.isDeleted = true;
    await this.servicioRepository.save(servicio);
  }

  async findByIds(ids: number[]): Promise<Servicio[]> {
    const servicios = await this.servicioRepository.find({
      where: {
        id: In(ids),
        isDeleted: false,
      },
    });
    if (servicios.length === 0) {
      throw new HttpException('No servicios found', 404);
    }
    if (servicios.length !== ids.length) {
      throw new HttpException('One o more servicios not found for ids', 404);
    }
    return servicios;
  }
}
