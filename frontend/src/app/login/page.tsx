'use client'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import HeaderDefault from "../header"
import { useState } from "react"
import { useUserStore } from "../store/useUserStore"
import { useRouter } from "next/navigation"


export default function login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const router = useRouter();

    const handlerLogin = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            })
            if (!response.ok) {
                alert('Error al iniciar sesión');
                return;
            }
            const data = await response.json();
            localStorage.setItem('jwt', data.access_token);

            const { setUser } = useUserStore.getState()
            useUserStore.getState().login();
            setUser({ name: data.name, role: data.role })

            router.push('/');

        } catch (error) {
            alert('Error al iniciar sesión' + error);
        }
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

                        <button onClick={handlerLogin} className="w-full btn btn-neutral ">Iniciar Sesión</button>

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