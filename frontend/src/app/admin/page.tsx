"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
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
    ShieldCheck,
    AlertTriangle,
    CheckCircle,
    Calendar,
    CreditCard,
    Clock,
    Car,
    Building2,
    FileDown,
    Mail,
    Send,
    TrendingUp,
    DollarSign,
    Activity,
    TrendingDown,
    FileText
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
interface Precio {
    id?: number
    tipoVehiculo: 'AUTO' | 'CAMIONETA'
    precio: number
}

interface Service {
    id: number
    name: string
    description: string
    precio?: Precio[]
    duration: number
    Producto?: Product[]
}

interface Product {
    id: number
    name: string
    price: number
    stock_actual: number
    stock_minimo: number
    servicios_por_producto?: number
    suppliers?: Supplier[]
}

interface User {
    id: number
    firstname: string
    lastname: string
    email: string
    phone: string
    role: 'admin' | 'user'
}

interface Turno {
    id: number
    fechaHora: string
    estado: 'pendiente' | 'finalizado' | 'cancelado'
    observacion: string
    duration: number
    totalPrice: number
    car: {
        id: number
        brand: string
        model: string
        year: number
        user: {
            id: number
            firstname: string
            lastname: string
            email: string
            phone: string
        }
    }
    servicio: Service[]
    pago: Pago[]
}

interface Pago {
    id: number
    monto: number
    fecha_pago: string
    metodo: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA'
    estado: 'PENDIENTE' | 'PAGADO' | 'CANCELADO'
}

