"use client"
import HeaderDefault from "../header"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Calendar, momentLocalizer } from "react-big-calendar"
import moment from "moment"
import "moment/locale/es"
import "react-big-calendar/lib/css/react-big-calendar.css"
import {
    Car,
    ChevronLeft,
    ChevronRight,
    Clock,
    CreditCard,
    MapPin,
    Phone,
    User,
    CheckCircle,
    CalendarIcon,
    Wrench,
} from "lucide-react"
import Alert from "@/components/Alert"


// Configurar moment en español
moment.locale("es")
const localizer = momentLocalizer(moment)

// Tipos de datos
interface Service {
    id: string
    name: string
    description: string
    precio: number
    duration: number // en minutos
}

interface car {
    id: string
    marca: string
    model: string
    color: string
    patente: string
    type: string
}

interface TimeSlot {
    id: string
    time: string
    available: boolean
}

interface CalendarEvent {
    id: string
    title: string
    start: Date
    end: Date
    resource?: any
}

interface BookingData {
    services: Service[]
    car: car | null
    date: Date | null
    timeSlot: TimeSlot | null
    totalPrice: number
    totalDuration: number
}

export default function TurnoPage() {

    const router = useRouter()

    // Estados principales
    const [currentStep, setCurrentStep] = useState(1)
    const [services, setServices] = useState<Service[]>([])
    const [cars, setcars] = useState<car[]>([])
    const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
    const [slotsLoading, setSlotsLoading] = useState(false)
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Estado del booking
    const [bookingData, setBookingData] = useState<BookingData>({
        services: [],
        car: null,
        date: null,
        timeSlot: null,
        totalPrice: 0,
        totalDuration: 0,
    })

    // Estados para el calendario
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [calendarView, setCalendarView] = useState<"month" | "week" | "day">("month")

    // Rango de fechas seleccionables: hoy hasta dentro de 2 meses (incluye fines de semana)
    const today = moment().startOf('day').toDate()
    const maxSelectableDate = moment(today).add(2, 'months').endOf('day').toDate()

    const isSelectableDate = (date: Date) => {
        const d = moment(date).startOf('day').toDate()
        return d >= today && d <= maxSelectableDate
    }

    // Cargar servicios desde el backend
    useEffect(() => {
        const fetchServices = async () => {
            setLoading(true)
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/services/getAll`)
                const data = await response.json()
                setServices(data)
            } catch (error) {
                setError("Error fetching services")
                console.error("Error fetching services:", error)
            } finally {
                setLoading(false)
                if (error) {
                    return <Alert type='error' message={error} />
                }
            }
        }

        fetchServices()
    }, [])

    // Cargar vehículos del usuario
    useEffect(() => {
        const fetchcars = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/car/get-cars-user`, {
                    headers: {
                        Type: "application/json",
                        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                    },
                })
                const data = await response.json()
                setcars(data)
            } catch (error) {
                setError("Error fetching cars")
            } finally {
                if (error) {
                    return <Alert type='error' message={error} />
                }
            }
        }

        fetchcars()
    }, [])

    // Genera slots de 09:00 a 18:00 cada 30 minutos y marca ocupados
    const generateSlotsWithBooked = (date: Date, bookedTimes: Set<string>) => {
        const slots: TimeSlot[] = []
        const startHour = 9
        const endHour = 18
        const step = 60
        for (let h = startHour; h < endHour; h++) {
            for (let m = 0; m < 60; m += step) {
                const label = moment(date).hour(h).minute(m).format('HH:mm')
                slots.push({ id: label, time: label, available: !bookedTimes.has(label) })
            }
        }
        return slots
    }

    // Traer turnos del día actual (el backend usa la fecha actual) y marcar NO disponibles esos horarios
    const fetchAvailableSlots = async (date: Date) => {
        try {
            setSlotsLoading(true)
            const isToday = moment(date).isSame(moment(), 'day')
            if (!isToday) {
                // Para fechas futuras (o no hoy) asumimos todos disponibles
                setAvailableSlots(generateSlotsWithBooked(date, new Set()))
                return
            }
            const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/turno/get-date`
            const resp = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('jwt')}`,
                },
            })
            if (!resp.ok) {
                throw new Error(`No se pudieron obtener turnos del día (${resp.status})`)
            }
            const raw = await resp.json()
            const turnos: any[] = Array.isArray(raw) ? raw : []
            const booked = new Set<string>()
            for (const t of turnos) {
                const fecha = t?.fechaHora ? new Date(t.fechaHora) : null
                if (!fecha) continue
                booked.add(moment(fecha).format('HH:mm'))
            }
            setAvailableSlots(generateSlotsWithBooked(date, booked))
        } catch (e: any) {
            console.error('Error obteniendo horarios:', e)
            // Si falla, mostramos todos como disponibles para no bloquear
            setAvailableSlots(generateSlotsWithBooked(date, new Set()))
            setError('No se pudieron cargar los horarios del día, mostrando disponibilidad general')
        } finally {
            setSlotsLoading(false)
        }
    }

    // Manejar selección de servicios
    const handleServiceToggle = (service: Service) => {
        const isSelected = bookingData.services.some((s) => s.id === service.id)

        let updatedServices: Service[]
        if (isSelected) {
            updatedServices = bookingData.services.filter((s) => s.id !== service.id)
        } else {
            updatedServices = [...bookingData.services, service]
        }

        const totalPrice = updatedServices.reduce((sum, s) => sum + s.precio, 0)
        const totalDuration = updatedServices.reduce((sum, s) => sum + s.duration, 0)

        setBookingData({
            ...bookingData,
            services: updatedServices,
            totalPrice,
            totalDuration,
        })
    }

    // Manejar selección de vehículo
    const handlecarSelect = (car: car) => {
        setBookingData({
            ...bookingData,
            car,
        })
    }

    // Manejar selección de fecha en el calendario
    const handleDateSelect = (date: Date) => {
        // Permitir SOLO hoy o fechas futuras hasta 2 meses
        if (!isSelectableDate(date)) {
            // Ignorar selección fuera de rango
            return
        }
        setSelectedDate(date)
        setBookingData({
            ...bookingData,
            date,
            timeSlot: null,
        })
        setAvailableSlots([])
        // Cargar horarios disponibles desde el backend
        fetchAvailableSlots(date)
    }

    const handleNavigate = (date: Date) => {
        // Evitar navegar a fechas fuera del rango, ajustar a bordes
        if (moment(date).isBefore(today, 'day')) {
            setSelectedDate(today)
            return
        }
        if (moment(date).isAfter(maxSelectableDate, 'day')) {
            setSelectedDate(maxSelectableDate)
            return
        }
        setSelectedDate(date)
    }

    // Manejar selección de horario
    const handleTimeSlotSelect = (slot: TimeSlot) => {
        if (!slot.available) return

        setBookingData({
            ...bookingData,
            timeSlot: slot,
        })
    }

    // Confirmar reserva
    const handleConfirmBooking = async () => {
        setLoading(true)
        try {
            // Simulación de envío al backend
            await new Promise((resolve) => setTimeout(resolve, 2000))

            // Aquí iría la llamada real al backend
            const bookingPayload = {
                services: bookingData.services.map((s) => s.id),
                carId: bookingData.car?.id,
                date: bookingData.date?.toISOString(),
                time: bookingData.timeSlot?.time,
                totalPrice: bookingData.totalPrice,
                totalDuration: bookingData.totalDuration,
            }

            console.log("Booking payload:", bookingPayload)

            // Mostrar mensaje de éxito y redirigir
            alert("¡Turno reservado exitosamente!")
            router.push("/perfil")
        } catch (error) {
            console.error("Error confirming booking:", error)
            alert("Error al reservar el turno. Por favor, intenta nuevamente.")
        } finally {
            setLoading(false)
        }
    }

    // Validar si se puede avanzar al siguiente paso
    const canProceedToNextStep = () => {
        switch (currentStep) {
            case 1:
                return bookingData.services.length > 0
            case 2:
                return bookingData.car !== null
            case 3:
                return bookingData.date !== null && bookingData.timeSlot !== null
            default:
                return false
        }
    }



    return (
        <div className="min-h-screen bg-base-100">
            {/* Header */}
            <div className="" >
                <HeaderDefault />
                <h1 className="text-2xl font-bold">Reservar Turno</h1>
                <p className="text-gray-600">Seleccione el servicio y la fecha deseada.</p>
            </div >

            {/* Breadcrumb */}
            <div className="container mx-auto px-4 py-4">
                <div className="text-sm breadcrumbs">
                    <ul>
                        <li>
                            <Link href="/" className="link link-hover">
                                Inicio
                            </Link>
                        </li>
                        <li>
                            <Link href="/servicios" className="link link-hover">
                                Servicios
                            </Link>
                        </li>
                        <li>Reservar Turno</li>
                    </ul>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="container mx-auto px-4 mb-8">
                <ul className="steps steps-horizontal w-full">
                    <li className={`step ${currentStep >= 1 ? "step-primary" : ""}`}>Vehículo</li>
                    <li className={`step ${currentStep >= 2 ? "step-primary" : ""}`}>Servicios</li>
                    <li className={`step ${currentStep >= 3 ? "step-primary" : ""}`}>Fecha y Hora</li>
                    <li className={`step ${currentStep >= 4 ? "step-primary" : ""}`}>Confirmación</li>
                </ul>
            </div>

            <div className="container mx-auto px-4 pb-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Contenido Principal */}
                    <div className="lg:col-span-2">
                        {/* Paso 1: Selección de Vehículo */}
                        {currentStep === 2 && (
                            <div className="card bg-base-100 shadow-xl">
                                <div className="card-body">
                                    <h2 className="card-title text-2xl mb-6">
                                        <Car className="h-6 w-6 text-primary" />
                                        Selecciona tu Vehículo
                                    </h2>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {cars.map((car) => {
                                            const isSelected = bookingData.car?.id === car.id
                                            return (
                                                <div
                                                    key={car.id}
                                                    className={`card bg-base-200 cursor-pointer transition-all hover:shadow-md ${isSelected ? "ring-2 ring-primary bg-primary/10" : ""}`}
                                                    onClick={() => handlecarSelect(car)}
                                                >
                                                    <div className="card-body p-4">
                                                        <div className="flex items-center gap-3">
                                                            <input type="radio" className="radio radio-primary" checked={isSelected} readOnly />
                                                            <div className="flex-1">
                                                                <h3 className="font-semibold">
                                                                    {car.marca} {car.model}
                                                                </h3>
                                                                <p className="text-sm text-base-content/70">
                                                                    • {car.color} • {car.type}
                                                                </p>
                                                                <div className="badge badge-outline mt-2">{car.patente}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>

                                    <div className="divider">O</div>

                                    <Link href="/perfil" className="btn btn-outline">
                                        <Car className="h-4 w-4 mr-2" />
                                        Agregar Nuevo Vehículo
                                    </Link>
                                </div>
                            </div>
                        )}
                        {/* Paso 2: Selección de Servicios */}
                        {currentStep === 1 && (
                            <div className="card bg-base-100 shadow-xl">
                                <div className="card-body">
                                    <h2 className="card-title text-2xl mb-6">
                                        <Wrench className="h-6 w-6 text-primary" />
                                        Selecciona los Servicios
                                    </h2>

                                    {loading ? (
                                        <div className="space-y-4">
                                            {[...Array(6)].map((_, i) => (
                                                <div key={i} className="skeleton h-20 w-full"></div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {services.map((service) => {
                                                const isSelected = bookingData.services.some((s) => s.id === service.id)
                                                return (
                                                    <div
                                                        key={service.id}
                                                        className={`card bg-base-200 cursor-pointer transition-all hover:shadow-md ${isSelected ? "ring-2 ring-primary bg-primary/10" : ""
                                                            }`}
                                                        onClick={() => handleServiceToggle(service)}
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
                                                                            <p className="text-sm text-base-content/70">{service.description}</p>
                                                                            <div className="flex items-center gap-4 mt-2">
                                                                                {/* <div className="badge badge-outline">{service.category}</div> */}
                                                                                <div className="flex items-center gap-1 text-sm">
                                                                                    <Clock className="h-4 w-4" />
                                                                                    {service.duration} min
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="text-lg font-bold">${service.precio.toLocaleString()}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}


                        {/* Paso 3: Selección de Fecha y Hora */}
                        {currentStep === 3 && (
                            <div className="card bg-base-100 shadow-xl">
                                <div className="card-body">
                                    <h2 className="card-title text-2xl mb-6">
                                        <CalendarIcon className="h-6 w-6 text-primary" />
                                        Selecciona Fecha y Hora
                                    </h2>

                                    {/* Calendario */}
                                    <div className="mb-6">
                                        <div className="bg-base-200 p-4 rounded-lg">
                                            <Calendar
                                                localizer={localizer}
                                                events={calendarEvents}
                                                startAccessor="start"
                                                endAccessor="end"
                                                style={{ height: 400 }}
                                                view={calendarView}
                                                // onView={setCalendarView}
                                                date={selectedDate}
                                                onNavigate={handleNavigate}
                                                onSelectSlot={({ start }) => handleDateSelect(start)}
                                                selectable
                                                dayPropGetter={(date) => {
                                                    const selectable = isSelectableDate(date as Date)
                                                    if (!selectable) {
                                                        return {
                                                            style: { opacity: 0.5, pointerEvents: 'none', backgroundColor: 'var(--fallback-b1, #f3f4f6)' },
                                                            className: 'rbc-day-out-of-range'
                                                        }
                                                    }
                                                    return {}
                                                }}
                                                messages={{
                                                    next: "Siguiente",
                                                    previous: "Anterior",
                                                    today: "Hoy",
                                                    month: "Mes",
                                                    week: "Semana",
                                                    day: "Día",
                                                    agenda: "Agenda",
                                                    date: "Fecha",
                                                    time: "Hora",
                                                    event: "Evento",
                                                    noEventsInRange: "No hay eventos en este rango",
                                                }}
                                                formats={{
                                                    monthHeaderFormat: "MMMM YYYY",
                                                    dayHeaderFormat: "dddd DD/MM",
                                                    dayRangeHeaderFormat: ({ start, end }) =>
                                                        `${moment(start).format("DD/MM")} - ${moment(end).format("DD/MM")}`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Horarios Disponibles */}
                                    {bookingData.date && (
                                        <div>
                                            <h3 className="text-lg font-semibold mb-4">
                                                Horarios disponibles para {moment(bookingData.date).format("dddd, DD [de] MMMM")}
                                            </h3>
                                            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                                                {slotsLoading && (
                                                    <div className="col-span-full flex items-center gap-2 text-sm text-base-content/70">
                                                        <span className="loading loading-spinner loading-sm" />
                                                        Cargando horarios...
                                                    </div>
                                                )}
                                                {!slotsLoading && availableSlots.length === 0 && (
                                                    <div className="col-span-full text-sm text-base-content/70">
                                                        No hay horarios disponibles para esta fecha.
                                                    </div>
                                                )}
                                                {!slotsLoading && availableSlots.map((slot) => (
                                                    <button
                                                        key={slot.id}
                                                        className={`btn btn-sm ${bookingData.timeSlot?.id === slot.id
                                                            ? "btn-primary"
                                                            : slot.available
                                                                ? "btn-outline"
                                                                : "btn-disabled"
                                                            }`}
                                                        onClick={() => handleTimeSlotSelect(slot)}
                                                        disabled={!slot.available}
                                                    >
                                                        {slot.time}
                                                    </button>
                                                ))}
                                            </div>
                                            {bookingData.totalDuration > 0 && (
                                                <div className="alert alert-info mt-4">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-5 w-5" />
                                                        <span>
                                                            Duración estimada: {Math.floor(bookingData.totalDuration / 60)}h{" "}
                                                            {bookingData.totalDuration % 60}min
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Paso 4: Confirmación */}
                        {currentStep === 4 && (
                            <div className="card bg-base-100 shadow-xl">
                                <div className="card-body">
                                    <h2 className="card-title text-2xl mb-6">
                                        <CheckCircle className="h-6 w-6 text-primary" />
                                        Confirmar Reserva
                                    </h2>

                                    <div className="space-y-6">
                                        {/* Resumen de Servicios */}
                                        <div>
                                            <h3 className="text-lg font-semibold mb-3">Servicios Seleccionados</h3>
                                            <div className="space-y-2">
                                                {bookingData.services.map((service) => (
                                                    <div key={service.id} className="flex justify-between items-center p-3 bg-base-200 rounded">
                                                        <div>
                                                            <span className="font-medium">{service.name}</span>
                                                            <span className="text-sm text-base-content/70 ml-2">({service.duration} min)</span>
                                                        </div>
                                                        <span className="font-semibold">${service.precio.toLocaleString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Resumen de Vehículo */}
                                        <div>
                                            <h3 className="text-lg font-semibold mb-3">Vehículo</h3>
                                            <div className="p-3 bg-base-200 rounded">
                                                <div className="flex items-center gap-3">
                                                    <Car className="h-5 w-5 text-primary" />
                                                    <div>
                                                        <span className="font-medium">
                                                            {bookingData.car?.marca} {bookingData.car?.model}
                                                        </span>
                                                        <div className="text-sm text-base-content/70">
                                                            • {bookingData.car?.color} •{" "}
                                                            {bookingData.car?.patente}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Resumen de Fecha y Hora */}
                                        <div>
                                            <h3 className="text-lg font-semibold mb-3">Fecha y Hora</h3>
                                            <div className="p-3 bg-base-200 rounded">
                                                <div className="flex items-center gap-3">
                                                    <CalendarIcon className="h-5 w-5 text-primary" />
                                                    <div>
                                                        <span className="font-medium">
                                                            {bookingData.date && moment(bookingData.date).format("dddd, DD [de] MMMM [de] YYYY")}
                                                        </span>
                                                        <div className="text-sm text-base-content/70">
                                                            Hora: {bookingData.timeSlot?.time} • Duración:{" "}
                                                            {Math.floor(bookingData.totalDuration / 60)}h {bookingData.totalDuration % 60}min
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Información de Contacto */}
                                        <div>
                                            <h3 className="text-lg font-semibold mb-3">Información de Contacto</h3>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-3 p-3 bg-base-200 rounded">
                                                    <MapPin className="h-5 w-5 text-primary" />
                                                    <span>Av. Libertador 1234, Buenos Aires</span>
                                                </div>
                                                <div className="flex items-center gap-3 p-3 bg-base-200 rounded">
                                                    <Phone className="h-5 w-5 text-primary" />
                                                    <span>+54 11 5555-1234</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar - Resumen */}
                    <div className="lg:col-span-1">
                        <div className="card bg-base-100 shadow-xl sticky top-24">
                            <div className="card-body">
                                <h3 className="card-title">Resumen del Turno</h3>

                                {/* Servicios */}
                                {bookingData.services.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="font-semibold text-sm">Servicios:</h4>
                                        {bookingData.services.map((service) => (
                                            <div key={service.id} className="flex justify-between text-sm">
                                                <span>{service.name}</span>
                                                <span>${service.precio.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Vehículo */}
                                {bookingData.car && (
                                    <div>
                                        <h4 className="font-semibold text-sm">Vehículo:</h4>
                                        <p className="text-sm">
                                            {bookingData.car.marca} {bookingData.car.model}
                                        </p>
                                    </div>
                                )}

                                {/* Fecha y Hora */}
                                {bookingData.date && bookingData.timeSlot && (
                                    <div>
                                        <h4 className="font-semibold text-sm">Fecha y Hora:</h4>
                                        <p className="text-sm">{moment(bookingData.date).format("DD/MM/YYYY")}</p>
                                        <p className="text-sm">{bookingData.timeSlot.time}</p>
                                    </div>
                                )}

                                {/* Total */}
                                {bookingData.totalPrice > 0 && (
                                    <>
                                        <div className="divider"></div>
                                        <div className="flex justify-between font-bold">
                                            <span>Total:</span>
                                            <span>${bookingData.totalPrice.toLocaleString()}</span>
                                        </div>
                                        <div className="text-sm text-base-content/70">
                                            Duración: {Math.floor(bookingData.totalDuration / 60)}h {bookingData.totalDuration % 60}min
                                        </div>
                                    </>
                                )}

                                {/* Botones de Navegación */}
                                <div className="card-actions justify-between mt-6">
                                    {currentStep > 1 && (
                                        <button className="btn btn-outline" onClick={() => setCurrentStep(currentStep - 1)}>
                                            <ChevronLeft className="h-4 w-4 mr-1" />
                                            Anterior
                                        </button>
                                    )}

                                    {currentStep < 4 ? (
                                        <button
                                            className="btn btn-primary ml-auto"
                                            onClick={() => setCurrentStep(currentStep + 1)}
                                            disabled={!canProceedToNextStep()}
                                        >
                                            Siguiente
                                            <ChevronRight className="h-4 w-4 ml-1" />
                                        </button>
                                    ) : (
                                        <button className="btn btn-primary ml-auto" onClick={handleConfirmBooking} disabled={loading}>
                                            {loading ? (
                                                <span className="loading loading-spinner loading-sm"></span>
                                            ) : (
                                                <>
                                                    <CreditCard className="h-4 w-4 mr-2" />
                                                    Confirmar Reserva
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}