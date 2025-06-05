import { TIPO_AUTO } from "src/enums/tipo_auto.enum";
import { Turno } from "src/turno/entities/turno.entity";
import { Users } from "src/users/entities/users.entity";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

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

    @Column()
    type: TIPO_AUTO

    @OneToMany(() => Turno, (Turno) => Turno.car)
    turno: Turno[];

    @Column({ default: false })
    isDeleted: boolean;


    constructor(user: Users, marca: string, model: string, patente: string, color: string, type: TIPO_AUTO) {
        this.user = user;
        this.marca = marca;
        this.model = model;
        this.patente = patente;
        this.color = color;
        this.type = type
    }
    
}

