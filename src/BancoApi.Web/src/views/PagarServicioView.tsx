import { useState } from "react"
import { Banknote, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/PageHeader"
import { Badge } from "@/components/ui/badge"
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

interface PagoServicioResponse {
  autorizado: boolean
  codigo: string
  referenciaBancaria: string
  montoDebitado: number
  acreditado: number
  comisionRetenida: number
  confirmacionEmpresa: boolean
  empresa: string
  saldoCuenta: number
}

const SERVICIOS = [
  { value: "universidad", label: "Universidad" },
  { value: "telefonia", label: "Telefonía" },
  { value: "energia", label: "Energía" },
]

export function PagarServicioView() {
  const [servicio, setServicio] = useState("universidad")
  const [idClienteServicio, setIdClienteServicio] = useState("")
  const [idCuentaBanco, setIdCuentaBanco] = useState("")
  const [loading, setLoading] = useState(false)
  const [comprobante, setComprobante] = useState<PagoServicioResponse | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setComprobante(null)
    try {
      const r = await apiPost<PagoServicioResponse>("/pagos/servicio", {
        servicio,
        idClienteServicio: idClienteServicio.trim(),
        idCuentaBanco: Number(idCuentaBanco),
      })
      setComprobante(r)
      toast.success("Pago acreditado", {
        description: `${r.empresa} · ref ${r.referenciaBancaria}`,
      })
    } catch (error) {
      toast.error("No se pudo pagar el servicio", {
        description: (error as Error).message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pagar Servicio · Flujo A"
        description="Banca virtual: el cliente debita su cuenta y el banco acredita 95% a la empresa y 5% a comisiones."
        icon={<Banknote className="size-5" />}
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Nuevo pago de servicio</CardTitle>
            <CardDescription>
              POST <code>/pagos/servicio</code>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="servicio">Servicio</Label>
                <Select value={servicio} onValueChange={setServicio}>
                  <SelectTrigger id="servicio" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICIOS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="idClienteServicio">
                  Identificador en la empresa
                </Label>
                <Input
                  id="idClienteServicio"
                  value={idClienteServicio}
                  onChange={(e) => setIdClienteServicio(e.target.value)}
                  placeholder="Ej. 0901-22-1234"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Carné (uni), número telefónico (tel) o número de contador (ee).
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="idCuentaBanco">Id cuenta del banco</Label>
                <Input
                  id="idCuentaBanco"
                  type="number"
                  min={1}
                  value={idCuentaBanco}
                  onChange={(e) => setIdCuentaBanco(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white hover:bg-blue-600/90"
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Banknote className="size-4" />
                )}
                Pagar servicio
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comprobante</CardTitle>
            <CardDescription>
              Detalle de la transacción procesada por el banco.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {comprobante ? (
              <div className="space-y-3 rounded-lg border border-blue-600/40 bg-blue-600/5 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-blue-700 dark:text-blue-400">
                    {comprobante.empresa}
                  </span>
                  <Badge
                    variant={comprobante.confirmacionEmpresa ? "default" : "secondary"}
                  >
                    {comprobante.confirmacionEmpresa
                      ? "Confirmado por empresa"
                      : "Banco OK · empresa pendiente"}
                  </Badge>
                </div>
                <p className="font-mono text-sm">
                  Referencia:{" "}
                  <span className="font-semibold">
                    {comprobante.referenciaBancaria}
                  </span>
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Monto debitado</p>
                    <p className="font-semibold">
                      {formatQuetzales(comprobante.montoDebitado)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Acreditado a empresa</p>
                    <p className="font-semibold">
                      {formatQuetzales(comprobante.acreditado)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Comisión retenida</p>
                    <p className="font-semibold">
                      {formatQuetzales(comprobante.comisionRetenida)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Saldo cuenta</p>
                    <p className="font-semibold">
                      {formatQuetzales(comprobante.saldoCuenta)}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aún no se ha realizado ningún pago.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
