"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Calendar,
  Car,
  X,
  FileDown,
  ChevronLeft,
  ChevronRight,
  Edit2,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import ModifyTurno from "./ModifyTurno";

// Utilidades de fecha nativas
const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatShortDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

// Tipos de datos (puedes moverlos a un archivo de tipos si lo prefieres)
interface Turno {
  id: number;
  fechaHora: string;
  servicio: { id: string; name: string }[];
  car: { id: string; marca: string; model: string; type: string };
  totalPrice: number;
  pago: Pago[];
  estado: "pendiente" | "finalizado" | "cancelado";
  metodoPago?: "efectivo" | "mercadopago";
}
interface Pago {
  id: number;
  monto: number;
  fecha_pago: string;
  metodo: "EFECTIVO" | "MERCADO_PAGO"; // Valores del enum
  estado: "PENDIENTE" | "PAGADO" | "CANCELADO"; // Valores del enum
}

// Función helper para determinar si un turno está completamente pagado
const isTurnoPagado = (turno: Turno): boolean => {
  // Si no hay pagos, definitivamente no está pagado
  if (!turno.pago || turno.pago.length === 0) return false;

  // Suma todos los pagos COMPLETADOS
  const totalPagado = turno.pago
    .filter((p) => p.estado === "PAGADO")
    .reduce((sum, p) => sum + p.monto, 0);

  // Está pagado si el monto total pagado es igual o mayor al precio total
  return totalPagado >= turno.totalPrice;
};

// Función para obtener el método de pago dominante
const getMetodoPago = (turno: Turno): string => {
  if (!turno.pago || turno.pago.length === 0) return "Sin pagos";

  // Obtener el método del pago más reciente que esté pagado
  const pagoCompletado = [...turno.pago]
    .filter((p) => p.estado === "PAGADO")
    .sort(
      (a, b) =>
        new Date(b.fecha_pago).getTime() - new Date(a.fecha_pago).getTime(),
    )[0];
  return pagoCompletado ? pagoCompletado.metodo : "Pendiente";
};

const getMontoFaltante = (turno: Turno): number => {
  if (!turno.pago || turno.pago.length === 0) return turno.totalPrice;

  const totalPagado = turno.pago
    .filter((p) => p.estado === "PAGADO")
    .reduce((sum, p) => sum + p.monto, 0);

  return Math.max(0, turno.totalPrice - totalPagado);
};

