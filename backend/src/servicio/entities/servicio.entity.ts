import { Producto } from '../../producto/entities/producto.entity';
import { Turno } from '../../turno/entities/turno.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Servicio {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column('decimal', { precision: 10, scale: 0 })
  precio: number;

  @Column()
  duration: number;

  @Column({ default: false })
  isDeleted: boolean;

  @ManyToMany(() => Producto, (Producto) => Producto.servicio)
  @JoinTable()
  Producto: Producto[];

  @ManyToMany(() => Turno, (turno) => turno.servicio)
  turno: Turno[];

  constructor(
    name: string,
    description: string,
    precio: number,
    duration: number,
  ) {
    this.name = name;
    this.description = description;
    this.precio = precio;
    this.duration = duration;
  }
}
