import { Car } from '../../car/entities/car.entity';
import { estado_turno } from '../../enums/estado_turno.enum';
import { Pago } from '../../pago/entities/pago.entity';
import { Servicio } from '../../servicio/entities/servicio.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Turno {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Car, (Car) => Car.turno)
  car: Car;

  @Column({ type: 'timestamp' })
  fechaHora: Date;

  @Column()
  estado: estado_turno;

  @Column()
  observacion: string;

  @Column()
  duration: number;

  @Column()
  totalPrice: number;

  @ManyToMany(() => Servicio, (Servicio) => Servicio.turno)
  @JoinTable()
  servicio: Servicio[];

  @OneToMany(() => Pago, (pago) => pago.turno)
  pago: Pago[];

  constructor(
    car: Car,
    estado: estado_turno,
    observacion: string,
    servicio: Servicio[],
    fechaHora?: Date,
    duration?: number,
    totalPrice?: number,
  ) {
    this.car = car;
    this.estado = estado;
    this.observacion = observacion;
    this.fechaHora = fechaHora;
    this.servicio = servicio;
    this.duration = duration;
    this.totalPrice = totalPrice;
  }
}
