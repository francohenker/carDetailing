import { Precio } from '../../precio/entities/precio.entity';
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

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @OneToMany(() => Precio, (precio) => precio.servicio, {
    cascade: true,
    eager: false,
  })
  precio: Precio[];

  @Column({
    comment: 'Duración en minutos del servicio (si es menor a 10 horas)',
  })
  duration: number;

  @Column({
    default: 0,
    comment: 'Número de días que dura el servicio (0 si es un unico día)',
  })
  durationDays: number;

  @Column({
    default: false,
    comment: 'Indica si este servicio ocupa múltiples días',
  })
  isMultiDay: boolean;

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
    durationDays?: number,
    isMultiDay?: boolean,
  ) {
    this.name = name;
    this.description = description;
    this.precio = precio;
    this.duration = duration;
    this.Producto = producto;
    this.durationDays = durationDays || 0;
    this.isMultiDay = isMultiDay || false;
  }
}
