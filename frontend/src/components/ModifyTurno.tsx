"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar as ShadCalendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
    CalendarIcon,
    Clock,
    Car,
    Wrench,
    CheckCircle,
    X,
    Edit2,
    Save
} from "lucide-react"
import { DateWeatherWidget } from "@/components/DateWeatherWidget"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

// Tipos de datos
interface Service {
    id: string
    name: string
    description: string
    precio?: Precio[]
    duration: number
}

interface Precio {
    id?: number
    tipoVehiculo: string
    precio: number
}

interface TimeSlot {
    id: string
    time: string
    available: boolean
}

interface Turno {
    id: number
    fechaHora: string
    servicio: { id: string, name: string }[]
    car: { id: string, marca: string, model: string, type: string }
    totalPrice: number
    pago?: { id: number, monto: number, estado: string }[]
    estado: 'pendiente' | 'finalizado' | 'cancelado'
}

interface ModifyTurnoProps {
    turno: Turno | null
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    suggestedDate?: Date | null
}

// Utilidades de fecha
const formatDate = (date: Date, options: Intl.DateTimeFormatOptions = {}): string => {
    return new Intl.DateTimeFormat('es-ES', options).format(date)
}

const formatTime = (date: Date): string => {
    return new Intl.DateTimeFormat('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).format(date)
}

const addMonths = (date: Date, months: number): Date => {
    const result = new Date(date)
    result.setMonth(result.getMonth() + months)
    return result
}

const startOfDay = (date: Date): Date => {
    const result = new Date(date)
    result.setHours(0, 0, 0, 0)
    return result
}

const endOfDay = (date: Date): Date => {
    const result = new Date(date)
    result.setHours(23, 59, 59, 999)
    return result
}

export default function ModifyTurno({ turno, isOpen, onClose, onSuccess, suggestedDate }: ModifyTurnoProps) {
    const [services, setServices] = useState<Service[]>([])
    const [selectedServices, setSelectedServices] = useState<Service[]>([])
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null)
    const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
    const [totalPrice, setTotalPrice] = useState(0)
    const [totalDuration, setTotalDuration] = useState(0)
    const [loading, setLoading] = useState(false)
    const [slotsLoading, setSlotsLoading] = useState(false)
    const [servicesLoading, setServicesLoading] = useState(false)

    // Verificar si el turno tiene pagos registrados (bloquea cambio de servicios)
    const hasPago = turno?.pago?.some(p => p.estado === 'PAGADO') || false

    // Validaciones de fecha
    const today = startOfDay(new Date())
    const maxSelectableDate = endOfDay(addMonths(new Date(), 2))

    const isSelectableDate = (date: Date): boolean => {
        const d = startOfDay(date)
        return d >= today && d <= maxSelectableDate
    }

    // Función para obtener precio según tipo de vehículo
    const getPriceForCarType = useCallback((service: Service, carType: string): number => {
        const type = carType.toUpperCase()
        const precio = service.precio?.find(p => p.tipoVehiculo === type)
        return precio ? Number(precio.precio) : 0
    }, [])

    // Obtener horarios disponibles
    const fetchAvailableSlots = useCallback(async (date: Date, duration: number = 60): Promise<void> => {
        try {
            if (duration === 0) {
                setAvailableSlots([])
                return
            }
            setSlotsLoading(true)

            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            const dateString = `${year}-${month}-${day}`

            const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/turno/available-slots?date=${dateString}&duration=${duration}`
            const resp = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('jwt')}`,
                },
            })

            if (!resp.ok) {
                throw new Error(`No se pudieron obtener horarios disponibles (${resp.status})`)
            }

            const data = await resp.json()
            const slots: TimeSlot[] = data.slots.map((slot: any) => ({
                id: slot.time,
                time: slot.time,
                available: slot.available
            }))

            setAvailableSlots(slots)

            // Solo preseleccionar el horario si es la fecha original del turno
            if (turno && date.getTime() === new Date(turno.fechaHora).getTime()) {
                const currentTime = formatTime(new Date(turno.fechaHora))
                const currentSlot = slots.find(slot => slot.time === currentTime)
                if (currentSlot && currentSlot.available) {
                    setSelectedTimeSlot(currentSlot)
                }
            }

        } catch (error) {
            console.error('Error obteniendo horarios:', error)
            toast.error("Error", {
                description: "No se pudieron cargar los horarios disponibles"
            })
            setAvailableSlots([])
        } finally {
            setSlotsLoading(false)
        }
    }, [turno])

    // Cargar servicios desde el backend
    useEffect(() => {
        if (isOpen) {
            const fetchServices = async () => {
                setServicesLoading(true)
                try {
                    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/services/getAll`)
                    const data = await response.json()

                    const servicesWithNumericPrices = data.map((service: Service) => ({
                        ...service,
                        precio: service.precio?.map(p => ({
                            ...p,
                            precio: Number(p.precio)
                        }))
                    }))

                    setServices(servicesWithNumericPrices)
                } catch (error) {
                    console.error("Error fetching services:", error)
                    toast.error("Error", {
                        description: "No se pudieron cargar los servicios"
                    })
                } finally {
                    setServicesLoading(false)
                }
            }

            fetchServices()
        }
    }, [isOpen])

    // Inicializar datos del turno
    useEffect(() => {
        if (turno && services.length > 0) {
            // Setear servicios seleccionados basados en el turno
            const turnoServices = services.filter(service =>
                turno.servicio.some(ts => ts.id === service.id)
            )
            setSelectedServices(turnoServices)

            // Setear fecha del turno o fecha sugerida
            const turnoDate = new Date(turno.fechaHora)
            const initialDate = suggestedDate || turnoDate
            setSelectedDate(initialDate)

            // Calcular precio y duración
            const carType = turno.car.type
            const price = turnoServices.reduce((sum, s) => sum + getPriceForCarType(s, carType), 0)
            const duration = turnoServices.reduce((sum, s) => sum + s.duration, 0)

            setTotalPrice(price)
            setTotalDuration(duration)

            // Cargar horarios para la fecha seleccionada
            fetchAvailableSlots(initialDate, duration)

            // Si hay fecha sugerida, mostrar toast informativo
            if (suggestedDate) {
                toast.info("Fecha sugerida seleccionada", {
                    description: "Hemos seleccionado automáticamente la fecha con mejor pronóstico del tiempo.",
                    duration: 5000,
                })
            }
        }
    }, [turno, services, getPriceForCarType, fetchAvailableSlots, suggestedDate])

    // Manejar selección de servicios
    const handleServiceToggle = (service: Service) => {
        if (hasPago) {
            toast.error("No se pueden modificar los servicios de un turno que ya tiene pagos registrados")
            return
        }
        const isSelected = selectedServices.some(s => s.id === service.id)

        let updatedServices: Service[]
        if (isSelected) {
            updatedServices = selectedServices.filter(s => s.id !== service.id)
        } else {
            updatedServices = [...selectedServices, service]
        }

        // Recalcular precio y duración ANTES de actualizar el estado
        const carType = turno?.car.type || 'AUTO'
        const price = updatedServices.reduce((sum, s) => sum + getPriceForCarType(s, carType), 0)
        const duration = updatedServices.reduce((sum, s) => sum + s.duration, 0)

        // Actualizar estados
        setSelectedServices(updatedServices)
        setTotalPrice(price)
        setTotalDuration(duration)

        // Reset horario seleccionado y recargar slots con la nueva duración
        setSelectedTimeSlot(null)
        if (selectedDate) {
            fetchAvailableSlots(selectedDate, duration)
        }
    }

    // Manejar selección de fecha
    const handleDateSelect = (date: Date) => {
        if (!isSelectableDate(date)) return

        setSelectedDate(date)
        setSelectedTimeSlot(null)
        // Usar la duración actual de los servicios seleccionados
        const currentDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0) || 60
        fetchAvailableSlots(date, currentDuration)
    }

    // Manejar selección de horario
    const handleTimeSlotSelect = (slot: TimeSlot) => {
        if (!slot.available) return
        setSelectedTimeSlot(slot)
    }

    // Confirmar modificación
    const handleConfirmModification = async () => {
        if (!turno || !selectedDate || !selectedTimeSlot || selectedServices.length === 0) {
            toast.error("Error", {
                description: "Complete todos los campos requeridos"
            })
            return
        }

        setLoading(true)
        try {
            // Combinar fecha con horario seleccionado
            const [hours, minutes] = selectedTimeSlot.time.split(':').map(Number)
            const combinedDateTime = new Date(selectedDate)
            combinedDateTime.setHours(hours, minutes, 0, 0)

            // Construir fecha como string local sin conversión UTC
            const y = combinedDateTime.getFullYear()
            const mo = String(combinedDateTime.getMonth() + 1).padStart(2, '0')
            const da = String(combinedDateTime.getDate()).padStart(2, '0')
            const h = String(combinedDateTime.getHours()).padStart(2, '0')
            const mi = String(combinedDateTime.getMinutes()).padStart(2, '0')

            const modifyPayload = {
                turnoId: turno.id,
                fechaHora: `${y}-${mo}-${da}T${h}:${mi}:00`,
                estado: turno.estado,
                observacion: `Turno modificado - Servicios: ${selectedServices.map(s => s.name).join(', ')}`,
                servicios: selectedServices.map(s => parseInt(s.id))
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/turno/modify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('jwt')}`
                },
                body: JSON.stringify(modifyPayload)
            })

            if (!response.ok) {
                throw new Error('Error al modificar el turno')
            }

            toast.success("¡Éxito!", {
                description: "Turno modificado correctamente"
            })

            onSuccess()
            onClose()

        } catch (error) {
            console.error('Error modificando turno:', error)
            toast.error("Error", {
                description: "No se pudo modificar el turno. Intenta nuevamente."
            })
        } finally {
            setLoading(false)
        }
    }

    // Validar si se pueden confirmar los cambios
    const canConfirmChanges = () => {
        return selectedDate && selectedTimeSlot && selectedServices.length > 0 && !loading
    }

    // Reset al cerrar
    const handleClose = () => {
        setSelectedServices([])
        setSelectedDate(null)
        setSelectedTimeSlot(null)
        setAvailableSlots([])
        setTotalPrice(0)
        setTotalDuration(0)
        onClose()
    }

    if (!turno) return null

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Edit2 className="h-5 w-5" />
                        Modificar Turno
                    </DialogTitle>
                    <DialogDescription>
                        Modifica la fecha, hora y servicios de tu turno.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Información actual del turno */}
                    <Card className="border-l-4 border-l-blue-500">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Car className="h-5 w-5" />
                                Información Actual
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-medium">Vehículo:</span> {turno.car.marca} {turno.car.model}
                                </div>
                                <div>
                                    <span className="font-medium">Fecha actual:</span> {formatDate(new Date(turno.fechaHora), {
                                        weekday: 'short',
                                        day: 'numeric',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                                <div className="md:col-span-2">
                                    <span className="font-medium">Servicios actuales:</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {turno.servicio.map(s => (
                                            <Badge key={s.id} variant="outline">{s.name}</Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Selección de servicios */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Wrench className="h-5 w-5" />
                                Servicios
                                {hasPago && (
                                    <Badge variant="destructive" className="ml-2 text-xs">
                                        🔒 Bloqueado por pago
                                    </Badge>
                                )}
                            </CardTitle>
                            {hasPago && (
                                <p className="text-sm text-amber-600">
                                    Los servicios no pueden modificarse porque el turno ya tiene pagos registrados. Solo puede cambiar la fecha.
                                </p>
                            )}
                        </CardHeader>
                        <CardContent>
                            {servicesLoading ? (
                                <div className="space-y-4">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="skeleton h-16 w-full"></div>
                                    ))}
                                </div>
                            ) : (
                                <div className={`space-y-3 max-h-60 overflow-y-auto ${hasPago ? 'opacity-60 pointer-events-none' : ''}`}>
                                    {services.map((service) => {
                                        const isSelected = selectedServices.some(s => s.id === service.id)
                                        const servicePrice = getPriceForCarType(service, turno.car.type)

                                        return (
                                            <div
                                                key={service.id}
                                                className={`p-3 border rounded cursor-pointer transition-colors ${isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-gray-50'
                                                    }`}
                                                onClick={() => handleServiceToggle(service)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault()
                                                        handleServiceToggle(service)
                                                    }
                                                }}
                                                tabIndex={0}
                                                role="button"
                                                aria-label={`${isSelected ? 'Deseleccionar' : 'Seleccionar'} servicio ${service.name}`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            readOnly
                                                            className="checkbox checkbox-primary"
                                                        />
                                                        <div>
                                                            <h4 className="font-medium">{service.name}</h4>
                                                            <p className="text-sm text-muted-foreground">{service.description}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Clock className="h-3 w-3" />
                                                                <span className="text-xs">{service.duration} min</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="font-bold">${servicePrice.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Selección de fecha y hora */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CalendarIcon className="h-5 w-5" />
                                Nueva Fecha y Hora
                                {suggestedDate && selectedDate?.getTime() === suggestedDate.getTime() && (
                                    <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800 hover:bg-green-200 border-green-200">
                                        ☀️ Fecha Sugerida
                                    </Badge>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Calendario */}
                                <div>
                                    <ShadCalendar
                                        mode="single"
                                        selected={selectedDate || undefined}
                                        onSelect={(date) => date && handleDateSelect(date)}
                                        fromDate={today}
                                        toDate={maxSelectableDate}
                                        className="rounded-md border"
                                        formatters={{
                                            formatWeekdayName: (date: Date) =>
                                                date.toLocaleString("es-AR", { weekday: "short" }),
                                        }}
                                    />
                                </div>

                                {/* Horarios disponibles */}
                                <div>
                                    <h4 className="font-medium mb-3">Horarios Disponibles</h4>
                                    {!selectedDate && (
                                        <p className="text-sm text-muted-foreground">
                                            Selecciona una fecha para ver los horarios disponibles
                                        </p>
                                    )}
                                    {selectedDate && slotsLoading && (
                                        <div className="flex items-center gap-2">
                                            <span className="loading loading-spinner loading-sm" />
                                            <span className="text-sm">Cargando horarios...</span>
                                        </div>
                                    )}
                                    {selectedDate && !slotsLoading && (
                                        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                                            {availableSlots.filter(slot => slot.available).map(slot => (
                                                <Button
                                                    key={slot.id}
                                                    variant={selectedTimeSlot?.id === slot.id ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => handleTimeSlotSelect(slot)}
                                                    className="text-xs"
                                                >
                                                    {slot.time}
                                                </Button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Widget del clima */}
                            {selectedDate && (
                                <div className="mt-6">
                                    <DateWeatherWidget date={selectedDate} />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Resumen de cambios */}
                    {selectedServices.length > 0 && (
                        <Card className="border-l-4 border-l-green-500">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5" />
                                    Resumen de Cambios
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div>
                                        <span className="font-medium">Nuevos servicios:</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {selectedServices.map(s => (
                                                <Badge key={s.id} variant="default">{s.name}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                    {selectedDate && selectedTimeSlot && (
                                        <div>
                                            <span className="font-medium">Nueva fecha y hora:</span>
                                            <p className="text-sm mt-1">
                                                {formatDate(selectedDate, {
                                                    weekday: 'long',
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric'
                                                })} a las {selectedTimeSlot.time}
                                            </p>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center pt-2 border-t">
                                        <span className="font-medium">Nueva duración total:</span>
                                        <span>{Math.floor(totalDuration / 60)}h {totalDuration % 60}min</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium">Nuevo precio total:</span>
                                        <span className="text-lg font-bold">${totalPrice.toLocaleString()}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={handleClose} disabled={loading}>
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirmModification}
                        disabled={!canConfirmChanges()}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {loading ? (
                            <span className="loading loading-spinner loading-sm mr-2" />
                        ) : (
                            <Save className="h-4 w-4 mr-2" />
                        )}
                        {loading ? 'Modificando...' : 'Confirmar Modificación'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}