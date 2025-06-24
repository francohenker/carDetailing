import { IsString } from 'class-validator';
import { TIPO_AUTO } from '../../enums/tipo_auto.enum';
export class createCarDto {
  @IsString()
  marca: string;
  @IsString()
  model: string;
  @IsString()
  patente: string;
  @IsString()
  color: string;
  type: TIPO_AUTO;
}