export default function UserTurnos() {
  const searchParams = useSearchParams();
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para paginación del historial
  const [currentPageHistorial, setCurrentPageHistorial] = useState(1);
  const [itemsPerPageHistorial] = useState(5);
  const [paginatedHistorial, setPaginatedHistorial] = useState<Turno[]>([]);
  const [totalPagesHistorial, setTotalPagesHistorial] = useState(0);

  // Estados para modificar turno
  const [modifyTurnoOpen, setModifyTurnoOpen] = useState(false);
  const [selectedTurno, setSelectedTurno] = useState<Turno | null>(null);

  // Función para paginar el historial
  const paginateHistorial = useCallback(
    (historialData: Turno[], page: number) => {
      const startIndex = (page - 1) * itemsPerPageHistorial;
      const endIndex = startIndex + itemsPerPageHistorial;
      const paginated = historialData.slice(startIndex, endIndex);
      setPaginatedHistorial(paginated);
    },
    [itemsPerPageHistorial],
  );

  // Función para cambiar de página en el historial
  const handlePageChangeHistorial = (page: number) => {
    setCurrentPageHistorial(page);
    const historialTurnos = turnos
      .filter((t) => t.estado === "finalizado")
      .sort(
        (a, b) =>
          new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime(),
      );
    paginateHistorial(historialTurnos, page);
  };

  // Función para determinar si un turno se puede cancelar
  const canCancelTurno = (turno: Turno): boolean => {
    // Solo se puede cancelar si está en estado pendiente
    if (turno.estado !== "pendiente") {
      return false;
    }

    const turnoDate = new Date(turno.fechaHora);
    const now = new Date();
    const timeDiff = turnoDate.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 3600);

    // Se puede cancelar si faltan más de 24 horas
    return hoursDiff > 24;
  };

  // Función para determinar si un turno se puede modificar
  const canModifyTurno = (turno: Turno): boolean => {
    // Solo se puede modificar si está en estado pendiente
    if (turno.estado !== "pendiente") {
      return false;
    }

    const turnoDate = new Date(turno.fechaHora);
    const now = new Date();
    const timeDiff = turnoDate.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 3600);

    // Se puede modificar si faltan más de 2 horas
    return hoursDiff > 2;
  };

  // Función para abrir modal de modificación
  const handleModifyTurno = (turno: Turno) => {
    setSelectedTurno(turno);
    setModifyTurnoOpen(true);
    setSuggestedDate(null); // Resetear fecha sugerida al abrir manualmente
  };

  // Función para cerrar modal de modificación
  const handleCloseModifyModal = () => {
    setModifyTurnoOpen(false);
    setSelectedTurno(null);
    setSuggestedDate(null); // Resetear fecha sugerida al cerrar
  };

  // Función para refrescar turnos después de modificar
  const handleModifySuccess = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/turno/history`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("jwt")}`,
          },
        },
      );
      if (!response.ok) throw new Error("No se pudieron cargar los turnos.");
      const data = await response.json();
      setTurnos(data);

      // Actualizar paginación del historial
      const historialTurnos = data
        .filter((t: Turno) => t.estado === "finalizado")
        .sort(
          (a: Turno, b: Turno) =>
            new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime(),
        );

      const totalPages = Math.ceil(
        historialTurnos.length / itemsPerPageHistorial,
      );
      setTotalPagesHistorial(totalPages);

      const newPage =
        currentPageHistorial <= totalPages ? currentPageHistorial : 1;
      setCurrentPageHistorial(newPage);
      paginateHistorial(historialTurnos, newPage);
    } catch (error) {
      console.error("Error refreshing turnos:", error);
    }
  };

  // Función para cancelar un turno
  const handleCancelTurno = async (turnoId: number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/turno/cancel/${turnoId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("jwt")}`,
          },
        },
      );

      if (!response.ok) throw new Error("Error canceling turno");

      toast.success("Éxito", {
        description: "Turno cancelado correctamente.",
      });

      // Recargar los turnos
      const updatedResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/turno/history`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("jwt")}`,
          },
        },
      );
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        setTurnos(updatedData);

        // Actualizar paginación del historial
        const historialTurnos = updatedData
          .filter((t: Turno) => t.estado === "finalizado")
          .sort(
            (a: Turno, b: Turno) =>
              new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime(),
          );

        const totalPages = Math.ceil(
          historialTurnos.length / itemsPerPageHistorial,
        );
        setTotalPagesHistorial(totalPages);

        // Mantener la página actual si es válida, sino ir a la primera
        const newPage =
          currentPageHistorial <= totalPages ? currentPageHistorial : 1;
        setCurrentPageHistorial(newPage);
        paginateHistorial(historialTurnos, newPage);
      }
    } catch (error) {
      console.error("Error canceling turno:", error);
      toast.error("Error", {
        description: "No se pudo cancelar el turno.",
      });
    }
  };

  // Función para descargar factura
  const handleDownloadFactura = async (turnoId: number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/factura/download/${turnoId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("jwt")}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Error al generar la factura");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `comprobante-${turnoId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Éxito", {
        description: "Factura descargada correctamente.",
      });
    } catch (error) {
      console.error("Error downloading factura:", error);
      toast.error("Error", {
        description:
          "No se pudo generar la factura. Verifica que el servicio esté pagado.",
      });
    }
  };

  useEffect(() => {
    const fetchTurnos = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/turno/history`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("jwt")}`,
            },
          },
        );
        if (!response.ok) throw new Error("No se pudieron cargar los turnos.");
        const data = await response.json();
        setTurnos(data);

        // Inicializar paginación del historial
        const historialTurnos = data
          .filter((t: Turno) => t.estado === "finalizado")
          .sort(
            (a: Turno, b: Turno) =>
              new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime(),
          );

        const totalPages = Math.ceil(
          historialTurnos.length / itemsPerPageHistorial,
        );
        setTotalPagesHistorial(totalPages);
        setCurrentPageHistorial(1);
        paginateHistorial(historialTurnos, 1);
      } catch {
        toast.error("Error", {
          description:
            "No se pudieron cargar los turnos. Intenta nuevamente más tarde.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTurnos();
  }, [itemsPerPageHistorial, paginateHistorial]);

  // Estado para fecha sugerida (desde URL)
  const [suggestedDate, setSuggestedDate] = useState<Date | null>(null);

  // Detectar parámetro 'modify' en la URL para abrir automáticamente el modal
  useEffect(() => {
    const modifyTurnoId = searchParams.get('modify');
    const suggestedDateParam = searchParams.get('suggestedDate');

    if (modifyTurnoId && turnos.length > 0) {
      const turnoToModify = turnos.find(t => t.id.toString() === modifyTurnoId);
      if (turnoToModify && canModifyTurno(turnoToModify)) {
        setSelectedTurno(turnoToModify);
        setModifyTurnoOpen(true);

        if (suggestedDateParam) {
          const date = new Date(suggestedDateParam);
          if (!isNaN(date.getTime())) {
            setSuggestedDate(date);
          }
        }

        // Limpiar el parámetro de la URL después de abrir el modal
        const url = new URL(window.location.href);
        url.searchParams.delete('modify');
        if (suggestedDateParam) {
          url.searchParams.delete('suggestedDate');
        }
        window.history.replaceState({}, '', url.toString());

      } else if (turnoToModify && !canModifyTurno(turnoToModify)) {
        toast.error("No se puede modificar", {
          description: "Este turno ya no se puede modificar debido a restricciones de tiempo o estado."
        });
      }
    }
  }, [searchParams, turnos]);

  const handlePagarMercadoPago = async (turno: Turno) => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/pago/mercadopago`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
        body: JSON.stringify({
          turnoId: turno.id,
        }),
      },
    );

    if (res.ok) {
      const data = await res.json();
      window.location.href = data.init_point;
    } else {
      toast.error("Error", {
        description:
          "No se pudo iniciar el pago. Intenta nuevamente más tarde.",
      });
    }
  };

  const proximosTurnos = turnos
    .filter((t) => t.estado !== "finalizado") // Todos los turnos que NO están finalizados
    .sort(
      (a, b) =>
        new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime(),
    );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const historialTurnos = turnos
    .filter((t) => t.estado === "finalizado") // Solo turnos finalizados
    .sort(
      (a, b) =>
        new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime(),
    );

  if (loading) {
    return (
      <div className="text-center py-6">
        <span className="loading loading-spinner loading-lg"></span>
        <p className="text-muted-foreground mt-2">Cargando tus turnos...</p>
      </div>
    );
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
            {proximosTurnos.map((turno) => (
              <Card key={turno.id}>
                <CardContent className="p-4 grid gap-4 md:grid-cols-[1fr_auto]">
                  <div>
                    <div className="flex items-center gap-4 mb-2">
                      <h4 className="font-semibold">
                        {turno.servicio.map((s) => s.name).join(", ")}
                      </h4>

                      <Badge
                        variant={
                          isTurnoPagado(turno)
                            ? "default"
                            : turno.estado === "cancelado"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {isTurnoPagado(turno)
                          ? `Pagado (${getMetodoPago(turno)})`
                          : turno.estado === "pendiente"
                            ? "Pendiente de pago"
                            : "Cancelado"}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} /> {formatDateTime(turno.fechaHora)}{" "}
                        hs
                      </div>
                      <div className="flex items-center gap-2">
                        <Car size={16} /> {turno.car.marca} {turno.car.model}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <div className="text-lg font-bold mb-2">
                      ${turno.totalPrice.toLocaleString("es-AR")}
                    </div>
                    {turno.estado !== "cancelado" && !isTurnoPagado(turno) && (
                      <div className="text-sm text-muted-foreground font-bold">
                        Falta pagar:{" "}
                        <span className="text-destructive font-bold">
                          ${getMontoFaltante(turno).toLocaleString("es-AR")}
                        </span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      {turno.estado === "pendiente" &&
                        !isTurnoPagado(turno) && (
                          <Button
                            size="sm"
                            onClick={() => handlePagarMercadoPago(turno)}
                          >
                            <CreditCard className="mr-2 h-4 w-4" /> Pagar
                          </Button>
                        )}
                      {canModifyTurno(turno) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleModifyTurno(turno)}
                        >
                          <Edit2 className="mr-2 h-4 w-4" /> Modificar
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
        <h3 className="text-xl font-semibold mb-4">
          Historial de Servicios Realizados
        </h3>
        {paginatedHistorial.length === 0 ? (
          <p className="text-muted-foreground">
            No tienes servicios en tu historial.
          </p>
        ) : (
          <div className="space-y-4">
            {paginatedHistorial.map((turno) => (
              <Card key={turno.id} className="opacity-80">
                <CardContent className="p-4 grid gap-4 md:grid-cols-[1fr_auto]">
                  <div>
                    <div className="flex items-center gap-4 mb-2">
                      <h4 className="font-semibold">
                        {turno.servicio.map((s) => s.name).join(", ")}
                      </h4>
                      <Badge
                        variant={
                          turno.estado === "cancelado"
                            ? "destructive"
                            : isTurnoPagado(turno)
                              ? "default"
                              : "secondary"
                        }
                      >
                        {turno.estado === "cancelado"
                          ? "Cancelado"
                          : isTurnoPagado(turno)
                            ? `Pagado (${getMetodoPago(turno)})`
                            : "Pendiente de pago"}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} />{" "}
                        {formatShortDate(turno.fechaHora)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Car size={16} /> {turno.car.marca} {turno.car.model}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <div className="text-lg font-bold mb-2">
                      ${turno.totalPrice.toLocaleString("es-AR")}
                    </div>
                    {isTurnoPagado(turno) ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadFactura(turno.id)}
                        className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                      >
                        <FileDown className="mr-2 h-4 w-4" />
                        Descargar Factura
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handlePagarMercadoPago(turno)}
                      >
                        <CreditCard className="mr-2 h-4 w-4" /> Pagar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Controles de paginación para historial */}
        {totalPagesHistorial > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handlePageChangeHistorial(Math.max(currentPageHistorial - 1, 1))
              }
              disabled={currentPageHistorial === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>

            <div className="flex gap-1">
              {Array.from({ length: totalPagesHistorial }, (_, i) => i + 1).map(
                (page) => (
                  <Button
                    key={page}
                    variant={
                      currentPageHistorial === page ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => handlePageChangeHistorial(page)}
                    className="min-w-[2.5rem]"
                  >
                    {page}
                  </Button>
                ),
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handlePageChangeHistorial(
                  Math.min(currentPageHistorial + 1, totalPagesHistorial),
                )
              }
              disabled={currentPageHistorial === totalPagesHistorial}
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Modal para modificar turno */}
      <ModifyTurno
        turno={selectedTurno}
        isOpen={modifyTurnoOpen}
        onClose={handleCloseModifyModal}
        onSuccess={handleModifySuccess}
        suggestedDate={suggestedDate}
      />
    </div>
  );
}
