import React from 'react';
import { TrendingUp, TrendingDown, Plus, Minus, Edit, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AuditSummaryProps {
  accion: string;
  entidad: string;
  entidadId?: number;
  descripcion?: string;
  datosAnteriores?: any;
  datosNuevos?: any;
}

const AuditSummary: React.FC<AuditSummaryProps> = ({
  accion,
  entidad,
  entidadId,
  descripcion,
  datosAnteriores,
  datosNuevos,
}) => {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREAR':
        return <Plus className="h-4 w-4" />;
      case 'ACTUALIZAR':
      case 'MODIFICAR':
        return <Edit className="h-4 w-4" />;
      case 'ELIMINAR':
        return <Minus className="h-4 w-4" />;
      case 'MARCAR_COMPLETADO':
      case 'MARCAR_PAGADO':
        return <TrendingUp className="h-4 w-4" />;
      case 'CANCELAR':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREAR':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'ACTUALIZAR':
      case 'MODIFICAR':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'ELIMINAR':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'LOGIN':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'LOGOUT':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'MARCAR_COMPLETADO':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'MARCAR_PAGADO':
        return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      case 'CANCELAR':
        return 'bg-pink-100 text-pink-700 border-pink-200';
      case 'MODIFICAR_ROL':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'ACTIVAR_DESACTIVAR':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getEntityDisplayName = (entity: string) => {
    const names: { [key: string]: string } = {
      USUARIO: 'Usuario',
      TURNO: 'Turno',
      SERVICIO: 'Servicio',
      PRODUCTO: 'Producto',
      PROVEEDOR: 'Proveedor',
      PAGO: 'Pago',
      CAR: 'Vehículo',
      SISTEMA: 'Sistema',
    };
    return names[entity] || entity;
  };

  const getActionDisplayName = (action: string) => {
    const names: { [key: string]: string } = {
      CREAR: 'Creado',
      ACTUALIZAR: 'Actualizado',
      ELIMINAR: 'Eliminado',
      LOGIN: 'Inicio de sesión',
      LOGOUT: 'Cierre de sesión',
      MARCAR_COMPLETADO: 'Marcado como completado',
      MARCAR_PAGADO: 'Marcado como pagado',
      CANCELAR: 'Cancelado',
      MODIFICAR_ROL: 'Rol modificado',
      MODIFICAR: 'Modificado',
      ACTIVAR_DESACTIVAR: 'Estado cambiado',
    };
    return names[action] || action;
  };

  const getChangesCount = () => {
    if (!datosAnteriores || !datosNuevos) return 0;

    let count = 0;
    Object.keys(datosNuevos).forEach((key) => {
      if (datosAnteriores[key] !== datosNuevos[key]) {
        count++;
      }
    });
    return count;
  };

  const changesCount = getChangesCount();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Badge
          variant="outline"
          className={`flex items-center gap-1 ${getActionColor(accion)}`}
        >
          {getActionIcon(accion)}
          {getActionDisplayName(accion)}
        </Badge>

        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">
            {getEntityDisplayName(entidad)}
          </span>
          {/*{entidadId && (
            <Badge variant="secondary" className="text-xs">
              ID: {entidadId}
            </Badge>
          )}*/}
        </div>

        {changesCount > 0 && (
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
            {changesCount} {changesCount === 1 ? 'cambio' : 'cambios'}
          </Badge>
        )}
      </div>

      {descripcion && (
        <div className="text-sm text-gray-600 max-w-md truncate" title={descripcion}>
          {descripcion}
        </div>
      )}
    </div>
  );
};

export default AuditSummary;
