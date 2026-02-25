import { IsInt, IsOptional, Min } from 'class-validator';

export class UpdatePurchaseOrderItemDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  quantityReceived?: number;

  @IsOptional()
  notes?: string;

  @IsOptional()
  @IsInt()
  receivedById?: number;
}
