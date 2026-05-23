import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  BanknoteIcon,
  CheckCircle2Icon,
  CreditCardIcon,
  Loader2Icon,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  apiGet,
  apiPost,
  formatoFecha,
  formatoQ,
  type ApiError,
  type EstadoCuenta,
  type PagoResponse,
} from "@/lib/api";

function ResultadoPago({ pago }: { pago: PagoResponse }) {
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-400/30 dark:bg-emerald-500/10">
      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-200">
        <CheckCircle2Icon className="size-5" />
        <p className="font-medium">{pago.mensaje}</p>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-wider text-muted-foreground">
            Referencia
          </dt>
          <dd className="font-mono text-foreground">{pago.referencia ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-muted-foreground">
            Método
          </dt>
          <dd className="text-foreground">{pago.metodo}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-muted-foreground">
            Monto cobrado
          </dt>
          <dd className="font-semibold tabular-nums text-foreground">
            {formatoQ(pago.montoCobrado)}
          </dd>
        </div>
        {pago.comisionRetenida != null ? (
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">
              Comisión retenida
            </dt>
            <dd className="tabular-nums text-foreground">
              {formatoQ(pago.comisionRetenida)}
            </dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

function DeudaCliente({ estado }: { estado: EstadoCuenta }) {
  const pendientes = estado.cuotas.filter((c) => !c.pagada);
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">{estado.nombre}</p>
          <p className="text-xs text-muted-foreground">
            Número telefónico {estado.idCliente}
          </p>
        </div>
        <Badge
          variant="outline"
          className="border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-400/40 dark:bg-violet-500/10 dark:text-violet-200"
        >
          Deuda: {formatoQ(estado.pendiente)}
        </Badge>
      </div>
      {pendientes.length > 0 ? (
        <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
          {pendientes.map((c) => (
            <li key={c.id} className="flex justify-between">
              <span>Periodo {c.periodo}</span>
              <span className="tabular-nums text-foreground">
                {formatoQ(c.monto)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-emerald-600 dark:text-emerald-300">
          Cliente al día
        </p>
      )}
    </div>
  );
}

export function PagarView() {
  const [idCliente, setIdCliente] = useState("");
  const [estado, setEstado] = useState<EstadoCuenta | null>(null);
  const [buscando, setBuscando] = useState(false);

  const [referenciaEfectivo, setReferenciaEfectivo] = useState("");
  const [pagandoEfectivo, setPagandoEfectivo] = useState(false);

  const [numeroTarjeta, setNumeroTarjeta] = useState("");
  const [cvv, setCvv] = useState("");
  const [pagandoTarjeta, setPagandoTarjeta] = useState(false);

  const [resultado, setResultado] = useState<PagoResponse | null>(null);

  const buscar = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!idCliente.trim()) {
      toast.warning("Ingresá el número telefónico del cliente.");
      return;
    }
    setBuscando(true);
    setResultado(null);
    try {
      const data = await apiGet<EstadoCuenta>(
        `/clientes/${encodeURIComponent(idCliente.trim())}/estado-cuenta`,
      );
      setEstado(data);
    } catch (err) {
      setEstado(null);
      toast.error((err as ApiError).message);
    } finally {
      setBuscando(false);
    }
  };

  const pagarEfectivo = async () => {
    if (!estado) return;
    if (estado.pendiente <= 0) {
      toast.warning("El cliente no tiene saldo pendiente.");
      return;
    }
    setPagandoEfectivo(true);
    try {
      const r = await apiPost<PagoResponse>("/pagar/efectivo", {
        idCliente: estado.idCliente,
        monto: estado.pendiente,
        referencia: referenciaEfectivo.trim() || null,
      });
      setResultado(r);
      toast.success("Pago en efectivo registrado.");
      buscar();
    } catch (err) {
      toast.error((err as ApiError).message);
    } finally {
      setPagandoEfectivo(false);
    }
  };

  const pagarTarjeta = async () => {
    if (!estado) return;
    if (!numeroTarjeta.trim() || !cvv.trim()) {
      toast.warning("Ingresá número de tarjeta y CVV.");
      return;
    }
    if (estado.pendiente <= 0) {
      toast.warning("El cliente no tiene saldo pendiente.");
      return;
    }
    setPagandoTarjeta(true);
    try {
      const r = await apiPost<PagoResponse>("/pagar/tarjeta", {
        idCliente: estado.idCliente,
        numero: numeroTarjeta.trim(),
        cvv: cvv.trim(),
      });
      setResultado(r);
      toast.success("Pago con tarjeta autorizado.");
      setNumeroTarjeta("");
      setCvv("");
      buscar();
    } catch (err) {
      toast.error((err as ApiError).message);
    } finally {
      setPagandoTarjeta(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Recibir pago"
        description="Cobrá la deuda de un cliente por número telefónico. Soporta pago en efectivo (Flujo C) y pasarela de tarjeta vía BancoApi (Flujo B)."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SearchIcon className="size-4 text-violet-600" />
            Cliente a cobrar
          </CardTitle>
          <CardDescription>
            Buscá por número telefónico para previsualizar la deuda.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <form className="flex flex-col gap-3 sm:flex-row" onSubmit={buscar}>
            <div className="grid flex-1 gap-1.5">
              <Label htmlFor="idClientePago">Número telefónico</Label>
              <Input
                id="idClientePago"
                placeholder="55551234"
                value={idCliente}
                onChange={(e) => setIdCliente(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              variant="outline"
              className="self-end"
              disabled={buscando}
            >
              {buscando ? (
                <Loader2Icon className="size-3.5 animate-spin" />
              ) : (
                <SearchIcon className="size-3.5" />
              )}
              Buscar
            </Button>
          </form>

          {estado ? <DeudaCliente estado={estado} /> : null}
        </CardContent>
      </Card>

      {estado ? (
        <Card>
          <CardHeader>
            <CardTitle>Procesar pago</CardTitle>
            <CardDescription>
              Elegí el método. El monto siempre liquida la deuda completa.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="efectivo" className="w-full">
              <TabsList>
                <TabsTrigger value="efectivo">
                  <BanknoteIcon className="size-3.5" />
                  Efectivo
                </TabsTrigger>
                <TabsTrigger value="tarjeta">
                  <CreditCardIcon className="size-3.5" />
                  Tarjeta
                </TabsTrigger>
              </TabsList>
              <TabsContent value="efectivo" className="mt-4 space-y-4">
                <div className="grid gap-1.5 sm:max-w-sm">
                  <Label htmlFor="refEfectivo">
                    Referencia (opcional)
                  </Label>
                  <Input
                    id="refEfectivo"
                    placeholder="Recibo manual"
                    value={referenciaEfectivo}
                    onChange={(e) => setReferenciaEfectivo(e.target.value)}
                  />
                </div>
                <Button
                  onClick={pagarEfectivo}
                  disabled={pagandoEfectivo || estado.pendiente <= 0}
                  className="bg-violet-600 text-white hover:bg-violet-700"
                >
                  {pagandoEfectivo ? (
                    <Loader2Icon className="size-3.5 animate-spin" />
                  ) : (
                    <BanknoteIcon className="size-3.5" />
                  )}
                  Cobrar {formatoQ(estado.pendiente)} en efectivo
                </Button>
              </TabsContent>
              <TabsContent value="tarjeta" className="mt-4 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label htmlFor="numeroTarjeta">Número de tarjeta</Label>
                    <Input
                      id="numeroTarjeta"
                      placeholder="4111-1111-1111-1111"
                      value={numeroTarjeta}
                      onChange={(e) => setNumeroTarjeta(e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      maxLength={4}
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                </div>
                <Button
                  onClick={pagarTarjeta}
                  disabled={pagandoTarjeta || estado.pendiente <= 0}
                  className="bg-violet-600 text-white hover:bg-violet-700"
                >
                  {pagandoTarjeta ? (
                    <Loader2Icon className="size-3.5 animate-spin" />
                  ) : (
                    <CreditCardIcon className="size-3.5" />
                  )}
                  Cobrar {formatoQ(estado.pendiente)} con tarjeta
                </Button>
                <p className="text-xs text-muted-foreground">
                  La pasarela valida la tarjeta y debita el monto contra BancoApi. El CVV
                  lo muestra el Banco al emitir la tarjeta; seed de prueba:{" "}
                  <span className="font-mono">123</span> o{" "}
                  <span className="font-mono">456</span>.
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ) : null}

      {resultado ? (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Último pago · {formatoFecha(new Date().toISOString())}
          </p>
          <ResultadoPago pago={resultado} />
        </div>
      ) : null}
    </div>
  );
}
