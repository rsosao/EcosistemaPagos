import { useState } from 'react'
import { List, Loader2, Pencil, PlusCircle, Search, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageHeader } from '@/components/PageHeader'
import {
  apiCall,
  type ApiError,
  type ClienteResponse,
  type CuotaDetalle,
  type EstadoCuentaResponse,
} from '@/lib/api'
import { formatDate, formatQ } from '@/lib/format'

export function ClientesView() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Clientes"
        description="Registrar, actualizar y consultar el estado de cuenta de cada contador."
        icon={<UserRound className="h-5 w-5" />}
      />
      <Tabs defaultValue="registrar">
        <TabsList>
          <TabsTrigger value="registrar">Registrar</TabsTrigger>
          <TabsTrigger value="actualizar">Actualizar</TabsTrigger>
          <TabsTrigger value="listar">Listar</TabsTrigger>
          <TabsTrigger value="consultar">Consultar</TabsTrigger>
        </TabsList>
        <TabsContent value="registrar">
          <RegistrarClienteCard />
        </TabsContent>
        <TabsContent value="actualizar">
          <ActualizarClienteCard />
        </TabsContent>
        <TabsContent value="listar">
          <ListarClientesCard />
        </TabsContent>
        <TabsContent value="consultar">
          <ConsultarClienteCard />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function RegistrarClienteCard() {
  const [idCliente, setIdCliente] = useState('')
  const [nombre, setNombre] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!idCliente.trim() || !nombre.trim()) {
      toast.error('Ambos campos son obligatorios.')
      return
    }
    setLoading(true)
    try {
      const resp = await apiCall<ClienteResponse>('POST', '/clientes', {
        idCliente: idCliente.trim(),
        nombre: nombre.trim(),
      })
      toast.success(`Cliente ${resp.idCliente} registrado.`)
      setIdCliente('')
      setNombre('')
    } catch (err) {
      const e = err as ApiError
      toast.error(e.message, { description: e.codigo })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Registrar nuevo cliente</CardTitle>
        <CardDescription>
          Cada cliente se identifica por su <strong>número de contador</strong> (ej.{' '}
          <code className="rounded bg-muted px-1.5 py-0.5">C-100001</code>).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="idCliente">Número de contador</Label>
            <Input
              id="idCliente"
              placeholder="C-100001"
              value={idCliente}
              onChange={(e) => setIdCliente(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="nombre">Nombre del cliente</Label>
            <Input
              id="nombre"
              placeholder="Hogar Pérez"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={loading} className="bg-amber-600 hover:bg-amber-700">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
              Registrar cliente
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function ActualizarClienteCard() {
  const [idCliente, setIdCliente] = useState('')
  const [nombre, setNombre] = useState('')
  const [loading, setLoading] = useState(false)
  const [cliente, setCliente] = useState<ClienteResponse | null>(null)

  const cargar = async () => {
    if (!idCliente.trim()) {
      toast.error('Ingresa un número de contador.')
      return
    }
    setLoading(true)
    try {
      const resp = await apiCall<ClienteResponse>('GET', `/clientes/${encodeURIComponent(idCliente.trim())}`)
      setCliente(resp)
      setNombre(resp.nombre)
    } catch (err) {
      const e = err as ApiError
      setCliente(null)
      toast.error(e.message, { description: e.codigo })
    } finally {
      setLoading(false)
    }
  }

  const guardar = async () => {
    if (!cliente) return
    setLoading(true)
    try {
      const resp = await apiCall<ClienteResponse>('PUT', `/clientes/${encodeURIComponent(cliente.idCliente)}`, {
        nombre: nombre.trim(),
      })
      toast.success(`Nombre actualizado a "${resp.nombre}".`)
      setCliente(resp)
    } catch (err) {
      const e = err as ApiError
      toast.error(e.message, { description: e.codigo })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Actualizar cliente</CardTitle>
        <CardDescription>Buscar por número de contador y modificar el nombre.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="grid gap-2">
            <Label htmlFor="updateId">Número de contador</Label>
            <Input
              id="updateId"
              placeholder="C-100001"
              value={idCliente}
              onChange={(e) => setIdCliente(e.target.value)}
              disabled={loading}
            />
          </div>
          <Button onClick={cargar} disabled={loading} variant="outline">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Buscar
          </Button>
        </div>
        {cliente ? (
          <>
            <Separator />
            <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
              <div className="grid gap-2">
                <Label htmlFor="updateNombre">Nombre</Label>
                <Input
                  id="updateNombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button onClick={guardar} disabled={loading} className="bg-amber-600 hover:bg-amber-700">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Pencil className="mr-2 h-4 w-4" />}
                Guardar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Registrado el {formatDate(cliente.fechaRegistro)}
            </p>
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}

function ListarClientesCard() {
  const [loading, setLoading] = useState(false)
  const [clientes, setClientes] = useState<ClienteResponse[]>([])

  const cargar = async () => {
    setLoading(true)
    try {
      const resp = await apiCall<ClienteResponse[]>('GET', '/clientes')
      setClientes(resp)
      toast.success('Clientes cargados.', { description: `${resp.length} registros` })
    } catch (err) {
      const e = err as ApiError
      toast.error(e.message, { description: e.codigo })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <List className="h-4 w-4 text-amber-600" />
          Todos los clientes
        </CardTitle>
        <CardDescription>
          GET <code>/clientes</code>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={cargar} disabled={loading} variant="outline">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
          Listar todos
        </Button>

        {clientes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aún no hay datos cargados. Presiona “Listar todos”.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contador</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Registro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientes.map((c) => (
                  <TableRow key={c.idCliente}>
                    <TableCell className="font-mono text-sm">{c.idCliente}</TableCell>
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

function ConsultarClienteCard() {
  const [idCliente, setIdCliente] = useState('')
  const [loading, setLoading] = useState(false)
  const [estado, setEstado] = useState<EstadoCuentaResponse | null>(null)

  const cargar = async () => {
    if (!idCliente.trim()) {
      toast.error('Ingresa un número de contador.')
      return
    }
    setLoading(true)
    try {
      const resp = await apiCall<EstadoCuentaResponse>('GET', `/clientes/${encodeURIComponent(idCliente.trim())}/estado-cuenta`)
      setEstado(resp)
    } catch (err) {
      const e = err as ApiError
      setEstado(null)
      toast.error(e.message, { description: e.codigo })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Consultar estado de cuenta</CardTitle>
        <CardDescription>Ver cuotas pagadas y pendientes del cliente.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="grid gap-2">
            <Label htmlFor="consultarId">Número de contador</Label>
            <Input
              id="consultarId"
              placeholder="C-100001"
              value={idCliente}
              onChange={(e) => setIdCliente(e.target.value)}
              disabled={loading}
            />
          </div>
          <Button onClick={cargar} disabled={loading} className="bg-amber-600 hover:bg-amber-700">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Consultar
          </Button>
        </div>
        {estado ? <EstadoCuentaTabla estado={estado} /> : null}
      </CardContent>
    </Card>
  )
}

export function EstadoCuentaTabla({ estado }: { estado: EstadoCuentaResponse }) {
  return (
    <div className="space-y-4">
      <Separator />
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Cliente</p>
          <p className="font-medium">{estado.nombre}</p>
          <p className="text-xs text-muted-foreground">Contador {estado.idCliente}</p>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <Badge variant="secondary" className="bg-amber-600/10 text-amber-700 dark:text-amber-300">
            Pendiente: {formatQ(estado.totalPendiente)}
          </Badge>
          <Badge variant="secondary">Pagado: {formatQ(estado.totalPagado)}</Badge>
        </div>
      </div>
      <CuotasTable cuotas={estado.cuotas} />
    </div>
  )
}

function CuotasTable({ cuotas }: { cuotas: CuotaDetalle[] }) {
  if (cuotas.length === 0) {
    return <p className="text-sm text-muted-foreground">El cliente aún no tiene cuotas registradas.</p>
  }
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Periodo</TableHead>
            <TableHead className="text-right">Monto</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Método</TableHead>
            <TableHead>Fecha pago</TableHead>
            <TableHead>Referencia</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cuotas.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-mono text-sm">{c.periodo}</TableCell>
              <TableCell className="text-right">{formatQ(c.monto)}</TableCell>
              <TableCell>
                {c.pagada ? (
                  <Badge className="bg-emerald-600 hover:bg-emerald-600">Pagada</Badge>
                ) : (
                  <Badge variant="outline" className="border-amber-600 text-amber-700 dark:text-amber-300">
                    Pendiente
                  </Badge>
                )}
              </TableCell>
              <TableCell>{c.metodoPago ?? '—'}</TableCell>
              <TableCell>{formatDate(c.fechaPago)}</TableCell>
              <TableCell className="font-mono text-xs">{c.referencia ?? '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
