import { IsNumber, IsString } from 'class-validator';

export class CreateProductoDto {
  @IsString()
  name: string;

  @IsNumber()
  price: number;

  @IsNumber()
  stock_actual: number;

  @IsNumber()
  stock_minimo: number;
}
