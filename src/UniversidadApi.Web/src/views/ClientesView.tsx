import { useState, type FormEvent } from "react"
import {
  ClipboardList,
  List,
  Loader2,
  PlusCircle,
  Save,
  Search,
  UserCog,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/PageHeader"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  api,
  type ClienteDto,
  type EstadoCuentaDto,
} from "@/lib/api"
import { formatCurrency, formatDate } from "@/lib/utils"

export function ClientesView() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Estudiantes"
        description="Registra, actualiza y consulta estudiantes por su carné."
        icon={<Users className="size-5" />}
      />
      <div className="grid gap-4 xl:grid-cols-2">
        <RegistrarCard />
        <ActualizarCard />
      </div>
      <ListadoEstudiantesCard />
      <BuscarYEstadoCard />
    </div>
  )
}

function RegistrarCard() {
  const [carne, setCarne] = useState("")
  const [nombre, setNombre] = useState("")
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!carne.trim() || !nombre.trim()) return
    setLoading(true)
    try {
      const r = await api.post<ClienteDto>("/clientes", {
        carne: carne.trim(),
        nombre: nombre.trim(),
      })
      toast.success("Estudiante registrado", {
        description: `${r.nombre} · Carné ${r.carne}`,
      })
      setCarne("")
      setNombre("")
    } catch (err) {
      toast.error("No se pudo registrar el estudiante", {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlusCircle className="size-4 text-emerald-600" />
          Registrar estudiante
        </CardTitle>
        <CardDescription>
          El carné es el identificador único en la universidad.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-3" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="reg-carne">Carné</Label>
            <Input
              id="reg-carne"
              placeholder="0901-22-1234"
              value={carne}
              onChange={(e) => setCarne(e.target.value)}
              autoComplete="off"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reg-nombre">Nombre completo</Label>
            <Input
              id="reg-nombre"
              placeholder="Juan Pérez"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              autoComplete="off"
              required
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <PlusCircle className="size-4" />
            )}
            Registrar estudiante
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function ActualizarCard() {
  const [carne, setCarne] = useState("")
  const [nombre, setNombre] = useState("")
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!carne.trim() || !nombre.trim()) return
    setLoading(true)
    try {
      const r = await api.put<ClienteDto>(
        `/clientes/${encodeURIComponent(carne.trim())}`,
        { nombre: nombre.trim() },
      )
      toast.success("Estudiante actualizado", {
        description: `${r.nombre} · Carné ${r.carne}`,
      })
    } catch (err) {
      toast.error("No se pudo actualizar", {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCog className="size-4 text-emerald-600" />
          Actualizar nombre
        </CardTitle>
        <CardDescription>
          Modifica el nombre de un estudiante existente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-3" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="upd-carne">Carné</Label>
            <Input
              id="upd-carne"
              placeholder="0901-22-1234"
              value={carne}
              onChange={(e) => setCarne(e.target.value)}
              autoComplete="off"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="upd-nombre">Nuevo nombre</Label>
            <Input
              id="upd-nombre"
              placeholder="Nombre completo"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              autoComplete="off"
              required
            />
          </div>
          <Button type="submit" variant="outline" disabled={loading}>
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Guardar cambios
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function ListadoEstudiantesCard() {
  const [loading, setLoading] = useState(false)
  const [clientes, setClientes] = useState<ClienteDto[]>([])

  async function onListar() {
    setLoading(true)
    try {
      const data = await api.get<ClienteDto[]>("/clientes")
      setClientes(data)
      toast.success("Estudiantes cargados", {
        description: `${data.length} registros`,
      })
    } catch (err) {
      toast.error("No se pudo cargar el listado", {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <List className="size-4 text-emerald-600" />
          Todos los estudiantes
        </CardTitle>
        <CardDescription>
          GET <code>/clientes</code>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button type="button" onClick={onListar} variant="outline" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          Listar todos
        </Button>

        {clientes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aún no hay datos cargados. Presiona “Listar todos”.
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Carné</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Registro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientes.map((c) => (
                  <TableRow key={c.carne}>
                    <TableCell className="font-mono">{c.carne}</TableCell>
                    <TableCell>{c.nombre}</TableCell>
                    <TableCell>{formatDate(c.fechaRegistro)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function BuscarYEstadoCard() {
  const [carne, setCarne] = useState("")
  const [loading, setLoading] = useState(false)
  const [cliente, setCliente] = useState<ClienteDto | null>(null)
  const [estado, setEstado] = useState<EstadoCuentaDto | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!carne.trim()) return
    setLoading(true)
    setCliente(null)
    setEstado(null)
    try {
      const id = encodeURIComponent(carne.trim())
      const [c, est] = await Promise.all([
        api.get<ClienteDto>(`/clientes/${id}`),
        api.get<EstadoCuentaDto>(`/clientes/${id}/estado-cuenta`),
      ])
      setCliente(c)
      setEstado(est)
      toast.success("Estudiante encontrado", { description: c.nombre })
    } catch (err) {
      toast.error("No se encontró el estudiante", {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="size-4 text-emerald-600" />
          Buscar y estado de cuenta
        </CardTitle>
        <CardDescription>
          Consulta los datos del estudiante y sus cuotas.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={onSubmit}
        >
          <div className="grid min-w-[200px] flex-1 gap-2">
            <Label htmlFor="buscar-carne">Carné</Label>
            <Input
              id="buscar-carne"
              placeholder="0901-22-1234"
              value={carne}
              onChange={(e) => setCarne(e.target.value)}
              autoComplete="off"
              required
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Search className="size-4" />
            )}
            Buscar
          </Button>
        </form>

        {cliente && estado && (
          <div className="grid gap-4">
            <Separator />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold">{cliente.nombre}</p>
                <p className="text-muted-foreground text-sm">
                  Carné {cliente.carne} · Registrado {formatDate(cliente.fechaRegistro)}
                </p>
              </div>
              <Badge
                variant={estado.deudaTotal > 0 ? "warning" : "success"}
              >
                Deuda actual: {formatCurrency(estado.deudaTotal)}
              </Badge>
            </div>

            <CuotasTable
              title="Cuotas pendientes"
              empty="Sin cuotas pendientes"
              cuotas={estado.cuotasPendientes}
            />
            <CuotasTable
              title="Cuotas pagadas"
              empty="Aún no registra pagos"
              cuotas={estado.cuotasPagadas}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface CuotasTableProps {
  title: string
  empty: string
  cuotas: EstadoCuentaDto["cuotasPendientes"]
}

function CuotasTable({ title, empty, cuotas }: CuotasTableProps) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">{title}</p>
      {cuotas.length === 0 ? (
        <p className="text-muted-foreground rounded-md border border-dashed p-3 text-sm">
          {empty}
        </p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Periodo</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead>Fecha pago</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Referencia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cuotas.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.periodo}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(c.monto)}
                  </TableCell>
                  <TableCell>{formatDate(c.fechaPago)}</TableCell>
                  <TableCell>
                    {c.metodoPago ? (
                      <Badge variant="outline">{c.metodoPago}</Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {c.referencia ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
