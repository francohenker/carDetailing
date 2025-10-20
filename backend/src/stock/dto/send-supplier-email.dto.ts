import { IsNumber, IsString, IsArray, IsOptional } from 'class-validator';

export class SendSupplierEmailDto {
  @IsNumber()
  supplierId: number;

  @IsArray()
  @IsNumber({}, { each: true })
  productIds: number[];

  @IsOptional()
  @IsString()
  message?: string;
}
