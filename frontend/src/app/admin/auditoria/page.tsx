"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
    ChevronLeft,
    FileText,
    Calendar,
    Activity,
    TrendingUp,
    Users,
    Filter,
    Search,
    RefreshCw
} from "lucide-react"
import ProtectedRoute from "@/components/ProtectedRoutes"
import HeaderDefault from "@/app/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

interface AuditoriaRecord {
    id: number
    accion: string
    entidad: string
    entidadId?: number
    descripcion?: string
    fechaCreacion: string
    usuario?: {
        firstname: string
        lastname: string
        email: string
    }
    ip?: string
    userAgent?: string
}

interface AuditoriaStats {
    totalRegistros: number
    registrosHoy: number
    registrosEstaSemana: number
    accionesMasComunes: Array<{ accion: string; cantidad: number }>
    entidadesMasAuditadas: Array<{ entidad: string; cantidad: number }>
}

export default function AuditoriaPage() {
    const [records, setRecords] = useState<AuditoriaRecord[]>([])
    const [stats, setStats] = useState<AuditoriaStats>({
        totalRegistros: 0,
        registrosHoy: 0,
        registrosEstaSemana: 0,
        accionesMasComunes: [],
        entidadesMasAuditadas: []
    })
    const [loading, setLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [filters, setFilters] = useState({
        accion: '',
        entidad: '',
        usuarioId: '',
        limit: '50'
    })

    const fetchRecords = async (page = 1) => {
        try {
            setLoading(true)
            const params = new URLSearchParams({
                page: page.toString(),
                ...filters
            })
            
            const response = await fetch(`/api/auditoria?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwt')}`
                }
            })
            
            if (!response.ok) throw new Error('Error fetching auditoria records')
            
            const data = await response.json()
            setRecords(data.data || [])
            setCurrentPage(data.page || 1)
            setTotalPages(data.totalPages || 1)
        } catch (error) {
            console.error('Error fetching auditoria records:', error)
            toast.error("Error", {
                description: "No se pudieron cargar los registros de auditoría.",
            })
        } finally {
            setLoading(false)
        }
    }

    const fetchStats = async () => {
        try {
            const response = await fetch(`/api/auditoria/estadisticas`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwt')}`
                }
            })
            
            if (!response.ok) throw new Error('Error fetching auditoria stats')
            
            const data = await response.json()
            setStats(data)
        } catch (error) {
            console.error('Error fetching auditoria stats:', error)
        }
    }

    useEffect(() => {
        fetchRecords()
        fetchStats()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }))
    }

    const applyFilters = () => {
        setCurrentPage(1)
        fetchRecords(1)
    }

    const clearFilters = () => {
        setFilters({
            accion: '',
            entidad: '',
            usuarioId: '',
            limit: '50'
        })
        setCurrentPage(1)
        fetchRecords(1)
    }

    const getActionColor = (accion: string) => {
        switch (accion) {
            case 'CREAR': return 'bg-green-100 text-green-700'
            case 'ACTUALIZAR': return 'bg-blue-100 text-blue-700'
            case 'ELIMINAR': return 'bg-red-100 text-red-700'
            case 'LOGIN': return 'bg-yellow-100 text-yellow-700'
            case 'LOGOUT': return 'bg-orange-100 text-orange-700'
            case 'MARCAR_COMPLETADO': return 'bg-emerald-100 text-emerald-700'
            case 'MARCAR_PAGADO': return 'bg-cyan-100 text-cyan-700'
            case 'CANCELAR': return 'bg-pink-100 text-pink-700'
            case 'MODIFICAR_ROL': return 'bg-purple-100 text-purple-700'
            case 'ACTIVAR_DESACTIVAR': return 'bg-indigo-100 text-indigo-700'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <div className="min-h-screen bg-base-100">
                <HeaderDefault />
                <main className="container mx-auto p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <Link href="/admin" className="text-muted-foreground hover:text-foreground">
                            <ChevronLeft className="h-4 w-4" />
                        </Link>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <FileText className="h-8 w-8 text-primary" />
                            Auditoría del Sistema
                        </h1>
                    </div>

                    {/* Estadísticas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Total Registros</p>
                                        <p className="text-2xl font-bold">{stats.totalRegistros}</p>
                                    </div>
                                    <FileText className="h-8 w-8 text-blue-600 bg-blue-100 p-1.5 rounded-full" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Registros Hoy</p>
                                        <p className="text-2xl font-bold">{stats.registrosHoy}</p>
                                    </div>
                                    <Calendar className="h-8 w-8 text-green-600 bg-green-100 p-1.5 rounded-full" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Esta Semana</p>
                                        <p className="text-2xl font-bold">{stats.registrosEstaSemana}</p>
                                    </div>
                                    <Activity className="h-8 w-8 text-purple-600 bg-purple-100 p-1.5 rounded-full" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Acción Más Común</p>
                                        <p className="text-lg font-bold">
                                            {stats.accionesMasComunes[0]?.accion || 'N/A'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {stats.accionesMasComunes[0]?.cantidad || 0} veces
                                        </p>
                                    </div>
                                    <TrendingUp className="h-8 w-8 text-orange-600 bg-orange-100 p-1.5 rounded-full" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filtros */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Filter className="h-5 w-5" />
                                Filtros de Búsqueda
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <div className="text-sm font-medium mb-1">Acción</div>
                                    <Select value={filters.accion} onValueChange={(value) => handleFilterChange('accion', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Todas las acciones" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">Todas las acciones</SelectItem>
                                            <SelectItem value="CREAR">CREAR</SelectItem>
                                            <SelectItem value="ACTUALIZAR">ACTUALIZAR</SelectItem>
                                            <SelectItem value="ELIMINAR">ELIMINAR</SelectItem>
                                            <SelectItem value="LOGIN">LOGIN</SelectItem>
                                            <SelectItem value="LOGOUT">LOGOUT</SelectItem>
                                            <SelectItem value="MARCAR_COMPLETADO">MARCAR_COMPLETADO</SelectItem>
                                            <SelectItem value="MARCAR_PAGADO">MARCAR_PAGADO</SelectItem>
                                            <SelectItem value="CANCELAR">CANCELAR</SelectItem>
                                            <SelectItem value="MODIFICAR_ROL">MODIFICAR_ROL</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <div className="text-sm font-medium mb-1">Entidad</div>
                                    <Select value={filters.entidad} onValueChange={(value) => handleFilterChange('entidad', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Todas las entidades" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">Todas las entidades</SelectItem>
                                            <SelectItem value="USUARIO">USUARIO</SelectItem>
                                            <SelectItem value="TURNO">TURNO</SelectItem>
                                            <SelectItem value="SERVICIO">SERVICIO</SelectItem>
                                            <SelectItem value="PRODUCTO">PRODUCTO</SelectItem>
                                            <SelectItem value="PROVEEDOR">PROVEEDOR</SelectItem>
                                            <SelectItem value="PAGO">PAGO</SelectItem>
                                            <SelectItem value="CAR">CAR</SelectItem>
                                            <SelectItem value="SISTEMA">SISTEMA</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <div className="text-sm font-medium mb-1">Límite</div>
                                    <Select value={filters.limit} onValueChange={(value) => handleFilterChange('limit', value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="25">25 registros</SelectItem>
                                            <SelectItem value="50">50 registros</SelectItem>
                                            <SelectItem value="100">100 registros</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex gap-2 items-end">
                                    <Button onClick={applyFilters} className="flex-1">
                                        <Search className="h-4 w-4 mr-2" />
                                        Buscar
                                    </Button>
                                    <Button variant="outline" onClick={clearFilters}>
                                        <RefreshCw className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Registros */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Registros de Auditoría</CardTitle>
                            <CardDescription>
                                Página {currentPage} de {totalPages} - {records.length} registros
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <span className="loading loading-spinner loading-lg"></span>
                                </div>
                            ) : records.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No se encontraron registros de auditoría.
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-4">
                                        {records.map((record) => (
                                            <div key={record.id} className="border rounded-lg p-4 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Badge className={getActionColor(record.accion)}>
                                                            {record.accion}
                                                        </Badge>
                                                        <span className="font-medium">{record.entidad}</span>
                                                        {record.entidadId && (
                                                            <span className="text-sm text-muted-foreground">
                                                                ID: {record.entidadId}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-sm text-muted-foreground">
                                                        {new Date(record.fechaCreacion).toLocaleString()}
                                                    </span>
                                                </div>
                                                
                                                {record.descripcion && (
                                                    <p className="text-sm text-muted-foreground">
                                                        {record.descripcion}
                                                    </p>
                                                )}
                                                
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                    {record.usuario && (
                                                        <div className="flex items-center gap-1">
                                                            <Users className="h-3 w-3" />
                                                            <span>
                                                                {record.usuario.firstname} {record.usuario.lastname}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {record.ip && (
                                                        <span>IP: {record.ip}</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Paginación */}
                                    {totalPages > 1 && (
                                        <div className="flex justify-between items-center mt-6">
                                            <Button 
                                                variant="outline" 
                                                disabled={currentPage <= 1}
                                                onClick={() => fetchRecords(currentPage - 1)}
                                            >
                                                Anterior
                                            </Button>
                                            
                                            <span className="text-sm text-muted-foreground">
                                                Página {currentPage} de {totalPages}
                                            </span>
                                            
                                            <Button 
                                                variant="outline" 
                                                disabled={currentPage >= totalPages}
                                                onClick={() => fetchRecords(currentPage + 1)}
                                            >
                                                Siguiente
                                            </Button>
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </main>
            </div>
        </ProtectedRoute>
    )
}