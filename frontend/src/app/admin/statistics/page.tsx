"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Calendar, Users, CheckCircle, Star, ChevronLeft, BarChart3 } from "lucide-react"
import HeaderDefault from "../../header"
import ProtectedRoute from "@/components/ProtectedRoutes"


interface StatisticsData {
    currentMonthRevenue: number
    revenueChange: number
    currentMonthTurnos: number
    completedTurnos: number
    newUsersThisMonth: number
    popularServices: Array<{
        name: string
        count: string
    }>
}

export default function StatisticsPage() {
    const [data, setData] = useState<StatisticsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

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
        } catch (err) {
            setError('Error al cargar las estadísticas')
            console.error('Error fetching statistics:', err)
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
        }).format(amount)
    }

    const formatPercentage = (percentage: number) => {
        const isPositive = percentage >= 0
        return (
            <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span className="text-sm font-medium">
                    {Math.abs(percentage).toFixed(1)}%
                </span>
            </div>
        )
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
                {/* Ingresos del mes */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(data.currentMonthRevenue)}</div>
                        {formatPercentage(data.revenueChange)}
                    </CardContent>
                </Card>

                {/* Turnos del mes */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Turnos del Mes</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.currentMonthTurnos}</div>
                        <p className="text-xs text-muted-foreground">Turnos programados</p>
                    </CardContent>
                </Card>

                {/* Turnos completados */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Turnos Completados</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.completedTurnos}</div>
                        <p className="text-xs text-muted-foreground">Total histórico</p>
                    </CardContent>
                </Card>

                {/* Nuevos usuarios */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Nuevos Usuarios</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.newUsersThisMonth}</div>
                        <p className="text-xs text-muted-foreground">Este mes</p>
                    </CardContent>
                </Card>

                {/* Servicios populares */}
                <Card className="md:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Servicios Más Populares</CardTitle>
                        <Star className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {data.popularServices.map((service, index) => (
                                <div key={service.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                                            {index + 1}
                                        </Badge>
                                        <span className="font-medium">{service.name}</span>
                                    </div>
                                    <span className="text-sm text-muted-foreground">{service.count} veces</span>
                                </div>
                            ))}
                        </div>
                        {data.popularServices.length === 0 && (
                            <p className="text-sm text-muted-foreground">No hay datos disponibles</p>
                        )}
                    </CardContent>
                </Card>
            </div>
                </main>
            </div>
        </ProtectedRoute>
    )
}