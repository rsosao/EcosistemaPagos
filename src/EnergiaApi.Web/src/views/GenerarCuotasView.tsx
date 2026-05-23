import { useState } from 'react'
import { Gauge, Loader2, PlusCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/PageHeader'
import {
  apiCall,
  type ApiError,
  type CuotaDetalle,
  type GenerarCuotasResponse,
} from '@/lib/api'
import { currentPeriodo, formatQ } from '@/lib/format'

export function GenerarCuotasView() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Generar cuotas"
        description="Emular el corte mensual: genera la cuota del periodo para todos los clientes registrados."
        icon={<Gauge className="h-5 w-5" />}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <CorteMensualCard />
        <CuotaManualCard />
      </div>
    </div>
  )
}

function CorteMensualCard() {
  const [periodo, setPeriodo] = useState(currentPeriodo())
  const [monto, setMonto] = useState('300')
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<GenerarCuotasResponse | null>(null)

  const ejecutar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const montoNum = Number(monto)
    if (!periodo.trim() || Number.isNaN(montoNum) || montoNum <= 0) {
      toast.error('Periodo y monto > 0 son obligatorios.')
      return
    }
    setLoading(true)
    try {
      const resp = await apiCall<GenerarCuotasResponse>('POST', '/generar-cuotas', {
        periodo: periodo.trim(),
        monto: montoNum,
      })
      setResultado(resp)
      toast.success(`Cuotas generadas: ${resp.generadas}`, {
        description: resp.mensaje ?? `Periodo ${resp.periodo ?? periodo}`,
      })
    } catch (err) {
      const e = err as ApiError
      toast.error(e.message, { description: e.codigo })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Corte masivo</CardTitle>
        <CardDescription>
          Crea una cuota por cada cliente registrado para el periodo indicado (formato{' '}
          <code className="rounded bg-muted px-1.5 py-0.5">YYYY-MM</code>). No duplica si ya existe.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={ejecutar}>
          <div className="grid gap-2">
            <Label htmlFor="periodo">Periodo</Label>
            <Input
              id="periodo"
              placeholder="2026-05"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="monto">Monto (Q)</Label>
            <Input
              id="monto"
              type="number"
              step="0.01"
              min="0.01"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={loading} className="bg-amber-600 hover:bg-amber-700">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Gauge className="mr-2 h-4 w-4" />}
              Generar cuotas
            </Button>
          </div>
        </form>
        {resultado ? (
          <div className="mt-4 rounded-md border bg-muted/40 p-3 text-sm">
            <p>
              <strong>{resultado.generadas}</strong> cuota(s) nueva(s)
              {resultado.periodo ? ` para el periodo ${resultado.periodo}` : ''}
              {resultado.monto != null ? ` por ${formatQ(resultado.monto)}` : ''}.
            </p>
            {resultado.mensaje ? (
              <p className="text-muted-foreground">{resultado.mensaje}</p>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function CuotaManualCard() {
  const [idCliente, setIdCliente] = useState('')
  const [periodo, setPeriodo] = useState(currentPeriodo())
  const [monto, setMonto] = useState('300')
  const [loading, setLoading] = useState(false)
  const [cuota, setCuota] = useState<CuotaDetalle | null>(null)

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const montoNum = Number(monto)
    if (!idCliente.trim() || !periodo.trim() || Number.isNaN(montoNum) || montoNum <= 0) {
      toast.error('Completa todos los campos correctamente.')
      return
    }
    setLoading(true)
    try {
      const resp = await apiCall<CuotaDetalle>(
        'POST',
        `/clientes/${encodeURIComponent(idCliente.trim())}/cuota`,
        { periodo: periodo.trim(), monto: montoNum },
      )
      setCuota(resp)
      toast.success(`Cuota ${resp.periodo} agregada al contador ${idCliente}.`)
    } catch (err) {
      const e = err as ApiError
      toast.error(e.message, { description: e.codigo })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cuota manual</CardTitle>
        <CardDescription>Agregar una cuota individual a un cliente específico.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="manualId">Número de contador</Label>
            <Input
              id="manualId"
              placeholder="C-100001"
              value={idCliente}
              onChange={(e) => setIdCliente(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="manualPeriodo">Periodo</Label>
              <Input
                id="manualPeriodo"
                placeholder="2026-05"
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="manualMonto">Monto (Q)</Label>
              <Input
                id="manualMonto"
                type="number"
                step="0.01"
                min="0.01"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>
          <Button type="submit" disabled={loading} className="bg-amber-600 hover:bg-amber-700">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
            Agregar cuota
          </Button>
        </form>
        {cuota ? (
          <div className="mt-4 rounded-md border bg-muted/40 p-3 text-sm">
            <p>
              Cuota <strong>{cuota.periodo}</strong> por{' '}
              <strong>{formatQ(cuota.monto)}</strong> creada (id #{cuota.id}).
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
