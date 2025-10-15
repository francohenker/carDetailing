'use client'
import HeaderDefault from "./header"
import { CalendarDays, Car, Shield, Sparkles } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar as ShadCalendar } from "@/components/ui/calendar"
import FooterDefault from "./footer"
import { WeatherWidget } from "@/components/weatherDisplay"
// import MyCalendar from "@/components/calendar"
// import { CalendarDemo } from "@/components/Calendar2"
import { useRouter } from "next/navigation"
import { useState } from "react"




export default function Home() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  
  // Función para manejar la selección de fecha
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date) {
      // Redirigir a la página de turnos con la fecha seleccionada
      // router.push(`/turno?date=${date.toISOString().split('T')[0]}`)
    }
  }

  return (

    <div className="flex min-h-screen flex-col bg-base-300"  >

      {/* Header */}
      <HeaderDefault />

      {/* Main Content */}

      <main className=" flex-1" >
        {/* Hero Section */}
        <section className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/90 to-blue-800/90 z-10" />
          <div
            className="h-[500px] bg-cover bg-center"
          />
          <div className="container absolute inset-0 z-20 flex flex-col items-center justify-center text-center text-white">
            
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Detailing Profesional para tu Vehículo
            </h1>
            <p className="mt-6 max-w-md text-lg ">
              Reserva tu turno en línea y disfruta del mejor servicio de lavado y detailing para tu auto.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <button className="btn btn-soft" onClick={() => router.push('/turno')}>
                Reservar Ahora
              </button>
              <button className="btn btn-soft" onClick={() => router.push('/servicios')}>
                Ver Servicios
              </button>
            </div>
          </div>
        </section>

        {/* Reserva de Turnos */}
        <section id="reservar" className="py-16 btn-soft">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-base-content">Reserva tu Turno</h2>
              <p className="mt-4 max-w-md mx-auto text-base-content">
                Selecciona el día y hora que prefieras para darle a tu vehículo el cuidado que merece.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center">
                    <CalendarDays className="mr-2 h-5 w-5 text-red-600" />
                    Selecciona Fecha
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Elige el día que prefieras para tu servicio de detailing.
                  </p>
                  
                  <ShadCalendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    fromDate={new Date()}
                    toDate={new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)} // 60 días desde hoy
                    captionLayout="dropdown"
                    showOutsideDays={false}
                    className="rounded-md border shadow"
                    formatters={{
                      formatWeekdayName: (date: Date) =>
                        date.toLocaleString("es-AR", { weekday: "short" }),
                    }}
                  />
                </CardContent>
              </Card>

              <Card>
                  <WeatherWidget />
                  {/* <WeatherDisplay latitude={-27.0005} longitude={-54.4816} /> */}

{/* 
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center">
                    <Clock className="mr-2 h-5 w-5 text-red-600" />
                    Horario Disponible
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Selecciona el horario que mejor se adapte a tu agenda.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" className="justify-start">
                      09:00
                    </Button>
                    <Button variant="outline" className="justify-start">
                      10:30
                    </Button>
                    <Button variant="outline" className="justify-start">
                      12:00
                    </Button>
                    <Button variant="outline" className="justify-start">
                      14:30
                    </Button>
                    <Button variant="outline" className="justify-start">
                      16:00
                    </Button>
                    <Button variant="outline" className="justify-start">
                      17:30
                    </Button>
                  </div>
                  <Button className="w-full mt-4">Confirmar Reserva</Button>
                </CardContent> */}
              </Card>
            </div>
          </div>
        </section>

        {/* Servicios */}
        <section id="servicios" className="py-16">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-base-content">Nuestros Servicios</h2>
              <p className="mt-4 max-w-md mx-auto text-base-content">
                Ofrecemos una amplia gama de servicios de detailing para mantener tu vehículo en perfectas condiciones.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                    <Sparkles className="h-6 w-6 text-red-600" />
                  </div>
                  <CardTitle>Lavado Premium</CardTitle>
                  <CardDescription>Lavado exterior e interior completo con productos de alta calidad.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <svg
                        className="mr-2 h-4 w-4 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Lavado exterior
                    </li>
                    <li className="flex items-start">
                      <svg
                        className="mr-2 h-4 w-4 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Limpieza de llantas y neumáticos
                    </li>
                    <li className="flex items-start">
                      <svg
                        className="mr-2 h-4 w-4 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Aspirado y limpieza interior completa
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-red-600" />
                  </div>
                  <CardTitle>Detailing Completo</CardTitle>
                  <CardDescription>Tratamiento integral para restaurar y proteger tu vehículo.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <svg
                        className="mr-2 h-4 w-4 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Pulido de carrocería y eliminación de rayones
                    </li>
                    <li className="flex items-start">
                      <svg
                        className="mr-2 h-4 w-4 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Tratamiento cerámico de protección
                    </li>
                    <li className="flex items-start">
                      <svg
                        className="mr-2 h-4 w-4 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Limpieza profunda de tapicería y cuero
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                    <Car className="h-6 w-6 text-red-600" />
                  </div>
                  <CardTitle>Tratamientos Especiales</CardTitle>
                  <CardDescription>Servicios específicos para necesidades particulares.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <svg
                        className="mr-2 h-4 w-4 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Restauración de faros
                    </li>
                    <li className="flex items-start">
                      <svg
                        className="mr-2 h-4 w-4 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Tratamiento de cuero y vinilo
                    </li>
                    <li className="flex items-start">
                      <svg
                        className="mr-2 h-4 w-4 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Eliminación de olores y sanitización
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Testimonios */}

      </main>

      {/* Footer */}
      <FooterDefault />
    </div>
  )
}
