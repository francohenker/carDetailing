import Link from "next/link"
import HeaderDefault from "./header"
import { CalendarDays, Car, Clock, MapPin, Phone, Shield, Sparkles, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import FooterDefault from "./footer"
import Head from "next/head"

export default function Home() {
  return (

    <div className="flex min-h-screen flex-col bg-base-100"  >

      {/* Header */}
      <HeaderDefault />

      {/* Main Content */}

      <main className=" flex-1" >
        {/* Hero Section */}
        <section className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/90 to-blue-800/90 z-10" />
          <div
            className="h-[500px] bg-cover bg-center"
            style={{ backgroundImage: "url('/placeholder.svg?height=500&width=1200')" }}
          />
          <div className="container absolute inset-0 z-20 flex flex-col items-center justify-center text-center text-white">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Detailing Profesional para tu Vehículo
            </h1>
            <p className="mt-6 max-w-md text-lg ">
              Reserva tu turno en línea y disfruta del mejor servicio de lavado y detailing para tu auto.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <button className="btn btn-soft">
                Reservar Ahora
              </button>
              <button className="btn btn-soft">
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

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
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
                  <div className="h-40 bg-gray-100 rounded-md flex items-center justify-center">
                    <p className="text-muted-foreground">Calendario de Disponibilidad</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center">
                    <Wrench className="mr-2 h-5 w-5 text-red-600" />
                    Elige Servicio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Selecciona el tipo de servicio que necesita tu vehículo.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b pb-2">
                      <span>Lavado Básico</span>
                      <span className="font-medium">$2,500</span>
                    </div>
                    <div className="flex items-center justify-between border-b pb-2">
                      <span>Lavado Premium</span>
                      <span className="font-medium">$3,800</span>
                    </div>
                    <div className="flex items-center justify-between border-b pb-2">
                      <span>Detailing Completo</span>
                      <span className="font-medium">$7,500</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Pulido y Encerado</span>
                      <span className="font-medium">$5,200</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
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
                </CardContent>
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
                      Lavado exterior con espuma activa
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
        <section className="py-16 btn-soft">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">Lo que dicen nuestros clientes</h2>
              <p className="mt-4 text-muted-foreground max-w-md mx-auto">
                La satisfacción de nuestros clientes es nuestra mejor carta de presentación.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gray-200" />
                    <div>
                      <p className="font-medium">Carlos Rodríguez</p>
                      <div className="flex text-yellow-400">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    "Excelente servicio. Mi auto quedó como nuevo después del detailing completo. Muy profesionales y
                    puntuales con la reserva."
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gray-200" />
                    <div>
                      <p className="font-medium">Laura Méndez</p>
                      <div className="flex text-yellow-400">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    "Me encantó poder reservar mi turno online. El sistema es muy fácil de usar y el servicio de
                    detailing fue impecable."
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gray-200" />
                    <div>
                      <p className="font-medium">Martín González</p>
                      <div className="flex text-yellow-400">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    "El tratamiento cerámico que le hicieron a mi auto es increíble. Repele el agua y la suciedad, y el
                    brillo es espectacular."
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <FooterDefault />
    </div>
  )
}
