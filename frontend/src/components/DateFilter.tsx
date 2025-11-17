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

  const handleFilter = () => {
    onFilter(startDate, endDate);
  };

  const handlePresetFilter = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
    
    onFilter(start.toISOString().split('T')[0], end.toISOString().split('T')[0]);
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
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="endDate" className="text-sm font-medium mb-2 block">
                Fecha Final
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-10"
                />
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