"use client";
import HeaderDefault from "../header";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
// Reemplazado moment.js con Intl API nativa
import { Calendar22 } from "@/components/ui/calendar22";
import { TimeSlotSelector } from "@/components/ui/timeslot-selector";
import { toast } from "sonner";
import { DateWeatherWidget } from "@/components/DateWeatherWidget";
import ServiceSearch from "@/components/ServiceSearch";
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
  Settings,
} from "lucide-react";

// Utilidades de fecha nativas
const formatDate = (
  date: Date,
  options: Intl.DateTimeFormatOptions = {},
): string => {
  return new Intl.DateTimeFormat("es-ES", options).format(date);
};

const formatTime = (date: Date): string => {
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
};

const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

const startOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const endOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

// Tipos de datos
interface Precio {
  id?: number;
  tipoVehiculo: "AUTO" | "CAMIONETA";
  precio: number;
}

interface Service {
  id: string;
  name: string;
  description: string;
  precio?: Precio[];
  duration: number; // en minutos
}

interface car {
  id: string;
  marca: string;
  model: string;
  color: string;
  patente: string;
  type: string;
}

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
}

// No usamos eventos (react-big-calendar eliminado)

interface BookingData {
  services: Service[];
  car: car | null;
  date: Date | null;
  timeSlot: TimeSlot | null;
  totalPrice: number;
  totalDuration: number;
}

function TurnoPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Función para obtener fecha inicial desde query params
  const getInitialDate = (): Date => {
    const dateParam = searchParams.get("date");
    if (dateParam) {
      const paramDate = new Date(dateParam);
      if (!isNaN(paramDate.getTime())) {
        return paramDate;
      }
    }
    return new Date();
  };

  // Estados principales
  const [currentStep, setCurrentStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [cars, setcars] = useState<car[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para el calendario
  const [selectedDate, setSelectedDate] = useState<Date>(getInitialDate());

  // Estado del booking (inicializado con fecha del query param si existe)
  const [bookingData, setBookingData] = useState<BookingData>({
    services: [],
    car: null,
    date: getInitialDate(),
    timeSlot: null,
    totalPrice: 0,
    totalDuration: 0,
  });

  // Shadcn Calendar maneja su propia vista

  // Rango de fechas seleccionables: hoy hasta dentro de 2 meses (incluye fines de semana)
  const today = startOfDay(new Date());
  const maxSelectableDate = endOfDay(addMonths(new Date(), 2));

  const isSelectableDate = (date: Date): boolean => {
    const d = startOfDay(date);
    return d > today && d <= maxSelectableDate;
  };

  // Cargar servicios desde el backend
  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/services/getAll`,
        );
        const data = await response.json();

        // Asegurar que los precios sean números
        const servicesWithNumericPrices = data.map((service: Service) => ({
          ...service,
          precio: service.precio?.map((p) => ({
            ...p,
            precio: Number(p.precio),
          })),
        }));

        setServices(servicesWithNumericPrices);
      } catch (err) {
        setError("Error fetching services");
        console.error("Error fetching services:", err);
        toast.error("Error", {
          description: "No se pudieron cargar los servicios",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  // Cargar vehículos del usuario
  useEffect(() => {
    const fetchcars = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/car/get-cars-user`,
          {
            headers: {
              Type: "application/json",
              Authorization: `Bearer ${localStorage.getItem("jwt")}`,
            },
          },
        );
        const data = await response.json();
        setcars(data);
        if (data.statusCode === 401) {
          setError("Token expirado");
          setcars([]);
        }
      } catch (err) {
        const errorMessage = "Error fetching cars: " + err;
        setError(errorMessage);
        toast.error("Error", {
          description: "No se pudieron cargar los vehículos",
        });
      }
    };

    fetchcars();
  }, []);

  // Efecto para manejar fecha inicial desde query params
  useEffect(() => {
    const dateParam = searchParams.get("date");
    if (dateParam) {
      const paramDate = new Date(dateParam);
      if (!isNaN(paramDate.getTime())) {
        // Si la fecha es válida, saltar al paso 3
        setCurrentStep(3);
      }
    }
  }, [searchParams]);

  // Función fallback para generar slots básicos (se usa solo si falla el backend)
  const generateSlotsWithBooked = (
    date: Date,
    bookedTimes: Set<string>,
  ): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startHour = 8;
    const endHour = 19;
    const step = 60;
    for (let h = startHour; h < endHour; h++) {
      for (let m = 0; m < 60; m += step) {
        const timeDate = new Date(date);
        timeDate.setHours(h, m, 0, 0);
        const label = formatTime(timeDate);
        slots.push({
          id: label,
          time: label,
          available: !bookedTimes.has(label),
        });
      }
    }
    return slots;
  };

  // Obtener horarios disponibles considerando la duración de los servicios seleccionados
  const fetchAvailableSlots = async (date: Date): Promise<void> => {
    try {
      console.log("date: ", date)
      setSlotsLoading(true);

      // Obtener la duración total de los servicios seleccionados
      const totalDuration = bookingData.services.reduce(
        (sum, service) => sum + service.duration,
        0,
      );
      const duration = totalDuration > 0 ? totalDuration : 60; // Duración mínima de 60 minutos

      // Formatear la fecha para el backend (YYYY-MM-DD)
      const dateString = date.toISOString().split("T")[0];

      const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/turno/available-slots?date=${dateString}&duration=${duration}`;
      const resp = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
      });

      if (!resp.ok) {
        throw new Error(
          `No se pudieron obtener horarios disponibles (${resp.status})`,
        );
      }

      const data = await resp.json();

      // Convertir la respuesta del backend al formato esperado por el frontend
      const slots: TimeSlot[] = data.slots.map((slot: any) => ({
        id: slot.time,
        time: slot.time,
        available: slot.available,
      }));

      setAvailableSlots(slots);
    } catch (error) {
      console.error("Error obteniendo horarios:", error);
      // Si falla, generar slots básicos como fallback
      setAvailableSlots(generateSlotsWithBooked(date, new Set()));
      setError(
        "No se pudieron cargar los horarios del día, mostrando disponibilidad general",
      );
    } finally {
      setSlotsLoading(false);
    }
  };

  // Función para calcular el precio según tipo de vehículo
  const getPriceForCarType = (service: Service, carType: string): number => {
    const type = carType.toUpperCase();
    const precio = service.precio?.find((p) => p.tipoVehiculo === type);
    return precio ? Number(precio.precio) : 0;
  };

  // Limpiar todos los servicios seleccionados
  const handleClearAllServices = () => {
    const newBookingData = {
      ...bookingData,
      services: [],
      totalPrice: 0,
      totalDuration: 0,
      timeSlot: null, // Resetear el slot seleccionado
    };
    setBookingData(newBookingData);
  };

  // Manejar selección de servicios
  const handleServiceToggle = (service: Service) => {
    const isSelected = bookingData.services.some((s) => s.id === service.id);

    let updatedServices: Service[];
    if (isSelected) {
      updatedServices = bookingData.services.filter((s) => s.id !== service.id);
    } else {
      updatedServices = [...bookingData.services, service];
    }

    // Calcular precio total según el tipo de vehículo seleccionado
    const carType = bookingData.car?.type || "sedan";
    const totalPrice = updatedServices.reduce(
      (sum, s) => sum + getPriceForCarType(s, carType),
      0,
    );
    const totalDuration = updatedServices.reduce(
      (sum, s) => sum + s.duration,
      0,
    );

    const newBookingData = {
      ...bookingData,
      services: updatedServices,
      totalPrice,
      totalDuration,
      timeSlot: null, // Resetear el slot seleccionado porque cambió la duración
    };

    setBookingData(newBookingData);

    // Si hay una fecha seleccionada, recargar los horarios disponibles con la nueva duración
    if (bookingData.date) {
      // Pequeño delay para asegurar que el estado se actualice
      setTimeout(() => {
        // fetchAvailableSlots(bookingData.date!)
      }, 100);
    }
  };

  // Manejar selección de vehículo
  const handlecarSelect = (car: car) => {
    // Recalcular precios con el nuevo tipo de vehículo
    const totalPrice = bookingData.services.reduce(
      (sum, s) => sum + getPriceForCarType(s, car.type),
      0,
    );

    setBookingData({
      ...bookingData,
      car,
      totalPrice,
    });
  };

  // Manejar selección de fecha en el calendario
  const handleDateSelect = (date: Date) => {
    // Permitir SOLO hoy o fechas futuras hasta 2 meses
    if (!isSelectableDate(date)) {
      // Ignorar selección fuera de rango
      return;
    }
    setSelectedDate(date);
    setBookingData({
      ...bookingData,
      date,
      timeSlot: null,
    });
    setAvailableSlots([]);
    date.setHours(12, 0, 0, 0);
    // Cargar horarios disponibles desde el backend
    fetchAvailableSlots(date);
  };

  // Navegación manejada por selección en ShadCalendar

  // Manejar selección de horario
  const handleTimeSlotSelect = (slot: TimeSlot) => {
    if (!slot.available) return;

    // Combinar la fecha seleccionada con la hora del slot
    let combinedDateTime: Date | null = null;
    if (bookingData.date) {
      combinedDateTime = new Date(bookingData.date);
      const [hours, minutes] = slot.time.split(":").map(Number);
      combinedDateTime.setHours(hours, minutes, 0, 0);
    }

    setBookingData({
      ...bookingData,
      timeSlot: slot,
      date: combinedDateTime, // Actualizar la fecha con la hora incluida
    });
  };

  // Confirmar reserva
  const handleConfirmBooking = async (): Promise<void> => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const bookingPayload = {
        services: bookingData.services.map((s) => s.id),
        carId: bookingData.car?.id,
        date: bookingData.date, // Enviar el Date completo con fecha y hora
        totalPrice: bookingData.totalPrice,
        duration: bookingData.totalDuration,
        observacion: "",
      };
      //creacion del turno
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/turno/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("jwt")}`,
          },
          body: JSON.stringify(bookingPayload),
        },
      );
      if (res.status === 201) {
        toast.success("¡Turno reservado exitosamente!");
        setTimeout(() => {
          router.push("/user/profile");
        }, 2000);
      } else {
        toast.error(
          "Error al reservar el turno. Por favor, intenta nuevamente.",
        );
      }
    } catch {
      toast.error("Error al reservar el turno. Por favor, intenta nuevamente.");
    }
  };

  // Validar si se puede avanzar al siguiente paso
  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return bookingData.car !== null;
      case 2:
        return bookingData.services.length > 0;
      case 3:
        return bookingData.date !== null && bookingData.timeSlot !== null;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-base-100">
      {/* Header */}
      <div className="">
        <HeaderDefault />
        <main className="container mx-auto p-6">
          <div className="flex items-center gap-2 mb-6">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Volver</span>
            </Link>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Settings className="h-8 w-8 text-primary" />
              Reservar Turno
            </h1>
          </div>
        </main>
        {/* <h1 className="text-2xl font-bold">Reservar Turno</h1>
                <p className="text-gray-600">Seleccione el servicio y la fecha deseada.</p> */}
      </div>

      {/* Breadcrumb */}
      {/* <div className="container mx-auto px-4 py-4">
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
        </div> */}

      {/* Progress Steps */}
      <div className="container mx-auto px-4 mb-8">
        <ul className="steps steps-horizontal w-full">
          <li className={`step ${currentStep >= 1 ? "step-primary" : ""}`}>
            Vehículo
          </li>
          <li className={`step ${currentStep >= 2 ? "step-primary" : ""}`}>
            Servicios
          </li>
          <li className={`step ${currentStep >= 3 ? "step-primary" : ""}`}>
            Fecha y Hora
          </li>
          <li className={`step ${currentStep >= 4 ? "step-primary" : ""}`}>
            Confirmación
          </li>
        </ul>
      </div>

      <div className="container mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contenido Principal */}
          <div className="lg:col-span-2">
            {/* Paso 1: Selección de Vehículo */}
            <div>
              {error &&
                toast.error("error", {
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
                    {cars.length > 0 &&
                      cars.map((car) => {
                        const isSelected = bookingData.car?.id === car.id;
                        return (
                          <div
                            key={car.id}
                            className={`card bg-base-200 cursor-pointer transition-all hover:shadow-md ${isSelected ? "ring-2 ring-primary bg-primary/10" : ""}`}
                            onClick={() => handlecarSelect(car)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
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
                                <input
                                  type="radio"
                                  className="radio radio-primary"
                                  checked={isSelected}
                                  readOnly
                                />
                                <div className="flex-1">
                                  <h3 className="font-semibold">
                                    {car.marca} {car.model}
                                  </h3>
                                  <p className="text-sm text-base-content/70">
                                    • {car.color} • {car.type}
                                  </p>
                                  <div className="badge badge-outline mt-2">
                                    {car.patente}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  <div className="divider">O</div>
                  <Link href="/user/profile" className="btn btn-outline">
                    <Car className="h-4 w-4 mr-2" />
                    Agregar Nuevo Vehículo
                  </Link>

                  {error === "Token expirado" && (
                    <button
                      className="btn btn-neutral mb-4"
                      onClick={() => router.push("/login")}
                    >
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

                  {!bookingData.car && (
                    <div className="alert alert-info mb-6">
                      <span>
                        Selecciona primero tu vehículo para ver los precios
                        correspondientes
                      </span>
                    </div>
                  )}

                  <ServiceSearch
                    services={services}
                    selectedServices={bookingData.services}
                    onServiceToggle={handleServiceToggle}
                    onClearAll={handleClearAllServices}
                    carType={bookingData.car?.type || "sedan"}
                    loading={loading}
                  />
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

                  {/* Calendario + horarios */}
                  <div className="mb-6 space-y-4">
                    <div className="bg-base-200 rounded-lg p-4">
                      <Calendar22
                        //mode="single"
                        selected={selectedDate}
                        onSelect={(d) => d && handleDateSelect(d)}
                        fromDate={today}
                        toDate={maxSelectableDate}
                        captionLayout="dropdown"
                        showOutsideDays={false}
                        className=" w-full"
                        label="Fecha disponible"
                        placeholder="Selecciona fecha para tu turno"
                        formatters={{
                          formatWeekdayName: (date: Date) =>
                            date.toLocaleString("es-AR", {
                              weekday: "short",
                            }),
                        }}
                      />
                    </div>

                    {/* Selector de horarios */}
                    <div className="bg-base-200 rounded-lg p-4">
                      <TimeSlotSelector
                        selectedSlot={bookingData.timeSlot}
                        onSelect={handleTimeSlotSelect}
                        availableSlots={availableSlots}
                        isLoading={slotsLoading}
                        hasDate={!!bookingData.date}
                        label="Horario disponible"
                        placeholder="Elige tu horario preferido"
                        className="w-full"
                      />
                    </div>
                    {bookingData.totalDuration > 0 && (
                      <div className="alert alert-info mt-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-5 w-5" />
                          <span>
                            Duración estimada:{" "}
                            {Math.floor(bookingData.totalDuration / 60)}h{" "}
                            {bookingData.totalDuration % 60}min
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Widget del clima para la fecha seleccionada */}
                    {bookingData.date && (
                      <div className="mt-6">
                        <DateWeatherWidget date={bookingData.date} />
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
                      <h3 className="text-lg font-semibold mb-3">
                        Servicios Seleccionados
                      </h3>
                      <div className="space-y-2">
                        {bookingData.services.map((service) => {
                          const carType = bookingData.car?.type || "sedan";
                          const servicePrice = getPriceForCarType(
                            service,
                            carType,
                          );

                          return (
                            <div
                              key={service.id}
                              className="flex justify-between items-center p-3 bg-base-200 rounded"
                            >
                              <div>
                                <span className="font-medium">
                                  {service.name}
                                </span>
                                <span className="text-sm text-base-content/70 ml-2">
                                  ({service.duration} min)
                                </span>
                              </div>
                              <span className="font-semibold">
                                ${servicePrice.toLocaleString()}
                              </span>
                            </div>
                          );
                        })}
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
                      <h3 className="text-lg font-semibold mb-2">
                        Fecha y Hora
                      </h3>
                      <div className="p-2 bg-base-200 rounded">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-5 w-5 text-primary" />
                          <div>
                            <span className="font-medium">
                              {bookingData.date &&
                                formatDate(bookingData.date, {
                                  weekday: "long",
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                })}
                            </span>
                            <div className="text-sm text-base-content/70">
                              Hora:{" "}
                              {bookingData.date
                                ? formatTime(bookingData.date)
                                : ""}{" "}
                              • Duración:{" "}
                              {Math.floor(bookingData.totalDuration / 60)}h{" "}
                              {bookingData.totalDuration % 60}min
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Información de Contacto */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3">
                        Información de Contacto
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 p-3 bg-base-200 rounded">
                          <MapPin className="h-5 w-5 text-primary" />
                          <span>
                            Ruta Nacional 14 km 974, San Vicente, Misiones
                          </span>
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
                    {bookingData.services.map((service) => {
                      const carType = bookingData.car?.type || "sedan";
                      const servicePrice = getPriceForCarType(service, carType);
                      return (
                        <div
                          key={service.id}
                          className="flex justify-between text-sm"
                        >
                          <span>{service.name}</span>
                          <span>${servicePrice.toLocaleString()}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Fecha y Hora */}
                {bookingData.date && bookingData.timeSlot && (
                  <div>
                    <h4 className="font-semibold text-sm">Fecha y Hora:</h4>
                    <p className="text-sm">
                      {formatDate(bookingData.date, {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-sm">
                      {bookingData.date ? formatTime(bookingData.date) : ""}
                    </p>
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
                      Duración: {Math.floor(bookingData.totalDuration / 60)}h{" "}
                      {bookingData.totalDuration % 60}min
                    </div>
                  </>
                )}

                {/* Botones de Navegación */}
                <div className="card-actions justify-between mt-6">
                  {currentStep > 1 && (
                    <button
                      className="btn btn-outline"
                      onClick={() => setCurrentStep(currentStep - 1)}
                    >
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
                    <button
                      className="btn btn-primary ml-auto"
                      onClick={handleConfirmBooking}
                      disabled={loading}
                    >
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
  );
}

export default function TurnoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-base-100 flex items-center justify-center">
          <div className="text-center">
            <span className="loading loading-spinner loading-lg"></span>
            <p className="mt-4 text-muted-foreground">Cargando...</p>
          </div>
        </div>
      }
    >
      <TurnoPageContent />
    </Suspense>
  );
}
