import { IsNumber, IsString, IsArray, IsOptional } from 'class-validator';

export class UpdateProductoDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsNumber()
  stock_actual?: number;

  @IsOptional()
  @IsNumber()
  stock_minimo?: number;

  @IsOptional()
  @IsNumber()
  servicios_por_producto?: number;

  @IsOptional()
  @IsArray()
  supplierIds?: number[];
}
