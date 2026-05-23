import { useState } from 'react'
import { BadgeCheck, Banknote, CreditCard, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/PageHeader'
import {
  apiCall,
  type ApiError,
  type PagoEfectivoResponse,
  type PagoTarjetaResponse,
} from '@/lib/api'
import { formatQ } from '@/lib/format'

export function PagarView() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Recibir pago"
        description="Procesar pagos en efectivo (Flujo C) o con tarjeta a través del banco (Flujo B)."
        icon={<CreditCard className="h-5 w-5" />}
      />
      <Tabs defaultValue="efectivo">
        <TabsList>
          <TabsTrigger value="efectivo">
            <Banknote className="mr-1.5 h-4 w-4" />
            Efectivo
          </TabsTrigger>
          <TabsTrigger value="tarjeta">
            <CreditCard className="mr-1.5 h-4 w-4" />
            Tarjeta
          </TabsTrigger>
        </TabsList>
        <TabsContent value="efectivo">
          <PagoEfectivoCard />
        </TabsContent>
        <TabsContent value="tarjeta">
          <PagoTarjetaCard />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function PagoEfectivoCard() {
  const [idCliente, setIdCliente] = useState('')
  const [monto, setMonto] = useState('')
  const [referencia, setReferencia] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<PagoEfectivoResponse | null>(null)

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const montoNum = Number(monto)
    if (!idCliente.trim() || Number.isNaN(montoNum) || montoNum <= 0) {
      toast.error('Número de contador y monto > 0 son obligatorios.')
      return
    }
    setLoading(true)
    try {
      const resp = await apiCall<PagoEfectivoResponse>('POST', '/pagar/efectivo', {
        idCliente: idCliente.trim(),
        monto: montoNum,
        referencia: referencia.trim() || undefined,
      })
      setResultado(resp)
      toast.success('Pago en efectivo aplicado.', {
        description: `Referencia ${resp.referencia} · aplicado ${formatQ(resp.montoAplicado)}.`,
      })
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
        <CardTitle>Pago en efectivo</CardTitle>
        <CardDescription>
          Flujo C: el cliente paga directamente en Energia. No se llama al banco.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="efIdCliente">Número de contador</Label>
            <Input
              id="efIdCliente"
              placeholder="C-100001"
              value={idCliente}
              onChange={(e) => setIdCliente(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="efMonto">Monto recibido (Q)</Label>
            <Input
              id="efMonto"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="300"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="efRef">Referencia (opcional)</Label>
            <Input
              id="efRef"
              placeholder="EFE-2026-05-001"
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={loading} className="bg-amber-600 hover:bg-amber-700">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Banknote className="mr-2 h-4 w-4" />}
              Registrar pago
            </Button>
          </div>
        </form>
        {resultado ? (
          <div className="mt-6 rounded-md border bg-muted/40 p-4">
            <div className="flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-emerald-600" />
              <p className="font-medium">Pago registrado</p>
            </div>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <ResultadoRow label="Referencia" value={<code>{resultado.referencia}</code>} />
              <ResultadoRow label="Código" value={resultado.codigo} />
              <ResultadoRow label="Monto aplicado" value={formatQ(resultado.montoAplicado)} />
              <ResultadoRow label="Saldo pendiente" value={formatQ(resultado.saldoPendiente)} />
            </dl>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function PagoTarjetaCard() {
  const [idCliente, setIdCliente] = useState('')
  const [numero, setNumero] = useState('')
  const [cvv, setCvv] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<PagoTarjetaResponse | null>(null)

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!idCliente.trim() || !numero.trim() || !cvv.trim()) {
      toast.error('Contador, número y CVV son obligatorios.')
      return
    }
    setLoading(true)
    setResultado(null)
    try {
      const resp = await apiCall<PagoTarjetaResponse>('POST', '/pagar/tarjeta', {
        idCliente: idCliente.trim(),
        numero: numero.trim(),
        cvv: cvv.trim(),
      })
      setResultado(resp)
      if (resp.autorizado) {
        toast.success('Pago con tarjeta autorizado.', {
          description: `Referencia ${resp.referenciaBancaria ?? '—'} · ${formatQ(resp.montoCobrado)}`,
        })
      } else {
        toast.error(`No autorizado: ${resp.codigo}`, {
          description: resp.mensaje ?? undefined,
        })
      }
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
        <CardTitle>Pago con tarjeta</CardTitle>
        <CardDescription>
          Flujo B: Energia llama al BancoApi para validar y procesar el cobro (95% / 5%).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="tjIdCliente">Número de contador</Label>
            <Input
              id="tjIdCliente"
              placeholder="C-100001"
              value={idCliente}
              onChange={(e) => setIdCliente(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="tjNumero">Número de tarjeta</Label>
            <Input
              id="tjNumero"
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="4111-1111-1111-1111"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tjCvv">CVV</Label>
            <Input
              id="tjCvv"
              inputMode="numeric"
              autoComplete="cc-csc"
              maxLength={4}
              placeholder="123"
              value={cvv}
              onChange={(e) => setCvv(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <p className="text-xs text-muted-foreground sm:col-span-2">
            El CVV lo muestra el Banco al emitir la tarjeta. Seed de prueba: CVV{" "}
            <span className="font-mono">123</span> o <span className="font-mono">456</span>.
          </p>
          <div className="flex items-end justify-end sm:col-span-1">
            <Button type="submit" disabled={loading} className="bg-amber-600 hover:bg-amber-700">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
              Pagar con tarjeta
            </Button>
          </div>
        </form>
        {resultado ? (
          <div className="mt-6 rounded-md border bg-muted/40 p-4">
            <div className="flex items-center gap-2">
              {resultado.autorizado ? (
                <BadgeCheck className="h-5 w-5 text-emerald-600" />
              ) : (
                <BadgeCheck className="h-5 w-5 text-destructive" />
              )}
              <p className="font-medium">
                {resultado.autorizado ? 'Autorizado' : 'No autorizado'}
              </p>
              <Badge variant="outline" className="ml-auto">
                {resultado.codigo}
              </Badge>
            </div>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <ResultadoRow
                label="Referencia bancaria"
                value={<code>{resultado.referenciaBancaria ?? '—'}</code>}
              />
              <ResultadoRow label="Monto cobrado" value={formatQ(resultado.montoCobrado)} />
              <ResultadoRow
                label="Comisión retenida (5%)"
                value={resultado.comisionRetenida != null ? formatQ(resultado.comisionRetenida) : '—'}
              />
              <ResultadoRow label="Mensaje" value={resultado.mensaje ?? '—'} />
            </dl>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function ResultadoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{value}</dd>
    </div>
  )
}
