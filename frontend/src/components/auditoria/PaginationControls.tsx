import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  recordsPerPage: number;
  onPageChange: (page: number) => void;
  onRecordsPerPageChange: (limit: string) => void;
  loading?: boolean;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  totalRecords,
  recordsPerPage,
  onPageChange,
  onRecordsPerPageChange,
  loading = false,
}) => {
  // Función para generar los números de página visibles
  const getVisiblePages = () => {
    const pages = [];
    const maxVisiblePages = 7;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage && !loading) {
      onPageChange(page);
    }
  };

  const getRecordRange = () => {
    const start = (currentPage - 1) * recordsPerPage + 1;
    const end = Math.min(currentPage * recordsPerPage, totalRecords);
    return { start, end };
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="mt-6 space-y-4">
      {/* Información de registros */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Página {currentPage} de {totalPages} ({totalRecords.toLocaleString()} registros totales)
        </div>
        <div>
          {getRecordRange().start} - {getRecordRange().end} de {totalRecords.toLocaleString()}
        </div>
      </div>

      {/* Controles de paginación */}
      <div className="flex items-center justify-center gap-1">
        {/* Botón Primera página */}
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1 || loading}
          onClick={() => handlePageChange(1)}
          className="h-8 w-8 p-0"
          title="Primera página"
        >
          <ChevronLeft className="h-4 w-4" />
          <ChevronLeft className="h-4 w-4 -ml-2" />
        </Button>

        {/* Botón Anterior */}
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1 || loading}
          onClick={() => handlePageChange(currentPage - 1)}
          className="h-8 w-8 p-0"
          title="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Números de página */}
        <div className="flex items-center gap-1">
          {getVisiblePages().map((page, index) => {
            if (page === "ellipsis") {
              return (
                <div
                  key={`ellipsis-${index}`}
                  className="h-8 w-8 flex items-center justify-center"
                >
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </div>
              );
            }

            return (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                disabled={loading}
                onClick={() => handlePageChange(page as number)}
                className={`h-8 w-8 p-0 ${
                  currentPage === page
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
                title={`Ir a página ${page}`}
              >
                {page}
              </Button>
            );
          })}
        </div>

        {/* Botón Siguiente */}
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages || loading}
          onClick={() => handlePageChange(currentPage + 1)}
          className="h-8 w-8 p-0"
          title="Página siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Botón Última página */}
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages || loading}
          onClick={() => handlePageChange(totalPages)}
          className="h-8 w-8 p-0"
          title="Última página"
        >
          <ChevronRight className="h-4 w-4" />
          <ChevronRight className="h-4 w-4 -ml-2" />
        </Button>
      </div>

      {/* Navegación rápida */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Ir a página:</span>
          <input
            type="number"
            min="1"
            max={totalPages}
            value={currentPage}
            disabled={loading}
            onChange={(e) => {
              const page = parseInt(e.target.value);
              if (page >= 1 && page <= totalPages) {
                handlePageChange(page);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const page = parseInt(e.currentTarget.value);
                if (page >= 1 && page <= totalPages) {
                  handlePageChange(page);
                }
              }
            }}
            className="w-16 h-8 px-2 text-center border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Página"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Registros por página:</span>
          <select
            value={recordsPerPage}
            disabled={loading}
            onChange={(e) => onRecordsPerPageChange(e.target.value)}
            className="h-8 px-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </select>
        </div>
      </div>

      {/* Indicador de carga */}
      {loading && (
        <div className="flex items-center justify-center py-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span>Cargando...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaginationControls;
