export type ApiError = Error & { codigo?: string };

export async function apiCall<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err: ApiError = new Error(
      (data as { mensaje?: string; codigo?: string }).mensaje ??
        (data as { codigo?: string }).codigo ??
        `HTTP ${res.status}`,
    );
    err.codigo = (data as { codigo?: string }).codigo;
    throw err;
  }

  return data as T;
}

export const apiGet = <T,>(path: string) => apiCall<T>("GET", path);
export const apiPost = <T,>(path: string, body?: unknown) =>
  apiCall<T>("POST", path, body);
export const apiPut = <T,>(path: string, body?: unknown) =>
  apiCall<T>("PUT", path, body);

export type Cliente = {
  id: string;
  nombre: string;
  fechaRegistro: string;
};

export type CuotaDetalle = {
  id: number;
  periodo: string;
  monto: number;
  pagada: boolean;
  fechaPago: string | null;
  metodoPago: string | null;
  referencia: string | null;
};

export type EstadoCuenta = {
  idCliente: string;
  nombre: string;
  pendiente: number;
  cuotas: CuotaDetalle[];
};

export type PagoResponse = {
  autorizado: boolean;
  codigo: string;
  mensaje: string;
  referencia: string | null;
  montoCobrado: number;
  comisionRetenida: number | null;
  metodo: string;
};

export type UltimoMovimientoBanco = {
  tipo: string;
  monto: number;
  fecha: string;
  referencia: string | null;
  descripcion: string | null;
};

export type SaldoBancarioResponse = {
  empresa: string;
  saldo: number;
  ultimosMovimientos: UltimoMovimientoBanco[];
};

export type ClientePendiente = {
  idCliente: string;
  nombre: string;
  totalPendiente: number;
  cuotasPendientes: number;
};

export type ClientePagado = {
  idCliente: string;
  nombre: string;
  periodo: string;
  monto: number;
  fechaPago: string | null;
};

export type MovimientoEmpresa = {
  id: number;
  tipo: string;
  monto: number;
  fecha: string;
  clienteId: string;
  referencia: string | null;
};

export type Comprobante = {
  referencia: string;
  idCliente: string;
  nombre: string;
  monto: number;
  metodo: string;
  fecha: string;
  cuotasPagadas: CuotaDetalle[];
};

export const formatoQ = (valor: number) =>
  new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
    minimumFractionDigits: 2,
  }).format(valor);

export const formatoFecha = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("es-GT", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};
