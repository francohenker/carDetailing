import { Servicio } from '../../servicio/entities/servicio.entity';
import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';

@Entity()
export class Precio {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  servicioId: number;

  @ManyToOne(() => Servicio, (servicio) => servicio.precio)
  @JoinColumn({ name: 'servicioId' })
  servicio: Servicio;

  @Column({ type: 'varchar', length: 100 })
  tipoVehiculo: string;

  @Column('decimal', { precision: 10 })
  precio: number;

  constructor(servicioId: number, tipoVehiculo: string, precio: number) {
    this.servicioId = servicioId;
    this.tipoVehiculo = tipoVehiculo;
    this.precio = precio;
  }
}
