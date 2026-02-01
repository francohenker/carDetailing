"use client";

import { useState, useRef } from "react";
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
  const parts = dateString.split('/');
  if (parts.length !== 3) return '';
  const [day, month, year] = parts;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

// Validar formato DD/MM/YYYY
const isValidDateFormat = (dateString: string): boolean => {
  const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const match = dateString.match(regex);
  
  if (!match) return false;
  
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);
  
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > 2100) return false;
  
  // Validar días según el mes
  const daysInMonth = new Date(year, month, 0).getDate();
  return day <= daysInMonth;
};

export default function DateFilter({ 
  onFilter, 
  onGenerateReport, 
  isLoading, 
  isGeneratingReport 
}: DateFilterProps) {
  // Refs para los inputs de calendario ocultos
  const startDateInputRef = useRef<HTMLInputElement>(null);
  const endDateInputRef = useRef<HTMLInputElement>(null);

  // Estados para valores ISO (YYYY-MM-DD) - para el input date
  const [startDateISO, setStartDateISO] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  
  const [endDateISO, setEndDateISO] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Estados para valores display (DD/MM/YYYY)
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return formatDateToDisplay(date.toISOString().split('T')[0]);
  });
  
  const [endDate, setEndDate] = useState(() => {
    return formatDateToDisplay(new Date().toISOString().split('T')[0]);
  });

  const [startDateError, setStartDateError] = useState('');
  const [endDateError, setEndDateError] = useState('');

  // Handler para cuando el usuario escribe en el input de texto
  const handleStartDateTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Auto-formatear mientras escribe
    value = value.replace(/[^0-9]/g, ''); // Solo números
    
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2);
    }
    if (value.length >= 5) {
      value = value.slice(0, 5) + '/' + value.slice(5, 9);
    }
    
    setStartDate(value);
    
    if (value.length === 10) {
      if (isValidDateFormat(value)) {
        setStartDateError('');
        const isoDate = formatDateToISO(value);
        setStartDateISO(isoDate);
      } else {
        setStartDateError('Formato inválido. Use DD/MM/YYYY');
      }
    }
  };

  const handleEndDateTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Auto-formatear mientras escribe
    value = value.replace(/[^0-9]/g, ''); // Solo números
    
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2);
    }
    if (value.length >= 5) {
      value = value.slice(0, 5) + '/' + value.slice(5, 9);
    }
    
    setEndDate(value);
    
    if (value.length === 10) {
      if (isValidDateFormat(value)) {
        setEndDateError('');
        const isoDate = formatDateToISO(value);
        setEndDateISO(isoDate);
      } else {
        setEndDateError('Formato inválido. Use DD/MM/YYYY');
      }
    }
  };

  // Handler para cuando el usuario selecciona del calendario
  const handleStartDateCalendarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value; // YYYY-MM-DD
    setStartDateISO(value);
    setStartDate(formatDateToDisplay(value));
    setStartDateError('');
  };

  const handleEndDateCalendarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value; // YYYY-MM-DD
    setEndDateISO(value);
    setEndDate(formatDateToDisplay(value));
    setEndDateError('');
  };

  // Abrir el calendario cuando se hace clic en el ícono
  const handleStartCalendarClick = () => {
    startDateInputRef.current?.showPicker();
  };

  const handleEndCalendarClick = () => {
    endDateInputRef.current?.showPicker();
  };

  const handleFilter = () => {
    // Validar que las fechas sean correctas antes de aplicar el filtro
    if (!isValidDateFormat(startDate)) {
      setStartDateError('Fecha de inicio inválida');
      return;
    }
    if (!isValidDateFormat(endDate)) {
      setEndDateError('Fecha final inválida');
      return;
    }
    
    onFilter(startDateISO, endDateISO);
  };

  const handlePresetFilter = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    
    const startISO = start.toISOString().split('T')[0];
    const endISO = end.toISOString().split('T')[0];
    
    setStartDateISO(startISO);
    setEndDateISO(endISO);
    setStartDate(formatDateToDisplay(startISO));
    setEndDate(formatDateToDisplay(endISO));
    setStartDateError('');
    setEndDateError('');
    
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
                <Calendar 
                  className="absolute left-3 top-3 h-4 w-4 text-gray-400 cursor-pointer z-10 hover:text-blue-600 transition-colors" 
                  onClick={handleStartCalendarClick}
                />
                {/* Input visible con formato DD/MM/YYYY */}
                <Input
                  id="startDate"
                  type="text"
                  value={startDate}
                  onChange={handleStartDateTextChange}
                  placeholder="DD/MM/YYYY"
                  className={`pl-10 ${startDateError ? 'border-red-500' : ''}`}
                  maxLength={10}
                />
                {/* Input oculto con type="date" para el calendario */}
                <input
                  ref={startDateInputRef}
                  type="date"
                  value={startDateISO}
                  onChange={handleStartDateCalendarChange}
                  className="absolute opacity-0 pointer-events-none"
                  tabIndex={-1}
                />
              </div>
              {startDateError && (
                <p className="text-xs text-red-500 mt-1">{startDateError}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="endDate" className="text-sm font-medium mb-2 block">
                Fecha Final
              </Label>
              <div className="relative">
                <Calendar 
                  className="absolute left-3 top-3 h-4 w-4 text-gray-400 cursor-pointer z-10 hover:text-blue-600 transition-colors" 
                  onClick={handleEndCalendarClick}
                />
                {/* Input visible con formato DD/MM/YYYY */}
                <Input
                  id="endDate"
                  type="text"
                  value={endDate}
                  onChange={handleEndDateTextChange}
                  placeholder="DD/MM/YYYY"
                  className={`pl-10 ${endDateError ? 'border-red-500' : ''}`}
                  maxLength={10}
                />
                {/* Input oculto con type="date" para el calendario */}
                <input
                  ref={endDateInputRef}
                  type="date"
                  value={endDateISO}
                  onChange={handleEndDateCalendarChange}
                  className="absolute opacity-0 pointer-events-none"
                  tabIndex={-1}
                />
              </div>
              {endDateError && (
                <p className="text-xs text-red-500 mt-1">{endDateError}</p>
              )}
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