import { IsNumber, IsString } from "class-validator";

export class CreateProductoDto {
    @IsString()
    nombre: string;

    @IsString()
    descripcion: string;

    @IsNumber()
    precio: number;

    @IsNumber()
    stock_actual: number;
}
