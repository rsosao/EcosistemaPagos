import { useState } from "react"
import { BarChart3, Loader2, Search } from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/PageHeader"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiGet } from "@/lib/api"
import { formatFecha, formatQuetzales } from "@/lib/format"

interface ComisionMov {
  id: number
  tipo: string
  monto: number
  fecha: string
  referencia: string
  descripcion: string
}

interface ComisionesResponse {
  desde: string
  hasta: string
  totalComisiones: number
  cantidad: number
  detalle: ComisionMov[]
}

interface MovimientosBancoResponse {
  cuenta: string
  saldo: number
  movimientos: ComisionMov[]
}

interface ComprobanteResponse {
  referencia: string
  fecha: string
  cuentaOrigen: string | null
  montoTotal: number
  acreditado: number | null
  comision: number | null
  descripcion: string | null
  movimientos: ComisionMov[]
}

export function ReportesView() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reportes"
        description="Comisiones, movimientos del banco y comprobantes por referencia."
        icon={<BarChart3 className="size-5" />}
      />

      <Tabs defaultValue="comisiones" className="space-y-4">
        <TabsList>
          <TabsTrigger value="comisiones">Comisiones</TabsTrigger>
          <TabsTrigger value="banco">Cuenta del banco</TabsTrigger>
          <TabsTrigger value="comprobante">Comprobante</TabsTrigger>
        </TabsList>

        <TabsContent value="comisiones">
          <ComisionesTab />
        </TabsContent>
        <TabsContent value="banco">
          <BancoTab />
        </TabsContent>
        <TabsContent value="comprobante">
          <ComprobanteTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ComisionesTab() {
  const today = new Date()
  const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
  const [desde, setDesde] = useState(monthAgo.toISOString().slice(0, 10))
  const [hasta, setHasta] = useState(today.toISOString().slice(0, 10))
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ComisionesResponse | null>(null)

  const cargar = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault()
    setLoading(true)
    try {
      const r = await apiGet<ComisionesResponse>(
        `/reportes/comisiones?desde=${desde}&hasta=${hasta}`,
      )
      setData(r)
    } catch (error) {
      setData(null)
      toast.error("No se pudo cargar el reporte", {
        description: (error as Error).message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comisiones cobradas</CardTitle>
        <CardDescription>
          GET <code>/reportes/comisiones?desde=&hasta=</code>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={cargar}
          className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        >
          <div className="space-y-2">
            <Label htmlFor="desde">Desde</Label>
            <Input
              id="desde"
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hasta">Hasta</Label>
            <Input
              id="hasta"
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white hover:bg-blue-600/90"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <BarChart3 className="size-4" />
            )}
            Consultar
          </Button>
        </form>

        {data ? (
          <div className="mt-6 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Total comisiones
                </p>
                <p className="mt-1 text-2xl font-semibold">
                  {formatQuetzales(data.totalComisiones)}
                </p>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Movimientos
                </p>
                <p className="mt-1 text-2xl font-semibold">{data.cantidad}</p>
              </div>
            </div>
            {data.detalle.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay comisiones registradas en el rango.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead>Referencia</TableHead>
                      <TableHead>Descripción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.detalle.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell>{formatFecha(m.fecha)}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatQuetzales(m.monto)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {m.referencia}
                        </TableCell>
                        <TableCell className="max-w-[320px] truncate text-sm text-muted-foreground">
                          {m.descripcion}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function BancoTab() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<MovimientosBancoResponse | null>(null)

  const cargar = async () => {
    setLoading(true)
    try {
      const r = await apiGet<MovimientosBancoResponse>(
        `/reportes/movimientos-cuenta-banco`,
      )
      setData(r)
    } catch (error) {
      setData(null)
      toast.error("No se pudo cargar la cuenta del banco", {
        description: (error as Error).message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Movimientos de la cuenta del banco</CardTitle>
        <CardDescription>
          GET <code>/reportes/movimientos-cuenta-banco</code>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          type="button"
          onClick={cargar}
          disabled={loading}
          className="bg-blue-600 text-white hover:bg-blue-600/90"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <BarChart3 className="size-4" />
          )}
          Cargar movimientos
        </Button>

        {data ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Cuenta
              </p>
              <p className="mt-1 font-mono text-base">{data.cuenta}</p>
              <p className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">
                Saldo
              </p>
              <p className="text-2xl font-semibold">{formatQuetzales(data.saldo)}</p>
            </div>
            {data.movimientos.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sin movimientos registrados.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead>Referencia</TableHead>
                      <TableHead>Descripción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.movimientos.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell>{formatFecha(m.fecha)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{m.tipo}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatQuetzales(m.monto)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {m.referencia}
                        </TableCell>
                        <TableCell className="max-w-[280px] truncate text-sm text-muted-foreground">
                          {m.descripcion}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function ComprobanteTab() {
  const [referencia, setReferencia] = useState("")
  const [loading, setLoading] = useState(false)
  const [comprobante, setComprobante] = useState<ComprobanteResponse | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setComprobante(null)
    try {
      const r = await apiGet<ComprobanteResponse>(
        `/reportes/comprobante/${encodeURIComponent(referencia.trim())}`,
      )
      setComprobante(r)
    } catch (error) {
      toast.error("Comprobante no encontrado", {
        description: (error as Error).message,
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
          GET <code>/reportes/comprobante/{`{referencia}`}</code>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
            placeholder="Ej. POS-20260520-1234"
            required
          />
          <Button
            type="submit"
            variant="outline"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Search className="size-4" />
            )}
            Buscar
          </Button>
        </form>

        {comprobante ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-lg border border-blue-600/40 bg-blue-600/5 p-4">
              <p className="text-xs uppercase tracking-wider text-blue-700 dark:text-blue-400">
                Comprobante {comprobante.referencia}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatFecha(comprobante.fecha)}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Cuenta origen</p>
                  <p className="font-mono">
                    {comprobante.cuentaOrigen ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Monto total</p>
                  <p className="font-semibold">
                    {formatQuetzales(comprobante.montoTotal)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Acreditado</p>
                  <p className="font-semibold">
                    {formatQuetzales(comprobante.acreditado ?? 0)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Comisión</p>
                  <p className="font-semibold">
                    {formatQuetzales(comprobante.comision ?? 0)}
                  </p>
                </div>
              </div>
              {comprobante.descripcion ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  {comprobante.descripcion}
                </p>
              ) : null}
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Descripción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comprobante.movimientos.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{formatFecha(m.fecha)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{m.tipo}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatQuetzales(m.monto)}
                      </TableCell>
                      <TableCell className="max-w-[320px] truncate text-sm text-muted-foreground">
                        {m.descripcion}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
