import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreateQuotationRequestDto {
  @IsArray()
  productIds: number[];

  @IsArray()
  supplierIds: number[];

  @IsOptional()
  @IsString()
  notes?: string;
}
