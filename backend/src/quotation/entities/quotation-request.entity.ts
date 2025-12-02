import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { Producto } from '../../producto/entities/producto.entity';
import { Supplier } from '../../supplier/entities/supplier.entity';
import { QuotationRequestStatus } from '../../enums/quotation-status.enum';

@Entity('quotation_requests')
export class QuotationRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToMany(() => Producto)
  @JoinTable({
    name: 'quotation_request_products',
    joinColumn: { name: 'quotationRequestId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'productoId', referencedColumnName: 'id' },
  })
  products: Producto[];

  @ManyToMany(() => Supplier)
  @JoinTable({
    name: 'quotation_request_suppliers',
    joinColumn: { name: 'quotationRequestId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'supplierId', referencedColumnName: 'id' },
  })
  suppliers: Supplier[];

  @Column({
    type: 'enum',
    enum: QuotationRequestStatus,
    default: QuotationRequestStatus.PENDING,
  })
  status: QuotationRequestStatus;

  @CreateDateColumn()
  sentAt: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToMany('QuotationResponse', (response: any) => response.quotationRequest)
  responses: any[];
}
