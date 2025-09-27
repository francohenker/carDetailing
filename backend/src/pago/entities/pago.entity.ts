import Decimal from 'decimal.js';
import { estado_pago } from 'src/enums/estado_pago.enum';
import { metodo_pago } from 'src/enums/metodo_pago.enum';
import { Turno } from 'src/turno/entities/turno.entity';
import { Column, Entity, PrimaryGeneratedColumn, OneToOne, ManyToOne } from 'typeorm';

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

  @Column({default: estado_pago.PENDIENTE})
  estado: estado_pago;

  @ManyToOne(() => Turno, (turno) => turno.pago)
  turno: Turno;


  constructor(monto: number,
    fecha_pago: Date,
    metodo: metodo_pago,
    estado: estado_pago,
    turno: Turno,
  ) {
    //config use decimal.js to avoid floating point issues (maybe sometimes)
    // this.monto = new Decimal(monto).toNumber();
    this.monto = monto;
    this.fecha_pago = fecha_pago;
    this.metodo = metodo;
    this.estado = estado;
    this.turno = turno;
  }

}
