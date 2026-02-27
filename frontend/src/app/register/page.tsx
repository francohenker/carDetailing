'use client'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import HeaderDefault from "../header"
import { useState } from "react"
import { toast } from "sonner"


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
            // Verificar que los campos obligatorios no estén vacíos
            if (!formData.firstname.trim()) {
                toast.error('El nombre es obligatorio');
                return;
            }
            
            if (!formData.lastname.trim()) {
                toast.error('El apellido es obligatorio');
                return;
            }
            
            if (!formData.password.trim()) {
                toast.error('La contraseña es obligatoria');
                return;
            }
            
            // Verificar formato del email
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailRegex.test(formData.email)) {
                toast.error('Por favor ingresa un email válido (ejemplo: usuario@dominio.com)');
                return;
            }
            
            // Verificar que el teléfono tenga exactamente 10 dígitos
            if (formData.phone.length !== 10) {
                toast.error('El teléfono debe tener exactamente 10 dígitos');
                return;
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            })
            if (res.status === 201) {
                toast.success('Usuario creado con éxito')
                window.location.href = '/login'
            } else {
                const err = await res.json().catch(() => null)
                const msg = err?.message || 'Error al crear el usuario'
                toast.error(msg)
            }
        } catch (error) {
            toast.error('Error al crear el usuario: ' + error)
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
                            <Input id="phone" placeholder="3758-123456" required onChange={(e) => {
                                const onlyNums = e.target.value.replace(/\D/g, "");
                                setFormData((prev) => ({ ...prev, phone: onlyNums }));
                            }} />
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