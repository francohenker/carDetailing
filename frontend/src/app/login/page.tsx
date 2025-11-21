'use client'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import HeaderDefault from "../header"
import { useState } from "react"
import { useUserStore } from "../store/useUserStore"
import { useRouter } from "next/navigation"
import Alert from "@/components/Alert"
import { toast } from "sonner"

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false)

    const handlerLogin = async () => {
        if (isLoading) return;

        setIsLoading(true);
        if (password.trim() === '' || email.trim() === '') {
            toast.error('Por favor completa todos los campos.');
            setIsLoading(false);
            return;
        }
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: email.toLowerCase(), password })
            })

            if (!response.ok) {
                // const errorData = await response.json().catch(() => ({ message: 'Error al iniciar sesión' }));
                toast.error('Credenciales inválidas');
                return;
            }

            const data = await response.json();
            localStorage.setItem('jwt', data.access_token);

            const { setUser } = useUserStore.getState()
            useUserStore.getState().login();
            setUser({ name: data.name, role: data.role })

            router.push('/');

        } catch (error) {
            console.error('Login error:', error);
            toast.error('Error al iniciar sesión. Por favor intenta nuevamente.');
        } finally {
            setIsLoading(false);
        }
    }

    const handleGoogleLogin = () => {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
        window.location.href = `${backendUrl}/auth/google`;
    }



    return (
        <div className="flex min-h-screen flex-col bg-base-100 bg"  >
            <HeaderDefault />

            <div className="flex items-center justify-center min-h-screen bg-base-100">
                <Card className="w-full max-w-md ">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-center">Iniciar Sesión</CardTitle>
                        <CardDescription className="text-center">
                            Ingresa tus credenciales para acceder
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* {error && <Alert type="error" message={error} />} */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Correo electrónico</Label>
                            <Input
                                onChange={(e) => setEmail(e.target.value)}
                                id="email"
                                placeholder="Ingresa tu correo electrónico"
                                required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <Input
                                onChange={(e) => setPassword(e.target.value)}
                                id="password"
                                type="password"
                                placeholder="Ingresa tu contraseña"
                                required />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">

                        <button
                            onClick={handlerLogin}
                            disabled={isLoading}
                            className="w-full btn btn-neutral"
                        >
                            {isLoading ? (
                                <span className="loading loading-spinner loading-sm"></span>
                            ) : (
                                'Iniciar Sesión'
                            )}
                        </button>

                        <div className="divider text-sm text-base-content/50">O continúa con</div>

                        <button
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                            className="w-full btn btn-outline gap-2"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Continuar con Google
                        </button>

                        <button className="w-full btn btn-ghost">Olvide mi contraseña</button>
                        <span className="text-center text-sm text-base-content/70">
                            ¿No tienes una cuenta? <a href="/register" className="text-red-500">Registrate</a>
                        </span>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}