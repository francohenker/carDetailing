import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePurchaseOrderItemDto {
  @IsInt()
  productoId: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsInt()
  @Min(1)
  quantityOrdered: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
