import { Turno } from "src/turno/entities/turno.entity";
import { Users } from "src/users/entities/users.entity";
import { Column, Entity, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Car{
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => Users, (User) => User.cars)
    user: Users

    @Column()
    marca: string

    @Column()
    model: string

    @Column({unique: true})
    patente: string

    @Column()
    color: string

    @OneToMany(() => Turno, (Turno) => Turno.car)
    turno: Turno


    constructor(user: Users, marca: string, model: string, patente: string, color: string) {
        this.user = user;
        this.marca = marca;
        this.model = model;
        this.patente = patente;
        this.color = color;
    }
    
}

