import { IsNumber } from 'class-validator';

export class CreatePagoDto {
  @IsNumber()
  turnoId: number;
}
