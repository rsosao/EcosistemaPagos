import { useEffect, useState } from "react"
import {
  ArrowRight,
  Banknote,
  CreditCard,
  LayoutDashboard,
  RefreshCw,
  Users,
  Wallet,
} from "lucide-react"
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
import { apiGet } from "@/lib/api"
import type { ViewId } from "@/components/AppShell"

interface DashboardViewProps {
  onNavigate: (view: ViewId) => void
}

interface ComisionesResponse {
  desde: string
  hasta: string
  totalComisiones: number
  cantidad: number
}

interface MovimientosBancoResponse {
  cuenta: string
  saldo: number
  movimientos: Array<{ id: number }>
}

interface UltimosMovimiento {
  empresa: string
  saldo: number
}

const EMPRESAS = ["Universidad", "Telefonia", "Energia"] as const

export function DashboardView({ onNavigate }: DashboardViewProps) {
  const [loading, setLoading] = useState(false)
  const [comisiones, setComisiones] = useState<ComisionesResponse | null>(null)
  const [cuentaBanco, setCuentaBanco] = useState<MovimientosBancoResponse | null>(
    null,
  )
  const [saldosEmpresa, setSaldosEmpresa] = useState<UltimosMovimiento[]>([])

  const cargar = async () => {
    setLoading(true)
    try {
      const desde = "2000-01-01"
      const hasta = "2099-12-31"
      const [com, banco, ...empresas] = await Promise.all([
        apiGet<ComisionesResponse>(
          `/reportes/comisiones?desde=${desde}&hasta=${hasta}`,
        ).catch(() => null),
        apiGet<MovimientosBancoResponse>(
          `/reportes/movimientos-cuenta-banco`,
        ).catch(() => null),
        ...EMPRESAS.map((emp) =>
          apiGet<{ empresa: string; saldo: number }>(
            `/api/cuenta-empresa/${emp.toLowerCase()}/saldo`,
          ).catch(() => null),
        ),
      ])
      setComisiones(com)
      setCuentaBanco(banco)
      setSaldosEmpresa(
        empresas
          .filter((e): e is { empresa: string; saldo: number } => Boolean(e))
          .map((e) => ({ empresa: e.empresa, saldo: e.saldo })),
      )
    } catch (error) {
      toast.error("No se pudo cargar el dashboard", {
        description: (error as Error).message,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Métricas en vivo desde BancoApi."
        icon={<LayoutDashboard className="size-5" />}
        actions={
          <Button variant="outline" size="sm" onClick={cargar} disabled={loading}>
            <RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} />
            Refrescar
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Comisiones acumuladas"
          value={formatQuetzales(comisiones?.totalComisiones ?? 0)}
          hint={`${comisiones?.cantidad ?? 0} movimientos`}
          icon={<Banknote className="size-5" />}
        />
        <MetricCard
          title="Saldo cuenta del banco"
          value={formatQuetzales(cuentaBanco?.saldo ?? 0)}
          hint={cuentaBanco?.cuenta ?? "Sin cuenta"}
          icon={<Wallet className="size-5" />}
        />
        <MetricCard
          title="Movimientos del banco"
          value={String(cuentaBanco?.movimientos?.length ?? 0)}
          hint="Bitácora cuenta comisiones"
          icon={<CreditCard className="size-5" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cuentas transitorias de empresas</CardTitle>
          <CardDescription>
            Saldo actual de las cuentas donde se acredita el 95% de cada pago.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {saldosEmpresa.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay datos. Ejecuta el seed para crear las cuentas transitorias.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              {saldosEmpresa.map((s) => (
                <div
                  key={s.empresa}
                  className="rounded-lg border border-border/60 bg-card/60 p-4"
                >
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    {s.empresa}
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight">
                    {formatQuetzales(s.saldo)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Atajos rápidos</CardTitle>
          <CardDescription>
            Operaciones que puedes ejecutar contra los endpoints del banco.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ShortcutCard
            title="Sembrar datos"
            description="Crea clientes, cuentas y tarjetas demo."
            icon={<Users className="size-5" />}
            onClick={() => onNavigate("seed")}
          />
          <ShortcutCard
            title="Pagar un servicio"
            description="Flujo A · Banca virtual."
            icon={<Banknote className="size-5" />}
            onClick={() => onNavigate("pagar-servicio")}
          />
          <ShortcutCard
            title="Reportes"
            description="Comisiones, movimientos y comprobantes."
            icon={<CreditCard className="size-5" />}
            onClick={() => onNavigate("reportes")}
          />
        </CardContent>
      </Card>
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: string
  hint?: string
  icon: React.ReactNode
}

function MetricCard({ title, value, hint, icon }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="flex size-9 items-center justify-center rounded-md bg-blue-600/10 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
        {hint ? (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}

interface ShortcutCardProps {
  title: string
  description: string
  icon: React.ReactNode
  onClick: () => void
}

function ShortcutCard({ title, description, icon, onClick }: ShortcutCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-start gap-3 rounded-lg border border-border/60 bg-card p-4 text-left transition-colors hover:border-blue-600/40 hover:bg-blue-600/5"
    >
      <div className="flex size-9 items-center justify-center rounded-md bg-blue-600/10 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </button>
  )
}

function formatQuetzales(value: number): string {
  return new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
    minimumFractionDigits: 2,
  }).format(value)
}
