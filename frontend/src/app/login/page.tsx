'use client'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import HeaderDefault from "../header"
import { useState } from "react"

export default function login() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')

    const handlerLogin = async () => {
        try {
            const response = await fetch("http://localhost:4000/user/login", {
                // const response = await fetch(process.env.HOST_URL + "/user/login",{
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            })
            if(!response.ok){
                alert('Error al iniciar sesión');
                return;
            }
            const data = await response.json();
            localStorage.setItem('jwt', data.access_token);
            window.location.href = '/';
        } catch (error) {
            alert('Error al iniciar sesión');
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
                            <Label htmlFor="username">Nombre de usuario</Label>
                            <Input
                                onChange={(e) => setUsername(e.target.value)}
                                id="username"
                                placeholder="Ingresa tu nombre de usuario"
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