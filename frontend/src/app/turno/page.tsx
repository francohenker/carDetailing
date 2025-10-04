"use client"
import HeaderDefault from "../header"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import moment from "moment"
import "moment/locale/es"
import { Calendar as ShadCalendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
    Car,
    ChevronLeft,
    ChevronRight,
    Clock,
    CreditCard,
    MapPin,
    Phone,
    CheckCircle,
    CalendarIcon,
    Wrench,
} from "lucide-react"


// Configurar moment en español
moment.locale("es")

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

// No usamos eventos (react-big-calendar eliminado)

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
    // Shadcn Calendar maneja su propia vista

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
                    toast.error("error", {
                        description: error,
                    })
                }
            }
        }

        fetchServices()
    }, [error])

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
                if (data.statusCode === 401) {
                    setError("Token expirado");
                    setcars([]);
                }
            } catch (error) {
                setError("Error fetching cars: " + error);
            } finally {
                if (error) {
                    toast.error("error", {
                        description: error,
                    })
                }
            }
        }

        fetchcars()
    }, [error])

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
        } catch (error) {
            console.error('Error obteniendo horarios:', error)
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

    // Navegación manejada por selección en ShadCalendar

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
            await new Promise((resolve) => setTimeout(resolve, 2000))
            const bookingPayload = {
                services: bookingData.services.map((s) => s.id),
                carId: bookingData.car?.id,
                date: bookingData.date?.toISOString(),
                time: bookingData.timeSlot?.time,
                totalPrice: bookingData.totalPrice,
                duration: bookingData.totalDuration,
                observacion: '',
            }
            //creacion del turno
            await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/turno/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                },
                body: JSON.stringify(bookingPayload),
            })


            console.log("Booking payload:", bookingPayload)

            // Mostrar mensaje de éxito y redirigir
            alert("¡Turno reservado exitosamente!")
            // router.push("/perfil")
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
                return bookingData.car !== null
            case 2:
                return bookingData.services.length > 0
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
                        <div>
                            {error && toast.error("error", {
                                description: error,
                            })}
                        </div>
                        {currentStep === 1 && (
                            <div className="card bg-base-100 shadow-xl">
                                <div className="card-body">
                                    <h2 className="card-title text-2xl mb-6">
                                        <Car className="h-6 w-6 text-primary" />
                                        Selecciona tu Vehículo
                                    </h2>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                        {cars.length > 0 && cars.map((car) => {
                                            const isSelected = bookingData.car?.id === car.id
                                            return (
                                                <div
                                                    key={car.id}
                                                    className={`card bg-base-200 cursor-pointer transition-all hover:shadow-md ${isSelected ? "ring-2 ring-primary bg-primary/10" : ""}`}
                                                    onClick={() => handlecarSelect(car)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault();
                                                            handlecarSelect(car);
                                                        }
                                                    }}
                                                    tabIndex={0}
                                                    role="button"
                                                    aria-label={`Seleccionar vehículo ${car.marca} ${car.model} ${car.patente}`}
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
                                    <Link href="/user/profile" className="btn btn-outline">
                                        <Car className="h-4 w-4 mr-2" />
                                        Agregar Nuevo Vehículo
                                    </Link>

                                    {error === "Token expirado" && (
                                        <button className="btn btn-neutral mb-4" onClick={() => router.push('/login')}>
                                            Login
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                        {/* Paso 2: Selección de Servicios */}
                        {currentStep === 2 && (
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
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' || e.key === ' ') {
                                                                e.preventDefault();
                                                                handleServiceToggle(service);
                                                            }
                                                        }}
                                                        tabIndex={0}
                                                        role="button"
                                                        aria-label={`${isSelected ? 'Deseleccionar' : 'Seleccionar'} servicio ${service.name} - $${service.precio.toLocaleString()}`}
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

                                    {/* Calendario + horarios (shadcn-style) */}
                                    <div className="mb-6">
                                        <div className="relative bg-base-200 rounded-lg p-0 md:pr-48">
                                            <div className="p-4">
                                                <ShadCalendar
                                                    mode="single"
                                                    selected={selectedDate}
                                                    onSelect={(d) => d && handleDateSelect(d)}
                                                    fromDate={today}
                                                    toDate={maxSelectableDate}
                                                    captionLayout="dropdown"
                                                    showOutsideDays={false}
                                                    className="bg-transparent p-0 rounded-md"
                                                    formatters={{
                                                        formatWeekdayName: (date: Date) =>
                                                            date.toLocaleString("es-AR", { weekday: "short" }),
                                                    }}
                                                />
                                            </div>
                                            {/* Sidebar de horarios */}
                                            <div className="no-scrollbar inset-y-0 right-0 flex max-h-72 w-full scroll-pb-6 flex-col gap-4 overflow-y-auto border-t p-4 md:absolute md:max-h-none md:w-48 md:border-t-0 md:border-l">
                                                <div className="grid gap-2">
                                                    {!bookingData.date && (
                                                        <div className="text-sm text-base-content/70">
                                                            Selecciona una fecha para ver horarios.
                                                        </div>
                                                    )}
                                                    {bookingData.date && slotsLoading && (
                                                        <div className="flex items-center gap-2 text-sm text-base-content/70">
                                                            <span className="loading loading-spinner loading-sm" />
                                                            Cargando horarios...
                                                        </div>
                                                    )}
                                                    {bookingData.date && !slotsLoading && availableSlots.length === 0 && (
                                                        <div className="text-sm text-base-content/70">
                                                            No hay horarios disponibles para esta fecha.
                                                        </div>
                                                    )}
                                                    {bookingData.date && !slotsLoading && availableSlots.map((slot) => (
                                                        <Button
                                                            key={slot.id}
                                                            variant={bookingData.timeSlot?.id === slot.id ? "default" : "outline"}
                                                            onClick={() => handleTimeSlotSelect(slot)}
                                                            disabled={!slot.available}
                                                            className="w-full shadow-none"
                                                        >
                                                            {slot.time}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>
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
                                                    <span>Ruta Nacional 14 km 974, San Vicente, Misiones</span>
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
                                {/* Vehículo */}
                                {bookingData.car && (
                                    <div>
                                        <h4 className="font-semibold text-sm">Vehículo:</h4>
                                        <p className="text-sm">
                                            {bookingData.car.marca} {bookingData.car.model}
                                        </p>
                                    </div>
                                )}

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