import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  CreditCard,
  FileBarChart2,
  Gauge,
  Sparkles,
  Users,
  Wallet,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/PageHeader'
import { apiCall, type ClientePendienteItem, type SaldoBancoResponse } from '@/lib/api'
import { formatQ } from '@/lib/format'

const quickLinks = [
  {
    to: '/clientes',
    title: 'Clientes',
    description: 'Registrar contadores, actualizar nombre y consultar estado de cuenta.',
    icon: Users,
  },
  {
    to: '/cuotas',
    title: 'Generar cuotas',
    description: 'Emular el corte mensual y generar la cuota a todos los clientes.',
    icon: Gauge,
  },
  {
    to: '/pagar',
    title: 'Pagar',
    description: 'Recibir pagos en efectivo (Flujo C) o con tarjeta (Flujo B).',
    icon: CreditCard,
  },
  {
    to: '/tesoreria',
    title: 'Tesorería',
    description: 'Saldo de la cuenta transitoria de Energia en el banco.',
    icon: Wallet,
  },
  {
    to: '/reportes',
    title: 'Reportes',
    description: 'Pendientes, pagados, movimientos y comprobantes.',
    icon: FileBarChart2,
  },
  {
    to: '/seed',
    title: 'Datos demo',
    description: 'Crear 2 contadores y su cuota mensual de Q300.',
    icon: Sparkles,
  },
]

interface ResumenState {
  pendientes: number
  totalPendiente: number
  saldoBanco: number | null
}

export function DashboardView() {
  const [state, setState] = useState<ResumenState>({
    pendientes: 0,
    totalPendiente: 0,
    saldoBanco: null,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancel = false
    const cargar = async () => {
      try {
        const [pendientes, saldo] = await Promise.allSettled([
          apiCall<ClientePendienteItem[]>('GET', '/reportes/clientes-pendientes'),
          apiCall<SaldoBancoResponse>('GET', '/tesoreria/saldo-banco'),
        ])
        if (cancel) return
        const lista = pendientes.status === 'fulfilled' ? pendientes.value : []
        setState({
          pendientes: lista.length,
          totalPendiente: lista.reduce((acc, c) => acc + c.totalPendiente, 0),
          saldoBanco: saldo.status === 'fulfilled' ? saldo.value.saldo : null,
        })
      } finally {
        if (!cancel) setLoading(false)
      }
    }
    cargar()
    return () => {
      cancel = true
    }
  }, [])

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Energia · Portal interno"
        description="Gestión de cuotas, pagos y reportes del servicio eléctrico."
        icon={<Zap className="h-5 w-5" />}
        actions={
          <Button asChild variant="outline">
            <a href="/scalar/v1" target="_blank" rel="noreferrer">
              <BookOpen className="mr-2 h-4 w-4" />
              Documentación API
            </a>
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Clientes con deuda</CardDescription>
            <CardTitle className="text-3xl">{loading ? '—' : state.pendientes}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary" className="bg-amber-600/10 text-amber-700 dark:text-amber-300">
              {formatQ(state.totalPendiente)} pendientes
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Saldo en banco (cuenta transitoria)</CardDescription>
            <CardTitle className="text-3xl">
              {loading
                ? '—'
                : state.saldoBanco === null
                  ? 'No disponible'
                  : formatQ(state.saldoBanco)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              95% acreditado por cada pago con tarjeta o banca virtual.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Identificador del cliente</CardDescription>
            <CardTitle className="text-3xl">Número de contador</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Ejemplo: <code className="rounded bg-muted px-1.5 py-0.5">C-100001</code>
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quickLinks.map(({ to, title, description, icon: Icon }) => (
          <Card key={to} className="transition-colors hover:border-amber-600/40">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-md bg-amber-600/10 text-amber-700 dark:text-amber-300">
                  <Icon className="h-4 w-4" />
                </div>
                <CardTitle className="text-lg">{title}</CardTitle>
              </div>
              <CardDescription className="pt-1">{description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="ghost" className="-ml-3 text-amber-700 hover:text-amber-700 dark:text-amber-300">
                <Link to={to}>
                  Abrir
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  )
}
