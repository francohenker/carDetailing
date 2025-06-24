import {
  ArrayNotEmpty,
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsString,
} from 'class-validator';
import { estado_turno } from 'src/enums/estado_turno.enum';

export class ModifyTurnoDto {
  @IsInt()
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
