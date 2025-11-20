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
    Activity,
    TrendingDown,
    FileText,
    Filter,
    Search,
    RefreshCw
} from "lucide-react"

import { toast } from "sonner"
import HeaderDefault from "../header"

// Componentes de gráficos y estadísticas
import RevenueChart from "@/components/charts/RevenueChart"
import TurnosChart from "@/components/charts/TurnosChart"
import ServicesChart from "@/components/charts/ServicesChart"
import StatusChart from "@/components/charts/StatusChart"
import DateFilter from "@/components/DateFilter"
import { useReportGenerator } from "@/hooks/useReportGenerator"

// Componentes de auditoría
import DataComparison from "@/components/auditoria/DataComparison"
import UserInfo from "@/components/auditoria/UserInfo"
import AuditSummary from "@/components/auditoria/AuditSummary"
import ActivitySummary from "@/components/auditoria/ActivitySummary"
import HourlyActivity from "@/components/auditoria/HourlyActivity"
import PaginationControls from "@/components/auditoria/PaginationControls"
import RecordsSummary from "@/components/auditoria/RecordsSummary"

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
    priority?: 'ALTA' | 'MEDIA' | 'BAJA'
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

interface QuotationRequest {
    id: number
    products: Product[]
    suppliers: Supplier[]
    status: 'PENDING' | 'COMPLETED' | 'CANCELLED'
    sentAt: string
    notes?: string
    responses?: QuotationResponse[]
}

interface QuotationResponse {
    id: number
    quotationRequestId: number
    supplier: Supplier
    productQuotes: Array<{
        productId: number
        productName: string
        unitPrice: number
        quantity: number
        availability: string
    }>
    totalAmount: number
    deliveryDays: number
    paymentTerms: string
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
    isWinner: boolean
    receivedAt: string
}

interface QuotationThresholds {
    high: number
    medium: number
    low: number
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
        priority: 'MEDIA' as 'ALTA' | 'MEDIA' | 'BAJA',
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

