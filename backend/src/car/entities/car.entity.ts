import { Turno } from "src/turno/entities/turno.entity";
import { User } from "src/user/entities/user.entity";
import { Column, Entity, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Car{
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => User, (User) => User.cars)
    user: User

    @Column()
    marca: string

    @Column()
    model: string

    @Column()
    patente: string

    @Column()
    color: string

    @OneToMany(() => Turno, (Turno) => Turno.car)
    turno: Turno


    constructor(marca: string, model: string, patente: string, color: string) {
        this.marca = marca;
        this.model = model;
        this.patente = patente;
        this.color = color;
    }
    
}

