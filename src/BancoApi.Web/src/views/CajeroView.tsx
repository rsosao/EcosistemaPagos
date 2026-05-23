import { useState } from "react"
import { LandPlot, Loader2 } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { apiPost } from "@/lib/api"
import { formatQuetzales } from "@/lib/format"

interface RetiroResponse {
  codigo: string
  referencia: string
  saldo: number
  comisionExtra: number
}

export function CajeroView() {
  const [numero, setNumero] = useState("")
  const [cvv, setCvv] = useState("")
  const [monto, setMonto] = useState("")
  const [red, setRed] = useState<"5B" | "Otra">("5B")
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<RetiroResponse | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setResultado(null)
    try {
      const r = await apiPost<RetiroResponse>("/tarjetas/retiro-cajero", {
        numero: numero.trim(),
        cvv: cvv.trim(),
        monto: Number(monto),
        red,
      })
      setResultado(r)
      toast.success("Retiro autorizado", {
        description: `Ref ${r.referencia} · saldo ${formatQuetzales(r.saldo)}`,
      })
      setMonto("")
    } catch (error) {
      toast.error("Retiro rechazado", {
        description: (error as Error).message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cajero ATM"
        description="Retiro de efectivo. La red 5B no cobra comisión, otras redes cobran Q5."
        icon={<LandPlot className="size-5" />}
      />

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Retiro en cajero</CardTitle>
            <CardDescription>
              POST <code>/tarjetas/retiro-cajero</code>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="numero">Número de tarjeta</Label>
                  <Input
                    id="numero"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    inputMode="numeric"
                    pattern="[0-9]{3,4}"
                    maxLength={4}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="monto">Monto a retirar</Label>
                  <Input
                    id="monto"
                    type="number"
                    min={0.01}
                    step="0.01"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="red">Red del cajero</Label>
                  <Select value={red} onValueChange={(v) => setRed(v as "5B" | "Otra")}>
                    <SelectTrigger id="red" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5B">Red 5B (sin comisión)</SelectItem>
                      <SelectItem value="Otra">Otra red (Q5 comisión)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white hover:bg-blue-600/90"
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <LandPlot className="size-4" />
                )}
                Realizar retiro
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resultado</CardTitle>
            <CardDescription>Detalle del retiro.</CardDescription>
          </CardHeader>
          <CardContent>
            {resultado ? (
              <div className="space-y-2 rounded-lg border border-blue-600/40 bg-blue-600/5 p-4">
                <p className="text-xs uppercase tracking-wider text-blue-700 dark:text-blue-400">
                  Autorizado
                </p>
                <p className="font-mono text-sm">
                  Referencia:{" "}
                  <span className="font-semibold">{resultado.referencia}</span>
                </p>
                <p className="text-sm">
                  Nuevo saldo:{" "}
                  <span className="font-semibold">
                    {formatQuetzales(resultado.saldo)}
                  </span>
                </p>
                <p className="text-sm">
                  Comisión extra:{" "}
                  <span className="font-semibold">
                    {formatQuetzales(resultado.comisionExtra)}
                  </span>
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aún no se ha procesado ningún retiro.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
