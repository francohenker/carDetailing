"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Filter, Download, Loader2 } from "lucide-react";

interface DateFilterProps {
  onFilter: (startDate: string, endDate: string) => void;
  onGenerateReport: () => void;
  isLoading: boolean;
  isGeneratingReport: boolean;
}

// Función para convertir fecha de formato YYYY-MM-DD a DD/MM/YYYY
const formatDateToDisplay = (dateString: string): string => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

// Función para convertir fecha de formato DD/MM/YYYY a YYYY-MM-DD
const formatDateToISO = (dateString: string): string => {
  if (!dateString) return '';
  const [day, month, year] = dateString.split('/');
  return `${year}-${month}-${day}`;
};

export default function DateFilter({ 
  onFilter, 
  onGenerateReport, 
  isLoading, 
  isGeneratingReport 
}: DateFilterProps) {
  const [startDate, setStartDate] = useState(() => {
    // Por defecto, últimos 30 días
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  
  const [endDate, setEndDate] = useState(() => {
    // Por defecto, hoy
    return new Date().toISOString().split('T')[0];
  });

  const [displayStartDate, setDisplayStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return formatDateToDisplay(date.toISOString().split('T')[0]);
  });

  const [displayEndDate, setDisplayEndDate] = useState(() => {
    return formatDateToDisplay(new Date().toISOString().split('T')[0]);
  });

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setStartDate(value);
    setDisplayStartDate(formatDateToDisplay(value));
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEndDate(value);
    setDisplayEndDate(formatDateToDisplay(value));
  };

  const handleFilter = () => {
    onFilter(startDate, endDate);
  };

  const handlePresetFilter = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    
    const startISO = start.toISOString().split('T')[0];
    const endISO = end.toISOString().split('T')[0];
    
    setStartDate(startISO);
    setEndDate(endISO);
    setDisplayStartDate(formatDateToDisplay(startISO));
    setDisplayEndDate(formatDateToDisplay(endISO));
    
    onFilter(startISO, endISO);
  };

  return (
    <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-blue-600" />
          Filtros de Fecha
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row gap-4 items-end">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
            <div>
              <Label htmlFor="startDate" className="text-sm font-medium mb-2 block">
                Fecha Inicio
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400 pointer-events-none z-10" />
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={handleStartDateChange}
                  className="pl-10 date-input-custom"
                  style={{ colorScheme: 'light' }}
                />
                <div className="absolute right-3 top-3 text-xs text-gray-500 pointer-events-none">
                  {displayStartDate}
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="endDate" className="text-sm font-medium mb-2 block">
                Fecha Final
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400 pointer-events-none z-10" />
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={handleEndDateChange}
                  className="pl-10 date-input-custom"
                  style={{ colorScheme: 'light' }}
                />
                <div className="absolute right-3 top-3 text-xs text-gray-500 pointer-events-none">
                  {displayEndDate}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Botones de filtros rápidos */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePresetFilter(7)}
              disabled={isLoading}
            >
              7 días
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePresetFilter(30)}
              disabled={isLoading}
            >
              30 días
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePresetFilter(90)}
              disabled={isLoading}
            >
              90 días
            </Button>
            
            {/* Botón aplicar filtro */}
            <Button
              onClick={handleFilter}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Filter className="h-4 w-4 mr-2" />
              )}
              Aplicar Filtro
            </Button>
            
            {/* Botón generar informe */}
            <Button
              onClick={onGenerateReport}
              disabled={isGeneratingReport}
              className="bg-green-600 hover:bg-green-700"
            >
              {isGeneratingReport ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Generar Informe
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}