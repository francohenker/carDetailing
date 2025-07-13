import HeaderDefault from "../header";
import RootLayout from "../layout";
import Link from "next/link"
import { Car, CheckCircle, Clock, Droplets, Shield, Sparkles, Star, Wrench } from "lucide-react"

const services = [
    {
        id: 1,
        name: "Lavado Básico",
        description: "Lavado exterior completo con productos de calidad premium",
        price: 2500,
        duration: "45 min",
        category: "Básico",
        image: "/placeholder.svg?height=300&width=400",
        features: [
            "Lavado exterior con espuma activa",
            "Enjuague a presión",
            "Secado con toallas de microfibra",
            "Limpieza de llantas",
            "Aspirado básico interior",
        ],
        popular: false,
    },
    {
        id: 2,
        name: "Lavado Premium",
        description: "Servicio completo interior y exterior con acabado profesional",
        price: 3800,
        duration: "90 min",
        category: "Premium",
        image: "/placeholder.svg?height=300&width=400",
        features: [
            "Todo lo del lavado básico",
            "Limpieza profunda del interior",
            "Tratamiento de plásticos",
            "Limpieza de cristales interior/exterior",
            "Aromatización del habitáculo",
            "Protección de neumáticos",
        ],
        popular: true,
    },
    {
        id: 3,
        name: "Detailing Completo",
        description: "Restauración y protección integral de tu vehículo",
        price: 7500,
        duration: "3-4 horas",
        category: "Profesional",
        image: "/placeholder.svg?height=300&width=400",
        features: [
            "Lavado premium incluido",
            "Pulido de carrocería",
            "Eliminación de rayones menores",
            "Encerado de protección",
            "Tratamiento de cuero y vinilo",
            "Restauración de faros",
            "Limpieza del motor",
        ],
        popular: false,
    },
    {
        id: 4,
        name: "Pulido y Encerado",
        description: "Restaura el brillo original y protege la pintura",
        price: 5200,
        duration: "2-3 horas",
        category: "Especializado",
        image: "/placeholder.svg?height=300&width=400",
        features: [
            "Evaluación del estado de la pintura",
            "Pulido profesional multi-etapa",
            "Eliminación de micro-rayones",
            "Aplicación de cera premium",
            "Protección UV",
            "Acabado espejo",
        ],
        popular: false,
    },
    {
        id: 5,
        name: "Tratamiento Cerámico",
        description: "Máxima protección con nanotecnología cerámica",
        price: 12000,
        duration: "6-8 horas",
        category: "Premium",
        image: "/placeholder.svg?height=300&width=400",
        features: [
            "Preparación completa de la superficie",
            "Descontaminación química",
            "Pulido de corrección",
            "Aplicación de coating cerámico",
            "Protección por 2-3 años",
            "Efecto hidrofóbico",
            "Resistencia a rayones",
        ],
        popular: false,
    },
    {
        id: 6,
        name: "Limpieza de Tapicería",
        description: "Limpieza profunda y sanitización del interior",
        price: 4200,
        duration: "2 horas",
        category: "Especializado",
        image: "/placeholder.svg?height=300&width=400",
        features: [
            "Aspirado profundo",
            "Limpieza con vapor",
            "Tratamiento de manchas",
            "Desinfección y sanitización",
            "Eliminación de olores",
            "Protección de tejidos",
        ],
        popular: false,
    },
]

const categories = ["Todos", "Básico", "Premium", "Profesional", "Especializado"]

