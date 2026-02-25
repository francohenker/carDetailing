"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoutes";
import HeaderDefault from "../header";

interface QuotationRequest {
  id: number;
  products: { id: number; name: string }[];
  notes: string;
  sentAt: string;
  status: string;
}

interface QuotationHistoryItem {
  id: number;
  quotationRequestId: number;
  quotationRequest?: {
    products: { id: number; name: string }[];
  };
  productQuotes: {
    productId: number;
    productName: string;
    unitPrice: number;
    quantity: number;
    availability: string;
  }[];
  totalAmount: number;
  deliveryDays: number;
  paymentTerms: string;
  notes?: string;
  status: string;
  isWinner: boolean;
  receivedAt: string;
}

interface RespondForm {
  productQuotes: {
    productId: number;
    productName: string;
    unitPrice: number;
    quantity: number;
    availability: string;
  }[];
  deliveryDays: number;
  paymentTerms: string;
  notes: string;
}

export default function SupplierDashboard() {
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const [pendingRequests, setPendingRequests] = useState<QuotationRequest[]>([]);
  const [history, setHistory] = useState<QuotationHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState<QuotationRequest | null>(null);
  const [respondForm, setRespondForm] = useState<RespondForm | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState<number | null>(null);

  const API = process.env.NEXT_PUBLIC_BACKEND_URL;
  const getToken = () => localStorage.getItem("jwt");

  const fetchData = async () => {
    setLoading(true);
    const token = getToken();
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [pendingRes, historyRes] = await Promise.all([
        fetch(`${API}/quotation/supplier/pending`, { headers }),
        fetch(`${API}/quotation/supplier/history`, { headers }),
      ]);
      if (pendingRes.ok) setPendingRequests(await pendingRes.json());
      if (historyRes.ok) setHistory(await historyRes.json());
    } catch (e) {
      console.error("Error fetching supplier data:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openRespondForm = (request: QuotationRequest) => {
    setRespondingTo(request);
    setRespondForm({
      productQuotes: request.products.map((p) => ({
        productId: p.id,
        productName: p.name,
        unitPrice: 0,
        quantity: 1,
        availability: "Disponible inmediato",
      })),
      deliveryDays: 3,
      paymentTerms: "30 días",
      notes: "",
    });
  };

  const handleSubmitResponse = async () => {
    if (!respondingTo || !respondForm) return;
    setSubmitting(true);
    try {
      const token = getToken();
      const res = await fetch(
        `${API}/quotation/supplier/respond/${respondingTo.id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(respondForm),
        }
      );
      if (res.ok) {
        setRespondingTo(null);
        setRespondForm(null);
        await fetchData();
      } else {
        const err = await res.json();
        alert(err.message || "Error al enviar respuesta");
      }
    } catch (e) {
      alert("Error de conexión");
    }
    setSubmitting(false);
  };

  return (
    <ProtectedRoute allowedRoles={['supplier']}>
    <HeaderDefault />
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Panel de Proveedor
        </h1>
        <p className="text-gray-500 mb-6">Gestione sus solicitudes de cotización y responda con precios y condiciones.</p>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === "pending"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border"
            }`}
          >
            Solicitudes Pendientes ({pendingRequests.length})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === "history"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border"
            }`}
          >
            Historial
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Cargando...</div>
        ) : activeTab === "pending" ? (
          <div className="space-y-4">
            {pendingRequests.length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center text-gray-500">
                No hay solicitudes pendientes
              </div>
            ) : (
              pendingRequests.map((req) => (
                <div key={req.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">
                        Solicitud #{req.id}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Recibida: {new Date(req.sentAt).toLocaleDateString("es-AR")}
                      </p>
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700">Productos:</p>
                        <ul className="list-disc list-inside text-sm text-gray-600">
                          {req.products.map((p) => (
                            <li key={p.id}>{p.name}</li>
                          ))}
                        </ul>
                      </div>
                      {req.notes && (
                        <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-sm font-medium text-blue-800 mb-1">Mensaje del solicitante:</p>
                          <p className="text-sm text-blue-700 whitespace-pre-line">{req.notes}</p>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => openRespondForm(req)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Responder
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {history.length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center text-gray-500">
                No hay cotizaciones respondidas
              </div>
            ) : (
              history.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow">
                  <div
                    role="button"
                    tabIndex={0}
                    className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedHistoryId(expandedHistoryId === item.id ? null : item.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedHistoryId(expandedHistoryId === item.id ? null : item.id); } }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">
                          Cotización #{item.quotationRequestId}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Enviada: {new Date(item.receivedAt).toLocaleDateString("es-AR")}
                        </p>
                        <p className="text-sm mt-1">
                          <strong>Total:</strong> ${item.totalAmount?.toLocaleString("es-AR")}
                        </p>
                        <p className="text-sm">
                          <strong>Entrega:</strong> {item.deliveryDays} días
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            item.isWinner
                              ? "bg-green-100 text-green-800"
                              : item.status === "REJECTED"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {item.isWinner ? "Ganadora" : item.status === "REJECTED" ? "Rechazada" : "Pendiente"}
                        </span>
                        <svg
                          className={`h-5 w-5 text-gray-400 transition-transform ${expandedHistoryId === item.id ? 'rotate-180' : ''}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {expandedHistoryId === item.id && (
                    <div className="border-t px-6 pb-6 pt-4 space-y-4">
                      {/* Productos cotizados */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Detalle por producto</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-gray-100 text-gray-600">
                                <th className="text-left px-3 py-2 rounded-tl-lg">Producto</th>
                                <th className="text-right px-3 py-2">Precio unitario</th>
                                <th className="text-right px-3 py-2">Cantidad</th>
                                <th className="text-right px-3 py-2">Subtotal</th>
                                <th className="text-left px-3 py-2 rounded-tr-lg">Disponibilidad</th>
                              </tr>
                            </thead>
                            <tbody>
                              {item.productQuotes.map((pq, idx) => (
                                <tr key={idx} className="border-b last:border-0">
                                  <td className="px-3 py-2 font-medium">{pq.productName}</td>
                                  <td className="px-3 py-2 text-right">${pq.unitPrice?.toLocaleString("es-AR")}</td>
                                  <td className="px-3 py-2 text-right">{pq.quantity}</td>
                                  <td className="px-3 py-2 text-right font-medium">
                                    ${(pq.unitPrice * pq.quantity)?.toLocaleString("es-AR")}
                                  </td>
                                  <td className="px-3 py-2">
                                    <span className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded">
                                      {pq.availability}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Condiciones */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
                          <p className="text-lg font-bold text-gray-900">${item.totalAmount?.toLocaleString("es-AR")}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Días de entrega</p>
                          <p className="text-lg font-bold text-gray-900">{item.deliveryDays} días</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Condiciones de pago</p>
                          <p className="text-lg font-bold text-gray-900">{item.paymentTerms}</p>
                        </div>
                      </div>

                      {/* Notas */}
                      {item.notes && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-xs font-medium text-blue-800 mb-1">Notas</p>
                          <p className="text-sm text-blue-700 whitespace-pre-line">{item.notes}</p>
                        </div>
                      )}

                      {/* Productos solicitados originalmente */}
                      {item.quotationRequest?.products && item.quotationRequest.products.length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <p className="text-xs font-medium text-amber-800 mb-1">Productos solicitados originalmente</p>
                          <ul className="list-disc list-inside text-sm text-amber-700">
                            {item.quotationRequest.products.map((p) => (
                              <li key={p.id}>{p.name}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Respond Modal */}
        {respondingTo && respondForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-4">
              <h2 className="text-xl font-bold mb-4">
                Responder Solicitud #{respondingTo.id}
              </h2>

              <div className="space-y-4">
                <h3 className="font-semibold">Cotización por producto</h3>
                {respondForm.productQuotes.map((pq, idx) => (
                  <div key={pq.productId} className="border rounded-lg p-4">
                    <p className="font-medium mb-2">{pq.productName}</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label htmlFor={`unitPrice-${pq.productId}`} className="text-sm text-gray-600">
                            Precio unitario
                        </label>
                        <input
                          id={`unitPrice-${pq.productId}`}
                          type="number"
                          step="0.01"
                          min="0"
                          value={pq.unitPrice}
                          onChange={(e) => {
                            const updated = [...respondForm.productQuotes];
                            updated[idx].unitPrice = parseFloat(e.target.value) || 0;
                            setRespondForm({ ...respondForm, productQuotes: updated });
                          }}
                          className="w-full border rounded px-3 py-2 mt-1"
                        />
                      </div>
                      <div>
                        <label htmlFor={`quantity-${pq.productId}`} className="text-sm text-gray-600">Cantidad</label>
                        <input
                          id={`quantity-${pq.productId}`}
                          type="number"
                          min="1"
                          value={pq.quantity}
                          onChange={(e) => {
                            const updated = [...respondForm.productQuotes];
                            updated[idx].quantity = parseInt(e.target.value) || 1;
                            setRespondForm({ ...respondForm, productQuotes: updated });
                          }}
                          className="w-full border rounded px-3 py-2 mt-1"
                        />
                      </div>
                      <div>
                        <label htmlFor={`availability-${pq.productId}`} className="text-sm text-gray-600">Disponibilidad</label>
                        <select
                          id={`availability-${pq.productId}`}
                          value={["Disponible inmediato", "Disponible en 2-3 días", "Bajo pedido (5-7 días)"].includes(pq.availability) ? pq.availability : "Otro"}
                          onChange={(e) => {
                            const updated = [...respondForm.productQuotes];
                            updated[idx].availability = e.target.value === "Otro" ? "" : e.target.value;
                            setRespondForm({ ...respondForm, productQuotes: updated });
                          }}
                          className="w-full border rounded px-3 py-2 mt-1"
                        >
                          <option>Disponible inmediato</option>
                          <option>Disponible en 2-3 días</option>
                          <option>Bajo pedido (5-7 días)</option>
                          <option>Otro</option>
                        </select>
                        {!["Disponible inmediato", "Disponible en 2-3 días", "Bajo pedido (5-7 días)"].includes(pq.availability) && (
                          <input
                            type="text"
                            placeholder="Escriba la disponibilidad..."
                            value={pq.availability}
                            onChange={(e) => {
                              const updated = [...respondForm.productQuotes];
                              updated[idx].availability = e.target.value;
                              setRespondForm({ ...respondForm, productQuotes: updated });
                            }}
                            className="w-full border rounded px-3 py-2 mt-2"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="deliveryDays" className="text-sm font-medium text-gray-700">
                      Días de entrega
                    </label>
                    <input
                      id="deliveryDays"
                      type="number"
                      min="1"
                      value={respondForm.deliveryDays}
                      onChange={(e) =>
                        setRespondForm({
                          ...respondForm,
                          deliveryDays: parseInt(e.target.value) || 1,
                        })
                      }
                      className="w-full border rounded px-3 py-2 mt-1"
                    />
                  </div>
                  <div>
                    <label htmlFor="paymentTerms" className="text-sm font-medium text-gray-700">
                      Condiciones de pago
                    </label>
                    <select
                      id="paymentTerms"
                      value={["Contado", "15 días", "30 días", "60 días", "50% adelanto, 50% contra entrega"].includes(respondForm.paymentTerms) ? respondForm.paymentTerms : "Otro"}
                      onChange={(e) =>
                        setRespondForm({ ...respondForm, paymentTerms: e.target.value === "Otro" ? "" : e.target.value })
                      }
                      className="w-full border rounded px-3 py-2 mt-1"
                    >
                      <option>Contado</option>
                      <option>15 días</option>
                      <option>30 días</option>
                      <option>60 días</option>
                      <option>50% adelanto, 50% contra entrega</option>
                      <option>Otro</option>
                    </select>
                    {!["Contado", "15 días", "30 días", "60 días", "50% adelanto, 50% contra entrega"].includes(respondForm.paymentTerms) && (
                      <input
                        type="text"
                        placeholder="Escriba sus condiciones de pago..."
                        value={respondForm.paymentTerms}
                        onChange={(e) =>
                          setRespondForm({ ...respondForm, paymentTerms: e.target.value })
                        }
                        className="w-full border rounded px-3 py-2 mt-2"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="notes" className="text-sm font-medium text-gray-700">Notas</label>
                  <textarea
                    id="notes"
                    value={respondForm.notes}
                    onChange={(e) =>
                      setRespondForm({ ...respondForm, notes: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2 mt-1"
                    rows={3}
                  />
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-700">
                    Total estimado: $
                    {respondForm.productQuotes
                      .reduce((sum, pq) => sum + pq.unitPrice * pq.quantity, 0)
                      .toLocaleString("es-AR")}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6 justify-end">
                <button
                  onClick={() => {
                    setRespondingTo(null);
                    setRespondForm(null);
                  }}
                  className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmitResponse}
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? "Enviando..." : "Enviar Cotización"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </ProtectedRoute>
  );
}
