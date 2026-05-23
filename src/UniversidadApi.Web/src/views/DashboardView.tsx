import { useCallback, useEffect, useState } from "react"
import {
  ArrowRight,
  BadgeCheck,
  CircleDollarSign,
  Loader2,
  RefreshCw,
  Users,
  Wallet,
} from "lucide-react"
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
  api,
  type ClientePagadoDto,
  type ClientePendienteDto,
  type SaldoBancoDto,
} from "@/lib/api"
import { formatCurrency } from "@/lib/utils"
import type { ViewKey } from "@/components/AppShell"

interface DashboardViewProps {
  onNavigate: (view: ViewKey) => void
}

export function DashboardView({ onNavigate }: DashboardViewProps) {
  const [loading, setLoading] = useState(false)
  const [pendientes, setPendientes] = useState<ClientePendienteDto[]>([])
  const [pagados, setPagados] = useState<ClientePagadoDto[]>([])
  const [saldo, setSaldo] = useState<SaldoBancoDto | null>(null)
  const [saldoError, setSaldoError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    setSaldoError(null)
    try {
      const [pend, pag] = await Promise.all([
        api.get<ClientePendienteDto[]>("/reportes/clientes-pendientes"),
        api.get<ClientePagadoDto[]>("/reportes/clientes-pagados"),
      ])
      setPendientes(pend)
      setPagados(pag)
    } catch (err) {
      toast.error("No se pudieron cargar los reportes", {
        description: err instanceof Error ? err.message : undefined,
      })
    }
    try {
      const s = await api.get<SaldoBancoDto>("/tesoreria/saldo-banco")
      setSaldo(s)
    } catch (err) {
      setSaldoError(err instanceof Error ? err.message : "Error desconocido")
      setSaldo(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  const carnetsPendientes = new Set(pendientes.map((p) => p.carne))
  const carnetsPagados = new Set(pagados.map((p) => p.carne))
  const totalEstudiantes = new Set([
    ...carnetsPendientes,
    ...carnetsPagados,
  ]).size
  const totalDeuda = pendientes.reduce((acc, p) => acc + p.deuda, 0)
  const cuotasPendientes = pendientes.reduce(
    (acc, p) => acc + p.cuotasPendientes,
    0,
  )
  const cuotasPagadas = pagados.length

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Resumen"
        description="Visión general del cobro de cuotas universitarias."
        icon={<CircleDollarSign className="size-5" />}
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
            Actualizar
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Estudiantes activos"
          value={String(totalEstudiantes)}
          hint="Con al menos una cuota registrada"
          icon={<Users className="size-5" />}
        />
        <SummaryCard
          title="Cuotas pendientes"
          value={String(cuotasPendientes)}
          hint={`${pendientes.length} estudiantes en mora`}
          icon={<CircleDollarSign className="size-5" />}
          accent
        />
        <SummaryCard
          title="Cuotas pagadas"
          value={String(cuotasPagadas)}
          hint="Acumulado de todos los periodos"
          icon={<BadgeCheck className="size-5" />}
        />
        <SummaryCard
          title="Saldo en banco"
          value={saldo ? formatCurrency(saldo.saldo) : saldoError ? "—" : "..."}
          hint={
            saldoError
              ? "Banco no disponible"
              : "Cuenta transitoria del banco"
          }
          icon={<Wallet className="size-5" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Deuda total acumulada</CardTitle>
            <CardDescription>
              Suma de cuotas no pagadas en todos los periodos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalDeuda)}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              Distribuida en {cuotasPendientes} cuotas pendientes.
            </p>
            <Button
              variant="link"
              className="mt-2 px-0 text-emerald-600 dark:text-emerald-400"
              onClick={() => onNavigate("reportes")}
            >
              Ver clientes pendientes
              <ArrowRight className="size-4" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atajos</CardTitle>
            <CardDescription>
              Operaciones más usadas del periodo.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button onClick={() => onNavigate("cuotas")}>
              Generar cuotas del periodo
            </Button>
            <Button variant="outline" onClick={() => onNavigate("pagar")}>
              Cobrar cuota
            </Button>
            <Button variant="outline" onClick={() => onNavigate("clientes")}>
              Estudiantes
            </Button>
            <Button variant="ghost" onClick={() => onNavigate("seed")}>
              Sembrar datos demo
            </Button>
          </CardContent>
        </Card>
      </div>

      {saldo && saldo.ultimosMovimientos?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Últimos movimientos en el banco</CardTitle>
            <CardDescription>
              Acreditaciones recibidas en la cuenta transitoria.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {saldo.ultimosMovimientos.slice(0, 5).map((m, idx) => (
              <div
                key={`${m.referencia ?? m.fecha ?? idx}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{m.tipo ?? "Movimiento"}</span>
                  <span className="text-muted-foreground text-xs">
                    {m.referencia ?? m.descripcion ?? "—"}
                  </span>
                </div>
                <Badge variant="success">{formatCurrency(m.monto ?? 0)}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

interface SummaryCardProps {
  title: string
  value: string
  hint?: string
  icon?: React.ReactNode
  accent?: boolean
}

function SummaryCard({ title, value, hint, icon, accent }: SummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardDescription className="flex items-center gap-2">
          <span
            className={
              accent
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-muted-foreground"
            }
          >
            {icon}
          </span>
          {title}
        </CardDescription>
        <CardTitle
          className={
            accent
              ? "text-3xl font-semibold text-emerald-600 dark:text-emerald-400"
              : "text-3xl font-semibold"
          }
        >
          {value}
        </CardTitle>
      </CardHeader>
      {hint && (
        <CardContent>
          <p className="text-muted-foreground text-sm">{hint}</p>
        </CardContent>
      )}
    </Card>
  )
}
