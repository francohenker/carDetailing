import {
  ArrayNotEmpty,
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsNumber,
  IsString,
} from 'class-validator';
import { estado_turno } from '../../enums/estado_turno.enum';

export class ModifyTurnoDto {
  @IsNumber()
  turnoId: number;

  @IsDate()
  fechaHora: Date;

  @IsEnum(estado_turno)
  estado: estado_turno;

  @IsString()
  observacion: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  servicios: number[];
}
