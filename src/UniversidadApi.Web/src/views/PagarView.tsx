import { useState, type FormEvent } from "react"
import { CreditCard, HandCoins, Loader2, Receipt } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/PageHeader"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api, type ComprobanteDto } from "@/lib/api"
import { formatCurrency, formatDate } from "@/lib/utils"

export function PagarView() {
  const [comprobante, setComprobante] = useState<ComprobanteDto | null>(null)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Cobrar cuota"
        description="Liquida la deuda completa del estudiante en efectivo o con tarjeta."
        icon={<CreditCard className="size-5" />}
      />
      <Card>
        <CardHeader>
          <CardTitle>Método de pago</CardTitle>
          <CardDescription>
            El cobro liquida todas las cuotas pendientes del estudiante.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="efectivo" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="efectivo">
                <HandCoins className="size-4" />
                Efectivo
              </TabsTrigger>
              <TabsTrigger value="tarjeta">
                <CreditCard className="size-4" />
                Tarjeta
              </TabsTrigger>
            </TabsList>
            <TabsContent value="efectivo" className="mt-4">
              <EfectivoForm onPaid={setComprobante} />
            </TabsContent>
            <TabsContent value="tarjeta" className="mt-4">
              <TarjetaForm onPaid={setComprobante} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {comprobante && <ComprobanteCard comprobante={comprobante} />}
    </div>
  )
}

interface FormProps {
  onPaid: (c: ComprobanteDto) => void
}

function EfectivoForm({ onPaid }: FormProps) {
  const [carne, setCarne] = useState("")
  const [monto, setMonto] = useState("")
  const [referencia, setReferencia] = useState("")
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!carne.trim()) return
    setLoading(true)
    try {
      const r = await api.post<ComprobanteDto>("/pagar/efectivo", {
        idCliente: carne.trim(),
        monto: Number(monto),
        referencia: referencia.trim() || null,
      })
      onPaid(r)
      toast.success("Pago en efectivo registrado", {
        description: `Ref: ${r.referencia}`,
      })
      setMonto("")
      setReferencia("")
    } catch (err) {
      toast.error("No se pudo registrar el pago", {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="efe-carne">Carné</Label>
          <Input
            id="efe-carne"
            placeholder="0901-22-1234"
            value={carne}
            onChange={(e) => setCarne(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="efe-monto">Monto recibido</Label>
          <Input
            id="efe-monto"
            type="number"
            min="0"
            step="0.01"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="efe-ref">Referencia (opcional)</Label>
        <Input
          id="efe-ref"
          placeholder="Boleta interna, recibo, etc."
          value={referencia}
          onChange={(e) => setReferencia(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <HandCoins className="size-4" />
        )}
        Registrar pago en efectivo
      </Button>
    </form>
  )
}

function TarjetaForm({ onPaid }: FormProps) {
  const [carne, setCarne] = useState("")
  const [numero, setNumero] = useState("")
  const [cvv, setCvv] = useState("")
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!carne.trim() || !numero.trim() || !cvv.trim()) return
    setLoading(true)
    try {
      const r = await api.post<ComprobanteDto>("/pagar/tarjeta", {
        idCliente: carne.trim(),
        numero: numero.trim(),
        cvv: cvv.trim(),
      })
      onPaid(r)
      toast.success("Pago con tarjeta autorizado", {
        description: `Ref: ${r.referencia}`,
      })
      setNumero("")
      setCvv("")
    } catch (err) {
      toast.error("No se pudo procesar la tarjeta", {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <div className="grid gap-2">
        <Label htmlFor="tar-carne">Carné</Label>
        <Input
          id="tar-carne"
          placeholder="0901-22-1234"
          value={carne}
          onChange={(e) => setCarne(e.target.value)}
          required
        />
      </div>
      <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
        <div className="grid gap-2">
          <Label htmlFor="tar-numero">Número de tarjeta</Label>
          <Input
            id="tar-numero"
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="4111-1111-1111-1111"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="tar-cvv">CVV</Label>
          <Input
            id="tar-cvv"
            inputMode="numeric"
            maxLength={4}
            placeholder="123"
            value={cvv}
            onChange={(e) => setCvv(e.target.value)}
            required
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        El CVV lo muestra el Banco al emitir la tarjeta (menú Tarjetas). Si usaste el
        seed de prueba del banco, los CVV son <span className="font-mono">123</span> y{" "}
        <span className="font-mono">456</span>.
      </p>
      <Button type="submit" disabled={loading}>
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <CreditCard className="size-4" />
        )}
        Cobrar con tarjeta
      </Button>
    </form>
  )
}

function ComprobanteCard({ comprobante }: { comprobante: ComprobanteDto }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="size-4 text-emerald-600" />
          Comprobante de pago
        </CardTitle>
        <CardDescription>
          Conserva este comprobante para futuras consultas.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        <DetailRow label="Referencia" value={comprobante.referencia} />
        <DetailRow label="Método" value={comprobante.metodo} />
        <DetailRow label="Estudiante" value={comprobante.nombreCliente} />
        <DetailRow label="Carné" value={comprobante.idCliente} />
        <DetailRow
          label="Fecha"
          value={formatDate(comprobante.fecha)}
        />
        <DetailRow
          label="Monto"
          value={formatCurrency(comprobante.monto)}
          highlight
        />
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <span className="text-muted-foreground text-sm">Periodos pagados:</span>
        {comprobante.periodos.map((p) => (
          <Badge key={p} variant="secondary">
            {p}
          </Badge>
        ))}
      </CardFooter>
    </Card>
  )
}

function DetailRow({
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
