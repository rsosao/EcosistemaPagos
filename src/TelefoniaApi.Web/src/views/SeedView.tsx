import { useState } from "react";
import { toast } from "sonner";
import { DatabaseIcon, Loader2Icon, SparklesIcon } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiPost, formatoQ, type ApiError } from "@/lib/api";

type SeedResp = {
  codigo: string;
  mensaje: string;
  clientes?: { id: string; nombre: string }[];
  periodo?: string;
  cuotaMensual?: number;
};

export function SeedView() {
  const [cargando, setCargando] = useState(false);
  const [resp, setResp] = useState<SeedResp | null>(null);

  const ejecutar = async () => {
    setCargando(true);
    try {
      const r = await apiPost<SeedResp>("/seed");
      setResp(r);
      if (r.codigo === "OK") {
        toast.success("Datos semilla creados.");
      } else {
        toast.info(r.mensaje);
      }
    } catch (err) {
      toast.error((err as ApiError).message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Datos semilla"
        description="Llena la base con dos clientes de ejemplo y una cuota del mes actual para hacer la demo."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DatabaseIcon className="size-4 text-violet-600" />
            Inicializar tel_db
          </CardTitle>
          <CardDescription>
            Solo crea datos si la base aún no tiene clientes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Button
            onClick={ejecutar}
            disabled={cargando}
            className="bg-violet-600 text-white hover:bg-violet-700"
          >
            {cargando ? (
              <Loader2Icon className="size-3.5 animate-spin" />
            ) : (
              <SparklesIcon className="size-3.5" />
            )}
            Ejecutar seed
          </Button>

          {resp ? (
            <div className="rounded-xl border border-border p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{resp.codigo}</Badge>
                <p className="text-sm">{resp.mensaje}</p>
              </div>

              {resp.clientes ? (
                <div className="space-y-2 text-sm">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Clientes creados
                  </p>
                  <ul className="space-y-1">
                    {resp.clientes.map((c) => (
                      <li
                        key={c.id}
                        className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                      >
                        <span>{c.nombre}</span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {c.id}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {resp.periodo ? (
                <p className="text-xs text-muted-foreground">
                  Periodo {resp.periodo} · Cuota{" "}
                  {resp.cuotaMensual != null
                    ? formatoQ(resp.cuotaMensual)
                    : "—"}
                </p>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
