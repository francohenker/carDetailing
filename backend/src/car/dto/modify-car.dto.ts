import { IsNumber, IsString, Max, IsNotEmpty } from 'class-validator';

export class modifyCarDto {
  @IsNumber()
  @Max(9999999)
  id: number;
  @IsString()
  @IsNotEmpty({ message: 'El color es requerido' })
  color: string;
}
