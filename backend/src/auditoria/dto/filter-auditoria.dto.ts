import { IsOptional, IsEnum, IsDateString, IsNumber } from 'class-validator';
import { TipoAccion, TipoEntidad } from '../entities/auditoria.entity';

export class FilterAuditoriaDto {
  @IsOptional()
  @IsEnum(TipoAccion)
  accion?: TipoAccion;

  @IsOptional()
  @IsEnum(TipoEntidad)
  entidad?: TipoEntidad;

  @IsOptional()
  @IsNumber()
  entidadId?: number;

  @IsOptional()
  @IsNumber()
  usuarioId?: number;

  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;
}
