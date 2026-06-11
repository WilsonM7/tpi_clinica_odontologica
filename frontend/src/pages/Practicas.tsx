import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import api from '../services/api'
import { Search, Plus, X, Pencil } from 'lucide-react'

type Practica = {
  id: string
  codigo: string
  nombre: string
  valor: number
  especialidad_id: string | null
  cobra_descartable: boolean
  costo_mecanico: number | null
  multa: number | null
  tipo_multa: 'fijo' | 'control' | null
  activa: boolean
  especialidad?: { id: string; nombre: string; activa: boolean }
}

type Especialidad = {
  id: string
  nombre: string
}

export default function Practicas() {
  const [practicas, setPracticas] = useState<Practica[]>([])
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [practicaEditando, setPracticaEditando] = useState<Practica | null>(null)
  const [verDesactivadas, setVerDesactivadas] = useState(false)
  const [desactivadas, setDesactivadas] = useState<Practica[]>([])
  const [rolUsuario, setRolUsuario] = useState('')

  useEffect(() => {
    cargarDatos()
    cargarRol()
  }, [])

  async function cargarRol() {
    const { data } = await supabase.auth.getUser()
    if (data.user) {
      const { data: u } = await supabase.from('usuarios').select('rol').eq('id', data.user.id).single()
      setRolUsuario(u?.rol || '')
    }
  }

  async function cargarDatos() {
    setLoading(true)
    try {
      const [pracs, esps] = await Promise.all([
        api.get<Practica[]>('/practicas?activa=true'),
        api.get<Especialidad[]>('/especialidades'),
      ])
      setPracticas(pracs || [])
      setEspecialidades(esps || [])
    } finally {
      setLoading(false)
    }
  }

  async function cargarDesactivadas() {
    const data = await api.get<Practica[]>('/practicas?activa=false')
    setDesactivadas(data || [])
  }

  async function restaurarPractica(id: string) {
    await api.put(`/practicas/${id}`, { activa: true })
    cargarDesactivadas()
    cargarDatos()
  }

  const puedeGestionar = ['super_admin', 'jefe_clinica'].includes(rolUsuario)

  const practicasFiltradas = practicas.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.especialidad?.nombre || '').toLowerCase().includes(busqueda.toLowerCase())
  )

  function formatPrecio(v: number | null) {
    if (v == null) return '-'
    return `$${Number(v).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Prácticas</h1>
        <div className="flex gap-2">
          {puedeGestionar && (
            <button
              onClick={() => { setVerDesactivadas(true); cargarDesactivadas() }}
              className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
            >
              Ver desactivadas
            </button>
          )}
          {puedeGestionar && (
            <button
              onClick={() => { setPracticaEditando(null); setMostrarForm(true) }}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
            >
              <Plus size={16} /> Nueva práctica
            </button>
          )}
        </div>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre, código o especialidad..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Código</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Especialidad</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Valor</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Multa</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Descartable</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">Cargando...</td></tr>
            ) : practicasFiltradas.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">No hay prácticas</td></tr>
            ) : (
              practicasFiltradas.map(p => (
                <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.codigo}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{p.nombre}</td>
                  <td className="px-4 py-3 text-gray-600">{p.especialidad?.nombre || '-'}</td>
                  <td className="px-4 py-3 text-gray-800">{formatPrecio(p.valor)}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {p.multa ? (
                      <span className="flex items-center gap-1">
                        {formatPrecio(p.multa)}
                        {p.tipo_multa && (
                          <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded-full">
                            {p.tipo_multa}
                          </span>
                        )}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3">
                    {p.cobra_descartable ? (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">Sí</span>
                    ) : (
                      <span className="text-gray-400 text-xs">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {puedeGestionar && (
                      <button
                        onClick={() => { setPracticaEditando(p); setMostrarForm(true) }}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        title="Editar"
                      >
                        <Pencil size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {mostrarForm && (
        <FormularioPractica
          practica={practicaEditando}
          especialidades={especialidades}
          onClose={() => { setMostrarForm(false); setPracticaEditando(null) }}
          onGuardado={() => { setMostrarForm(false); setPracticaEditando(null); cargarDatos() }}
        />
      )}

      {verDesactivadas && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Prácticas desactivadas</h2>
              <button onClick={() => setVerDesactivadas(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            {desactivadas.length === 0 ? (
              <p className="text-gray-400 text-sm">No hay prácticas desactivadas</p>
            ) : (
              <div className="space-y-2">
                {desactivadas.map(p => (
                  <div key={p.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{p.nombre}</p>
                      <p className="text-xs text-gray-500">{p.codigo} · {p.especialidad?.nombre || 'Sin especialidad'}</p>
                    </div>
                    <button
                      onClick={() => restaurarPractica(p.id)}
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

// ── Formulario práctica ───────────────────────────────────────────────────────
function FormularioPractica({ practica, especialidades, onClose, onGuardado }: {
  practica: Practica | null
  especialidades: Especialidad[]
  onClose: () => void
  onGuardado: () => void
}) {
  const esEdicion = practica !== null
  const [form, setForm] = useState({
    nombre: practica?.nombre || '',
    valor: practica?.valor?.toString() || '',
    especialidad_id: practica?.especialidad_id || '',
    cobra_descartable: practica?.cobra_descartable || false,
    costo_mecanico: practica?.costo_mecanico?.toString() || '',
    multa: practica?.multa?.toString() || '',
    tipo_multa: practica?.tipo_multa || '' as '' | 'fijo' | 'control',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); setLoading(false); return }
    if (form.valor && isNaN(Number(form.valor))) { setError('El valor debe ser un número'); setLoading(false); return }
    if (form.multa && isNaN(Number(form.multa))) { setError('La multa debe ser un número'); setLoading(false); return }
    if (form.costo_mecanico && isNaN(Number(form.costo_mecanico))) { setError('El costo mecánico debe ser un número'); setLoading(false); return }

    const datos = {
      nombre: form.nombre.trim(),
      valor: form.valor ? Number(form.valor) : 0,
      especialidad_id: form.especialidad_id || null,
      cobra_descartable: form.cobra_descartable,
      costo_mecanico: form.costo_mecanico ? Number(form.costo_mecanico) : null,
      multa: form.multa ? Number(form.multa) : null,
      tipo_multa: form.tipo_multa || null,
    }

    try {
      if (esEdicion) {
        await api.put(`/practicas/${practica!.id}`, datos)
      } else {
        await api.post('/practicas', datos)
      }
      onGuardado()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar'
      setError(msg)
    }
    setLoading(false)
  }

  async function desactivar() {
    if (!practica) return
    try {
      await api.delete(`/practicas/${practica.id}`)
      onGuardado()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al desactivar'
      setError(msg)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            {esEdicion ? 'Editar práctica' : 'Nueva práctica'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        {esEdicion && (
          <p className="text-xs text-gray-400 mb-4">Código: <span className="font-mono font-medium text-gray-600">{practica!.codigo}</span></p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              value={form.nombre}
              onChange={e => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej: Consulta, Extracción simple..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Especialidad</label>
            <select
              value={form.especialidad_id}
              onChange={e => setForm({ ...form, especialidad_id: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Sin especialidad --</option>
              {especialidades.map(e => (
                <option key={e.id} value={e.id}>{e.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.valor}
              onChange={e => setForm({ ...form, valor: e.target.value })}
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Costo mecánico ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.costo_mecanico}
              onChange={e => setForm({ ...form, costo_mecanico: e.target.value })}
              placeholder="Solo si aplica"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Multa ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.multa}
                onChange={e => setForm({ ...form, multa: e.target.value })}
                placeholder="0.00"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de multa</label>
              <select
                value={form.tipo_multa}
                onChange={e => setForm({ ...form, tipo_multa: e.target.value as '' | 'fijo' | 'control' })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Sin tipo --</option>
                <option value="fijo">Fijo</option>
                <option value="control">Control</option>
              </select>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.cobra_descartable}
                onChange={e => setForm({ ...form, cobra_descartable: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700">Cobra descartable</span>
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {esEdicion && (
              <button
                type="button"
                onClick={desactivar}
                className="border border-orange-300 text-orange-600 rounded-lg py-2 px-3 text-sm hover:bg-orange-50"
              >
                Desactivar
              </button>
            )}
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
              {loading ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
