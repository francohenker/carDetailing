import { IsNumber, IsString, Max, Min } from 'class-validator';

export class ModifyServicioDto {
  @IsNumber()
  @Min(1)
  @Max(999999999)
  id: number;

  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  @Max(99999999)
  precio: number;
}
