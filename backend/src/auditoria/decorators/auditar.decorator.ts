import { SetMetadata } from '@nestjs/common';
import { TipoAccion, TipoEntidad } from '../entities/auditoria.entity';

export interface AuditoriaMetadata {
  accion: TipoAccion;
  entidad: TipoEntidad;
  descripcion?: string;
}

export const AUDITORIA_KEY = 'auditoria';
export const Auditar = (metadata: AuditoriaMetadata) =>
  SetMetadata(AUDITORIA_KEY, metadata);
