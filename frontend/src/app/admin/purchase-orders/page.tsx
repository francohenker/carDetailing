"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
    Package,
    Plus,
    Edit2,
    Trash2,
    ChevronLeft,
    CheckCircle,
    X,
    AlertTriangle,
    Calendar,
    Building2,
    FileText,
    Clock,
    TrendingUp
} from "lucide-react"
import { toast } from "sonner"
import HeaderDefault from "@/app/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import Link from "next/link"

interface Supplier {
    id: number
    name: string
    email: string
    phone: string
}

interface Product {
    id: number
    name: string
    price: number
    stock_actual: number
}

interface PurchaseOrderItem {
    id: number
    productoId: number
    producto: Product
    unitPrice: number
    quantityOrdered: number
    quantityReceived: number
    subtotal: number
    notes?: string
}

interface PurchaseOrder {
    id: number
    orderNumber: string
    supplier: Supplier
    supplierId: number
    quotationResponseId?: number
    items: PurchaseOrderItem[]
    status: 'PENDIENTE' | 'RECIBIDA' | 'PARCIAL' | 'CANCELADA'
    totalAmount: number
    notes?: string
    isAutomatic: boolean
    receivedAt?: string
    createdAt: string
    updatedAt: string
}

interface OrderItemForm {
    productoId: number
    unitPrice: number
    quantityOrdered: number
    notes?: string
}

interface OrderForm {
    supplierId: number
    items: OrderItemForm[]
    notes?: string
}

