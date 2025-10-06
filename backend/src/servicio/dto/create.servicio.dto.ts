import { IsNumber, IsString, Max } from 'class-validator';
import { Precio } from 'src/precio/entities/precio.entity';

export class CreateServicioDto {
  @IsString()
  name: string;
  @IsString()
  description: string;
  precio: Precio[];
  @IsNumber()
  @Max(10000)
  duration: number;
  @IsNumber()
  productId?: number[];
}
