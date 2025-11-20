import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { QuotationRequest } from './quotation-request.entity';
import { Supplier } from '../../supplier/entities/supplier.entity';
import { QuotationResponseStatus } from '../../enums/quotation-status.enum';

@Entity('quotation_responses')
export class QuotationResponse {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => QuotationRequest, (request) => request.responses)
  @JoinColumn({ name: 'quotationRequestId' })
  quotationRequest: QuotationRequest;

  @Column()
  quotationRequestId: number;

  @ManyToOne(() => Supplier)
  @JoinColumn({ name: 'supplierId' })
  supplier: Supplier;

  @Column()
  supplierId: number;

  @Column({ type: 'json', comment: 'Detalles de cotización por producto' })
  productQuotes: Array<{
    productId: number;
    productName: string;
    unitPrice: number;
    quantity: number;
    availability: string;
  }>;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: 'int', comment: 'Días de entrega estimados' })
  deliveryDays: number;

  @Column({ type: 'varchar', length: 255 })
  paymentTerms: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({
    type: 'enum',
    enum: QuotationResponseStatus,
    default: QuotationResponseStatus.PENDING,
  })
  status: QuotationResponseStatus;

  @Column({ type: 'boolean', default: false })
  isWinner: boolean;

  @CreateDateColumn()
  receivedAt: Date;
}
