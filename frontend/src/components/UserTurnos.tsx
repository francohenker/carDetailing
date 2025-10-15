"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreditCard, DollarSign, Calendar, Car, X } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

// Utilidades de fecha nativas
const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date)
}

const formatShortDate = (dateString: string): string => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(date)
}

// Tipos de datos (puedes moverlos a un archivo de tipos si lo prefieres)
interface Turno {
    id: number;
    fechaHora: string;
    servicio: { name: string }[];
    car: { marca: string; model: string };
    totalPrice: number;
    pago: Pago[];
    estado: 'pendiente' | 'finalizado' | 'cancelado';
    metodoPago?: 'efectivo' | 'mercadopago';
}
interface Pago {
    id: number;
    monto: number;
    fecha_pago: string;
    metodo: 'EFECTIVO' | 'MERCADO_PAGO';  // Valores del enum
    estado: 'PENDIENTE' | 'PAGADO' | 'CANCELADO';  // Valores del enum
}

// Función helper para determinar si un turno está completamente pagado
const isTurnoPagado = (turno: Turno): boolean => {
    // Si no hay pagos, definitivamente no está pagado
    if (!turno.pago || turno.pago.length === 0) return false;

    // Suma todos los pagos COMPLETADOS
    const totalPagado = turno.pago
        .filter(p => p.estado === 'PAGADO')
        .reduce((sum, p) => sum + p.monto, 0);

    // Está pagado si el monto total pagado es igual o mayor al precio total
    return totalPagado >= turno.totalPrice;
};

// Función para obtener el método de pago dominante
const getMetodoPago = (turno: Turno): string => {
    console.log(turno.pago);
    if (!turno.pago || turno.pago.length === 0) return 'Sin pagos';

    // Obtener el método del pago más reciente que esté pagado
    const pagoCompletado = [...turno.pago]
        .filter(p => p.estado === 'PAGADO')
        .sort((a, b) => new Date(b.fecha_pago).getTime() - new Date(a.fecha_pago).getTime())[0];
    return pagoCompletado ? pagoCompletado.metodo : 'Pendiente';
};

const getMontoFaltante = (turno: Turno): number => {
    if (!turno.pago || turno.pago.length === 0) return turno.totalPrice;

    const totalPagado = turno.pago
        .filter(p => p.estado === 'PAGADO')
        .reduce((sum, p) => sum + p.monto, 0);

    return Math.max(0, turno.totalPrice - totalPagado);
};

