"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, TrendingDown, Calendar, Users, CheckCircle, Star, ChevronLeft, BarChart3 } from "lucide-react"
import HeaderDefault from "../../header"
import ProtectedRoute from "@/components/ProtectedRoutes"
import RevenueChart from "@/components/charts/RevenueChart"
import ServicesChart from "@/components/charts/ServicesChart"
import TurnosChart from "@/components/charts/TurnosChart"
import StatusChart from "@/components/charts/StatusChart"
import DateFilter from "@/components/DateFilter"
import { useReportGenerator } from "@/hooks/useReportGenerator"


interface StatisticsData {
    // Dashboard básico
    currentMonthRevenue?: number
    revenueChange?: number
    currentMonthTurnos?: number
    completedTurnos?: number
    newUsersThisMonth?: number
    popularServices?: Array<{
        name: string
        count: string
    }>
    monthlyRevenue?: Array<{
        month: string
        revenue: number
    }>
    turnosStatus?: Array<{
        estado: string
        count: string
    }>
    weeklyTurnos?: Array<{
        day: string
        turnos: number
    }>
    
    // Datos filtrados
    period?: {
        startDate: string
        endDate: string
        days: number
    }
    periodRevenue?: number
    periodTurnos?: number
    newUsers?: number
    dailyTurnos?: Array<{
        date: string
        day: string
        turnos: number
    }>
    dailyRevenue?: Array<{
        date: string
        day: string
        revenue: number
    }>
    topClients?: Array<{
        clientName: string
        clientEmail: string
        totalSpent: number
        turnosCount: string
    }>
}

