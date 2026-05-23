import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  CalendarPlusIcon,
  FileTextIcon,
  Loader2Icon,
  PlusIcon,
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
import { apiPost, formatoQ, type ApiError } from "@/lib/api";

const periodoInicial = () => new Date().toISOString().slice(0, 7);

type GenerarResp = {
  periodo: string;
  monto: number;
  cuotasGeneradas: number;
  clientes: number;
};

export function GenerarCuotasView() {
  const [periodo, setPeriodo] = useState(periodoInicial());
  const [monto, setMonto] = useState("250");
  const [generando, setGenerando] = useState(false);
  const [resultado, setResultado] = useState<GenerarResp | null>(null);

  const [idCliente, setIdCliente] = useState("");
  const [periodoManual, setPeriodoManual] = useState(periodoInicial());
  const [montoManual, setMontoManual] = useState("250");
  const [agregandoManual, setAgregandoManual] = useState(false);

  const generar = async (e: FormEvent) => {
    e.preventDefault();
    if (!periodo.trim()) {
      toast.warning("Indicá un periodo (YYYY-MM).");
      return;
    }
    const m = Number(monto);
    if (!Number.isFinite(m) || m <= 0) {
      toast.warning("El monto debe ser mayor a 0.");
      return;
    }
    setGenerando(true);
    try {
      const r = await apiPost<GenerarResp>("/generar-cuotas", {
        periodo: periodo.trim(),
        monto: m,
      });
      setResultado(r);
      toast.success(
        `Se generaron ${r.cuotasGeneradas} cuotas para ${r.periodo}.`,
      );
    } catch (err) {
      toast.error((err as ApiError).message);
    } finally {
      setGenerando(false);
    }
  };

  const cuotaManual = async (e: FormEvent) => {
    e.preventDefault();
    if (!idCliente.trim() || !periodoManual.trim()) {
      toast.warning("Completá número telefónico y periodo.");
      return;
    }
    const m = Number(montoManual);
    if (!Number.isFinite(m) || m <= 0) {
      toast.warning("Monto inválido.");
      return;
    }
    setAgregandoManual(true);
    try {
      await apiPost(
        `/clientes/${encodeURIComponent(idCliente.trim())}/cuota`,
        { periodo: periodoManual.trim(), monto: m },
      );
      toast.success("Cuota agregada al cliente.");
      setIdCliente("");
    } catch (err) {
      toast.error((err as ApiError).message);
    } finally {
      setAgregandoManual(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Generación de cuotas"
        description="Iniciá un nuevo mes generando cuotas masivas o agregá una cuota puntual a un cliente."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarPlusIcon className="size-4 text-violet-600" />
              Cuota mensual a todos los clientes
            </CardTitle>
            <CardDescription>
              Genera la cuota del periodo a todos los clientes que aún no la
              tengan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={generar}>
              <div className="grid gap-1.5">
                <Label htmlFor="periodo">Periodo</Label>
                <Input
                  id="periodo"
                  placeholder="2026-05"
                  value={periodo}
                  onChange={(e) => setPeriodo(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="monto">Monto por cuota (Q)</Label>
                <Input
                  id="monto"
                  type="number"
                  step="0.01"
                  min="0"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                disabled={generando}
                className="bg-violet-600 text-white hover:bg-violet-700"
              >
                {generando ? (
                  <Loader2Icon className="size-3.5 animate-spin" />
                ) : (
                  <FileTextIcon className="size-3.5" />
                )}
                Generar cuotas
              </Button>
            </form>

            {resultado ? (
              <div className="mt-5 rounded-lg border border-violet-200 bg-violet-50 p-4 text-sm dark:border-violet-400/30 dark:bg-violet-500/10">
                <p className="font-medium text-violet-700 dark:text-violet-100">
                  Periodo {resultado.periodo}
                </p>
                <p className="text-violet-700/80 dark:text-violet-100/80">
                  {resultado.cuotasGeneradas} cuotas generadas de{" "}
                  {resultado.clientes} clientes · Monto{" "}
                  {formatoQ(resultado.monto)}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusIcon className="size-4 text-violet-600" />
              Cuota manual a un cliente
            </CardTitle>
            <CardDescription>
              Útil para ajustes o reposiciones puntuales.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={cuotaManual}>
              <div className="grid gap-1.5">
                <Label htmlFor="idClienteManual">Número telefónico</Label>
                <Input
                  id="idClienteManual"
                  placeholder="55551234"
                  value={idCliente}
                  onChange={(e) => setIdCliente(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="periodoManual">Periodo</Label>
                  <Input
                    id="periodoManual"
                    placeholder="2026-05"
                    value={periodoManual}
                    onChange={(e) => setPeriodoManual(e.target.value)}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="montoManual">Monto</Label>
                  <Input
                    id="montoManual"
                    type="number"
                    step="0.01"
                    min="0"
                    value={montoManual}
                    onChange={(e) => setMontoManual(e.target.value)}
                  />
                </div>
              </div>
              <Button
                type="submit"
                variant="outline"
                disabled={agregandoManual}
              >
                {agregandoManual ? (
                  <Loader2Icon className="size-3.5 animate-spin" />
                ) : (
                  <PlusIcon className="size-3.5" />
                )}
                Agregar cuota
              </Button>
            </form>

            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">Tip</Badge>
              <span>El periodo debe tener el formato AAAA-MM.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
