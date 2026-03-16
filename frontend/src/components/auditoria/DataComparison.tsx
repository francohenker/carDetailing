import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Service {
  id: number;
  name: string;
}

interface DataComparisonProps {
  datosAnteriores?: any;
  datosNuevos?: any;
  accion: string;
  services?: Service[];
}

// ─── Etiquetas legibles para cada clave del objeto ───────────────────────────
const FIELD_LABELS: Record<string, string> = {
  name: 'Nombre',
  description: 'Descripción',
  duration: 'Duración (min)',
  precio: 'Precios',
  totalPrice: 'Precio Total',
  price: 'Precio',
  estado: 'Estado',
  status: 'Estado',
  isActive: 'Estado',
  fechaHora: 'Fecha y Hora',
  date: 'Fecha',
  observacion: 'Observación',
  notes: 'Notas',
  stock_actual: 'Stock Actual',
  stock_minimo: 'Stock Mínimo',
  marca: 'Marca',
  model: 'Modelo',
  year: 'Año',
  patente: 'Patente',
  type: 'Tipo de Vehículo',
  color: 'Color',
  email: 'Email',
  firstname: 'Nombre',
  lastname: 'Apellido',
  phone: 'Teléfono',
  role: 'Rol',
  address: 'Dirección',
  monto: 'Monto',
  metodo: 'Método de Pago',
  suppliers: 'Proveedores',
  supplierIds: 'Proveedores (IDs)',
  servicio: 'Servicios',
  services: 'Servicios',
  products: 'Productos',
  Producto: 'Productos',
  responseId: 'Respuesta Ganadora',
  workspace: 'Espacio de Trabajo',
  car: 'Vehículo',
};

// ─── Campos que NO se muestran en la vista simple ────────────────────────────
const SKIP_FIELDS = new Set([
  'id',
  'createdAt',
  'updatedAt',
  'servicioId',
  'userId',
  'carId',
  'turnoId',
  'supplierIds',
  'productIds',
  'isDeleted',
  'turno',
  'pago',
]);

// ─── Formato de moneda argentina ─────────────────────────────────────────────
const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);

