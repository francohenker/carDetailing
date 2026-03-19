"use client"

import { useEffect, useState } from "react"
import { Plus, Edit2, Trash2, Save, X, ToggleLeft, ToggleRight, Building2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

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

interface WorkSpace {
  id: number
  name: string
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function WorkspaceManagement() {
  const [workspaces, setWorkspaces] = useState<WorkSpace[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingWorkspace, setEditingWorkspace] = useState<WorkSpace | null>(null)
  const [formName, setFormName] = useState("")
  const [formDescription, setFormDescription] = useState("")

  // Delete flow
  const [deleteConfirmWorkspace, setDeleteConfirmWorkspace] = useState<WorkSpace | null>(null)
  const [deleteBlockedModal, setDeleteBlockedModal] = useState(false)

  // Toggle last-active-workspace warning
  const [lastActiveWarnId, setLastActiveWarnId] = useState<number | null>(null)

  // Toggle deactivation info modal
  const [deactivationInfoWorkspace, setDeactivationInfoWorkspace] = useState<WorkSpace | null>(null)
  const [turnosCount, setTurnosCount] = useState<number>(0)

  const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL

  const fetchWorkspaces = async () => {
    try {
      const token = localStorage.getItem("jwt")
      const res = await fetch(`${API_URL}/workspace`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setWorkspaces(data)
      }
    } catch {
      toast.error("Error al cargar espacios de trabajo")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchWorkspaces() }, [])

  const handleCreate = async () => {
    if (!formName.trim()) {
      toast.error("El nombre es obligatorio")
      return
    }
    try {
      const token = localStorage.getItem("jwt")
      const res = await fetch(`${API_URL}/workspace`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: formName, description: formDescription || undefined })
      })
      if (res.ok) {
        toast.success("Espacio creado correctamente")
        setShowCreateDialog(false)
        setFormName("")
        setFormDescription("")
        fetchWorkspaces()
      } else {
        const err = await res.json()
        toast.error(err.message || "Error al crear espacio")
      }
    } catch {
      toast.error("Error al crear espacio")
    }
  }

  const handleUpdate = async () => {
    if (!editingWorkspace || !formName.trim()) return
    try {
      const token = localStorage.getItem("jwt")
      const res = await fetch(`${API_URL}/workspace/${editingWorkspace.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: formName, description: formDescription || undefined })
      })
      if (res.ok) {
        toast.success("Espacio actualizado")
        setEditingWorkspace(null)
        setFormName("")
        setFormDescription("")
        fetchWorkspaces()
      } else {
        const err = await res.json()
        toast.error(err.message || "Error al actualizar")
      }
    } catch {
      toast.error("Error al actualizar espacio")
    }
  }

  // Executes the toggle API call (called after any required confirmations)
  const executeToggle = async (id: number) => {
    try {
      const token = localStorage.getItem("jwt")
      const res = await fetch(`${API_URL}/workspace/${id}/toggle`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        toast.success("Estado actualizado")
        fetchWorkspaces()
      } else {
        const err = await res.json()
        toast.error(err.message || "Error al cambiar estado")
      }
    } catch {
      toast.error("Error al cambiar estado")
    }
  }

  const handleToggle = (ws: WorkSpace) => {
    // If deactivating the last active workspace, show a warning confirmation first
    if (ws.isActive && activeCount === 1) {
      setLastActiveWarnId(ws.id)
      return
    }
    
    // If deactivating (not the last active), show info modal about turnos
    if (ws.isActive) {
      setDeactivationInfoWorkspace(ws)
      // Fetch the turnos count for this workspace
      fetchTurnosCount(ws.id)
      return
    }
    
    // If activating, just execute toggle directly
    executeToggle(ws.id)
  }

  const fetchTurnosCount = async (workspaceId: number) => {
    try {
      const token = localStorage.getItem("jwt")
      const res = await fetch(`${API_URL}/workspace/${workspaceId}/turnos-count`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setTurnosCount(data.turnosCount)
      }
    } catch {
      setTurnosCount(0)
    }
  }

  const confirmLastActiveToggle = async () => {
    if (lastActiveWarnId !== null) {
      await executeToggle(lastActiveWarnId)
    }
    setLastActiveWarnId(null)
  }

  // Executes the delete API call after the "are you sure?" dialog is confirmed
  const executeDelete = async (id: number) => {
    setDeleteConfirmWorkspace(null)
    try {
      const token = localStorage.getItem("jwt")
      const res = await fetch(`${API_URL}/workspace/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        toast.success("Espacio eliminado correctamente")
        fetchWorkspaces()
      } else if (res.status === 409) {
        // Workspace has assigned turnos — cannot delete, must deactivate
        setDeleteBlockedModal(true)
      } else {
        const err = await res.json()
        toast.error(err.message || "Error al eliminar espacio")
      }
    } catch {
      toast.error("Error al eliminar espacio")
    }
  }

  const openEdit = (ws: WorkSpace) => {
    setEditingWorkspace(ws)
    setFormName(ws.name)
    setFormDescription(ws.description || "")
  }

  const activeCount = workspaces.filter(w => w.isActive).length

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Espacios de Trabajo
            </CardTitle>
            <CardDescription>
              Gestione los espacios físicos donde se realizan los servicios.
              Los turnos simultáneos se limitan a la cantidad de espacios activos ({activeCount}).
            </CardDescription>
          </div>
          <Button onClick={() => { setFormName(""); setFormDescription(""); setShowCreateDialog(true) }}>
            <Plus className="h-4 w-4 mr-2" /> Nuevo Espacio
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Cargando...</p>
          ) : workspaces.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No hay espacios de trabajo configurados.</p>
              <p className="text-sm">Sin espacios activos, no se podrán agendar turnos.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workspaces.map((ws) => (
                  <TableRow key={ws.id}>
                    <TableCell className="font-medium">{ws.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {ws.description || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={ws.isActive ? "default" : "secondary"}>
                        {ws.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleToggle(ws)}
                        title={ws.isActive ? "Desactivar" : "Activar"}>
                        {ws.isActive ? <ToggleRight className="h-4 w-4 text-green-600" /> : <ToggleLeft className="h-4 w-4 text-gray-400" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(ws)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteConfirmWorkspace(ws)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog crear */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Espacio de Trabajo</DialogTitle>
            <DialogDescription>Defina un espacio físico donde se realizan servicios.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre *</Label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Ej: Bahía 1" />
            </div>
            <div>
              <Label>Descripción</Label>
              <Input value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Ej: Espacio principal con rampa" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              <X className="h-4 w-4 mr-1" /> Cancelar
            </Button>
            <Button onClick={handleCreate}>
              <Save className="h-4 w-4 mr-1" /> Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog editar */}
      <Dialog open={!!editingWorkspace} onOpenChange={(open) => { if (!open) setEditingWorkspace(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Espacio de Trabajo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre *</Label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} />
            </div>
            <div>
              <Label>Descripción</Label>
              <Input value={formDescription} onChange={e => setFormDescription(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingWorkspace(null)}>
              <X className="h-4 w-4 mr-1" /> Cancelar
            </Button>
            <Button onClick={handleUpdate}>
              <Save className="h-4 w-4 mr-1" /> Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog confirmar eliminación */}
      <Dialog open={!!deleteConfirmWorkspace} onOpenChange={(open) => { if (!open) setDeleteConfirmWorkspace(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar espacio de trabajo</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar{" "}
              <span className="font-semibold text-foreground">{deleteConfirmWorkspace?.name}</span>?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmWorkspace(null)}>
              <X className="h-4 w-4 mr-1" /> Cancelar
            </Button>
            <Button variant="destructive" onClick={() => deleteConfirmWorkspace && executeDelete(deleteConfirmWorkspace.id)}>
              <Trash2 className="h-4 w-4 mr-1" /> Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: no se puede eliminar — tiene turnos asignados */}
      <Dialog open={deleteBlockedModal} onOpenChange={setDeleteBlockedModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              No se puede eliminar este espacio
            </DialogTitle>
            <DialogDescription className="pt-2 text-base text-foreground">
              Este espacio tiene turnos asignados en el historial por lo que no puede eliminarse.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Si ya no deseas utilizarlo, podés cambiarlo a estado{" "}
            <span className="font-semibold">Inactivo</span> desde la tabla. Los turnos ya registrados
            con este espacio no se verán afectados.
          </p>
          <DialogFooter>
            <Button onClick={() => setDeleteBlockedModal(false)}>
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: advertencia al desactivar el último espacio activo */}
      <Dialog open={lastActiveWarnId !== null} onOpenChange={(open) => { if (!open) setLastActiveWarnId(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Atención: último espacio activo
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Este es el <span className="font-semibold text-foreground">único espacio de trabajo activo</span>.
            Si lo desactivás, <span className="font-semibold text-destructive">no se podrán agendar nuevos turnos</span> dentro
            del sistema hasta que vuelvas a activar al menos un espacio.
          </p>
          <p className="text-sm text-muted-foreground">
            Los turnos ya registrados no se cancela.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLastActiveWarnId(null)}>
              <X className="h-4 w-4 mr-1" /> Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmLastActiveToggle}>
              Desactivar de todas formas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: información sobre desactivación de espacio */}
      <Dialog open={!!deactivationInfoWorkspace} onOpenChange={(open) => { if (!open) setDeactivationInfoWorkspace(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-blue-500" />
              Desactivar espacio de trabajo
            </DialogTitle>
            <DialogDescription className="pt-2 text-base text-foreground">
              Estás a punto de desactivar <span className="font-semibold">{deactivationInfoWorkspace?.name}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                ℹ️ Información importante:
              </p>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="font-bold">•</span>
                  <span>Los <strong>{turnosCount} turno(s)</strong> asociado(s) a este espacio <strong>NO se cancelarán</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">•</span>
                  <span>Los turnos <strong>deben realizarse igualmente</strong> en este espacio</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">•</span>
                  <span>No se asignarán <strong>nuevos turnos</strong> a este espacio</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">•</span>
                  <span>Podés reactivar el espacio en cualquier momento desde esta tabla</span>
                </li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivationInfoWorkspace(null)}>
              <X className="h-4 w-4 mr-1" /> Cancelar
            </Button>
            <Button variant="destructive" onClick={() => {
              if (deactivationInfoWorkspace) {
                executeToggle(deactivationInfoWorkspace.id)
                setDeactivationInfoWorkspace(null)
              }
            }}>
              Desactivar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
