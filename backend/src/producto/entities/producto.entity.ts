import { Servicio } from '../../servicio/entities/servicio.entity';
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Producto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'decimal', default: 0 })
  stock_minimo: number;

  @Column({ type: 'decimal' })
  stock_actual: number;

  @Column({ type: 'decimal' })
  price: number;

  @ManyToMany(() => Servicio, (servicio) => servicio.Producto)
  servicio: Servicio[];

  @Column({ default: false })
  isDeleted: boolean;

  constructor(name: string, stock_actual: number, price: number) {
    this.name = name;
    this.stock_actual = stock_actual;
    this.stock_minimo = 0;
    this.price = price;
    this.isDeleted = false;
  }
}
