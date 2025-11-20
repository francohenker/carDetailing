import { IsNumber } from 'class-validator';

export class SelectWinnerDto {
  @IsNumber()
  responseId: number;
}
