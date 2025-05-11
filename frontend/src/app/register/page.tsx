'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import HeaderDefault from "../header"
import { useState } from "react"



export default function register() {
    const [success, setSuccess] = useState(false)

    const [formData, setFormData] = useState({
        username: "",
        password: "",
        email: "",
        telefono: "",
    })
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value })
    }

    const registerUser = async () => {
        try {
            const res = await fetch('http://localhost:4000/user/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            })
            if (res.status === 201) {
                alert('Usuario creado con éxito')
                window.location.href = '/login'
                // Podés redirigir o mostrar notificación acá

            }
        } catch (error) {
            alert('Error al crear el usuario')
            console.error('Error al registrar:', error)
        }
    }

    return (
        <div className="flex min-h-screen flex-col bg-base-100"  >
            <HeaderDefault />
            <div className="flex items-center justify-center min-h-screen bg-base-100">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-center">Registrarse</CardTitle>
                        <CardDescription className="text-center">
                            Ingresa tus credenciales para acceder
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Nombre de usuario</Label>
                            <Input id="username" placeholder="Ingresa un nombre de usuario" required onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <Input id="password" type="password" placeholder="Ingresa una contraseña" required onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Correo Electronico</Label>
                            <Input id="email" placeholder="alguien@email.com" onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="telefono">Telefono</Label>
                            <Input id="telefono" placeholder="3758-123456" required onChange={handleChange} />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <button onClick={registerUser} className="w-full btn btn-neutral ">Registrarse</button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}