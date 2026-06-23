import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { getUser } from '../lib/auth'
import { Search, Plus, X } from 'lucide-react'

type Paciente = {
  id: string
  apellido_nombre: string
  dni: string
  telefono: string
  email: string
  como_conocio: string
  activo: boolean
}

type NuevoPaciente = {
  apellido_nombre: string
  tipo_documento: string
  dni: string
  prefijo: string
  telefono: string
  email: string
  como_conocio: string
  fecha_nacimiento: string
  fecha_ingreso: string
  direccion: string
  ciudad: string
}

type PacienteAPI = {
  id: string
  nombre: string
  apellido: string
  dni: string
  telefono: string
  email: string
  como_conocio: string
  activo: boolean
}

function mapPaciente(p: PacienteAPI): Paciente {
  return {
    ...p,
    apellido_nombre: p.apellido && p.nombre
      ? `${p.apellido}, ${p.nombre}`
      : p.apellido || p.nombre || '',
  }
}

function splitApellidoNombre(apellidoNombre: string): { apellido: string; nombre: string } {
  const idx = apellidoNombre.indexOf(',')
  if (idx !== -1) {
    return {
      apellido: apellidoNombre.slice(0, idx).trim(),
      nombre: apellidoNombre.slice(idx + 1).trim(),
    }
  }
  const spIdx = apellidoNombre.indexOf(' ')
  if (spIdx !== -1) {
    return {
      apellido: apellidoNombre.slice(0, spIdx).trim(),
      nombre: apellidoNombre.slice(spIdx + 1).trim(),
    }
  }
  return { apellido: apellidoNombre.trim(), nombre: apellidoNombre.trim() }
}

