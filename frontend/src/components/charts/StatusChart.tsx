"use client";

import { Pie } from 'react-chartjs-2';
// import { useEffect, useRef } from 'react';
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
    // Debug: Verificar que se reciban los datos
    console.log('StatusChart - turnosStatus:', turnosStatus);
    
    // Colores actualizados según requerimiento: gris=pendiente, verde=finalizado, rojo=cancelado
    const statusColors = {
        'pendiente': 'rgba(156, 163, 175, 0.8)',   // Gray - Cambiado de amarillo
        'finalizado': 'rgba(34, 197, 94, 0.8)',    // Green - Mejorado
        'cancelado': 'rgba(239, 68, 68, 0.8)',     // Red - Mantenido
        'reagendado': 'rgba(59, 130, 246, 0.8)',   // Blue - Mantenido
    };

    const statusBorderColors = {
        'pendiente': 'rgb(156, 163, 175)',         // Gray border
        'finalizado': 'rgb(34, 197, 94)',          // Green border
        'cancelado': 'rgb(239, 68, 68)',           // Red border
        'reagendado': 'rgb(59, 130, 246)',         // Blue border
    };

    const statusLabels = {
        'pendiente': 'Pendientes',
        'finalizado': 'Finalizados',
        'cancelado': 'Cancelados',
        'reagendado': 'Reagendados',
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
        animation: {
            duration: 0,
        },
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
                    generateLabels: function(chart: any) {
                        const data = chart.data;
                        if (data.labels.length && data.datasets.length) {
                            const dataset = data.datasets[0];
                            const total = dataset.data.reduce((sum: number, value: number) => sum + value, 0);
                            
                            return data.labels.map((label: string, i: number) => {
                                const value = dataset.data[i];
                                const percentage = ((value * 100) / total).toFixed(0);
                                
                                return {
                                    text: `${label}: ${value} (${percentage}%)`,
                                    fillStyle: dataset.backgroundColor[i],
                                    strokeStyle: dataset.borderColor[i],
                                    lineWidth: 2,
                                    hidden: false,
                                    index: i
                                };
                            });
                        }
                        return [];
                    }
                },
            },
            title: {
                display: false, // Título ahora en JSX para mejor control
            },
            tooltip: {
                backgroundColor: 'rgba(17, 24, 39, 0.8)',
                titleColor: '#fff',
                bodyColor: '#fff',
                cornerRadius: 8,
                callbacks: {
                    label: function (context: any) {
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

    // Crear key única basada en los datos y timestamp para forzar re-render
    const chartKey = `status-chart-${Date.now()}-${turnosStatus.map(item => `${item.estado}-${item.count}`).join('-')}`;
    
    // Debug: verificar colores aplicados
    console.log('StatusChart - colores aplicados:', {
        data: turnosStatus,
        colors: turnosStatus.map(item => statusColors[item.estado as keyof typeof statusColors])
    });

    return (
        <div className="h-80 chart-element chart-container" style={{ backgroundColor: '#ffffff' }}>
            <h3 className="text-lg font-semibold mb-4 text-center">Estado de los Turnos</h3>
            <div style={{ height: 'calc(100% - 3rem)' }}>
                <Pie
                    data={data}
                    options={options}
                    key={chartKey}
                />
            </div>
        </div>
    );
}