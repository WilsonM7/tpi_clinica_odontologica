const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'

export type User = {
  id: string
  nombre: string
  apellido: string
  email: string
  rol: string
}

export function getUser(): User | null {
  const raw = localStorage.getItem('user')
  try {
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function getToken(): string | null {
  return localStorage.getItem('token')
}

export function isAuthenticated(): boolean {
  return !!getToken()
}

export async function login(email: string, password: string): Promise<User> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'Email o contraseña incorrectos')
  }
  const { token, user } = await res.json()
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(user))
  return user
}

export function logout(): void {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}
