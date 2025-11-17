"use client";

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface RevenueChartProps {
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
  }>;
}

export default function RevenueChart({ monthlyRevenue }: RevenueChartProps) {
  const data = {
    labels: monthlyRevenue.map(item => item.month),
    datasets: [
      {
        label: 'Ingresos ($)',
        data: monthlyRevenue.map(item => item.revenue),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            size: 12,
            family: "'Inter', sans-serif",
          },
        },
      },
      title: {
        display: true,
        text: 'Evolución de Ingresos (Últimos 6 Meses)',
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
            return `Ingresos: $${context.parsed.y.toLocaleString('es-AR')}`;
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(156, 163, 175, 0.2)',
        },
        ticks: {
          callback: function(value: any) {
            return '$' + value.toLocaleString('es-AR');
          },
          font: {
            size: 11,
          },
          color: '#6B7280',
        },
      },
      x: {
        grid: {
          color: 'rgba(156, 163, 175, 0.2)',
        },
        ticks: {
          font: {
            size: 11,
          },
          color: '#6B7280',
        },
      },
    },
  };

  return (
    <div className="h-80">
      <Line data={data} options={options} />
    </div>
  );
}