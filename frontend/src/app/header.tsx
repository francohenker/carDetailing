'use client'
import { Button } from "@/components/ui/button"
import { Car } from "lucide-react"
import Link from "next/link"
import ThemeToggleButton from "./ThemeToggle";
import { removeItem } from "framer-motion";
import { useRouter } from "next/navigation";
import { useUserStore } from "./store/useUserStore";

export default function HeaderDefault() {

    const handlerLogout = () => {
        if (typeof window !== "undefined") {
            localStorage.removeItem("jwt");
            window.location.href = "/";
        }
    }

    const user = useUserStore((state) => state.user)
    const initial = user?.name?.charAt(0).toUpperCase() ?? '?'

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/0" >
            <div className="container flex h-16 items-center px-4" >

                <div className="flex items-center gap-2">
                    <Car className="h-6 w-6 text-red-600" />
                    <a href="/" className="text-2xl font-bold text-base-content">CarDetailing</a>
                </div>

                <nav className="text-base-content absolute left-1/2 transform -translate-x-1/2 hidden md:flex gap-6 items-center">
                    {/* <Link href="/" className="text-sm font-medium hover:text-red-600 transition-colors">
                            Inicio
                        </Link> */}
                    <Link href="/servicios" className="text-lg font-medium hover:text-red-600 transition-colors">
                        Servicios
                    </Link>
                    <Link href="/turno" className="text-lg font-medium hover:text-red-600 transition-colors">
                        Reservar Turno
                    </Link>
                    <Link href="#contacto" className="text-lg font-medium hover:text-red-600 transition-colors">
                        Contacto
                    </Link>
                </nav>

                <div className="ml-auto flex items-center gap-4 ">

                    {/* <button className="btn btn-soft">Iniciar Sesión</button> */}

                    <Button variant="outline" size="icon" className="md:hidden">
                        <span className="sr-only">Menú</span>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </Button>
                </div>

                <ThemeToggleButton />
                <div className="dropdown dropdown-end px-2 ">
                    <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
                        <div className="text-neutral-content w-14 rounded-full bg-base-content">
                            <span className="text-2xl text-base-100">{initial}</span>
                        </div>
                    </div>
                    <ul
                        tabIndex={0}
                        className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow text-base-content">
                        <li>
                            <a href='/user/profile' className="justify-between">
                                Perfil
                                {/* <span className="badge">New</span> */}
                            </a>
                        </li>
                        <li><a href="/user/settings">Configuración</a></li>
                        <li><a onClick={handlerLogout}>Cerrar sesión</a></li>
                    </ul>
                </div>
            </div>

        </header>
    )
}