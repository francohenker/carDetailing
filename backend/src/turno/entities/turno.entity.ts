import { Car } from "src/car/entities/car.entity";
import { estado_turno } from "src/enums/estado_turno.enum";
import { Pago } from "src/pago/entities/pago.entity";
import { Servicio } from "src/servicio/entities/servicio.entity";
import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Turno {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => Car, (Car) => Car.turno)
    car: Car

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    fechaHora: Date

    @Column()
    estado: estado_turno

    @Column()
    observacion: string

    @ManyToMany(() => Servicio, (Servicio) => Servicio.turno)
    @JoinTable()
    servicio: Servicio[]

    // @Column({ nullable: true })
    @OneToOne(() => Pago, (pago) => pago.turno)
    pago: Pago


    constructor(car: Car, estado: estado_turno, observacion: string, servicio: Servicio[]) {
        this.car = car;
        this.estado = estado;
        this.observacion = observacion;
        this.servicio = servicio;
    }
}