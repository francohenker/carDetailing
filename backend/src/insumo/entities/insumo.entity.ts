import { Servicio } from "src/servicio/entities/servicio.entity";
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Insumo {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    nombre: string;

    @Column({type: 'decimal', precision: 10, scale: 2})
    stock_minimo: number;
    
    @Column({type: 'decimal', precision: 10, scale: 2})
    stock: number;

    @ManyToMany(() => Servicio, (servicio) => servicio.insumo)
    servicio: Servicio[];
}