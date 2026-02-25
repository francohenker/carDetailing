import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { PurchaseOrderStatus } from '../../enums/purchase-order-status.enum';

export class UpdatePurchaseOrderStatusDto {
  @IsEnum(PurchaseOrderStatus)
  status: PurchaseOrderStatus;

  @IsOptional()
  receivedAt?: Date;

  @IsOptional()
  @IsInt()
  receivedById?: number;
}
