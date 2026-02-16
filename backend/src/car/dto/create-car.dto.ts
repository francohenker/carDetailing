import { IsString } from 'class-validator';
export class createCarDto {
  @IsString()
  marca: string;
  @IsString()
  model: string;
  @IsString()
  patente: string;
  @IsString()
  color: string;
  @IsString()
  type: string;
}
