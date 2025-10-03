'use client'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import HeaderDefault from "../header"
import { useState } from "react"



export default function Register() {
    const [formData, setFormData] = useState({
        firstname: "",
        lastname: "",
        password: "",
        email: "",
        phone: "",
    })
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value })
    }

    const registerUser = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/register`, {
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
            }else{
                // alert('Error: ' + res.statusText)
                alert('Error al crear el usuario')
            }
        } catch (error) {
            alert('Error al crear el usuario: ' + error)
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
                            <Label htmlFor="firstname">Nombre</Label>
                            <Input id="firstname" placeholder="Ingresa tu nombre" required onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastname">Apellido</Label>
                            <Input id="lastname" placeholder="Ingresa tu apellido" required onChange={handleChange} />
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
                            <Label htmlFor="phone">Telefono</Label>
                            <Input id="phone" placeholder="3758-123456" required onChange={handleChange} />
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