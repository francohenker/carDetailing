"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
    Settings,
    Users,
    Package,
    Wrench,
    Plus,
    Edit2,
    Trash2,
    Save,
    X,
    ChevronLeft,
    Shield,
    ShieldCheck
} from "lucide-react"

import { toast } from "sonner"
import HeaderDefault from "../header"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import ProtectedRoute from "@/components/ProtectedRoutes"

// Tipos de datos
interface Service {
    id: number
    name: string
    description: string
    precio: number
    duration: number
    products?: Product[]
}

interface Product {
    id: number
    name: string
    price: number
    stock_actual: number
    stock_minimo: number
}

interface User {
    id: number
    firstname: string
    lastname: string
    email: string
    phone: string
    role: 'admin' | 'user'
}

export default function AdminPage() {
    // const router = useRouter()

    // Estados para servicios
    const [services, setServices] = useState<Service[]>([])
    const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false)
    const [editingService, setEditingService] = useState<Service | null>(null)
    const [serviceForm, setServiceForm] = useState({
        name: '',
        description: '',
        precio: 0,
        duration: 30,
        productIds: [] as number[]
    })

    // Estados para productos
    const [products, setProducts] = useState<Product[]>([])
    const [isProductDialogOpen, setIsProductDialogOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)
    const [productForm, setProductForm] = useState({
        name: '',
        price: 0,
        stock_actual: 0,
        stock_minimo: 0
    })

    // Estados para usuarios
    const [users, setUsers] = useState<User[]>([])
    const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
    const [setEditingUser] = useState<User | null>(null)
    const [userForm, setUserForm] = useState({
        firstname: '',
        lastname: '',
        email: '',
        phone: '',
        password: '',
        role: 'user' as 'admin' | 'user'
    })

    // Estados generales
    const [loading, setLoading] = useState(true)
    const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
        isOpen: boolean
        type: 'service' | 'product' | 'user'
        id: number
        name: string
    }>({
        isOpen: false,
        type: 'service',
        id: 0,
        name: ''
    })

    // Cargar datos iniciales
    useEffect(() => {
        fetchAllData()
    }, [])

    const fetchAllData = async () => {
        setLoading(true)
        try {
            await Promise.all([
                fetchServices(),
                fetchProducts(),
                fetchUsers()
            ])
        } catch (error) {
            console.error('Error loading admin data:', error)
            toast.error("Error", {
                description: "No se pudieron cargar los datos del panel de administración.",
            })
        } finally {
            setLoading(false)
        }
    }

    // ============ SERVICIOS ============
    const fetchServices = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/services/getAll`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwt')}`
                }
            })
            if (!response.ok) throw new Error('Error fetching services')
            const data = await response.json()
            setServices(data)
        } catch (error) {
            console.error('Error fetching services:', error)
        }
    }

    const handleServiceSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const url = editingService
                ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/services/update/${editingService.id}`
                : `${process.env.NEXT_PUBLIC_BACKEND_URL}/services/create`

            const response = await fetch(url, {
                method: editingService ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('jwt')}`
                },
                body: JSON.stringify(serviceForm)
            })

            if (!response.ok) throw new Error('Error saving service')

            toast.success("Éxito", {
                description: `Servicio ${editingService ? 'actualizado' : 'creado'} correctamente.`,

            })

        setIsServiceDialogOpen(false)
        resetServiceForm()
        fetchServices()
    } catch (error) {
        console.error('Error saving service:', error)
        toast.error("Error", {
            description: "No se pudo guardar el servicio.",
        })
    }
}

const handleEditService = (service: Service) => {
    setEditingService(service)
    setServiceForm({
        name: service.name,
        description: service.description,
        precio: service.precio,
        duration: service.duration,
        productIds: service.products?.map(p => p.id) || []
    })
    setIsServiceDialogOpen(true)
}

