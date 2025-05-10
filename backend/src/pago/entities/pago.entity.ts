
import { estado_pago } from 'src/enums/estado_pago';
import { metodo_pago } from 'src/enums/metodo_pago';
import { Turno } from 'src/turno/entities/turno.entity';
import { Column, Entity, PrimaryGeneratedColumn, OneToOne } from 'typeorm';

@Entity()
export class Pago {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('decimal', { precision: 10, scale: 2 })
    monto: number;

    @Column({ type: 'timestamp' })
    fecha_pago: Date;

    @Column()
    metodo: metodo_pago;

    @Column()
    estado: estado_pago;

    @OneToOne(() => Turno, (turno) => turno.pago)
    turno: Turno;

}