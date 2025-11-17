"use client";

import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface ServicesChartProps {
  popularServices: Array<{
    name: string;
    count: string;
  }>;
}

export default function ServicesChart({ popularServices }: ServicesChartProps) {
  const colors = [
    'rgba(59, 130, 246, 0.8)',   // Blue
    'rgba(16, 185, 129, 0.8)',   // Green
    'rgba(245, 158, 11, 0.8)',   // Yellow
    'rgba(239, 68, 68, 0.8)',    // Red
    'rgba(139, 92, 246, 0.8)',   // Purple
  ];

  const borderColors = [
    'rgb(59, 130, 246)',
    'rgb(16, 185, 129)',
    'rgb(245, 158, 11)',
    'rgb(239, 68, 68)',
    'rgb(139, 92, 246)',
  ];

  const data = {
    labels: popularServices.map(service => service.name),
    datasets: [
      {
        data: popularServices.map(service => parseInt(service.count)),
        backgroundColor: colors.slice(0, popularServices.length),
        borderColor: borderColors.slice(0, popularServices.length),
        borderWidth: 2,
        hoverBorderWidth: 3,
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          font: {
            size: 12,
            family: "'Inter', sans-serif",
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      title: {
        display: true,
        text: 'Servicios Más Populares',
        font: {
          size: 16,
          weight: 'bold' as const,
          family: "'Inter', sans-serif",
        },
        color: '#374151',
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        cornerRadius: 8,
        callbacks: {
          label: function(context: any) {
            const total = context.dataset.data.reduce((sum: number, value: number) => sum + value, 0);
            const percentage = ((context.parsed * 100) / total).toFixed(1);
            return `${context.label}: ${context.parsed} turnos (${percentage}%)`;
          }
        }
      },
    },
  };

  if (popularServices.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center">
        <p className="text-muted-foreground">No hay datos de servicios disponibles</p>
      </div>
    );
  }

  return (
    <div className="h-80">
      <Doughnut data={data} options={options} />
    </div>
  );
}