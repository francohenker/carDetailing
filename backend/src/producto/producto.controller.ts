import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ProductoService } from './producto.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/roles/role.guard';
import { Role } from 'src/roles/role.enum';
import { Roles } from 'src/roles/role.decorator';

@Controller('producto')
export class ProductoController {
    constructor(
        private readonly productoService: ProductoService,
    ) {}

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


    @Put('update-stock')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    async updateStock(@Body('id') id: number, @Body('stock_actual') stock_actual: number) {
        return this.productoService.updateStock(id, stock_actual);
    }

    //use for change stock_minimo alert
    @Post('ajust-stock')
    // @UseGuards(AuthGuard)
    async ajustStock(@Body('id') id: number, @Body('cantidad') cantidad: number) {
        return this.productoService.ajustStock(id, cantidad);
    }

    @Delete('delete/:id')
    // @UseGuards(AuthGuard)
    deleteProducto(@Param('id') id: number) {
        return this.productoService.delete(id);
    }



}
