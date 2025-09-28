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
import ProtectedRoute from "@/components/ProtectedRoutes"
import HeaderDefault from "../header"
import { toast } from "@/hooks/use-toast"

// Tipos de datos
interface Service {
    id: number
    name: string
    description: string
    precio: number
    duration: number
}

interface Product {
    id: number
    name: string
    description: string
    price: number
    stock: number
    category: string
}

interface User {
    id: number
    firstname: string
    lastname: string
    email: string
    role: 'admin' | 'user'
}

export default function AdminPage() {
    const router = useRouter()
    
    // Estados para servicios
    const [services, setServices] = useState<Service[]>([])
    const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false)
    const [editingService, setEditingService] = useState<Service | null>(null)
    const [serviceForm, setServiceForm] = useState({
        name: '',
        description: '',
        precio: 0,
        duration: 30
    })

    // Estados para productos
    const [products, setProducts] = useState<Product[]>([])
    const [isProductDialogOpen, setIsProductDialogOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)
    const [productForm, setProductForm] = useState({
        name: '',
        description: '',
        price: 0,
        stock: 0,
        category: ''
    })

    // Estados para usuarios
    const [users, setUsers] = useState<User[]>([])
    const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<User | null>(null)

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
            toast({
                title: "Error",
                description: "No se pudieron cargar los datos del panel de administración.",
                variant: "destructive",
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

            toast({
                title: "Éxito",
                description: `Servicio ${editingService ? 'actualizado' : 'creado'} correctamente.`,
            })

            setIsServiceDialogOpen(false)
            resetServiceForm()
            fetchServices()
        } catch (error) {
            console.error('Error saving service:', error)
            toast({ 
                title: "Error",
                description: "No se pudo guardar el servicio.",
                variant: "destructive",
            })
        }
    }

    const handleEditService = (service: Service) => {
        setEditingService(service)
        setServiceForm({
            name: service.name,
            description: service.description,
            precio: service.precio,
            duration: service.duration
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

            toast({
                title: "Éxito",
                description: "Servicio eliminado correctamente.",
            })

            fetchServices()
        } catch (error) {
            console.error('Error deleting service:', error)
            toast({
                title: "Error",
                description: "No se pudo eliminar el servicio.",
                variant: "destructive",
            })
        }
    }

    const resetServiceForm = () => {
        setServiceForm({
            name: '',
            description: '',
            precio: 0,
            duration: 30
        })
        setEditingService(null)
    }

    // ============ PRODUCTOS ============
    const fetchProducts = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/products/getAll`, {
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
                ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/products/update/${editingProduct.id}`
                : `${process.env.NEXT_PUBLIC_BACKEND_URL}/products/create`
            
            const response = await fetch(url, {
                method: editingProduct ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('jwt')}`
                },
                body: JSON.stringify(productForm)
            })

            if (!response.ok) throw new Error('Error saving product')

            toast({
                title: "Éxito",
                description: `Producto ${editingProduct ? 'actualizado' : 'creado'} correctamente.`,
            })

            setIsProductDialogOpen(false)
            resetProductForm()
            fetchProducts()
        } catch (error) {
            console.error('Error saving product:', error)
            toast({
                title: "Error",
                description: "No se pudo guardar el producto.",
                variant: "destructive",
            })
        }
    }

    const handleEditProduct = (product: Product) => {
        setEditingProduct(product)
        setProductForm({
            name: product.name,
            description: product.description,
            price: product.price,
            stock: product.stock,
            category: product.category
        })
        setIsProductDialogOpen(true)
    }

    const handleDeleteProduct = async (id: number) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/products/delete/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwt')}`
                }
            })

            if (!response.ok) throw new Error('Error deleting product')

            toast({
                title: "Éxito",
                description: "Producto eliminado correctamente.",
            })

            fetchProducts()
        } catch (error) {
            console.error('Error deleting product:', error)
            toast({
                title: "Error",
                description: "No se pudo eliminar el producto.",
                variant: "destructive",
            })
        }
    }

    const resetProductForm = () => {
        setProductForm({
            name: '',
            description: '',
            price: 0,
            stock: 0,
            category: ''
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

    const handleChangeUserRole = async (userId: number, newRole: 'admin' | 'user') => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/updateRole/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('jwt')}`
                },
                body: JSON.stringify({ role: newRole })
            })

            if (!response.ok) throw new Error('Error updating user role')

            toast({
                title: "Éxito",
                description: "Rol de usuario actualizado correctamente.",
            })

            fetchUsers()
        } catch (error) {
            console.error('Error updating user role:', error)
            toast({
                title: "Error",
                description: "No se pudo actualizar el rol del usuario.",
                variant: "destructive",
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
                                                <TableHead>Descripción</TableHead>
                                                <TableHead>Precio</TableHead>
                                                <TableHead>Stock</TableHead>
                                                <TableHead>Categoría</TableHead>
                                                <TableHead>Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {products.map((product) => (
                                                <TableRow key={product.id}>
                                                    <TableCell className="font-medium">{product.name}</TableCell>
                                                    <TableCell>{product.description}</TableCell>
                                                    <TableCell>${product.price.toLocaleString()}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={product.stock > 0 ? "default" : "destructive"}>
                                                            {product.stock}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{product.category}</TableCell>
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
                                <CardHeader>
                                    <CardTitle>Gestión de Usuarios</CardTitle>
                                    <CardDescription>
                                        Administra los permisos y roles de los usuarios del sistema.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Nombre</TableHead>
                                                <TableHead>Email</TableHead>
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
                                        onChange={(e) => setServiceForm({...serviceForm, name: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="service-description">Descripción</Label>
                                    <Textarea
                                        id="service-description"
                                        value={serviceForm.description}
                                        onChange={(e) => setServiceForm({...serviceForm, description: e.target.value})}
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
                                            onChange={(e) => setServiceForm({...serviceForm, precio: Number(e.target.value)})}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="service-duration">Duración (min)</Label>
                                        <Input
                                            id="service-duration"
                                            type="number"
                                            value={serviceForm.duration}
                                            onChange={(e) => setServiceForm({...serviceForm, duration: Number(e.target.value)})}
                                            required
                                        />
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
                                        onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="product-description">Descripción</Label>
                                    <Textarea
                                        id="product-description"
                                        value={productForm.description}
                                        onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                                        rows={3}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="product-price">Precio ($)</Label>
                                        <Input
                                            id="product-price"
                                            type="number"
                                            value={productForm.price}
                                            onChange={(e) => setProductForm({...productForm, price: Number(e.target.value)})}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="product-stock">Stock</Label>
                                        <Input
                                            id="product-stock"
                                            type="number"
                                            value={productForm.stock}
                                            onChange={(e) => setProductForm({...productForm, stock: Number(e.target.value)})}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="product-category">Categoría</Label>
                                    <Input
                                        id="product-category"
                                        value={productForm.category}
                                        onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                                        placeholder="Ej: Ceras, Shampoos, Herramientas"
                                    />
                                </div>
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

                {/* DIALOG DE CONFIRMACIÓN DE ELIMINACIÓN */}
                <Dialog open={deleteConfirmDialog.isOpen} onOpenChange={(open) => 
                    setDeleteConfirmDialog({...deleteConfirmDialog, isOpen: open})
                }>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirmar eliminación</DialogTitle>
                            <DialogDescription>
                                ¿Estás seguro que deseas eliminar "{deleteConfirmDialog.name}"? 
                                Esta acción no se puede deshacer.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button 
                                variant="outline" 
                                onClick={() => setDeleteConfirmDialog({...deleteConfirmDialog, isOpen: false})}
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
