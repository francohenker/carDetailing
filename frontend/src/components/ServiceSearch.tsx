"use client"
import React, { useState, useMemo } from 'react';
import { Search, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
// Popover temporalmente removido para evitar problemas de dependencias

interface Precio {
    id?: number
    tipoVehiculo: string
    precio: number
}

interface Service {
    id: string
    name: string
    description: string
    precio?: Precio[]
    duration: number
}

interface ServiceSearchProps {
    services: Service[]
    selectedServices: Service[]
    onServiceToggle: (service: Service) => void
    onClearAll: () => void
    carType?: string
    loading?: boolean
}

const ServiceSearch: React.FC<ServiceSearchProps> = ({
    services,
    selectedServices,
    onServiceToggle,
    onClearAll,
    carType = 'sedan',
    loading = false
}) => {
    // Estados para la búsqueda y filtros
    const [searchQuery, setSearchQuery] = useState('')
    const [priceFilter, setPriceFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all')
    const [durationFilter, setDurationFilter] = useState<'all' | 'short' | 'medium' | 'long'>('all')
    const [sortBy, setSortBy] = useState<'name' | 'price' | 'duration'>('name')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

    // Función para obtener el precio según tipo de vehículo
    const getPriceForCarType = (service: Service, vehicleType: string): number => {
        const type = vehicleType.toUpperCase()
        const precio = service.precio?.find(p => p.tipoVehiculo === type)
        return precio ? Number(precio.precio) : 0
    }

    // Servicios filtrados y ordenados
    const filteredAndSortedServices = useMemo(() => {
        const filtered = services.filter(service => {
            // Filtro por tipo de vehículo: excluir servicios que no tienen precio para este tipo
            const hasVehicleType = service.precio?.some(p => p.tipoVehiculo === carType.toUpperCase())
            if (!hasVehicleType) return false

            // Filtro por texto de búsqueda
            const matchesSearch = searchQuery === '' || 
                service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                service.description.toLowerCase().includes(searchQuery.toLowerCase())

            if (!matchesSearch) return false

            const price = getPriceForCarType(service, carType)

            // Filtro por precio
            const matchesPrice = (() => {
                switch (priceFilter) {
                    case 'low': return price < 5000
                    case 'medium': return price >= 5000 && price < 15000
                    case 'high': return price >= 15000
                    default: return true
                }
            })()

            if (!matchesPrice) return false

            // Filtro por duración
            const matchesDuration = (() => {
                switch (durationFilter) {
                    case 'short': return service.duration < 60
                    case 'medium': return service.duration >= 60 && service.duration < 120
                    case 'long': return service.duration >= 120
                    default: return true
                }
            })()

            return matchesDuration
        })

        // Ordenamiento
        filtered.sort((a, b) => {
            let comparison = 0
            
            switch (sortBy) {
                case 'name':
                    comparison = a.name.localeCompare(b.name)
                    break
                case 'price': {
                    const priceA = getPriceForCarType(a, carType)
                    const priceB = getPriceForCarType(b, carType)
                    comparison = priceA - priceB
                    break
                }
                case 'duration':
                    comparison = a.duration - b.duration
                    break
            }

            return sortOrder === 'asc' ? comparison : -comparison
        })

        return filtered
    }, [services, searchQuery, priceFilter, durationFilter, sortBy, sortOrder, carType])

    // Estadísticas de servicios
    const stats = useMemo(() => {
        const totalSelected = selectedServices.length
        const totalPrice = selectedServices.reduce((sum, service) => 
            sum + getPriceForCarType(service, carType), 0)
        const totalDuration = selectedServices.reduce((sum, service) => 
            sum + service.duration, 0)
        
        return { totalSelected, totalPrice, totalDuration }
    }, [selectedServices, carType])

    // Limpiar filtros
    const clearFilters = () => {
        setSearchQuery('')
        setPriceFilter('all')
        setDurationFilter('all')
        setSortBy('name')
        setSortOrder('asc')
    }

    // Verificar si hay filtros activos
    const hasActiveFilters = searchQuery !== '' || priceFilter !== 'all' || 
                           durationFilter !== 'all' || sortBy !== 'name' || sortOrder !== 'asc'

    return (
        <div className="space-y-6">
            {/* Barra de búsqueda y filtros */}
            <div className="space-y-4">
                {/* Búsqueda principal */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar servicios por nombre o descripción..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-10"
                        disabled={loading}
                    />
                    {searchQuery && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                            onClick={() => setSearchQuery('')}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                {/* Filtros y ordenamiento */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Filtro por precio */}
                    <Select value={priceFilter} onValueChange={(value: any) => setPriceFilter(value)}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Precio" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los precios</SelectItem>
                            <SelectItem value="low">Hasta $5,000</SelectItem>
                            <SelectItem value="medium">$5,000 - $15,000</SelectItem>
                            <SelectItem value="high">Más de $15,000</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Filtro por duración */}
                    <Select value={durationFilter} onValueChange={(value: any) => setDurationFilter(value)}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Duración" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas las duraciones</SelectItem>
                            <SelectItem value="short">Menos de 1h</SelectItem>
                            <SelectItem value="medium">1h - 2h</SelectItem>
                            <SelectItem value="long">Más de 2h</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Ordenamiento */}
                    <div className="flex items-center gap-2">
                        {/* <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                            <SelectTrigger className="w-36">
                                <SelectValue placeholder="Ordenar por" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="name">Nombre</SelectItem>
                                <SelectItem value="price">Precio</SelectItem>
                                <SelectItem value="duration">Duración</SelectItem>
                            </SelectContent>
                        </Select> */}
                        
                        <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
                            <SelectTrigger className="w-32">
                                <SelectValue placeholder="Orden" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="asc">↑ Asc</SelectItem>
                                <SelectItem value="desc">↓ Desc</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Limpiar filtros */}
                    {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                            <X className="h-4 w-4 mr-2" />
                            Limpiar filtros
                        </Button>
                    )}

                    {/* Limpiar selección */}
                    {selectedServices.length > 0 && (
                        <Button variant="ghost" size="sm" onClick={onClearAll}>
                            Deseleccionar todos
                        </Button>
                    )}
                </div>
            </div>

            {/* Estadísticas de selección */}
            {selectedServices.length > 0 && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h4 className="font-medium text-sm">Servicios seleccionados</h4>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>{stats.totalSelected} servicio{stats.totalSelected !== 1 ? 's' : ''}</span>
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {Math.floor(stats.totalDuration / 60)}h {stats.totalDuration % 60}min
                                </span>
                                <span className="font-medium text-foreground">
                                    ${stats.totalPrice.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Información de resultados */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    {loading ? 'Cargando servicios...' : 
                     `${filteredAndSortedServices.length} servicio${filteredAndSortedServices.length !== 1 ? 's' : ''} ${
                        filteredAndSortedServices.length !== services.length ? 'encontrado' + (filteredAndSortedServices.length !== 1 ? 's' : '') : 'disponible' + (filteredAndSortedServices.length !== 1 ? 's' : '')
                     }`}
                </p>
                
                {searchQuery && filteredAndSortedServices.length === 0 && !loading && (
                    <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')}>
                        Mostrar todos los servicios
                    </Button>
                )}
            </div>

            {/* Lista de servicios */}
            <div className="space-y-4">
                {loading ? (
                    // Skeleton loading
                    [...Array(6)].map((_, i) => (
                        <div key={i} className="skeleton h-20 w-full"></div>
                    ))
                ) : filteredAndSortedServices.length === 0 ? (
                    // No hay resultados
                    <div className="text-center py-12">
                        <div className="text-muted-foreground">
                            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium mb-2">No se encontraron servicios</p>
                            <p className="text-sm">
                                {searchQuery ? 
                                    'Intenta con otros términos de búsqueda' : 
                                    'Prueba ajustando los filtros'}
                            </p>
                        </div>
                    </div>
                ) : (
                    // Lista de servicios filtrados
                    filteredAndSortedServices.map((service) => {
                        const isSelected = selectedServices.some((s) => s.id === service.id)
                        const servicePrice = getPriceForCarType(service, carType)

                        return (
                            <div
                                key={service.id}
                                className={`card bg-base-200 cursor-pointer transition-all hover:shadow-md ${
                                    isSelected ? "ring-2 ring-primary bg-primary/10" : ""
                                }`}
                                onClick={() => onServiceToggle(service)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        onServiceToggle(service);
                                    }
                                }}
                                tabIndex={0}
                                role="button"
                                aria-label={`${isSelected ? 'Deseleccionar' : 'Seleccionar'} servicio ${service.name} - $${servicePrice.toLocaleString()}`}
                            >
                                <div className="card-body p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    className="checkbox checkbox-primary"
                                                    checked={isSelected}
                                                    readOnly
                                                />
                                                <div>
                                                    <h3 className="font-semibold">{service.name}</h3>
                                                    <p className="text-sm text-base-content/70 line-clamp-2">
                                                        {service.description}
                                                    </p>
                                                    <div className="flex items-center gap-4 mt-2">
                                                        <div className="flex items-center gap-1 text-sm">
                                                            <Clock className="h-4 w-4" />
                                                            {service.duration} min
                                                        </div>
                                                        <Badge variant="outline" className="text-xs">
                                                            {carType}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold">
                                                ${servicePrice.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}

export default ServiceSearch