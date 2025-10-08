'use client'
import HeaderDefault from "../header";
import Link from "next/link"
import { Clock, Droplets, Shield, Sparkles, Star, Wrench } from "lucide-react"
import Name from "@/components/Name";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Precio {
    id?: number;
    tipoVehiculo: 'AUTO' | 'CAMIONETA';
    precio: number;
}

interface Service {
    id: number;
    name: string;
    description: string;
    precio?: Precio[];
    duration: string;
}


// const categories = ["Todos", "Básico", "Premium", "Profesional", "Especializado"]

export default function Servicios() {
    const router = useRouter();
    const [services, setServices] = useState<Service[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/services/getAll`)
                
                if (!response.ok) {
                    throw new Error('Error al cargar servicios')
                }
                
                const data = await response.json()
                setServices(data)
            } catch (error) {
                console.error("Error fetching services:", error)
                setError('Error al cargar los servicios')
                setServices([]) // Fallback a array vacío
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen bg-base-100">
                <HeaderDefault />
                <div className="flex justify-center items-center min-h-[400px]">
                    <span className="loading loading-spinner loading-lg"></span>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-base-100">
                <HeaderDefault />
                <div className="alert alert-error max-w-md mx-auto mt-8">
                    <span>{error}</span>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-base-100">
            <HeaderDefault />


            {/* Hero Section */}
            <div className="hero min-h-[400px] bg-gradient-to-r from-primary to-secondary">
                <div className="hero-overlay bg-opacity-60"></div>
                <div className="hero-content text-center text-neutral-content">
                    <div className="max-w-md">
                        <h1 className="mb-5 text-5xl font-bold">Nuestros Servicios</h1>
                        <p className="mb-5 text-lg">
                            Descubre nuestra amplia gama de servicios de detailing profesional. Desde lavados básicos hasta
                            tratamientos acrílicos de última generación.
                        </p>
                        {/* <Link href="#servicios" className="btn btn-accent btn-lg">
                            Ver Servicios
                        </Link> */}
                    </div>
                </div>
            </div>

            {/* Breadcrumb */}
            <div className="container mx-auto px-4 py-4">
                <div className="text-sm breadcrumbs">
                    <ul>
                        <li>
                            <Link href="/" className="link link-hover">
                                Inicio
                            </Link>
                        </li>
                        <li>Servicios</li>
                    </ul>
                </div>
            </div>

            {/* Filtros de Categorías */}
            {/* <div className="container mx-auto px-4 mb-8">
                <div className="flex flex-wrap justify-center gap-2">
                    {categories.map((category) => (
                        <button key={category} className="btn btn-outline btn-sm">
                            {category}
                        </button>
                    ))}
                </div>
            </div> */}

            {/* Grid de Servicios */}
            <section id="servicios" className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map((service) => (
                        <div key={service.id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow ">
                            {/* {service.popular && (
                                <div className="badge badge-secondary absolute top-4 right-4 z-10">
                                    <Star className="w-3 h-3 mr-1" />
                                    Popular
                                </div>
                            )} */}

                            <div className="card-body text-base-content">
                                <h2 className="card-title">
                                    {service.name}
                                </h2>

                                <p className="text-sm mb-4">{service.description}</p>

                                <div className="flex items-center gap-2 mb-4">
                                    <Clock className="w-4 h-4 text-primary" />
                                    <span className="text-sm">Duración: {service.duration}</span>
                                </div>
                                
                                <div className="mb-4">
                                    <h4 className="font-semibold text-sm mb-2">Precios por tipo de vehículo:</h4>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        {[
                                            { tipo: 'AUTO', label: '🚗 Auto' },
                                            { tipo: 'CAMIONETA', label: '🚙 Camioneta' },
                                        ].map(({ tipo, label }) => {
                                            const precio = service.precio?.find(p => p.tipoVehiculo === tipo)
                                            return (
                                                <div key={tipo} className="flex justify-between p-2 bg-base-200 rounded">
                                                    <span>{label}:</span>
                                                    <span className="font-bold">${(precio?.precio || 0).toLocaleString()}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-2 mb-4">
                                    <h4 className="font-semibold text-sm">Incluye:</h4>
                                    <ul className="space-y-1">
                                        {/* {service.features.slice(0, 3).map((feature, index) => (
                                            <li key={index} className="flex items-start gap-2 text-xs">
                                                <CheckCircle className="w-3 h-3 text-success mt-0.5 flex-shrink-0" />
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                        {service.features.length > 3 && (
                                            <li className="text-xs text-primary">+{service.features.length - 3} servicios más</li>
                                        )} */}
                                    </ul>
                                </div>

                                <div className="card-actions justify-between items-center">
                                    <button className="btn btn-ghost btn-sm">Ver Detalles</button>
                                    <button className="btn btn-primary btn-sm" onClick={() => router.push('/turno')}>Reservar Turno</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Sección de Beneficios */}
            <section className="bg-base-200 py-16 text-base-content">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4">¿Por qué elegir <Name />?</h2>
                        <p className="max-w-2xl mx-auto">
                            Somos especialistas en detailing automotriz con más de 3 años de experiencia y los mejores productos del
                            mercado.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-base-content">
                        <div className="card bg-base-100 shadow-lg">
                            <div className="card-body items-center text-center">
                                <div className="avatar placeholder mb-4">
                                    <div className="bg-primary text-primary-content rounded-full w-16">
                                        <Sparkles className="w-8 h-8" />
                                    </div>
                                </div>
                                <h3 className="card-title text-lg">Productos Premium</h3>
                                <p className="text-sm text-center">Utilizamos solo productos de las mejores marcas internacionales</p>
                            </div>
                        </div>

                        <div className="card bg-base-100 shadow-lg ">
                            <div className="card-body items-center text-center">
                                <div className="avatar placeholder mb-4">
                                    <div className="bg-secondary text-secondary-content rounded-full w-16">
                                        <Shield className="w-8 h-8" />
                                    </div>
                                </div>
                                <h3 className="card-title text-lg">Garantía Total</h3>
                                <p className="text-sm text-center">Garantizamos la calidad de todos nuestros servicios</p>
                            </div>
                        </div>

                        <div className="card bg-base-100 shadow-lg">
                            <div className="card-body items-center text-center">
                                <div className="avatar placeholder mb-4">
                                    <div className="bg-accent text-accent-content rounded-full w-16">
                                        <Wrench className="w-8 h-8" />
                                    </div>
                                </div>
                                <h3 className="card-title text-lg">Profesionales</h3>
                                <p className="text-sm text-center">Equipo certificado con amplia experiencia en detailing</p>
                            </div>
                        </div>

                        <div className="card bg-base-100 shadow-lg">
                            <div className="card-body items-center text-center">
                                <div className="avatar placeholder mb-4">
                                    <div className="bg-info text-info-content rounded-full w-16">
                                        <Droplets className="w-8 h-8" />
                                    </div>
                                </div>
                                <h3 className="card-title text-lg">Eco-Friendly</h3>
                                <p className="text-sm text-center">Productos biodegradables y procesos sustentables</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Sección de Preguntas Frecuentes */}
            <section className="container mx-auto px-4 py-16 text-base-content">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold mb-4">Preguntas Frecuentes</h2>
                    <p className="text-base-content/70">Resolvemos las dudas más comunes sobre nuestros servicios</p>
                </div>

                <div className="max-w-3xl mx-auto">
                    <div className="collapse collapse-plus bg-base-200 mb-2">
                        <input type="radio" name="my-accordion-3" defaultChecked />
                        <div className="collapse-title text-xl font-medium">¿Cuánto tiempo toma cada servicio?</div>
                        <div className="collapse-content">
                            <p>
                                Los tiempos varían según el servicio: desde 45 minutos para un lavado básico hasta 2 días para un
                                tratamiento acrílico completo. Cada servicio tiene su duración estimada especificada.
                            </p>
                        </div>
                    </div>

                    <div className="collapse collapse-plus bg-base-200 mb-2">
                        <input type="radio" name="my-accordion-3" />
                        <div className="collapse-title text-xl font-medium">¿Qué productos utilizan?</div>
                        <div className="collapse-content">
                            <p>
                                Trabajamos exclusivamente con productos premium de marcas reconocidas internacionalmente como sonax
                            </p>
                        </div>
                    </div>

                    <div className="collapse collapse-plus bg-base-200 mb-2">
                        <input type="radio" name="my-accordion-3" />
                        <div className="collapse-title text-xl font-medium">¿Ofrecen garantía en sus servicios?</div>
                        <div className="collapse-content">
                            <p>
                                Sí, todos nuestros servicios incluyen garantía. Los tratamientos acrílicos tienen garantía de 6-8 meses,
                                mientras que otros servicios tienen garantía de satisfacción de 30 días.
                            </p>
                        </div>
                    </div>

                    {/* <div className="collapse collapse-plus bg-base-200 mb-2">
                        <input type="radio" name="my-accordion-3" />
                        <div className="collapse-title text-xl font-medium">¿Puedo esperar mientras trabajan en mi auto?</div>
                        <div className="collapse-content">
                            <p>
                                Por supuesto. Contamos con una sala de espera cómoda con WiFi, café y revistas. Para servicios más
                                largos, también ofrecemos servicio de traslado gratuito en un radio de 10km.
                            </p>
                        </div>
                    </div> */}

                    <div className="collapse collapse-plus bg-base-200">
                        <input type="radio" name="my-accordion-3" />
                        <div className="collapse-title text-xl font-medium">¿Trabajan con todos los tipos de vehículos?</div>
                        <div className="collapse-content">
                            <p>
                                Sí, trabajamos con todo tipo de vehículos: autos, camionetas, motos y vehículos comerciales.
                                Adaptamos nuestros servicios según las necesidades específicas de cada vehículo.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Call to Action */}
            <section className="bg-primary py-16">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold text-primary-content mb-4">
                        ¿Listo para darle a tu auto el cuidado que merece?
                    </h2>
                    <p className="text-primary-content/80 mb-8 max-w-2xl mx-auto">
                        Reserva tu turno ahora y experimenta la diferencia de un servicio profesional de detailing.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/" className="btn btn-accent btn-lg">
                            Reservar Turno
                        </Link>
                        {/* <Link
                            href="/perfil"
                            className="btn btn-outline btn-lg text-primary-content border-primary-content hover:bg-primary-content hover:text-primary"
                        >
                            Ver Mi Perfil
                        </Link> */}
                    </div>
                </div>
            </section>


            {/* <RootLayout /> */}


        </div>
    )
}