import { useState } from "react"
import { Database, Loader2, Sparkles } from "lucide-react"
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
import { PageHeader } from "@/components/PageHeader"
import { api } from "@/lib/api"

interface SeedResult {
  clientesCreados?: string[]
  cuotasGeneradas?: number
  periodo?: string
  monto?: number
}

export function SeedView() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SeedResult | null>(null)

  async function ejecutar() {
    setLoading(true)
    try {
      const r = await api.post<SeedResult>("/seed")
      setResult(r)
      toast.success("Datos demo sembrados", {
        description: `Cuotas generadas: ${r.cuotasGeneradas ?? 0}`,
      })
    } catch (err) {
      toast.error("No se pudo ejecutar el seed", {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Datos demo"
        description="Crea estudiantes y cuotas de ejemplo para probar el flujo."
        icon={<Database className="size-5" />}
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-emerald-600" />
            Sembrar datos
          </CardTitle>
          <CardDescription>
            Ejecuta POST <code className="text-xs">/seed</code> para crear 2
            estudiantes (Juan Pérez y María López) con una cuota de Q500 cada
            uno para el periodo actual. Es idempotente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={ejecutar} disabled={loading}>
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Database className="size-4" />
            )}
            Ejecutar seed
          </Button>
        </CardContent>
        {result && (
          <CardFooter className="flex flex-wrap gap-2 text-sm">
            <Badge variant="success">
              Cuotas: {result.cuotasGeneradas ?? 0}
            </Badge>
            {result.periodo && (
              <Badge variant="secondary">Periodo: {result.periodo}</Badge>
            )}
            {result.monto !== undefined && (
              <Badge variant="outline">Q {result.monto}</Badge>
            )}
            {result.clientesCreados && result.clientesCreados.length > 0 ? (
              result.clientesCreados.map((c) => (
                <Badge key={c} variant="outline" className="font-mono">
                  {c}
                </Badge>
              ))
            ) : (
              <Badge variant="outline">Sin estudiantes nuevos</Badge>
            )}
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
