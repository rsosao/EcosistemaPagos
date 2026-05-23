import { useState } from "react"
import { Loader2, ShoppingCart } from "lucide-react"
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
import { apiPost } from "@/lib/api"
import { formatQuetzales } from "@/lib/format"

interface CompraResponse {
  codigo: string
  referencia: string
  saldo: number
}

export function PosView() {
  const [numero, setNumero] = useState("")
  const [cvv, setCvv] = useState("")
  const [monto, setMonto] = useState("")
  const [comercio, setComercio] = useState("")
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<CompraResponse | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setResultado(null)
    try {
      const r = await apiPost<CompraResponse>("/tarjetas/compra-pos", {
        numero: numero.trim(),
        cvv: cvv.trim(),
        monto: Number(monto),
        comercio: comercio.trim(),
      })
      setResultado(r)
      toast.success("Compra autorizada", {
        description: `Ref ${r.referencia} · saldo ${formatQuetzales(r.saldo)}`,
      })
      setMonto("")
    } catch (error) {
      toast.error("Compra rechazada", {
        description: (error as Error).message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="POS"
        description="Simulación de una compra con tarjeta en un comercio."
        icon={<ShoppingCart className="size-5" />}
      />

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Compra POS</CardTitle>
            <CardDescription>
              POST <code>/tarjetas/compra-pos</code>.
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
                    placeholder="4XXXXXXXXXXXXXXX"
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
                    placeholder="123"
                    required
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="monto">Monto</Label>
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
                  <Label htmlFor="comercio">Comercio</Label>
                  <Input
                    id="comercio"
                    value={comercio}
                    onChange={(e) => setComercio(e.target.value)}
                    placeholder="Ej. Cafetería UMG"
                    required
                  />
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
                  <ShoppingCart className="size-4" />
                )}
                Procesar compra
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resultado</CardTitle>
            <CardDescription>Comprobante de la transacción.</CardDescription>
          </CardHeader>
          <CardContent>
            {resultado ? (
              <div className="space-y-2 rounded-lg border border-blue-600/40 bg-blue-600/5 p-4">
                <p className="text-xs uppercase tracking-wider text-blue-700 dark:text-blue-400">
                  Autorizada
                </p>
                <p className="font-mono text-sm">
                  Referencia: <span className="font-semibold">{resultado.referencia}</span>
                </p>
                <p className="text-sm">
                  Nuevo saldo:{" "}
                  <span className="font-semibold">
                    {formatQuetzales(resultado.saldo)}
                  </span>
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aún no se ha procesado ninguna compra.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
