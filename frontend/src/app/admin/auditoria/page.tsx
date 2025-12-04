"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  FileText,
  Calendar,
  Activity,
  TrendingUp,
  TrendingDown,
  Users,
  Filter,
  Search,
  RefreshCw,
} from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoutes";
import HeaderDefault from "@/app/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import DataComparison from "@/components/auditoria/DataComparison";
import UserInfo from "@/components/auditoria/UserInfo";
import AuditSummary from "@/components/auditoria/AuditSummary";
import ActivitySummary from "@/components/auditoria/ActivitySummary";
import HourlyActivity from "@/components/auditoria/HourlyActivity";
import PaginationControls from "@/components/auditoria/PaginationControls";
import RecordsSummary from "@/components/auditoria/RecordsSummary";

interface AuditoriaRecord {
  id: number;
  accion: string;
  entidad: string;
  entidadId?: number;
  descripcion?: string;
  fechaCreacion: string;
  usuario?: {
    firstname: string;
    lastname: string;
    email: string;
  };
  ip?: string;
  userAgent?: string;
  datosAnteriores?: any;
  datosNuevos?: any;
}

interface AuditoriaStats {
  totalRegistros: number;
  registrosHoy: number;
  registrosEstaSemana: number;
  registrosEsteMes: number;
  registrosAyer: number;
  registrosSemanaAnterior: number;
  crecimientoHoy: number;
  crecimientoSemana: number;
  accionesMasComunes: Array<{ accion: string; cantidad: number }>;
  entidadesMasAuditadas: Array<{ entidad: string; cantidad: number }>;
  usuariosMasActivos: Array<{ usuario: string; cantidad: number }>;
  distribucionPorHora: Array<{ hora: number; cantidad: number }>;
}