// ─── Formato de fecha ─────────────────────────────────────────────────────────
const formatDate = (value: string): string => {
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// ─── Verificar si es un array de precios por tipo de vehículo ────────────────
const isPriceArray = (value: any[]): boolean =>
  value.length > 0 && value[0] != null && typeof value[0] === 'object' &&
  ('tipoVehiculo' in value[0] || 'precio' in value[0]);

// ─── Verificar si es un array de entidades con nombre ────────────────────────
const isNamedEntityArray = (value: any[]): boolean =>
  value.length > 0 && value[0] != null && typeof value[0] === 'object' && 'name' in value[0];

// ─── Formateo principal de un valor según su clave ───────────────────────────
const formatValue = (value: any, key?: string): string => {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Activo' : 'Inactivo';

  // ----- Arrays ---------------------------------------------------------------
  if (Array.isArray(value)) {
    if (value.length === 0) return '—';

    // Array de IDs simples (números o strings)
    if (typeof value[0] !== 'object') {
      return value.join(', ');
    }

    // Array de precios por tipo de vehículo: [{ tipoVehiculo, precio, ... }]
    if (isPriceArray(value)) {
      return value
        .map((p: any) => {
          const tipo = p.tipoVehiculo ?? p.tipo ?? '?';
          const monto = typeof p.precio === 'number' ? formatCurrency(p.precio) : `$${p.precio}`;
          return `${tipo}: ${monto}`;
        })
        .join('  |  ');
    }

    // Array de entidades con nombre: [{ id, name, ... }]
    if (isNamedEntityArray(value)) {
      return value.map((item: any) => item.name ?? `ID: ${item.id}`).join(', ');
    }

    // Fallback para arrays de objetos desconocidos
    return value.map((item: any) => (typeof item === 'object' ? JSON.stringify(item) : String(item))).join(', ');
  }

  // ----- Objeto simple (no array) ---------------------------------------------
  if (typeof value === 'object') {
    // Vehículo: { marca, model, patente, ... }
    if ('marca' in value && 'patente' in value) {
      const parts: string[] = [];
      if (value.marca) parts.push(value.marca);
      if (value.model) parts.push(value.model);
      if (value.patente) parts.push(`(${value.patente})`);
      if (value.user?.firstname) {
        const fullName = [value.user.firstname, value.user.lastname].filter(Boolean).join(' ');
        parts.push(`— Cliente: ${fullName}`);
      }
      return parts.join(' ');
    }
    // Espacio de trabajo: { name, isActive }
    if ('isActive' in value && 'name' in value) return `${value.name} (${value.isActive ? 'Activo' : 'Inactivo'})`;
    // Objeto de entidad con nombre genérico
    if ('name' in value) return String(value.name);
    return JSON.stringify(value, null, 2);
  }

  // ----- Fechas ---------------------------------------------------------------
  if (
    key &&
    (key.toLowerCase().includes('fecha') ||
      key === 'date' ||
      key === 'createdAt' ||
      key === 'updatedAt') &&
    typeof value === 'string'
  ) {
    return formatDate(value);
  }

  // ----- Precios numéricos ----------------------------------------------------
  if (
    key &&
    (key === 'totalPrice' || key === 'price' || key === 'monto') &&
    typeof value === 'number'
  ) {
    return formatCurrency(value);
  }

  return String(value);
};

// ─── Etiqueta visible de cada clave ──────────────────────────────────────────
const getLabel = (key: string): string => FIELD_LABELS[key] ?? key;

// ─── Color según tipo de cambio ──────────────────────────────────────────────
const getChangeColor = (oldValue: any, newValue: any) => {
  if (oldValue === undefined) return 'text-green-700 bg-green-50 border-green-200';
  if (newValue === undefined) return 'text-red-700 bg-red-50 border-red-200';
  return 'text-blue-700 bg-blue-50 border-blue-200';
};

// ─── Verificar si el dato es un objeto válido (no array) ─────────────────────
const isValidObject = (data: any): boolean =>
  data != null && typeof data === 'object' && !Array.isArray(data);

// ─── Obtener diferencias entre dos objetos ───────────────────────────────────
const getDifferences = (oldData: any, newData: any) => {
  const differences: { [key: string]: { old: any; new: any } } = {};
  if (!isValidObject(oldData) || !isValidObject(newData)) return differences;

  const allKeys = new Set([...Object.keys(newData), ...Object.keys(oldData)]);
  allKeys.forEach((key) => {
    if (SKIP_FIELDS.has(key)) return;
    const oldVal = JSON.stringify(oldData[key]);
    const newVal = JSON.stringify(newData[key]);
    if (oldVal !== newVal) {
      differences[key] = { old: oldData[key], new: newData[key] };
    }
  });
  return differences;
};

// ─── Renderiza una grilla de clave-valor para CREAR / ELIMINAR ───────────────
const KeyValueGrid: React.FC<{ data: any; colorClass: string; labelClass: string; valueClass: string }> = ({
  data,
  colorClass,
  labelClass,
  valueClass,
}) => {
  if (!isValidObject(data)) return <p className={`text-sm ${valueClass}`}>{String(data)}</p>;

  const entries = Object.entries(data).filter(([key]) => !SKIP_FIELDS.has(key));
  if (entries.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
      {entries.map(([key, value]) => (
        <div key={key} className="flex gap-1 min-w-0">
          <span className={`font-semibold shrink-0 ${labelClass}`}>{getLabel(key)}:</span>
          <span className={`break-words min-w-0 ${valueClass}`}>{formatValue(value, key)}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────
const DataComparison: React.FC<DataComparisonProps> = ({
  datosAnteriores,
  datosNuevos,
  accion,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRawData, setShowRawData] = useState(false);

  if (!datosAnteriores && !datosNuevos) return null;

  const differences = getDifferences(datosAnteriores, datosNuevos);
  const hasDifferences = Object.keys(differences).length > 0;

  return (
    <div className="border-t pt-3 space-y-3">
      {/* ── Cabecera expandible ── */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0 h-auto"
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
          Detalles del cambio
          {hasDifferences && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              {Object.keys(differences).length} cambios
            </span>
          )}
        </h4>

        {isExpanded && (
          <Button variant="ghost" size="sm" onClick={() => setShowRawData(!showRawData)} className="text-xs">
            {showRawData ? (
              <><EyeOff className="h-3 w-3 mr-1" /> Vista simple</>
            ) : (
              <><Eye className="h-3 w-3 mr-1" /> Datos completos</>
            )}
          </Button>
        )}
      </div>

      {/* ── Contenido expandido ── */}
      {isExpanded && (
        <div className="space-y-4">
          {showRawData ? (
            /* ── Vista RAW ────────────────────────────────────────────────── */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {datosAnteriores && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-sm font-medium text-red-700">Datos Anteriores</span>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <pre className="text-xs text-red-800 whitespace-pre-wrap overflow-x-auto max-h-60 overflow-y-auto">
                      {isValidObject(datosAnteriores)
                        ? JSON.stringify(datosAnteriores, null, 2)
                        : String(datosAnteriores)}
                    </pre>
                  </div>
                </div>
              )}
              {datosNuevos && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-sm font-medium text-green-700">Datos Nuevos</span>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <pre className="text-xs text-green-800 whitespace-pre-wrap overflow-x-auto max-h-60 overflow-y-auto">
                      {isValidObject(datosNuevos)
                        ? JSON.stringify(datosNuevos, null, 2)
                        : String(datosNuevos)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ── Vista SIMPLE ─────────────────────────────────────────────── */
            <div className="space-y-3">
              {hasDifferences ? (
                /* Cambios específicos (MODIFICAR) */
                Object.entries(differences).map(([key, change]) => (
                  <div
                    key={key}
                    className={`rounded-md p-3 border ${getChangeColor(change.old, change.new)}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm">{getLabel(key)}</span>
                      <span className="text-xs opacity-70">
                        {change.old === undefined ? 'Nuevo campo' : change.new === undefined ? 'Eliminado' : 'Modificado'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {change.old !== undefined && (
                        <div>
                          <div className="font-medium mb-1 text-red-600">Anterior:</div>
                          <div className="bg-white bg-opacity-60 rounded p-2 border">
                            {formatValue(change.old, key)}
                          </div>
                        </div>
                      )}
                      {change.new !== undefined && (
                        <div>
                          <div className="font-medium mb-1 text-green-600">Nuevo:</div>
                          <div className="bg-white bg-opacity-60 rounded p-2 border">
                            {formatValue(change.new, key)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : accion === 'CREAR' && datosNuevos ? (
                /* Registro creado */
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="text-sm font-semibold text-green-700 mb-3">
                    Registro creado con los siguientes datos:
                  </div>
                  <KeyValueGrid
                    data={datosNuevos}
                    colorClass="text-green-800"
                    labelClass="text-green-600"
                    valueClass="text-green-800"
                  />
                </div>
              ) : accion === 'ELIMINAR' && datosAnteriores ? (
                /* Registro eliminado */
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="text-sm font-semibold text-red-700 mb-3">
                    Registro eliminado con los siguientes datos:
                  </div>
                  <KeyValueGrid
                    data={datosAnteriores}
                    colorClass="text-red-800"
                    labelClass="text-red-600"
                    valueClass="text-red-800"
                  />
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No se detectaron cambios específicos
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DataComparison;
