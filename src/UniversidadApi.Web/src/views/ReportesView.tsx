import { useCallback, useEffect, useState, type FormEvent } from "react"
import {
  AlertTriangle,
  BadgeCheck,
  ClipboardList,
  FileText,
  Loader2,
  ScrollText,
  Search,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  type ClientePagadoDto,
  type ClientePendienteDto,
  type ComprobanteDto,
  type EstadoCuentaDto,
  type MovimientoDto,
} from "@/lib/api"
import { formatCurrency, formatDate } from "@/lib/utils"

export function ReportesView() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reportes"
        description="Pendientes, pagados, movimientos y comprobantes."
        icon={<ScrollText className="size-5" />}
      />
      <Tabs defaultValue="pendientes" className="w-full">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="pendientes">
            <AlertTriangle className="size-4" />
            Pendientes
          </TabsTrigger>
          <TabsTrigger value="pagados">
            <BadgeCheck className="size-4" />
            Pagados
          </TabsTrigger>
          <TabsTrigger value="movimientos">
            <ClipboardList className="size-4" />
            Movimientos
          </TabsTrigger>
          <TabsTrigger value="comprobante">
            <FileText className="size-4" />
            Comprobante
          </TabsTrigger>
          <TabsTrigger value="estado">
            <ScrollText className="size-4" />
            Estado de cuenta
          </TabsTrigger>
        </TabsList>
        <TabsContent value="pendientes" className="mt-4">
          <PendientesPanel />
        </TabsContent>
        <TabsContent value="pagados" className="mt-4">
          <PagadosPanel />
        </TabsContent>
        <TabsContent value="movimientos" className="mt-4">
          <MovimientosPanel />
        </TabsContent>
        <TabsContent value="comprobante" className="mt-4">
          <ComprobantePanel />
        </TabsContent>
        <TabsContent value="estado" className="mt-4">
          <EstadoCuentaPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function PendientesPanel() {
  const [data, setData] = useState<ClientePendienteDto[]>([])
  const [loading, setLoading] = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const r = await api.get<ClientePendienteDto[]>(
        "/reportes/clientes-pendientes",
      )
      setData(r)
    } catch (err) {
      toast.error("Error cargando clientes pendientes", {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clientes pendientes</CardTitle>
        <CardDescription>
          Estudiantes con cuotas no pagadas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={cargar}
            disabled={loading}
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            Refrescar
          </Button>
        </div>
        {data.length === 0 ? (
          <p className="text-muted-foreground rounded-md border border-dashed p-3 text-sm">
            No hay estudiantes con cuotas pendientes.
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Carné</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="text-center">Cuotas</TableHead>
                  <TableHead className="text-right">Deuda</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((c) => (
                  <TableRow key={c.carne}>
                    <TableCell className="font-mono text-xs">
                      {c.carne}
                    </TableCell>
                    <TableCell>{c.nombre}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="warning">{c.cuotasPendientes}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(c.deuda)}
                    </TableCell>
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

function PagadosPanel() {
  const [periodo, setPeriodo] = useState("")
  const [data, setData] = useState<ClientePagadoDto[]>([])
  const [loading, setLoading] = useState(false)

  const cargar = useCallback(async (filter: string) => {
    setLoading(true)
    try {
      const q = filter ? `?periodo=${encodeURIComponent(filter)}` : ""
      const r = await api.get<ClientePagadoDto[]>(
        `/reportes/clientes-pagados${q}`,
      )
      setData(r)
    } catch (err) {
      toast.error("Error cargando clientes pagados", {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargar("")
  }, [cargar])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clientes pagados</CardTitle>
        <CardDescription>
          Filtra por periodo (YYYY-MM) o deja en blanco para ver todos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="mb-3 flex flex-wrap items-end gap-3"
          onSubmit={(e: FormEvent) => {
            e.preventDefault()
            cargar(periodo.trim())
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="rep-periodo">Periodo</Label>
            <Input
              id="rep-periodo"
              placeholder="2026-05"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
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
          {periodo && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setPeriodo("")
                cargar("")
              }}
            >
              Limpiar
            </Button>
          )}
        </form>
        {data.length === 0 ? (
          <p className="text-muted-foreground rounded-md border border-dashed p-3 text-sm">
            Sin pagos registrados con ese filtro.
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Carné</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Periodo</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Fecha pago</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((c, i) => (
                  <TableRow key={`${c.carne}-${c.periodo}-${i}`}>
                    <TableCell className="font-mono text-xs">
                      {c.carne}
                    </TableCell>
                    <TableCell>{c.nombre}</TableCell>
                    <TableCell>{c.periodo}</TableCell>
                    <TableCell>
                      {c.metodo ? (
                        <Badge variant="outline">{c.metodo}</Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{formatDate(c.fechaPago)}</TableCell>
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

function MovimientosPanel() {
  const [data, setData] = useState<MovimientoDto[]>([])
  const [loading, setLoading] = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const r = await api.get<MovimientoDto[]>("/reportes/movimientos")
      setData(r)
    } catch (err) {
      toast.error("Error cargando movimientos", {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Movimientos</CardTitle>
        <CardDescription>
          Bitácora de cuotas generadas y pagos recibidos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={cargar}
            disabled={loading}
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            Refrescar
          </Button>
        </div>
        {data.length === 0 ? (
          <p className="text-muted-foreground rounded-md border border-dashed p-3 text-sm">
            No hay movimientos para mostrar.
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Carné</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{formatDate(m.fecha)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          m.tipo === "PagoRecibido" ? "success" : "outline"
                        }
                      >
                        {m.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {m.clienteId}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {m.referencia ?? "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(m.monto)}
                    </TableCell>
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

function ComprobantePanel() {
  const [referencia, setReferencia] = useState("")
  const [data, setData] = useState<ComprobanteDto | null>(null)
  const [loading, setLoading] = useState(false)

  async function buscar(e: FormEvent) {
    e.preventDefault()
    if (!referencia.trim()) return
    setLoading(true)
    setData(null)
    try {
      const r = await api.get<ComprobanteDto>(
        `/reportes/comprobante/${encodeURIComponent(referencia.trim())}`,
      )
      setData(r)
    } catch (err) {
      toast.error("Comprobante no encontrado", {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Buscar comprobante</CardTitle>
        <CardDescription>
          Ingresa la referencia generada al momento del pago.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form className="flex flex-wrap items-end gap-3" onSubmit={buscar}>
          <div className="grid min-w-[260px] flex-1 gap-2">
            <Label htmlFor="ref-input">Referencia</Label>
            <Input
              id="ref-input"
              placeholder="EFE-... o TAR-..."
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
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
        {data && (
          <div className="grid gap-3 rounded-md border p-4 sm:grid-cols-2">
            <Detail label="Referencia" value={data.referencia} />
            <Detail label="Método" value={data.metodo} />
            <Detail label="Estudiante" value={data.nombreCliente} />
            <Detail label="Carné" value={data.idCliente} />
            <Detail label="Fecha" value={formatDate(data.fecha)} />
            <Detail
              label="Monto"
              value={formatCurrency(data.monto)}
              highlight
            />
            <div className="sm:col-span-2 flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground text-sm">Periodos:</span>
              {data.periodos.map((p) => (
                <Badge key={p} variant="secondary">
                  {p}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function EstadoCuentaPanel() {
  const [carne, setCarne] = useState("")
  const [data, setData] = useState<EstadoCuentaDto | null>(null)
  const [loading, setLoading] = useState(false)

  async function buscar(e: FormEvent) {
    e.preventDefault()
    if (!carne.trim()) return
    setLoading(true)
    setData(null)
    try {
      const r = await api.get<EstadoCuentaDto>(
        `/reportes/estado-cuenta/${encodeURIComponent(carne.trim())}`,
      )
      setData(r)
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
        <CardTitle>Estado de cuenta por carné</CardTitle>
        <CardDescription>
          Resumen completo de cuotas pagadas y pendientes.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form className="flex flex-wrap items-end gap-3" onSubmit={buscar}>
          <div className="grid min-w-[200px] flex-1 gap-2">
            <Label htmlFor="ec-carne">Carné</Label>
            <Input
              id="ec-carne"
              placeholder="0901-22-1234"
              value={carne}
              onChange={(e) => setCarne(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Search className="size-4" />
            )}
            Consultar
          </Button>
        </form>

        {data && (
          <div className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
              <div>
                <p className="text-lg font-semibold">{data.nombre}</p>
                <p className="text-muted-foreground text-sm">
                  Carné {data.idCliente}
                </p>
              </div>
              <Badge variant={data.deudaTotal > 0 ? "warning" : "success"}>
                Deuda: {formatCurrency(data.deudaTotal)}
              </Badge>
            </div>
            <CuotasMini
              title="Pendientes"
              empty="Sin pendientes"
              cuotas={data.cuotasPendientes}
            />
            <CuotasMini
              title="Pagadas"
              empty="Sin pagos registrados"
              cuotas={data.cuotasPagadas}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function CuotasMini({
  title,
  empty,
  cuotas,
}: {
  title: string
  empty: string
  cuotas: EstadoCuentaDto["cuotasPendientes"]
}) {
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

function Detail({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex flex-col">
      <span className="text-muted-foreground text-xs uppercase tracking-wide">
        {label}
      </span>
      <span
        className={
          highlight
            ? "text-lg font-semibold text-emerald-600 dark:text-emerald-400"
            : "font-medium"
        }
      >
        {value}
      </span>
    </div>
  )
}
