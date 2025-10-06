import { Precio } from 'src/precio/entities/precio.entity';
import { Producto } from '../../producto/entities/producto.entity';
import { Turno } from '../../turno/entities/turno.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
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

  @OneToMany(() => Precio, (precio) => precio.servicio, {
    cascade: true,
    eager: false,
  })
  precio: Precio[];

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
    precio: Precio[],
    duration: number,
    producto?: Producto[],
  ) {
    this.name = name;
    this.description = description;
    this.precio = precio;
    this.duration = duration;
    this.Producto = producto;
  }
}
