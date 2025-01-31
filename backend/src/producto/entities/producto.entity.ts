import { Categoria } from "src/categoria/entities/categoria.entity";
import { OrdenDetalle } from "src/orden/entities/ordenDetalle.entity";
import { Column, Entity, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";


@Entity()
export class Producto {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    nombre: string;

    @Column()
    descripcion: string;

    @Column()
    stock: number;

    @Column('decimal', { precision: 10, scale: 2 })
    precio: number;

    @Column({ nullable: true, type: 'bytea' })
    imagen: Buffer;

    @ManyToOne(() => Categoria, (categoria) => categoria.productos)
    categoria: Categoria;

    @ManyToMany(() => OrdenDetalle, (ordenDetalle) => ordenDetalle.producto)
    ordenes: OrdenDetalle[];

}