import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import api from '../services/api'
import { ArrowLeft, Save, X, Pencil } from 'lucide-react'

type Paciente = {
  id: string
  apellido_nombre: string
  dni: string
  telefono: string
  email: string
  como_conocio: string
  fecha_nacimiento: string
  fecha_ingreso: string
  direccion: string
  ciudad: string
  activo: boolean
}

type Cobro = {
  id: string
  fecha: string
  monto: number
  medio_pago: string
  descripcion: string
  tratamiento?: {
    practica?: { nombre: string }
  }
}

type Tratamiento = {
  id: string
  estado: string
  fecha: string
  monto: number | null
  profesional_id: string | null
  practica?: { nombre: string }
  profesional?: { id: string; nombre: string; apellido: string }
}

type Profesional = { id: string; nombre: string; apellido: string }

const ESTADOS_TRATAMIENTO = [
  'en tratamiento',
  'en abandono',
  'en finalizacion',
  'en finalizacion por abandono',
]

function formatFecha(fecha: string) {
  if (!fecha) return '-'
  const [anio, mes, dia] = fecha.split('-')
  return `${dia}/${mes}/${anio}`
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

function mapPacienteAPI(raw: any): Paciente {
  return {
    ...raw,
    apellido_nombre: raw.apellido_nombre
      || (raw.apellido && raw.nombre ? `${raw.apellido}, ${raw.nombre}` : raw.apellido || raw.nombre || ''),
  }
}

export default function FichaPaciente() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [paciente, setPaciente] = useState<Paciente | null>(null)
  const [cobros, setCobros] = useState<Cobro[]>([])
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([])
  const [profesionales, setProfesionales] = useState<Profesional[]>([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState<Partial<Paciente>>({})
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [confirmarEliminar, setConfirmarEliminar] = useState(false)
  const [confirmarDesactivar, setConfirmarDesactivar] = useState(false)
  const [rolUsuario, setRolUsuario] = useState('')

  const [editandoTratamiento, setEditandoTratamiento] = useState<string | null>(null)
  const [formTratamiento, setFormTratamiento] = useState<{ estado: string; profesional_id: string }>({ estado: '', profesional_id: '' })
  const [guardandoTratamiento, setGuardandoTratamiento] = useState(false)

  useEffect(() => {
    cargarDatos()
    cargarRol()
    cargarProfesionales()
  }, [id])

  async function cargarRol() {
    const { data } = await supabase.auth.getUser()
    if (data.user) {
      const { data: u } = await supabase.from('usuarios').select('rol').eq('id', data.user.id).single()
      setRolUsuario(u?.rol || '')
    }
  }

  async function cargarProfesionales() {
    try {
      const data = await api.get<Profesional[]>('/profesionales?activo=true')
      setProfesionales(data)
    } catch {
      setProfesionales([])
    }
  }

  async function cargarDatos() {
    setLoading(true)
    try {
      const [pacRaw, cob, tra] = await Promise.all([
        api.get<any>(`/pacientes/${id}`),
        api.get<Cobro[]>(`/cobros?paciente_id=${id}`),
        api.get<Tratamiento[]>(`/tratamientos?paciente_id=${id}`),
      ])
      const pac = mapPacienteAPI(pacRaw)
      setPaciente(pac)
      setForm(pac)
      setCobros(cob)
      setTratamientos(tra)
    } catch {
      setPaciente(null)
    }
    setLoading(false)
  }

  async function guardarCambios() {
    setGuardando(true)
    setError('')
    try {
      const { apellido, nombre } = splitApellidoNombre(form.apellido_nombre || '')
      await api.put(`/pacientes/${id}`, {
        nombre,
        apellido,
        telefono: form.telefono,
        email: form.email,
        como_conocio: form.como_conocio,
        fecha_nacimiento: form.fecha_nacimiento,
        fecha_ingreso: form.fecha_ingreso,
        direccion: form.direccion,
        ciudad: form.ciudad,
      })
      setPaciente(form as Paciente)
      setEditando(false)
    } catch {
      setError('Error al guardar')
    }
    setGuardando(false)
  }

  function abrirEditarTratamiento(t: Tratamiento) {
    setEditandoTratamiento(t.id)
    setFormTratamiento({ estado: t.estado, profesional_id: t.profesional_id || '' })
  }

  async function guardarTratamiento(tId: string) {
    setGuardandoTratamiento(true)
    try {
      await api.put(`/tratamientos/${tId}`, {
        estado: formTratamiento.estado,
        profesional_id: formTratamiento.profesional_id || null,
      })
      await cargarDatos()
      setEditandoTratamiento(null)
    } catch { /* ignorar */ }
    setGuardandoTratamiento(false)
  }

  async function desactivarPaciente() {
    try {
      await api.put(`/pacientes/${id}`, { activo: false })
      navigate('/pacientes')
    } catch {
      setError('Error al desactivar')
    }
    setConfirmarDesactivar(false)
  }

  async function eliminarPaciente() {
    try {
      await api.delete(`/pacientes/${id}`)
      navigate('/pacientes')
    } catch {
      setError('Error al eliminar')
    }
    setConfirmarEliminar(false)
  }

  const totalCobrado = cobros.reduce((acc, c) => acc + (c.monto || 0), 0)
  const puedeDesactivar = rolUsuario === 'super_admin' || rolUsuario === 'jefe_clinica'
  const puedeEliminar = rolUsuario === 'super_admin'

  function claseEstado(estado: string) {
    switch (estado) {
      case 'en tratamiento': return 'bg-green-100 text-green-700'
      case 'en abandono': return 'bg-red-100 text-red-600'
      case 'en finalizacion': return 'bg-blue-100 text-blue-700'
      case 'en finalizacion por abandono': return 'bg-orange-100 text-orange-600'
      default: return 'bg-gray-100 text-gray-500'
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Cargando...</div>
  if (!paciente) return <div className="text-gray-400">Paciente no encontrado</div>

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6">
        <button onClick={() => navigate('/pacientes')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm">
          <ArrowLeft size={16} /> Volver a pacientes
        </button>

        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">{paciente.apellido_nombre}</h1>
            <p className="text-gray-500 text-sm">{paciente.dni}</p>
            {!paciente.activo && (
              <span className="inline-block mt-1 px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">
                Paciente desactivado
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {editando ? (
              <>
                <button onClick={() => { setEditando(false); setForm(paciente) }}
                  className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
                  <X size={16} /> Cancelar
                </button>
                <button onClick={guardarCambios} disabled={guardando}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                  <Save size={16} /> {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              </>
            ) : (
              <>
                {puedeDesactivar && paciente.activo && (
                  <button onClick={() => setConfirmarDesactivar(true)}
                    className="border border-orange-300 text-orange-600 px-4 py-2 rounded-lg text-sm hover:bg-orange-50">
                    Desactivar
                  </button>
                )}
                {puedeEliminar && (
                  <button onClick={() => setConfirmarEliminar(true)}
                    className="border border-red-300 text-red-500 px-4 py-2 rounded-lg text-sm hover:bg-red-50">
                    Eliminar
                  </button>
                )}
                <button onClick={() => setEditando(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
                  Editar
                </button>
              </>
            )}
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Datos personales */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Datos personales</h2>
            <div className="space-y-3">
              <Campo label="Apellido y nombre" value={form.apellido_nombre || ''} editando={editando}
                onChange={v => setForm({ ...form, apellido_nombre: v })} />
              <Campo label="Documento" value={form.dni || ''} editando={false} onChange={() => {}} />
              <Campo label="Teléfono" value={form.telefono || ''} editando={editando}
                onChange={v => setForm({ ...form, telefono: v })} />
              <Campo label="Email" value={form.email || ''} editando={editando}
                onChange={v => setForm({ ...form, email: v })} />
              <Campo label="Dirección" value={form.direccion || ''} editando={editando}
                onChange={v => setForm({ ...form, direccion: v })} />
              <Campo label="Ciudad" value={form.ciudad || ''} editando={editando}
                onChange={v => setForm({ ...form, ciudad: v })} />
              <Campo label="Fecha de nacimiento" value={form.fecha_nacimiento || ''} editando={editando}
                onChange={v => setForm({ ...form, fecha_nacimiento: v })} type="date" />
              <Campo label="Fecha de ingreso" value={form.fecha_ingreso || ''} editando={editando}
                onChange={v => setForm({ ...form, fecha_ingreso: v })} type="date" />
              <div>
                <p className="text-xs text-gray-400 mb-1">¿Cómo nos conoció?</p>
                {editando ? (
                  <select value={form.como_conocio || ''}
                    onChange={e => setForm({ ...form, como_conocio: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">-- Seleccioná --</option>
                    <option>Redes sociales</option>
                    <option>Recomendación</option>
                    <option>Google</option>
                    <option>Pasando por el consultorio</option>
                    <option>Otro</option>
                  </select>
                ) : (
                  <p className="text-sm text-gray-800">{form.como_conocio || '-'}</p>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {/* Total cobrado */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-800 mb-1">Total cobrado</h2>
              <p className="text-2xl font-bold text-gray-700">
                {totalCobrado > 0 ? `$${totalCobrado.toLocaleString()}` : 'Sin cobros registrados'}
              </p>
            </div>

            {/* Tratamientos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-800 mb-4">Tratamientos</h2>
              {tratamientos.length === 0 ? (
                <p className="text-gray-400 text-sm">Sin tratamientos registrados</p>
              ) : (
                <div className="space-y-3">
                  {tratamientos.map(t => (
                    <div key={t.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="flex justify-between items-center p-3 bg-gray-50">
                        <div>
                          <p className="font-medium text-gray-800 text-sm">
                            {t.practica?.nombre || 'Tratamiento'}
                          </p>
                          <p className="text-gray-500 text-xs mt-0.5">
                            desde {formatFecha(t.fecha)}{t.monto ? ` · $${Number(t.monto).toLocaleString()}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${claseEstado(t.estado)}`}>
                            {t.estado}
                          </span>
                          {editandoTratamiento !== t.id && (
                            <button onClick={() => abrirEditarTratamiento(t)}
                              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                              title="Editar tratamiento">
                              <Pencil size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="px-3 py-2 text-xs text-gray-600 border-t border-gray-100">
                        <span className="text-gray-400">Profesional: </span>
                        {t.profesional
                          ? `${t.profesional.nombre} ${t.profesional.apellido}`
                          : '-'}
                      </div>

                      {editandoTratamiento === t.id && (
                        <div className="border-t border-gray-200 p-3 bg-blue-50 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Estado</label>
                              <select value={formTratamiento.estado}
                                onChange={e => setFormTratamiento(f => ({ ...f, estado: e.target.value }))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                {ESTADOS_TRATAMIENTO.map(e => (
                                  <option key={e} value={e}>{e}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Profesional que sigue el tratamiento</label>
                              <select value={formTratamiento.profesional_id}
                                onChange={e => setFormTratamiento(f => ({ ...f, profesional_id: e.target.value }))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">-- Sin asignar --</option>
                                {profesionales.map(p => (
                                  <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => setEditandoTratamiento(null)}
                              className="border border-gray-300 text-gray-700 rounded-lg px-3 py-1.5 text-xs hover:bg-gray-50">
                              Cancelar
                            </button>
                            <button onClick={() => guardarTratamiento(t.id)} disabled={guardandoTratamiento}
                              className="bg-blue-600 text-white rounded-lg px-3 py-1.5 text-xs hover:bg-blue-700 disabled:opacity-50">
                              {guardandoTratamiento ? 'Guardando...' : 'Guardar cambios'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Historial de cobros */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800">Historial de cobros</h2>
              </div>
              {cobros.length === 0 ? (
                <p className="text-gray-400 text-sm p-5">Sin cobros registrados</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-2 text-gray-600 font-medium">Fecha</th>
                        <th className="text-left px-4 py-2 text-gray-600 font-medium">Descripción / Práctica</th>
                        <th className="text-left px-4 py-2 text-gray-600 font-medium">Monto</th>
                        <th className="text-left px-4 py-2 text-gray-600 font-medium">Medio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cobros.map(c => (
                        <tr key={c.id} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-600 whitespace-nowrap">{formatFecha(c.fecha)}</td>
                          <td className="px-4 py-2 text-gray-700">
                            {c.tratamiento?.practica?.nombre || c.descripcion || 'Cobro'}
                          </td>
                          <td className="px-4 py-2 text-gray-800 whitespace-nowrap">
                            ${(c.monto || 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-2 text-gray-500 whitespace-nowrap">{c.medio_pago || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {confirmarDesactivar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">¿Desactivar paciente?</h2>
            <p className="text-gray-500 text-sm mb-6">
              ¿Estás seguro de que querés desactivar a <strong>{paciente.apellido_nombre}</strong>?
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmarDesactivar(false)}
                className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm hover:bg-gray-50">Cancelar</button>
              <button onClick={desactivarPaciente}
                className="flex-1 bg-orange-500 text-white rounded-lg py-2 text-sm hover:bg-orange-600">Sí, desactivar</button>
            </div>
          </div>
        </div>
      )}

      {confirmarEliminar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">¿Eliminar paciente?</h2>
            <p className="text-gray-500 text-sm mb-6">
              ¿Estás seguro de que querés eliminar a <strong>{paciente.apellido_nombre}</strong>?
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmarEliminar(false)}
                className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm hover:bg-gray-50">Cancelar</button>
              <button onClick={eliminarPaciente}
                className="flex-1 bg-red-500 text-white rounded-lg py-2 text-sm hover:bg-red-600">Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Campo({ label, value, editando, onChange, type = 'text' }: {
  label: string; value: string; editando: boolean; onChange: (v: string) => void; type?: string
}) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      {editando ? (
        <input type={type} value={value} onChange={e => onChange(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      ) : (
        <p className="text-sm text-gray-800">{type === 'date' ? formatFecha(value) : (value || '-')}</p>
      )}
    </div>
  )
}
