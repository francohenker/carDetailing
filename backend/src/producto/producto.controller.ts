import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ProductoService } from './producto.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('producto')
export class ProductoController {
    constructor(
        private readonly productoService: ProductoService,
    ) {}

    //crea un nuevo producto
    @Post('create')
    // @UseGuards(AuthGuard)
    createProducto(@Body() createProductoDto: CreateProductoDto) {
        return this.productoService.create(createProductoDto);
    }

    //obtiene todos los productos
    @Get('all')
    findAllProductos() {
        return this.productoService.findAll();
    }

    //obtiene un producto por id
    @Get(':id')
    findProductoById(@Body('id') id: number) {
        return this.productoService.findById(id);
    }


    @Post('update-stock')
    // @UseGuards(AuthGuard)
    async updateStock(@Body('id') id: number, @Body('stock_actual') stock_actual: number) {
        return this.productoService.updateStock(id, stock_actual);
    }

    //use for change stock_minimo alert
    @Post('ajust-stock')
    // @UseGuards(AuthGuard)
    async ajustStock(@Body('id') id: number, @Body('cantidad') cantidad: number) {
        return this.productoService.ajustStock(id, cantidad);
    }

    @Post('delete')
    // @UseGuards(AuthGuard)
    deleteProducto(@Body('id') id: number) {
        return this.productoService.delete(id);
    }



}
