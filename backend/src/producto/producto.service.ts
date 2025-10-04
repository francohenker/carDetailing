import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Producto } from './entities/producto.entity';
import { Repository } from 'typeorm/repository/Repository';
import { CreateProductoDto } from './dto/create-producto.dto';

@Injectable()
export class ProductoService {
  constructor(
    @InjectRepository(Producto)
    private productoRepository: Repository<Producto>,
  ) {}

  create(createProductoDto: CreateProductoDto): Promise<Producto> {
    const producto = new Producto(
      createProductoDto.name,
      createProductoDto.stock_actual,
      createProductoDto.price,
      createProductoDto.stock_minimo,
    );
    return this.productoRepository.save(producto);
  }

  findAll(): Promise<Producto[]> {
    return this.productoRepository.find({ where: { isDeleted: false } });
  }

  findById(id: number): Promise<Producto> {
    return this.productoRepository.findOne({ where: { id, isDeleted: false } });
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
