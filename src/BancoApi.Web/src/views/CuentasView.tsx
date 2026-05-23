import { useState } from "react"
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Loader2,
  PlusCircle,
  Search,
  Wallet,
} from "lucide-react"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { apiGet, apiPost } from "@/lib/api"
import { rutaCuenta } from "@/lib/cuentaRef"
import { formatFecha, formatQuetzales } from "@/lib/format"

interface CuentaResponse {
  id: number
  clienteId?: number
  numeroCuenta: string
  saldo: number
  tipo: number | string
  cliente?: { id: number; nombre: string; dpi: string }
}

interface MovimientoResponse {
  id: number
  cuentaId: number
  tipo: number | string
  monto: number
  fecha: string
  referencia: string
  descripcion: string
}

const TIPO_CUENTA = [
  { label: "Corriente", value: 0 },
  { label: "Monetaria", value: 1 },
  { label: "Transitoria", value: 2 },
]

const TIPO_MOVIMIENTO_LABEL: Record<number, string> = {
  0: "Depósito",
  1: "Retiro",
  2: "Compra POS",
  3: "Retiro cajero",
  4: "Pago servicio",
  5: "Comisión",
  6: "Acreditación",
}

export function CuentasView() {
  const [clienteId, setClienteId] = useState("")
  const [tipo, setTipo] = useState("0")
  const [saldoInicial, setSaldoInicial] = useState("")
  const [creating, setCreating] = useState(false)

  const [buscarId, setBuscarId] = useState("")
  const [cuenta, setCuenta] = useState<CuentaResponse | null>(null)
  const [searching, setSearching] = useState(false)
  const [movimientos, setMovimientos] = useState<MovimientoResponse[]>([])
  const [cuentas, setCuentas] = useState<CuentaResponse[]>([])
  const [loadingCuentas, setLoadingCuentas] = useState(false)

  const [monto, setMonto] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [operando, setOperando] = useState<"deposito" | "retiro" | null>(null)

  const handleCrear = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setCreating(true)
    try {
      const c = await apiPost<CuentaResponse>("/cuentas", {
        clienteId: Number(clienteId),
        tipo: Number(tipo),
        saldoInicial: Number(saldoInicial || 0),
      })
      toast.success("Cuenta abierta", {
        description: `Id ${c.id} · ${c.numeroCuenta}`,
      })
      setCuenta(c)
      setMovimientos([])
      setBuscarId(c.numeroCuenta)
      setClienteId("")
      setSaldoInicial("")
    } catch (error) {
      toast.error("No se pudo abrir la cuenta", {
        description: (error as Error).message,
      })
    } finally {
      setCreating(false)
    }
  }

  const cargarCuenta = async (ref: string | number) => {
    setSearching(true)
    try {
      const ruta = rutaCuenta(String(ref))
      const c = await apiGet<CuentaResponse>(ruta)
      const movs = await apiGet<MovimientoResponse[]>(
        `/cuentas/${c.id}/movimientos`,
      ).catch(() => [] as MovimientoResponse[])
      setCuenta(c)
      setMovimientos(movs)
    } catch (error) {
      setCuenta(null)
      setMovimientos([])
      toast.error("Cuenta no encontrada", {
        description: (error as Error).message,
      })
    } finally {
      setSearching(false)
    }
  }

  const handleBuscar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!buscarId.trim()) return
    await cargarCuenta(buscarId)
  }

  const handleMovimiento = async (kind: "deposito" | "retiro") => {
    if (!cuenta) return
    setOperando(kind)
    try {
      const resp = await apiPost<{
        codigo: string
        referencia: string
        saldo: number
      }>(`/cuentas/${cuenta.id}/${kind}`, {
        monto: Number(monto),
        descripcion: descripcion || undefined,
      })
      toast.success(
        kind === "deposito" ? "Depósito acreditado" : "Retiro realizado",
        {
          description: `Ref ${resp.referencia} · saldo ${formatQuetzales(resp.saldo)}`,
        },
      )
      setMonto("")
      setDescripcion("")
      await cargarCuenta(cuenta.id)
    } catch (error) {
      toast.error("No se pudo procesar la operación", {
        description: (error as Error).message,
      })
    } finally {
      setOperando(null)
    }
  }

  const handleListarCuentas = async () => {
    setLoadingCuentas(true)
    try {
      const data = await apiGet<CuentaResponse[]>("/cuentas")
      setCuentas(data)
      toast.success("Cuentas cargadas", {
        description: `${data.length} registros`,
      })
    } catch (error) {
      toast.error("No se pudieron cargar las cuentas", {
        description: (error as Error).message,
      })
    } finally {
      setLoadingCuentas(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cuentas"
        description="Apertura, depósitos, retiros y bitácora de movimientos."
        icon={<Wallet className="size-5" />}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Abrir cuenta</CardTitle>
            <CardDescription>
              POST <code>/cuentas</code>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCrear} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="clienteId">Id del cliente</Label>
                  <Input
                    id="clienteId"
                    type="number"
                    min={1}
                    required
                    value={clienteId}
                    onChange={(e) => setClienteId(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select value={tipo} onValueChange={setTipo}>
                    <SelectTrigger id="tipo" className="w-full">
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPO_CUENTA.map((t) => (
                        <SelectItem key={t.value} value={String(t.value)}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="saldoInicial">Saldo inicial</Label>
                <Input
                  id="saldoInicial"
                  type="number"
                  min={0}
                  step="0.01"
                  required
                  value={saldoInicial}
                  onChange={(e) => setSaldoInicial(e.target.value)}
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
                  <PlusCircle className="size-4" />
                )}
                Abrir cuenta
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Buscar cuenta</CardTitle>
            <CardDescription>
              GET <code>/cuentas/{`{id}`}</code> +{" "}
              <code>/cuentas/{`{id}`}/movimientos</code>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleBuscar} className="flex gap-2">
              <Input
                value={buscarId}
                onChange={(e) => setBuscarId(e.target.value)}
                type="text"
                inputMode="text"
                placeholder="Id (1) o número (1000-0001)"
                required
              />
              <Button type="submit" variant="outline" disabled={searching}>
                {searching ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Search className="size-4" />
                )}
                Buscar
              </Button>
            </form>
            {cuenta ? (
              <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    Cuenta {cuenta.id}
                  </span>
                  <Badge variant="outline">
                    {typeof cuenta.tipo === "number"
                      ? TIPO_CUENTA[cuenta.tipo]?.label ?? cuenta.tipo
                      : cuenta.tipo}
                  </Badge>
                </div>
                <p className="mt-1 font-mono text-base">{cuenta.numeroCuenta}</p>
                <p className="text-2xl font-semibold tracking-tight">
                  {formatQuetzales(cuenta.saldo)}
                </p>
                {cuenta.cliente ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Titular: {cuenta.cliente.nombre} · DPI {cuenta.cliente.dpi}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Ingresa el Id numérico o el número de cuenta (con guión).
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {cuenta ? (
        <Card>
          <CardHeader>
            <CardTitle>Operaciones en la cuenta {cuenta.id}</CardTitle>
            <CardDescription>
              POST <code>/cuentas/{`{id}`}/deposito</code> ·{" "}
              <code>/cuentas/{`{id}`}/retiro</code>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
              <div className="space-y-2">
                <Label htmlFor="monto">Monto</Label>
                <Input
                  id="monto"
                  type="number"
                  min={0.01}
                  step="0.01"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción (opcional)</Label>
                <Input
                  id="descripcion"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row lg:items-end">
                <Button
                  type="button"
                  onClick={() => handleMovimiento("deposito")}
                  disabled={!monto || operando !== null}
                  className="bg-blue-600 text-white hover:bg-blue-600/90"
                >
                  {operando === "deposito" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ArrowDownToLine className="size-4" />
                  )}
                  Depositar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleMovimiento("retiro")}
                  disabled={!monto || operando !== null}
                >
                  {operando === "retiro" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ArrowUpFromLine className="size-4" />
                  )}
                  Retirar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {cuenta ? (
        <Card>
          <CardHeader>
            <CardTitle>Movimientos</CardTitle>
            <CardDescription>
              Últimos movimientos de la cuenta {cuenta.numeroCuenta}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {movimientos.length === 0 ? (
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
                    {movimientos.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell>{formatFecha(m.fecha)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {typeof m.tipo === "number"
                              ? TIPO_MOVIMIENTO_LABEL[m.tipo] ?? m.tipo
                              : m.tipo}
                          </Badge>
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
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Todas las cuentas</CardTitle>
          <CardDescription>
            GET <code>/cuentas</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleListarCuentas}
            disabled={loadingCuentas}
          >
            {loadingCuentas ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Search className="size-4" />
            )}
            Listar todas
          </Button>

          {cuentas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay datos cargados. Presiona “Listar todas”.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Id</TableHead>
                    <TableHead>Número</TableHead>
                    <TableHead>Titular</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cuentas.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.id}</TableCell>
                      <TableCell className="font-mono">{c.numeroCuenta}</TableCell>
                      <TableCell>{c.cliente?.nombre ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        {formatQuetzales(c.saldo)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
