import React from "react";
import { Clock, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface HourlyActivityProps {
  distribucionPorHora: Array<{ hora: number; cantidad: number }>;
}

const HourlyActivity: React.FC<HourlyActivityProps> = ({
  distribucionPorHora,
}) => {
  // Función para convertir hora UTC a UTC-3
  const convertUTCtoUTC3 = (utcHour: number) => {
    const utc3Hour = utcHour - 3;
    return utc3Hour < 0 ? utc3Hour + 24 : utc3Hour;
  };

  // Crear array completo de 24 horas con datos convertidos a UTC-3
  const hoursData = Array.from({ length: 24 }, (_, displayHour) => {
    // Para cada hora de display (UTC-3), encontrar la hora UTC correspondiente
    const utcHour = (displayHour + 3) % 24;
    const found = distribucionPorHora.find((item) => item.hora === utcHour);
    return {
      hora: displayHour, // Esta es la hora que se mostrará (UTC-3)
      cantidad: found ? found.cantidad : 0,
    };
  });

  const maxActivity = Math.max(...hoursData.map((h) => h.cantidad));
  const totalActivity = hoursData.reduce((sum, h) => sum + h.cantidad, 0);

  const getBarHeight = (cantidad: number) => {
    if (maxActivity === 0) return 0;
    return Math.max((cantidad / maxActivity) * 100, cantidad > 0 ? 5 : 0);
  };

  const getBarColor = (cantidad: number) => {
    if (cantidad === 0) return "bg-gray-200";
    if (cantidad === maxActivity && maxActivity > 0) return "bg-red-500";
    if (cantidad >= maxActivity * 0.7) return "bg-orange-500";
    if (cantidad >= maxActivity * 0.4) return "bg-yellow-500";
    return "bg-blue-500";
  };

  const formatHour = (hour: number) => {
    return hour.toString().padStart(2, "0") + ":00";
  };

  const getPeakHours = () => {
    const sortedHours = [...hoursData].sort((a, b) => b.cantidad - a.cantidad);
    return sortedHours.slice(0, 3).filter((h) => h.cantidad > 0);
  };

  const peakHours = getPeakHours();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Actividad por Horas - Últimas 24hs
        </CardTitle>
      </CardHeader>
      <CardContent>
        {totalActivity === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No hay actividad registrada en las últimas 24 horas</p>
          </div>
        ) : (
          <>
            {/* Gráfico de barras */}
            <div className="mb-6">
              <div className="flex items-end justify-between h-32 gap-1">
                {hoursData.map((hourData) => (
                  <div
                    key={hourData.hora}
                    className="flex flex-col items-center flex-1 group relative"
                  >
                    {/* Barra */}
                    <div className="w-full flex justify-center">
                      <div
                        className={`w-3 transition-all duration-200 hover:opacity-80 ${getBarColor(
                          hourData.cantidad,
                        )} rounded-t-sm`}
                        style={{
                          height: `${getBarHeight(hourData.cantidad)}%`,
                          minHeight: hourData.cantidad > 0 ? "24px" : "4px",
                        }}
                      />
                    </div>

                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                      <div className="bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                        {formatHour(hourData.hora)}: {hourData.cantidad}{" "}
                        registros
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Etiquetas de horas */}
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>00:00</span>
                <span>06:00</span>
                <span>12:00</span>
                <span>18:00</span>
                <span>23:59</span>
              </div>
              <div className="text-center mt-1 text-xs text-muted-foreground">
                Horario: UTC-3
              </div>
            </div>

            {/* Estadísticas adicionales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {totalActivity}
                </div>
                <div className="text-xs text-muted-foreground">
                  Total registros
                </div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {maxActivity}
                </div>
                <div className="text-xs text-muted-foreground">Pico máximo</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round((totalActivity / 24) * 10) / 10}
                </div>
                <div className="text-xs text-muted-foreground">
                  Promedio/hora
                </div>
              </div>
            </div>

            {/* Horas pico */}
            {peakHours.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Horas de Mayor Actividad
                </h4>
                <div className="flex flex-wrap gap-2">
                  {peakHours.map((hour, index) => (
                    <div
                      key={hour.hora}
                      className={`text-xs px-2 py-1 rounded-full ${
                        index === 0
                          ? "bg-red-100 text-red-700"
                          : index === 1
                            ? "bg-orange-100 text-orange-700"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {formatHour(hour.hora)} ({hour.cantidad} registros)
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Leyenda */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span>Pico máximo</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-orange-500 rounded"></div>
                  <span>Alta actividad</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span>Actividad media</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>Actividad baja</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-gray-200 rounded"></div>
                  <span>Sin actividad</span>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default HourlyActivity;
