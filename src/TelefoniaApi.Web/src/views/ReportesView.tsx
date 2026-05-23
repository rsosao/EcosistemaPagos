import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  CheckCircle2Icon,
  ClockIcon,
  FileSearchIcon,
  Loader2Icon,
  ReceiptIcon,
  ScrollTextIcon,
  SearchIcon,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  type ClientePagado,
  type ClientePendiente,
  type Comprobante,
  type EstadoCuenta,
  type MovimientoEmpresa,
} from "@/lib/api";

function PendientesPanel() {
  const [data, setData] = useState<ClientePendiente[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await apiGet<ClientePendiente[]>(
          "/reportes/clientes-pendientes",
        );
        setData(r);
      } catch (err) {
        toast.error((err as ApiError).message);
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  const total = data.reduce((s, p) => s + p.totalPendiente, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <ClockIcon className="size-4 text-violet-600" />
              Clientes pendientes
            </CardTitle>
            <CardDescription>
              Clientes con al menos una cuota sin pagar.
            </CardDescription>
          </div>
          <Badge variant="outline">Deuda total: {formatoQ(total)}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número telefónico</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Cuotas pendientes</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cargando ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm">
                    Cargando…
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-sm text-muted-foreground"
                  >
                    Todos los clientes están al día.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((p) => (
                  <TableRow key={p.idCliente}>
                    <TableCell className="font-mono text-xs">
                      {p.idCliente}
                    </TableCell>
                    <TableCell>{p.nombre}</TableCell>
                    <TableCell>{p.cuotasPendientes}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatoQ(p.totalPendiente)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function PagadosPanel() {
  const [periodo, setPeriodo] = useState("");
  const [data, setData] = useState<ClientePagado[]>([]);
  const [cargando, setCargando] = useState(false);

  const cargar = async (p?: string) => {
    setCargando(true);
    try {
      const url = p
        ? `/reportes/clientes-pagados?periodo=${encodeURIComponent(p)}`
        : "/reportes/clientes-pagados";
      const r = await apiGet<ClientePagado[]>(url);
      setData(r);
    } catch (err) {
      toast.error((err as ApiError).message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const buscar = (e: FormEvent) => {
    e.preventDefault();
    cargar(periodo.trim() || undefined);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2Icon className="size-4 text-violet-600" />
              Clientes pagados
            </CardTitle>
            <CardDescription>
              Pagos registrados por periodo (opcional).
            </CardDescription>
          </div>
          <form className="flex items-end gap-2" onSubmit={buscar}>
            <div className="grid gap-1.5">
              <Label htmlFor="periodoFiltro" className="text-xs">
                Filtrar por periodo
              </Label>
              <Input
                id="periodoFiltro"
                placeholder="2026-05"
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
              />
            </div>
            <Button type="submit" variant="outline" disabled={cargando}>
              {cargando ? (
                <Loader2Icon className="size-3.5 animate-spin" />
              ) : (
                <SearchIcon className="size-3.5" />
              )}
              Filtrar
            </Button>
          </form>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Periodo</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Fecha pago</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cargando ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm">
                    Cargando…
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-sm text-muted-foreground"
                  >
                    Sin pagos registrados.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((c, i) => (
                  <TableRow key={`${c.idCliente}-${c.periodo}-${i}`}>
                    <TableCell className="font-mono text-xs">
                      {c.idCliente}
                    </TableCell>
                    <TableCell>{c.nombre}</TableCell>
                    <TableCell>{c.periodo}</TableCell>
                    <TableCell className="tabular-nums">
                      {formatoQ(c.monto)}
                    </TableCell>
                    <TableCell>{formatoFecha(c.fechaPago)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function MovimientosPanel() {
  const [data, setData] = useState<MovimientoEmpresa[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await apiGet<MovimientoEmpresa[]>("/reportes/movimientos");
        setData(r);
      } catch (err) {
        toast.error((err as ApiError).message);
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScrollTextIcon className="size-4 text-violet-600" />
          Bitácora de movimientos
        </CardTitle>
        <CardDescription>
          Cuotas generadas y pagos recibidos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Referencia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cargando ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm">
                    Cargando…
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-sm text-muted-foreground"
                  >
                    Sin movimientos.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{formatoFecha(m.fecha)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{m.tipo}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {m.clienteId}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatoQ(m.monto)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {m.referencia ?? "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function ComprobantePanel() {
  const [referencia, setReferencia] = useState("");
  const [data, setData] = useState<Comprobante | null>(null);
  const [cargando, setCargando] = useState(false);

  const buscar = async (e: FormEvent) => {
    e.preventDefault();
    if (!referencia.trim()) {
      toast.warning("Ingresá la referencia.");
      return;
    }
    setCargando(true);
    try {
      const r = await apiGet<Comprobante>(
        `/reportes/comprobante/${encodeURIComponent(referencia.trim())}`,
      );
      setData(r);
    } catch (err) {
      setData(null);
      toast.error((err as ApiError).message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ReceiptIcon className="size-4 text-violet-600" />
          Comprobante por referencia
        </CardTitle>
        <CardDescription>
          Busca el comprobante de un pago realizado.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={buscar}>
          <div className="grid flex-1 gap-1.5">
            <Label htmlFor="referencia">Referencia</Label>
            <Input
              id="referencia"
              placeholder="EF-... o TJ-..."
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
            />
          </div>
          <Button type="submit" variant="outline" disabled={cargando}>
            {cargando ? (
              <Loader2Icon className="size-3.5 animate-spin" />
            ) : (
              <FileSearchIcon className="size-3.5" />
            )}
            Buscar
          </Button>
        </form>

        {data ? (
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Comprobante
                </p>
                <p className="font-mono text-sm">{data.referencia}</p>
              </div>
              <Badge
                variant="outline"
                className="border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-400/40 dark:bg-violet-500/10 dark:text-violet-200"
              >
                {data.metodo}
              </Badge>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                  Cliente
                </dt>
                <dd>{data.nombre}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                  Número telefónico
                </dt>
                <dd className="font-mono text-xs">{data.idCliente}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                  Fecha
                </dt>
                <dd>{formatoFecha(data.fecha)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                  Monto
                </dt>
                <dd className="font-semibold tabular-nums">
                  {formatoQ(data.monto)}
                </dd>
              </div>
            </dl>
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Periodo</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Método</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.cuotasPagadas.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.periodo}</TableCell>
                      <TableCell className="tabular-nums">
                        {formatoQ(c.monto)}
                      </TableCell>
                      <TableCell>{c.metodoPago ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function EstadoCuentaPanel() {
  const [id, setId] = useState("");
  const [data, setData] = useState<EstadoCuenta | null>(null);
  const [cargando, setCargando] = useState(false);

  const buscar = async (e: FormEvent) => {
    e.preventDefault();
    if (!id.trim()) {
      toast.warning("Ingresá un número telefónico.");
      return;
    }
    setCargando(true);
    try {
      const r = await apiGet<EstadoCuenta>(
        `/reportes/estado-cuenta/${encodeURIComponent(id.trim())}`,
      );
      setData(r);
    } catch (err) {
      setData(null);
      toast.error((err as ApiError).message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSearchIcon className="size-4 text-violet-600" />
          Estado de cuenta por cliente
        </CardTitle>
        <CardDescription>
          Reporte detallado por número telefónico.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={buscar}>
          <div className="grid flex-1 gap-1.5">
            <Label htmlFor="ecId">Número telefónico</Label>
            <Input
              id="ecId"
              placeholder="55551234"
              value={id}
              onChange={(e) => setId(e.target.value)}
            />
          </div>
          <Button type="submit" variant="outline" disabled={cargando}>
            {cargando ? (
              <Loader2Icon className="size-3.5 animate-spin" />
            ) : (
              <SearchIcon className="size-3.5" />
            )}
            Consultar
          </Button>
        </form>

        {data ? (
          <div className="space-y-3 rounded-xl border border-border p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{data.nombre}</p>
                <p className="text-xs text-muted-foreground">
                  Número telefónico {data.idCliente}
                </p>
              </div>
              <Badge
                variant="outline"
                className="border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-400/40 dark:bg-violet-500/10 dark:text-violet-200"
              >
                Pendiente {formatoQ(data.pendiente)}
              </Badge>
            </div>
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Periodo</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Referencia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.cuotas.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.periodo}</TableCell>
                      <TableCell className="tabular-nums">
                        {formatoQ(c.monto)}
                      </TableCell>
                      <TableCell>
                        {c.pagada ? (
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
                            Pagada
                          </Badge>
                        ) : (
                          <Badge variant="outline">Pendiente</Badge>
                        )}
                      </TableCell>
                      <TableCell>{c.metodoPago ?? "—"}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {c.referencia ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function ReportesView() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Reportes"
        description="Inteligencia operativa: pendientes, pagados, bitácora, comprobantes y estado de cuenta."
      />

      <Tabs defaultValue="pendientes" className="w-full">
        <TabsList className="flex-wrap">
          <TabsTrigger value="pendientes">Pendientes</TabsTrigger>
          <TabsTrigger value="pagados">Pagados</TabsTrigger>
          <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
          <TabsTrigger value="comprobante">Comprobante</TabsTrigger>
          <TabsTrigger value="estado">Estado de cuenta</TabsTrigger>
        </TabsList>
        <TabsContent value="pendientes" className="mt-4">
          <PendientesPanel />
        </TabsContent>
        <TabsContent value="pagados" className="mt-4">
          <PagadosPanel />
        </TabsContent>
        <TabsContent value="movimientos" className="mt-4">
          <MovimientosPanel />
        </TabsContent>
        <TabsContent value="comprobante" className="mt-4">
          <ComprobantePanel />
        </TabsContent>
        <TabsContent value="estado" className="mt-4">
          <EstadoCuentaPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
