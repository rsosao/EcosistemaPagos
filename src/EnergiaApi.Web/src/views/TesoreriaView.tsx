import { useEffect, useState } from 'react'
import { Loader2, RefreshCw, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/PageHeader'
import { apiCall, type ApiError, type SaldoBancoResponse } from '@/lib/api'
import { formatDate, formatQ } from '@/lib/format'

export function TesoreriaView() {
  const [saldo, setSaldo] = useState<SaldoBancoResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const cargar = async () => {
    setLoading(true)
    try {
      const resp = await apiCall<SaldoBancoResponse>('GET', '/tesoreria/saldo-banco')
      setSaldo(resp)
    } catch (err) {
      const e = err as ApiError
      setSaldo(null)
      toast.error(e.message, { description: e.codigo })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Tesorería"
        description="Saldo de la cuenta transitoria de Energia en BancoApi y últimos movimientos."
        icon={<Wallet className="h-5 w-5" />}
        actions={
          <Button onClick={cargar} disabled={loading} variant="outline">
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Actualizar
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-muted-foreground">Saldo disponible</CardTitle>
          <CardDescription>
            La empresa puede consultar su cuenta en el banco (95% acreditado por cada pago).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && !saldo ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Consultando al banco…
            </div>
          ) : saldo ? (
            <div className="flex flex-wrap items-end gap-3">
              <p className="text-4xl font-semibold tracking-tight text-amber-700 dark:text-amber-300">
                {formatQ(saldo.saldo)}
              </p>
              <Badge variant="secondary">{saldo.empresa}</Badge>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No se pudo consultar el saldo. Asegúrate de que <code>BancoApi</code> esté corriendo
              en <code>:5001</code>.
            </p>
          )}
        </CardContent>
      </Card>

      {saldo && saldo.ultimosMovimientos.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Últimos movimientos</CardTitle>
            <CardDescription>Acreditaciones recibidas en la cuenta transitoria.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Referencia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {saldo.ultimosMovimientos.map((m, i) => (
                    <TableRow key={`${m.referencia ?? ''}-${i}`}>
                      <TableCell>{formatDate(m.fecha)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{m.tipo}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">{formatQ(m.monto)}</TableCell>
                      <TableCell className="font-mono text-xs">{m.referencia ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
