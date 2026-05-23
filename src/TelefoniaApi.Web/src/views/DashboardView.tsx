import { useEffect, useState } from "react";
import {
  ArrowRightIcon,
  CreditCardIcon,
  FileTextIcon,
  LandmarkIcon,
  PhoneIcon,
  UsersIcon,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ViewId } from "@/components/AppShell";
import {
  apiGet,
  formatoQ,
  type ClientePendiente,
  type MovimientoEmpresa,
} from "@/lib/api";

type Props = {
  onNavigate: (view: ViewId) => void;
};

export function DashboardView({ onNavigate }: Props) {
  const [pendientes, setPendientes] = useState<ClientePendiente[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoEmpresa[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const [p, m] = await Promise.all([
          apiGet<ClientePendiente[]>("/reportes/clientes-pendientes"),
          apiGet<MovimientoEmpresa[]>("/reportes/movimientos"),
        ]);
        if (!cancelado) {
          setPendientes(p);
          setMovimientos(m);
        }
      } catch {
        // dashboard tolerante: si la API no responde no rompemos la UI
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  const deudaTotal = pendientes.reduce((s, p) => s + p.totalPendiente, 0);
  const pagos = movimientos.filter((m) => m.tipo === "PagoRecibido");
  const ingresos = pagos.reduce((s, m) => s + m.monto, 0);

  const stats = [
    {
      label: "Clientes con deuda",
      valor: cargando ? "…" : String(pendientes.length),
      icon: UsersIcon,
    },
    {
      label: "Deuda pendiente",
      valor: cargando ? "…" : formatoQ(deudaTotal),
      icon: FileTextIcon,
    },
    {
      label: "Ingresos registrados",
      valor: cargando ? "…" : formatoQ(ingresos),
      icon: LandmarkIcon,
    },
    {
      label: "Pagos realizados",
      valor: cargando ? "…" : String(pagos.length),
      icon: CreditCardIcon,
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Panel Telefonía"
        description="Resumen operativo del microservicio de telefonía e internet. Identificador del cliente: número telefónico."
        actions={
          <Badge
            variant="outline"
            className="border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-400/40 dark:bg-violet-500/10 dark:text-violet-200"
          >
            <PhoneIcon className="size-3" />
            Empresa: Telefonia
          </Badge>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="overflow-hidden">
              <CardContent className="flex items-center justify-between gap-4 p-5">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </p>
                  <p className="text-2xl font-semibold tabular-nums">
                    {s.valor}
                  </p>
                </div>
                <div className="grid size-10 place-items-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
                  <Icon className="size-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Accesos rápidos</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            <Button
              variant="outline"
              className="justify-between"
              onClick={() => onNavigate("clientes")}
            >
              Registrar cliente
              <ArrowRightIcon className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              className="justify-between"
              onClick={() => onNavigate("generar")}
            >
              Generar cuotas del mes
              <ArrowRightIcon className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              className="justify-between"
              onClick={() => onNavigate("pagar")}
            >
              Recibir pago
              <ArrowRightIcon className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              className="justify-between"
              onClick={() => onNavigate("tesoreria")}
            >
              Saldo en el banco
              <ArrowRightIcon className="size-3.5" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Clientes con deuda</CardTitle>
          </CardHeader>
          <CardContent>
            {pendientes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {cargando
                  ? "Cargando información…"
                  : "Sin deuda registrada. Ejecuta el seed o genera cuotas para empezar."}
              </p>
            ) : (
              <ul className="space-y-2">
                {pendientes.slice(0, 5).map((p) => (
                  <li
                    key={p.idCliente}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium">{p.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        Nº {p.idCliente} · {p.cuotasPendientes} cuota
                        {p.cuotasPendientes === 1 ? "" : "s"}
                      </p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-violet-600 dark:text-violet-300">
                      {formatoQ(p.totalPendiente)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
