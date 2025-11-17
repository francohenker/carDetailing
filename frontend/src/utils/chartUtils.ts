"use client";

export const prepareChartsForCapture = () => {
  // Esperar a que todos los gráficos de Chart.js estén completamente renderizados
  return new Promise<void>((resolve) => {
    const checkCharts = () => {
      const canvases = document.querySelectorAll('#charts-container canvas');
      let allReady = true;

      canvases.forEach((canvas) => {
        const ctx = (canvas as HTMLCanvasElement).getContext('2d');
        if (!ctx || (canvas as HTMLCanvasElement).width === 0) {
          allReady = false;
        }
      });

      if (allReady && canvases.length > 0) {
        // Hacer scroll a cada gráfico para asegurar que estén en viewport
        canvases.forEach((canvas, index) => {
          setTimeout(() => {
            canvas.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, index * 200);
        });
        
        // Esperar un poco más después del scroll
        setTimeout(resolve, canvases.length * 200 + 500);
      } else {
        // Reintentar después de un tiempo
        setTimeout(checkCharts, 100);
      }
    };

    // Iniciar verificación después de un breve delay
    setTimeout(checkCharts, 300);
  });
};

export const forceChartResize = () => {
  // Disparar resize event para que Chart.js redibuje correctamente
  window.dispatchEvent(new Event('resize'));
  
  // También forzar redraw en Chart.js si está disponible
  if (typeof window !== 'undefined' && (window as any).Chart) {
    (window as any).Chart.instances.forEach((chart: any) => {
      chart.resize();
      chart.update();
    });
  }
};