const handleDeleteService = async (id: number) => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/services/delete/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('jwt')}`
            }
        })

        if (!response.ok) throw new Error('Error deleting service')

        toast.success("Éxito", {
            description: "Servicio eliminado correctamente.",
        })

        fetchServices()
    } catch (error) {
        console.error('Error deleting service:', error)
        toast.error("Error", {
            description: "No se pudo eliminar el servicio.",
        })
    }
}

const resetServiceForm = () => {
    setServiceForm({
        name: '',
        description: '',
        precio: 0,
        duration: 30,
        productIds: []
    })
    setEditingService(null)
}

// ============ PRODUCTOS ============
const fetchProducts = async () => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/producto/getAll`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('jwt')}`
            }
        })
        if (!response.ok) throw new Error('Error fetching products')
        const data = await response.json()
        setProducts(data)
    } catch (error) {
        console.error('Error fetching products:', error)
    }
}

const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
        const url = editingProduct
            ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/producto/update/${editingProduct.id}`
            : `${process.env.NEXT_PUBLIC_BACKEND_URL}/producto/create`

        const response = await fetch(url, {
            method: editingProduct ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('jwt')}`
            },
            body: JSON.stringify(productForm)
        })

        if (!response.ok) throw new Error('Error saving product')

        toast.success("Éxito", {
            description: `Producto ${editingProduct ? 'actualizado' : 'creado'} correctamente.`,
        })

        setIsProductDialogOpen(false)
        resetProductForm()
        fetchProducts()
    } catch (error) {
        console.error('Error saving product:', error)
        toast.error("Error", {
            description: "No se pudo guardar el producto.",
        })
    }
}

const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setProductForm({
        name: product.name,
        price: product.price,
        stock_actual: product.stock_actual,
        stock_minimo: product.stock_minimo
    })
    setIsProductDialogOpen(true)
}

const handleDeleteProduct = async (id: number) => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/producto/delete/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('jwt')}`
            }
        })

        if (!response.ok) throw new Error('Error deleting product')

        toast.success("Éxito", {
            description: "Producto eliminado correctamente.",
        })

        fetchProducts()
    } catch (error) {
        console.error('Error deleting product:', error)
        toast.error("Error", {
            description: "No se pudo eliminar el producto.",
        })
    }
}

const resetProductForm = () => {
    setProductForm({
        name: '',
        price: 0,
        stock_actual: 0,
        stock_minimo: 0
    })
    setEditingProduct(null)
}

// ============ USUARIOS ============
const fetchUsers = async () => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/getAll`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('jwt')}`
            }
        })
        if (!response.ok) throw new Error('Error fetching users')
        const data = await response.json()
        setUsers(data)
    } catch (error) {
        console.error('Error fetching users:', error)
    }
}

const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('jwt')}`
            },
            body: JSON.stringify(userForm)
        })

        if (!response.ok) throw new Error('Error creating user')

        toast.success( "Usuario creado correctamente")
        setIsUserDialogOpen(false)
        resetUserForm()
        fetchUsers()
    } catch (error) {
        console.error('Error creating user:', error)
        toast.error("Error", {
            description: "No se pudo crear el usuario."
        })
    }
}

const resetUserForm = () => {
    setUserForm({
        firstname: '',
        lastname: '',
        email: '',
        phone: '',
        password: '',
        role: 'user'
    })
    // setEditingUser(null)
}

const handleChangeUserRole = async (userId: number, newRole: 'admin' | 'user') => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/change-role/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('jwt')}`
            },
            body: JSON.stringify({ role: newRole })
        })

        if (!response.ok) throw new Error('Error updating user role')

        toast.success("Éxito", {
            description: "Rol de usuario actualizado correctamente.",
        })

        fetchUsers()
    } catch (error) {
        console.error('Error updating user role:', error)
        toast.error("Error", {
            description: "No se pudo actualizar el rol del usuario.",
        })
    }
}

// ============ CONFIRMACIÓN DE ELIMINACIÓN ============
const openDeleteConfirm = (type: 'service' | 'product' | 'user', id: number, name: string) => {
    setDeleteConfirmDialog({
        isOpen: true,
        type,
        id,
        name
    })
}

const handleConfirmDelete = async () => {
    const { type, id } = deleteConfirmDialog

    switch (type) {
        case 'service':
            await handleDeleteService(id)
            break
        case 'product':
            await handleDeleteProduct(id)
            break
    }

    setDeleteConfirmDialog({ isOpen: false, type: 'service', id: 0, name: '' })
}

if (loading) {
    return (
        <div className="min-h-screen bg-base-100 flex items-center justify-center">
            <span className="loading loading-spinner loading-lg"></span>
        </div>
    )
}

