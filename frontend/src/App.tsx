import { useEffect, useRef, useCallback, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Eye, EyeOff, ShieldAlert } from 'lucide-react'
import { login as authLogin, logout as authLogout, getUser, isAuthenticated, type User } from './lib/auth'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Pacientes from './pages/Pacientes'
import Agenda from './pages/Agenda'
import FichaPaciente from './pages/FichaPaciente'
import Usuarios from './pages/Usuarios'
import FichaUsuario from './pages/FichaUsuario'
import Practicas from './pages/Practicas'
import OrdenLlegada from './pages/OrdenLlegada'
import RutaProtegida from './components/RutaProtegida'

// ── Constantes de seguridad ────────────────────────────────────────────────
const MAX_INTENTOS     = 3
const BLOQUEO_SEG      = 30
const INACTIVIDAD_SEG  = 15 * 60  // 15 minutos
const AVISO_SEG        = 60       // aviso 60s antes de cerrar sesión

// ── Componente principal ───────────────────────────────────────────────────
function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isAuthenticated()) {
      setUser(getUser())
    }
    setLoading(false)
  }, [])

  function handleLogin(u: User) {
    setUser(u)
  }

  function handleLogout() {
    authLogout()
    setUser(null)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Cargando...</p>
    </div>
  )

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="relative bg-white rounded-xl shadow-md w-full max-w-sm overflow-hidden">
        <img src="/logo.jpg" alt="Clínica Odontológica"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
          style={{ objectPosition: '15% 65%' }} />
        <div className="relative z-10 px-8 py-10">
          <LoginForm onLogin={handleLogin} />
        </div>
      </div>
    </div>
  )

  return (
    <InactividadGuarda onLogout={handleLogout}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="pacientes" element={<Pacientes />} />
            <Route path="pacientes/:id" element={<FichaPaciente />} />
            <Route path="agenda" element={<Agenda />} />
            <Route path="practicas" element={
              <RutaProtegida rolesPermitidos={['admin', 'super_admin', 'jefe_clinica']}>
                <Practicas />
              </RutaProtegida>
            } />
            <Route path="usuarios" element={
              <RutaProtegida rolesPermitidos={['admin', 'super_admin', 'jefe_clinica']}>
                <Usuarios />
              </RutaProtegida>
            } />
            <Route path="usuarios/:id" element={
              <RutaProtegida rolesPermitidos={['admin', 'super_admin', 'jefe_clinica']}>
                <FichaUsuario />
              </RutaProtegida>
            } />
            <Route path="orden-llegada" element={<OrdenLlegada />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </InactividadGuarda>
  )
}

// ── Login con seguridad ────────────────────────────────────────────────────
function LoginForm({ onLogin }: { onLogin: (u: User) => void }) {
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [mostrarPass, setMostrarPass] = useState(false)
  const [intentos, setIntentos]     = useState(0)
  const [bloqueadoHasta, setBloqueadoHasta] = useState<number | null>(null)
  const [segsBloqueo, setSegsBloqueo] = useState(0)

  useEffect(() => {
    if (!bloqueadoHasta) return
    const interval = setInterval(() => {
      const restantes = Math.ceil((bloqueadoHasta - Date.now()) / 1000)
      if (restantes <= 0) {
        setBloqueadoHasta(null)
        setSegsBloqueo(0)
        setIntentos(0)
        setError('')
      } else {
        setSegsBloqueo(restantes)
      }
    }, 500)
    return () => clearInterval(interval)
  }, [bloqueadoHasta])

  const estaBloqueado = bloqueadoHasta !== null && Date.now() < bloqueadoHasta

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (estaBloqueado) return
    setLoading(true)
    setError('')

    try {
      const user = await authLogin(email, password)
      onLogin(user)
    } catch (err: any) {
      const nuevos = intentos + 1
      setIntentos(nuevos)
      if (nuevos >= MAX_INTENTOS) {
        setBloqueadoHasta(Date.now() + BLOQUEO_SEG * 1000)
        setSegsBloqueo(BLOQUEO_SEG)
        setError(`Demasiados intentos fallidos. Esperá ${BLOQUEO_SEG} segundos.`)
      } else {
        setError(`Email o contraseña incorrectos (intento ${nuevos}/${MAX_INTENTOS})`)
      }
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          placeholder="tu@email.com"
          required
          disabled={estaBloqueado}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
        <div className="relative">
          <input
            type={mostrarPass ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            placeholder="••••••••"
            required
            disabled={estaBloqueado}
          />
          <button
            type="button"
            onClick={() => setMostrarPass(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            title={mostrarPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {mostrarPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {intentos > 0 && !estaBloqueado && (
        <div className="flex gap-1">
          {Array.from({ length: MAX_INTENTOS }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                i < intentos ? 'bg-red-400' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      )}

      {error && (
        <div className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${
          estaBloqueado
            ? 'bg-orange-50 border border-orange-200 text-orange-700'
            : 'bg-red-50 border border-red-200 text-red-600'
        }`}>
          <ShieldAlert size={15} className="flex-shrink-0 mt-0.5" />
          <span>
            {estaBloqueado
              ? `Acceso bloqueado. Volvé a intentar en ${segsBloqueo}s`
              : error}
          </span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || estaBloqueado}
        className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {estaBloqueado
          ? `Bloqueado (${segsBloqueo}s)`
          : loading
          ? 'Ingresando...'
          : 'Ingresar'}
      </button>
    </form>
  )
}

// ── Timeout de sesión por inactividad ─────────────────────────────────────
function InactividadGuarda({ children, onLogout }: { children: React.ReactNode; onLogout: () => void }) {
  const [segsRestantes, setSegsRestantes] = useState<number | null>(null)
  const ultimaActividadRef = useRef(Date.now())

  const registrarActividad = useCallback(() => {
    ultimaActividadRef.current = Date.now()
    setSegsRestantes(null)
  }, [])

  useEffect(() => {
    const eventos = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click']
    eventos.forEach(ev => window.addEventListener(ev, registrarActividad, { passive: true }))

    const interval = setInterval(() => {
      const inactivoSeg = Math.floor((Date.now() - ultimaActividadRef.current) / 1000)
      const restantes   = INACTIVIDAD_SEG - inactivoSeg

      if (restantes <= 0) {
        onLogout()
      } else if (restantes <= AVISO_SEG) {
        setSegsRestantes(restantes)
      } else {
        setSegsRestantes(null)
      }
    }, 1000)

    return () => {
      eventos.forEach(ev => window.removeEventListener(ev, registrarActividad))
      clearInterval(interval)
    }
  }, [registrarActividad, onLogout])

  return (
    <>
      {children}

      {segsRestantes !== null && (
        <div className="fixed bottom-5 right-5 z-50 bg-white border border-orange-300 rounded-xl shadow-xl p-4 max-w-xs animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert size={18} className="text-orange-500 flex-shrink-0" />
            <p className="font-semibold text-gray-800 text-sm">Sesión por vencer</p>
          </div>
          <p className="text-gray-500 text-xs mb-3">
            Tu sesión se cerrará por inactividad en{' '}
            <strong className="text-orange-600">{segsRestantes}s</strong>.
          </p>
          <button
            onClick={registrarActividad}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-lg py-1.5 text-sm font-medium transition-colors"
          >
            Continuar sesión
          </button>
        </div>
      )}
    </>
  )
}

export default App
