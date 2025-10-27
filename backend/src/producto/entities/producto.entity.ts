import { Servicio } from '../../servicio/entities/servicio.entity';
import { Supplier } from '../../supplier/entities/supplier.entity';
import {
  Column,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  JoinTable,
} from 'typeorm';

@Entity()
export class Producto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'decimal', default: 0 })
  stock_minimo: number;

  @Column({ type: 'decimal' })
  stock_actual: number;

  @Column({ type: 'decimal' })
  price: number;

  @Column({
    type: 'int',
    default: 1,
    comment:
      'Cantidad de servicios que se pueden realizar con una unidad del producto',
  })
  servicios_por_producto: number;

  @ManyToMany(() => Servicio, (servicio) => servicio.Producto)
  servicio: Servicio[];

  @ManyToMany(() => Supplier)
  @JoinTable({
    name: 'producto_suppliers',
    joinColumn: { name: 'productoId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'supplierId', referencedColumnName: 'id' },
  })
  suppliers: Supplier[];

  @Column({ default: false })
  isDeleted: boolean;

  constructor(
    name: string,
    stock_actual: number,
    price: number,
    stock_minimo: number,
    servicios_por_producto: number = 1,
  ) {
    this.name = name;
    this.stock_actual = stock_actual;
    this.stock_minimo = stock_minimo;
    this.price = price;
    this.servicios_por_producto = servicios_por_producto;
    this.isDeleted = false;
  }
}
