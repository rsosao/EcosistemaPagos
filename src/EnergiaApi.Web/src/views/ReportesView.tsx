import { useEffect, useState } from 'react'
import { FileBarChart2, Loader2, RefreshCw, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
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
  type ClientePagadoItem,
  type ClientePendienteItem,
  type ComprobanteResponse,
  type EstadoCuentaResponse,
  type MovimientoReporteItem,
} from '@/lib/api'
import { formatDate, formatQ } from '@/lib/format'
import { EstadoCuentaTabla } from '@/views/ClientesView'

export function ReportesView() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Reportes"
        description="Indicadores y comprobantes generados por EnergiaApi."
        icon={<FileBarChart2 className="h-5 w-5" />}
      />
      <Tabs defaultValue="pendientes">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="pendientes">Pendientes</TabsTrigger>
          <TabsTrigger value="pagados">Pagados</TabsTrigger>
          <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
          <TabsTrigger value="comprobante">Comprobante</TabsTrigger>
          <TabsTrigger value="estado">Estado de cuenta</TabsTrigger>
        </TabsList>
        <TabsContent value="pendientes">
          <PendientesCard />
        </TabsContent>
        <TabsContent value="pagados">
          <PagadosCard />
        </TabsContent>
        <TabsContent value="movimientos">
          <MovimientosCard />
        </TabsContent>
        <TabsContent value="comprobante">
          <ComprobanteCard />
        </TabsContent>
        <TabsContent value="estado">
          <EstadoCuentaCard />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function PendientesCard() {
  const [items, setItems] = useState<ClientePendienteItem[]>([])
  const [loading, setLoading] = useState(false)

  const cargar = async () => {
    setLoading(true)
    try {
      const resp = await apiCall<ClientePendienteItem[]>('GET', '/reportes/clientes-pendientes')
      setItems(resp)
    } catch (err) {
      const e = err as ApiError
      toast.error(e.message, { description: e.codigo })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  const totalPendiente = items.reduce((acc, c) => acc + c.totalPendiente, 0)

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Clientes con cuotas pendientes</CardTitle>
          <CardDescription>
            {items.length} cliente(s) · {formatQ(totalPendiente)} en total.
          </CardDescription>
        </div>
        <Button onClick={cargar} disabled={loading} variant="outline">
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Actualizar
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contador</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead className="text-right">Cuotas</TableHead>
                <TableHead className="text-right">Total pendiente</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No hay cuotas pendientes.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((c) => (
                  <TableRow key={c.idCliente}>
                    <TableCell className="font-mono text-sm">{c.idCliente}</TableCell>
                    <TableCell>{c.nombre}</TableCell>
                    <TableCell className="text-right">{c.cuotasPendientes}</TableCell>
                    <TableCell className="text-right">{formatQ(c.totalPendiente)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

function PagadosCard() {
  const [periodo, setPeriodo] = useState('')
  const [items, setItems] = useState<ClientePagadoItem[]>([])
  const [loading, setLoading] = useState(false)

  const cargar = async () => {
    setLoading(true)
    try {
      const query = periodo.trim() ? `?periodo=${encodeURIComponent(periodo.trim())}` : ''
      const resp = await apiCall<ClientePagadoItem[]>('GET', `/reportes/clientes-pagados${query}`)
      setItems(resp)
    } catch (err) {
      const e = err as ApiError
      toast.error(e.message, { description: e.codigo })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Clientes al día</CardTitle>
        <CardDescription>
          Filtra por periodo en formato <code>YYYY-MM</code> o deja vacío para ver todos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="grid gap-2">
            <Label htmlFor="periodoFiltro">Periodo</Label>
            <Input
              id="periodoFiltro"
              placeholder="2026-05"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              disabled={loading}
            />
          </div>
          <Button onClick={cargar} disabled={loading} variant="outline">
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            Consultar
          </Button>
        </div>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contador</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Periodo</TableHead>
                <TableHead>Fecha pago</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Sin registros.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((c, i) => (
                  <TableRow key={`${c.idCliente}-${c.periodo}-${i}`}>
                    <TableCell className="font-mono text-sm">{c.idCliente}</TableCell>
                    <TableCell>{c.nombre}</TableCell>
                    <TableCell className="font-mono">{c.periodo}</TableCell>
                    <TableCell>{formatDate(c.fechaPago)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

function MovimientosCard() {
  const [items, setItems] = useState<MovimientoReporteItem[]>([])
  const [loading, setLoading] = useState(false)

  const cargar = async () => {
    setLoading(true)
    try {
      const resp = await apiCall<MovimientoReporteItem[]>('GET', '/reportes/movimientos')
      setItems(resp)
    } catch (err) {
      const e = err as ApiError
      toast.error(e.message, { description: e.codigo })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Bitácora de movimientos</CardTitle>
          <CardDescription>Cuotas generadas y pagos recibidos por la empresa.</CardDescription>
        </div>
        <Button onClick={cargar} disabled={loading} variant="outline">
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Actualizar
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Contador</TableHead>
                <TableHead>Referencia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Sin movimientos.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-muted-foreground">{m.id}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{m.tipo}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{formatQ(m.monto)}</TableCell>
                    <TableCell>{formatDate(m.fecha)}</TableCell>
                    <TableCell className="font-mono text-sm">{m.clienteId ?? '—'}</TableCell>
                    <TableCell className="font-mono text-xs">{m.referencia ?? '—'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

function ComprobanteCard() {
  const [referencia, setReferencia] = useState('')
  const [loading, setLoading] = useState(false)
  const [comprobante, setComprobante] = useState<ComprobanteResponse | null>(null)

  const consultar = async () => {
    if (!referencia.trim()) {
      toast.error('Ingresa la referencia del pago.')
      return
    }
    setLoading(true)
    try {
      const resp = await apiCall<ComprobanteResponse>(
        'GET',
        `/reportes/comprobante/${encodeURIComponent(referencia.trim())}`,
      )
      setComprobante(resp)
    } catch (err) {
      const e = err as ApiError
      setComprobante(null)
      toast.error(e.message, { description: e.codigo })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Comprobante por referencia</CardTitle>
        <CardDescription>
          Busca el comprobante de un pago por su referencia (efectivo, tarjeta o banca virtual).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="grid gap-2">
            <Label htmlFor="refConsulta">Referencia</Label>
            <Input
              id="refConsulta"
              placeholder="EFE-… / EE-… / banca-…"
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              disabled={loading}
            />
          </div>
          <Button onClick={consultar} disabled={loading} className="bg-amber-600 hover:bg-amber-700">
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            Consultar
          </Button>
        </div>
        {comprobante ? (
          <div className="rounded-md border bg-muted/40 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Comprobante</p>
            <p className="font-mono text-sm">{comprobante.referencia}</p>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <Row label="Cliente" value={`${comprobante.nombreCliente} (${comprobante.idCliente})`} />
              <Row label="Periodo" value={comprobante.periodo} />
              <Row label="Monto" value={formatQ(comprobante.monto)} />
              <Row label="Método" value={comprobante.metodoPago} />
              <Row label="Fecha pago" value={formatDate(comprobante.fechaPago)} />
            </dl>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function EstadoCuentaCard() {
  const [idCliente, setIdCliente] = useState('')
  const [loading, setLoading] = useState(false)
  const [estado, setEstado] = useState<EstadoCuentaResponse | null>(null)

  const cargar = async () => {
    if (!idCliente.trim()) {
      toast.error('Ingresa el número de contador.')
      return
    }
    setLoading(true)
    try {
      const resp = await apiCall<EstadoCuentaResponse>(
        'GET',
        `/reportes/estado-cuenta/${encodeURIComponent(idCliente.trim())}`,
      )
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
        <CardTitle>Estado de cuenta detallado</CardTitle>
        <CardDescription>Resumen de cuotas pagadas y pendientes por contador.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="grid gap-2">
            <Label htmlFor="ecId">Número de contador</Label>
            <Input
              id="ecId"
              placeholder="C-100001"
              value={idCliente}
              onChange={(e) => setIdCliente(e.target.value)}
              disabled={loading}
            />
          </div>
          <Button onClick={cargar} disabled={loading} className="bg-amber-600 hover:bg-amber-700">
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            Consultar
          </Button>
        </div>
        {estado ? <EstadoCuentaTabla estado={estado} /> : null}
      </CardContent>
    </Card>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{value}</dd>
    </div>
  )
}
