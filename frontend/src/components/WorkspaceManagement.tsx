"use client"

import { useEffect, useState } from "react"
import { Plus, Edit2, Trash2, Save, X, ToggleLeft, ToggleRight, Building2 } from "lucide-react"
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

  const handleToggle = async (id: number) => {
    try {
      const token = localStorage.getItem("jwt")
      const res = await fetch(`${API_URL}/workspace/${id}/toggle`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        toast.success("Estado actualizado")
        fetchWorkspaces()
      }
    } catch {
      toast.error("Error al cambiar estado")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este espacio?")) return
    try {
      const token = localStorage.getItem("jwt")
      const res = await fetch(`${API_URL}/workspace/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        toast.success("Espacio eliminado")
        fetchWorkspaces()
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
                      <Button variant="ghost" size="icon" onClick={() => handleToggle(ws.id)}
                        title={ws.isActive ? "Desactivar" : "Activar"}>
                        {ws.isActive ? <ToggleRight className="h-4 w-4 text-green-600" /> : <ToggleLeft className="h-4 w-4 text-gray-400" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(ws)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(ws.id)}>
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
    </>
  )
}
