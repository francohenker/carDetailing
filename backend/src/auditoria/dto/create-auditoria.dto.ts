import {
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  IsObject,
} from 'class-validator';
import { TipoAccion, TipoEntidad } from '../entities/auditoria.entity';

export class CreateAuditoriaDto {
  @IsEnum(TipoAccion)
  accion: TipoAccion;

  @IsEnum(TipoEntidad)
  entidad: TipoEntidad;

  @IsOptional()
  @IsNumber()
  entidadId?: number;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsObject()
  datosAnteriores?: any;

  @IsOptional()
  @IsObject()
  datosNuevos?: any;

  @IsOptional()
  @IsString()
  ip?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsNumber()
  usuarioId?: number;
}
