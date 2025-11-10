import React from 'react';
import { TrendingUp, TrendingDown, Calendar, Clock, Users, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ActivitySummaryProps {
  registrosHoy: number;
  registrosAyer: number;
  registrosEstaSemana: number;
  registrosSemanaAnterior: number;
  crecimientoHoy: number;
  crecimientoSemana: number;
  usuariosMasActivos: Array<{ usuario: string; cantidad: number }>;
}

const ActivitySummary: React.FC<ActivitySummaryProps> = ({
  registrosHoy,
  registrosAyer,
  registrosEstaSemana,
  registrosSemanaAnterior,
  crecimientoHoy,
  crecimientoSemana,
  usuariosMasActivos,
}) => {
  const getTrendIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (growth < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Activity className="h-4 w-4 text-gray-600" />;
  };

  const getTrendColor = (growth: number) => {
    if (growth > 0) return "text-green-600 bg-green-50 border-green-200";
    if (growth < 0) return "text-red-600 bg-red-50 border-red-200";
    return "text-gray-600 bg-gray-50 border-gray-200";
  };

  const getActivityLevel = (today: number, yesterday: number) => {
    if (today === 0) return { level: 'Sin actividad', color: 'gray' };
    if (today > yesterday * 1.5) return { level: 'Muy alta', color: 'red' };
    if (today > yesterday) return { level: 'Alta', color: 'orange' };
    if (today === yesterday) return { level: 'Normal', color: 'blue' };
    return { level: 'Baja', color: 'green' };
  };

  const activityLevel = getActivityLevel(registrosHoy, registrosAyer);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Resumen de Actividad
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Actividad de Hoy */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Hoy</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{registrosHoy}</span>
              <Badge variant="outline" className={getTrendColor(crecimientoHoy)}>
                {getTrendIcon(crecimientoHoy)}
                <span className="ml-1">
                  {crecimientoHoy > 0 ? '+' : ''}{crecimientoHoy}%
                </span>
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Ayer: {registrosAyer} registros
            </p>
          </div>

          {/* Actividad de la Semana */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Esta Semana</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{registrosEstaSemana}</span>
              <Badge variant="outline" className={getTrendColor(crecimientoSemana)}>
                {getTrendIcon(crecimientoSemana)}
                <span className="ml-1">
                  {crecimientoSemana > 0 ? '+' : ''}{crecimientoSemana}%
                </span>
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Semana anterior: {registrosSemanaAnterior} registros
            </p>
          </div>

          {/* Nivel de Actividad */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Nivel de Actividad</span>
            </div>
            <div className="flex flex-col gap-1">
              <Badge
                variant="outline"
                className={`w-fit ${
                  activityLevel.color === 'red' ? 'bg-red-100 text-red-700 border-red-200' :
                  activityLevel.color === 'orange' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                  activityLevel.color === 'blue' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                  activityLevel.color === 'green' ? 'bg-green-100 text-green-700 border-green-200' :
                  'bg-gray-100 text-gray-700 border-gray-200'
                }`}
              >
                {activityLevel.level}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Comparado con ayer
            </p>
          </div>

          {/* Usuario Más Activo */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Más Activo Hoy</span>
            </div>
            <div className="flex flex-col gap-1">
              {usuariosMasActivos.length > 0 ? (
                <>
                  <span className="text-sm font-semibold truncate" title={usuariosMasActivos[0].usuario}>
                    {usuariosMasActivos[0].usuario}
                  </span>
                  <Badge variant="secondary" className="w-fit text-xs">
                    {usuariosMasActivos[0].cantidad} acciones
                  </Badge>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">Sin actividad</span>
              )}
            </div>
          </div>
        </div>

        {/* Indicadores de Tendencia */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>Crecimiento positivo</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span>Decrecimiento</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                <span>Sin cambios</span>
              </div>
            </div>
            <span>Última actualización: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivitySummary;
