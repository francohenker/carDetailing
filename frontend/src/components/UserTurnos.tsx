"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { History, CreditCard, DollarSign, Calendar, Car } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import moment from "moment"

// Tipos de datos (puedes moverlos a un archivo de tipos si lo prefieres)
interface Turno {
    id: string;
    fechaHora: string;
    servicio: { name: string }[];
    car: { marca: string; model: string };
    totalPrice: number;
    estadoPago: 'pendiente' | 'pagado';
    estado: 'pendiente' | 'completado' | 'cancelado';
    metodoPago?: 'efectivo' | 'mercadopago';
}


export default function UserTurnos() {
    const [turnos, setTurnos] = useState<Turno[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchTurnos = async () => {
            try {
                // --- SIMULACIÓN DE FETCH ---
                // Aquí harías el fetch a tu endpoint real:
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

            } catch (err: any) {
                setError(err.message || "Ocurrió un error.")
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

    const proximosTurnos = turnos.filter(t => t.estadoPago === 'pendiente').sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());
    const historialTurnos = turnos.filter(t => t.estadoPago !== 'pendiente').sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());

    if (loading) {
        return (
            <div className="text-center py-6">
                <span className="loading loading-spinner loading-lg"></span>
                <p className="text-muted-foreground mt-2">Cargando tus turnos...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-center py-6 text-destructive">
                <p>{error}</p>
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
                                            <Badge variant={turno.estadoPago === 'pagado' ? 'default' : 'secondary'}>
                                                {turno.estadoPago === 'pagado' ? `Pagado (${turno.metodoPago})` : 'Pendiente de pago'}
                                            </Badge>
                                        </div>
                                        <div className="text-sm text-muted-foreground space-y-1">
                                            <div className="flex items-center gap-2"><Calendar size={16} /> {moment(turno.fechaHora).format('dddd, DD [de] MMMM [de] YYYY, HH:mm')} hs</div>
                                            <div className="flex items-center gap-2"><Car size={16} /> {turno.car.marca} {turno.car.model}</div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end justify-between">
                                        <div className="text-lg font-bold mb-2">${turno.totalPrice.toLocaleString('es-AR')}</div>
                                        {turno.estadoPago === 'pendiente' && (
                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm" onClick={() => handlePagarEfectivo(turno.id)}>
                                                    <DollarSign className="mr-2 h-4 w-4" /> Pagar en local
                                                </Button>
                                                <Button size="sm" onClick={() => handlePagarMercadoPago(turno.id)}>
                                                    <CreditCard className="mr-2 h-4 w-4" /> Pagar online
                                                </Button>
                                            </div>
                                        )}
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
