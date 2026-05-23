const currency = new Intl.NumberFormat('es-GT', {
  style: 'currency',
  currency: 'GTQ',
  minimumFractionDigits: 2,
})

export function formatQ(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return 'Q0.00'
  return currency.format(value)
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—'
  const d = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('es-GT', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function currentPeriodo(): string {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  return `${yyyy}-${mm}`
}