export default function Servicios() {
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
                            tratamientos cerámicos de última generación.
                        </p>
                        <Link href="#servicios" className="btn btn-accent btn-lg">
                            Ver Servicios
                        </Link>
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
            <div className="container mx-auto px-4 mb-8">
                <div className="flex flex-wrap justify-center gap-2">
                    {categories.map((category) => (
                        <button key={category} className="btn btn-outline btn-sm">
                            {category}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid de Servicios */}
            <section id="servicios" className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map((service) => (
                        <div key={service.id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                            {service.popular && (
                                <div className="badge badge-secondary absolute top-4 right-4 z-10">
                                    <Star className="w-3 h-3 mr-1" />
                                    Popular
                                </div>
                            )}

                            <figure className="relative">
                                <img
                                    src={service.image || "/placeholder.svg"}
                                    alt={service.name}
                                    className="w-full h-48 object-cover"
                                />
                                <div className="badge badge-primary absolute bottom-4 left-4">{service.category}</div>
                            </figure>

                            <div className="card-body">
                                <h2 className="card-title">
                                    {service.name}
                                    <div className="badge badge-outline">${service.price.toLocaleString()}</div>
                                </h2>

                                <p className="text-base-content/70 text-sm mb-4">{service.description}</p>

                                <div className="flex items-center gap-2 mb-4">
                                    <Clock className="w-4 h-4 text-primary" />
                                    <span className="text-sm">Duración: {service.duration}</span>
                                </div>

                                <div className="space-y-2 mb-4">
                                    <h4 className="font-semibold text-sm">Incluye:</h4>
                                    <ul className="space-y-1">
                                        {service.features.slice(0, 3).map((feature, index) => (
                                            <li key={index} className="flex items-start gap-2 text-xs">
                                                <CheckCircle className="w-3 h-3 text-success mt-0.5 flex-shrink-0" />
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                        {service.features.length > 3 && (
                                            <li className="text-xs text-primary">+{service.features.length - 3} servicios más</li>
                                        )}
                                    </ul>
                                </div>

                                <div className="card-actions justify-between items-center">
                                    <button className="btn btn-ghost btn-sm">Ver Detalles</button>
                                    <button className="btn btn-primary btn-sm">Reservar Turno</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Sección de Beneficios */}
            <section className="bg-base-200 py-16">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4">¿Por qué elegir DetailCar?</h2>
                        <p className="text-base-content/70 max-w-2xl mx-auto">
                            Somos especialistas en detailing automotriz con más de 10 años de experiencia y los mejores productos del
                            mercado.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

                        <div className="card bg-base-100 shadow-lg">
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
            <section className="container mx-auto px-4 py-16">
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
                                Los tiempos varían según el servicio: desde 45 minutos para un lavado básico hasta 8 horas para un
                                tratamiento cerámico completo. Cada servicio tiene su duración estimada especificada.
                            </p>
                        </div>
                    </div>

                    <div className="collapse collapse-plus bg-base-200 mb-2">
                        <input type="radio" name="my-accordion-3" />
                        <div className="collapse-title text-xl font-medium">¿Qué productos utilizan?</div>
                        <div className="collapse-content">
                            <p>
                                Trabajamos exclusivamente con productos premium de marcas reconocidas internacionalmente como Chemical
                                Guys, Meguiar's, y Gtechniq. Todos nuestros productos son biodegradables y seguros.
                            </p>
                        </div>
                    </div>

                    <div className="collapse collapse-plus bg-base-200 mb-2">
                        <input type="radio" name="my-accordion-3" />
                        <div className="collapse-title text-xl font-medium">¿Ofrecen garantía en sus servicios?</div>
                        <div className="collapse-content">
                            <p>
                                Sí, todos nuestros servicios incluyen garantía. Los tratamientos cerámicos tienen garantía de 2-3 años,
                                mientras que otros servicios tienen garantía de satisfacción de 30 días.
                            </p>
                        </div>
                    </div>

                    <div className="collapse collapse-plus bg-base-200 mb-2">
                        <input type="radio" name="my-accordion-3" />
                        <div className="collapse-title text-xl font-medium">¿Puedo esperar mientras trabajan en mi auto?</div>
                        <div className="collapse-content">
                            <p>
                                Por supuesto. Contamos con una sala de espera cómoda con WiFi, café y revistas. Para servicios más
                                largos, también ofrecemos servicio de traslado gratuito en un radio de 10km.
                            </p>
                        </div>
                    </div>

                    <div className="collapse collapse-plus bg-base-200">
                        <input type="radio" name="my-accordion-3" />
                        <div className="collapse-title text-xl font-medium">¿Trabajan con todos los tipos de vehículos?</div>
                        <div className="collapse-content">
                            <p>
                                Sí, trabajamos con todo tipo de vehículos: autos, camionetas, SUVs, motos y vehículos comerciales.
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
                        <Link
                            href="/perfil"
                            className="btn btn-outline btn-lg text-primary-content border-primary-content hover:bg-primary-content hover:text-primary"
                        >
                            Ver Mi Perfil
                        </Link>
                    </div>
                </div>
            </section>


            {/* <RootLayout /> */}


        </div>
    )
}