import { IsString, IsNotEmpty, MinLength } from 'class-validator';
export class createCarDto {
  @IsString()
  @IsNotEmpty({ message: 'La marca es requerida' })
  marca: string;

  @IsString()
  @IsNotEmpty({ message: 'El modelo es requerido' })
  model: string;

  @IsString()
  @IsNotEmpty({ message: 'La patente es requerida' })
  patente: string;

  @IsString()
  @IsNotEmpty({ message: 'El color es requerido' })
  color: string;

  @IsString()
  @IsNotEmpty({ message: 'El tipo de vehículo es requerido' })
  type: string;
}
