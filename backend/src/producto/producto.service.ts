import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Producto } from './entities/producto.entity';
import { Supplier } from '../supplier/entities/supplier.entity';
import { Repository } from 'typeorm/repository/Repository';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';

@Injectable()
export class ProductoService {
  constructor(
    @InjectRepository(Producto)
    private productoRepository: Repository<Producto>,
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,
  ) {}

  async create(createProductoDto: CreateProductoDto): Promise<Producto> {
    const producto = new Producto(
      createProductoDto.name,
      createProductoDto.stock_actual,
      createProductoDto.price,
      createProductoDto.stock_minimo,
    );

    // Si se proporcionan supplierIds, buscar y asociar los suppliers
    if (
      createProductoDto.supplierIds &&
      createProductoDto.supplierIds.length > 0
    ) {
      const suppliers = await this.supplierRepository.findByIds(
        createProductoDto.supplierIds,
      );
      producto.suppliers = suppliers;
    }

    return this.productoRepository.save(producto);
  }

  findAll(): Promise<Producto[]> {
    return this.productoRepository.find({
      where: { isDeleted: false },
      relations: ['suppliers'],
    });
  }

  findById(id: number): Promise<Producto> {
    return this.productoRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['suppliers'],
    });
  }

  async update(
    id: number,
    updateProductoDto: UpdateProductoDto,
  ): Promise<Producto> {
    const producto = await this.productoRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['suppliers'],
    });

    if (!producto) {
      throw new HttpException('Producto not found', 404);
    }

    // Actualizar campos básicos
    if (updateProductoDto.name !== undefined) {
      producto.name = updateProductoDto.name;
    }
    if (updateProductoDto.price !== undefined) {
      producto.price = updateProductoDto.price;
    }
    if (updateProductoDto.stock_actual !== undefined) {
      producto.stock_actual = updateProductoDto.stock_actual;
    }
    if (updateProductoDto.stock_minimo !== undefined) {
      producto.stock_minimo = updateProductoDto.stock_minimo;
    }

    // Actualizar suppliers si se proporcionan
    if (updateProductoDto.supplierIds !== undefined) {
      if (updateProductoDto.supplierIds.length > 0) {
        const suppliers = await this.supplierRepository.findByIds(
          updateProductoDto.supplierIds,
        );
        producto.suppliers = suppliers;
      } else {
        producto.suppliers = [];
      }
    }

    return this.productoRepository.save(producto);
  }

  async updateStock(
    id: number,
    stock_actual: number,
    stock_minimo: number,
  ): Promise<Producto> {
    const producto = await this.productoRepository.findOne({
      where: { id, isDeleted: false },
    });
    if (!producto) {
      throw new HttpException('Producto not found', 404);
    }
    producto.stock_actual = stock_actual;
    producto.stock_minimo = stock_minimo;
    return this.productoRepository.save(producto);
  }

  //adjust stock alert (stock_minimo)
  // async ajustStock(id: number, cantidad: number): Promise<Producto> {
  //     const producto = await this.productoRepository.findOne({ where: { id, isDeleted: false } });
  //     if (!producto) {
  //         throw new HttpException('Producto not found', 404);
  //     }
  //     producto.stock_minimo = cantidad;
  //     return this.productoRepository.save(producto);
  // }

  async delete(id: number): Promise<void> {
    const producto = await this.productoRepository.findOne({
      where: { id, isDeleted: false },
    });
    if (!producto) {
      throw new HttpException('Producto not found', 404);
    }
    producto.isDeleted = true;
    await this.productoRepository.save(producto);
  }
}
