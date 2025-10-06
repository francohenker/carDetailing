import { Type } from 'class-transformer';
import { IsNumber, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Precio } from 'src/precio/entities/precio.entity';

export class UpdateServicioDto {
  @IsNumber()
  @Min(1)
  @Max(999999999)
  id: number;

  @IsString()
  name: string;

  @IsString()
  description: string;

  @ValidateNested({ each: true })
  @Type(() => Precio)
  precio: Precio[];

  @IsNumber()
  productId?: number[];

  @IsNumber()
  @Min(30)
  @Max(10000)
  duration: number;
}