export default function AuditoriaPage() {
  const [records, setRecords] = useState<AuditoriaRecord[]>([]);
  const [stats, setStats] = useState<AuditoriaStats>({
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
  });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filters, setFilters] = useState({
    accion: "",
    entidad: "",
    usuarioId: "",
    limit: "50",
  });

  const fetchRecords = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        ...filters,
      });

      const response = await fetch(`/api/auditoria?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
      });

      if (!response.ok) throw new Error("Error fetching auditoria records");

      const data = await response.json();
      setRecords(data.data || []);
      setCurrentPage(data.page || 1);
      setTotalPages(data.totalPages || 1);
      setTotalRecords(data.total || 0);
    } catch (error) {
      console.error("Error fetching auditoria records:", error);
      toast.error("Error", {
        description: "No se pudieron cargar los registros de auditoría.",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/auditoria/estadisticas`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
      });

      if (!response.ok) throw new Error("Error fetching auditoria stats");

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching auditoria stats:", error);
    }
  };

  useEffect(() => {
    fetchRecords();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setCurrentPage(1);
    fetchRecords(1);
  };

  const clearFilters = () => {
    setFilters({
      accion: "",
      entidad: "",
      usuarioId: "",
      limit: "50",
    });
    setCurrentPage(1);
    fetchRecords(1);
  };

  const getTrendIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (growth < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Activity className="h-4 w-4 text-gray-600" />;
  };

  const getTrendColor = (growth: number) => {
    if (growth > 0) return "text-green-600";
    if (growth < 0) return "text-red-600";
    return "text-gray-600";
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
      fetchRecords(page);
    }
  };

  const handleRecordsPerPageChange = (limit: string) => {
    handleFilterChange("limit", limit);
    setCurrentPage(1);
    fetchRecords(1);
  };

  const hasActiveFilters = () => {
    return (
      filters.accion !== "" ||
      filters.entidad !== "" ||
      filters.usuarioId !== ""
    );
  };

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="min-h-screen bg-base-100">
        <HeaderDefault />
        <main className="container mx-auto p-6">
          <div className="flex items-center gap-2 mb-6">
            <Link
              href="/admin"
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileText className="h-8 w-8 text-primary" />
              Auditoría del Sistema
            </h1>
          </div>

          {/* Resumen de Actividad */}
          <ActivitySummary
            registrosHoy={stats.registrosHoy}
            registrosAyer={stats.registrosAyer}
            registrosEstaSemana={stats.registrosEstaSemana}
            registrosSemanaAnterior={stats.registrosSemanaAnterior}
            crecimientoHoy={stats.crecimientoHoy}
            crecimientoSemana={stats.crecimientoSemana}
            usuariosMasActivos={stats.usuariosMasActivos}
          />

          {/* Estadísticas Principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Registros
                    </p>
                    <p className="text-2xl font-bold">
                      {stats.totalRegistros.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Histórico completo
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600 bg-blue-100 p-1.5 rounded-full" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Registros Hoy
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold">{stats.registrosHoy}</p>
                      {getTrendIcon(stats.crecimientoHoy)}
                    </div>
                    <p
                      className={`text-xs ${getTrendColor(stats.crecimientoHoy)}`}
                    >
                      {stats.crecimientoHoy > 0 ? "+" : ""}
                      {stats.crecimientoHoy}% vs ayer ({stats.registrosAyer})
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
                    <p className="text-sm font-medium text-muted-foreground">
                      Esta Semana
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold">
                        {stats.registrosEstaSemana}
                      </p>
                      {getTrendIcon(stats.crecimientoSemana)}
                    </div>
                    <p
                      className={`text-xs ${getTrendColor(stats.crecimientoSemana)}`}
                    >
                      {stats.crecimientoSemana > 0 ? "+" : ""}
                      {stats.crecimientoSemana}% vs semana anterior (
                      {stats.registrosSemanaAnterior})
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
                    <p className="text-sm font-medium text-muted-foreground">
                      Este Mes
                    </p>
                    <p className="text-2xl font-bold">
                      {stats.registrosEsteMes}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Actividad mensual
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-600 bg-orange-100 p-1.5 rounded-full" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Estadísticas Adicionales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Acciones Más Comunes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.accionesMasComunes.slice(0, 5).map((accion, index) => (
                    <div
                      key={accion.accion}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-blue-600">
                          #{index + 1}
                        </span>
                        <span className="text-sm">{accion.accion}</span>
                      </div>
                      <span className="text-sm font-bold">
                        {accion.cantidad}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Entidades Más Auditadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.entidadesMasAuditadas
                    .slice(0, 5)
                    .map((entidad, index) => (
                      <div
                        key={entidad.entidad}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-green-600">
                            #{index + 1}
                          </span>
                          <span className="text-sm">{entidad.entidad}</span>
                        </div>
                        <span className="text-sm font-bold">
                          {entidad.cantidad}
                        </span>
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
                  {stats.usuariosMasActivos
                    .slice(0, 5)
                    .map((usuario, index) => (
                      <div
                        key={usuario.usuario}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-purple-600">
                            #{index + 1}
                          </span>
                          <span
                            className="text-sm truncate max-w-[120px]"
                            title={usuario.usuario}
                          >
                            {usuario.usuario}
                          </span>
                        </div>
                        <span className="text-sm font-bold">
                          {usuario.cantidad}
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actividad por Horas */}
          {/* <div className="mb-6">
            <HourlyActivity distribucionPorHora={stats.distribucionPorHora} />
          </div> */}

          {/* Filtros */}
          <Card className="mb-6">
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
                    value={filters.accion}
                    onValueChange={(value) =>
                      handleFilterChange("accion", value)
                    }
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
                      <SelectItem value="MARCAR_COMPLETADO">
                        MARCAR_COMPLETADO
                      </SelectItem>
                      <SelectItem value="MARCAR_PAGADO">
                        MARCAR_PAGADO
                      </SelectItem>
                      <SelectItem value="CANCELAR">CANCELAR</SelectItem>
                      <SelectItem value="MODIFICAR_ROL">
                        MODIFICAR_ROL
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="text-sm font-medium mb-1">Entidad</div>
                  <Select
                    value={filters.entidad}
                    onValueChange={(value) =>
                      handleFilterChange("entidad", value)
                    }
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
                    value={filters.limit}
                    onValueChange={(value) =>
                      handleFilterChange("limit", value)
                    }
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
                  <Button onClick={applyFilters} className="flex-1">
                    <Search className="h-4 w-4 mr-2" />
                    Buscar
                  </Button>
                  <Button variant="outline" onClick={clearFilters}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumen de registros */}
          <RecordsSummary
            totalRecords={stats.totalRegistros}
            currentPage={currentPage}
            recordsPerPage={parseInt(filters.limit)}
            filteredRecords={totalRecords}
            hasFilters={hasActiveFilters()}
          />

          {/* Registros */}
          <Card>
            <CardHeader>
              <CardTitle>Registros de Auditoría</CardTitle>
              <CardDescription>
                {totalRecords > 0 ? (
                  <>
                    Página {currentPage} de {totalPages}
                  </>
                ) : (
                  "No hay registros para mostrar"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              ) : records.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No se encontraron registros de auditoría.
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {records.map((record) => (
                      <div
                        key={record.id}
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <AuditSummary
                          accion={record.accion}
                          entidad={record.entidad}
                          entidadId={record.entidadId}
                          descripcion={record.descripcion}
                          datosAnteriores={record.datosAnteriores}
                          datosNuevos={record.datosNuevos}
                        />

                        {/* Componente de comparación de datos */}
                        <DataComparison
                          datosAnteriores={record.datosAnteriores}
                          datosNuevos={record.datosNuevos}
                          accion={record.accion}
                        />

                        <UserInfo
                          usuario={record.usuario}
                          ip={record.ip}
                          fechaCreacion={record.fechaCreacion}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Paginación con componente reutilizable */}
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalRecords={totalRecords}
                    recordsPerPage={parseInt(filters.limit)}
                    onPageChange={handlePageChange}
                    onRecordsPerPageChange={handleRecordsPerPageChange}
                    loading={loading}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
}
