import { useState } from "react"
import { Database, Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/PageHeader"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { apiPost } from "@/lib/api"

export function SeedView() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<unknown>(null)

  const handleSeed = async () => {
    setLoading(true)
    try {
      const r = await apiPost<unknown>("/seed")
      setResult(r)
      toast.success("Datos sembrados", {
        description: "Clientes, cuentas y tarjetas demo creados.",
      })
    } catch (error) {
      toast.error("No se pudo sembrar", {
        description: (error as Error).message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Seed"
        description="Inicializa la base de datos del banco con datos de demostración."
        icon={<Database className="size-5" />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Sembrar datos demo</CardTitle>
          <CardDescription>
            POST <code>/seed</code> · crea clientes, cuentas, tarjetas y las
            cuentas transitorias de cada empresa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            type="button"
            size="lg"
            onClick={handleSeed}
            disabled={loading}
            className="w-full bg-blue-600 text-white hover:bg-blue-600/90 sm:w-auto"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            Sembrar datos
          </Button>
          <p className="text-sm text-muted-foreground">
            Este endpoint es idempotente. Después de ejecutarlo deberás generar
            cuotas en cada empresa para probar el Flujo A.
          </p>

          {result !== null ? (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Respuesta de la API
                </p>
                <pre className="max-h-72 overflow-auto rounded-md border border-border/60 bg-muted/40 p-3 font-mono text-xs leading-relaxed">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
