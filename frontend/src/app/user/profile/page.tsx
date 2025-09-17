'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Car, ChevronLeft, Edit2, History, LogOut, Plus, Save, Settings, Trash2, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/hooks/use-toast"
import HeaderDefault from "@/app/header"
import ProtectedRoute from "@/components/ProtectedRoutes"
import router from "next/router"
import { useUserStore } from "@/app/store/useUserStore"


interface UserProfile {
    id: string
    firstname: string
    lastname: string
    email: string
    phone: string
    address: string
    profileLetter: string
}

interface Vehicle {
    id: string
    model: string
    marca: string
    color: string
    patente: string
    type: string
}

export default function UserProfile() {
    const [profile, setProfile] = useState<UserProfile>({
        id: "",
        firstname: "",
        lastname: "",
        email: "",
        phone: "",
        address: "",
        profileLetter: "",
    })


    const [vehicles, setVehicles] = useState<Vehicle[]>([])

    // Estado para el formulario de nuevo vehículo
    const [newVehicle, setNewVehicle] = useState<Omit<Vehicle, "id">>({
        model: "",
        marca: "",
        color: "",
        patente: "",
        type: "",
    })

    //Estado para el formulario de editar perfil
    const [editedProfile, setEditedProfile] = useState<UserProfile>({ ...profile })

    // Estado para el vehículo en edición
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)

    // Estado para los diálogos
    const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false)
    const [isEditVehicleOpen, setIsEditVehicleOpen] = useState(false)

    // Manejadores de eventos para el perfil
    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setEditedProfile((prev) => ({ ...prev, [name]: value }))
    }

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setProfile(editedProfile)
        toast({
            title: "Perfil actualizado",
            description: "Tus datos personales han sido actualizados correctamente.",
        })
    }

    // Manejadores de eventos para vehículos
    const handleNewVehicleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setNewVehicle((prev) => ({ ...prev, [name]: value }))
    }

    const handleNewVehicleSelect = (name: string, value: string) => {
        setNewVehicle((prev) => ({ ...prev, [name]: value }))
    }


    const patenteRegex = /^([a-zA-Z]{3}\d{3}|[a-zA-Z]{2}\d{3}[a-zA-Z]{2})$/

    const handleAddVehicle = () => {
        if (!patenteRegex.test(newVehicle.patente)) {
            alert("Patente inválida (formato: ABC123 o AB123CD)")
            return
        }

        const vehicle = {
            id: Date.now().toString(),
            ...newVehicle,
        }
        setVehicles((prev) => [...prev, vehicle])
        setNewVehicle({
            model: "",
            marca: "",
            color: "",
            patente: "",
            type: "",
        })

        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/car/create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("jwt")}`,
            },
            body: JSON.stringify(vehicle),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Error al agregar el vehículo")
                }
                return
            })
            .then(() => {
                alert("Vehículo agregado")
            })
            .catch((error) => {
                alert(error)
            })

        setIsAddVehicleOpen(false)
        toast({
            title: "Vehículo agregado",
            description: "Tu vehículo ha sido agregado correctamente.",
        })

    }

    const handleEditVehicle = (vehicle: Vehicle) => {
        setEditingVehicle(vehicle)
        setIsEditVehicleOpen(true)
    }

    const handleEditingVehicleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        if (editingVehicle) {
            setEditingVehicle((prev) => ({ ...prev!, [name]: value }))
        }
    }

    const handleEditingVehicleSelect = (name: string, value: string) => {
        if (editingVehicle) {
            setEditingVehicle((prev) => ({ ...prev!, [name]: value }))
        }
    }

    const handleUpdateVehicle = () => {
        if (editingVehicle) {
            setVehicles((prev) =>
                prev.map((v) => (v.id === editingVehicle.id ? { ...editingVehicle } : v)),
            )
            fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/car/modify`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                },
                body: JSON.stringify(editingVehicle),
            })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error("Error al actualizar el vehículo")
                    }
                    return response.json()
                })
                .then(() => {
                    alert("Vehículo actualizado")
                })
                .catch((error) => {
                    alert(error)
                })
            setIsEditVehicleOpen(false)
            toast({
                title: "Vehículo actualizado",
                description: "La información de tu vehículo ha sido actualizada correctamente.",
            })
        }
    }

    const handleDeleteVehicle = (id: string) => {
        setVehicles((prev) => prev.filter((v) => v.id !== id))
        toast({
            title: "Vehículo eliminado",
            description: "Tu vehículo ha sido eliminado correctamente.",
        })
    }

    // Función para obtener el vehículo por ID
    const getVehicleById = (id: string) => {
        return vehicles.find((v) => v.id === id)
    }

    // Función para cerrar sesión
    const handleLogout = () => {
        router.push("/")
        localStorage.removeItem("jwt");
        toast({
            title: "Sesión cerrada",
            description: "Has cerrado sesión correctamente.",
        })
    }


    useEffect(() => {
        const token = localStorage.getItem("jwt");
        if (!useUserStore.getState().isAuthenticated) {
            window.location.href = "/login"
            return
        }

        const fetchDataUser = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/profile`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    alert("no se puedo hacer fetching del profile");
                    throw new Error("Error fetching profile");
                }
                const data = await response.json();
                console.log("Profile data:", data);

                setProfile(data);
            } catch (error) { }
        };

        const fetchDataCars = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/car/get-cars-user`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    alert("no se puedo hacer fetching del profile");
                    throw new Error("Error fetching profile");
                }
                const data = await response.json();
                console.log("Profile data:", data);

                setVehicles(data);
            } catch (error) {
                console.error("Error fetching profile:", error);
            }
        };

        fetchDataUser();
        fetchDataCars();
    }, [])






    return (
        <ProtectedRoute allowedRoles={['user']}>


            <div className="flex min-h-screen w-full flex-col bg-base-300">

                <HeaderDefault />


                <main className="flex-1 py-8">
                    <div className="container">
                        <div className="flex items-center gap-2 mb-6">
                            <Link href="/" className="text-muted-foreground hover:text-foreground">
                                <ChevronLeft className="h-4 w-4" />
                                <span className="sr-only">Volver</span>
                            </Link>
                            <h1 className="text-2xl font-bold text-base-content">Mi Perfil</h1>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
                            {/* Sidebar con información del usuario */}
                            <div className="space-y-6">
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="flex flex-col items-center text-center">
                                            <Avatar className="h-24 w-24 mb-4">
                                                <AvatarImage
                                                    src={profile.profileLetter}
                                                    alt={`${profile.firstname} ${profile.lastname}`}
                                                />
                                                <AvatarFallback className="text-lg">
                                                    {profile.firstname.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <h2 className="text-xl font-semibold">
                                                {profile.firstname} {profile.lastname}
                                            </h2>
                                            <p className="text-sm text-muted-foreground">{profile.email}</p>
                                            <p className="text-sm text-muted-foreground mt-1">{profile.phone}</p>
                                            <div className="mt-4 w-full">
                                                <Separator className="my-4" />
                                                <div className="space-y-3">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Vehículos:</span>
                                                        <span className="font-medium">{vehicles.length}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Servicios:</span>
                                                        {/* <span className="font-medium">{serviceHistory.length}</span> */}
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Próximos:</span>
                                                        <span className="font-medium">
                                                            {/* {serviceHistory.filter((s) => s.status === "scheduled").length} */}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base">Acciones rápidas</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <button className="btn btn-neutral w-full justify-start">
                                            <Link href="/" className="flex items-center">
                                                <Car className="mr-2 h-4 w-4" />
                                                Reservar turno
                                            </Link>
                                        </button>
                                        <button className="btn btn-neutral w-full justify-start">
                                            <Link href="/" className="flex items-center">
                                                <History className="mr-2 h-4 w-4" />
                                                Ver historial completo
                                            </Link>
                                        </button>
                                        <button
                                            className="btn btn-error w-full justify-start"
                                            onClick={handleLogout}
                                        >
                                            <LogOut className="mr-2 h-4 w-4" />
                                            Cerrar sesión
                                        </button>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Contenido principal */}
                            <div>
                                <Tabs defaultValue="personal ">
                                    <TabsList className="mb-6 ">
                                        <TabsTrigger value="personal">
                                            <User className="h-4 w-4 mr-2" />
                                            Datos personales
                                        </TabsTrigger>
                                        <TabsTrigger value="vehicles">
                                            <Car className="h-4 w-4 mr-2" />
                                            Mis vehículos
                                        </TabsTrigger>
                                        <TabsTrigger value="history">
                                            <History className="h-4 w-4 mr-2" />
                                            Historial de servicios
                                        </TabsTrigger>
                                        <TabsTrigger value="settings">
                                            <Settings className="h-4 w-4 mr-2" />
                                            Configuración
                                        </TabsTrigger>
                                    </TabsList>

                                    {/* Pestaña de datos personales */}
                                    <TabsContent value="personal">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Información personal</CardTitle>
                                                <CardDescription>Actualiza tus datos personales y de contacto.</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <form onSubmit={handleProfileSubmit} className="space-y-6">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="username">Nombre</Label>
                                                            <Input id="username" name="username" value={editedProfile.firstname} onChange={handleProfileChange} />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="lastName">Apellido</Label>
                                                            <Input
                                                                id="lastName"
                                                                name="lastName"
                                                                value={editedProfile.lastname}
                                                                onChange={handleProfileChange}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="email">Correo electrónico</Label>
                                                            <Input
                                                                id="email"
                                                                name="email"
                                                                type="email"
                                                                value={editedProfile.email}
                                                                onChange={handleProfileChange}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="phone">Teléfono</Label>
                                                            <Input id="phone" name="phone" value={editedProfile.phone} onChange={handleProfileChange} />
                                                        </div>
                                                        <div className="space-y-2 md:col-span-2">
                                                            <Label htmlFor="address">Dirección</Label>
                                                            <Input
                                                                id="address"
                                                                name="address"
                                                                value={editedProfile.address}
                                                                onChange={handleProfileChange}
                                                            />
                                                        </div>
                                                    </div>
                                                    <button type="submit" className="btn btn-neutral">
                                                        <Save className="mr-2 h-4 w-4" />
                                                        Guardar cambios
                                                    </button>
                                                </form>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>

                                    {/* Pestaña de vehículos */}
                                    <TabsContent value="vehicles">
                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between">
                                                <div>
                                                    <CardTitle>Mis vehículos</CardTitle>
                                                    <CardDescription>Administra los vehículos registrados para tus servicios.</CardDescription>
                                                </div>
                                                <Dialog open={isAddVehicleOpen} onOpenChange={setIsAddVehicleOpen}>
                                                    <DialogTrigger asChild>
                                                        <button className="btn btn-neutral btn-ghost">
                                                            <Plus className="mr-2 h-4 w-4" />
                                                            Agregar vehículo
                                                        </button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>Agregar nuevo vehículo</DialogTitle>
                                                            <DialogDescription>
                                                                Ingresa los datos de tu vehículo para agregarlo a tu perfil.
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="grid gap-4 py-4">
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="space-y-2">
                                                                    <Label htmlFor="marca">Marca</Label>
                                                                    <Input
                                                                        id="marca"
                                                                        name="marca"
                                                                        value={newVehicle.marca}
                                                                        onChange={handleNewVehicleChange}
                                                                    />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label htmlFor="model">Modelo</Label>
                                                                    <Input
                                                                        id="model"
                                                                        name="model"
                                                                        value={newVehicle.model}
                                                                        onChange={handleNewVehicleChange}
                                                                    />
                                                                </div>
                                                            </div>
                                                            {/* <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <Label htmlFor="year">Año</Label>
                                                                <Input
                                                                    id="year"
                                                                    name="year"
                                                                    type="number"
                                                                    value={newVehicle.year}
                                                                    onChange={handleNewVehicleChange}
                                                                />
                                                            </div> */}
                                                            <div className="space-y-2">
                                                                <Label htmlFor="color">Color</Label>
                                                                <Input
                                                                    id="color"
                                                                    name="color"
                                                                    value={newVehicle.color}
                                                                    onChange={handleNewVehicleChange}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <Label htmlFor="licensePlate">Patente</Label>
                                                                <Input
                                                                    type="text"
                                                                    pattern="^([a-zA-Z]{3}\d{3}|[a-zA-Z]{2}\d{3}[a-zA-Z]{2})$"
                                                                    id="patente"
                                                                    name="patente"
                                                                    value={newVehicle.patente}
                                                                    onChange={handleNewVehicleChange}
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="type">Tipo</Label>
                                                                <Select
                                                                    value={newVehicle.type}
                                                                    onValueChange={(value) => handleNewVehicleSelect("type", value)}
                                                                >
                                                                    <SelectTrigger id="type">
                                                                        <SelectValue placeholder="Seleccionar tipo" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {/* <SelectItem value="Sedán">Sedán</SelectItem>
                                                                        <SelectItem value="Hatchback">Hatchback</SelectItem>
                                                                        <SelectItem value="SUV">SUV</SelectItem> */}
                                                                        <SelectItem value="auto">Auto</SelectItem>
                                                                        <SelectItem value="camioneta">Camioneta</SelectItem>
                                                                        <SelectItem value="otro">Otro</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>
                                                        <DialogFooter>
                                                            <button className="btn btn-error" onClick={() => setIsAddVehicleOpen(false)}>
                                                                Cancelar
                                                            </button>
                                                            <button className="btn btn-success" onClick={handleAddVehicle}>Agregar vehículo</button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            </CardHeader>
                                            <CardContent>
                                                {vehicles.length === 0 ? (
                                                    <div className="text-center py-6">
                                                        <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                                        <p className="text-muted-foreground">No tienes vehículos registrados.</p>
                                                        <button className="btn btn-neutral btn-ghost mt-4" onClick={() => setIsAddVehicleOpen(true)}>
                                                            <Plus className="mr-2 h-4 w-4" />
                                                            Agregar vehículo
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4">
                                                        {vehicles.map((vehicle) => (
                                                            <Card key={vehicle.id}>
                                                                <CardContent className="p-4">
                                                                    <div className="flex items-start justify-between">
                                                                        <div>
                                                                            <div className="flex items-center gap-2">
                                                                                <h3 className="font-semibold">
                                                                                    {vehicle.marca} {vehicle.model}
                                                                                </h3>
                                                                                <Badge variant="outline">{vehicle.type}</Badge>
                                                                            </div>
                                                                            <div className="mt-1 text-sm text-muted-foreground">
                                                                                <p>
                                                                                    Color: {vehicle.color}
                                                                                </p>
                                                                                <p>Patente: {vehicle.patente}</p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex gap-2">
                                                                            <button onClick={() => handleEditVehicle(vehicle)} className="btn btn-ghost sm">
                                                                                <Edit2 className="h-4 w-4" />
                                                                                <span className="sr-only">Editar</span>
                                                                            </button>
                                                                            <button
                                                                                className="btn btn-ghosttext-destructive hover:text-destructive sm"
                                                                                onClick={() => handleDeleteVehicle(vehicle.id)}
                                                                            >
                                                                                <Trash2 className="h-4 w-4" />
                                                                                <span className="sr-only">Eliminar</span>
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        ))}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>

                                        {/* Diálogo para editar vehículo */}
                                        <Dialog open={isEditVehicleOpen} onOpenChange={setIsEditVehicleOpen}>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Editar vehículo</DialogTitle>
                                                    <DialogDescription>Actualiza la información de tu vehículo.</DialogDescription>
                                                </DialogHeader>
                                                {editingVehicle && (
                                                    <div className="grid gap-4 py-4">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <Label htmlFor="edit-brand">Marca</Label>
                                                                <Input
                                                                    id="edit-brand"
                                                                    name="marca"
                                                                    value={editingVehicle.marca}
                                                                    onChange={handleEditingVehicleChange}
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="edit-model">Modelo</Label>
                                                                <Input
                                                                    id="edit-model"
                                                                    name="model"
                                                                    value={editingVehicle.model}
                                                                    onChange={handleEditingVehicleChange}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            {/* <div className="space-y-2">
                                                        <Label htmlFor="edit-year">Año</Label>
                                                        <Input
                                                            id="edit-year"
                                                            name="year"
                                                            type="number"
                                                            value={editingVehicle.year}
                                                            onChange={handleEditingVehicleChange}
                                                        />
                                                    </div> */}
                                                            <div className="space-y-2">
                                                                <Label htmlFor="edit-color">Color</Label>
                                                                <Input
                                                                    id="edit-color"
                                                                    name="color"
                                                                    value={editingVehicle.color}
                                                                    onChange={handleEditingVehicleChange}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <Label htmlFor="edit-licensePlate">Patente</Label>
                                                                <Input
                                                                    id="edit-licensePlate"
                                                                    name="patente"
                                                                    value={editingVehicle.patente}
                                                                    onChange={handleEditingVehicleChange}
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="edit-type">Tipo</Label>
                                                                <Select
                                                                    value={editingVehicle.type}
                                                                    onValueChange={(value) => handleEditingVehicleSelect("type", value)}
                                                                >
                                                                    <SelectTrigger id="edit-type">
                                                                        <SelectValue placeholder="Seleccionar tipo" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {/* <SelectItem value="Sedán">Sedán</SelectItem>
                                                                    <SelectItem value="Hatchback">Hatchback</SelectItem>
                                                                    <SelectItem value="SUV">SUV</SelectItem> */}
                                                                        <SelectItem value="camioneta">Camioneta</SelectItem>
                                                                        <SelectItem value="auto">Auto</SelectItem>
                                                                        <SelectItem value="otro">Otro</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                <DialogFooter>
                                                    <button className="btn btn-outline" onClick={() => setIsEditVehicleOpen(false)}>
                                                        Cancelar
                                                    </button>
                                                    <button onClick={handleUpdateVehicle}>Guardar cambios</button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </TabsContent>

                                    {/* Pestaña de historial de servicios */}
                                    <TabsContent value="history">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Historial de servicios</CardTitle>
                                                <CardDescription>
                                                    Consulta los servicios realizados y programados para tus vehículos.
                                                </CardDescription>
                                            </CardHeader>
                                            {/* <CardContent>
                                        {serviceHistory.length === 0 ? (
                                            <div className="text-center py-6">
                                                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                                <p className="text-muted-foreground">No tienes servicios registrados.</p>
                                                <button className="btn btn-outline mt-4" asChild>
                                                    <Link href="/">Reservar un servicio</Link>
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {serviceHistory.map((service) => {
                                                    const vehicle = getVehicleById(service.vehicleId)
                                                    return (
                                                        <Card key={service.id}>
                                                            <CardContent className="p-4">
                                                                <div className="flex items-start justify-between">
                                                                    <div>
                                                                        <div className="flex items-center gap-2">
                                                                            <h3 className="font-semibold">{service.serviceName}</h3>
                                                                            <Badge
                                                                                variant={
                                                                                    service.status === "completed"
                                                                                        ? "default"
                                                                                        : service.status === "scheduled"
                                                                                            ? "outline"
                                                                                            : "secondary"
                                                                                }
                                                                            >
                                                                                {service.status === "completed"
                                                                                    ? "Completado"
                                                                                    : service.status === "scheduled"
                                                                                        ? "Programado"
                                                                                        : "Cancelado"}
                                                                            </Badge>
                                                                        </div>
                                                                        <div className="mt-1 text-sm text-muted-foreground">
                                                                            <p>Fecha: {new Date(service.date).toLocaleDateString("es-AR")}</p>
                                                                            <p>Vehículo: {vehicle ? `${vehicle.brand} ${vehicle.model}` : "Desconocido"}</p>
                                                                            <p>Precio: ${service.price.toLocaleString("es-AR")}</p>
                                                                        </div>
                                                                    </div>
                                                                    {service.status === "scheduled" && (
                                                                        <button className="btn btn-outline sm">
                                                                            Reprogramar
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </CardContent> */}
                                        </Card>
                                    </TabsContent>

                                    {/* Pestaña de configuración */}
                                    <TabsContent value="settings">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Preferencias de notificaciones</CardTitle>
                                                <CardDescription>
                                                    Configura cómo quieres recibir notificaciones sobre tus servicios.
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="space-y-0.5">
                                                            <Label htmlFor="email-notifications">Notificaciones por email</Label>
                                                            <p className="text-sm text-muted-foreground">
                                                                Recibe recordatorios y confirmaciones por correo electrónico.
                                                            </p>
                                                        </div>
                                                        <Switch id="email-notifications" defaultChecked />
                                                    </div>
                                                    <Separator />
                                                    <div className="flex items-center justify-between">
                                                        <div className="space-y-0.5">
                                                            <Label htmlFor="sms-notifications">Notificaciones por SMS</Label>
                                                            <p className="text-sm text-muted-foreground">
                                                                Recibe recordatorios y confirmaciones por mensaje de texto.
                                                            </p>
                                                        </div>
                                                        <Switch id="sms-notifications" defaultChecked />
                                                    </div>
                                                    <Separator />
                                                    <div className="flex items-center justify-between">
                                                        <div className="space-y-0.5">
                                                            <Label htmlFor="promo-notifications">Promociones y ofertas</Label>
                                                            <p className="text-sm text-muted-foreground">
                                                                Recibe información sobre promociones y ofertas especiales.
                                                            </p>
                                                        </div>
                                                        <Switch id="promo-notifications" />
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card className="mt-6">
                                            <CardHeader>
                                                <CardTitle>Seguridad</CardTitle>
                                                <CardDescription>Administra la seguridad de tu cuenta.</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-4">
                                                    <button className="btn btn-neutral btn-soft w-full justify-start">
                                                        Cambiar contraseña
                                                    </button>
                                                    <button className="btn btn-neutral btn-soft w-full justify-start">
                                                        Activar autenticación de dos factores
                                                    </button>
                                                    <button
                                                        className="btn btn-error w-full justify-start"
                                                    >
                                                        Eliminar cuenta
                                                    </button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>
                                </Tabs>
                            </div>

                        </div>
                    </div>
                </main>

            </div>
        // </ProtectedRoute>

    )

}