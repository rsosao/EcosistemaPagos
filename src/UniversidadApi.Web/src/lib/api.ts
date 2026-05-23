export type ApiError = Error & { codigo?: string; status?: number }

export async function apiCall<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let data: unknown = {}
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = { mensaje: text }
    }
  }
  if (!res.ok) {
    const payload = data as { mensaje?: string; codigo?: string; title?: string; detail?: string }
    const message =
      payload.mensaje ??
      payload.detail ??
      payload.title ??
      payload.codigo ??
      `HTTP ${res.status}`
    const err: ApiError = new Error(message)
    err.codigo = payload.codigo
    err.status = res.status
    throw err
  }
  return data as T
}

export const api = {
  get: <T>(path: string) => apiCall<T>("GET", path),
  post: <T>(path: string, body?: unknown) => apiCall<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => apiCall<T>("PUT", path, body),
  del: <T>(path: string) => apiCall<T>("DELETE", path),
}

export interface ClienteDto {
  carne: string
  nombre: string
  fechaRegistro: string
}

export interface CuotaDto {
  id: number
  periodo: string
  monto: number
  pagada: boolean
  fechaPago: string | null
  metodoPago: string | null
  referencia: string | null
}

export interface EstadoCuentaDto {
  idCliente: string
  nombre: string
  deudaTotal: number
  cuotasPendientes: CuotaDto[]
  cuotasPagadas: CuotaDto[]
}

export interface ComprobanteDto {
  referencia: string
  idCliente: string
  nombreCliente: string
  monto: number
  metodo: string
  fecha: string
  periodos: string[]
}

export interface MovimientoDto {
  id: number
  tipo: string
  monto: number
  fecha: string
  clienteId: string
  referencia: string | null
}

export interface ClientePendienteDto {
  carne: string
  nombre: string
  deuda: number
  cuotasPendientes: number
}

export interface ClientePagadoDto {
  carne: string
  nombre: string
  periodo: string
  fechaPago: string | null
  metodo: string | null
}

export interface SaldoBancoDto {
  empresa: string
  saldo: number
  ultimosMovimientos: Array<{
    tipo?: string
    monto?: number
    fecha?: string
    referencia?: string | null
    descripcion?: string | null
    [k: string]: unknown
  }>
}
