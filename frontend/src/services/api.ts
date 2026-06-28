const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'

// Lee el token JWT del localStorage cuando esté implementado en Fase 2
function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const url = `${BASE_URL}${path}`

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    let message = `Error ${response.status}: ${response.statusText}`
    try {
      const data = await response.json()
      if (data?.message) message = data.message
    } catch {
      // respuesta sin body JSON: mantenemos el mensaje por defecto
    }
    throw new Error(message)
  }

  // 204 No Content no tiene body
  if (response.status === 204) return undefined as T

  return response.json() as Promise<T>
}

const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
}

export default api
