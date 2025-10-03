"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreditCard, DollarSign, Calendar, Car } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import moment from "moment"
import { toast } from "sonner"

// Tipos de datos (puedes moverlos a un archivo de tipos si lo prefieres)
interface Turno {
    id: string;
    fechaHora: string;
    servicio: { name: string }[];
    car: { marca: string; model: string };
    totalPrice: number;
    pago: Pago[];
    estado: 'pendiente' | 'completado' | 'cancelado';
    metodoPago?: 'efectivo' | 'mercadopago';
}
interface Pago {
    id: number;
    monto: number;
    fecha_pago: string;
    metodo: 'EFECTIVO' | 'MERCADOPAGO' | 'TRANSFERENCIA';  // Valores del enum
    estado: 'PENDIENTE' | 'COMPLETADO' | 'CANCELADO';  // Valores del enum
}

// Función helper para determinar si un turno está completamente pagado
const isTurnoPagado = (turno: Turno): boolean => {
    // Si no hay pagos, definitivamente no está pagado
    if (!turno.pago || turno.pago.length === 0) return false;

    // Suma todos los pagos COMPLETADOS
    const totalPagado = turno.pago
        .filter(p => p.estado === 'COMPLETADO')
        .reduce((sum, p) => sum + p.monto, 0);

    // Está pagado si el monto total pagado es igual o mayor al precio total
    return totalPagado >= turno.totalPrice;
};

// Función para obtener el método de pago dominante
const getMetodoPago = (turno: Turno): string => {
    if (!turno.pago || turno.pago.length === 0) return 'Sin pagos';

    // Obtener el método del pago más reciente que esté completado
    const pagoCompletado = [...turno.pago]
        .filter(p => p.estado === 'COMPLETADO')
        .sort((a, b) => new Date(b.fecha_pago).getTime() - new Date(a.fecha_pago).getTime())[0];

    return pagoCompletado ? pagoCompletado.metodo : 'Pendiente';
};

const getMontoFaltante = (turno: Turno): number => {
    if (!turno.pago || turno.pago.length === 0) return turno.totalPrice;

    const totalPagado = turno.pago
        .filter(p => p.estado === 'COMPLETADO')
        .reduce((sum, p) => sum + p.monto, 0);

        // console.log("monto: ", turno.pago.monto);
    return Math.max(0, turno.totalPrice - totalPagado);
};

export default function UserTurnos() {
    const [turnos, setTurnos] = useState<Turno[]>([])
    const [loading, setLoading] = useState(true)
    // const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchTurnos = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/turno/history`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("jwt")}`
                    }
                });
                if (!response.ok) throw new Error("No se pudieron cargar los turnos.");
                console.log("Response status:", response.status);
                const data = await response.json();
                setTurnos(data);

                // Usamos los datos mock por ahora
                // await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay de red
                // setTurnos(mockTurnos);

            } catch (error) {
                toast.error("Error", {
                    description: "No se pudieron cargar los turnos. Intenta nuevamente más tarde.",
                });
            } finally {
                setLoading(false)
            }
        }

        fetchTurnos()
    }, [])

    const handlePagarEfectivo = async (turnoId: string) => {
        alert(`Simulación: Marcar turno ${turnoId} para pagar en efectivo.`);
        // Lógica real:
        // await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/pago/efectivo`, {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem("jwt")}` },
        //     body: JSON.stringify({ turnoId })
        // });
        // Actualizar la UI o recargar los turnos
    };

    const handlePagarMercadoPago = async (turnoId: string) => {
        alert(`Simulación: Redirigiendo a Mercado Pago para el turno ${turnoId}.`);
        // Lógica real:
        // const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/pago/mercadopago`, {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem("jwt")}` },
        //     body: JSON.stringify({ turnoId })
        // });
        // const data = await response.json();
        // window.location.href = data.redirectUrl;
    };

    // const proximosTurnos = turnos.filter(t => t.estadoPago === 'pendiente').sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());
    // const historialTurnos = turnos.filter(t => t.estadoPago !== 'pendiente').sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());


    const proximosTurnos = turnos
        .filter(t => t.estado === 'pendiente') // Solo turnos pendientes
        .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());

    const historialTurnos = turnos
        .filter(t => t.estado === 'completado' || t.estado === 'cancelado') // Turnos completados o cancelados
        .sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());

    if (loading) {
        return (
            <div className="text-center py-6">
                <span className="loading loading-spinner loading-lg"></span>
                <p className="text-muted-foreground mt-2">Cargando tus turnos...</p>
            </div>
        )
    }

    // if (error) {
    //     return (
    //         <div className="text-center py-6 text-destructive">
    //             <p>{error}</p>
    //         </div>
    //     )
    // }

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
                                            <div className="flex items-center gap-2"><Calendar size={16} /> {moment(turno.fechaHora).format('dddd, DD [de] MMMM [de] YYYY, HH:mm')} hs</div>
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
                                        {!isTurnoPagado(turno) && (
                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm" onClick={() => handlePagarEfectivo(turno.id)}>
                                                    <DollarSign className="mr-2 h-4 w-4" /> Pagar en local
                                                </Button>
                                                <Button size="sm" onClick={() => handlePagarMercadoPago(turno.id)}>
                                                    <CreditCard className="mr-2 h-4 w-4" /> Pagar online
                                                </Button>
                                            </div>
                                        )}
                                        {/* {turno.estadoPago === 'pendiente' && (
                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm" onClick={() => handlePagarEfectivo(turno.id)}>
                                                    <DollarSign className="mr-2 h-4 w-4" /> Pagar en local
                                                </Button>
                                                <Button size="sm" onClick={() => handlePagarMercadoPago(turno.id)}>
                                                    <CreditCard className="mr-2 h-4 w-4" /> Pagar online
                                                </Button>
                                            </div>
                                        )} */}
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
                                            <Badge variant={turno.estado === 'completado' ? 'default' : 'destructive'}>
                                                {turno.estado.charAt(0).toUpperCase() + turno.estado.slice(1)}
                                            </Badge>
                                        </div>
                                        <div className="text-sm text-muted-foreground space-y-1">
                                            <div className="flex items-center gap-2"><Calendar size={16} /> {moment(turno.fechaHora).format('DD/MM/YYYY')}</div>
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
