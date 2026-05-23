/** Id interno (1, 2…) o número de cuenta con guión (1000-0001). */
export function esIdNumericoCuenta(ref: string): boolean {
  return /^\d+$/.test(ref.trim())
}

export function rutaCuenta(ref: string): string {
  const trimmed = ref.trim()
  return esIdNumericoCuenta(trimmed)
    ? `/cuentas/${trimmed}`
    : `/cuentas/numero/${encodeURIComponent(trimmed)}`
}

export function cuerpoEmitirTarjeta(
  ref: string,
  tipo: number,
): { cuentaId: number; tipo: number } | { numeroCuenta: string; tipo: number } {
  const trimmed = ref.trim()
  if (esIdNumericoCuenta(trimmed)) {
    return { cuentaId: Number(trimmed), tipo }
  }
  return { numeroCuenta: trimmed, tipo }
}
