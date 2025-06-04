import { Insumo } from "src/insumo/entities/insumo.entity";
import { Turno } from "src/turno/entities/turno.entity";
import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Servicio {

    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column({ nullable: true })
    description: string

    @Column('decimal', { precision: 10, scale: 2 })
    precio: number

    @Column({ default: false })
    isDeleted: boolean;

    @ManyToMany(() => Insumo, (insumo) => insumo.servicio)
    @JoinTable()
    insumo: Insumo[];

    @ManyToMany(() => Turno, (turno) => turno.servicio)
    @JoinTable()
    turno: Turno[];


    constructor(name: string, description: string, precio: number) {
        this.name = name;
        this.description = description;
        this.precio = precio;
    }
}