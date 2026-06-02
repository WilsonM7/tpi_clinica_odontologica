import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { supabase } from './lib/supabase'
import type { Session } from '@supabase/supabase-js'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Pacientes from './pages/Pacientes'
import Caja from './pages/Caja'
import Agenda from './pages/Agenda'
import FichaPaciente from './pages/FichaPaciente'
import Usuarios from './pages/Usuarios'
import FichaUsuario from './pages/FichaUsuario'
import Practicas from './pages/Practicas'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Cargando...</p>
    </div>
  )

  if (!session) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="relative bg-white rounded-xl shadow-md w-full max-w-sm overflow-hidden">
        <img
          src="/logo.jpg"
          alt="Ortodoncias L&D"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
          style={{ objectPosition: '15% 65%' }}
        />
        <div className="relative z-10 px-8 py-10">
          <LoginForm />
        </div>
      </div>
    </div>
  )

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="pacientes" element={<Pacientes />} />
          <Route path="pacientes/:id" element={<FichaPaciente />} />
          <Route path="caja" element={<Caja />} />
          <Route path="agenda" element={<Agenda />} />
          <Route path="usuarios" element={<Usuarios />} />
          <Route path="usuarios/:id" element={<FichaUsuario />} />
          <Route path="practicas" element={<Practicas />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('Email o contraseña incorrectos')
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
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="tu@email.com"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="••••••••"
          required
        />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Ingresando...' : 'Ingresar'}
      </button>
    </form>
  )
}

export default App
