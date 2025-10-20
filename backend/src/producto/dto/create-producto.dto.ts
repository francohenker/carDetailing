import { IsNumber, IsString, IsArray, IsOptional } from 'class-validator';

export class CreateProductoDto {
  @IsString()
  name: string;

  @IsNumber()
  price: number;

  @IsNumber()
  stock_actual: number;

  @IsNumber()
  stock_minimo: number;

  @IsNumber()
  @IsOptional()
  servicios_por_producto?: number;

  @IsOptional()
  @IsArray()
  supplierIds?: number[];
}
