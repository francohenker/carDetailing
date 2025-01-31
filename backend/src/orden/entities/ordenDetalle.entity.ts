import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from 'typeorm';
import { Orden } from './orden.entity';
import { Producto } from 'src/producto/entities/producto.entity';

@Entity()
export class OrdenDetalle {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Orden, (orden) => orden.detalles, { onDelete: 'CASCADE' })
    orden: Orden;

    @ManyToOne(() => Producto, (producto) => producto.ordenes, { eager: true })
    producto: Producto;

    @Column()
    cantidad: number;

    @Column('decimal', { precision: 10, scale: 2 })
    precioUnitario: number;

    @Column('decimal', { precision: 10, scale: 2 })
    subtotal: number;
}
