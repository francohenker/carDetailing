import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateQuotationRequestDto {
  @IsArray()
  productIds: number[];

  @IsArray()
  supplierIds: number[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isAutomatic?: boolean;
}