export default function StatisticsPage() {
    const [data, setData] = useState<StatisticsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isFiltered, setIsFiltered] = useState(false)
    const { generateReport, isGenerating } = useReportGenerator()

    useEffect(() => {
        fetchStatistics()
    }, [])

    const fetchStatistics = async () => {
        try {
            const token = localStorage.getItem('jwt')
            const response = await fetch('/api/statistics', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                throw new Error('Error al cargar las estadísticas')
            }

            const statisticsData = await response.json()
            setData(statisticsData)
            setIsFiltered(false)
        } catch (err) {
            setError('Error al cargar las estadísticas')
            console.error('Error fetching statistics:', err)
        } finally {
            setLoading(false)
        }
    }

    const fetchFilteredStatistics = async (startDate: string, endDate: string) => {
        try {
            setLoading(true)
            const token = localStorage.getItem('jwt')
            console.log("start date: ", startDate);
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/statistics/filtered?startDate=${startDate}&endDate=${endDate}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                throw new Error('Error al cargar las estadísticas filtradas')
            }

            const filteredData = await response.json()
            setData(filteredData)
            setIsFiltered(true)
            setError(null)
        } catch (err) {
            setError('Error al cargar las estadísticas filtradas')
            console.error('Error fetching filtered statistics:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleGenerateReport = async () => {
        if (!data) return
        
        try {
            await generateReport(data)
        } catch (err) {
            console.error('Error generando informe:', err)
            setError('Error al generar el informe')
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
        }).format(amount)
    }



    if (loading) {
        return (
            <ProtectedRoute allowedRoles={['admin']}>
                <div className="min-h-screen bg-base-100">
                    <HeaderDefault />
                    <main className="container mx-auto p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Link href="/admin" className="text-muted-foreground hover:text-foreground">
                                <ChevronLeft className="h-4 w-4" />
                                <span className="sr-only">Volver</span>
                            </Link>
                            <h1 className="text-3xl font-bold flex items-center gap-2">
                                <BarChart3 className="h-8 w-8 text-primary" />
                                Estadísticas del Sistema
                            </h1>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {[...Array(6)].map((_, i) => (
                                <Card key={i}>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-4 w-4" />
                                    </CardHeader>
                                    <CardContent>
                                        <Skeleton className="h-8 w-20 mb-2" />
                                        <Skeleton className="h-4 w-16" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </main>
                </div>
            </ProtectedRoute>
        )
    }

    if (error) {
        return (
            <ProtectedRoute allowedRoles={['admin']}>
                <div className="min-h-screen bg-base-100">
                    <HeaderDefault />
                    <main className="container mx-auto p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Link href="/admin" className="text-muted-foreground hover:text-foreground">
                                <ChevronLeft className="h-4 w-4" />
                                <span className="sr-only">Volver</span>
                            </Link>
                            <h1 className="text-3xl font-bold flex items-center gap-2">
                                <BarChart3 className="h-8 w-8 text-primary" />
                                Estadísticas del Sistema
                            </h1>
                        </div>

                        <div className="text-center py-12">
                            <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
                            <p className="text-muted-foreground mb-4">{error}</p>
                            <button
                                onClick={fetchStatistics}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Reintentar
                            </button>
                        </div>
                    </main>
                </div>
            </ProtectedRoute>
        )
    }

    if (!data) {
        return (
            <ProtectedRoute allowedRoles={['admin']}>
                <div className="min-h-screen bg-base-100">
                    <HeaderDefault />
                    <main className="container mx-auto p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Link href="/admin" className="text-muted-foreground hover:text-foreground">
                                <ChevronLeft className="h-4 w-4" />
                                <span className="sr-only">Volver</span>
                            </Link>
                            <h1 className="text-3xl font-bold flex items-center gap-2">
                                <BarChart3 className="h-8 w-8 text-primary" />
                                Estadísticas del Sistema
                            </h1>
                        </div>

                        <div className="text-center py-12">
                            <p className="text-muted-foreground">No hay datos disponibles</p>
                        </div>
                    </main>
                </div>
            </ProtectedRoute>
        )
    }

    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
                <HeaderDefault />
                <main className="container mx-auto p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <Link href="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
                                <ChevronLeft className="h-6 w-6" />
                                <span className="sr-only">Volver</span>
                            </Link>
                            <div>
                                <h1 className="text-4xl font-bold flex items-center gap-3">
                                    <BarChart3 className="h-10 w-10 text-blue-600" />
                                    Estadísticas del Sistema
                                </h1>
                                <p className="text-muted-foreground mt-1">Dashboard completo de métricas y análisis</p>
                            </div>
                        </div>
                    </div>

                    {/* Filtros de fecha */}
                    <DateFilter 
                        onFilter={fetchFilteredStatistics}
                        onGenerateReport={handleGenerateReport}
                        isLoading={loading}
                        isGeneratingReport={isGenerating}
                    />

                    {/* Indicador de período */}
                    {data?.period && (
                        <Card className="border-0 shadow-lg bg-blue-50 border-l-4 border-l-blue-500 mb-6">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-blue-900">
                                            Período Filtrado: {new Date(data.period.startDate).toLocaleDateString('es-AR')} - {new Date(data.period.endDate).toLocaleDateString('es-AR')}
                                        </h3>
                                        <p className="text-blue-700">
                                            Mostrando datos de {data.period.days} días
                                        </p>
                                    </div>
                                    <Button 
                                        onClick={fetchStatistics} 
                                        variant="outline" 
                                        size="sm"
                                        className="border-blue-300 text-blue-700 hover:bg-blue-100"
                                    >
                                        Ver Dashboard General
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* KPI Cards */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                        {/* Ingresos */}
                        <Card className="border-0 shadow-lg bg-gradient-to-r from-green-500 to-green-600 text-white">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-green-100">
                                    {data?.period ? 'Ingresos del Período' : 'Ingresos del Mes'}
                                </CardTitle>
                                <TrendingUp className="h-5 w-5 text-green-100" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">
                                    {formatCurrency(data?.periodRevenue ?? data?.currentMonthRevenue ?? 0)}
                                </div>
                                {data?.revenueChange !== undefined && !data?.period && (
                                    <div className="flex items-center gap-1 mt-2">
                                        {data.revenueChange >= 0 ? 
                                            <TrendingUp className="h-4 w-4 text-green-100" /> : 
                                            <TrendingDown className="h-4 w-4 text-green-100" />
                                        }
                                        <span className="text-sm text-green-100">
                                            {Math.abs(data.revenueChange).toFixed(1)}% vs mes anterior
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Turnos */}
                        <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-blue-100">
                                    {data?.period ? 'Turnos del Período' : 'Turnos del Mes'}
                                </CardTitle>
                                <Calendar className="h-5 w-5 text-blue-100" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">
                                    {data?.periodTurnos ?? data?.currentMonthTurnos ?? 0}
                                </div>
                                <p className="text-sm text-blue-100 mt-2">Turnos programados</p>
                            </CardContent>
                        </Card>

                        {/* Turnos completados */}
                        <Card className="border-0 shadow-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-emerald-100">Turnos Completados</CardTitle>
                                <CheckCircle className="h-5 w-5 text-emerald-100" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">{data?.completedTurnos ?? 0}</div>
                                <p className="text-sm text-emerald-100 mt-2">
                                    {data?.period ? 'En el período' : 'Total histórico'}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Nuevos usuarios */}
                        <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-purple-100">Nuevos Usuarios</CardTitle>
                                <Users className="h-5 w-5 text-purple-100" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">
                                    {data?.newUsers ?? data?.newUsersThisMonth ?? 0}
                                </div>
                                <p className="text-sm text-purple-100 mt-2">
                                    {data?.period ? 'En el período' : 'Este mes'}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts Section */}
                    <div id="charts-container" className="grid gap-8">
                        {/* Revenue Chart */}
                        <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm chart-container">
                            <CardContent className="p-6">
                                {data?.monthlyRevenue ? (
                                    <RevenueChart monthlyRevenue={data.monthlyRevenue} />
                                ) : data?.dailyRevenue ? (
                                    <RevenueChart monthlyRevenue={data.dailyRevenue.map(d => ({ month: d.day, revenue: d.revenue }))} />
                                ) : (
                                    <div className="h-80 flex items-center justify-center">
                                        <p className="text-muted-foreground">No hay datos de ingresos disponibles</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Row with 3 charts */}
                        <div className="grid gap-6 lg:grid-cols-3">
                            {/* Turnos Chart */}
                            <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm chart-container">
                                <CardContent className="p-6">
                                    {data?.weeklyTurnos ? (
                                        <TurnosChart weeklyTurnos={data.weeklyTurnos} />
                                    ) : data?.dailyTurnos ? (
                                        <TurnosChart weeklyTurnos={data.dailyTurnos.map(d => ({ day: d.day, turnos: d.turnos }))} />
                                    ) : (
                                        <div className="h-80 flex items-center justify-center">
                                            <p className="text-muted-foreground">No hay datos de turnos disponibles</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Services Chart */}
                            <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm chart-container">
                                <CardContent className="p-6">
                                    <ServicesChart popularServices={data?.popularServices || []} />
                                </CardContent>
                            </Card>

                            {/* Status Chart */}
                            <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm chart-container">
                                <CardContent className="p-6">
                                    <StatusChart turnosStatus={data?.turnosStatus || []} />
                                </CardContent>
                            </Card>
                        </div>

                        {/* Top Clients (solo para datos filtrados) */}
                        {data?.topClients && data.topClients.length > 0 && (
                            <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="h-5 w-5 text-purple-500" />
                                        Top Clientes del Período
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {data.topClients.slice(0, 10).map((client, index) => (
                                            <div key={client.clientEmail} className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-150 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                                                        index === 0 ? 'bg-purple-500' :
                                                        index === 1 ? 'bg-purple-400' :
                                                        index === 2 ? 'bg-purple-600' : 'bg-slate-500'
                                                    }`}>
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold text-lg">{client.clientName}</span>
                                                        <p className="text-sm text-muted-foreground">{client.clientEmail}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-2xl font-bold text-purple-600">
                                                        {formatCurrency(client.totalSpent)}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">{client.turnosCount} turnos</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Services List - Enhanced */}
                        <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Star className="h-5 w-5 text-yellow-500" />
                                    Ranking de Servicios Más Solicitados
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {data?.popularServices && data.popularServices.length > 0 ? (
                                        data.popularServices.map((service, index) => (
                                            <div key={service.name} className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-blue-100 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                                                        index === 0 ? 'bg-yellow-500' :
                                                        index === 1 ? 'bg-gray-400' :
                                                        index === 2 ? 'bg-amber-600' : 'bg-slate-500'
                                                    }`}>
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold text-lg">{service.name}</span>
                                                        <p className="text-sm text-muted-foreground">Servicio #{index + 1} más popular</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-2xl font-bold text-blue-600">{service.count}</div>
                                                    <p className="text-sm text-muted-foreground">turnos</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8">
                                            <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                            <p className="text-muted-foreground">No hay datos de servicios disponibles</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    )
}