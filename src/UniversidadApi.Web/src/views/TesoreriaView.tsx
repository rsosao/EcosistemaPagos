import { useCallback, useEffect, useState } from "react"
import { Loader2, RefreshCw, Wallet } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { PageHeader } from "@/components/PageHeader"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { api, type SaldoBancoDto } from "@/lib/api"
import { formatCurrency, formatDate } from "@/lib/utils"

export function TesoreriaView() {
  const [data, setData] = useState<SaldoBancoDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await api.get<SaldoBancoDto>("/tesoreria/saldo-banco")
      setData(r)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido"
      setError(msg)
      setData(null)
      toast.error("No se pudo consultar el saldo en el banco", {
        description: msg,
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tesorería"
        description="Saldo de la cuenta transitoria de la universidad en el banco."
        icon={<Wallet className="size-5" />}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={cargar}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Refrescar
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="size-4 text-emerald-600" />
            Saldo actual
          </CardTitle>
          <CardDescription>
            Datos provistos por BancoApi vía `/api/cuenta-empresa/Universidad/saldo`.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-destructive text-sm">{error}</p>
          ) : data ? (
            <div className="flex flex-wrap items-baseline gap-3">
              <Badge variant="success" className="px-3 py-1 text-base">
                {formatCurrency(data.saldo)}
              </Badge>
              <span className="text-muted-foreground text-sm">
                Empresa: {data.empresa}
              </span>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Cargando...</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Últimos movimientos</CardTitle>
          <CardDescription>
            Acreditaciones del 95% recibidas y otros movimientos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!data || data.ultimosMovimientos.length === 0 ? (
            <p className="text-muted-foreground rounded-md border border-dashed p-3 text-sm">
              Aún no hay movimientos para mostrar.
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Referencia</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.ultimosMovimientos.map((m, i) => (
                    <TableRow key={`${m.referencia ?? i}`}>
                      <TableCell>{formatDate(m.fecha)}</TableCell>
                      <TableCell>{m.tipo ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {m.referencia ?? m.descripcion ?? "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(m.monto ?? 0)}
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
