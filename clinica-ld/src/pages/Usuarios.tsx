import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Search, Plus, X } from 'lucide-react'

type Usuario = {
  id: string
  nombre: string
  email: string
  rol: string
  activo: boolean
  sucursales: { nombre: string }
}

type Especialidad = {
  id: string
  nombre: string
}

type Sucursal = {
  id: string
  nombre: string
}

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [rolUsuarioActual, setRolUsuarioActual] = useState('')
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([])
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [verDesactivados, setVerDesactivados] = useState(false)
  const [desactivados, setDesactivados] = useState<Usuario[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    cargarDatos()
    cargarRolActual()
  }, [])

  async function cargarRolActual() {
    const { data } = await supabase.auth.getUser()
    if (data.user) {
      const { data: u } = await supabase
        .from('usuarios').select('rol').eq('id', data.user.id).single()
      setRolUsuarioActual(u?.rol || '')
    }
  }

  async function cargarDatos() {
    setLoading(true)
    const [{ data: users }, { data: esps }, { data: sucs }] = await Promise.all([
      supabase.from('usuarios').select('*, sucursales(nombre)').eq('activo', true).order('nombre'),
      supabase.from('especialidades').select('*').order('nombre'),
      supabase.from('sucursales').select('*').eq('activa', true)
    ])
    setUsuarios(users || [])
    setEspecialidades(esps || [])
    setSucursales(sucs || [])
    setLoading(false)
  }

  async function cargarDesactivados() {
    const { data } = await supabase
      .from('usuarios').select('*, sucursales(nombre)').eq('activo', false).order('nombre')
    setDesactivados(data || [])
  }

  async function restaurarUsuario(userId: string) {
    await supabase.from('usuarios').update({ activo: true }).eq('id', userId)
    cargarDesactivados()
    cargarDatos()
  }

  const puedeGestionar = rolUsuarioActual === 'super_admin' || rolUsuarioActual === 'jefe_clinica'

  const etiquetaRol: Record<string, string> = {
    super_admin: '👑 Super Admin',
    jefe_clinica: '🏥 Jefe de Clínica',
    profesional: '🦷 Profesional',
    secretaria: '💼 Secretaria',
    telemarketer: '📞 Telemarketer',
    asistente: '🤝 Asistente',
    supervisora: '👁️ Supervisora',
  }

  const usuariosFiltrados = usuarios.filter(u =>
    u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.email.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Usuarios</h1>
        <div className="flex gap-2">
          {rolUsuarioActual === 'super_admin' && (
            <button
              onClick={() => { setVerDesactivados(true); cargarDesactivados() }}
              className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
            >
              Ver desactivados
            </button>
          )}
          {puedeGestionar && (
            <button
              onClick={() => setMostrarForm(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
            >
              <Plus size={16} /> Nuevo usuario
            </button>
          )}
        </div>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Rol</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Sucursal</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">Cargando...</td></tr>
            ) : usuariosFiltrados.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">No hay usuarios</td></tr>
            ) : (
              usuariosFiltrados.map(u => (
                <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{u.nombre}</td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                      {etiquetaRol[u.rol] || u.rol}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.sucursales?.nombre || '-'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigate(`/usuarios/${u.id}`)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Ver usuario
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {mostrarForm && (
        <FormularioUsuario
          especialidades={especialidades}
          sucursales={sucursales}
          onClose={() => setMostrarForm(false)}
          onGuardado={() => { setMostrarForm(false); cargarDatos() }}
        />
      )}

      {verDesactivados && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Usuarios desactivados</h2>
              <button onClick={() => setVerDesactivados(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            {desactivados.length === 0 ? (
              <p className="text-gray-400 text-sm">No hay usuarios desactivados</p>
            ) : (
              <div className="space-y-2">
                {desactivados.map(u => (
                  <div key={u.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{u.nombre}</p>
                      <p className="text-xs text-gray-500">{u.email} · {etiquetaRol[u.rol] || u.rol}</p>
                    </div>
                    <button
                      onClick={() => restaurarUsuario(u.id)}
                      className="text-sm text-green-600 hover:text-green-800 font-medium"
                    >
                      Restaurar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function FormularioUsuario({
  especialidades, sucursales, onClose, onGuardado
}: {
  especialidades: Especialidad[]
  sucursales: Sucursal[]
  onClose: () => void
  onGuardado: () => void
}) {
  const [tipo, setTipo] = useState<'administrativo' | 'profesional'>('administrativo')
  const [form, setForm] = useState({
    nombre: '', email: '', password: '', rol: 'secretaria', sucursal_id: ''
  })
  const [especialidadesSeleccionadas, setEspecialidadesSeleccionadas] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function toggleEspecialidad(id: string) {
    setEspecialidadesSeleccionadas(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!form.sucursal_id) {
      setError('Seleccioná una sucursal')
      setLoading(false)
      return
    }

    if (tipo === 'profesional' && especialidadesSeleccionadas.length === 0) {
      setError('Seleccioná al menos una especialidad')
      setLoading(false)
      return
    }

    const { data, error: fnError } = await supabase.functions.invoke('crear-usuario', {
      body: {
        nombre: form.nombre,
        email: form.email,
        password: form.password,
        rol: tipo === 'profesional' ? 'profesional' : form.rol,
        sucursal_id: form.sucursal_id,
        especialidades: especialidadesSeleccionadas
      }
    })

    if (fnError || data?.error) {
      const msg = data?.error || fnError?.message || ''
      if (msg.includes('already registered') || msg.includes('already been registered')) {
        setError('Ya existe un usuario con ese email')
      } else {
        setError('Error al crear usuario: ' + msg)
      }
      setLoading(false)
      return
    }

    onGuardado()
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Nuevo usuario</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => { setTipo('administrativo'); setForm(f => ({ ...f, rol: 'secretaria' })) }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
              tipo === 'administrativo' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Administrativo
          </button>
          <button
            type="button"
            onClick={() => { setTipo('profesional'); setForm(f => ({ ...f, rol: 'profesional' })) }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
              tipo === 'profesional' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Profesional
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
            <input
              value={form.nombre}
              onChange={e => setForm({ ...form, nombre: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              minLength={6}
            />
            <p className="text-xs text-gray-400 mt-1">Mínimo 6 caracteres</p>
          </div>

          {tipo === 'administrativo' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
              <select
                value={form.rol}
                onChange={e => setForm({ ...form, rol: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="secretaria">Secretaria</option>
                <option value="telemarketer">Telemarketer</option>
                <option value="asistente">Asistente</option>
                <option value="supervisora">Supervisora</option>
                <option value="jefe_clinica">Jefe de Clínica</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal *</label>
            <select
              value={form.sucursal_id}
              onChange={e => setForm({ ...form, sucursal_id: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Seleccioná --</option>
              {sucursales.map(s => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          </div>

          {tipo === 'profesional' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Especialidades *</label>
              <div className="space-y-2">
                {especialidades.map(esp => (
                  <label key={esp.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={especialidadesSeleccionadas.includes(esp.id)}
                      onChange={() => toggleEspecialidad(esp.id)}
                      className="rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">{esp.nombre}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}