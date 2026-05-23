import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2Icon, LandmarkIcon, RefreshCwIcon } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  apiGet,
  formatoFecha,
  formatoQ,
  type ApiError,
  type SaldoBancarioResponse,
} from "@/lib/api";

export function TesoreriaView() {
  const [data, setData] = useState<SaldoBancarioResponse | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = async () => {
    setCargando(true);
    setError(null);
    try {
      const r = await apiGet<SaldoBancarioResponse>("/tesoreria/saldo-banco");
      setData(r);
    } catch (err) {
      const msg = (err as ApiError).message;
      setError(msg);
      toast.error(msg);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Tesorería"
        description="Saldo de la cuenta transitoria de Telefonia en el banco, junto con los últimos movimientos acreditados (95%)."
        actions={
          <Button
            onClick={cargar}
            variant="outline"
            size="sm"
            disabled={cargando}
          >
            {cargando ? (
              <Loader2Icon className="size-3.5 animate-spin" />
            ) : (
              <RefreshCwIcon className="size-3.5" />
            )}
            Refrescar
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LandmarkIcon className="size-4 text-violet-600" />
            Saldo en BancoApi
          </CardTitle>
          <CardDescription>
            La empresa consulta su cuenta transitoria vía HTTP/JSON.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          {data ? (
            <>
              <div className="flex flex-col items-start gap-1 rounded-xl border border-violet-200 bg-violet-50 p-6 dark:border-violet-400/30 dark:bg-violet-500/10">
                <p className="text-xs uppercase tracking-wider text-violet-700/80 dark:text-violet-100/80">
                  Empresa {data.empresa}
                </p>
                <p className="text-4xl font-semibold tabular-nums text-violet-700 dark:text-violet-100">
                  {formatoQ(data.saldo)}
                </p>
                <p className="text-xs text-violet-700/70 dark:text-violet-100/70">
                  Acumulado por acreditaciones del 95% de cada pago de servicio.
                </p>
              </div>

              <div className="overflow-x-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Referencia</TableHead>
                      <TableHead>Descripción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.ultimosMovimientos.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center text-sm text-muted-foreground"
                        >
                          Sin movimientos registrados.
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.ultimosMovimientos.map((m, i) => (
                        <TableRow key={`${m.referencia ?? "mov"}-${i}`}>
                          <TableCell>{formatoFecha(m.fecha)}</TableCell>
                          <TableCell>{m.tipo}</TableCell>
                          <TableCell className="tabular-nums">
                            {formatoQ(m.monto)}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {m.referencia ?? "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {m.descripcion ?? "—"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : !error ? (
            <p className="text-sm text-muted-foreground">
              Consultando BancoApi…
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
