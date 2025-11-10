import React from 'react';
import { FileText, Calendar, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface RecordsSummaryProps {
  totalRecords: number;
  currentPage: number;
  recordsPerPage: number;
  filteredRecords: number;
  hasFilters: boolean;
}

const RecordsSummary: React.FC<RecordsSummaryProps> = ({
  totalRecords,
  currentPage,
  recordsPerPage,
  filteredRecords,
  hasFilters,
}) => {
  const getRecordRange = () => {
    const start = (currentPage - 1) * recordsPerPage + 1;
    const end = Math.min(currentPage * recordsPerPage, filteredRecords);
    return { start, end };
  };

  const getFilterStatus = () => {
    if (!hasFilters) {
      return {
        message: "Mostrando todos los registros",
        icon: <FileText className="h-4 w-4" />,
        color: "text-blue-600",
      };
    }

    if (filteredRecords < totalRecords) {
      return {
        message: `Filtrado de ${totalRecords.toLocaleString()} registros totales`,
        icon: <TrendingUp className="h-4 w-4" />,
        color: "text-green-600",
      };
    }

    return {
      message: "Filtros aplicados",
      icon: <Calendar className="h-4 w-4" />,
      color: "text-orange-600",
    };
  };

  const filterStatus = getFilterStatus();
  const range = getRecordRange();

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Información principal */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <div className="font-semibold">
                  {filteredRecords.toLocaleString()} registros
                </div>
                <div className="text-xs text-muted-foreground">
                  Mostrando {range.start} - {range.end}
                </div>
              </div>
            </div>

            <div className="h-8 w-px bg-border" />

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">
                Página {currentPage}
              </div>
            </div>
          </div>

          {/* Estado de filtros */}
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 ${filterStatus.color}`}>
              {filterStatus.icon}
              <span className="text-sm font-medium">{filterStatus.message}</span>
            </div>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Progreso de visualización</span>
            <span>
              {Math.round((range.end / filteredRecords) * 100)}% visualizado
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div
              className="bg-primary h-1 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min((range.end / filteredRecords) * 100, 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Información adicional */}
        {hasFilters && filteredRecords !== totalRecords && (
          <div className="mt-3 p-2 bg-blue-50 rounded-md border border-blue-200">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <TrendingUp className="h-3 w-3" />
              <span>
                Se encontraron {filteredRecords.toLocaleString()} de{" "}
                {totalRecords.toLocaleString()} registros totales
                {" "}({Math.round((filteredRecords / totalRecords) * 100)}% del total)
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecordsSummary;
