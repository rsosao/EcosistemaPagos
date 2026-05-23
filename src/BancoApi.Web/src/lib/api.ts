export type ApiError = Error & { codigo?: string; status?: number }

export async function apiCall<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const text = await res.text()
  let data: unknown = {}
  if (text.length > 0) {
    try {
      data = JSON.parse(text)
    } catch {
      data = { mensaje: text }
    }
  }

  if (!res.ok) {
    const obj = (data ?? {}) as Record<string, unknown>
    const mensaje =
      (obj.mensaje as string | undefined) ??
      (obj.codigo as string | undefined) ??
      `HTTP ${res.status}`
    const err: ApiError = new Error(mensaje)
    err.codigo = obj.codigo as string | undefined
    err.status = res.status
    throw err
  }

  return data as T
}

export const apiGet = <T>(path: string) => apiCall<T>("GET", path)
export const apiPost = <T>(path: string, body?: unknown) =>
  apiCall<T>("POST", path, body)
