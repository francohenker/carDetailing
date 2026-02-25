'use client'
import { Button } from "@/components/ui/button"
import { Car } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import ThemeToggleButton from "../components/ThemeToggle";
import { useUserStore } from "./store/useUserStore";
export default function HeaderDefault() {

    const handlerLogout = () => {
        if (typeof window !== "undefined") {
            localStorage.removeItem("jwt");
            useUserStore.getState().logout();
            window.location.href = "/";
        }
    }

    const handleLogin = () => {
        if (typeof window !== "undefined") {
            window.location.href = "/login";
        }
    }

    const { isAuthenticated } = useUserStore();
    const user = useUserStore((state) => state.user);
    const initial = user?.name?.charAt(0).toUpperCase() ?? '?';

    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        if (isAuthenticated && user?.role === 'supplier') {
            const fetchPendingCount = async () => {
                try {
                    const token = localStorage.getItem("jwt");
                    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/quotation/supplier/pending`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setPendingCount(Array.isArray(data) ? data.length : 0);
                    }
                } catch {
                    // silent
                }
            };
            fetchPendingCount();
            const interval = setInterval(fetchPendingCount, 30000);
            return () => clearInterval(interval);
        }
    }, [isAuthenticated, user?.role]);

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/0" >
            <div className="container flex h-16 items-center px-4" >

                <div className="flex items-center gap-2">
                    <Car className="h-6 w-6 text-red-600" />
                    <Link href="/" className="text-2xl font-bold text-base-content">CarDetailing</Link>
                </div>

                <nav className="text-base-content absolute left-1/2 transform -translate-x-1/2 hidden md:flex gap-6 items-center">
                    <Link href="/servicios" prefetch className="text-lg font-medium hover:text-red-600 transition-colors">
                        Servicios
                    </Link>
                    <Link href="/turno" prefetch className="text-lg font-medium hover:text-red-600 transition-colors">
                        Reservar Turno
                    </Link>
                    {/* <Link href="/admin/statistics" prefetch className="text-lg font-medium hover:text-red-600 transition-colors">
                        Estadisticas
                    </Link> */}
                </nav>

                <div className="ml-auto flex items-center gap-4 ">
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
                        // tabIndex={0}
                        className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow text-base-content">
                        {isAuthenticated ?
                            <>
                                {user?.role === 'admin' &&
                                    <li><a href="/admin" className="justify-between">Admin</a></li>
                                }
                                {user?.role === 'supplier' &&
                                    <li>
                                        <a href="/supplier" className="justify-between">
                                            Panel Proveedor
                                            {pendingCount > 0 && (
                                                <span className="badge badge-sm badge-error text-white">{pendingCount}</span>
                                            )}
                                        </a>
                                    </li>
                                }
                                {user?.role === 'trabajador' &&
                                    <li>
                                        <a href="/trabajador" className="justify-between">
                                            Panel Trabajador
                                        </a>
                                    </li>
                                }
                                <li><a href="/user/profile" className="justify-between">Perfil</a></li>
                                {/* <li><a href="/user/settings">Configuración</a></li> */}
                                <li><a href="#/logout" onClick={handlerLogout}>{'Cerrar sesión'}</a></li>
                            </> :
                            <li><a href="#/login" onClick={handleLogin}>{'Iniciar sesión'}</a></li>
                        }
                    </ul>

                </div>
            </div>

        </header>
    )
}