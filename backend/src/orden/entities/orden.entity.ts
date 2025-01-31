import { Producto } from "src/producto/entities/producto.entity";
import { Column, Entity, JoinColumn, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { OrdenDetalle } from "./ordenDetalle.entity";


@Entity()
export class Orden {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    fecha: Date;

    @Column('decimal', { precision: 10, scale: 2 })
    total: number;

    @ManyToMany(() => Producto)
    @JoinColumn()
    productos: [];

    @Column()
    usuario: string;

    @Column()
    tipoPago: string;

    @OneToMany(() => OrdenDetalle, (ordenDetalle) => ordenDetalle.orden, {
        cascade: true, // Para que los detalles de la orden se guarden automáticamente
    })
    detalles: OrdenDetalle[];
}