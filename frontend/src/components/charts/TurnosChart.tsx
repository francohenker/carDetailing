"use client";

import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface TurnosChartProps {
  weeklyTurnos: Array<{
    day: string;
    turnos: number;
  }>;
}

export default function TurnosChart({ weeklyTurnos }: TurnosChartProps) {
  const data = {
    labels: weeklyTurnos.map(item => item.day),
    datasets: [
      {
        label: 'Turnos',
        data: weeklyTurnos.map(item => item.turnos),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false,
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
        text: 'Turnos por Día (Última Semana)',
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
            return `Turnos: ${context.parsed.y}`;
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
          stepSize: 1,
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
      <Bar data={data} options={options} />
    </div>
  );
}