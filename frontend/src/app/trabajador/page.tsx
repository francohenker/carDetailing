"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoutes";
import HeaderDefault from "../header";

interface Turno {
  id: number;
  fechaHora: string;
  estado: "pendiente" | "finalizado" | "cancelado";
  observacion: string;
  duration: number;
  totalPrice: number;
  car: {
    marca: string;
    model: string;
    patente: string;
    user: {
      firstname: string;
      lastname: string;
    };
  };
  servicio: { id: number; name: string }[];
}

interface PurchaseOrderItem {
  id: number;
  productoId: number;
  producto?: { name: string };
  unitPrice: number;
  quantityOrdered: number;
  quantityReceived: number;
  subtotal: number;
  notes: string | null;
}

interface PurchaseOrder {
  id: number;
  orderNumber: string;
  supplier: { id: number; name: string };
  items: PurchaseOrderItem[];
  status: "PENDIENTE" | "RECIBIDA" | "PARCIAL" | "CANCELADA";
  totalAmount: number;
  notes: string | null;
  receivedAt: string | null;
  receivedBy?: {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
  };
  createdAt: string;
}

export default function TrabajadorDashboard() {
  const [activeTab, setActiveTab] = useState<"turnos" | "ordenes">("turnos");
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [filterTurnos, setFilterTurnos] = useState<"todos" | "pendiente" | "finalizado">("pendiente");
  const [filterOrdenes, setFilterOrdenes] = useState<"todas" | "PENDIENTE" | "PARCIAL" | "RECIBIDA">("PENDIENTE");
  const [itemReceiveQuantities, setItemReceiveQuantities] = useState<Record<number, number>>({});

  const API = process.env.NEXT_PUBLIC_BACKEND_URL;
  const getToken = () => localStorage.getItem("jwt");

  const fetchTurnos = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API}/turno/admin/getAll`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTurnos(data);
      }
    } catch (e) {
      console.error("Error fetching turnos:", e);
    }
  };

  const fetchPurchaseOrders = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API}/purchase-orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPurchaseOrders(data);
      }
    } catch (e) {
      console.error("Error fetching purchase orders:", e);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchTurnos(), fetchPurchaseOrders()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMarkTurnoCompleted = async (turnoId: number) => {
    setActionLoading(`turno-${turnoId}`);
    try {
      const token = getToken();
      const res = await fetch(`${API}/turno/admin/mark-completed/${turnoId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await fetchTurnos();
      } else {
        const err = await res.json();
        alert(err.message || "Error al marcar turno como completado");
      }
    } catch {
      alert("Error de conexión");
    }
    setActionLoading(null);
  };

  const handleMarkOrderReceived = async (orderId: number) => {
    setActionLoading(`order-${orderId}`);
    try {
      const token = getToken();
      const res = await fetch(`${API}/purchase-orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "RECIBIDA" }),
      });
      if (res.ok) {
        await fetchPurchaseOrders();
      } else {
        const err = await res.json();
        alert(err.message || "Error al marcar orden como recibida");
      }
    } catch {
      alert("Error de conexión");
    }
    setActionLoading(null);
  };

  const handleUpdateItemReceived = async (
    orderId: number,
    itemId: number,
    quantityReceived: number
  ) => {
    setActionLoading(`item-${itemId}`);
    try {
      const token = getToken();
      const res = await fetch(
        `${API}/purchase-orders/${orderId}/items/${itemId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ quantityReceived }),
        }
      );
      if (res.ok) {
        setItemReceiveQuantities((prev) => {
          const updated = { ...prev };
          delete updated[itemId];
          return updated;
        });
        await fetchPurchaseOrders();
      } else {
        const err = await res.json();
        alert(err.message || "Error al actualizar item");
      }
    } catch {
      alert("Error de conexión");
    }
    setActionLoading(null);
  };

  const filteredTurnos = turnos.filter((t) => {
    if (filterTurnos === "todos") return true;
    return t.estado === filterTurnos;
  });

  const filteredOrders = purchaseOrders.filter((o) => {
    if (filterOrdenes === "todas") return true;
    return o.status === filterOrdenes;
  });

  const pendingTurnosCount = turnos.filter((t) => t.estado === "pendiente").length;
  const pendingOrdersCount = purchaseOrders.filter(
    (o) => o.status === "PENDIENTE" || o.status === "PARCIAL"
  ).length;
  const pendienteOrdersCount = purchaseOrders.filter((o) => o.status === "PENDIENTE").length;
  const parcialOrdersCount = purchaseOrders.filter((o) => o.status === "PARCIAL").length;

  return (
    <ProtectedRoute allowedRoles={["trabajador"]}>
      <HeaderDefault />
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Panel de Trabajador
          </h1>
          <p className="text-gray-500 mb-6">
            Gestione turnos y recepcione órdenes de compra.
          </p>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab("turnos")}
              className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                activeTab === "turnos"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border"
              }`}
            >
              Turnos
              {pendingTurnosCount > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    activeTab === "turnos"
                      ? "bg-white text-blue-600"
                      : "bg-blue-600 text-white"
                  }`}
                >
                  {pendingTurnosCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("ordenes")}
              className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                activeTab === "ordenes"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border"
              }`}
            >
              Órdenes de Compra
              {pendingOrdersCount > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    activeTab === "ordenes"
                      ? "bg-white text-blue-600"
                      : "bg-blue-600 text-white"
                  }`}
                >
                  {pendingOrdersCount}
                </span>
              )}
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Cargando...</div>
          ) : activeTab === "turnos" ? (
            /* ============ TURNOS TAB ============ */
            <div>
              {/* Filtros */}
              <div className="flex gap-2 mb-4">
                {(["pendiente", "finalizado", "todos"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilterTurnos(f)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                      filterTurnos === f
                        ? "bg-gray-800 text-white"
                        : "bg-white text-gray-600 border hover:bg-gray-50"
                    }`}
                  >
                    {f === "pendiente"
                      ? "Pendientes"
                      : f === "finalizado"
                      ? "Finalizados"
                      : "Todos"}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {filteredTurnos.length === 0 ? (
                  <div className="bg-white rounded-lg p-8 text-center text-gray-500">
                    No hay turnos {filterTurnos !== "todos" ? filterTurnos + "s" : ""}
                  </div>
                ) : (
                  filteredTurnos.map((turno) => (
                    <div
                      key={turno.id}
                      className="bg-white rounded-lg shadow p-6"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">
                              Turno #{turno.id}
                            </h3>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                turno.estado === "pendiente"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : turno.estado === "finalizado"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {turno.estado.charAt(0).toUpperCase() +
                                turno.estado.slice(1)}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                            <p>
                              <strong>Cliente:</strong>{" "}
                              {turno.car?.user?.firstname}{" "}
                              {turno.car?.user?.lastname}
                            </p>
                            <p>
                              <strong>Fecha:</strong>{" "}
                              {new Date(turno.fechaHora).toLocaleDateString(
                                "es-AR"
                              )}{" "}
                              {new Date(turno.fechaHora).toLocaleTimeString(
                                "es-AR",
                                { hour: "2-digit", minute: "2-digit" }
                              )}
                            </p>
                            <p>
                              <strong>Vehículo:</strong> {turno.car?.marca}{" "}
                              {turno.car?.model} ({turno.car?.patente})
                            </p>
                            <p>
                              <strong>Duración:</strong> {turno.duration} min
                            </p>
                            <p>
                              <strong>Precio:</strong> $
                              {turno.totalPrice?.toLocaleString("es-AR")}
                            </p>
                          </div>

                          {turno.servicio && turno.servicio.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm font-medium text-gray-700">
                                Servicios:
                              </p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {turno.servicio.map((s) => (
                                  <span
                                    key={s.id}
                                    className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded"
                                  >
                                    {s.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {turno.observacion && (
                            <p className="text-sm text-gray-500 mt-2">
                              <strong>Observación:</strong> {turno.observacion}
                            </p>
                          )}
                        </div>

                        {turno.estado === "pendiente" && (
                          <button
                            onClick={() => handleMarkTurnoCompleted(turno.id)}
                            disabled={actionLoading === `turno-${turno.id}`}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 whitespace-nowrap ml-4"
                          >
                            {actionLoading === `turno-${turno.id}`
                              ? "Procesando..."
                              : "Marcar Realizado"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* ============ ORDENES DE COMPRA TAB ============ */
            <div>
              {/* Filtros */}
              <div className="flex gap-2 mb-4">
                {(["PENDIENTE", "PARCIAL", "RECIBIDA", "todas"] as const).map(
                  (f) => (
                    <button
                      key={f}
                      onClick={() => setFilterOrdenes(f)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 ${
                        filterOrdenes === f
                          ? "bg-gray-800 text-white"
                          : "bg-white text-gray-600 border hover:bg-gray-50"
                      }`}
                    >
                      {f === "PENDIENTE"
                        ? "Pendientes"
                        : f === "PARCIAL"
                        ? "Parciales"
                        : f === "RECIBIDA"
                        ? "Recibidas"
                        : "Todas"}
                      {f === "PENDIENTE" && pendienteOrdersCount > 0 && (
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                            filterOrdenes === f
                              ? "bg-white text-gray-800"
                              : "bg-yellow-500 text-white"
                          }`}
                        >
                          {pendienteOrdersCount}
                        </span>
                      )}
                      {f === "PARCIAL" && parcialOrdersCount > 0 && (
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                            filterOrdenes === f
                              ? "bg-white text-gray-800"
                              : "bg-orange-500 text-white"
                          }`}
                        >
                          {parcialOrdersCount}
                        </span>
                      )}
                    </button>
                  )
                )}
              </div>

              <div className="space-y-4">
                {filteredOrders.length === 0 ? (
                  <div className="bg-white rounded-lg p-8 text-center text-gray-500">
                    No hay órdenes de compra
                    {filterOrdenes !== "todas" ? ` ${filterOrdenes.toLowerCase()}s` : ""}
                  </div>
                ) : (
                  filteredOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white rounded-lg shadow"
                    >
                      <div
                        role="button"
                        tabIndex={0}
                        className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() =>
                          setExpandedOrderId(
                            expandedOrderId === order.id ? null : order.id
                          )
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setExpandedOrderId(
                              expandedOrderId === order.id ? null : order.id
                            );
                          }
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-semibold text-lg">
                                {order.orderNumber}
                              </h3>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  order.status === "RECIBIDA"
                                    ? "bg-green-100 text-green-800"
                                    : order.status === "CANCELADA"
                                    ? "bg-red-100 text-red-800"
                                    : order.status === "PARCIAL"
                                    ? "bg-orange-100 text-orange-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {order.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">
                              Proveedor: {order.supplier?.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              Fecha:{" "}
                              {new Date(order.createdAt).toLocaleDateString(
                                "es-AR"
                              )}
                            </p>
                            <p className="text-sm mt-1">
                              <strong>Total:</strong> $
                              {Number(order.totalAmount)?.toLocaleString("es-AR")}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {(order.status === "PENDIENTE" ||
                              order.status === "PARCIAL") && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkOrderReceived(order.id);
                                }}
                                disabled={
                                  actionLoading === `order-${order.id}`
                                }
                                className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                              >
                                {actionLoading === `order-${order.id}`
                                  ? "Procesando..."
                                  : "Marcar Recibida"}
                              </button>
                            )}
                            <svg
                              className={`h-5 w-5 text-gray-400 transition-transform ${
                                expandedOrderId === order.id
                                  ? "rotate-180"
                                  : ""
                              }`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {expandedOrderId === order.id && (
                        <div className="border-t px-6 pb-6 pt-4 space-y-4">
                          {/* Items de la orden */}
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">
                              Detalle de productos
                            </h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="bg-gray-100 text-gray-600">
                                    <th className="text-left px-3 py-2 rounded-tl-lg">
                                      Producto
                                    </th>
                                    <th className="text-right px-3 py-2">
                                      Precio unit.
                                    </th>
                                    <th className="text-right px-3 py-2">
                                      Cant. pedida
                                    </th>
                                    <th className="text-right px-3 py-2">
                                      Cant. recibida
                                    </th>
                                    <th className="text-right px-3 py-2">
                                      Subtotal
                                    </th>
                                    {(order.status === "PENDIENTE" ||
                                      order.status === "PARCIAL") && (
                                      <th className="text-center px-3 py-2 rounded-tr-lg">
                                        Acciones
                                      </th>
                                    )}
                                  </tr>
                                </thead>
                                <tbody>
                                  {order.items.map((item) => (
                                    <tr
                                      key={item.id}
                                      className="border-b last:border-0"
                                    >
                                      <td className="px-3 py-2 font-medium">
                                        {item.producto?.name ||
                                          `Producto #${item.productoId}`}
                                      </td>
                                      <td className="px-3 py-2 text-right">
                                        $
                                        {Number(
                                          item.unitPrice
                                        )?.toLocaleString("es-AR")}
                                      </td>
                                      <td className="px-3 py-2 text-right">
                                        {item.quantityOrdered}
                                      </td>
                                      <td className="px-3 py-2 text-right">
                                        <span
                                          className={
                                            item.quantityReceived >=
                                            item.quantityOrdered
                                              ? "text-green-600 font-medium"
                                              : item.quantityReceived > 0
                                              ? "text-orange-600 font-medium"
                                              : "text-gray-500"
                                          }
                                        >
                                          {item.quantityReceived}
                                        </span>
                                      </td>
                                      <td className="px-3 py-2 text-right font-medium">
                                        $
                                        {Number(
                                          item.subtotal
                                        )?.toLocaleString("es-AR")}
                                      </td>
                                      {(order.status === "PENDIENTE" ||
                                        order.status === "PARCIAL") && (
                                        <td className="px-3 py-2">
                                          {item.quantityReceived <
                                          item.quantityOrdered ? (
                                            <div className="flex items-center gap-1 justify-end">
                                              <input
                                                type="number"
                                                min={item.quantityReceived}
                                                max={item.quantityOrdered}
                                                value={itemReceiveQuantities[item.id] ?? ""}
                                                placeholder={`${item.quantityReceived}`}
                                                onChange={(e) => {
                                                  const val = parseInt(e.target.value);
                                                  setItemReceiveQuantities((prev) => ({
                                                    ...prev,
                                                    [item.id]: isNaN(val) ? 0 : Math.min(val, item.quantityOrdered),
                                                  }));
                                                }}
                                                className="w-16 border rounded px-2 py-1 text-xs text-center"
                                              />
                                              <button
                                                onClick={() => {
                                                  const qty = itemReceiveQuantities[item.id];
                                                  if (qty !== undefined && qty > item.quantityReceived && qty <= item.quantityOrdered) {
                                                    handleUpdateItemReceived(order.id, item.id, qty);
                                                  }
                                                }}
                                                disabled={
                                                  actionLoading === `item-${item.id}` ||
                                                  !itemReceiveQuantities[item.id] ||
                                                  itemReceiveQuantities[item.id] <= item.quantityReceived
                                                }
                                                className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs hover:bg-orange-200 disabled:opacity-50 whitespace-nowrap"
                                              >
                                                Parcial
                                              </button>
                                              <button
                                                onClick={() =>
                                                  handleUpdateItemReceived(
                                                    order.id,
                                                    item.id,
                                                    item.quantityOrdered
                                                  )
                                                }
                                                disabled={actionLoading === `item-${item.id}`}
                                                className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs hover:bg-blue-200 disabled:opacity-50 whitespace-nowrap"
                                              >
                                                Todo
                                              </button>
                                            </div>
                                          ) : (
                                            <span className="text-green-600 text-xs font-medium">
                                              ✓ Completo
                                            </span>
                                          )}
                                        </td>
                                      )}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Resumen */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs text-gray-500 uppercase tracking-wide">
                                Total
                              </p>
                              <p className="text-lg font-bold text-gray-900">
                                ${Number(order.totalAmount)?.toLocaleString("es-AR")}
                              </p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs text-gray-500 uppercase tracking-wide">
                                Proveedor
                              </p>
                              <p className="text-lg font-bold text-gray-900">
                                {order.supplier?.name}
                              </p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs text-gray-500 uppercase tracking-wide">
                                Estado
                              </p>
                              <p className="text-lg font-bold text-gray-900">
                                {order.status}
                              </p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs text-gray-500 uppercase tracking-wide">
                                Recibido por
                              </p>
                              <p className="text-lg font-bold text-gray-900">
                                {order.receivedBy
                                  ? `${order.receivedBy.firstname} ${order.receivedBy.lastname}`
                                  : "—"}
                              </p>
                            </div>
                          </div>

                          {/* Notas */}
                          {order.notes && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <p className="text-xs font-medium text-blue-800 mb-1">
                                Notas
                              </p>
                              <p className="text-sm text-blue-700 whitespace-pre-line">
                                {order.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