export default function Pacientes() {
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [verDesactivados, setVerDesactivados] = useState(false)
  const [desactivados, setDesactivados] = useState<Paciente[]>([])
  const [rolUsuario, setRolUsuario] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    cargarPacientes()
    cargarRol()
  }, [])

  function cargarRol() {
    const u = getUser()
    setRolUsuario(u?.rol || '')
  }

  async function cargarPacientes() {
    setLoading(true)
    try {
      const data = await api.get<PacienteAPI[]>('/pacientes?activo=true')
      setPacientes(data.map(mapPaciente))
    } catch {
      setPacientes([])
    }
    setLoading(false)
  }

  async function cargarDesactivados() {
    try {
      const data = await api.get<PacienteAPI[]>('/pacientes?activo=false')
      setDesactivados(data.map(mapPaciente))
    } catch {
      setDesactivados([])
    }
  }

  async function restaurarPaciente(pacienteId: string) {
    try {
      await api.put(`/pacientes/${pacienteId}`, { activo: true })
      cargarDesactivados()
      cargarPacientes()
    } catch { /* ignorar */ }
  }

  const pacientesFiltrados = pacientes.filter(p =>
    p.apellido_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.dni || '').includes(busqueda)
  )

  return (
    <div className="h-full overflow-y-auto">
    <div className="p-6">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pacientes</h1>
        <div className="flex gap-2">
          {rolUsuario === 'super_admin' && (
            <button
              onClick={() => { setVerDesactivados(true); cargarDesactivados() }}
              className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
            >
              Ver desactivados
            </button>
          )}
          <button
            onClick={() => setMostrarForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            <Plus size={16} />
            Nuevo paciente
          </button>
        </div>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre o DNI..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Paciente</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Documento</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Teléfono</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">Cargando...</td></tr>
            ) : pacientesFiltrados.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">No hay pacientes</td></tr>
            ) : (
              pacientesFiltrados.map(p => (
                <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{p.apellido_nombre}</td>
                  <td className="px-4 py-3 text-gray-600">{p.dni}</td>
                  <td className="px-4 py-3 text-gray-600">{p.telefono || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{p.email || '-'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigate(`/pacientes/${p.id}`)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Ver ficha
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {mostrarForm && (
        <FormularioPaciente
          splitApellidoNombre={splitApellidoNombre}
          onClose={() => setMostrarForm(false)}
          onGuardado={() => { setMostrarForm(false); cargarPacientes() }}
        />
      )}

      {verDesactivados && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Pacientes desactivados</h2>
              <button onClick={() => setVerDesactivados(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            {desactivados.length === 0 ? (
              <p className="text-gray-400 text-sm">No hay pacientes desactivados</p>
            ) : (
              <div className="space-y-2">
                {desactivados.map(p => (
                  <div key={p.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{p.apellido_nombre}</p>
                      <p className="text-xs text-gray-500">{p.dni}</p>
                    </div>
                    <button
                      onClick={() => restaurarPaciente(p.id)}
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
    </div>
  )
}

function FormularioPaciente({
  splitApellidoNombre,
  onClose,
  onGuardado,
}: {
  splitApellidoNombre: (s: string) => { apellido: string; nombre: string }
  onClose: () => void
  onGuardado: () => void
}) {
  const [form, setForm] = useState<NuevoPaciente>({
    apellido_nombre: '', tipo_documento: 'DNI', dni: '',
    prefijo: '', telefono: '', email: '', como_conocio: '',
    fecha_nacimiento: '', fecha_ingreso: new Date().toISOString().split('T')[0],
    direccion: '', ciudad: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (form.prefijo && (form.prefijo.length < 3 || form.prefijo.length > 4)) {
      setError('El prefijo debe tener 3 o 4 dígitos')
      setLoading(false)
      return
    }

    if (form.telefono && form.telefono.length !== 9) {
      setError('El número de celular debe tener 9 dígitos')
      setLoading(false)
      return
    }

    if (form.email && !form.email.includes('@')) {
      setError('El email debe contener @')
      setLoading(false)
      return
    }

    if ((form.prefijo && !form.telefono) || (!form.prefijo && form.telefono)) {
      setError('Completá tanto el prefijo como el número de celular')
      setLoading(false)
      return
    }

    const { apellido, nombre } = splitApellidoNombre(form.apellido_nombre)
    const datosGuardar = {
      apellido,
      nombre,
      dni: `${form.tipo_documento}: ${form.dni}`,
      telefono: form.prefijo && form.telefono ? `${form.prefijo}-${form.telefono}` : '',
      email: form.email || null,
      como_conocio: form.como_conocio || null,
      fecha_nacimiento: form.fecha_nacimiento || null,
      fecha_ingreso: form.fecha_ingreso || null,
      direccion: form.direccion || null,
      ciudad: form.ciudad || null,
    }

    try {
      await api.post('/pacientes', datosGuardar)
      onGuardado()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar'
      setError(
        msg.toLowerCase().includes('dni') || msg.includes('409') || msg.includes('unique')
          ? `Ya existe un paciente con ${form.tipo_documento} ${form.dni}`
          : 'Error al guardar'
      )
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Nuevo paciente</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Apellido y nombre *</label>
            <input
              value={form.apellido_nombre}
              onChange={e => setForm({ ...form, apellido_nombre: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo y número de documento *</label>
            <div className="flex gap-2">
              <select
                value={form.tipo_documento}
                onChange={e => setForm({ ...form, tipo_documento: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>DNI</option>
                <option>LC</option>
                <option>CI</option>
                <option>LE</option>
                <option>PASAPORTE</option>
              </select>
              <input
                value={form.dni}
                onChange={e => setForm({ ...form, dni: e.target.value.replace(/\D/g, '') })}
                placeholder="Número"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono celular</label>
            <div className="flex gap-2">
              <input
                value={form.prefijo}
                onChange={e => setForm({ ...form, prefijo: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                placeholder="343"
                maxLength={4}
                className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                value={form.telefono}
                onChange={e => setForm({ ...form, telefono: e.target.value.replace(/\D/g, '').slice(0, 9) })}
                placeholder="123456789"
                maxLength={9}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Prefijo (3-4 dígitos) + número (9 dígitos)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="text"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="ejemplo@mail.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
            <input
              value={form.direccion}
              onChange={e => setForm({ ...form, direccion: e.target.value })}
              placeholder="Ej: San Martín 1234"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
            <input
              value={form.ciudad}
              onChange={e => setForm({ ...form, ciudad: e.target.value })}
              placeholder="Ej: Rosario"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de nacimiento</label>
            <input
              type="date"
              value={form.fecha_nacimiento}
              onChange={e => setForm({ ...form, fecha_nacimiento: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de ingreso</label>
            <input
              type="date"
              value={form.fecha_ingreso}
              onChange={e => setForm({ ...form, fecha_ingreso: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">¿Cómo nos conoció?</label>
            <select
              value={form.como_conocio}
              onChange={e => setForm({ ...form, como_conocio: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Seleccioná --</option>
              <option>Redes sociales</option>
              <option>Recomendación</option>
              <option>Google</option>
              <option>Pasando por el consultorio</option>
              <option>Otro</option>
            </select>
          </div>

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
