import {
  ArrayNotEmpty,
  IsArray,
  IsDate,
  IsInt,
  IsString,
} from 'class-validator';

export class CreateTurnoDto {
  @IsInt()
  carId: number;

  @IsDate()
  date: Date;

  // @IsEnum(estado_turno)
  // estado: estado_turno;

  @IsString()
  observacion: string;

  duration: number;

  totalPrice: number;

  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  services: number[];
}
