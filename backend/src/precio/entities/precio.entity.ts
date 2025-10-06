import { TIPO_AUTO } from 'src/enums/tipo_auto.enum';
import { Servicio } from 'src/servicio/entities/servicio.entity';
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

  @Column({
    type: 'enum',
    enum: TIPO_AUTO,
  })
  tipoVehiculo: TIPO_AUTO;

  @Column('decimal', { precision: 10 })
  precio: number;

  constructor(servicioId: number, tipoVehiculo: TIPO_AUTO, precio: number) {
    this.servicioId = servicioId;
    this.tipoVehiculo = tipoVehiculo;
    this.precio = precio;
  }
}
