import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ProductoService } from './producto.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../roles/role.guard';
import { Role } from '../roles/role.enum';
import { Roles } from '../roles/role.decorator';
import {
  TipoAccion,
  TipoEntidad,
} from '../auditoria/entities/auditoria.entity';
import { Auditar } from '../auditoria/decorators/auditar.decorator';

@Controller('producto')
export class ProductoController {
  constructor(private readonly productoService: ProductoService) {}

  @Auditar({
    accion: TipoAccion.CREAR,
    entidad: TipoEntidad.PRODUCTO,
    descripcion: 'Creación de nuevo producto',
  })
  //crea un nuevo producto
  @Post('create')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async createProducto(@Body() createProductoDto: CreateProductoDto) {
    const result = await this.productoService.create(createProductoDto);
    // Retornar datos enriquecidos para auditoría
    return {
      id: result.id,
      name: result.name,
      price: result.price,
      stock_actual: result.stock_actual,
      stock_minimo: result.stock_minimo,
      suppliers: result.suppliers?.map((s) => ({ id: s.id, name: s.name })),
    };
  }

  //obtiene todos los productos
  @Get('getall')
  findAllProductos() {
    return this.productoService.findAll();
  }

  //obtiene un producto por id
  @Get(':id')
  findProductoById(@Body('id') id: number) {
    return this.productoService.findById(id);
  }

  @Auditar({
    accion: TipoAccion.MODIFICAR,
    entidad: TipoEntidad.PRODUCTO,
    descripcion: 'Actualización de producto',
    capturarDatosAnteriores: true,
  })
  @Put('update/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updateProducto(
    @Param('id') id: number,
    @Body() updateProductoDto: UpdateProductoDto,
  ) {
    const result = await this.productoService.update(id, updateProductoDto);
    // Retornar con nombres de proveedores para auditoría
    return {
      ...result,
      suppliers: result.suppliers?.map((s) => ({ id: s.id, name: s.name })),
    };
  }

  @Auditar({
    accion: TipoAccion.MODIFICAR,
    entidad: TipoEntidad.PRODUCTO,
    descripcion: 'Actualización de producto stock mínimo',
    capturarDatosAnteriores: true,
  })
  // Método legacy para actualizar solo stock - mantener compatibilidad
  @Put('update-stock/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updateStock(
    @Param('id') id: number,
    @Body('stock_actual') stock_actual: number,
    @Body('stock_minimo') stock_minimo: number,
  ) {
    return this.productoService.update(id, { stock_actual, stock_minimo });
  }

  @Auditar({
    accion: TipoAccion.ELIMINAR,
    entidad: TipoEntidad.PRODUCTO,
    descripcion: 'Eliminación de producto',
  })
  @Delete('delete/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async deleteProducto(@Param('id') id: number) {
    // Obtener producto antes de eliminar para auditoría
    const producto = await this.productoService.findById(id);
    await this.productoService.delete(id);
    // Retornar datos enriquecidos para auditoría
    return {
      id: producto.id,
      name: producto.name,
      price: producto.price,
      stock_actual: producto.stock_actual,
      stock_minimo: producto.stock_minimo,
    };
  }
}
