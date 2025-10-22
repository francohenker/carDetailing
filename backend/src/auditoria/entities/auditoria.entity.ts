import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Users } from '../../users/entities/users.entity';

export enum TipoAccion {
  CREAR = 'CREAR',
  ACTUALIZAR = 'ACTUALIZAR',
  ELIMINAR = 'ELIMINAR',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  MARCAR_COMPLETADO = 'MARCAR_COMPLETADO',
  MARCAR_PAGADO = 'MARCAR_PAGADO',
  CANCELAR = 'CANCELAR',
  MODIFICAR_ROL = 'MODIFICAR_ROL',
  ACTIVAR_DESACTIVAR = 'ACTIVAR_DESACTIVAR',
}

export enum TipoEntidad {
  USUARIO = 'USUARIO',
  TURNO = 'TURNO',
  SERVICIO = 'SERVICIO',
  PRODUCTO = 'PRODUCTO',
  PROVEEDOR = 'PROVEEDOR',
  PAGO = 'PAGO',
  CAR = 'CAR',
  SISTEMA = 'SISTEMA',
}

@Entity('auditoria')
export class Auditoria {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: TipoAccion,
  })
  accion: TipoAccion;

  @Column({
    type: 'enum',
    enum: TipoEntidad,
  })
  entidad: TipoEntidad;

  @Column({ nullable: true })
  entidadId: number;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'json', nullable: true })
  datosAnteriores: any;

  @Column({ type: 'json', nullable: true })
  datosNuevos: any;

  @Column({ nullable: true })
  ip: string;

  @Column({ nullable: true })
  userAgent: string;

  @CreateDateColumn()
  fechaCreacion: Date;

  @ManyToOne(() => Users, { eager: true })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Users;

  @Column({ name: 'usuario_id', nullable: true })
  usuarioId: number;
}
