export type ApiError = Error & { codigo?: string }

export async function apiCall<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err: ApiError = new Error(
      (data as { mensaje?: string }).mensaje ??
        (data as { codigo?: string }).codigo ??
        `HTTP ${res.status}`,
    )
    err.codigo = (data as { codigo?: string }).codigo
    throw err
  }
  return data as T
}

// ---------- DTOs (alineados con EnergiaApi.Models) ----------

export interface ClienteResponse {
  idCliente: string
  nombre: string
  fechaRegistro: string
}

export interface CuotaDetalle {
  id: number
  periodo: string
  monto: number
  pagada: boolean
  fechaPago: string | null
  metodoPago: string | null
  referencia: string | null
}

export interface EstadoCuentaResponse {
  idCliente: string
  nombre: string
  totalPendiente: number
  totalPagado: number
  cuotas: CuotaDetalle[]
}

export interface PagoEfectivoResponse {
  codigo: string
  referencia: string
  montoAplicado: number
  saldoPendiente: number
}

export interface PagoTarjetaResponse {
  autorizado: boolean
  codigo: string
  referenciaBancaria: string | null
  montoCobrado: number
  comisionRetenida: number | null
  mensaje: string | null
}

export interface MovimientoBancoItem {
  tipo: string
  monto: number
  fecha: string
  referencia: string | null
}

export interface SaldoBancoResponse {
  empresa: string
  saldo: number
  ultimosMovimientos: MovimientoBancoItem[]
}

export interface ClientePendienteItem {
  idCliente: string
  nombre: string
  totalPendiente: number
  cuotasPendientes: number
}

export interface ClientePagadoItem {
  idCliente: string
  nombre: string
  periodo: string
  fechaPago: string | null
}

export interface MovimientoReporteItem {
  id: number
  tipo: string
  monto: number
  fecha: string
  clienteId: string | null
  referencia: string | null
}

export interface ComprobanteResponse {
  referencia: string
  idCliente: string
  nombreCliente: string
  periodo: string
  monto: number
  metodoPago: string
  fechaPago: string
}

export interface GenerarCuotasResponse {
  generadas: number
  periodo?: string
  monto?: number
  mensaje?: string
}

export interface SeedResponse {
  clientesCreados: string[]
  cuotasGeneradas: number
  periodo: string
  montoMensual: number
}

export const empresaInfo = {
  nombre: 'Energia',
  identificadorLabel: 'Número de contador',
  identificadorPlaceholder: 'C-100001',
  acentoHex: '#d97706',
}
