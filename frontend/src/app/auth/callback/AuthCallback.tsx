'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useUserStore } from '@/app/store/useUserStore'

export default function AuthCallback() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const token = searchParams.get('token')
        const name = searchParams.get('name')
        const role = searchParams.get('role') as 'admin' | 'user'

        if (token && name && role) {
            // Store token in localStorage
            localStorage.setItem('jwt', token)

            // Update user store
            const { setUser, login } = useUserStore.getState()
            login()
            setUser({ name, role })

            // Redirect to home page
            router.push('/')
        } else {
            setError('Error al autenticar con Google. Por favor intenta nuevamente.')
            setTimeout(() => {
                router.push('/login')
            }, 3000)
        }
    }, [searchParams, router])

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-base-100">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-error mb-4">Error de Autenticación</h1>
                    <p className="text-base-content/70">{error}</p>
                    <p className="text-sm text-base-content/50 mt-2">Redirigiendo al login...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-base-100">
            <div className="text-center">
                <div className="loading loading-spinner loading-lg text-primary"></div>
                <p className="mt-4 text-base-content/70">Completando autenticación...</p>
            </div>
        </div>
    )
}
