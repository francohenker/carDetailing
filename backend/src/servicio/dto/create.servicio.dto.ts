import { IsNumber, IsString, Max, IsBoolean, Min } from 'class-validator';
import { Precio } from '../../precio/entities/precio.entity';

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
  @Min(0)
  durationDays?: number; // Número de días si es servicio multi-día
  @IsBoolean()
  isMultiDay?: boolean; // Indica si es un servicio que dura múltiples días
  @IsNumber()
  productId?: number[];
}
