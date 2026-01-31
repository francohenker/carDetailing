"use client";

import { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { prepareChartsForCapture, forceChartResize } from '@/utils/chartUtils';

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

interface UserInfo {
  firstname: string;
  lastname: string;
  email: string;
}

export function useReportGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = async (data: StatisticsData, userInfo: UserInfo | null = null) => {
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
      
      // Fecha de emisión y usuario (siempre mostrar)
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      
      const currentDate = new Date().toLocaleDateString('es-AR');
      const currentTime = new Date().toLocaleTimeString('es-AR');
      pdf.text(`Fecha de emisión: ${currentDate} a las ${currentTime}`, 20, yPosition);
      yPosition += 8;
      
      // Agregar información del usuario emisor con validación de apellido
      if (userInfo) {
        const userName = userInfo.lastname 
          ? `${userInfo.firstname} ${userInfo.lastname}` 
          : userInfo.firstname;
        pdf.text(`Emitido por: ${userName} (${userInfo.email})`, 20, yPosition);
        yPosition += 8;
      }
      
      // Información del período
      if (data.period) {
        const startDate = new Date(data.period.startDate).toLocaleDateString('es-AR');
        const endDate = new Date(data.period.endDate).toLocaleDateString('es-AR');
        pdf.text(`Período: ${startDate} - ${endDate} (${data.period.days} días)`, 20, yPosition);
        yPosition += 12;
      } else {
        yPosition += 8;
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
        pdf.setFontSize(14);
        pdf.setTextColor(37, 99, 235);
        pdf.text('SERVICIOS MÁS POPULARES', 20, yPosition);
        yPosition += 12;

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

        pdf.setFontSize(14);
        pdf.setTextColor(37, 99, 235);
        pdf.text('TOP CLIENTES', 20, yPosition);
        yPosition += 12;

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
          console.log('📊 Iniciando captura de gráficos...');
          
          pdf.addPage();
          yPosition = 20;
          
          pdf.setFontSize(14);
          pdf.setTextColor(37, 99, 235);
          pdf.text('GRÁFICOS ESTADÍSTICOS', pageWidth / 2, yPosition, { align: 'center' });
          yPosition += 15;

          // Preparar gráficos y evitar problemas de CSS
          forceChartResize();
          await prepareChartsForCapture();
          
          // Aplicar estilos seguros temporalmente
          const tempStyles = document.createElement('style');
          tempStyles.id = 'pdf-capture-styles';
          tempStyles.textContent = `
            .chart-container, .chart-element {
              background-color: #ffffff !important;
              color: #000000 !important;
              border-color: #e5e5e5 !important;
            }
            .chart-container * {
              color: #000000 !important;
            }
            canvas {
              background-color: #ffffff !important;
            }
          `;
          document.head.appendChild(tempStyles);
          
          // Esperar a que se apliquen los estilos
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Forzar re-renderizado de gráficos con estilos seguros
          const existingCanvases = chartsContainer.querySelectorAll('canvas');
          existingCanvases.forEach((canvas) => {
            try {
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.save();
                ctx.restore();
              }
              const resizeEvent = new Event('resize');
              window.dispatchEvent(resizeEvent);
            } catch (e) {
              // Silenciar errores de canvas
            }
          });
          
          // Esperar renderizado completo con nuevos estilos
          await new Promise(resolve => setTimeout(resolve, 1500));

          // Buscar por diferentes selectores
          const chartContainers = chartsContainer.querySelectorAll('.chart-container');
          const chartElements = chartsContainer.querySelectorAll('.chart-element');
          const chartCanvases = chartsContainer.querySelectorAll('canvas');
          
          console.log(`📊 Encontrados ${chartContainers.length} contenedores, ${chartElements.length} elementos y ${chartCanvases.length} canvas`);

          // Priorizar captura directa de canvas para evitar problemas con oklch
          let chartsProcessed = 0;

          // Método Prioritario: Captura directa de Canvas (evita problemas CSS)
          for (let i = 0; i < Math.min(chartCanvases.length, 4); i++) {
            const canvas = chartCanvases[i] as HTMLCanvasElement;
            
            try {
              console.log(`📊 Capturando canvas directo ${i + 1}...`);
              
              // Obtener imagen directamente del canvas
              const imgData = canvas.toDataURL('image/png', 1.0);
              
              if (imgData && imgData.length > 100 && !imgData.includes('data:,')) {
                const imgWidth = 170;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                
                if (yPosition + imgHeight > pageHeight - 20) {
                  pdf.addPage();
                  yPosition = 20;
                }
                
                // Buscar título del gráfico
                const chartContainer = canvas.closest('.chart-container');
                const titleElement = chartContainer?.querySelector('h3, h4, .chart-title');
                if (titleElement?.textContent) {
                  pdf.setFontSize(14);
                  pdf.setTextColor(0, 0, 0);
                  pdf.text(titleElement.textContent, 20, yPosition);
                  yPosition += 15;
                }
                
                pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight);
                yPosition += imgHeight + 15;
                chartsProcessed++;
                
                console.log(`✅ Canvas directo ${i + 1} procesado exitosamente`);
              }
            } catch (canvasError) {
              console.error(`❌ Error con canvas directo ${i + 1}:`, canvasError);
            }
          }

          // Método Fallback: html2canvas solo si no se procesaron gráficos directamente
          if (chartsProcessed === 0) {
            const elementsToCapture = chartElements.length > 0 ? chartElements : chartContainers;
            
            console.log(`📊 Fallback: usando html2canvas para ${elementsToCapture.length} elementos`);

            for (let i = 0; i < Math.min(elementsToCapture.length, 4); i++) {
            const chartContainer = elementsToCapture[i] as HTMLElement;
            
            try {
              console.log(`📊 Capturando gráfico ${i + 1}...`);
              
              // Hacer visible y scroll al elemento
              chartContainer.scrollIntoView({ behavior: 'instant', block: 'center' });
              await new Promise(resolve => setTimeout(resolve, 500));
              
              const canvas = await html2canvas(chartContainer, {
                backgroundColor: '#ffffff',
                scale: 1.5,
                logging: false,
                useCORS: true,
                allowTaint: true,
                foreignObjectRendering: false,
                width: chartContainer.offsetWidth,
                height: chartContainer.offsetHeight,
                x: 0,
                y: 0,
                ignoreElements: (element) => {
                  // Ignorar elementos con colores problemáticos
                  const computedStyle = window.getComputedStyle(element);
                  const colorProps = ['color', 'backgroundColor', 'borderColor'];
                  
                  for (const prop of colorProps) {
                    const value = computedStyle.getPropertyValue(prop);
                    if (value.includes('oklch') || value.includes('color-mix') || value.includes('var(--')) {
                      return true;
                    }
                  }
                  return false;
                },
                onclone: (clonedDoc) => {
                  // Forzar colores básicos en el documento clonado
                  const style = clonedDoc.createElement('style');
                  style.textContent = `
                    * {
                      color: #000000 !important;
                      background-color: transparent !important;
                      border-color: #000000 !important;
                    }
                    canvas {
                      background-color: #ffffff !important;
                    }
                    .chart-container, .chart-element {
                      background-color: #ffffff !important;
                      color: #000000 !important;
                    }
                  `;
                  clonedDoc.head.appendChild(style);
                }
              });
              
              console.log(`📊 Canvas creado: ${canvas.width}x${canvas.height}`);
              
              if (canvas.width > 0 && canvas.height > 0) {
                const imgData = canvas.toDataURL('image/png', 1.0);
                const imgWidth = 170;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                
                // Verificar si el gráfico cabe en la página actual
                if (yPosition + imgHeight > pageHeight - 20) {
                  pdf.addPage();
                  yPosition = 20;
                }
                
                pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight);
                yPosition += imgHeight + 15;
                
                console.log(`✅ Gráfico ${i + 1} agregado al PDF`);
              } else {
                console.warn(`⚠️ Gráfico ${i + 1} vacío, intentando método alternativo...`);
                
                // Método alternativo: capturar solo el canvas
                const canvasElement = chartContainer.querySelector('canvas');
                if (canvasElement) {
                  const imgData = canvasElement.toDataURL('image/png', 1.0);
                  const imgWidth = 170;
                  const imgHeight = (canvasElement.height * imgWidth) / canvasElement.width;
                  
                  if (yPosition + imgHeight > pageHeight - 20) {
                    pdf.addPage();
                    yPosition = 20;
                  }
                  
                  pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight);
                  yPosition += imgHeight + 15;
                  
                  console.log(`✅ Gráfico ${i + 1} agregado usando canvas directo`);
                }
              }
              
              } catch (chartError) {
                console.error(`❌ Error capturando gráfico ${i + 1}:`, chartError);
                
                // Fallback: agregar texto indicando error
                pdf.setFontSize(12);
                pdf.setTextColor(255, 0, 0);
                pdf.text(`⚠️ Error al capturar gráfico ${i + 1}`, 20, yPosition);
                yPosition += 15;
              }
            }
          }
          
          console.log('📊 Captura de gráficos completada');
          
          // Limpiar estilos temporales
          const stylesToRemove = document.getElementById('pdf-capture-styles');
          if (stylesToRemove) {
            stylesToRemove.remove();
          }
        } else {
          console.warn('⚠️ No se encontró el contenedor de gráficos');
        }
      } catch (chartsError) {
        console.error('❌ Error general procesando gráficos:', chartsError);
        
        // Limpiar estilos temporales en caso de error
        const stylesToClean = document.getElementById('pdf-capture-styles');
        if (stylesToClean) {
          stylesToClean.remove();
        }
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