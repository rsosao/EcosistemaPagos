import { useState } from "react"
import { CreditCard, Loader2, PlusCircle, Search } from "lucide-react"
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
import { apiGet, apiPost } from "@/lib/api"
import { cuerpoEmitirTarjeta } from "@/lib/cuentaRef"

interface TarjetaResponse {
  id: number
  cuentaId: number
  numero: string
  cvv: string
  tipo: number | string
  activa: boolean
  fechaVencimiento: string
  cuenta?: {
    id: number
    numeroCuenta: string
    saldo: number
    cliente?: { nombre: string }
  }
}

const TIPO_TARJETA = [
  { label: "Débito", value: 0 },
  { label: "Crédito", value: 1 },
]

function tipoLabel(t: number | string): string {
  if (typeof t === "number") return TIPO_TARJETA[t]?.label ?? String(t)
  return t
}

export function TarjetasView() {
  const [cuentaRef, setCuentaRef] = useState("")
  const [tipo, setTipo] = useState("0")
  const [creating, setCreating] = useState(false)
  const [emitida, setEmitida] = useState<TarjetaResponse | null>(null)

  const [numero, setNumero] = useState("")
  const [encontrada, setEncontrada] = useState<TarjetaResponse | null>(null)
  const [searching, setSearching] = useState(false)

  const handleEmitir = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setCreating(true)
    try {
      const t = await apiPost<TarjetaResponse>(
        "/tarjetas",
        cuerpoEmitirTarjeta(cuentaRef, Number(tipo)),
      )
      setEmitida(t)
      toast.success("Tarjeta emitida", {
        description: `Número ${t.numero} · CVV ${t.cvv}`,
      })
    } catch (error) {
      toast.error("No se pudo emitir la tarjeta", {
        description: (error as Error).message,
      })
    } finally {
      setCreating(false)
    }
  }

  const handleBuscar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!numero.trim()) return
    setSearching(true)
    setEncontrada(null)
    try {
      const t = await apiGet<TarjetaResponse>(`/tarjetas/${numero.trim()}`)
      setEncontrada(t)
      toast.success("Tarjeta encontrada", {
        description: `${tipoLabel(t.tipo)} · cuenta ${t.cuentaId}`,
      })
    } catch (error) {
      toast.error("Tarjeta no encontrada", {
        description: (error as Error).message,
      })
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tarjetas"
        description="Emisión de tarjetas y consulta por número."
        icon={<CreditCard className="size-5" />}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Emitir tarjeta</CardTitle>
            <CardDescription>
              POST <code>/tarjetas</code>. El banco genera número y CVV.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmitir} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cuentaRef">Id o número de cuenta</Label>
                <Input
                  id="cuentaRef"
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  placeholder="Ej. 1 o 1000-0001"
                  required
                  value={cuentaRef}
                  onChange={(e) => setCuentaRef(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Use el Id numérico o el número con guión que aparece al abrir la
                  cuenta.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger id="tipo" className="w-full">
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPO_TARJETA.map((t) => (
                      <SelectItem key={t.value} value={String(t.value)}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                Emitir tarjeta
              </Button>
            </form>
            {emitida ? (
              <>
                <TarjetaCard tarjeta={emitida} label="Recién emitida" />
                {emitida.cvv ? (
                  <p className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100">
                    Guarde el CVV{" "}
                    <span className="font-mono font-semibold">{emitida.cvv}</span>: lo
                    necesita Universidad, Telefonía y Energía para cobrar con tarjeta.
                  </p>
                ) : null}
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Buscar tarjeta</CardTitle>
            <CardDescription>
              GET <code>/tarjetas/{`{numero}`}</code>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBuscar} className="flex gap-2">
              <Input
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder="Número de tarjeta"
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
            {encontrada ? (
              <TarjetaCard tarjeta={encontrada} label="Detalle" />
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Ingresa un número para ver el detalle de la tarjeta.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function TarjetaCard({
  tarjeta,
  label,
}: {
  tarjeta: TarjetaResponse
  label: string
}) {
  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-blue-600/30 bg-gradient-to-br from-blue-600 to-blue-800 p-5 text-white shadow-lg">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/70">
          {label}
        </span>
        <Badge className="bg-white/15 text-white hover:bg-white/15">
          {tipoLabel(tarjeta.tipo)}
        </Badge>
      </div>
      <p className="mt-6 font-mono text-xl tracking-widest">{tarjeta.numero}</p>
      <div className="mt-4 flex items-end justify-between text-xs uppercase tracking-wider">
        <div>
          <p className="text-white/60">Titular</p>
          <p className="text-sm font-medium text-white">
            {tarjeta.cuenta?.cliente?.nombre ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-white/60">CVV</p>
          <p className="font-mono text-sm text-white">{tarjeta.cvv}</p>
        </div>
        <div>
          <p className="text-white/60">Vence</p>
          <p className="font-mono text-sm text-white">
            {tarjeta.fechaVencimiento}
          </p>
        </div>
      </div>
    </div>
  )
}
