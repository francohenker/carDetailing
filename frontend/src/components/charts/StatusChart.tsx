"use client";

import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface StatusChartProps {
  turnosStatus: Array<{
    estado: string;
    count: string;
  }>;
}

export default function StatusChart({ turnosStatus }: StatusChartProps) {
  const statusColors = {
    'PENDIENTE': 'rgba(245, 158, 11, 0.8)',    // Yellow
    'FINALIZADO': 'rgba(16, 185, 129, 0.8)',   // Green
    'CANCELADO': 'rgba(239, 68, 68, 0.8)',     // Red
    'REAGENDADO': 'rgba(59, 130, 246, 0.8)',   // Blue
  };

  const statusBorderColors = {
    'PENDIENTE': 'rgb(245, 158, 11)',
    'FINALIZADO': 'rgb(16, 185, 129)',
    'CANCELADO': 'rgb(239, 68, 68)',
    'REAGENDADO': 'rgb(59, 130, 246)',
  };

  const statusLabels = {
    'PENDIENTE': 'Pendientes',
    'FINALIZADO': 'Finalizados',
    'CANCELADO': 'Cancelados',
    'REAGENDADO': 'Reagendados',
  };

  const data = {
    labels: turnosStatus.map(item => statusLabels[item.estado as keyof typeof statusLabels] || item.estado),
    datasets: [
      {
        data: turnosStatus.map(item => parseInt(item.count)),
        backgroundColor: turnosStatus.map(item => statusColors[item.estado as keyof typeof statusColors] || 'rgba(156, 163, 175, 0.8)'),
        borderColor: turnosStatus.map(item => statusBorderColors[item.estado as keyof typeof statusBorderColors] || 'rgb(156, 163, 175)'),
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
        position: 'bottom' as const,
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
        text: 'Estado de los Turnos',
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

  if (turnosStatus.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center">
        <p className="text-muted-foreground">No hay datos de estados disponibles</p>
      </div>
    );
  }

  return (
    <div className="h-80">
      <Pie data={data} options={options} />
    </div>
  );
}