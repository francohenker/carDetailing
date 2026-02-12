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
                <div key={item.id} className="bg-white rounded-lg shadow p-6">
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
                  </div>
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
                        <label className="text-sm text-gray-600">
                            Precio unitario
                        </label>
                        <input
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
                        <label className="text-sm text-gray-600">Cantidad</label>
                        <input
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
                        <label className="text-sm text-gray-600">Disponibilidad</label>
                        <select
                          value={pq.availability}
                          onChange={(e) => {
                            const updated = [...respondForm.productQuotes];
                            updated[idx].availability = e.target.value;
                            setRespondForm({ ...respondForm, productQuotes: updated });
                          }}
                          className="w-full border rounded px-3 py-2 mt-1"
                        >
                          <option>Disponible inmediato</option>
                          <option>Disponible en 2-3 días</option>
                          <option>Bajo pedido (5-7 días)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Días de entrega
                    </label>
                    <input
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
                    <label className="text-sm font-medium text-gray-700">
                      Condiciones de pago
                    </label>
                    <select
                      value={respondForm.paymentTerms}
                      onChange={(e) =>
                        setRespondForm({ ...respondForm, paymentTerms: e.target.value })
                      }
                      className="w-full border rounded px-3 py-2 mt-1"
                    >
                      <option>Contado</option>
                      <option>15 días</option>
                      <option>30 días</option>
                      <option>60 días</option>
                      <option>50% adelanto, 50% contra entrega</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Notas</label>
                  <textarea
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
