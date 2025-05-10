import { Insumo } from "src/insumo/entities/insumo.entity";
import { Turno } from "src/turno/entities/turno.entity";
import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Servicio{

    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column()
    description: string

    @Column('decimal', { precision: 10, scale: 2 })
    precio: number

    @ManyToOne(() => Turno, turno => turno.servicio)
    turno: Turno;

    @ManyToMany(() => Insumo, (insumo) => insumo.servicio)
    @JoinTable()
    insumo: Insumo[];
}