interface Supplier {
    id: number
    name: string
    address: string
    email: string
    phone: string
    contactPerson?: string
    website?: string
    notes?: string
    isActive: boolean
    createdAt: string
    updatedAt: string
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
        precio: [
            { tipoVehiculo: 'AUTO' as const, precio: 0 },
            { tipoVehiculo: 'CAMIONETA' as const, precio: 0 },
        ],
        duration: 30,
        productId: [] as number[]
    })

    // Estados para productos
    const [products, setProducts] = useState<Product[]>([])
    const [isProductDialogOpen, setIsProductDialogOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)
    const [productForm, setProductForm] = useState({
        name: '',
        price: 0,
        stock_actual: 0,
        stock_minimo: 0,
        servicios_por_producto: 1,
        supplierIds: [] as number[]
    })

    // Estados para confirmación de cambio de stock
    const [isStockConfirmDialogOpen, setIsStockConfirmDialogOpen] = useState(false)
    const [pendingStockValue, setPendingStockValue] = useState<number>(0)
    const [originalStockValue, setOriginalStockValue] = useState<number>(0)

    // Estados para usuarios
    const [users, setUsers] = useState<User[]>([])
    const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
    const [userForm, setUserForm] = useState({
        firstname: '',
        lastname: '',
        email: '',
        phone: '',
        password: '',
        role: 'user' as 'admin' | 'user'
    })

    // Estados para turnos
    const [turnos, setTurnos] = useState<Turno[]>([])
    const [filteredTurnos, setFilteredTurnos] = useState<Turno[]>([])
    const [turnoFilter, setTurnoFilter] = useState<'all' | 'pending-payment' | 'paid' | 'pending-service'>('all')

    // Estados para proveedores
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false)
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
    const [supplierForm, setSupplierForm] = useState({
        name: '',
        address: '',
        email: '',
        phone: '',
        contactPerson: '',
        website: '',
        notes: '',
        isActive: true
    })

    // Estados para stock
    const [lowStockProducts, setLowStockProducts] = useState<Product[]>([])
    const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)
    const [emailForm, setEmailForm] = useState({
        supplierId: 0,
        subject: '',
        message: ''
    })
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)

    // Estados para estadísticas
    const [statistics, setStatistics] = useState<{
        currentMonthRevenue: number
        revenueChange: number
        currentMonthTurnos: number
        completedTurnos: number
        newUsersThisMonth: number
        popularServices: Array<{ name: string; count: number }>
    }>({
        currentMonthRevenue: 0,
        revenueChange: 0,
        currentMonthTurnos: 0,
        completedTurnos: 0,
        newUsersThisMonth: 0,
        popularServices: []
    })
    const [statisticsLoading, setStatisticsLoading] = useState(false)

    // Estados para auditoría
    const [auditoriaRecords, setAuditoriaRecords] = useState<any[]>([])
    const [auditoriaLoading, setAuditoriaLoading] = useState(false)
    const [auditoriaStats, setAuditoriaStats] = useState<{
        totalRegistros: number
        registrosHoy: number
        registrosEstaSemana: number
        accionesMasComunes: Array<{ accion: string; cantidad: number }>
        entidadesMasAuditadas: Array<{ entidad: string; cantidad: number }>
    }>({
        totalRegistros: 0,
        registrosHoy: 0,
        registrosEstaSemana: 0,
        accionesMasComunes: [],
        entidadesMasAuditadas: []
    })

    // Estados generales
    const [loading, setLoading] = useState(true)
    const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
        isOpen: boolean
        type: 'service' | 'product' | 'user' | 'supplier'
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const fetchAllData = async () => {
        setLoading(true)
        try {
            await Promise.all([
                fetchServices(),
                fetchProducts(),
                fetchUsers(),
                fetchTurnos(),
                fetchSuppliers(),
                fetchLowStockProducts(),
                fetchStatistics(),
                fetchAuditoria(),
                fetchAuditoriaStats()
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

        // Extraer precios del servicio o usar valores por defecto
        const getPrecioByTipo = (tipo: string) => {
            const precio = service.precio?.find(p => p.tipoVehiculo === tipo)
            return precio ? precio.precio : 0
        }

        setServiceForm({
            name: service.name,
            description: service.description,
            precio: [
                { tipoVehiculo: 'AUTO' as const, precio: getPrecioByTipo('AUTO') },
                { tipoVehiculo: 'CAMIONETA' as const, precio: getPrecioByTipo('CAMIONETA') },
            ],
            duration: service.duration,
            productId: service.Producto?.map(p => p.id) || []
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
            precio: [
                { tipoVehiculo: 'AUTO' as const, precio: 0 },
                { tipoVehiculo: 'CAMIONETA' as const, precio: 0 },
            ],
            duration: 30,
            productId: []
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

        // Si estamos editando y el stock cambió, mostrar confirmación
        if (editingProduct && productForm.stock_actual !== originalStockValue) {
            setPendingStockValue(productForm.stock_actual)
            setIsStockConfirmDialogOpen(true)
            return // No continuar con el submit hasta confirmar
        }

        // Si no cambió el stock o es un producto nuevo, continuar normalmente
        await submitProduct()
    }

    const submitProduct = async () => {
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
            stock_minimo: product.stock_minimo,
            servicios_por_producto: product.servicios_por_producto || 1,
            supplierIds: product.suppliers ? product.suppliers.map(s => s.id) : []
        })
        setOriginalStockValue(product.stock_actual)
        setIsProductDialogOpen(true)
    }

    const handleConfirmStockChange = async () => {
        setIsStockConfirmDialogOpen(false)
        // Después de confirmar, proceder con el submit
        await submitProduct()
    }

    const handleCancelStockChange = () => {
        setIsStockConfirmDialogOpen(false)
        // Restaurar el valor original en el formulario
        setProductForm({ ...productForm, stock_actual: originalStockValue })
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
            stock_minimo: 0,
            servicios_por_producto: 1,
            supplierIds: []
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

            toast.success("Usuario creado correctamente")
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

    // ============ PROVEEDORES ============
    const fetchSuppliers = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/supplier/getAll`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwt')}`
                }
            })
            if (!response.ok) throw new Error('Error fetching suppliers')
            const data = await response.json()
            setSuppliers(data)
        } catch (error) {
            console.error('Error fetching suppliers:', error)
        }
    }

    const handleSupplierSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const url = editingSupplier
                ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/supplier/update/${editingSupplier.id}`
                : `${process.env.NEXT_PUBLIC_BACKEND_URL}/supplier/create`

            const response = await fetch(url, {
                method: editingSupplier ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('jwt')}`
                },
                body: JSON.stringify(supplierForm)
            })

            if (!response.ok) throw new Error('Error saving supplier')

            toast.success("Éxito", {
                description: `Proveedor ${editingSupplier ? 'actualizado' : 'creado'} correctamente.`,
            })

            setIsSupplierDialogOpen(false)
            resetSupplierForm()
            fetchSuppliers()
        } catch (error) {
            console.error('Error saving supplier:', error)
            toast.error("Error", {
                description: "No se pudo guardar el proveedor.",
            })
        }
    }

    const handleEditSupplier = (supplier: Supplier) => {
        setEditingSupplier(supplier)
        setSupplierForm({
            name: supplier.name,
            address: supplier.address,
            email: supplier.email,
            phone: supplier.phone,
            contactPerson: supplier.contactPerson || '',
            website: supplier.website || '',
            notes: supplier.notes || '',
            isActive: supplier.isActive
        })
        setIsSupplierDialogOpen(true)
    }

    const handleDeleteSupplier = async (id: number) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/supplier/delete/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwt')}`
                }
            })

            if (!response.ok) throw new Error('Error deleting supplier')

            toast.success("Éxito", {
                description: "Proveedor eliminado correctamente.",
            })

            fetchSuppliers()
        } catch (error) {
            console.error('Error deleting supplier:', error)
            toast.error("Error", {
                description: "No se pudo eliminar el proveedor.",
            })
        }
    }

    const handleToggleSupplierActive = async (id: number) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/supplier/toggle-active/${id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwt')}`
                }
            })

            if (!response.ok) throw new Error('Error toggling supplier status')

            toast.success("Éxito", {
                description: "Estado del proveedor actualizado correctamente.",
            })

            fetchSuppliers()
        } catch (error) {
            console.error('Error toggling supplier status:', error)
            toast.error("Error", {
                description: "No se pudo actualizar el estado del proveedor.",
            })
        }
    }

    const resetSupplierForm = () => {
        setSupplierForm({
            name: '',
            address: '',
            email: '',
            phone: '',
            contactPerson: '',
            website: '',
            notes: '',
            isActive: true
        })
        setEditingSupplier(null)
    }

    // ============ ESTADÍSTICAS ============
    const fetchStatistics = async () => {
        try {
            setStatisticsLoading(true)
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/statistics`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwt')}`
                }
            })
            if (!response.ok) throw new Error('Error fetching statistics')
            const data = await response.json()
            setStatistics(data)
        } catch (error) {
            console.error('Error fetching statistics:', error)
        } finally {
            setStatisticsLoading(false)
        }
    }

    // ============ AUDITORÍA ============
    const fetchAuditoria = async () => {
        try {
            setAuditoriaLoading(true)
            const response = await fetch(`/api/auditoria?limit=20`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwt')}`
                }
            })
            if (!response.ok) throw new Error('Error fetching auditoria')
            const data = await response.json()
            setAuditoriaRecords(data.data || [])
        } catch (error) {
            console.error('Error fetching auditoria:', error)
        } finally {
            setAuditoriaLoading(false)
        }
    }

    const fetchAuditoriaStats = async () => {
        try {
            const response = await fetch(`/api/auditoria/estadisticas`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwt')}`
                }
            })
            if (!response.ok) throw new Error('Error fetching auditoria stats')
            const data = await response.json()
            setAuditoriaStats(data)
        } catch (error) {
            console.error('Error fetching auditoria stats:', error)
        }
    }

    // ============ TURNOS ============
    const fetchTurnos = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/turno/admin/getAll`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwt')}`
                }
            })
            if (!response.ok) throw new Error('Error fetching turnos')
            const data = await response.json()
            setTurnos(data)
            filterTurnos(data, turnoFilter)
        } catch (error) {
            console.error('Error fetching turnos:', error)
        }
    }

    // ============ STOCK ============
    const fetchLowStockProducts = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/stock/low-stock-products`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwt')}`
                }
            })
            if (!response.ok) throw new Error('Error fetching low stock products')
            const data = await response.json()
            setLowStockProducts(data)
        } catch (error) {
            console.error('Error fetching low stock products:', error)
        }
    }

    const handleSendSupplierEmail = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/stock/send-supplier-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('jwt')}`
                },
                body: JSON.stringify(emailForm)
            })

            if (!response.ok) throw new Error('Error sending email')

            toast.success("Éxito", {
                description: "Email enviado correctamente al proveedor.",
            })

            setIsEmailDialogOpen(false)
            resetEmailForm()
        } catch (error) {
            console.error('Error sending email:', error)
            toast.error("Error", {
                description: "No se pudo enviar el email.",
            })
        }
    }

    const handleOpenEmailDialog = (supplier: Supplier) => {
        setSelectedSupplier(supplier)
        setEmailForm({
            supplierId: supplier.id,
            subject: `Solicitud de reposición de stock - ${new Date().toLocaleDateString()}`,
            message: `Estimado/a ${supplier.contactPerson || supplier.name},\n\nEsperamos que se encuentre bien. Nos ponemos en contacto con usted para solicitar información sobre la disponibilidad y precios de los siguientes productos que requieren reposición:\n\n[Lista de productos con stock bajo]\n\nAgradecemos su pronta respuesta.\n\nSaludos cordiales,\nEquipo de Car Detailing`
        })
        setIsEmailDialogOpen(true)
    }

    const resetEmailForm = () => {
        setEmailForm({
            supplierId: 0,
            subject: '',
            message: ''
        })
        setSelectedSupplier(null)
    }

    const filterTurnos = (turnosData: Turno[], filter: 'all' | 'pending-payment' | 'paid' | 'pending-service') => {
        let filtered = turnosData

        switch (filter) {
            case 'pending-payment':
                filtered = turnosData.filter(turno =>
                    turno.pago.length === 0 || turno.pago.every(pago => pago.estado === 'PENDIENTE')
                )
                break
            case 'paid':
                filtered = turnosData.filter(turno =>
                    turno.pago.some(pago => pago.estado === 'PAGADO')
                )
                break
            case 'pending-service':
                filtered = turnosData.filter(turno =>
                    turno.estado !== 'finalizado'
                )
                break
            default:
                filtered = turnosData
        }

        // Ordenar por fecha de forma ascendente (más próximos primero)
        filtered = filtered.sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime())

        setFilteredTurnos(filtered)
    }

    const handleFilterChange = (newFilter: 'all' | 'pending-payment' | 'paid' | 'pending-service') => {
        setTurnoFilter(newFilter)
        filterTurnos(turnos, newFilter)
    }

    // Función para determinar si un turno puede ser marcado como finalizado
    const canMarkAsCompleted = (turno: Turno): boolean => {
        // Solo se puede marcar como finalizado si no está ya finalizado o cancelado
        if (turno.estado === 'finalizado' || turno.estado === 'cancelado') {
            return false
        }

        // Obtener fecha actual
        const today = new Date()
        const turnoDate = new Date(turno.fechaHora)

        // Comparar solo las fechas (sin hora)
        const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        const turnoDateOnly = new Date(turnoDate.getFullYear(), turnoDate.getMonth(), turnoDate.getDate())

        // Se puede marcar como finalizado si es el mismo día o una fecha pasada
        return turnoDateOnly <= todayDateOnly
    }

    const handleMarkAsPaid = async (turnoId: number) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/pago/mark-paid/${turnoId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('jwt')}`
                },
                body: JSON.stringify({
                    monto: turnos.find(t => t.id === turnoId)?.totalPrice || 0,
                    metodo: 'EFECTIVO'
                })
            })

            if (!response.ok) throw new Error('Error marking turno as paid')

            toast.success("Éxito", {
                description: "Turno marcado como pagado correctamente.",
            })

            fetchTurnos()
        } catch (error) {
            console.error('Error marking turno as paid:', error)
            toast.error("Error", {
                description: "No se pudo marcar el turno como pagado.",
            })
        }
    }

    const handleMarkAsCompleted = async (turnoId: number) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/turno/admin/mark-completed/${turnoId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('jwt')}`
                }
            })

            if (!response.ok) throw new Error('Error marking turno as completed')

            toast.success("Éxito", {
                description: "Turno marcado como finalizado correctamente.",
            })

            setTurnos(prevTurnos =>
                prevTurnos.map(t =>
                    t.id === turnoId ? { ...t, estado: 'finalizado' as const } : t
                )
            );

            setFilteredTurnos(prevTurnos => {
                const updatedTurnos = prevTurnos.map(t =>
                    t.id === turnoId ? { ...t, estado: 'finalizado' as const } : t
                );
                // Si el filtro es 'pending-service', elimina el turno recién finalizado de la vista
                if (turnoFilter === 'pending-service') {
                    return updatedTurnos.filter(t => t.estado !== 'finalizado');
                }
                return updatedTurnos;
            });


        } catch (error) {
            console.error('Error marking turno as completed:', error)
            toast.error("Error", {
                description: "No se pudo marcar el turno como finalizado.",
            })
        }
    }

    // ============ DESCARGAR FACTURA ============
    const handleDownloadFactura = async (turnoId: number) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/factura/download/${turnoId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwt')}`
                }
            })

            if (!response.ok) {
                throw new Error('Error al generar la factura')
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.style.display = 'none'
            a.href = url
            a.download = `factura-${turnoId}.pdf`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

            toast.success("Éxito", {
                description: "Factura descargada correctamente.",
            })
        } catch (error) {
            console.error('Error downloading factura:', error)
            toast.error("Error", {
                description: "No se pudo generar la factura. Verifica que el turno tenga un pago completado.",
            })
        }
    }

    // ============ CONFIRMACIÓN DE ELIMINACIÓN ============
    const openDeleteConfirm = (type: 'service' | 'product' | 'user' | 'supplier', id: number, name: string) => {
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
            case 'supplier':
                await handleDeleteSupplier(id)
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
                        <TabsList className="grid w-full grid-cols-8">
                            <TabsTrigger value="services" className="flex items-center gap-2">
                                <Wrench className="h-4 w-4" />
                                Servicios
                            </TabsTrigger>
                            <TabsTrigger value="products" className="flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                Productos
                            </TabsTrigger>
                            <TabsTrigger value="suppliers" className="flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                Proveedores
                            </TabsTrigger>
                            <TabsTrigger value="stock" className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" />
                                Control Stock
                            </TabsTrigger>
                            <TabsTrigger value="users" className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Usuarios
                            </TabsTrigger>
                            <TabsTrigger value="turnos" className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Turnos
                            </TabsTrigger>
                            <TabsTrigger value="statistics" className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" />
                                Estadísticas
                            </TabsTrigger>
                            <TabsTrigger value="auditoria" className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Auditoría
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
                                                <TableHead>Precios por Tipo</TableHead>
                                                <TableHead>Productos Asociados</TableHead>
                                                <TableHead>Duración</TableHead>
                                                <TableHead>Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {services.map((service) => {
                                                const getPrecio = (tipo: string): number => {
                                                    const precio = service.precio?.find(p => p.tipoVehiculo === tipo)
                                                    return precio ? precio.precio : 0
                                                }

                                                return (
                                                    <TableRow key={service.id}>
                                                        <TableCell className="font-medium">{service.name}</TableCell>
                                                        <TableCell>{service.description}</TableCell>
                                                        <TableCell>
                                                            <div className="text-xs space-y-1">
                                                                <div>🚗 Auto: ${getPrecio('AUTO').toLocaleString()}</div>
                                                                <div>🚙 Camioneta: ${getPrecio('CAMIONETA').toLocaleString()}</div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {service.Producto && service.Producto.length > 0 ? (
                                                                <div className="space-y-1">
                                                                    {service.Producto.map((product) => (
                                                                        <div key={product.id} className="text-xs bg-base-200 px-2 py-1 rounded flex items-center justify-between">
                                                                            <span className="font-medium">{product.name}</span>
                                                                            <span className="text-muted-foreground">${product.price.toLocaleString()}</span>
                                                                        </div>
                                                                    ))}
                                                                    <div className="text-xs text-muted-foreground mt-1 px-2">
                                                                        Total: {service.Producto.length} producto{service.Producto.length !== 1 ? 's' : ''}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="text-xs text-muted-foreground italic">
                                                                    Sin productos asociados
                                                                </div>
                                                            )}
                                                        </TableCell>
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
                                                )
                                            })}
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
                                                <TableHead>Servicios/Prod.</TableHead>
                                                <TableHead>Proveedores</TableHead>
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
                                                        <div className="text-center">
                                                            <span className="font-bold text-blue-600">{product.servicios_por_producto || 1}</span>
                                                            <p className="text-xs text-muted-foreground">servicios</p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {product.suppliers && product.suppliers.length > 0 ? (
                                                            <div className="space-y-1">
                                                                {product.suppliers.map((supplier) => (
                                                                    <div key={supplier.id} className="text-xs bg-base-200 px-2 py-1 rounded flex items-center justify-between">
                                                                        <span className="font-medium">{supplier.name}</span>
                                                                        {/* <span className="text-muted-foreground">{supplier.email}</span> */}
                                                                    </div>
                                                                ))}
                                                                <div className="text-xs text-muted-foreground mt-1 px-2">
                                                                    Total: {product.suppliers.length} proveedor{product.suppliers.length !== 1 ? 'es' : ''}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="text-xs text-muted-foreground italic">
                                                                Sin proveedores asociados
                                                            </div>
                                                        )}
                                                    </TableCell>
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

                        {/* PESTAÑA DE PROVEEDORES */}
                        <TabsContent value="suppliers" className="space-y-6">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Gestión de Proveedores</CardTitle>
                                        <CardDescription>Administra la información de tus proveedores.</CardDescription>
                                    </div>
                                    <Button onClick={() => setIsSupplierDialogOpen(true)}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Nuevo Proveedor
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Nombre</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Teléfono</TableHead>
                                                <TableHead>Dirección</TableHead>
                                                <TableHead>Contacto</TableHead>
                                                <TableHead>Estado</TableHead>
                                                <TableHead>Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {suppliers.map((supplier) => (
                                                <TableRow key={supplier.id}>
                                                    <TableCell className="font-medium">
                                                        <div>
                                                            <div className="font-semibold">{supplier.name}</div>
                                                            {supplier.website && (
                                                                <div className="text-xs text-muted-foreground">
                                                                    <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                                                        {supplier.website}
                                                                    </a>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{supplier.email}</TableCell>
                                                    <TableCell>{supplier.phone}</TableCell>
                                                    <TableCell>
                                                        <div className="max-w-xs truncate" title={supplier.address}>
                                                            {supplier.address}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{supplier.contactPerson || '-'}</TableCell>
                                                    <TableCell>
                                                        <span className={`px-2 py-1 rounded-full text-xs ${supplier.isActive
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            {supplier.isActive ? 'Activo' : 'Inactivo'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-1">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleEditSupplier(supplier)}
                                                            >
                                                                <Edit2 className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleToggleSupplierActive(supplier.id)}
                                                                className={supplier.isActive ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}
                                                            >
                                                                {supplier.isActive ? (
                                                                    <X className="h-4 w-4" />
                                                                ) : (
                                                                    <CheckCircle className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                            {/* <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => openDeleteConfirm('supplier', supplier.id, supplier.name)}
                                                                className="text-red-600 hover:bg-red-50"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button> */}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    {suppliers.length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground">
                                            No hay proveedores registrados.
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* PESTAÑA DE CONTROL DE STOCK */}
                        <TabsContent value="stock" className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* PRODUCTOS CON STOCK BAJO */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <AlertTriangle className="h-5 w-5 text-red-500" />
                                            Productos con Stock Bajo
                                        </CardTitle>
                                        <CardDescription>
                                            Productos que han alcanzado su stock mínimo
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {lowStockProducts.length === 0 ? (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                                                <p>¡Excelente! Todos los productos tienen stock suficiente.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {lowStockProducts.map((product) => (
                                                    <div key={product.id} className="border rounded-lg p-3 bg-red-50 border-red-200">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <h3 className="font-medium text-red-900">{product.name}</h3>
                                                                <p className="text-sm text-red-700">
                                                                    Stock actual: <span className="font-bold">{product.stock_actual}</span>
                                                                </p>
                                                                <p className="text-sm text-red-600">
                                                                    Stock mínimo: {product.stock_minimo}
                                                                </p>
                                                            </div>
                                                            <Badge variant="destructive">
                                                                ¡Crítico!
                                                            </Badge>
                                                        </div>
                                                        {product.suppliers && product.suppliers.length > 0 && (
                                                            <div className="mt-2">
                                                                <p className="text-xs text-red-700 mb-1">Proveedores disponibles:</p>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {product.suppliers.map((supplier) => (
                                                                        <span key={supplier.id} className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                                                            {supplier.name}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* COMUNICACIÓN CON PROVEEDORES */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Send className="h-5 w-5 text-blue-500" />
                                            Contactar Proveedores
                                        </CardTitle>
                                        <CardDescription>
                                            Envía emails a proveedores para solicitar reposición
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {suppliers.filter(s => s.isActive).length === 0 ? (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <Building2 className="h-12 w-12 mx-auto mb-2" />
                                                <p>No hay proveedores activos disponibles.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {suppliers.filter(s => s.isActive).map((supplier) => (
                                                    <div key={supplier.id} className="border rounded-lg p-3 hover:bg-blue-50 transition-colors">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <h3 className="font-medium">{supplier.name}</h3>
                                                                <p className="text-sm text-muted-foreground">{supplier.email}</p>
                                                                {supplier.contactPerson && (
                                                                    <p className="text-xs text-muted-foreground">
                                                                        Contacto: {supplier.contactPerson}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleOpenEmailDialog(supplier)}
                                                                className="bg-blue-600 hover:bg-blue-700"
                                                            >
                                                                <Mail className="h-4 w-4 mr-2" />
                                                                Enviar Email
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* RESUMEN DE STOCK */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Resumen de Inventario</CardTitle>
                                    <CardDescription>Vista general del estado del stock</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="text-center p-4 border rounded-lg">
                                            <Package className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                                            <p className="text-2xl font-bold">{products.length}</p>
                                            <p className="text-sm text-muted-foreground">Total Productos</p>
                                        </div>
                                        <div className="text-center p-4 border rounded-lg">
                                            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-500" />
                                            <p className="text-2xl font-bold text-red-600">{lowStockProducts.length}</p>
                                            <p className="text-sm text-muted-foreground">Stock Bajo</p>
                                        </div>
                                        <div className="text-center p-4 border rounded-lg">
                                            <Building2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                                            <p className="text-2xl font-bold">{suppliers.filter(s => s.isActive).length}</p>
                                            <p className="text-sm text-muted-foreground">Proveedores Activos</p>
                                        </div>
                                    </div>
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

                        {/* PESTAÑA DE TURNOS */}
                        <TabsContent value="turnos" className="space-y-6">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Gestión de Turnos</CardTitle>
                                        <CardDescription>
                                            Administra los turnos y sus estados de pago.
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Select value={turnoFilter} onValueChange={handleFilterChange}>
                                            <SelectTrigger className="w-[200px]">
                                                <SelectValue placeholder="Filtrar turnos" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos los turnos</SelectItem>
                                                <SelectItem value="pending-service">Servicios pendientes</SelectItem>
                                                <SelectItem value="pending-payment">Pago pendiente</SelectItem>
                                                <SelectItem value="paid">Pagados</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Cliente</TableHead>
                                                <TableHead>Vehículo</TableHead>
                                                <TableHead>Fecha y Hora</TableHead>
                                                <TableHead>Servicios</TableHead>
                                                <TableHead>Total</TableHead>
                                                <TableHead>Estado Turno</TableHead>
                                                <TableHead>Estado Pago</TableHead>
                                                <TableHead>Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredTurnos.map((turno) => {
                                                const isPaid = turno.pago.some(pago => pago.estado === 'PAGADO')
                                                const hasPendingPayment = (turno.pago.length === 0 || turno.pago.every(pago => pago.estado === 'PENDIENTE')) && turno.estado !== 'cancelado';

                                                return (
                                                    <TableRow key={turno.id}>
                                                        <TableCell className="font-medium">
                                                            <div className="space-y-1">
                                                                <div>{turno.car.user.firstname} {turno.car.user.lastname}</div>
                                                                <div className="text-sm text-muted-foreground">{turno.car.user.email}</div>
                                                                <div className="text-sm text-muted-foreground">{turno.car.user.phone}</div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <Car className="h-4 w-4 text-muted-foreground" />
                                                                <div>
                                                                    <div className="font-medium">{turno.car.brand} {turno.car.model}</div>
                                                                    <div className="text-sm text-muted-foreground">Año {turno.car.year}</div>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                                <div>
                                                                    <div>{new Date(turno.fechaHora).toLocaleDateString()}</div>
                                                                    <div className="text-sm text-muted-foreground">
                                                                        {new Date(turno.fechaHora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="space-y-1">
                                                                {turno.servicio.map((servicio) => (
                                                                    <div key={servicio.id} className="text-xs bg-base-200 px-2 py-1 rounded">
                                                                        {servicio.name}
                                                                    </div>
                                                                ))}
                                                                <div className="text-xs text-muted-foreground">
                                                                    Duración: {turno.duration} min
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="font-medium">
                                                            ${turno.totalPrice.toLocaleString()}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant={
                                                                // turno.estado === 'confirmado' ? 'default' :
                                                                turno.estado === 'finalizado' ? 'secondary' :
                                                                    turno.estado === 'cancelado' ? 'destructive' :
                                                                        'outline'
                                                            }>
                                                                {turno.estado}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                                                                <Badge variant={isPaid ? 'default' : 'destructive'}>
                                                                    {isPaid ? 'PAGADO' : 'PENDIENTE'}
                                                                </Badge>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex gap-2 flex-wrap">
                                                                {hasPendingPayment && (
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() => handleMarkAsPaid(turno.id)}
                                                                        className="bg-green-600 hover:bg-green-700"
                                                                    >
                                                                        <CreditCard className="h-4 w-4 mr-2" />
                                                                        Marcar como Pagado
                                                                    </Button>
                                                                )}
                                                                {canMarkAsCompleted(turno) && (
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() => handleMarkAsCompleted(turno.id)}
                                                                        className="bg-blue-600 hover:bg-blue-700"
                                                                    >
                                                                        <CheckCircle className="h-4 w-4 mr-2" />
                                                                        Marcar como Finalizado
                                                                    </Button>
                                                                )}
                                                                {isPaid && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => handleDownloadFactura(turno.id)}
                                                                        className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                                                                    >
                                                                        <FileDown className="h-4 w-4 mr-2" />
                                                                        Factura
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            })}
                                        </TableBody>
                                    </Table>
                                    {filteredTurnos.length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground">
                                            No se encontraron turnos para el filtro seleccionado.
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* PESTAÑA DE ESTADÍSTICAS */}
                        <TabsContent value="statistics" className="space-y-6">
                            {/* Métricas generales */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Ingresos del mes */}
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Ingresos este mes</p>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-2xl font-bold">
                                                        ${statisticsLoading ? '...' : statistics.currentMonthRevenue.toLocaleString()}
                                                    </p>
                                                    {!statisticsLoading && statistics.revenueChange !== 0 && (
                                                        <span className={`text-xs flex items-center gap-1 ${
                                                            statistics.revenueChange > 0 ? 'text-green-600' : 'text-red-600'
                                                        }`}>
                                                            {statistics.revenueChange > 0 ? (
                                                                <TrendingUp className="h-3 w-3" />
                                                            ) : (
                                                                <TrendingDown className="h-3 w-3" />
                                                            )}
                                                            {Math.abs(statistics.revenueChange).toFixed(1)}%
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <DollarSign className="h-8 w-8 text-green-600 bg-green-100 p-1.5 rounded-full" />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Total de usuarios */}
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Total usuarios</p>
                                                <p className="text-2xl font-bold">
                                                    {statisticsLoading ? '...' : users.length}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    +{statisticsLoading ? '...' : statistics.newUsersThisMonth} este mes
                                                </p>
                                            </div>
                                            <Users className="h-8 w-8 text-blue-600 bg-blue-100 p-1.5 rounded-full" />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Total de servicios */}
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Servicios disponibles</p>
                                                <p className="text-2xl font-bold">{services.length}</p>
                                                <p className="text-xs text-muted-foreground">Activos</p>
                                            </div>
                                            <Wrench className="h-8 w-8 text-purple-600 bg-purple-100 p-1.5 rounded-full" />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Turnos completados */}
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Turnos completados</p>
                                                <p className="text-2xl font-bold">
                                                    {statisticsLoading ? '...' : statistics.completedTurnos}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {statisticsLoading ? '...' : statistics.currentMonthTurnos} este mes
                                                </p>
                                            </div>
                                            <Activity className="h-8 w-8 text-orange-600 bg-orange-100 p-1.5 rounded-full" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Servicios más populares */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5" />
                                        Servicios Más Populares
                                    </CardTitle>
                                    <CardDescription>Top 3 servicios más solicitados</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {statisticsLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <span className="loading loading-spinner loading-lg"></span>
                                        </div>
                                    ) : statistics.popularServices.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            No hay datos de servicios disponibles.
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {statistics.popularServices.map((service, index) => (
                                                <div key={service.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                                                            index === 0 ? 'bg-yellow-500' :
                                                            index === 1 ? 'bg-gray-400' :
                                                            'bg-orange-500'
                                                        }`}>
                                                            {index + 1}
                                                        </div>
                                                        <span className="font-medium">{service.name}</span>
                                                    </div>
                                                    <span className="text-sm text-muted-foreground">
                                                        {service.count} {service.count === 1 ? 'vez' : 'veces'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Dashboard completo */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <TrendingUp className="h-6 w-6 text-primary" />
                                            Dashboard Completo de Estadísticas
                                        </CardTitle>
                                        <CardDescription>
                                            Accede al dashboard completo para ver análisis detallados y gráficos avanzados.
                                        </CardDescription>
                                    </div>
                                    <Link href="/admin/statistics">
                                        <Button className="bg-blue-600 hover:bg-blue-700">
                                            <TrendingUp className="h-4 w-4 mr-2" />
                                            Ver Dashboard Completo
                                        </Button>
                                    </Link>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center py-4">
                                        <p className="text-muted-foreground mb-4">
                                            El dashboard completo incluye gráficos detallados, análisis de tendencias, comparaciones mensuales y métricas avanzadas para una mejor toma de decisiones.
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            <div className="bg-blue-50 p-4 rounded-lg">
                                                <div className="text-blue-600 font-bold text-sm">📊 Gráficos interactivos</div>
                                                <div className="text-xs text-blue-700">Visualización de datos</div>
                                            </div>
                                            <div className="bg-green-50 p-4 rounded-lg">
                                                <div className="text-green-600 font-bold text-sm">📈 Análisis de tendencias</div>
                                                <div className="text-xs text-green-700">Comparaciones temporales</div>
                                            </div>
                                            <div className="bg-purple-50 p-4 rounded-lg">
                                                <div className="text-purple-600 font-bold text-sm">📋 Reportes detallados</div>
                                                <div className="text-xs text-purple-700">Métricas avanzadas</div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* PESTAÑA DE AUDITORÍA */}
                        <TabsContent value="auditoria" className="space-y-6">
                            {/* Estadísticas de auditoría */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Total Registros</p>
                                                <p className="text-2xl font-bold">{auditoriaStats.totalRegistros}</p>
                                            </div>
                                            <FileText className="h-8 w-8 text-blue-600 bg-blue-100 p-1.5 rounded-full" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Registros Hoy</p>
                                                <p className="text-2xl font-bold">{auditoriaStats.registrosHoy}</p>
                                            </div>
                                            <Calendar className="h-8 w-8 text-green-600 bg-green-100 p-1.5 rounded-full" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Esta Semana</p>
                                                <p className="text-2xl font-bold">{auditoriaStats.registrosEstaSemana}</p>
                                            </div>
                                            <Activity className="h-8 w-8 text-purple-600 bg-purple-100 p-1.5 rounded-full" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Acciones Más Comunes</p>
                                                <p className="text-lg font-bold">
                                                    {auditoriaStats.accionesMasComunes[0]?.accion || 'N/A'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {auditoriaStats.accionesMasComunes[0]?.cantidad || 0} veces
                                                </p>
                                            </div>
                                            <TrendingUp className="h-8 w-8 text-orange-600 bg-orange-100 p-1.5 rounded-full" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Registros recientes */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <FileText className="h-5 w-5" />
                                            Registros de Auditoría Recientes
                                        </CardTitle>
                                        <CardDescription>Últimas 20 acciones realizadas en el sistema</CardDescription>
                                    </div>
                                    <Link href="/admin/auditoria">
                                        <Button className="bg-blue-600 hover:bg-blue-700">
                                            <FileText className="h-4 w-4 mr-2" />
                                            Ver Todos los Registros
                                        </Button>
                                    </Link>
                                </CardHeader>
                                <CardContent>
                                    {auditoriaLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <span className="loading loading-spinner loading-lg"></span>
                                        </div>
                                    ) : auditoriaRecords.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            No hay registros de auditoría disponibles.
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {auditoriaRecords.map((record) => (
                                                <div key={record.id} className="border rounded-lg p-4 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                                record.accion === 'CREAR' ? 'bg-green-100 text-green-700' :
                                                                record.accion === 'ACTUALIZAR' ? 'bg-blue-100 text-blue-700' :
                                                                record.accion === 'ELIMINAR' ? 'bg-red-100 text-red-700' :
                                                                record.accion === 'LOGIN' ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-gray-100 text-gray-700'
                                                            }`}>
                                                                {record.accion}
                                                            </span>
                                                            <span className="text-sm font-medium">{record.entidad}</span>
                                                            {record.entidadId && (
                                                                <span className="text-xs text-muted-foreground">ID: {record.entidadId}</span>
                                                            )}
                                                        </div>
                                                        <span className="text-xs text-muted-foreground">
                                                            {new Date(record.fechaCreacion).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    
                                                    {record.descripcion && (
                                                        <p className="text-sm text-muted-foreground">{record.descripcion}</p>
                                                    )}
                                                    
                                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                        {record.usuario && (
                                                            <span>Usuario: {record.usuario.firstname} {record.usuario.lastname}</span>
                                                        )}
                                                        {record.ip && (
                                                            <span>IP: {record.ip}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Análisis de acciones y entidades */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Acciones Más Frecuentes</CardTitle>
                                        <CardDescription>Top 5 de acciones realizadas</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {auditoriaStats.accionesMasComunes.map((accion, index) => (
                                                <div key={accion.accion} className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                                                            index === 0 ? 'bg-yellow-500' :
                                                            index === 1 ? 'bg-gray-400' :
                                                            index === 2 ? 'bg-orange-500' :
                                                            'bg-gray-300'
                                                        }`}>
                                                            {index + 1}
                                                        </div>
                                                        <span className="font-medium">{accion.accion}</span>
                                                    </div>
                                                    <span className="text-sm text-muted-foreground">{accion.cantidad}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Entidades Más Auditadas</CardTitle>
                                        <CardDescription>Top 5 de entidades con más actividad</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {auditoriaStats.entidadesMasAuditadas.map((entidad, index) => (
                                                <div key={entidad.entidad} className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                                                            index === 0 ? 'bg-blue-500' :
                                                            index === 1 ? 'bg-green-500' :
                                                            index === 2 ? 'bg-purple-500' :
                                                            'bg-gray-300'
                                                        }`}>
                                                            {index + 1}
                                                        </div>
                                                        <span className="font-medium">{entidad.entidad}</span>
                                                    </div>
                                                    <span className="text-sm text-muted-foreground">{entidad.cantidad}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
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
                                <div className="space-y-4">
                                    <div className="border rounded-lg p-4 space-y-3 bg-base-200">
                                        <Label className="text-sm font-semibold">Precios por Tipo de Vehículo</Label>
                                        <p className="text-xs text-muted-foreground">Define el precio para cada tipo de vehículo</p>

                                        <div className="grid grid-cols-2 gap-3">
                                            {serviceForm.precio.map((precio, index) => (
                                                <div key={precio.tipoVehiculo} className="space-y-1">
                                                    <Label htmlFor={`service-price-${precio.tipoVehiculo}`} className="text-xs">
                                                        {precio.tipoVehiculo === 'AUTO' && '🚗 Auto ($)'}
                                                        {precio.tipoVehiculo === 'CAMIONETA' && '🚙 Camioneta ($)'}
                                                    </Label>
                                                    <Input
                                                        id={`service-price-${precio.tipoVehiculo}`}
                                                        type="number"
                                                        value={precio.precio}
                                                        onChange={(e) => {
                                                            const newPrecio = [...serviceForm.precio]
                                                            newPrecio[index] = {
                                                                ...newPrecio[index],
                                                                precio: Number(e.target.value)
                                                            }
                                                            setServiceForm({ ...serviceForm, precio: newPrecio })
                                                        }}
                                                        placeholder="0"
                                                        required
                                                    />
                                                </div>
                                            ))}
                                        </div>
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
                                                            checked={serviceForm.productId.includes(product.id)}
                                                            onCheckedChange={(checked) => {
                                                                if (checked) {
                                                                    setServiceForm({
                                                                        ...serviceForm,
                                                                        productId: [...serviceForm.productId, product.id]
                                                                    })
                                                                } else {
                                                                    setServiceForm({
                                                                        ...serviceForm,
                                                                        productId: serviceForm.productId.filter(id => id !== product.id)
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
                                <div className="grid grid-cols-4 gap-4">
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
                                        <Label htmlFor="product-stock" className="flex items-center gap-2">
                                            Stock Actual
                                            {editingProduct && (
                                                <span className="badge badge-warning badge-sm"></span>
                                            )}
                                        </Label>
                                        <Input
                                            id="product-stock"
                                            type="number"
                                            value={productForm.stock_actual}
                                            onChange={(e) => setProductForm({ ...productForm, stock_actual: Number(e.target.value) })}
                                            required
                                            className={editingProduct ? "border-warning" : ""}
                                        />
                                        {editingProduct && productForm.stock_actual !== originalStockValue && (
                                            <p className="text-xs text-warning">
                                                ⚠️ Este cambio requerirá confirmación al actualizar
                                            </p>
                                        )}
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
                                    <div className="space-y-2">
                                        <Label htmlFor="product-servicios-por-producto">Servicios por Producto</Label>
                                        <Input
                                            id="product-servicios-por-producto"
                                            type="number"
                                            min="1"
                                            value={productForm.servicios_por_producto}
                                            onChange={(e) => setProductForm({ ...productForm, servicios_por_producto: Number(e.target.value) })}
                                            required
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            ¿Cuántos servicios se pueden realizar con 1 unidad?
                                        </p>
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

                                <div className="space-y-2">
                                    <Label>Proveedores (opcional)</Label>
                                    <div className="border rounded-lg p-3 max-h-40 overflow-y-auto">
                                        {suppliers.length === 0 ? (
                                            <p className="text-sm text-muted-foreground">No hay proveedores disponibles</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {suppliers.map((supplier) => (
                                                    <div key={supplier.id} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`supplier-${supplier.id}`}
                                                            checked={productForm.supplierIds.includes(supplier.id)}
                                                            onCheckedChange={(checked) => {
                                                                if (checked) {
                                                                    setProductForm({
                                                                        ...productForm,
                                                                        supplierIds: [...productForm.supplierIds, supplier.id]
                                                                    })
                                                                } else {
                                                                    setProductForm({
                                                                        ...productForm,
                                                                        supplierIds: productForm.supplierIds.filter(id => id !== supplier.id)
                                                                    })
                                                                }
                                                            }}
                                                        />
                                                        <Label
                                                            htmlFor={`supplier-${supplier.id}`}
                                                            className="text-sm font-normal"
                                                        >
                                                            {supplier.name} - {supplier.email}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
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

                {/* DIALOG PARA PROVEEDORES */}
                <Dialog open={isSupplierDialogOpen} onOpenChange={setIsSupplierDialogOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>
                                {editingSupplier ? 'Editar Proveedor' : 'Crear Nuevo Proveedor'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingSupplier
                                    ? 'Modifica la información del proveedor.'
                                    : 'Completa la información para registrar un nuevo proveedor.'
                                }
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSupplierSubmit} className="space-y-4">
                            <div className="grid gap-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="supplier-name">Nombre del Proveedor *</Label>
                                        <Input
                                            id="supplier-name"
                                            value={supplierForm.name}
                                            onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="supplier-email">Email *</Label>
                                        <Input
                                            id="supplier-email"
                                            type="email"
                                            value={supplierForm.email}
                                            onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="supplier-phone">Teléfono *</Label>
                                        <Input
                                            id="supplier-phone"
                                            value={supplierForm.phone}
                                            onChange={(e) => {
                                                const onlyNums = e.target.value.replace(/\D/g, "");
                                                setSupplierForm({ ...supplierForm, phone: onlyNums });
                                            }}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="supplier-contact">Persona de Contacto</Label>
                                        <Input
                                            id="supplier-contact"
                                            value={supplierForm.contactPerson}
                                            onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="supplier-address">Dirección *</Label>
                                    <Textarea
                                        id="supplier-address"
                                        value={supplierForm.address}
                                        onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="supplier-website">Sitio Web</Label>
                                    <Input
                                        id="supplier-website"
                                        type="url"
                                        value={supplierForm.website}
                                        onChange={(e) => setSupplierForm({ ...supplierForm, website: e.target.value })}
                                        placeholder="https://..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="supplier-notes">Notas</Label>
                                    <Textarea
                                        id="supplier-notes"
                                        value={supplierForm.notes}
                                        onChange={(e) => setSupplierForm({ ...supplierForm, notes: e.target.value })}
                                        placeholder="Notas adicionales sobre el proveedor..."
                                    />
                                </div>

                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="supplier-active"
                                        checked={supplierForm.isActive}
                                        onChange={(e) => setSupplierForm({ ...supplierForm, isActive: e.target.checked })}
                                        className="checkbox checkbox-sm"
                                    />
                                    <Label htmlFor="supplier-active">Proveedor activo</Label>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setIsSupplierDialogOpen(false)
                                        resetSupplierForm()
                                    }}
                                >
                                    Cancelar
                                </Button>
                                <Button type="submit" className="btn btn-neutral">
                                    <Save className="h-4 w-4 mr-2" />
                                    {editingSupplier ? 'Actualizar' : 'Crear'} Proveedor
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

                {/* Modal de Confirmación de Cambio de Stock */}
                <Dialog open={isStockConfirmDialogOpen} onOpenChange={setIsStockConfirmDialogOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-warning">
                                <AlertTriangle className="h-5 w-5" />
                                ⚠️ Confirmar Actualización de Stock
                            </DialogTitle>
                            <DialogDescription>
                                Estás a punto de modificar el stock de un producto. Esta es una operación crítica.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="bg-base-200 p-4 rounded-lg space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Producto:</span>
                                    <span className="font-bold">{productForm.name}</span>
                                </div>
                                <div className="divider my-2"></div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Stock Actual:</span>
                                    <span className="text-lg font-bold text-error">{originalStockValue}</span>
                                </div>
                                <div className="flex justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                    </svg>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Nuevo Stock:</span>
                                    <span className="text-lg font-bold text-success">{pendingStockValue}</span>
                                </div>
                            </div>
                            <div className="alert alert-warning">
                                <AlertTriangle className="h-5 w-5" />
                                <div className="text-sm">
                                    <p className="font-semibold">¿Estás seguro de este cambio?</p>
                                    <p>Verifica que el nuevo valor sea correcto antes de confirmar.</p>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCancelStockChange}
                            >
                                <X className="h-4 w-4 mr-2" />
                                Cancelar
                            </Button>
                            <Button
                                type="button"
                                variant="default"
                                onClick={handleConfirmStockChange}
                                className="bg-warning hover:bg-warning/90 text-warning-content"
                            >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Confirmar Cambio
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* DIALOG PARA ENVIAR EMAIL A PROVEEDORES */}
                <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Mail className="h-5 w-5 text-blue-500" />
                                Enviar Email a Proveedor
                            </DialogTitle>
                            <DialogDescription>
                                Redacta un mensaje para contactar al proveedor {selectedSupplier?.name}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSendSupplierEmail} className="space-y-4">
                            <div className="grid gap-4">
                                <div className="bg-blue-50 p-3 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Building2 className="h-4 w-4 text-blue-600" />
                                        <span className="font-medium text-blue-900">Información del Proveedor</span>
                                    </div>
                                    <div className="text-sm text-blue-800">
                                        <p><strong>Nombre:</strong> {selectedSupplier?.name}</p>
                                        <p><strong>Email:</strong> {selectedSupplier?.email}</p>
                                        {selectedSupplier?.contactPerson && (
                                            <p><strong>Contacto:</strong> {selectedSupplier.contactPerson}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email-subject">Asunto</Label>
                                    <Input
                                        id="email-subject"
                                        value={emailForm.subject}
                                        onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email-message">Mensaje</Label>
                                    <Textarea
                                        id="email-message"
                                        value={emailForm.message}
                                        onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                                        rows={8}
                                        required
                                        placeholder="Escriba su mensaje aquí..."
                                    />
                                </div>

                                {lowStockProducts.length > 0 && (
                                    <div className="bg-amber-50 p-3 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                                            <span className="font-medium text-amber-900">Productos con Stock Bajo</span>
                                        </div>
                                        <div className="text-sm text-amber-800">
                                            <p className="mb-1">Productos que requieren reposición:</p>
                                            <ul className="list-disc list-inside space-y-1">
                                                {lowStockProducts.slice(0, 5).map((product) => (
                                                    <li key={product.id}>
                                                        {product.name} (Stock actual: {product.stock_actual}, Mínimo: {product.stock_minimo}, {(product.suppliers) && product.suppliers.find(s => s.id === selectedSupplier?.id) ? 'Proveedor asignado' : 'No asignado'})
                                                    </li>

                                                ))}
                                                {lowStockProducts.length > 5 && (
                                                    <li className="text-amber-600">... y {lowStockProducts.length - 5} productos más</li>
                                                )}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setIsEmailDialogOpen(false)
                                        resetEmailForm()
                                    }}
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Cancelar
                                </Button>
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                                    <Send className="h-4 w-4 mr-2" />
                                    Enviar Email
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>


            </div>
        </ProtectedRoute>
    )
}
