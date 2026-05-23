import { useState } from "react"
import { Loader2, Search, UserPlus, Users } from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/PageHeader"
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
import { Badge } from "@/components/ui/badge"
import { apiGet, apiPost } from "@/lib/api"

interface ClienteResponse {
  id: number
  nombre: string
  dpi: string
  cuentas?: Array<{
    id: number
    numeroCuenta: string
    saldo: number
    tipo: number | string
  }>
}

export function ClientesView() {
  const [nombre, setNombre] = useState("")
  const [dpi, setDpi] = useState("")
  const [creating, setCreating] = useState(false)
  const [creado, setCreado] = useState<ClienteResponse | null>(null)

  const [buscarId, setBuscarId] = useState("")
  const [searching, setSearching] = useState(false)
  const [encontrado, setEncontrado] = useState<ClienteResponse | null>(null)

  const handleCrear = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setCreating(true)
    try {
      const cliente = await apiPost<ClienteResponse>("/clientes", {
        nombre,
        dpi,
      })
      setCreado(cliente)
      toast.success("Cliente creado", {
        description: `Id ${cliente.id} · ${cliente.nombre}`,
      })
      setNombre("")
      setDpi("")
    } catch (error) {
      toast.error("No se pudo crear el cliente", {
        description: (error as Error).message,
      })
    } finally {
      setCreating(false)
    }
  }

  const handleBuscar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!buscarId.trim()) return
    setSearching(true)
    setEncontrado(null)
    try {
      const cliente = await apiGet<ClienteResponse>(`/clientes/${buscarId}`)
      setEncontrado(cliente)
      toast.success("Cliente encontrado", {
        description: `${cliente.nombre} · DPI ${cliente.dpi}`,
      })
    } catch (error) {
      toast.error("No se encontró el cliente", {
        description: (error as Error).message,
      })
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Crear y consultar clientes del banco."
        icon={<Users className="size-5" />}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Crear cliente</CardTitle>
            <CardDescription>
              POST <code>/clientes</code> con nombre y DPI.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCrear} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. María García"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dpi">DPI</Label>
                <Input
                  id="dpi"
                  value={dpi}
                  onChange={(e) => setDpi(e.target.value)}
                  placeholder="Ej. 1234567890101"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={creating}
                className="w-full bg-blue-600 text-white hover:bg-blue-600/90"
              >
                {creating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <UserPlus className="size-4" />
                )}
                Crear cliente
              </Button>
            </form>
            {creado ? (
              <ClienteResumen cliente={creado} label="Recién creado" />
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Buscar por Id</CardTitle>
            <CardDescription>
              GET <code>/clientes/{`{id}`}</code>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBuscar} className="flex gap-2">
              <Input
                value={buscarId}
                onChange={(e) => setBuscarId(e.target.value)}
                type="number"
                min={1}
                placeholder="Id del cliente"
                required
              />
              <Button
                type="submit"
                disabled={searching}
                variant="outline"
              >
                {searching ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Search className="size-4" />
                )}
                Buscar
              </Button>
            </form>
            {encontrado ? (
              <ClienteResumen cliente={encontrado} label="Detalle" />
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Ingresa un Id para ver los datos del cliente y sus cuentas.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ClienteResumen({
  cliente,
  label,
}: {
  cliente: ClienteResponse
  label: string
}) {
  return (
    <div className="mt-4 rounded-lg border border-border/60 bg-muted/30 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <Badge variant="outline">Id {cliente.id}</Badge>
      </div>
      <p className="mt-1 text-base font-semibold">{cliente.nombre}</p>
      <p className="text-sm text-muted-foreground">DPI {cliente.dpi}</p>
      {cliente.cuentas && cliente.cuentas.length > 0 ? (
        <div className="mt-3 space-y-1 text-sm">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Cuentas
          </p>
          <ul className="space-y-1">
            {cliente.cuentas.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between rounded-md border border-border/60 bg-background px-3 py-2"
              >
                <span className="font-mono">{c.numeroCuenta}</span>
                <span className="text-muted-foreground">
                  Q{Number(c.saldo).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
