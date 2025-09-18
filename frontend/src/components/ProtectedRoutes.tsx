// components/ProtectedRoute.tsx
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/app/store/useUserStore'

interface ProtectedRouteProps {
    children: React.ReactNode
    allowedRoles?: ('admin' | 'user')[]
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const router = useRouter()
    const user = useUserStore((state) => state.user)
    const hasHydrated = useUserStore((state) => state.hasHydrated)


    useEffect(() => {
        if (!hasHydrated) return
        if (!user) {
            router.push('/login')
        } else if (allowedRoles && !allowedRoles.includes(user.role)) {
            router.push('/unauthorized') // pantalla de acceso denegado
        }
    }, [user, hasHydrated, router, allowedRoles])

    if (!hasHydrated) return <div className='flex items-center justify-center h-screen'><span className="loading loading-spinner w-32 h-32 "></span></div>
    if (!user) return null // Evita mostrar contenido antes de redirigir
    if (allowedRoles && !allowedRoles.includes(user.role)) return null

    return <>{children}</>
}
