import { useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/PageHeader'
import { apiCall, type ApiError, type SeedResponse } from '@/lib/api'
import { formatQ } from '@/lib/format'

export function SeedView() {
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<SeedResponse | null>(null)

  const ejecutar = async () => {
    setLoading(true)
    try {
      const resp = await apiCall<SeedResponse>('POST', '/seed')
      setResultado(resp)
      toast.success('Datos demo cargados', {
        description: `Clientes nuevos: ${resp.clientesCreados.length} · Cuotas generadas: ${resp.cuotasGeneradas}`,
      })
    } catch (err) {
      const e = err as ApiError
      toast.error(e.message, { description: e.codigo })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Datos demo"
        description="Crea 2 contadores predefinidos y una cuota mensual de Q300 a cada uno."
        icon={<Sparkles className="h-5 w-5" />}
      />
      <Card>
        <CardHeader>
          <CardTitle>Cargar dataset</CardTitle>
          <CardDescription>
            Útil antes de la demostración. No duplica si ya fue ejecutado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={ejecutar} disabled={loading} className="bg-amber-600 hover:bg-amber-700">
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Ejecutar seed
          </Button>
          {resultado ? (
            <div className="rounded-md border bg-muted/40 p-4 text-sm">
              <p>
                Periodo: <strong>{resultado.periodo}</strong> · Monto:{' '}
                <strong>{formatQ(resultado.montoMensual)}</strong>
              </p>
              <p className="mt-1">
                Cuotas generadas: <strong>{resultado.cuotasGeneradas}</strong>
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {resultado.clientesCreados.length === 0 ? (
                  <Badge variant="outline">Sin clientes nuevos</Badge>
                ) : (
                  resultado.clientesCreados.map((id) => (
                    <Badge key={id} className="bg-amber-600 hover:bg-amber-600">
                      {id}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