export default function UserTurnos() {
    const [turnos, setTurnos] = useState<Turno[]>([])
    const [loading, setLoading] = useState(true)

    // Función para determinar si un turno se puede cancelar
    const canCancelTurno = (turno: Turno): boolean => {
        // Solo se puede cancelar si está en estado pendiente
        if (turno.estado !== 'pendiente') {
            return false
        }

        const turnoDate = new Date(turno.fechaHora)
        const now = new Date()
        const timeDiff = turnoDate.getTime() - now.getTime()
        const hoursDiff = timeDiff / (1000 * 3600)

        // Se puede cancelar si faltan más de 24 horas
        return hoursDiff > 24
    }

    // Función para cancelar un turno
    const handleCancelTurno = async (turnoId: number) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/turno/cancel/${turnoId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('jwt')}`
                }
            })

            if (!response.ok) throw new Error('Error canceling turno')

            toast.success("Éxito", {
                description: "Turno cancelado correctamente.",
            })

            // Recargar los turnos
            const updatedResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/turno/history`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`
                }
            })
            if (updatedResponse.ok) {
                const updatedData = await updatedResponse.json()
                setTurnos(updatedData)
            }
        } catch (error) {
            console.error('Error canceling turno:', error)
            toast.error("Error", {
                description: "No se pudo cancelar el turno."
            })
        }
    }

    useEffect(() => {
        const fetchTurnos = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/turno/history`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("jwt")}`
                    }
                });
                if (!response.ok) throw new Error("No se pudieron cargar los turnos.");
                const data = await response.json();
                setTurnos(data);
            } catch {
                toast.error("Error", {
                    description: "No se pudieron cargar los turnos. Intenta nuevamente más tarde.",
                });
            } finally {
                setLoading(false)
            }
        }

        fetchTurnos()
    }, [])

    const handlePagarMercadoPago = async (turno: Turno) => {
        try {
            const response = await fetch(`${process.env.MP_API}/checkout/preferences`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
                body: JSON.stringify({
                    "items": [
                        {
                            "title": turno.servicio.map(s => s.name).join(', '),
                            "quantity": 1,
                            "currency_id": "ARS",
                            "unit_price": turno.totalPrice
                        }
                    ],
                    "back_urls": {
                        "success": `${process.env.URL_FRONTEND}servicios`,
                        "failure": `${process.env.URL_FRONTEND}pago-fallido`,
                        "pending": `${process.env.URL_FRONTEND}pago-pendiente`
                    },
                    "auto_return": "approved"
                })
            });
            const data = await response.json();
            window.location.href = data.init_point;
        } catch (error ) {
            console.log("error: ",error);
            toast.error("Error", {
                description: "No se pudo iniciar el pago. Intenta nuevamente más tarde.",
            });
        }
    };


    const proximosTurnos = turnos
        .filter(t => t.estado !== 'finalizado') // Todos los turnos que NO están finalizados
        .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());

    const historialTurnos = turnos
        .filter(t => t.estado === 'finalizado') // Solo turnos finalizados
        .sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());

    if (loading) {
        return (
            <div className="text-center py-6">
                <span className="loading loading-spinner loading-lg"></span>
                <p className="text-muted-foreground mt-2">Cargando tus turnos...</p>
            </div>
        )
    }


    return (
        <div className="space-y-8">
            {/* Sección de Próximos Turnos */}
            <div>
                <h3 className="text-xl font-semibold mb-4">Próximos Turnos</h3>
                {proximosTurnos.length === 0 ? (
                    <p className="text-muted-foreground">No tienes turnos programados.</p>
                ) : (
                    <div className="space-y-4">
                        {proximosTurnos.map(turno => (
                            <Card key={turno.id}>
                                <CardContent className="p-4 grid gap-4 md:grid-cols-[1fr_auto]">
                                    <div>
                                        <div className="flex items-center gap-4 mb-2">
                                            <h4 className="font-semibold">{turno.servicio.map(s => s.name).join(', ')}</h4>
                                            {/* <Badge variant={turno.estadoPago === 'pagado' ? 'default' : 'secondary'}>
                                                {turno.estadoPago === 'pagado' ? `Pagado (${turno.metodoPago})` : 'Pendiente de pago'}
                                            </Badge> */}

                                            <Badge variant={isTurnoPagado(turno) ? 'default' : 'secondary'}>
                                                {isTurnoPagado(turno) ? `Pagado (${getMetodoPago(turno)})` : 'Pendiente de pago'}
                                            </Badge>

                                        </div>
                                        <div className="text-sm text-muted-foreground space-y-1">
                                            <div className="flex items-center gap-2"><Calendar size={16} /> {formatDateTime(turno.fechaHora)} hs</div>
                                            <div className="flex items-center gap-2"><Car size={16} /> {turno.car.marca} {turno.car.model}</div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end justify-between">
                                        <div className="text-lg font-bold mb-2">${turno.totalPrice.toLocaleString('es-AR')}</div>
                                        {!isTurnoPagado(turno) && (
                                            <div className="text-sm text-muted-foreground">
                                                Falta pagar: <span className="font-medium text-destructive">${getMontoFaltante(turno).toLocaleString('es-AR')}</span>
                                            </div>
                                        )}
                                        <div className="flex gap-2">
                                            {!isTurnoPagado(turno) && (
                                                <Button size="sm" onClick={() => handlePagarMercadoPago(turno)}>
                                                    <CreditCard className="mr-2 h-4 w-4" /> Pagar
                                                </Button>
                                            )}
                                            {canCancelTurno(turno) && (
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleCancelTurno(turno.id)}
                                                >
                                                    <X className="mr-2 h-4 w-4" /> Cancelar
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <Separator />

            {/* Sección de Historial de Servicios */}
            <div>
                <h3 className="text-xl font-semibold mb-4">Historial de Servicios</h3>
                {historialTurnos.length === 0 ? (
                    <p className="text-muted-foreground">No tienes servicios en tu historial.</p>
                ) : (
                    <div className="space-y-4">
                        {historialTurnos.map(turno => (
                            <Card key={turno.id} className="opacity-80">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-4 mb-2">
                                            <h4 className="font-semibold">{turno.servicio.map(s => s.name).join(', ')}</h4>
                                            <Badge variant={
                                                turno.estado === 'cancelado'
                                                    ? 'destructive'
                                                    : isTurnoPagado(turno)
                                                        ? 'default'
                                                        : 'secondary'
                                            }>
                                                {turno.estado === 'cancelado'
                                                    ? 'Cancelado'
                                                    : isTurnoPagado(turno)
                                                        ? `Pagado (${getMetodoPago(turno)})`
                                                        : 'Pendiente de pago'}
                                            </Badge>
                                        </div>
                                        <div className="text-sm text-muted-foreground space-y-1">
                                            <div className="flex items-center gap-2"><Calendar size={16} /> {formatShortDate(turno.fechaHora)}</div>
                                            <div className="flex items-center gap-2"><Car size={16} /> {turno.car.marca} {turno.car.model}</div>
                                        </div>
                                    </div>
                                    <div className="text-lg font-bold">${turno.totalPrice.toLocaleString('es-AR')}</div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
