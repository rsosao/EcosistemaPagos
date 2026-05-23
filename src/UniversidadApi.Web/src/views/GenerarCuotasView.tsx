import { useState, type FormEvent } from "react"
import { Loader2, PlusCircle, Receipt, Sparkles } from "lucide-react"
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
import { api } from "@/lib/api"

interface GenerarCuotasResult {
  generadas?: number
  periodo?: string
  monto?: number
  mensaje?: string
}

function defaultPeriodo() {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, "0")
  return `${yyyy}-${mm}`
}

export function GenerarCuotasView() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Generar cuotas"
        description="Crea la cuota mensual para todos los estudiantes registrados."
        icon={<Receipt className="size-5" />}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <CuotaMasivaCard />
        <CuotaManualCard />
      </div>
    </div>
  )
}

function CuotaMasivaCard() {
  const [periodo, setPeriodo] = useState(defaultPeriodo)
  const [monto, setMonto] = useState("500")
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<GenerarCuotasResult | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const r = await api.post<GenerarCuotasResult>("/generar-cuotas", {
        periodo: periodo.trim(),
        monto: Number(monto),
      })
      setResultado(r)
      toast.success(
        r.mensaje
          ? r.mensaje
          : `Cuotas generadas: ${r.generadas ?? 0}`,
      )
    } catch (err) {
      toast.error("No se pudieron generar las cuotas", {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-4 text-emerald-600" />
          Cuota del periodo
        </CardTitle>
        <CardDescription>
          Genera la cuota mensual para todos los estudiantes registrados.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-3" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="periodo">Periodo (YYYY-MM)</Label>
            <Input
              id="periodo"
              placeholder="2026-05"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="monto">Monto por estudiante</Label>
            <Input
              id="monto"
              type="number"
              min="0"
              step="0.01"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Receipt className="size-4" />
            )}
            Generar cuotas del periodo
          </Button>
        </form>
      </CardContent>
      {resultado && (
        <CardFooter className="flex flex-wrap gap-2 text-sm">
          <Badge variant="success">
            Generadas: {resultado.generadas ?? 0}
          </Badge>
          {resultado.periodo && (
            <Badge variant="secondary">Periodo: {resultado.periodo}</Badge>
          )}
          {resultado.monto !== undefined && (
            <Badge variant="outline">Q {resultado.monto}</Badge>
          )}
        </CardFooter>
      )}
    </Card>
  )
}

function CuotaManualCard() {
  const [carne, setCarne] = useState("")
  const [periodo, setPeriodo] = useState(defaultPeriodo)
  const [monto, setMonto] = useState("500")
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!carne.trim()) return
    setLoading(true)
    try {
      await api.post(`/clientes/${encodeURIComponent(carne.trim())}/cuota`, {
        periodo: periodo.trim(),
        monto: Number(monto),
      })
      toast.success("Cuota manual creada", {
        description: `Carné ${carne.trim()} · ${periodo}`,
      })
      setCarne("")
    } catch (err) {
      toast.error("No se pudo crear la cuota", {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlusCircle className="size-4 text-emerald-600" />
          Cuota manual a un estudiante
        </CardTitle>
        <CardDescription>
          Útil cuando un estudiante se inscribe fuera del ciclo regular.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-3" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="manual-carne">Carné</Label>
            <Input
              id="manual-carne"
              placeholder="0901-22-1234"
              value={carne}
              onChange={(e) => setCarne(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="manual-periodo">Periodo (YYYY-MM)</Label>
            <Input
              id="manual-periodo"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="manual-monto">Monto</Label>
            <Input
              id="manual-monto"
              type="number"
              min="0"
              step="0.01"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              required
            />
          </div>
          <Button type="submit" variant="outline" disabled={loading}>
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <PlusCircle className="size-4" />
            )}
            Crear cuota manual
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