    // Estados para paginación de turnos
    const [currentPageTurnos, setCurrentPageTurnos] = useState(1)
    const [itemsPerPageTurnos] = useState(10)
    const [paginatedTurnos, setPaginatedTurnos] = useState<Turno[]>([])
    const [totalPagesTurnos, setTotalPagesTurnos] = useState(0)

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
        productIds: [] as number[],
        message: '',

    })
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
    const [selectedProducts, setSelectedProducts] = useState<number[]>([])  // IDs de productos seleccionados

    // Estados para cotizaciones
    const [quotationRequests, setQuotationRequests] = useState<QuotationRequest[]>([])
    const [selectedQuotationRequest, setSelectedQuotationRequest] = useState<QuotationRequest | null>(null)
    const [quotationResponses, setQuotationResponses] = useState<QuotationResponse[]>([])
    const [quotationFilter, setQuotationFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all')
    const [isReceivedConfirmDialogOpen, setIsReceivedConfirmDialogOpen] = useState(false)
    const [quotationToMarkReceived, setQuotationToMarkReceived] = useState<number | null>(null)

    // Estados para configuración
    const [quotationThresholds, setQuotationThresholds] = useState<QuotationThresholds>({
        high: 1,
        medium: 2,
        low: 3
    })

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

    // Estados para auditoría
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

    // Estados para estadísticas detalladas
    const [detailedStatistics, setDetailedStatistics] = useState<{
        monthlyRevenue?: Array<{ month: string; revenue: number }>
        turnosStatus?: Array<{ estado: string; count: string }>
        weeklyTurnos?: Array<{ day: string; turnos: number }>
        dailyTurnos?: Array<{ date: string; day: string; turnos: number }>
        dailyRevenue?: Array<{ date: string; day: string; revenue: number }>
        topClients?: Array<{
            clientName: string
            clientEmail: string
            totalSpent: number
            turnosCount: string
        }>
        period?: {
            startDate: string
            endDate: string
            days: number
        }
        periodRevenue?: number
        periodTurnos?: number
        newUsers?: number
    } | null>(null)
    const [detailedLoading, setDetailedLoading] = useState(false)
    const { generateReport, isGenerating } = useReportGenerator()

    // Estados para auditoría detallada
    interface AuditoriaRecord {
        id: number
        accion: string
        entidad: string
        entidadId?: number
        descripcion?: string
        fechaCreacion: string
        usuario?: {
            firstname: string
            lastname: string
            email: string
        }
        ip?: string
        userAgent?: string
        datosAnteriores?: any
        datosNuevos?: any
    }

    interface DetailedAuditoriaStats {
        totalRegistros: number
        registrosHoy: number
        registrosEstaSemana: number
        registrosEsteMes: number
        registrosAyer: number
        registrosSemanaAnterior: number
        crecimientoHoy: number
        crecimientoSemana: number
        accionesMasComunes: Array<{ accion: string; cantidad: number }>
        entidadesMasAuditadas: Array<{ entidad: string; cantidad: number }>
        usuariosMasActivos: Array<{ usuario: string; cantidad: number }>
        distribucionPorHora: Array<{ hora: number; cantidad: number }>
    }

    const [detailedAuditoriaRecords, setDetailedAuditoriaRecords] = useState<AuditoriaRecord[]>([])
    const [detailedAuditoriaStats, setDetailedAuditoriaStats] = useState<DetailedAuditoriaStats>({
        totalRegistros: 0,
        registrosHoy: 0,
        registrosEstaSemana: 0,
        registrosEsteMes: 0,
        registrosAyer: 0,
        registrosSemanaAnterior: 0,
        crecimientoHoy: 0,
        crecimientoSemana: 0,
        accionesMasComunes: [],
        entidadesMasAuditadas: [],
        usuariosMasActivos: [],
        distribucionPorHora: [],
    })
    const [auditoriaCurrentPage, setAuditoriaCurrentPage] = useState(1)
    const [auditoriaTotalPages, setAuditoriaTotalPages] = useState(1)
    const [auditoriaTotalRecords, setAuditoriaTotalRecords] = useState(0)
    const [auditoriaFilters, setAuditoriaFilters] = useState({
        accion: "",
        entidad: "",
        usuarioId: "",
        limit: "50",
    })
    const [auditoriaDetailedLoading, setAuditoriaDetailedLoading] = useState(false)

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

    // ============ FUNCIONES DE AUTENTICACIÓN ============
    const checkTokenValidity = () => {
        const token = localStorage.getItem('jwt')
        if (!token) return false

        try {
            // Decodificar el token para verificar la expiración
            const payload = JSON.parse(atob(token.split('.')[1]))
            const currentTime = Date.now() / 1000

            // Si el token expira en menos de 5 minutos, considerarlo inválido
            return payload.exp > (currentTime + 300)
        } catch (error) {
            console.error('Error checking token validity:', error)
            return false
        }
    }

    const handleUnauthorizedError = () => {
        console.warn('Token inválido o expirado, redirigiendo al login...')
        localStorage.removeItem('jwt')
        window.location.href = '/auth/login'
    }

    // Función para hacer fetch con autenticación automática
    const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
        if (!checkTokenValidity()) {
            handleUnauthorizedError()
            return null
        }

        const token = localStorage.getItem('jwt')
        const response = await fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        })

        if (response.status === 401) {
            handleUnauthorizedError()
            return null
        }

        return response
    }

    // Verificar token al cargar la página
    useEffect(() => {
        const token = localStorage.getItem('jwt')

        if (!token || !checkTokenValidity()) {
            handleUnauthorizedError()
            return
        }

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
                fetchDetailedStatistics(),
                fetchAuditoriaStats(),
                fetchDetailedAuditoriaRecords(),
                fetchDetailedAuditoriaStats(),
                fetchQuotationRequests(),
                fetchQuotationThresholds()
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
            priority: product.priority || 'MEDIA',
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
            priority: 'MEDIA',
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

    // ============ COTIZACIONES ============
    const fetchQuotationRequests = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/quotation/requests`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwt')}`
                }
            })
            if (!response.ok) throw new Error('Error fetching quotation requests')
            const data = await response.json()
            setQuotationRequests(data)
        } catch (error) {
            console.error('Error fetching quotation requests:', error)
        }
    }

    const fetchQuotationResponses = async (requestId: number) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/quotation/requests/${requestId}/responses`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwt')}`
                }
            })
            if (!response.ok) throw new Error('Error fetching quotation responses')
            const data = await response.json()
            setQuotationResponses(data)
        } catch (error) {
            console.error('Error fetching quotation responses:', error)
        }
    }

    const handleSelectWinner = async (requestId: number, responseId: number) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/quotation/requests/${requestId}/select-winner`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('jwt')}`
                },
                body: JSON.stringify({ responseId })
            })

            if (!response.ok) throw new Error('Error selecting winner')

            toast.success("Éxito", {
                description: "Proveedor seleccionado correctamente.",
            })

            await fetchQuotationRequests()
            if (selectedQuotationRequest) {
                await fetchQuotationResponses(selectedQuotationRequest.id)
            }
        } catch (error) {
            console.error('Error selecting winner:', error)
            toast.error("Error", {
                description: "No se pudo seleccionar el proveedor.",
            })
        }
    }

    const handleMarkAsReceived = async () => {
        if (!quotationToMarkReceived) return

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/quotation/requests/${quotationToMarkReceived}/mark-received`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwt')}`
                }
            })

            if (!response.ok) throw new Error('Error marking as received')

            toast.success("Éxito", {
                description: "Stock actualizado correctamente.",
            })

            setIsReceivedConfirmDialogOpen(false)
            setQuotationToMarkReceived(null)
            await fetchQuotationRequests()
            await fetchProducts() // Actualizar productos para ver el nuevo stock
        } catch (error) {
            console.error('Error marking as received:', error)
            toast.error("Error", {
                description: "No se pudo actualizar el stock.",
            })
        }
    }

    const getFilteredQuotations = () => {
        switch (quotationFilter) {
            case 'pending':
                return quotationRequests.filter(q => q.status === 'PENDING')
            case 'completed':
                return quotationRequests.filter(q => q.status === 'COMPLETED')
            case 'cancelled':
                return quotationRequests.filter(q => q.status === 'CANCELLED')
            default:
                return quotationRequests
        }
    }

    // ============ CONFIGURACIÓN ============
    const fetchQuotationThresholds = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/config/quotation-thresholds`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwt')}`
                }
            })
            if (!response.ok) throw new Error('Error fetching quotation thresholds')
            const data = await response.json()
            setQuotationThresholds(data)
        } catch (error) {
            console.error('Error fetching quotation thresholds:', error)
        }
    }

    const handleUpdateQuotationThresholds = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/config/quotation-thresholds`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('jwt')}`
                },
                body: JSON.stringify(quotationThresholds)
            })

            if (!response.ok) throw new Error('Error updating quotation thresholds')

            toast.success("Éxito", {
                description: "Umbrales de cotización actualizados correctamente.",
            })

            await fetchQuotationThresholds()
        } catch (error) {
            console.error('Error updating quotation thresholds:', error)
            toast.error("Error", {
                description: "No se pudieron actualizar los umbrales.",
            })
        }
    }

    // ============ ESTADÍSTICAS ============
    const fetchStatistics = async () => {
        try {
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
        }
    }

    const fetchDetailedStatistics = async () => {
        try {
            setDetailedLoading(true)

            const response = await fetchWithAuth('/api/statistics')
            if (!response) return // Token inválido, ya manejado

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`)
            }

            const statisticsData = await response.json()
            setDetailedStatistics(statisticsData)
        } catch (err) {
            console.error('Error fetching detailed statistics:', err)
            toast.error("Error", {
                description: "No se pudieron cargar las estadísticas detalladas. Verifica tu conexión.",
            })
        } finally {
            setDetailedLoading(false)
        }
    }

    const fetchFilteredStatistics = async (startDate: string, endDate: string) => {
        try {
            setDetailedLoading(true)

            const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BACKEND_URL}/statistics/filtered?startDate=${startDate}&endDate=${endDate}`)
            if (!response) return // Token inválido, ya manejado

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`)
            }

            const filteredData = await response.json()
            setDetailedStatistics(filteredData)
        } catch (err) {
            console.error('Error fetching filtered statistics:', err)
            toast.error("Error", {
                description: "No se pudieron cargar las estadísticas filtradas. Verifica tu conexión.",
            })
        } finally {
            setDetailedLoading(false)
        }
    }

    const handleGenerateReport = async () => {
        if (!detailedStatistics) return

        try {
            await generateReport(detailedStatistics)
        } catch (err) {
            console.error('Error generando informe:', err)
            toast.error("Error", {
                description: "No se pudo generar el informe.",
            })
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
        }).format(amount)
    }

    // ============ AUDITORÍA DETALLADA ============
    const fetchDetailedAuditoriaRecords = async (page = 1) => {
        try {
            setAuditoriaDetailedLoading(true)
            const params = new URLSearchParams({
                page: page.toString(),
                ...auditoriaFilters,
            })

            const response = await fetchWithAuth(`/api/auditoria?${params.toString()}`)
            if (!response) return // Token inválido, ya manejado

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`)
            }

            const data = await response.json()
            setDetailedAuditoriaRecords(data.data || [])
            setAuditoriaCurrentPage(data.page || 1)
            setAuditoriaTotalPages(data.totalPages || 1)
            setAuditoriaTotalRecords(data.total || 0)
        } catch (error) {
            console.error("Error fetching auditoria records:", error)
            toast.error("Error", {
                description: "No se pudieron cargar los registros de auditoría. Verifica tu conexión.",
            })
        } finally {
            setAuditoriaDetailedLoading(false)
        }
    }

    const fetchDetailedAuditoriaStats = async () => {
        try {
            const response = await fetchWithAuth(`/api/auditoria/estadisticas`)
            if (!response) return // Token inválido, ya manejado

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`)
            }

            const data = await response.json()
            setDetailedAuditoriaStats(data)
        } catch (error) {
            console.error("Error fetching detailed auditoria stats:", error)
            toast.error("Error", {
                description: "No se pudieron cargar las estadísticas de auditoría.",
            })
        }
    }

    const handleAuditoriaFilterChange = (key: string, value: string) => {
        setAuditoriaFilters((prev) => ({ ...prev, [key]: value }))
    }

    const applyAuditoriaFilters = () => {
        setAuditoriaCurrentPage(1)
        fetchDetailedAuditoriaRecords(1)
    }

    const clearAuditoriaFilters = () => {
        setAuditoriaFilters({
            accion: "",
            entidad: "",
            usuarioId: "",
            limit: "50",
        })
        setAuditoriaCurrentPage(1)
        fetchDetailedAuditoriaRecords(1)
    }

    const getTrendIcon = (growth: number) => {
        if (growth > 0) return <TrendingUp className="h-4 w-4 text-green-600" />
        if (growth < 0) return <TrendingDown className="h-4 w-4 text-red-600" />
        return <Activity className="h-4 w-4 text-gray-600" />
    }

    const getTrendColor = (growth: number) => {
        if (growth > 0) return "text-green-600"
        if (growth < 0) return "text-red-600"
        return "text-gray-600"
    }

    const handleAuditoriaPageChange = (page: number) => {
        if (page >= 1 && page <= auditoriaTotalPages && page !== auditoriaCurrentPage) {
            setAuditoriaCurrentPage(page)
            fetchDetailedAuditoriaRecords(page)
        }
    }

    const handleAuditoriaRecordsPerPageChange = (limit: string) => {
        handleAuditoriaFilterChange("limit", limit)
        setAuditoriaCurrentPage(1)
        fetchDetailedAuditoriaRecords(1)
    }

    const hasActiveAuditoriaFilters = () => {
        return (
            auditoriaFilters.accion !== "" ||
            auditoriaFilters.entidad !== "" ||
            auditoriaFilters.usuarioId !== ""
        )
    }

    // ============ AUDITORÍA ============


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

        // Filtrar productos con stock bajo que están asignados a este proveedor
        const supplierProducts = lowStockProducts.filter(product =>
            product.suppliers && product.suppliers.some(s => s.id === supplier.id)
        );

        // Seleccionar todos los productos del proveedor por defecto
        setSelectedProducts(supplierProducts.map(p => p.id))

        // Generar mensaje inicial con productos del proveedor
        const generateInitialMessage = (products: Product[]) => {
            if (products.length === 0) {
                return `Estimado/a ${supplier.contactPerson || supplier.name},\n\nEsperamos que se encuentre bien. Nos ponemos en contacto con usted para consultar sobre disponibilidad de productos.\n\nSaludos cordiales,\nEquipo de Car Detailing`
            }

            const productList = products.map(p =>
                // `• ${p.name} - Stock actual: ${p.stock_actual}, Stock mínimo: ${p.stock_minimo}, Consumo por servicio: ${p.servicios_por_producto || 1}`
                `• ${p.name}, cantidad: ${p.stock_minimo * 2}`
            ).join('\n')

            return `Estimado/a ${supplier.contactPerson || supplier.name},\n\nEsperamos que se encuentre bien. Nos ponemos en contacto con usted para solicitar información sobre la disponibilidad y precios de los siguientes productos que requieren reposición:\n\n${productList}\n\nPor favor, envíenos información sobre:\n- Disponibilidad actual\n- Precios unitarios\n- Tiempo de entrega\n- Cantidades mínimas de pedido\n\nAgradecemos su pronta respuesta.\n\nSaludos cordiales,\nEquipo de Car Detailing`
        }

        setEmailForm({
            supplierId: supplier.id,
            subject: `Solicitud de reposición de stock - ${new Date().toLocaleDateString()}`,
            productIds: supplierProducts.map(p => p.id),
            message: generateInitialMessage(supplierProducts)
        })
        setIsEmailDialogOpen(true)
    }

    const updateEmailMessage = (productIds: number[]) => {
        if (!selectedSupplier) return;

        const selectedProductsList = lowStockProducts.filter(p => productIds.includes(p.id));

        const generateMessage = (products: Product[]) => {
            if (products.length === 0) {
                return `Estimado/a ${selectedSupplier.contactPerson || selectedSupplier.name},\n\nEsperamos que se encuentre bien. Nos ponemos en contacto con usted para consultar sobre disponibilidad de productos.\n\nSaludos cordiales,\nEquipo de Car Detailing`
            }

            const productList = products.map(p =>
                // `• ${p.name} - Stock actual: ${p.stock_actual}, Stock mínimo: ${p.stock_minimo}, Consumo por servicio: ${p.servicios_por_producto || 1}`
                `• ${p.name}, cantidad: ${p.stock_minimo * 2}`
            ).join('\n')

            return `Estimado/a ${selectedSupplier.contactPerson || selectedSupplier.name},\n\nEsperamos que se encuentre bien. Nos ponemos en contacto con usted para solicitar información sobre la disponibilidad y precios de los siguientes productos que requieren reposición:\n\n${productList}\n\nPor favor, envíenos información sobre:\n- Disponibilidad actual\n- Precios unitarios\n- Tiempo de entrega\n- Cantidades mínimas de pedido\n\nAgradecemos su pronta respuesta.\n\nSaludos cordiales,\nEquipo de Car Detailing`
        }

        setEmailForm(prev => ({
            ...prev,
            message: generateMessage(selectedProductsList)
        }))
    }

    const handleProductSelection = (productId: number, isSelected: boolean) => {
        const newSelection = isSelected
            ? [...selectedProducts, productId]
            : selectedProducts.filter(id => id !== productId);

        setSelectedProducts(newSelection);
        setEmailForm(prev => ({
            ...prev,
            productIds: newSelection
        }));
        updateEmailMessage(newSelection);
    }

    const resetEmailForm = () => {
        setEmailForm({
            supplierId: 0,
            subject: '',
            productIds: [],
            message: ''
        })
        setSelectedSupplier(null)
        setSelectedProducts([])
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

        // Calcular paginación
        const totalPages = Math.ceil(filtered.length / itemsPerPageTurnos)
        setTotalPagesTurnos(totalPages)

        // Resetear a la primera página cuando se cambia el filtro
        setCurrentPageTurnos(1)

        // Paginar resultados
        paginateTurnos(filtered, 1)
    }

    const paginateTurnos = (turnosData: Turno[], page: number) => {
        const startIndex = (page - 1) * itemsPerPageTurnos
        const endIndex = startIndex + itemsPerPageTurnos
        const paginated = turnosData.slice(startIndex, endIndex)
        setPaginatedTurnos(paginated)
    }

    const handlePageChangeTurnos = (page: number) => {
        setCurrentPageTurnos(page)
        paginateTurnos(filteredTurnos, page)
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

            // Recargar turnos para mantener consistencia con la paginación
            fetchTurnos();


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
            a.download = `comprobante-${turnoId}.pdf`
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
                        <TabsList className="grid w-full grid-cols-10">
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
                            <TabsTrigger value="quotations" className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Cotizaciones
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
                            <TabsTrigger value="config" className="flex items-center gap-2">
                                <Settings className="h-4 w-4" />
                                Configuración
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
                                                <TableHead className="w-80">Descripción</TableHead>
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
                                                        <TableCell className="w-80">
                                                            <div className="group relative">
                                                                <p
                                                                    className="text-sm text-gray-600 truncate cursor-help"
                                                                    title={service.description.length > 80 ? service.description : undefined}
                                                                >
                                                                    {service.description.length > 80
                                                                        ? `${service.description.substring(0, 80)}...`
                                                                        : service.description
                                                                    }
                                                                </p>
                                                                {service.description.length > 80 && (
                                                                    <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-50 animate-in fade-in-0 zoom-in-95">
                                                                        <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 max-w-sm shadow-xl border">
                                                                            <p className="whitespace-pre-wrap break-words">{service.description}</p>
                                                                            <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </TableCell>
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
                                                <TableHead className="text-center">Stock</TableHead>
                                                <TableHead className="text-center">Stock Mínimo</TableHead>
                                                <TableHead className="text-center">Rendimiento</TableHead>
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
                                                    <TableCell className="text-center">
                                                        <div className="flex flex-col items-center gap-1">
                                                            <Badge
                                                                variant={
                                                                    product.stock_actual <= 0 ? "destructive" :
                                                                        product.stock_actual <= product.stock_minimo ? "secondary" :
                                                                            "default"
                                                                }
                                                            >
                                                                {product.stock_actual}
                                                            </Badge>
                                                            {product.stock_actual <= product.stock_minimo && product.stock_actual > 0 && (
                                                                <span className="text-xs text-amber-600 font-medium">Bajo stock</span>
                                                            )}
                                                            {product.stock_actual <= 0 && (
                                                                <span className="text-xs text-red-600 font-medium">Sin stock</span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex flex-col items-center">
                                                            <span className="font-semibold text-orange-600">{product.stock_minimo}</span>
                                                            <span className="text-xs text-muted-foreground">mínimo</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex flex-col items-center">
                                                            <span className="font-bold text-blue-600 text-lg">{product.servicios_por_producto || 1}</span>
                                                            <span className="text-xs text-muted-foreground">por servicio</span>
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
                                                    <div key={product.id} className="border rounded-lg p-4 bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex-1">
                                                                <h3 className="font-medium text-red-900 mb-2">{product.name}</h3>
                                                                <div className="grid grid-cols-2 gap-4 mb-2">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-xs text-red-600 font-medium uppercase tracking-wide">Stock Actual</span>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-lg font-bold text-red-800">{product.stock_actual}</span>
                                                                            <Badge variant="destructive" className="text-xs">
                                                                                {product.stock_actual <= 0 ? 'Sin stock' : 'Bajo stock'}
                                                                            </Badge>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-xs text-orange-600 font-medium uppercase tracking-wide">Stock Mínimo</span>
                                                                        <span className="text-lg font-semibold text-orange-700">{product.stock_minimo}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-xs text-blue-600 font-medium uppercase tracking-wide">Consumo por Servicio</span>
                                                                    <span className="text-sm font-semibold text-blue-700">{product.servicios_por_producto || 1} unidades</span>
                                                                </div>
                                                                {product.priority && (
                                                                    <div className="flex flex-col mt-2">
                                                                        <span className="text-xs text-gray-600 font-medium uppercase tracking-wide">Prioridad</span>
                                                                        <Badge
                                                                            variant={
                                                                                product.priority === 'ALTA' ? 'destructive' :
                                                                                    product.priority === 'MEDIA' ? 'default' :
                                                                                        'secondary'
                                                                            }
                                                                            className={
                                                                                product.priority === 'MEDIA' ? 'bg-yellow-500' : ''
                                                                            }
                                                                        >
                                                                            {product.priority}
                                                                        </Badge>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col items-end gap-2">
                                                                <Badge variant="destructive" className="animate-pulse">
                                                                    ¡Crítico!
                                                                </Badge>
                                                                {product.stock_actual <= 0 && (
                                                                    <Badge variant="outline" className="text-red-700 border-red-300">
                                                                        Agotado
                                                                    </Badge>
                                                                )}
                                                            </div>
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
                                            {paginatedTurnos.map((turno) => {
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
                                                                        Comprobante
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            })}
                                        </TableBody>
                                    </Table>

                                    {/* Paginación */}
                                    {filteredTurnos.length > 0 && (
                                        <div className="flex items-center justify-between mt-4">
                                            <div className="text-sm text-muted-foreground">
                                                Mostrando {Math.min((currentPageTurnos - 1) * itemsPerPageTurnos + 1, filteredTurnos.length)} a {Math.min(currentPageTurnos * itemsPerPageTurnos, filteredTurnos.length)} de {filteredTurnos.length} turnos
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handlePageChangeTurnos(currentPageTurnos - 1)}
                                                    disabled={currentPageTurnos === 1}
                                                >
                                                    Anterior
                                                </Button>
                                                <div className="flex gap-1">
                                                    {Array.from({ length: totalPagesTurnos }, (_, i) => i + 1).map((page) => (
                                                        <Button
                                                            key={page}
                                                            variant={currentPageTurnos === page ? "default" : "outline"}
                                                            size="sm"
                                                            onClick={() => handlePageChangeTurnos(page)}
                                                            className="w-8 h-8 p-0"
                                                        >
                                                            {page}
                                                        </Button>
                                                    ))}
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handlePageChangeTurnos(currentPageTurnos + 1)}
                                                    disabled={currentPageTurnos === totalPagesTurnos}
                                                >
                                                    Siguiente
                                                </Button>
                                            </div>
                                        </div>
                                    )}

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
                            {/* Header con filtros */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold">Dashboard de Estadísticas</h2>
                                    <p className="text-muted-foreground">Análisis completo de métricas y rendimiento</p>
                                </div>
                            </div>

                            {/* Filtros de fecha */}
                            <DateFilter
                                onFilter={fetchFilteredStatistics}
                                onGenerateReport={handleGenerateReport}
                                isLoading={detailedLoading}
                                isGeneratingReport={isGenerating}
                            />

                            {/* Indicador de período */}
                            {detailedStatistics?.period && (
                                <Card className="border-0 shadow-lg bg-blue-50 border-l-4 border-l-blue-500">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-semibold text-blue-900">
                                                    Período Filtrado: {new Date(detailedStatistics.period.startDate).toLocaleDateString('es-AR')} - {new Date(detailedStatistics.period.endDate).toLocaleDateString('es-AR')}
                                                </h3>
                                                <p className="text-blue-700">
                                                    Mostrando datos de {detailedStatistics.period.days} días
                                                </p>
                                            </div>
                                            <Button
                                                onClick={fetchDetailedStatistics}
                                                variant="outline"
                                                size="sm"
                                                className="border-blue-300 text-blue-700 hover:bg-blue-100"
                                            >
                                                Ver Dashboard General
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* KPI Cards */}
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                                {/* Ingresos */}
                                <Card className="border-0 shadow-lg bg-gradient-to-r from-green-500 to-green-600 text-white">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-green-100">
                                            {detailedStatistics?.period ? 'Ingresos del Período' : 'Ingresos del Mes'}
                                        </CardTitle>
                                        <TrendingUp className="h-5 w-5 text-green-100" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold">
                                            {detailedLoading ? '...' : formatCurrency(detailedStatistics?.periodRevenue ?? statistics?.currentMonthRevenue ?? 0)}
                                        </div>
                                        {statistics?.revenueChange !== undefined && !detailedStatistics?.period && (
                                            <div className="flex items-center gap-1 mt-2">
                                                {statistics.revenueChange >= 0 ?
                                                    <TrendingUp className="h-4 w-4 text-green-100" /> :
                                                    <TrendingDown className="h-4 w-4 text-green-100" />
                                                }
                                                <span className="text-sm text-green-100">
                                                    {Math.abs(statistics.revenueChange).toFixed(1)}% vs mes anterior
                                                </span>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Turnos */}
                                <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-blue-100">
                                            {detailedStatistics?.period ? 'Turnos del Período' : 'Turnos del Mes'}
                                        </CardTitle>
                                        <Calendar className="h-5 w-5 text-blue-100" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold">
                                            {detailedLoading ? '...' : (detailedStatistics?.periodTurnos ?? statistics?.currentMonthTurnos ?? 0)}
                                        </div>
                                        <p className="text-sm text-blue-100 mt-2">Turnos programados</p>
                                    </CardContent>
                                </Card>

                                {/* Turnos completados */}
                                <Card className="border-0 shadow-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-emerald-100">Turnos Completados</CardTitle>
                                        <CheckCircle className="h-5 w-5 text-emerald-100" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold">
                                            {detailedLoading ? '...' : (statistics?.completedTurnos ?? 0)}
                                        </div>
                                        <p className="text-sm text-emerald-100 mt-2">
                                            {detailedStatistics?.period ? 'En el período' : 'Total histórico'}
                                        </p>
                                    </CardContent>
                                </Card>

                                {/* Nuevos usuarios */}
                                <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-purple-100">Nuevos Usuarios</CardTitle>
                                        <Users className="h-5 w-5 text-purple-100" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold">
                                            {detailedLoading ? '...' : (detailedStatistics?.newUsers ?? statistics?.newUsersThisMonth ?? 0)}
                                        </div>
                                        <p className="text-sm text-purple-100 mt-2">
                                            {detailedStatistics?.period ? 'En el período' : 'Este mes'}
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Charts Section */}
                            {!detailedLoading && detailedStatistics ? (
                                <div id="charts-container" className="grid gap-8">
                                    {/* Revenue Chart */}
                                    <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm chart-container">
                                        <CardContent className="p-6">
                                            {detailedStatistics?.monthlyRevenue ? (
                                                <RevenueChart monthlyRevenue={detailedStatistics.monthlyRevenue} />
                                            ) : detailedStatistics?.dailyRevenue ? (
                                                <RevenueChart monthlyRevenue={detailedStatistics.dailyRevenue.map(d => ({ month: d.day, revenue: d.revenue }))} />
                                            ) : (
                                                <div className="h-80 flex items-center justify-center">
                                                    <p className="text-muted-foreground">No hay datos de ingresos disponibles</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Row with 3 charts */}
                                    <div className="grid gap-6 lg:grid-cols-3">
                                        {/* Turnos Chart */}
                                        <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm chart-container">
                                            <CardContent className="p-6">
                                                {detailedStatistics?.weeklyTurnos ? (
                                                    <TurnosChart weeklyTurnos={detailedStatistics.weeklyTurnos} />
                                                ) : detailedStatistics?.dailyTurnos ? (
                                                    <TurnosChart weeklyTurnos={detailedStatistics.dailyTurnos.map(d => ({ day: d.day, turnos: d.turnos }))} />
                                                ) : (
                                                    <div className="h-80 flex items-center justify-center">
                                                        <p className="text-muted-foreground">No hay datos de turnos disponibles</p>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>

                                        {/* Services Chart */}
                                        <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm chart-container">
                                            <CardContent className="p-6">
                                                <ServicesChart popularServices={statistics?.popularServices?.map(s => ({ name: s.name, count: s.count.toString() })) || []} />
                                            </CardContent>
                                        </Card>

                                        {/* Status Chart */}
                                        <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm chart-container">
                                            <CardContent className="p-6">
                                                <StatusChart turnosStatus={detailedStatistics?.turnosStatus || []} />
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Top Clients (solo para datos filtrados) */}
                                    {detailedStatistics?.topClients && detailedStatistics.topClients.length > 0 && (
                                        <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <Users className="h-5 w-5 text-purple-500" />
                                                    Top Clientes del Período
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-4">
                                                    {detailedStatistics.topClients.slice(0, 10).map((client, index) => (
                                                        <div key={`${client.clientEmail}-${index}`} className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                                                                    index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                                                                        index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                                                                            'bg-gradient-to-r from-blue-400 to-blue-600'
                                                                    }`}>
                                                                    {index + 1}
                                                                </div>
                                                                <div>
                                                                    <p className="font-semibold text-gray-900">{client.clientName}</p>
                                                                    <p className="text-sm text-gray-600">{client.clientEmail}</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="font-bold text-green-600">{formatCurrency(client.totalSpent)}</p>
                                                                <p className="text-sm text-gray-500">{client.turnosCount} turnos</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Services List - Enhanced */}
                                    <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <TrendingUp className="h-5 w-5 text-yellow-500" />
                                                Ranking de Servicios Más Solicitados
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                {statistics?.popularServices && statistics.popularServices.length > 0 ? (
                                                    statistics.popularServices.map((service, index) => (
                                                        <div key={service.name} className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-100">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                                                                    index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                                                                        index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                                                                            'bg-gradient-to-r from-blue-400 to-blue-600'
                                                                    }`}>
                                                                    {index + 1}
                                                                </div>
                                                                <div>
                                                                    <h3 className="font-semibold text-gray-900">{service.name}</h3>
                                                                    <p className="text-sm text-gray-600">Servicio popular</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-2xl font-bold text-orange-600">{service.count}</span>
                                                                <p className="text-sm text-gray-500">solicitudes</p>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-8">
                                                        <p className="text-muted-foreground">No hay datos de servicios disponibles</p>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center py-12">
                                    <span className="loading loading-spinner loading-lg"></span>
                                </div>
                            )}
                        </TabsContent>

                        {/* PESTAÑA DE COTIZACIONES */}
                        <TabsContent value="quotations" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-primary" />
                                        Solicitudes de Cotización
                                    </CardTitle>
                                    <CardDescription>
                                        Gestiona las solicitudes de cotización automáticas y compara respuestas de proveedores
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {/* Filtros */}
                                    <div className="flex gap-2 mb-6">
                                        <Button
                                            variant={quotationFilter === 'all' ? 'default' : 'outline'}
                                            onClick={() => setQuotationFilter('all')}
                                            size="sm"
                                        >
                                            Todas ({quotationRequests.length})
                                        </Button>
                                        <Button
                                            variant={quotationFilter === 'pending' ? 'default' : 'outline'}
                                            onClick={() => setQuotationFilter('pending')}
                                            size="sm"
                                        >
                                            Pendientes ({quotationRequests.filter(q => q.status === 'PENDING').length})
                                        </Button>
                                        <Button
                                            variant={quotationFilter === 'completed' ? 'default' : 'outline'}
                                            onClick={() => setQuotationFilter('completed')}
                                            size="sm"
                                        >
                                            Aceptadas ({quotationRequests.filter(q => q.status === 'COMPLETED').length})
                                        </Button>
                                        <Button
                                            variant={quotationFilter === 'cancelled' ? 'default' : 'outline'}
                                            onClick={() => setQuotationFilter('cancelled')}
                                            size="sm"
                                        >
                                            Canceladas ({quotationRequests.filter(q => q.status === 'CANCELLED').length})
                                        </Button>
                                    </div>

                                    {getFilteredQuotations().length === 0 ? (
                                        <div className="text-center py-12 text-muted-foreground">
                                            <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                            <p className="text-lg font-medium">
                                                {quotationFilter === 'all'
                                                    ? 'No hay solicitudes de cotización'
                                                    : `No hay cotizaciones ${quotationFilter === 'pending' ? 'pendientes' : quotationFilter === 'completed' ? 'aceptadas' : 'canceladas'}`
                                                }
                                            </p>
                                            <p className="text-sm">
                                                {quotationFilter === 'all' && 'Las solicitudes se generan automáticamente cuando los productos llegan al stock mínimo'}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {getFilteredQuotations().map((request) => (
                                                <Card key={request.id} className="border-2">
                                                    <CardHeader>
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <CardTitle className="text-lg">Solicitud #{request.id}</CardTitle>
                                                                <CardDescription>
                                                                    {new Date(request.sentAt).toLocaleDateString('es-AR', {
                                                                        year: 'numeric',
                                                                        month: 'long',
                                                                        day: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                                </CardDescription>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <Badge variant={
                                                                    request.status === 'COMPLETED' ? 'default' :
                                                                        request.status === 'PENDING' ? 'secondary' :
                                                                            'destructive'
                                                                }>
                                                                    {request.status === 'COMPLETED' ? 'Completada' :
                                                                        request.status === 'PENDING' ? 'Pendiente' :
                                                                            'Cancelada'}
                                                                </Badge>
                                                                {request.status === 'PENDING' && (
                                                                    <Button
                                                                        variant="destructive"
                                                                        size="sm"
                                                                        onClick={async () => {
                                                                            try {
                                                                                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/quotation/requests/${request.id}/reject`, {
                                                                                    method: 'POST',
                                                                                    headers: {
                                                                                        'Authorization': `Bearer ${localStorage.getItem('jwt')}`
                                                                                    }
                                                                                })
                                                                                if (!response.ok) throw new Error('Error rejecting quotation')
                                                                                toast.success("Éxito", {
                                                                                    description: "Cotización cancelada correctamente.",
                                                                                })
                                                                                await fetchQuotationRequests()
                                                                            } catch (error) {
                                                                                console.error('Error rejecting quotation:', error)
                                                                                toast.error("Error", {
                                                                                    description: "No se pudo cancelar la cotización.",
                                                                                })
                                                                            }
                                                                        }}
                                                                    >
                                                                        <X className="h-4 w-4 mr-1" />
                                                                        Cancelar
                                                                    </Button>
                                                                )}
                                                                {request.status === 'COMPLETED' && (
                                                                    <Button
                                                                        variant="default"
                                                                        size="sm"
                                                                        className="bg-green-600 hover:bg-green-700"
                                                                        onClick={() => {
                                                                            setQuotationToMarkReceived(request.id)
                                                                            setIsReceivedConfirmDialogOpen(true)
                                                                        }}
                                                                    >
                                                                        <CheckCircle className="h-4 w-4 mr-1" />
                                                                        Marcar como Recibido
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="space-y-4">
                                                        <div>
                                                            <h4 className="font-semibold mb-2">Productos solicitados:</h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                {request.products.map((product) => (
                                                                    <Badge key={product.id} variant="outline">
                                                                        {product.name}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <h4 className="font-semibold mb-2">Proveedores consultados:</h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                {request.suppliers.map((supplier) => (
                                                                    <Badge key={supplier.id} variant="secondary">
                                                                        {supplier.name}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {request.notes && (
                                                            <div className="bg-muted p-3 rounded-lg">
                                                                <p className="text-sm text-muted-foreground">{request.notes}</p>
                                                            </div>
                                                        )}

                                                        <Button
                                                            onClick={() => {
                                                                if (selectedQuotationRequest?.id === request.id) {
                                                                    setSelectedQuotationRequest(null)
                                                                    setQuotationResponses([])
                                                                } else {
                                                                    setSelectedQuotationRequest(request)
                                                                    fetchQuotationResponses(request.id)
                                                                }
                                                            }}
                                                            className="w-full"
                                                            variant={selectedQuotationRequest?.id === request.id ? "secondary" : "default"}
                                                        >
                                                            {selectedQuotationRequest?.id === request.id ? 'Ocultar' : 'Ver'} Cotizaciones ({request.responses?.length || 0})
                                                        </Button>

                                                        {/* Mostrar cotizaciones inline debajo de cada solicitud */}
                                                        {selectedQuotationRequest?.id === request.id && quotationResponses.length > 0 && (
                                                            <div className="mt-4 border-t pt-4 space-y-4">
                                                                <h4 className="font-semibold text-lg">Comparación de Cotizaciones</h4>

                                                                <Table>
                                                                    <TableHeader>
                                                                        <TableRow>
                                                                            <TableHead>Proveedor</TableHead>
                                                                            <TableHead>Monto Total</TableHead>
                                                                            <TableHead>Días de Entrega</TableHead>
                                                                            <TableHead>Condiciones de Pago</TableHead>
                                                                            <TableHead>Estado</TableHead>
                                                                            <TableHead>Acción</TableHead>
                                                                        </TableRow>
                                                                    </TableHeader>
                                                                    <TableBody>
                                                                        {quotationResponses.map((response) => (
                                                                            <TableRow key={response.id} className={response.isWinner ? 'bg-green-50' : ''}>
                                                                                <TableCell className="font-medium">
                                                                                    {response.supplier.name}
                                                                                    {response.isWinner && (
                                                                                        <Badge variant="default" className="ml-2 bg-green-600">
                                                                                            Ganador
                                                                                        </Badge>
                                                                                    )}
                                                                                </TableCell>
                                                                                <TableCell className="font-bold text-lg">
                                                                                    ${response.totalAmount.toLocaleString('es-AR')}
                                                                                </TableCell>
                                                                                <TableCell>{response.deliveryDays} días</TableCell>
                                                                                <TableCell>{response.paymentTerms}</TableCell>
                                                                                <TableCell>
                                                                                    <Badge variant={
                                                                                        response.status === 'ACCEPTED' ? 'default' :
                                                                                            response.status === 'REJECTED' ? 'destructive' :
                                                                                                'secondary'
                                                                                    }>
                                                                                        {response.status === 'ACCEPTED' ? 'Aceptada' :
                                                                                            response.status === 'REJECTED' ? 'Rechazada' :
                                                                                                'Pendiente'}
                                                                                    </Badge>
                                                                                </TableCell>
                                                                                <TableCell>
                                                                                    {!response.isWinner && request.status === 'PENDING' && (
                                                                                        <Button
                                                                                            size="sm"
                                                                                            onClick={() => handleSelectWinner(request.id, response.id)}
                                                                                        >
                                                                                            Seleccionar
                                                                                        </Button>
                                                                                    )}
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        ))}
                                                                    </TableBody>
                                                                </Table>

                                                                {/* Desglose por producto */}
                                                                <div className="mt-6">
                                                                    <h4 className="font-semibold mb-4">Desglose por Producto</h4>
                                                                    {quotationResponses.map((response) => (
                                                                        <Card key={response.id} className="mb-4">
                                                                            <CardHeader>
                                                                                <CardTitle className="text-md">{response.supplier.name}</CardTitle>
                                                                                {response.notes && (
                                                                                    <CardDescription>{response.notes}</CardDescription>
                                                                                )}
                                                                            </CardHeader>
                                                                            <CardContent>
                                                                                <Table>
                                                                                    <TableHeader>
                                                                                        <TableRow>
                                                                                            <TableHead>Producto</TableHead>
                                                                                            <TableHead>Precio Unitario</TableHead>
                                                                                            <TableHead>Cantidad</TableHead>
                                                                                            <TableHead>Disponibilidad</TableHead>
                                                                                            <TableHead>Subtotal</TableHead>
                                                                                        </TableRow>
                                                                                    </TableHeader>
                                                                                    <TableBody>
                                                                                        {response.productQuotes.map((quote, idx) => (
                                                                                            <TableRow key={idx}>
                                                                                                <TableCell>{quote.productName}</TableCell>
                                                                                                <TableCell>${quote.unitPrice.toLocaleString('es-AR')}</TableCell>
                                                                                                <TableCell>{quote.quantity}</TableCell>
                                                                                                <TableCell>
                                                                                                    <Badge variant={quote.availability.includes('inmediato') ? 'default' : 'secondary'}>
                                                                                                        {quote.availability}
                                                                                                    </Badge>
                                                                                                </TableCell>
                                                                                                <TableCell className="font-semibold">
                                                                                                    ${(quote.unitPrice * quote.quantity).toLocaleString('es-AR')}
                                                                                                </TableCell>
                                                                                            </TableRow>
                                                                                        ))}
                                                                                    </TableBody>
                                                                                </Table>
                                                                            </CardContent>
                                                                        </Card>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* PESTAÑA DE CONFIGURACIÓN */}
                        <TabsContent value="config" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Settings className="h-5 w-5 text-primary" />
                                        Configuración de Cotizaciones
                                    </CardTitle>
                                    <CardDescription>
                                        Configura los umbrales para el envío automático de solicitudes de cotización
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleUpdateQuotationThresholds} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <Card className="border-2 border-red-200 bg-red-50">
                                                <CardHeader>
                                                    <CardTitle className="text-lg flex items-center gap-2">
                                                        <Badge variant="destructive">ALTA</Badge>
                                                        Prioridad Alta
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    <div>
                                                        <Label htmlFor="threshold-high">Número de productos</Label>
                                                        <Input
                                                            id="threshold-high"
                                                            type="number"
                                                            min="1"
                                                            value={quotationThresholds.high}
                                                            onChange={(e) => setQuotationThresholds({
                                                                ...quotationThresholds,
                                                                high: Number(e.target.value)
                                                            })}
                                                            required
                                                        />
                                                        <p className="text-xs text-muted-foreground mt-2">
                                                            Enviar cotización cuando <strong>{quotationThresholds.high}</strong> producto(s) de prioridad alta lleguen al stock mínimo
                                                        </p>
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            <Card className="border-2 border-yellow-200 bg-yellow-50">
                                                <CardHeader>
                                                    <CardTitle className="text-lg flex items-center gap-2">
                                                        <Badge className="bg-yellow-500">MEDIA</Badge>
                                                        Prioridad Media
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    <div>
                                                        <Label htmlFor="threshold-medium">Número de productos</Label>
                                                        <Input
                                                            id="threshold-medium"
                                                            type="number"
                                                            min="1"
                                                            value={quotationThresholds.medium}
                                                            onChange={(e) => setQuotationThresholds({
                                                                ...quotationThresholds,
                                                                medium: Number(e.target.value)
                                                            })}
                                                            required
                                                        />
                                                        <p className="text-xs text-muted-foreground mt-2">
                                                            Enviar cotización cuando <strong>{quotationThresholds.medium}</strong> producto(s) de prioridad media lleguen al stock mínimo
                                                        </p>
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            <Card className="border-2 border-gray-200 bg-gray-50">
                                                <CardHeader>
                                                    <CardTitle className="text-lg flex items-center gap-2">
                                                        <Badge variant="secondary">BAJA</Badge>
                                                        Prioridad Baja
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    <div>
                                                        <Label htmlFor="threshold-low">Número de productos</Label>
                                                        <Input
                                                            id="threshold-low"
                                                            type="number"
                                                            min="1"
                                                            value={quotationThresholds.low}
                                                            onChange={(e) => setQuotationThresholds({
                                                                ...quotationThresholds,
                                                                low: Number(e.target.value)
                                                            })}
                                                            required
                                                        />
                                                        <p className="text-xs text-muted-foreground mt-2">
                                                            Enviar cotización cuando <strong>{quotationThresholds.low}</strong> producto(s) de prioridad baja lleguen al stock mínimo
                                                        </p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                                            <h4 className="font-semibold text-blue-900 mb-2">ℹ️ Cómo funciona</h4>
                                            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                                                <li>El sistema agrupa productos por prioridad cuando llegan al stock mínimo</li>
                                                <li>Cuando se alcanza el umbral configurado, se envía automáticamente una solicitud de cotización</li>
                                                <li>Los proveedores asignados a esos productos reciben el email de cotización</li>
                                                <li>Las respuestas se generan automáticamente con datos de prueba para demostración</li>
                                            </ul>
                                        </div>

                                        <Button type="submit" className="w-full" size="lg">
                                            <Save className="h-4 w-4 mr-2" />
                                            Guardar Configuración
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </TabsContent >

                        {/* PESTAÑA DE AUDITORÍA */}
                        < TabsContent value="auditoria" className="space-y-6" >
                            {/* Header */}
                            < div className="flex items-center justify-between" >
                                <div>
                                    <h2 className="text-2xl font-bold">Auditoría del Sistema</h2>
                                    <p className="text-muted-foreground">Monitoreo completo de actividades y cambios</p>
                                </div>
                            </div >

                            {/* Resumen de Actividad */}
                            < ActivitySummary
                                registrosHoy={detailedAuditoriaStats.registrosHoy}
                                registrosAyer={detailedAuditoriaStats.registrosAyer}
                                registrosEstaSemana={detailedAuditoriaStats.registrosEstaSemana}
                                registrosSemanaAnterior={detailedAuditoriaStats.registrosSemanaAnterior}
                                crecimientoHoy={detailedAuditoriaStats.crecimientoHoy}
                                crecimientoSemana={detailedAuditoriaStats.crecimientoSemana}
                                usuariosMasActivos={detailedAuditoriaStats.usuariosMasActivos}
                            />

                            {/* Estadísticas de auditoría */}
                            < div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" >
                                <Card className="border-l-4 border-l-blue-500">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Total Registros</p>
                                                <p className="text-2xl font-bold">
                                                    {detailedAuditoriaStats.totalRegistros.toLocaleString()}
                                                </p>
                                                <p className="text-xs text-muted-foreground">Histórico completo</p>
                                            </div>
                                            <FileText className="h-8 w-8 text-blue-600 bg-blue-100 p-1.5 rounded-full" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-l-4 border-l-green-500">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Registros Hoy</p>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-2xl font-bold">{detailedAuditoriaStats.registrosHoy}</p>
                                                    {getTrendIcon(detailedAuditoriaStats.crecimientoHoy)}
                                                </div>
                                                <p className={`text-xs ${getTrendColor(detailedAuditoriaStats.crecimientoHoy)}`}>
                                                    {detailedAuditoriaStats.crecimientoHoy > 0 ? "+" : ""}
                                                    {detailedAuditoriaStats.crecimientoHoy}% vs ayer ({detailedAuditoriaStats.registrosAyer})
                                                </p>
                                            </div>
                                            <Calendar className="h-8 w-8 text-green-600 bg-green-100 p-1.5 rounded-full" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-l-4 border-l-purple-500">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Esta Semana</p>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-2xl font-bold">{detailedAuditoriaStats.registrosEstaSemana}</p>
                                                    {getTrendIcon(detailedAuditoriaStats.crecimientoSemana)}
                                                </div>
                                                <p className={`text-xs ${getTrendColor(detailedAuditoriaStats.crecimientoSemana)}`}>
                                                    {detailedAuditoriaStats.crecimientoSemana > 0 ? "+" : ""}
                                                    {detailedAuditoriaStats.crecimientoSemana}% vs semana anterior ({detailedAuditoriaStats.registrosSemanaAnterior})
                                                </p>
                                            </div>
                                            <Activity className="h-8 w-8 text-purple-600 bg-purple-100 p-1.5 rounded-full" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-l-4 border-l-orange-500">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Este Mes</p>
                                                <p className="text-2xl font-bold">{detailedAuditoriaStats.registrosEsteMes}</p>
                                                <p className="text-xs text-muted-foreground">Actividad mensual</p>
                                            </div>
                                            <TrendingUp className="h-8 w-8 text-orange-600 bg-orange-100 p-1.5 rounded-full" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div >

                            {/* Estadísticas Adicionales */}
                            < div className="grid grid-cols-1 md:grid-cols-3 gap-4" >
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Acciones Más Comunes</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {detailedAuditoriaStats.accionesMasComunes.slice(0, 5).map((accion, index) => (
                                                <div key={accion.accion} className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                                                        <span className="text-sm">{accion.accion}</span>
                                                    </div>
                                                    <span className="text-sm font-bold">{accion.cantidad}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Entidades Más Auditadas</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {detailedAuditoriaStats.entidadesMasAuditadas.slice(0, 5).map((entidad, index) => (
                                                <div key={entidad.entidad} className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-green-600">#{index + 1}</span>
                                                        <span className="text-sm">{entidad.entidad}</span>
                                                    </div>
                                                    <span className="text-sm font-bold">{entidad.cantidad}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Users className="h-4 w-4" />
                                            Usuarios Más Activos
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {detailedAuditoriaStats.usuariosMasActivos.slice(0, 5).map((usuario, index) => (
                                                <div key={usuario.usuario} className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-purple-600">#{index + 1}</span>
                                                        <span className="text-sm truncate max-w-[120px]" title={usuario.usuario}>
                                                            {usuario.usuario}
                                                        </span>
                                                    </div>
                                                    <span className="text-sm font-bold">{usuario.cantidad}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div >

                            {/* Actividad por Horas */}
                            < div className="mb-6" >
                                <HourlyActivity distribucionPorHora={detailedAuditoriaStats.distribucionPorHora} />
                            </div >

                            {/* Filtros */}
                            < Card >
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Filter className="h-5 w-5" />
                                        Filtros de Búsqueda
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                            <div className="text-sm font-medium mb-1">Acción</div>
                                            <Select
                                                value={auditoriaFilters.accion}
                                                onValueChange={(value) => handleAuditoriaFilterChange("accion", value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Todas las acciones" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ALL">Todas las acciones</SelectItem>
                                                    <SelectItem value="CREAR">CREAR</SelectItem>
                                                    <SelectItem value="ACTUALIZAR">ACTUALIZAR</SelectItem>
                                                    <SelectItem value="ELIMINAR">ELIMINAR</SelectItem>
                                                    <SelectItem value="LOGIN">LOGIN</SelectItem>
                                                    <SelectItem value="LOGOUT">LOGOUT</SelectItem>
                                                    <SelectItem value="MARCAR_COMPLETADO">MARCAR_COMPLETADO</SelectItem>
                                                    <SelectItem value="MARCAR_PAGADO">MARCAR_PAGADO</SelectItem>
                                                    <SelectItem value="CANCELAR">CANCELAR</SelectItem>
                                                    <SelectItem value="MODIFICAR_ROL">MODIFICAR_ROL</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <div className="text-sm font-medium mb-1">Entidad</div>
                                            <Select
                                                value={auditoriaFilters.entidad}
                                                onValueChange={(value) => handleAuditoriaFilterChange("entidad", value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Todas las entidades" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ALL">Todas las entidades</SelectItem>
                                                    <SelectItem value="USUARIO">USUARIO</SelectItem>
                                                    <SelectItem value="TURNO">TURNO</SelectItem>
                                                    <SelectItem value="SERVICIO">SERVICIO</SelectItem>
                                                    <SelectItem value="PRODUCTO">PRODUCTO</SelectItem>
                                                    <SelectItem value="PROVEEDOR">PROVEEDOR</SelectItem>
                                                    <SelectItem value="PAGO">PAGO</SelectItem>
                                                    <SelectItem value="CAR">CAR</SelectItem>
                                                    <SelectItem value="SISTEMA">SISTEMA</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <div className="text-sm font-medium mb-1">Límite</div>
                                            <Select
                                                value={auditoriaFilters.limit}
                                                onValueChange={(value) => handleAuditoriaRecordsPerPageChange(value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="5">5 registros</SelectItem>
                                                    <SelectItem value="10">10 registros</SelectItem>
                                                    <SelectItem value="25">25 registros</SelectItem>
                                                    <SelectItem value="50">50 registros</SelectItem>
                                                    <SelectItem value="100">100 registros</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex gap-2 items-end">
                                            <Button onClick={applyAuditoriaFilters} className="flex-1">
                                                <Search className="h-4 w-4 mr-2" />
                                                Buscar
                                            </Button>
                                            <Button variant="outline" onClick={clearAuditoriaFilters}>
                                                <RefreshCw className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card >

                            {/* Resumen de registros */}
                            < RecordsSummary
                                totalRecords={detailedAuditoriaStats.totalRegistros}
                                currentPage={auditoriaCurrentPage}
                                recordsPerPage={parseInt(auditoriaFilters.limit)}
                                filteredRecords={auditoriaTotalRecords}
                                hasFilters={hasActiveAuditoriaFilters()}
                            />

                            {/* Registros */}
                            < Card >
                                <CardHeader>
                                    <CardTitle>Registros de Auditoría</CardTitle>
                                    <CardDescription>
                                        {auditoriaTotalRecords > 0 ? (
                                            <>Página {auditoriaCurrentPage} de {auditoriaTotalPages}</>
                                        ) : (
                                            "No hay registros para mostrar"
                                        )}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {auditoriaDetailedLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <span className="loading loading-spinner loading-lg"></span>
                                        </div>
                                    ) : detailedAuditoriaRecords.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            No hay registros de auditoría disponibles.
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {detailedAuditoriaRecords.map((record) => (
                                                <div key={record.id} className="border rounded-lg p-4 space-y-4">
                                                    <AuditSummary
                                                        accion={record.accion}
                                                        entidad={record.entidad}
                                                        entidadId={record.entidadId}
                                                        descripcion={record.descripcion}
                                                        datosAnteriores={record.datosAnteriores}
                                                        datosNuevos={record.datosNuevos}
                                                    />

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <UserInfo
                                                            usuario={record.usuario}
                                                            ip={record.ip}
                                                            fechaCreacion={record.fechaCreacion}
                                                        />
                                                        <DataComparison
                                                            datosAnteriores={record.datosAnteriores}
                                                            datosNuevos={record.datosNuevos}
                                                            accion={record.accion}
                                                        />
                                                    </div>
                                                </div>
                                            ))}

                                            <PaginationControls
                                                currentPage={auditoriaCurrentPage}
                                                totalPages={auditoriaTotalPages}
                                                totalRecords={auditoriaTotalRecords}
                                                recordsPerPage={parseInt(auditoriaFilters.limit)}
                                                onPageChange={handleAuditoriaPageChange}
                                                onRecordsPerPageChange={handleAuditoriaRecordsPerPageChange}
                                                loading={auditoriaDetailedLoading}
                                            />
                                        </div>
                                    )}
                                </CardContent>
                            </Card >

                            {/* Análisis de acciones y entidades */}
                            < div className="grid grid-cols-1 md:grid-cols-2 gap-6" >
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
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${index === 0 ? 'bg-yellow-500' :
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
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${index === 0 ? 'bg-blue-500' :
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
                            </div >
                        </TabsContent >


                    </Tabs >
                </main >

                {/* DIALOG PARA SERVICIOS */}
                < Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen} >
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
                </Dialog >

                {/* DIALOG PARA PRODUCTOS */}
                < Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen} >
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
                                            <Package className="h-4 w-4" />
                                            Stock Actual
                                            {editingProduct && (
                                                <span className="badge badge-warning badge-sm">Editar stock</span>
                                            )}
                                        </Label>
                                        <Input
                                            id="product-stock"
                                            type="number"
                                            min="0"
                                            value={productForm.stock_actual}
                                            onChange={(e) => setProductForm({ ...productForm, stock_actual: Number(e.target.value) })}
                                            required
                                            className={editingProduct ? "border-warning" : ""}
                                        />
                                        {editingProduct && productForm.stock_actual !== originalStockValue && (
                                            <p className="text-xs text-warning flex items-center gap-1">
                                                <AlertTriangle className="h-3 w-3" />
                                                Este cambio requerirá confirmación al actualizar
                                            </p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            Cantidad actual disponible en inventario
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="product-stock-min" className="flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                                            Stock Mínimo
                                        </Label>
                                        <Input
                                            id="product-stock-min"
                                            type="number"
                                            min="0"
                                            value={productForm.stock_minimo}
                                            onChange={(e) => setProductForm({ ...productForm, stock_minimo: Number(e.target.value) })}
                                            required
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Cantidad mínima antes de generar alerta de reposición
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="product-servicios-por-producto" className="flex items-center gap-2">
                                            <Wrench className="h-4 w-4 text-blue-500" />
                                            Rendimiento por Unidad
                                        </Label>
                                        <Input
                                            id="product-servicios-por-producto"
                                            type="number"
                                            min="1"
                                            value={productForm.servicios_por_producto}
                                            onChange={(e) => setProductForm({ ...productForm, servicios_por_producto: Number(e.target.value) })}
                                            required
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            ¿Cuántos servicios se pueden realizar con 1 unidad de este producto?
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="product-priority" className="flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                                            Prioridad de Reposición
                                        </Label>
                                        <Select
                                            value={productForm.priority}
                                            onValueChange={(value: 'ALTA' | 'MEDIA' | 'BAJA') =>
                                                setProductForm({ ...productForm, priority: value })
                                            }
                                        >
                                            <SelectTrigger id="product-priority">
                                                <SelectValue placeholder="Seleccionar prioridad" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ALTA">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="destructive" className="text-xs">ALTA</Badge>
                                                        <span className="text-xs text-muted-foreground">- Cotización inmediata</span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="MEDIA">
                                                    <div className="flex items-center gap-2">
                                                        <Badge className="bg-yellow-500 text-xs">MEDIA</Badge>
                                                        <span className="text-xs text-muted-foreground">- Cotización con 2 productos</span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="BAJA">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="secondary" className="text-xs">BAJA</Badge>
                                                        <span className="text-xs text-muted-foreground">- Cotización con 3 productos</span>
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground">
                                            Determina cuándo se envía automáticamente la solicitud de cotización
                                        </p>
                                    </div>
                                </div>

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
                </Dialog >

                {/* DIALOG PARA PROVEEDORES */}
                < Dialog open={isSupplierDialogOpen} onOpenChange={setIsSupplierDialogOpen} >
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
                </Dialog >

                {/* DIALOG PARA USUARIOS */}
                < Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen} >
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
                </Dialog >

                {/* DIALOG DE CONFIRMACIÓN DE ELIMINACIÓN */}
                < Dialog open={deleteConfirmDialog.isOpen} onOpenChange={(open) =>
                    setDeleteConfirmDialog({ ...deleteConfirmDialog, isOpen: open })
                }>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirmar eliminación</DialogTitle>
                            <DialogDescription>
                                ¿Estás seguro que deseas eliminar {deleteConfirmDialog.name}?
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
                </Dialog >

                {/* Modal de Confirmación de Cambio de Stock */}
                < Dialog open={isStockConfirmDialogOpen} onOpenChange={setIsStockConfirmDialogOpen} >
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
                </Dialog >

                {/* DIALOG PARA ENVIAR EMAIL A PROVEEDORES */}
                < Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen} >
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
                                        <div className="flex items-center gap-2 mb-3">
                                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                                            <span className="font-medium text-amber-900">Seleccionar Productos para Solicitar</span>
                                        </div>
                                        <div className="text-sm text-amber-800 mb-3">
                                            <p>Marca los productos que deseas incluir en la solicitud de reposición:</p>
                                        </div>

                                        <div className="space-y-2 max-h-60 overflow-y-auto">
                                            {lowStockProducts.map((product) => {
                                                const isSupplierProduct = product.suppliers && product.suppliers.some(s => s.id === selectedSupplier?.id);
                                                const isSelected = selectedProducts.includes(product.id);

                                                return (
                                                    <div
                                                        key={product.id}
                                                        className={`bg-white p-3 rounded border transition-all ${isSelected ? 'border-blue-300 bg-blue-50' : 'border-amber-200'
                                                            } ${!isSupplierProduct ? 'opacity-50' : ''}`}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <input
                                                                type="checkbox"
                                                                id={`product-${product.id}`}
                                                                checked={isSelected}
                                                                onChange={(e) => handleProductSelection(product.id, e.target.checked)}
                                                                className="checkbox checkbox-sm mt-1"
                                                                disabled={!isSupplierProduct}
                                                            />
                                                            <label
                                                                htmlFor={`product-${product.id}`}
                                                                className="flex-1 cursor-pointer"
                                                                aria-label={`Seleccionar producto ${product.name}`}
                                                            >
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <span className={`font-medium ${isSelected ? 'text-blue-900' : 'text-amber-900'}`}>
                                                                            {product.name}
                                                                        </span>
                                                                        <div className="flex gap-4 text-xs text-amber-700 mt-1">
                                                                            <span>Stock: <strong className="text-red-600">{product.stock_actual}</strong></span>
                                                                            <span>Mínimo: <strong>{product.stock_minimo}</strong></span>
                                                                            <span>Por servicio: <strong>{product.servicios_por_producto || 1}</strong></span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex flex-col items-end gap-1">
                                                                        <Badge
                                                                            variant="outline"
                                                                            className={`text-xs ${isSupplierProduct ? 'text-green-700 border-green-300' : 'text-gray-500 border-gray-300'}`}
                                                                        >
                                                                            {isSupplierProduct ? 'Asignado' : 'No asignado'}
                                                                        </Badge>
                                                                        {isSelected && (
                                                                            <Badge variant="default" className="text-xs bg-blue-600">
                                                                                Seleccionado
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </label>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                        {selectedProducts.length > 0 && (
                                            <div className="mt-3 p-2 bg-blue-100 rounded border border-blue-200">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle className="h-4 w-4 text-blue-600" />
                                                    <span className="text-sm font-medium text-blue-800">
                                                        {selectedProducts.length} producto(s) seleccionado(s) para incluir en el email
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                        <div className="mt-2 text-xs text-amber-600">
                                            <p>💡 Solo se pueden seleccionar productos asignados a este proveedor. El mensaje se actualizará automáticamente.</p>
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

                {/* Modal de Confirmación de Cotización Recibida */}
                <Dialog open={isReceivedConfirmDialogOpen} onOpenChange={setIsReceivedConfirmDialogOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="h-5 w-5" />
                                Confirmar Recepción de Productos
                            </DialogTitle>
                            <DialogDescription>
                                ¿Confirmas que los productos de esta cotización han sido recibidos?
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="bg-green-50 border border-green-200 p-4 rounded-lg space-y-2">
                                <p className="text-sm text-green-800 font-medium">
                                    Al confirmar, se actualizará automáticamente el stock de los productos según las cantidades cotizadas.
                                </p>
                                <div className="flex items-start gap-2 mt-3">
                                    <AlertTriangle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-green-700">
                                        Esta acción sumará las cantidades al stock actual de cada producto.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsReceivedConfirmDialogOpen(false)
                                    setQuotationToMarkReceived(null)
                                }}
                            >
                                <X className="h-4 w-4 mr-2" />
                                Cancelar
                            </Button>
                            <Button
                                type="button"
                                variant="default"
                                onClick={handleMarkAsReceived}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Confirmar Recepción
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div >
        </ProtectedRoute >
    )
}
