import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsString,
  ValidateNested,
} from 'class-validator';
import { estado_turno } from 'src/enums/estado_turno.enum';
import { Servicio } from 'src/servicio/entities/servicio.entity';

export class CreateTurnoDto {
  @IsInt()
  carId: number;

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
