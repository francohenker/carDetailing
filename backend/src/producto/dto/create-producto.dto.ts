import { IsNumber, IsString, IsArray, IsOptional, IsEnum } from 'class-validator';
import { ProductPriority } from '../../enums/product-priority.enum';

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
  @IsEnum(ProductPriority)
  priority?: ProductPriority;

  @IsOptional()
  @IsArray()
  supplierIds?: number[];
}
