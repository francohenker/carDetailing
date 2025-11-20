import { IsNumber, IsOptional } from 'class-validator';

export class UpdateQuotationThresholdsDto {
  @IsOptional()
  @IsNumber()
  high?: number;

  @IsOptional()
  @IsNumber()
  medium?: number;

  @IsOptional()
  @IsNumber()
  low?: number;
}
