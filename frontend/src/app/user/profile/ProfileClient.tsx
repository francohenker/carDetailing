'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Car,
    ChevronLeft,
    Edit2,
    History,
    LogOut,
    Plus,
    Save,
    Trash2,
    User,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import UserTurnos from "@/components/UserTurnos";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import HeaderDefault from "@/app/header";
import { useUserStore } from "@/app/store/useUserStore";

interface UserProfile {
    id: string;
    firstname: string;
    lastname: string;
    email: string;
    phone: string;
    address: string;
    profileLetter: string;
}

interface car {
    id: string;
    model: string;
    marca: string;
    color: string;
    patente: string;
    type: string;
}

export default function ProfileClient() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Estado para controlar la pestaña activa
    const [activeTab, setActiveTab] = useState("personal");

    const [profile, setProfile] = useState<UserProfile>({
        id: "",
        firstname: "",
        lastname: "",
        email: "",
        phone: "",
        address: "",
        profileLetter: "",
    });

    const [cars, setcars] = useState<car[]>([]);

    // Estado para el formulario de nuevo vehículo
    const [newcar, setNewcar] = useState<Omit<car, "id">>({
        model: "",
        marca: "",
        color: "",
        patente: "",
        type: "",
    });

    //Estado para el formulario de editar perfil
    const [editedProfile, setEditedProfile] = useState<UserProfile>({
        ...profile,
    });

    // Estado para el vehículo en edición
    const [editingcar, setEditingcar] = useState<car | null>(null);

    // Estado para los diálogos
    const [isAddcarOpen, setIsAddcarOpen] = useState(false);
    const [isEditcarOpen, setIsEditcarOpen] = useState(false);

    // Estado para manejar la marca personalizada
    const [isCustomBrand, setIsCustomBrand] = useState(false);

    // Estados de loading para prevenir doble click
    const [isAddingCar, setIsAddingCar] = useState(false);
    const [isUpdatingCar, setIsUpdatingCar] = useState(false);
    const [isDeletingCar, setIsDeletingCar] = useState(false);

    // Estados para confirmación de eliminación
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [carToDelete, setCarToDelete] = useState<car | null>(null);

    // Estados para reclamar auto por patente
    const [claimDialogOpen, setClaimDialogOpen] = useState(false);
    const [claimPatente, setClaimPatente] = useState("");
    const [claimLoading, setClaimLoading] = useState(false);
    const [claimCheckResult, setClaimCheckResult] = useState<{ exists: boolean; isDeleted?: boolean; marca?: string; model?: string; color?: string; type?: string; patente?: string } | null>(null);

    // Estado para tipos de vehículo activos
    const [activeVehicleTypes, setActiveVehicleTypes] = useState<{ value: string; label: string; emoji: string }[]>([]);

    // Estado de loading para prevenir doble click ya declarado arriba

    // Función para cambiar a la pestaña de historial
    const handleView = () => {
        setActiveTab("history");
    };

    // Mapa dinámico de labels para tipos de vehículo
    const [vehicleLabelsMap, setVehicleLabelsMap] = useState<Record<string, { label: string; emoji: string }>>({});

    const fetchActiveVehicleTypes = async () => {
        try {
            const [activeRes, allRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/config/vehicle-types`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('jwt')}` },
                }),
                fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/config/vehicle-types/all`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('jwt')}` },
                }),
            ]);
            if (!activeRes.ok || !allRes.ok) throw new Error('Error fetching vehicle types');
            const activeData: string[] = await activeRes.json();
            const allData: { key: string; label: string; emoji: string }[] = await allRes.json();

            // Build labels map from API data
            const labelsMap: Record<string, { label: string; emoji: string }> = {};
            allData.forEach((vt) => {
                labelsMap[vt.key] = { label: vt.label, emoji: vt.emoji };
            });
            setVehicleLabelsMap(labelsMap);

            setActiveVehicleTypes(
                activeData.map((type) => ({
                    value: type,
                    label: labelsMap[type]?.label || type,
                    emoji: labelsMap[type]?.emoji || '🚗',
                }))
            );
        } catch (error) {
            console.error('Error fetching vehicle types:', error);
            // Fallback
            setActiveVehicleTypes([
                { value: 'AUTO', label: 'Auto', emoji: '🚗' },
                { value: 'CAMIONETA', label: 'Camioneta', emoji: '🚙' },
            ]);
        }
    };

    // Lista de marcas predefinidas
    const predefinedBrands = [
        "TOYOTA",
        "FORD",
        "CHEVROLET",
        "VOLKSWAGEN",
        "FIAT",
        "RENAULT",
        "PEUGEOT",
        "HONDA",
        "DODGE",
        "NISSAN",
        "HYUNDAI",
        "KIA",
        "MERCEDES-BENZ",
        "BMW",
        "AUDI",
        "MAZDA",
        "SUBARU",
        "CITROËN",
        "JEEP",
        "SUZUKI",
        "OTRO",
    ];

    // Manejadores de eventos para el perfil
    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditedProfile((prev) => ({ ...prev, [name]: value }));
    };

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editedProfile.phone && editedProfile.phone.length !== 10) {
            toast.error("Error en el teléfono", {
                description: "El número de teléfono debe tener exactamente 10 dígitos.",
            });
            return;
        }

        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/update-profile`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("jwt")}`,
            },
            body: JSON.stringify(editedProfile),
        }).then((res) => {
            if (!res.ok) {
                toast.error("Error al actualizar el perfil", {
                    description: "No se pudo actualizar el perfil.",
                });
                return;
            }
            res.json().then((data) => {
                setProfile(data);
                setEditedProfile(data);
                toast.success("Perfil actualizado", {
                    description:
                        "Tus datos personales han sido actualizados correctamente.",
                });
            });
        });
    };

    // Manejadores de eventos para vehículos
    const handleNewcarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewcar((prev) => ({ ...prev, [name]: value }));
    };

    const handleNewcarSelect = (name: string, value: string) => {
        if (name === "marca") {
            if (value === "OTRO") {
                setIsCustomBrand(true);
                setNewcar((prev) => ({ ...prev, [name]: "" }));
            } else {
                setIsCustomBrand(false);
                setNewcar((prev) => ({ ...prev, [name]: value }));
            }
        } else {
            setNewcar((prev) => ({ ...prev, [name]: value }));
        }
    };

    const patenteRegex = /^([a-zA-Z]{3}\d{3}|[a-zA-Z]{2}\d{3}[a-zA-Z]{2})$/;

    const handleAddcar = () => {
        if (isAddingCar) return; // Evitar múltiples clicks

        if (!patenteRegex.test(newcar.patente)) {
            toast.error("Patente inválida", {
                description: "El formato de la patente debe ser ABC123 o AB123CD",
            });
            return;
        }

        setIsAddingCar(true); // Deshabilitar el botón

        const car = {
            // id: Date.now().toString(),
            ...newcar,
        };

        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/car/create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("jwt")}`,
            },
            body: JSON.stringify(car),
        })
            .then(async (response) => {
                if (!response.ok) {
                    const err = await response.json().catch(() => null);
                    const msg = err?.message || "Error al agregar el vehículo";
                    throw new Error(msg);
                }
                return response.json();
            })
            .then((data) => {
                // Solo actualizar el estado local después de la confirmación del backend
                setcars((prev) => [...prev, data]);
                setNewcar({
                    model: "",
                    marca: "",
                    color: "",
                    patente: "",
                    type: "",
                });
                setIsCustomBrand(false);
                setIsAddcarOpen(false);
                toast.success("Vehículo agregado", {
                    description: "Tu vehículo ha sido agregado correctamente.",
                });
            })
            .catch((error) => {
                toast.error("Error", {
                    description: error.message,
                });
            })
            .finally(() => {
                setIsAddingCar(false); // Rehabilitar el botón
            });
    };

    const handleEditcar = (car: car) => {
        setEditingcar(car);
        setIsEditcarOpen(true);
    };

    const handleEditingcarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (editingcar) {
            setEditingcar((prev) => ({ ...prev!, [name]: value }));
        }
    };

    const handleEditingcarSelect = (name: string, value: string) => {
        if (editingcar) {
            setEditingcar((prev) => ({ ...prev!, [name]: value }));
        }
    };

    const handleUpdatecar = () => {
        if (isUpdatingCar || !editingcar) return; // Evitar múltiples clicks

        setIsUpdatingCar(true); // Deshabilitar el botón

        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/car/modify`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("jwt")}`,
            },
            body: JSON.stringify({
                id: editingcar.id,
                color: editingcar.color,
            }),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Error al actualizar el vehículo");
                }
                return response.json();
            })
            .then((data) => {
                // Solo actualizar el estado local después de la confirmación del backend
                setcars((prev) =>
                    prev.map((v) => (v.id === editingcar.id ? { ...data } : v)),
                );
                setIsEditcarOpen(false);
                toast.success("Vehículo actualizado", {
                    description:
                        "La información de tu vehículo ha sido actualizada correctamente.",
                });
            })
            .catch((error) => {
                toast.error("Error", {
                    description: error.message,
                });
            })
            .finally(() => {
                setIsUpdatingCar(false); // Rehabilitar el botón
            });
    };

    const handleDeletecar = (id: string) => {
        // Buscar el auto para mostrar info en el diálogo de confirmación
        const car = cars.find(c => c.id === id);
        if (car) {
            setCarToDelete(car);
            setDeleteConfirmOpen(true);
        }
    };

    const confirmDeleteCar = () => {
        if (!carToDelete || isDeletingCar) return;

        setIsDeletingCar(true);

        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/car/delete/${carToDelete.id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("jwt")}`,
            },
        })
            .then(async (response) => {
                if (!response.ok) {
                    const errorData = await response.json().catch(() => null);
                    throw new Error(errorData?.message || "Error al eliminar el vehículo");
                }
                return response.json();
            })
            .then((data) => {
                setcars((prev) => prev.filter((v) => v.id !== carToDelete.id));
                const cancelledMsg = data.cancelledTurnos > 0
                    ? ` Se cancelaron ${data.cancelledTurnos} turno(s) pendiente(s).`
                    : '';
                toast.success("Vehículo dado de baja", {
                    description: `Tu vehículo ha sido dado de baja correctamente.${cancelledMsg}`,
                });
                setDeleteConfirmOpen(false);
                setCarToDelete(null);
            })
            .catch((error) => {
                toast.error("Error", {
                    description: error.message,
                });
            })
            .finally(() => {
                setIsDeletingCar(false);
            });
    };

    // Verificar patente para reclamar
    const handleCheckPatente = async () => {
        if (!claimPatente.trim()) return;
        setClaimLoading(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/car/check-patente/${claimPatente.toUpperCase()}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                    },
                }
            );
            if (res.ok) {
                const data = await res.json();
                setClaimCheckResult(data);
                if (!data.exists) {
                    toast.info("No se encontró un vehículo con esa patente");
                } else if (!data.isDeleted) {
                    toast.error("Este vehículo está activo y pertenece a otro usuario");
                } else {
                    toast.success("Vehículo encontrado y disponible para reclamar");
                }
            }
        } catch {
            toast.error("Error al verificar patente");
        } finally {
            setClaimLoading(false);
        }
    };

    // Reclamar auto
    const handleClaimCar = async () => {
        setClaimLoading(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/car/claim`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                    },
                    body: JSON.stringify({ patente: claimPatente.toUpperCase() }),
                }
            );
            if (res.ok) {
                const data = await res.json();
                setcars((prev) => [...prev, data.car]);
                toast.success("Vehículo reclamado exitosamente");
                setClaimDialogOpen(false);
                setClaimPatente("");
                setClaimCheckResult(null);
            } else {
                const err = await res.json();
                toast.error(err.message || "Error al reclamar vehículo");
            }
        } catch {
            toast.error("Error al reclamar vehículo");
        } finally {
            setClaimLoading(false);
        }
    };

    // Función para obtener el vehículo por ID
    // const getcarById = (id: string) => {
    //     return cars.find((v) => v.id === id)
    // }

    // Función para cerrar sesión
    const handleLogout = () => {
        localStorage.removeItem("jwt");
        useUserStore.getState().logout();

        window.location.href = "/";

        toast.success("Sesión cerrada", {
            description: "Has cerrado sesión correctamente.",
        });
    };

    const fetchVerifyPayment = async () => {
        const url = new URL(window.location.href);
        const paymentId = url.searchParams.get("payment_id");
        const status = url.searchParams.get("status");
        if (paymentId && status === "approved") {
            await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/pago/verify`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                },
                body: JSON.stringify({ paymentId }),
            });
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("jwt");
        if (!useUserStore.getState().isAuthenticated) {
            router.push("/login");
            return;
        }

        const fetchDataUser = async () => {
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/profile`,
                    {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    },
                );
                if (response.status === 401) {
                    router.push("/login");
                    return;
                }
                if (!response.ok) {
                    throw new Error("Error fetching profile");
                }
                const data = await response.json();

                setProfile(data);
                setEditedProfile(data);
            } catch {
                toast.error("Error", {
                    description: "No se pudo obtener la información del perfil.",
                });
            }
        };

        const fetchDataCars = async () => {
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/car/get-cars-user`,
                    {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    },
                );

                if (response.status === 401) {
                    router.push("/login");
                    return;
                }
                if (!response.ok) {
                    throw new Error("Error fetching profile cars");
                }
                const data = await response.json();

                setcars(data);
            } catch (err) {
                console.error("Error fetching profile cars:", err);
            }
        };

        fetchVerifyPayment();
        fetchDataUser();
        fetchDataCars();
        fetchActiveVehicleTypes();

        // Manejar parámetros URL del correo electrónico
        const tabParam = searchParams.get("tab");
        const modifyParam = searchParams.get("modify");

        if (tabParam === "turnos" || tabParam === "history") {
            setActiveTab("history");
        }

        // Si viene con parámetro modify, cambiar a la pestaña de historial automáticamente
        if (modifyParam) {
            setActiveTab("history");
            // El componente UserTurnos detectará automáticamente el parámetro 'modify' y abrirá el modal
        }
    }, [router, searchParams]);

    return (
        // <ProtectedRoute allowedRoles={['user']}>

        <div className="flex min-h-screen w-full flex-col bg-base-300">
            <HeaderDefault />

            <main className="flex-1 py-8">
                <div className="container">
                    <div className="flex items-center gap-2 mb-6">
                        <Link
                            href="/"
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            <span className="sr-only">Volver</span>
                        </Link>
                        <h1 className="text-2xl font-bold text-base-content">
                            Mi Perfil
                        </h1>
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
                                        <p className="text-sm text-muted-foreground">
                                            {profile.email}
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {profile.phone}
                                        </p>
                                        <div className="mt-4 w-full">
                                            <Separator className="my-4" />
                                            <div className="space-y-3">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">
                                                        Vehículos:
                                                    </span>
                                                    <span className="font-medium">{cars.length}</span>
                                                </div>
                                                {/* <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">
                                                        Servicios totales:
                                                    </span>
                                                    <span className="font-medium">
                                                    {/* </span> */}
                                                {/* </div> */}
                                                {/* <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">
                                                        Próximos servicios:
                                                    </span>
                                                    <span className="font-medium">
                                                    </span>
                                                </div>  */}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">
                                        Acciones rápidas
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <button className="btn btn-neutral w-full justify-start">
                                        <Link href="/turno" className="flex items-center">
                                            <Car className="mr-2 h-4 w-4" />
                                            Reservar turno
                                        </Link>
                                    </button>
                                    <button className="btn btn-neutral w-full justify-start">
                                        <Link
                                            href="#"
                                            className="flex items-center"
                                            onClick={handleView}
                                        >
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
                            </Card> */}
                        </div>

                        {/* Contenido principal */}
                        <div>
                            <Tabs value={activeTab} onValueChange={setActiveTab}>
                                <TabsList className="mb-6 ">
                                    <TabsTrigger value="personal">
                                        <User className="h-4 w-4 mr-2" />
                                        Datos personales
                                    </TabsTrigger>
                                    <TabsTrigger value="cars">
                                        <Car className="h-4 w-4 mr-2" />
                                        Mis vehículos
                                    </TabsTrigger>
                                    <TabsTrigger value="history">
                                        <History className="h-4 w-4 mr-2" />
                                        Historial de servicios
                                    </TabsTrigger>
                                    {/* <TabsTrigger value="settings">
                                            <Settings className="h-4 w-4 mr-2" />
                                            Configuración
                                        </TabsTrigger> */}
                                </TabsList>

                                {/* Pestaña de datos personales */}
                                <TabsContent value="personal">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Información personal</CardTitle>
                                            <CardDescription>
                                                Actualiza tus datos personales y de contacto.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <form
                                                onSubmit={handleProfileSubmit}
                                                className="space-y-6"
                                            >
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="username">Nombre</Label>
                                                        <Input
                                                            disabled={true}
                                                            id="username"
                                                            name="username"
                                                            value={editedProfile.firstname}
                                                            onChange={handleProfileChange}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="lastName">Apellido</Label>
                                                        <Input
                                                            disabled={true}
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
                                                        <Input
                                                            id="phone"
                                                            name="phone"
                                                            maxLength={10}
                                                            value={editedProfile.phone}
                                                            onChange={(e) => {
                                                                const onlyNums = e.target.value
                                                                    .replace(/\D/g, "")
                                                                    .slice(0, 10);
                                                                setEditedProfile((prev) => ({
                                                                    ...prev,
                                                                    phone: onlyNums,
                                                                }));
                                                            }}
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
                                <TabsContent value="cars">
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between">
                                            <div>
                                                <CardTitle>Mis vehículos</CardTitle>
                                                <CardDescription>
                                                    Administra los vehículos registrados para tus
                                                    servicios.
                                                </CardDescription>
                                            </div>
                                            <div className="flex gap-2">
                                                <button className="btn btn-ghost btn-sm" onClick={() => setClaimDialogOpen(true)}>
                                                    Reclamar por patente
                                                </button>
                                                <Dialog
                                                    open={isAddcarOpen}
                                                    onOpenChange={setIsAddcarOpen}
                                                >
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
                                                            Ingresa los datos de tu vehículo para agregarlo
                                                            a tu perfil.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="grid gap-4 py-4">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <Label htmlFor="marca">Marca</Label>
                                                                {isCustomBrand ? (
                                                                    <div className="space-y-2">
                                                                        <Input
                                                                            id="marca"
                                                                            name="marca"
                                                                            placeholder="Ingresa la marca"
                                                                            value={newcar.marca}
                                                                            onChange={handleNewcarChange}
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setIsCustomBrand(false);
                                                                                setNewcar((prev) => ({
                                                                                    ...prev,
                                                                                    marca: "",
                                                                                }));
                                                                            }}
                                                                            className="btn btn-ghost btn-sm"
                                                                        >
                                                                            Volver a lista
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <Select
                                                                        value={newcar.marca}
                                                                        onValueChange={(value) =>
                                                                            handleNewcarSelect("marca", value)
                                                                        }
                                                                    >
                                                                        <SelectTrigger id="marca">
                                                                            <SelectValue placeholder="Seleccionar marca" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {predefinedBrands.map((brand) => (
                                                                                <SelectItem key={brand} value={brand}>
                                                                                    {brand}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                )}
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="model">Modelo</Label>
                                                                <Input
                                                                    id="model"
                                                                    name="model"
                                                                    value={newcar.model}
                                                                    onChange={handleNewcarChange}
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
                                                                    value={newcar.year}
                                                                    onChange={handleNewcarChange}
                                                                />
                                                            </div> */}
                                                        <div className="space-y-2">
                                                            <Label htmlFor="color">Color</Label>
                                                            <Input
                                                                id="color"
                                                                name="color"
                                                                value={newcar.color}
                                                                onChange={handleNewcarChange}
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
                                                                value={newcar.patente}
                                                                onChange={handleNewcarChange}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="type">Tipo</Label>
                                                            <Select
                                                                value={newcar.type}
                                                                onValueChange={(value) =>
                                                                    handleNewcarSelect("type", value)
                                                                }
                                                            >
                                                                <SelectTrigger id="type">
                                                                    <SelectValue placeholder="Seleccionar tipo" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {activeVehicleTypes.map((vt) => (
                                                                        <SelectItem key={vt.value} value={vt.value}>
                                                                            {vt.emoji} {vt.label}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                    <DialogFooter>
                                                        <button
                                                            className="btn btn-error"
                                                            onClick={() => {
                                                                setIsAddcarOpen(false);
                                                                setIsCustomBrand(false);
                                                                setNewcar({
                                                                    model: "",
                                                                    marca: "",
                                                                    color: "",
                                                                    patente: "",
                                                                    type: "",
                                                                });
                                                            }}
                                                        >
                                                            Cancelar
                                                        </button>
                                                        <button
                                                            className={`btn btn-success ${isAddingCar ? "loading" : ""}`}
                                                            onClick={handleAddcar}
                                                            disabled={isAddingCar}
                                                        >
                                                            {isAddingCar
                                                                ? "Agregando..."
                                                                : "Agregar vehículo"}
                                                        </button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            {cars.length === 0 ? (
                                                <div className="text-center py-6">
                                                    <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                                    <p className="text-muted-foreground">
                                                        No tienes vehículos registrados.
                                                    </p>
                                                    <button
                                                        className="btn btn-neutral btn-ghost mt-4"
                                                        onClick={() => setIsAddcarOpen(true)}
                                                    >
                                                        <Plus className="mr-2 h-4 w-4" />
                                                        Agregar vehículo
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {cars.map((car) => (
                                                        <Card key={car.id}>
                                                            <CardContent className="p-4">
                                                                <div className="flex items-start justify-between">
                                                                    <div>
                                                                        <div className="flex items-center gap-2">
                                                                            <h3 className="font-semibold">
                                                                                {car.marca} {car.model}
                                                                            </h3>
                                                                            <Badge variant="outline">
                                                                                {vehicleLabelsMap[car.type]?.emoji || '🚗'} {vehicleLabelsMap[car.type]?.label || car.type}
                                                                            </Badge>
                                                                        </div>
                                                                        <div className="mt-1 text-sm text-muted-foreground">
                                                                            <p>Color: {car.color}</p>
                                                                            <p>Patente: {car.patente}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            onClick={() => handleEditcar(car)}
                                                                            className="btn btn-ghost sm"
                                                                        >
                                                                            <Edit2 className="h-4 w-4" />
                                                                            <span className="sr-only">Editar</span>
                                                                        </button>
                                                                        <button
                                                                            className={`btn btn-ghosttext-destructive hover:text-destructive sm ${isDeletingCar ? "loading" : ""}`}
                                                                            onClick={() => handleDeletecar(car.id)}
                                                                            disabled={isDeletingCar}
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                            <span className="sr-only">
                                                                                Eliminar
                                                                            </span>
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
                                    <Dialog
                                        open={isEditcarOpen}
                                        onOpenChange={setIsEditcarOpen}
                                    >
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Editar vehículo</DialogTitle>
                                                <DialogDescription>
                                                    Actualiza la información de tu vehículo.
                                                </DialogDescription>
                                            </DialogHeader>
                                            {editingcar && (
                                                <div className="grid gap-4 py-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="edit-brand">Marca</Label>
                                                            <Input
                                                                id="edit-brand"
                                                                name="marca"
                                                                value={editingcar.marca}
                                                                onChange={handleEditingcarChange}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="edit-model">Modelo</Label>
                                                            <Input
                                                                id="edit-model"
                                                                name="model"
                                                                value={editingcar.model}
                                                                onChange={handleEditingcarChange}
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
                                                            value={editingcar.year}
                                                            onChange={handleEditingcarChange}
                                                        />
                                                    </div> */}
                                                        <div className="space-y-2">
                                                            <Label htmlFor="edit-color">Color</Label>
                                                            <Input
                                                                id="edit-color"
                                                                name="color"
                                                                value={editingcar.color}
                                                                onChange={handleEditingcarChange}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="edit-licensePlate">
                                                                Patente
                                                            </Label>
                                                            <Input
                                                                id="edit-licensePlate"
                                                                name="patente"
                                                                value={editingcar.patente}
                                                                onChange={handleEditingcarChange}
                                                                readOnly
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="edit-type">Tipo</Label>
                                                            <Select
                                                                value={editingcar.type}
                                                                onValueChange={(value) =>
                                                                    handleEditingcarSelect("type", value)
                                                                }
                                                            >
                                                                <SelectTrigger id="edit-type">
                                                                    <SelectValue placeholder="Seleccionar tipo" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {activeVehicleTypes.map((vt) => (
                                                                        <SelectItem key={vt.value} value={vt.value}>
                                                                            {vt.emoji} {vt.label}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            <DialogFooter>
                                                <button
                                                    className="btn btn-error"
                                                    onClick={() => setIsEditcarOpen(false)}
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    onClick={handleUpdatecar}
                                                    className={`btn btn-success ${isUpdatingCar ? "loading" : ""}`}
                                                    disabled={isUpdatingCar}
                                                >
                                                    {isUpdatingCar ? "Guardando..." : "Guardar cambios"}
                                                </button>
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
                                                Consulta los servicios realizados y programados para
                                                tus vehículos.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            {/* Importamos el componente UserTurnos */}
                                            <div className="mt-2">
                                                <UserTurnos />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                {/* Pestaña de configuración */}
                                {/* <TabsContent value="settings">
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
                                    </TabsContent> */}
                            </Tabs>
                        </div>
                    </div>
                </div>

                {/* Diálogo de confirmación de eliminación */}
                <Dialog open={deleteConfirmOpen} onOpenChange={(open) => { if (!open) { setDeleteConfirmOpen(false); setCarToDelete(null); } }}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirmar eliminación</DialogTitle>
                            <DialogDescription>
                                ¿Estás seguro de que deseas dar de baja este vehículo?
                            </DialogDescription>
                        </DialogHeader>
                        {carToDelete && (
                            <div className="py-4">
                                <div className="p-4 bg-muted rounded-lg">
                                    <p className="font-semibold">{carToDelete.marca} {carToDelete.model}</p>
                                    <p className="text-sm text-muted-foreground">Patente: {carToDelete.patente}</p>
                                </div>
                                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                    <p className="text-sm text-amber-800">
                                        <strong>⚠️ Atención:</strong> Todos los turnos pendientes asociados a este vehículo serán cancelados automáticamente.
                                    </p>
                                </div>
                            </div>
                        )}
                        <DialogFooter>
                            <button className="btn btn-ghost" onClick={() => { setDeleteConfirmOpen(false); setCarToDelete(null); }}>
                                Cancelar
                            </button>
                            <button className={`btn btn-error ${isDeletingCar ? "loading" : ""}`} onClick={confirmDeleteCar} disabled={isDeletingCar}>
                                <Trash2 className="h-4 w-4 mr-1" />
                                {isDeletingCar ? "Eliminando..." : "Confirmar eliminación"}
                            </button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Diálogo de reclamar auto por patente */}
                <Dialog open={claimDialogOpen} onOpenChange={(open) => { if (!open) { setClaimDialogOpen(false); setClaimPatente(""); setClaimCheckResult(null); } }}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Reclamar vehículo por patente</DialogTitle>
                            <DialogDescription>
                                Si un vehículo fue dado de baja por otro usuario, puede reclamarlo ingresando la patente.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Ej: ABC123 o AB123CD"
                                    value={claimPatente}
                                    onChange={(e) => { setClaimPatente(e.target.value.toUpperCase()); setClaimCheckResult(null); }}
                                    maxLength={7}
                                />
                                <button className={`btn btn-neutral ${claimLoading ? "loading" : ""}`} onClick={handleCheckPatente} disabled={claimLoading || !claimPatente.trim()}>
                                    Buscar
                                </button>
                            </div>
                            {claimCheckResult && (
                                <div className={`p-3 rounded-lg ${claimCheckResult.exists && claimCheckResult.isDeleted ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                                    {!claimCheckResult.exists && (
                                        <p className="text-sm text-red-700">No se encontró un vehículo con esa patente.</p>
                                    )}
                                    {claimCheckResult.exists && !claimCheckResult.isDeleted && (
                                        <p className="text-sm text-red-700">Este vehículo está activo y pertenece a otro usuario. No se puede reclamar.</p>
                                    )}
                                    {claimCheckResult.exists && claimCheckResult.isDeleted && (
                                        <>
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="bg-green-100 rounded-full p-2">
                                                    <Car className="h-5 w-5 text-green-700" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-green-900">{claimCheckResult.marca} {claimCheckResult.model}</p>
                                                    <p className="text-xs text-green-700">Patente: {claimCheckResult.patente} · Color: {claimCheckResult.color} · Tipo: {claimCheckResult.type}</p>
                                                </div>
                                            </div>
                                            <p className="text-sm text-green-700">✅ Vehículo disponible para reclamar. Haga clic en el botón para transferirlo a su cuenta.</p>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <button className="btn btn-ghost" onClick={() => { setClaimDialogOpen(false); setClaimPatente(""); setClaimCheckResult(null); }}>
                                Cancelar
                            </button>
                            <button
                                className={`btn btn-neutral ${claimLoading ? "loading" : ""}`}
                                onClick={handleClaimCar}
                                disabled={claimLoading || !claimCheckResult?.exists || !claimCheckResult?.isDeleted}
                            >
                                Reclamar vehículo
                            </button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </main>
        </div>
    );
}
