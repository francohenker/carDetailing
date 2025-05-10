import { Car } from "src/car/entities/car.entity";
import { estado_turno } from "src/enums/estado_turno";
import { Pago } from "src/pago/entities/pago.entity";
import { Servicio } from "src/servicio/entities/servicio.entity";
import { Column, Entity, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Turno{
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => Car, (Car) => Car.turno)
    car: Car

    @Column({ type: 'timestamp'})   
    fechaHora: Date

    @Column()
    estado: estado_turno

    @Column()
    observacion: string

    @OneToMany(() => Servicio, (Servicio) => Servicio.turno)
    servicio: Servicio[]

    @OneToOne(() => Pago, (pago) => pago.turno)
    pago: Pago
}