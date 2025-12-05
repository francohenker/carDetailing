import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DataComparisonProps {
  datosAnteriores?: any;
  datosNuevos?: any;
  accion: string;
}

const DataComparison: React.FC<DataComparisonProps> = ({
  datosAnteriores,
  datosNuevos,
  accion,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRawData, setShowRawData] = useState(false);

  if (!datosAnteriores && !datosNuevos) {
    return null;
  }

  // Función auxiliar para verificar si el dato es un objeto válido
  const isValidObject = (data: any): boolean => {
    return data && typeof data === 'object' && !Array.isArray(data);
  };

  // Función para obtener las diferencias entre objetos
  const getDifferences = (oldData: any, newData: any) => {
    const differences: { [key: string]: { old: any; new: any } } = {};

    // Si alguno de los datos no es un objeto válido, no podemos comparar
    if (!isValidObject(oldData) || !isValidObject(newData)) return differences;

    // Comparar todas las claves del objeto nuevo
    Object.keys(newData).forEach((key) => {
      if (oldData[key] !== newData[key]) {
        differences[key] = {
          old: oldData[key],
          new: newData[key],
        };
      }
    });

    // Verificar claves que existían en el objeto anterior pero no en el nuevo
    Object.keys(oldData).forEach((key) => {
      if (!(key in newData)) {
        differences[key] = {
          old: oldData[key],
          new: undefined,
        };
      }
    });

    return differences;
  };

  const differences = getDifferences(datosAnteriores, datosNuevos);
  const hasDifferences = Object.keys(differences).length > 0;

  // Función para formatear valores
  const formatValue = (value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'boolean') return value.toString();
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  // Función para obtener el color del cambio
  const getChangeColor = (oldValue: any, newValue: any) => {
    if (oldValue === undefined) return 'text-green-700 bg-green-50'; // Nuevo campo
    if (newValue === undefined) return 'text-red-700 bg-red-50'; // Campo eliminado
    return 'text-blue-700 bg-blue-50'; // Campo modificado
  };

  return (
    <div className="border-t pt-3 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0 h-auto"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
          Detalles del cambio
          {hasDifferences && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              {Object.keys(differences).length} cambios
            </span>
          )}
        </h4>

        {isExpanded && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowRawData(!showRawData)}
            className="text-xs"
          >
            {showRawData ? (
              <>
                <EyeOff className="h-3 w-3 mr-1" />
                Vista simple
              </>
            ) : (
              <>
                <Eye className="h-3 w-3 mr-1" />
                Datos completos
              </>
            )}
          </Button>
        )}
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {showRawData ? (
            // Vista de datos completos
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {datosAnteriores && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-sm font-medium text-red-700">
                      Datos Anteriores
                    </span>
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
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium text-green-700">
                      Datos Nuevos
                    </span>
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
            // Vista de cambios específicos
            <div className="space-y-3">
              {hasDifferences ? (
                Object.entries(differences).map(([key, change]) => (
                  <div
                    key={key}
                    className={`rounded-md p-3 border ${getChangeColor(
                      change.old,
                      change.new
                    )}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{key}</span>
                      <span className="text-xs opacity-70">
                        {change.old === undefined
                          ? 'Nuevo'
                          : change.new === undefined
                          ? 'Eliminado'
                          : 'Modificado'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {change.old !== undefined && (
                        <div>
                          <div className="font-medium mb-1 text-red-600">
                            Anterior:
                          </div>
                          <div className="bg-white bg-opacity-50 rounded p-2 border">
                            <code className="whitespace-pre-wrap break-all">
                              {formatValue(change.old)}
                            </code>
                          </div>
                        </div>
                      )}

                      {change.new !== undefined && (
                        <div>
                          <div className="font-medium mb-1 text-green-600">
                            Nuevo:
                          </div>
                          <div className="bg-white bg-opacity-50 rounded p-2 border">
                            <code className="whitespace-pre-wrap break-all">
                              {formatValue(change.new)}
                            </code>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : accion === 'CREAR' && datosNuevos ? (
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <div className="text-sm font-medium text-green-700 mb-2">
                    Registro creado con los siguientes datos:
                  </div>
                  {isValidObject(datosNuevos) ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      {Object.entries(datosNuevos).map(([key, value]) => (
                        <div key={key} className="flex">
                          <span className="font-medium text-green-600 mr-2">
                            {key}:
                          </span>
                          <span className="text-green-800">
                            {formatValue(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-green-800">
                      {String(datosNuevos)}
                    </div>
                  )}
                </div>
              ) : accion === 'ELIMINAR' && datosAnteriores ? (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <div className="text-sm font-medium text-red-700 mb-2">
                    Registro eliminado con los siguientes datos:
                  </div>
                  {isValidObject(datosAnteriores) ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      {Object.entries(datosAnteriores).map(([key, value]) => (
                        <div key={key} className="flex">
                          <span className="font-medium text-red-600 mr-2">
                            {key}:
                          </span>
                          <span className="text-red-800">
                            {formatValue(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-red-800">
                      {String(datosAnteriores)}
                    </div>
                  )}
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
