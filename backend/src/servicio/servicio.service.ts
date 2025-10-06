import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Servicio } from './entities/servicio.entity';
import { Precio } from '../precio/entities/precio.entity';
import { In, Repository } from 'typeorm';
import { CreateServicioDto } from './dto/create.servicio.dto';
import { UpdateServicioDto } from './dto/update.servicio.dto';
import { Producto } from 'src/producto/entities/producto.entity';

@Injectable()
export class ServicioService {
  constructor(
    @InjectRepository(Servicio)
    private servicioRepository: Repository<Servicio>,
    @InjectRepository(Precio)
    private precioRepository: Repository<Precio>,
    @InjectRepository(Producto)
    private productoRepository: Repository<Producto>,
  ) {}

  async create(servicio: CreateServicioDto): Promise<Servicio> {
    let productos: Producto[] = [];

    // Manejar productos si existen
    if (servicio.productId && servicio.productId.length > 0) {
      productos = await this.productoRepository.findBy({
        id: In(servicio.productId),
      });

      // Validar que se encontraron todos los productos
      if (productos.length !== servicio.productId.length) {
        throw new HttpException('Uno o más productos no encontrados', 404);
      }
    }
    // Crear el servicio sin precios primero
    const service = new Servicio(
      servicio.name,
      servicio.description,
      [],
      servicio.duration,
      productos,
    );
    const savedService = await this.servicioRepository.save(service);

    // Crear los precios asociados
    if (servicio.precio && servicio.precio.length > 0) {
      const precios = servicio.precio.map((p) => {
        const precio = new Precio(savedService.id, p.tipoVehiculo, p.precio);
        return precio;
      });

      const savedPrecios = await this.precioRepository.save(precios);
      savedService.precio = savedPrecios;
      await this.servicioRepository.save(savedService);
    }

    return savedService;
  }

  async update(servicio: UpdateServicioDto, id: number): Promise<Servicio> {
    const oldService = await this.servicioRepository.findOne({
      where: { id: id },
      relations: ['precio'],
    });
    if (!oldService) {
      throw new HttpException('Servicio not found', 404);
    }

    // Actualizar datos básicos del servicio
    oldService.name = servicio.name;
    oldService.description = servicio.description;
    oldService.duration = servicio.duration;

    // Actualizar productos asociados
    if (servicio.productId && servicio.productId.length > 0) {
      const productos = await this.productoRepository.findBy({
        id: In(servicio.productId),
      });

      if (productos.length !== servicio.productId.length) {
        throw new HttpException('Uno o más productos no encontrados', 404);
      }

      oldService.Producto = productos;
    } else {
      // Si no se envían productos, limpiar la relación
      oldService.Producto = [];
    }

    // Eliminar precios antiguos
    if (oldService.precio && oldService.precio.length > 0) {
      await this.precioRepository.remove(oldService.precio);
    }
    // Crear nuevos precios
    if (servicio.precio && servicio.precio.length > 0) {
      const nuevosPrecios = servicio.precio.map((p) => {
        const precio = new Precio(id, p.tipoVehiculo, p.precio);
        return precio;
      });

      oldService.precio = await this.precioRepository.save(nuevosPrecios);
    }
    // const price = await this.createPrecio(servicio.precio);
    // oldService.precio = price;
    return await this.servicioRepository.save(oldService);
  }

  async createPrecio(precio: Precio[]): Promise<Precio[]> {
    return this.precioRepository.save(precio);
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
      relations: ['precio'],
    });
    if (servicios.length === 0) {
      throw new HttpException('No servicios found', 404);
    }
    if (servicios.length !== ids.length) {
      throw new HttpException('One o more servicios not found for ids', 404);
    }
    return servicios;
  }

  async getAll(): Promise<Servicio[]> {
    return this.servicioRepository.find({
      where: {
        isDeleted: false,
      },
      relations: ['precio', 'Producto'],
    });
  }
}