export default function PurchaseOrdersPage() {
    const router = useRouter()
    
    const [orders, setOrders] = useState<PurchaseOrder[]>([])
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    
    const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null)
    
    const [orderForm, setOrderForm] = useState<OrderForm>({
        supplierId: 0,
        items: [],
        notes: ''
    })
    
    const [currentItem, setCurrentItem] = useState<OrderItemForm>({
        productoId: 0,
        unitPrice: 0,
        quantityOrdered: 1,
        notes: ''
    })
    
    const [filterStatus, setFilterStatus] = useState<'all' | 'PENDIENTE' | 'RECIBIDA' | 'PARCIAL' | 'CANCELADA'>('all')

    useEffect(() => {
        fetchAllData()
    }, [])

    const fetchAllData = async () => {
        setLoading(true)
        try {
            await Promise.all([
                fetchOrders(),
                fetchSuppliers(),
                fetchProducts()
            ])
        } catch (error) {
            console.error('Error loading data:', error)
            toast.error("Error al cargar los datos")
        } finally {
            setLoading(false)
        }
    }

    const fetchOrders = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/purchase-orders`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwt')}`
                }
            })
            if (!response.ok) throw new Error('Error fetching orders')
            const data = await response.json()
            setOrders(data)
        } catch (error) {
            console.error('Error fetching orders:', error)
        }
    }

    const fetchSuppliers = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/supplier/getAll`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwt')}`
                }
            })
            if (!response.ok) throw new Error('Error fetching suppliers')
            const data = await response.json()
            setSuppliers(data.filter((s: Supplier & { isActive: boolean }) => s.isActive))
        } catch (error) {
            console.error('Error fetching suppliers:', error)
        }
    }

    const fetchProducts = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/producto/getAll`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwt')}`
                }
            })
            if (!response.ok) throw new Error('Error fetching products')
            const data = await response.json()
            setProducts(data.filter((p: Product & { isDeleted: boolean }) => !p.isDeleted))
        } catch (error) {
            console.error('Error fetching products:', error)
        }
    }

    const handleAddItem = () => {
        if (currentItem.productoId === 0) {
            toast.error("Selecciona un producto")
            return
        }
        if (currentItem.quantityOrdered <= 0) {
            toast.error("La cantidad debe ser mayor a 0")
            return
        }
        
        setOrderForm({
            ...orderForm,
            items: [...orderForm.items, currentItem]
        })
        
        setCurrentItem({
            productoId: 0,
            unitPrice: 0,
            quantityOrdered: 1,
            notes: ''
        })
    }

    const handleRemoveItem = (index: number) => {
        setOrderForm({
            ...orderForm,
            items: orderForm.items.filter((_, i) => i !== index)
        })
    }

    const handleSubmitOrder = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (orderForm.supplierId === 0) {
            toast.error("Selecciona un proveedor")
            return
        }
        
        if (orderForm.items.length === 0) {
            toast.error("Agrega al menos un producto")
            return
        }
        
        setActionLoading('submit-order')
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/purchase-orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('jwt')}`
                },
                body: JSON.stringify(orderForm)
            })
            
            if (!response.ok) throw new Error('Error creating order')
            
            toast.success("Orden de compra creada correctamente")
            setIsOrderDialogOpen(false)
            resetForm()
            fetchOrders()
        } catch (error) {
            console.error('Error creating order:', error)
            toast.error("Error al crear la orden de compra")
        } finally {
            setActionLoading(null)
        }
    }

    const handleMarkAsReceived = async (orderId: number) => {
        setActionLoading(`mark-received-${orderId}`)
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/purchase-orders/${orderId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('jwt')}`
                },
                body: JSON.stringify({
                    status: 'RECIBIDA',
                    receivedAt: new Date()
                })
            })
            
            if (!response.ok) throw new Error('Error updating order status')
            
            toast.success("Orden marcada como recibida y stock actualizado")
            fetchOrders()
        } catch (error) {
            console.error('Error updating order:', error)
            toast.error("Error al actualizar la orden")
        } finally {
            setActionLoading(null)
        }
    }

    const handleDeleteOrder = async (orderId: number) => {
        if (!confirm('¿Estás seguro de eliminar esta orden?')) return
        
        setActionLoading(`delete-${orderId}`)
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/purchase-orders/${orderId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwt')}`
                }
            })
            
            if (!response.ok) throw new Error('Error deleting order')
            
            toast.success("Orden eliminada correctamente")
            fetchOrders()
        } catch (error) {
            console.error('Error deleting order:', error)
            toast.error("Error al eliminar la orden")
        } finally {
            setActionLoading(null)
        }
    }

    const resetForm = () => {
        setOrderForm({
            supplierId: 0,
            items: [],
            notes: ''
        })
        setCurrentItem({
            productoId: 0,
            unitPrice: 0,
            quantityOrdered: 1,
            notes: ''
        })
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDIENTE':
                return 'bg-yellow-100 text-yellow-800'
            case 'RECIBIDA':
                return 'bg-green-100 text-green-800'
            case 'PARCIAL':
                return 'bg-blue-100 text-blue-800'
            case 'CANCELADA':
                return 'bg-red-100 text-red-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const filteredOrders = orders.filter(order => 
        filterStatus === 'all' || order.status === filterStatus
    )

    const stats = {
        total: orders.length,
        pending: orders.filter(o => o.status === 'PENDIENTE').length,
        received: orders.filter(o => o.status === 'RECIBIDA').length,
        partial: orders.filter(o => o.status === 'PARCIAL').length
    }

    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <div className="min-h-screen bg-base-100">
                <HeaderDefault />
                <main className="container mx-auto p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <Link href="/admin" className="text-muted-foreground hover:text-foreground">
                            <ChevronLeft className="h-4 w-4" />
                        </Link>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Package className="h-8 w-8 text-primary" />
                            Órdenes de Compra
                        </h1>
                    </div>

                    {/* Estadísticas */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Órdenes</p>
                                        <p className="text-2xl font-bold">{stats.total}</p>
                                    </div>
                                    <FileText className="h-8 w-8 text-blue-500" />
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Pendientes</p>
                                        <p className="text-2xl font-bold">{stats.pending}</p>
                                    </div>
                                    <Clock className="h-8 w-8 text-yellow-500" />
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Recibidas</p>
                                        <p className="text-2xl font-bold">{stats.received}</p>
                                    </div>
                                    <CheckCircle className="h-8 w-8 text-green-500" />
                                </div>
                            </CardContent>
                        </Card>
                        
                        {/* <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Parciales</p>
                                        <p className="text-2xl font-bold">{stats.partial}</p>
                                    </div>
                                    <TrendingUp className="h-8 w-8 text-blue-500" />
                                </div>
                            </CardContent>
                        </Card> */}
                    </div>

                    {/* Controles */}
                    <Card className="mb-6">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div>
                                    <CardTitle>Gestión de Órdenes</CardTitle>
                                    <CardDescription>
                                        Crea y administra órdenes de compra manualmente o desde cotizaciones
                                    </CardDescription>
                                </div>
                                <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas</SelectItem>
                                        <SelectItem value="PENDIENTE">Pendientes</SelectItem>
                                        <SelectItem value="RECIBIDA">Recibidas</SelectItem>
                                        {/* <SelectItem value="PARCIAL">Parciales</SelectItem> */}
                                        <SelectItem value="CANCELADA">Canceladas</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={() => setIsOrderDialogOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Nueva Orden
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <span className="loading loading-spinner loading-lg"></span>
                                </div>
                            ) : filteredOrders.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No hay órdenes de compra
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>N° Orden</TableHead>
                                            <TableHead>Proveedor</TableHead>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead>Items</TableHead>
                                            <TableHead>Total</TableHead>
                                            <TableHead>Estado</TableHead>
                                            <TableHead>Fecha Recepción</TableHead>
                                            <TableHead>Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredOrders.map((order) => (
                                            <TableRow key={order.id}>
                                                <TableCell className="font-medium">
                                                    {order.orderNumber}
                                                    {order.isAutomatic && (
                                                        <Badge variant="outline" className="ml-2 text-xs">
                                                            Auto
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{order.supplier.name}</div>
                                                        <div className="text-sm text-muted-foreground">{order.supplier.email}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(order.createdAt).toLocaleDateString('es-AR')}
                                                </TableCell>
                                                <TableCell>
                                                    <button
                                                        onClick={() => setSelectedOrder(order)}
                                                        className="text-blue-600 hover:underline"
                                                    >
                                                        {order.items.length} producto(s)
                                                    </button>
                                                </TableCell>
                                                <TableCell className="font-bold">
                                                    ${order.totalAmount.toLocaleString('es-AR')}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={getStatusColor(order.status)}>
                                                        {order.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {order.receivedAt ? (
                                                        new Date(order.receivedAt).toLocaleDateString('es-AR')
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        {order.status === 'PENDIENTE' && (
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleMarkAsReceived(order.id)}
                                                                disabled={actionLoading === `mark-received-${order.id}`}
                                                            >
                                                                {actionLoading === `mark-received-${order.id}` ? (
                                                                    <span className="loading loading-spinner loading-xs"></span>
                                                                ) : (
                                                                    <>
                                                                        <CheckCircle className="h-4 w-4 mr-1" />
                                                                        Recibida
                                                                    </>
                                                                )}
                                                            </Button>
                                                        )}
                                                        {order.status === 'PENDIENTE' && (
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() => handleDeleteOrder(order.id)}
                                                                disabled={actionLoading === `delete-${order.id}`}
                                                            >
                                                                {actionLoading === `delete-${order.id}` ? (
                                                                    <span className="loading loading-spinner loading-xs"></span>
                                                                ) : (
                                                                    <Trash2 className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </main>

                {/* Dialog para crear orden */}
                <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Nueva Orden de Compra</DialogTitle>
                            <DialogDescription>
                                Crea una orden de compra manual seleccionando proveedor y productos
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmitOrder} className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <Label>Proveedor *</Label>
                                    <Select
                                        value={orderForm.supplierId.toString()}
                                        onValueChange={(v) => setOrderForm({ ...orderForm, supplierId: Number(v) })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar proveedor" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {suppliers.map((supplier) => (
                                                <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                                    {supplier.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="border rounded-lg p-4 space-y-4">
                                    <h3 className="font-semibold">Agregar Productos</h3>
                                    <div className="grid grid-cols-4 gap-4">
                                        <div>
                                            <Label>Producto</Label>
                                            <Select
                                                value={currentItem.productoId.toString()}
                                                onValueChange={(v) => {
                                                    const product = products.find(p => p.id === Number(v))
                                                    setCurrentItem({
                                                        ...currentItem,
                                                        productoId: Number(v),
                                                        unitPrice: product?.price || 0
                                                    })
                                                }}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {products.map((product) => (
                                                        <SelectItem key={product.id} value={product.id.toString()}>
                                                            {product.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label>Precio Unitario</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={currentItem.unitPrice}
                                                onChange={(e) => setCurrentItem({ ...currentItem, unitPrice: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div>
                                            <Label>Cantidad</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={currentItem.quantityOrdered}
                                                onChange={(e) => setCurrentItem({ ...currentItem, quantityOrdered: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div className="flex items-end">
                                            <Button type="button" onClick={handleAddItem} className="w-full">
                                                <Plus className="h-4 w-4 mr-2" />
                                                Agregar
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {orderForm.items.length > 0 && (
                                    <div className="border rounded-lg p-4">
                                        <h3 className="font-semibold mb-4">Productos en la Orden</h3>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Producto</TableHead>
                                                    <TableHead>Precio Unit.</TableHead>
                                                    <TableHead>Cantidad</TableHead>
                                                    <TableHead>Subtotal</TableHead>
                                                    <TableHead></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {orderForm.items.map((item, index) => {
                                                    const product = products.find(p => p.id === item.productoId)
                                                    const subtotal = item.unitPrice * item.quantityOrdered
                                                    return (
                                                        <TableRow key={index}>
                                                            <TableCell>{product?.name}</TableCell>
                                                            <TableCell>${item.unitPrice.toLocaleString()}</TableCell>
                                                            <TableCell>{item.quantityOrdered}</TableCell>
                                                            <TableCell className="font-bold">${subtotal.toLocaleString()}</TableCell>
                                                            <TableCell>
                                                                <Button
                                                                    type="button"
                                                                    variant="destructive"
                                                                    size="sm"
                                                                    onClick={() => handleRemoveItem(index)}
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    )
                                                })}
                                                <TableRow>
                                                    <TableCell colSpan={3} className="text-right font-bold">Total:</TableCell>
                                                    <TableCell className="font-bold text-lg">
                                                        ${orderForm.items.reduce((sum, item) => sum + (item.unitPrice * item.quantityOrdered), 0).toLocaleString()}
                                                    </TableCell>
                                                    <TableCell></TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}

                                <div>
                                    <Label>Notas (opcional)</Label>
                                    <Textarea
                                        value={orderForm.notes}
                                        onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                                        placeholder="Observaciones sobre la orden..."
                                    />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => { setIsOrderDialogOpen(false); resetForm(); }}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={actionLoading === 'submit-order'}>
                                    {actionLoading === 'submit-order' ? (
                                        <span className="loading loading-spinner loading-sm mr-2"></span>
                                    ) : null}
                                    Crear Orden
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Dialog para ver detalles */}
                <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
                    <DialogContent className="max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>Detalles de Orden #{selectedOrder?.orderNumber}</DialogTitle>
                        </DialogHeader>
                        {selectedOrder && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Proveedor</p>
                                        <p className="font-medium">{selectedOrder.supplier.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Estado</p>
                                        <Badge className={getStatusColor(selectedOrder.status)}>
                                            {selectedOrder.status}
                                        </Badge>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Fecha de Creación</p>
                                        <p className="font-medium">{new Date(selectedOrder.createdAt).toLocaleString('es-AR')}</p>
                                    </div>
                                    {selectedOrder.receivedAt && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">Fecha de Recepción</p>
                                            <p className="font-medium">{new Date(selectedOrder.receivedAt).toLocaleString('es-AR')}</p>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h3 className="font-semibold mb-2">Productos</h3>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Producto</TableHead>
                                                <TableHead>Precio Unit.</TableHead>
                                                <TableHead>Ordenado</TableHead>
                                                <TableHead>Recibido</TableHead>
                                                <TableHead>Subtotal</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selectedOrder.items.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell>{item.producto.name}</TableCell>
                                                    <TableCell>${item.unitPrice.toLocaleString()}</TableCell>
                                                    <TableCell>{item.quantityOrdered}</TableCell>
                                                    <TableCell>{item.quantityReceived}</TableCell>
                                                    <TableCell className="font-bold">${item.subtotal.toLocaleString()}</TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-right font-bold">Total:</TableCell>
                                                <TableCell className="font-bold text-lg">${selectedOrder.totalAmount.toLocaleString()}</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>

                                {selectedOrder.notes && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Notas</p>
                                        <p className="text-sm bg-muted p-3 rounded">{selectedOrder.notes}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </ProtectedRoute>
    )
}