return (
    <ProtectedRoute allowedRoles={['admin']}>
        <div className="min-h-screen bg-base-100">
            <HeaderDefault />
            <main className="container mx-auto p-6">
                <div className="flex items-center gap-2 mb-6">
                    <Link href="/" className="text-muted-foreground hover:text-foreground">
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Volver</span>
                    </Link>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Settings className="h-8 w-8 text-primary" />
                        Panel de Administración
                    </h1>
                </div>

                <Tabs defaultValue="services" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="services" className="flex items-center gap-2">
                            <Wrench className="h-4 w-4" />
                            Servicios
                        </TabsTrigger>
                        <TabsTrigger value="products" className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Productos
                        </TabsTrigger>
                        <TabsTrigger value="users" className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Usuarios
                        </TabsTrigger>
                    </TabsList>

                    {/* PESTAÑA DE SERVICIOS */}
                    <TabsContent value="services" className="space-y-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Gestión de Servicios</CardTitle>
                                    <CardDescription>
                                        Administra los servicios disponibles para los clientes.
                                    </CardDescription>
                                </div>
                                <Button onClick={() => setIsServiceDialogOpen(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Nuevo Servicio
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nombre</TableHead>
                                            <TableHead>Descripción</TableHead>
                                            <TableHead>Precio</TableHead>
                                            <TableHead>Duración</TableHead>
                                            <TableHead>Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {services.map((service) => (
                                            <TableRow key={service.id}>
                                                <TableCell className="font-medium">{service.name}</TableCell>
                                                <TableCell>{service.description}</TableCell>
                                                <TableCell>${service.precio.toLocaleString()}</TableCell>
                                                <TableCell>{service.duration} min</TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleEditService(service)}
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => openDeleteConfirm('service', service.id, service.name)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* PESTAÑA DE PRODUCTOS */}
                    <TabsContent value="products" className="space-y-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Gestión de Productos</CardTitle>
                                    <CardDescription>
                                        Administra el inventario de productos disponibles.
                                    </CardDescription>
                                </div>
                                <Button onClick={() => setIsProductDialogOpen(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Nuevo Producto
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nombre</TableHead>
                                            {/* <TableHead>Descripción</TableHead> */}
                                            <TableHead>Precio</TableHead>
                                            <TableHead>Stock</TableHead>
                                            <TableHead>Stock Mínimo</TableHead>
                                            <TableHead>Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {products.map((product) => (
                                            <TableRow key={product.id}>
                                                <TableCell className="font-medium">{product.name}</TableCell>
                                                {/* <TableCell>{product.description}</TableCell> */}
                                                <TableCell>${product.price.toLocaleString()}</TableCell>
                                                <TableCell>
                                                    <Badge variant={product.stock_actual > 0 ? "default" : "destructive"}>
                                                        {product.stock_actual}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{product.stock_minimo}</TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleEditProduct(product)}
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => openDeleteConfirm('product', product.id, product.name)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* PESTAÑA DE USUARIOS */}
                    <TabsContent value="users" className="space-y-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Gestión de Usuarios</CardTitle>
                                    <CardDescription>
                                        Administra los permisos y roles de los usuarios del sistema.
                                    </CardDescription>
                                </div>
                                <Button onClick={() => setIsUserDialogOpen(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Nuevo Usuario
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nombre</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Telefono</TableHead>
                                            <TableHead>Rol Actual</TableHead>
                                            <TableHead>Cambiar Rol</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell className="font-medium">
                                                    {user.firstname} {user.lastname}
                                                </TableCell>
                                                <TableCell>{user.email}</TableCell>
                                                <TableCell>{user.phone}</TableCell>
                                                <TableCell>
                                                    <Badge variant={user.role === 'admin' ? "default" : "secondary"}>
                                                        {user.role === 'admin' ? (
                                                            <>
                                                                <ShieldCheck className="h-3 w-3 mr-1" />
                                                                Administrador
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Shield className="h-3 w-3 mr-1" />
                                                                Usuario
                                                            </>
                                                        )}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Select
                                                        value={user.role}
                                                        onValueChange={(newRole: 'admin' | 'user') =>
                                                            handleChangeUserRole(user.id, newRole)
                                                        }
                                                    >
                                                        <SelectTrigger className="w-32">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="user">Usuario</SelectItem>
                                                            <SelectItem value="admin">Admin</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>

            {/* DIALOG PARA SERVICIOS */}
            <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingService
                                ? 'Modifica la información del servicio.'
                                : 'Completa la información para crear un nuevo servicio.'
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleServiceSubmit} className="space-y-4">
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="service-name">Nombre del servicio</Label>
                                <Input
                                    id="service-name"
                                    value={serviceForm.name}
                                    onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="service-description">Descripción</Label>
                                <Textarea
                                    id="service-description"
                                    value={serviceForm.description}
                                    onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                                    rows={3}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="service-price">Precio ($)</Label>
                                    <Input
                                        id="service-price"
                                        type="number"
                                        value={serviceForm.precio}
                                        onChange={(e) => setServiceForm({ ...serviceForm, precio: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="service-duration">Duración (min)</Label>
                                    <Input
                                        id="service-duration"
                                        type="number"
                                        value={serviceForm.duration}
                                        onChange={(e) => setServiceForm({ ...serviceForm, duration: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Productos utilizados (opcional)</Label>
                                <div className="border rounded-lg p-3 max-h-40 overflow-y-auto">
                                    {products.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No hay productos disponibles</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {products.map((product) => (
                                                <div key={product.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`product-${product.id}`}
                                                        checked={serviceForm.productIds.includes(product.id)}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) {
                                                                setServiceForm({
                                                                    ...serviceForm,
                                                                    productIds: [...serviceForm.productIds, product.id]
                                                                })
                                                            } else {
                                                                setServiceForm({
                                                                    ...serviceForm,
                                                                    productIds: serviceForm.productIds.filter(id => id !== product.id)
                                                                })
                                                            }
                                                        }}
                                                    />
                                                    <Label
                                                        htmlFor={`product-${product.id}`}
                                                        className="text-sm font-normal"
                                                    >
                                                        {product.name} - ${product.price.toLocaleString()}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsServiceDialogOpen(false)
                                    resetServiceForm()
                                }}
                            >
                                <X className="h-4 w-4 mr-2" />
                                Cancelar
                            </Button>
                            <Button type="submit">
                                <Save className="h-4 w-4 mr-2" />
                                {editingService ? 'Actualizar' : 'Crear'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* DIALOG PARA PRODUCTOS */}
            <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingProduct
                                ? 'Modifica la información del producto.'
                                : 'Completa la información para crear un nuevo producto.'
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleProductSubmit} className="space-y-4">
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="product-name">Nombre del producto</Label>
                                <Input
                                    id="product-name"
                                    value={productForm.name}
                                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                                    required
                                />
                            </div>
                            {/* <div className="space-y-2">
                                    <Label htmlFor="product-description">Descripción</Label>
                                    <Textarea
                                        id="product-description"
                                        value={productForm.description}
                                        onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                                        rows={3}
                                    />
                                </div> */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="product-price">Precio ($)</Label>
                                    <Input
                                        id="product-price"
                                        type="number"
                                        value={productForm.price}
                                        onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="product-stock">Stock Actual</Label>
                                    <Input
                                        id="product-stock"
                                        type="number"
                                        value={productForm.stock_actual}
                                        onChange={(e) => setProductForm({ ...productForm, stock_actual: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="product-stock-min">Stock Mínimo</Label>
                                    <Input
                                        id="product-stock-min"
                                        type="number"
                                        value={productForm.stock_minimo}
                                        onChange={(e) => setProductForm({ ...productForm, stock_minimo: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                            </div>
                            {/* <div className="space-y-2">
                                    <Label htmlFor="product-category">Categoría</Label>
                                    <Input
                                        id="product-category"
                                        value={productForm.category}
                                        onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                                        placeholder="Ej: Ceras, Shampoos, Herramientas"
                                    />
                                </div> */}
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsProductDialogOpen(false)
                                    resetProductForm()
                                }}
                            >
                                <X className="h-4 w-4 mr-2" />
                                Cancelar
                            </Button>
                            <Button type="submit">
                                <Save className="h-4 w-4 mr-2" />
                                {editingProduct ? 'Actualizar' : 'Crear'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* DIALOG PARA USUARIOS */}
            <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                        <DialogDescription>
                            Completa la información para crear un nuevo usuario del sistema.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUserSubmit} className="space-y-4">
                        <div className="grid gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="user-firstname">Nombre</Label>
                                    <Input
                                        id="user-firstname"
                                        value={userForm.firstname}
                                        onChange={(e) => setUserForm({ ...userForm, firstname: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="user-lastname">Apellido</Label>
                                    <Input
                                        id="user-lastname"
                                        value={userForm.lastname}
                                        onChange={(e) => setUserForm({ ...userForm, lastname: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="user-email">Email</Label>
                                <Input
                                    id="user-email"
                                    type="email"
                                    value={userForm.email}
                                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="user-phone">Teléfono</Label>
                                    <Input
                                        id="user-phone"
                                        value={userForm.phone}
                                        onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="user-role">Rol</Label>
                                    <Select
                                        value={userForm.role}
                                        onValueChange={(value: 'admin' | 'user') =>
                                            setUserForm({ ...userForm, role: value })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="user">Usuario</SelectItem>
                                            <SelectItem value="admin">Administrador</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="user-password">Contraseña</Label>
                                <Input
                                    id="user-password"
                                    type="password"
                                    value={userForm.password}
                                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsUserDialogOpen(false)
                                    resetUserForm()
                                }}
                            >
                                <X className="h-4 w-4 mr-2" />
                                Cancelar
                            </Button>
                            <Button type="submit">
                                <Save className="h-4 w-4 mr-2" />
                                Crear Usuario
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* DIALOG DE CONFIRMACIÓN DE ELIMINACIÓN */}
            <Dialog open={deleteConfirmDialog.isOpen} onOpenChange={(open) =>
                setDeleteConfirmDialog({ ...deleteConfirmDialog, isOpen: open })
            }>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar eliminación</DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro que deseas eliminar &quote;{deleteConfirmDialog.name}&quote;?
                            Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteConfirmDialog({ ...deleteConfirmDialog, isOpen: false })}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmDelete}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    </ProtectedRoute>
)
}
