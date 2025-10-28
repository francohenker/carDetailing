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
  createProducto(@Body() createProductoDto: CreateProductoDto) {
    return this.productoService.create(createProductoDto);
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
  })
  @Put('update/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updateProducto(
    @Param('id') id: number,
    @Body() updateProductoDto: UpdateProductoDto,
  ) {
    return this.productoService.update(id, updateProductoDto);
  }

  @Auditar({
    accion: TipoAccion.MODIFICAR,
    entidad: TipoEntidad.PRODUCTO,
    descripcion: 'Actualización de producto stock mínimo',
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
  deleteProducto(@Param('id') id: number) {
    return this.productoService.delete(id);
  }
}
