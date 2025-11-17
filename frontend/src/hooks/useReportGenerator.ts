"use client";

import { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface StatisticsData {
  period?: {
    startDate: string;
    endDate: string;
    days: number;
  };
  periodRevenue?: number;
  periodTurnos?: number;
  completedTurnos?: number;
  newUsers?: number;
  popularServices?: Array<{
    name: string;
    count: string;
  }>;
  topClients?: Array<{
    clientName: string;
    clientEmail: string;
    totalSpent: number;
    turnosCount: string;
  }>;
}

export function useReportGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = async (data: StatisticsData) => {
    setIsGenerating(true);
    
    try {
      // Crear PDF en formato A4
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Configurar fuentes y colores
      pdf.setFont('helvetica');

      // Header del informe
      pdf.setFontSize(20);
      pdf.setTextColor(37, 99, 235); // Blue-600
      pdf.text('INFORME DE ESTADÍSTICAS', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 10;
      pdf.setFontSize(16);
      pdf.setTextColor(107, 114, 128); // Gray-500
      pdf.text('Car Detailing - Dashboard Ejecutivo', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 15;
      
      // Información del período
      if (data.period) {
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        const startDate = new Date(data.period.startDate).toLocaleDateString('es-AR');
        const endDate = new Date(data.period.endDate).toLocaleDateString('es-AR');
        pdf.text(`Período: ${startDate} - ${endDate} (${data.period.days} días)`, 20, yPosition);
        yPosition += 10;
        
        const currentDate = new Date().toLocaleDateString('es-AR');
        const currentTime = new Date().toLocaleTimeString('es-AR');
        pdf.text(`Generado el: ${currentDate} a las ${currentTime}`, 20, yPosition);
        yPosition += 20;
      }

      // Métricas principales
      pdf.setFontSize(16);
      pdf.setTextColor(37, 99, 235);
      pdf.text('MÉTRICAS PRINCIPALES', 20, yPosition);
      yPosition += 15;

      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      
      const metrics = [
        { label: 'Ingresos Total', value: `$${(data.periodRevenue || 0).toLocaleString('es-AR')}` },
        { label: 'Turnos Totales', value: (data.periodTurnos || 0).toString() },
        { label: 'Turnos Completados', value: (data.completedTurnos || 0).toString() },
        { label: 'Nuevos Usuarios', value: (data.newUsers || 0).toString() },
      ];

      metrics.forEach(metric => {
        pdf.setFont('helvetica', 'bold');
        pdf.text(metric.label + ':', 20, yPosition);
        pdf.setFont('helvetica', 'normal');
        pdf.text(metric.value, 80, yPosition);
        yPosition += 8;
      });

      yPosition += 15;

      // Servicios más populares
      if (data.popularServices && data.popularServices.length > 0) {
        pdf.setFontSize(16);
        pdf.setTextColor(37, 99, 235);
        pdf.text('SERVICIOS MÁS POPULARES', 20, yPosition);
        yPosition += 15;

        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);

        data.popularServices.forEach((service, index) => {
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${index + 1}. ${service.name}`, 25, yPosition);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`${service.count} turnos`, 120, yPosition);
          yPosition += 8;
        });

        yPosition += 15;
      }

      // Top clientes
      if (data.topClients && data.topClients.length > 0) {
        // Verificar si necesitamos nueva página
        if (yPosition > pageHeight - 60) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(16);
        pdf.setTextColor(37, 99, 235);
        pdf.text('TOP CLIENTES', 20, yPosition);
        yPosition += 15;

        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);

        data.topClients.slice(0, 10).forEach((client, index) => {
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${index + 1}. ${client.clientName}`, 20, yPosition);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`$${client.totalSpent.toLocaleString('es-AR')}`, 120, yPosition);
          pdf.text(`(${client.turnosCount} turnos)`, 160, yPosition);
          yPosition += 8;
        });
      }

      // Capturar gráficos si están disponibles
      try {
        const chartsContainer = document.getElementById('charts-container');
        if (chartsContainer) {
          pdf.addPage();
          yPosition = 20;
          
          pdf.setFontSize(16);
          pdf.setTextColor(37, 99, 235);
          pdf.text('GRÁFICOS ESTADÍSTICOS', pageWidth / 2, yPosition, { align: 'center' });
          yPosition += 20;

          // Capturar cada gráfico individualmente
          const charts = chartsContainer.querySelectorAll('.chart-container');
          
          for (let i = 0; i < Math.min(charts.length, 4); i++) {
            const chart = charts[i] as HTMLElement;
            
            try {
              const canvas = await html2canvas(chart, {
                backgroundColor: '#ffffff',
                scale: 2,
                logging: false,
                useCORS: true
              });
              
              const imgData = canvas.toDataURL('image/png');
              const imgWidth = 170;
              const imgHeight = (canvas.height * imgWidth) / canvas.width;
              
              // Verificar si el gráfico cabe en la página actual
              if (yPosition + imgHeight > pageHeight - 20) {
                pdf.addPage();
                yPosition = 20;
              }
              
              pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight);
              yPosition += imgHeight + 20;
              
            } catch (chartError) {
              console.error('Error capturando gráfico:', chartError);
            }
          }
        }
      } catch (chartsError) {
        console.error('Error procesando gráficos:', chartsError);
      }

      // Footer en cada página
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(107, 114, 128);
        pdf.text(
          `Car Detailing - Informe de Estadísticas - Página ${i} de ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      // Generar nombre del archivo
      const fileName = data.period 
        ? `Informe_${data.period.startDate}_${data.period.endDate}.pdf`
        : `Informe_${new Date().toISOString().split('T')[0]}.pdf`;

      // Descargar el PDF
      pdf.save(fileName);
      
    } catch (error) {
      console.error('Error generando informe:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateReport,
    isGenerating
  };
}