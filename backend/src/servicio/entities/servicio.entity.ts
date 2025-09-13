import { Producto } from 'src/Producto/entities/producto.entity';
import { Turno } from 'src/turno/entities/turno.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToOne,
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

  @Column('decimal', { precision: 10, scale: 2 })
  precio: number;

  @Column({ default: false })
  isDeleted: boolean;

  @ManyToMany(() => Producto, (Producto) => Producto.servicio)
  @JoinTable()
  Producto: Producto[];

  @ManyToMany(() => Turno, (turno) => turno.servicio)
  turno: Turno[];

  constructor(name: string, description: string, precio: number) {
    this.name = name;
    this.description = description;
    this.precio = precio;
  }
}
