import {
  IsNumber,
  IsString,
  IsArray,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ProductPriority } from '../../enums/product-priority.enum';

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
  @IsEnum(ProductPriority)
  priority?: ProductPriority;

  @IsOptional()
  @IsArray()
  supplierIds?: number[];
}
