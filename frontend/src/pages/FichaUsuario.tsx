import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getUser } from '../lib/auth'
import api from '../services/api'
import { ArrowLeft, Save, X, Plus, Trash2, Pencil } from 'lucide-react'

type Usuario = {
  id: string
  nombre: string
  email: string
  rol: string
  sucursal_id: string
  activo: boolean
  sucursales: { nombre: string } | null
}

type Especialidad = { id: string; nombre: string }
type Sucursal = { id: string; nombre: string }
type Horario = {
  id?: string
  profesional_id?: string
  sucursal_id: string
  dia_semana: number
  turno: string
  hora_inicio: string
  hora_fin: string
  sucursales?: { nombre: string }
}
type PorcentajeEsp = {
  id?: string
  especialidad_id: string
  porcentaje: number
}

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export default function FichaUsuario() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [confirmarDesactivar, setConfirmarDesactivar] = useState(false)
  const [confirmarEliminar, setConfirmarEliminar] = useState(false)
  const [confirmarEliminarHorario, setConfirmarEliminarHorario] = useState<string | null>(null)
  const [horarioEditar, setHorarioEditar] = useState<Horario | null>(null)
  const [rolActual, setRolActual] = useState('')
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([])
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [espAsignadas, setEspAsignadas] = useState<string[]>([])
  const [espSeleccionadas, setEspSeleccionadas] = useState<string[]>([])
  const [profesionalId, setProfesionalId] = useState<string | null>(null)
  const [horarios, setHorarios] = useState<Horario[]>([])
  const [mostrarFormHorario, setMostrarFormHorario] = useState(false)
  const [form, setForm] = useState({ nombre: '', rol: '', sucursal_id: '' })

  const [porcentajeInstalacion, setPorcentajeInstalacion] = useState('')
  const [porcentajePracticas, setPorcentajePracticas] = useState('')
  const [porcentajesEsp, setPorcentajesEsp] = useState<PorcentajeEsp[]>([])
  const [pctInstalacionGuardado, setPctInstalacionGuardado] = useState('')
  const [pctPracticasGuardado, setPctPracticasGuardado] = useState('')
  const [pctEspGuardado, setPctEspGuardado] = useState<PorcentajeEsp[]>([])

  useEffect(() => {
    const u = getUser()
    setRolActual(u?.rol || '')
    cargarDatos()
  }, [id])

  async function cargarDatos() {
    setLoading(true)
    try {
      const [u, sucs, esps] = await Promise.all([
        api.get<Usuario>(`/usuarios/${id}`),
        api.get<Sucursal[]>('/sucursales'),
        api.get<Especialidad[]>('/especialidades'),
      ])
      setUsuario(u)
      setForm({ nombre: u?.nombre || '', rol: u?.rol || '', sucursal_id: u?.sucursal_id || '' })
      setSucursales(sucs || [])
      setEspecialidades(esps || [])

      if (u?.rol === 'profesional') {
        await cargarProfesional(u.id)
      }
    } finally {
      setLoading(false)
    }
  }

  async function cargarProfesional(usuarioId: string) {
    const profs = await api.get<any[]>(`/profesionales?usuario_id=${usuarioId}`)
    let prof = profs?.[0] || null

    if (!prof) {
      const usuarioData = await api.get<{ nombre: string }>(`/usuarios/${usuarioId}`)
      const nombre_corto = usuarioData?.nombre?.split(' ')[0] || 'Prof'
      prof = await api.post<any>('/profesionales', {
        usuario_id: usuarioId,
        nombre: usuarioData?.nombre || '',
        apellido: '',
        nombre_corto,
        activo: true,
      })
    }

    if (!prof) return

    setProfesionalId(prof.id)
    cargarHorarios(prof.id)

    const ids = (prof.especialidades || []).map((e: any) => e.especialidad_id)
    setEspAsignadas(ids)
    setEspSeleccionadas(ids)

    const pctInst = prof.porcentaje_instalacion?.toString() || ''
    const pctPrac = prof.porcentaje_practicas?.toString() || ''
    setPorcentajeInstalacion(pctInst)
    setPorcentajePracticas(pctPrac)
    setPctInstalacionGuardado(pctInst)
    setPctPracticasGuardado(pctPrac)

    const lista = (prof.porcentajes || []).map((p: any) => ({
      id: p.id,
      especialidad_id: p.especialidad_id,
      porcentaje: p.porcentaje,
    }))
    setPorcentajesEsp(lista)
    setPctEspGuardado(lista)
  }

  async function cargarHorarios(profId: string) {
    const data = await api.get<Horario[]>(`/horarios-profesionales?profesional_id=${profId}&activo=true`)
    setHorarios(data || [])
  }

  async function confirmarYEliminarHorario() {
    if (!confirmarEliminarHorario) return
    await api.delete(`/horarios-profesionales/${confirmarEliminarHorario}`)
    setConfirmarEliminarHorario(null)
    if (profesionalId) cargarHorarios(profesionalId)
  }

  async function guardarCambios() {
    setGuardando(true); setError('')

    try {
      await api.put(`/usuarios/${id}`, {
        nombre: form.nombre,
        rol: form.rol,
        sucursal_id: form.sucursal_id,
      })

      if (form.rol === 'profesional' && profesionalId) {
        await api.put(`/profesionales/${profesionalId}/especialidades`, {
          especialidades: espSeleccionadas,
        })
        setEspAsignadas(espSeleccionadas)

        await api.put(`/profesionales/${profesionalId}`, {
          porcentaje_instalacion: porcentajeInstalacion ? parseFloat(porcentajeInstalacion) : null,
          porcentaje_practicas: porcentajePracticas ? parseFloat(porcentajePracticas) : null,
        })
        setPctInstalacionGuardado(porcentajeInstalacion)
        setPctPracticasGuardado(porcentajePracticas)

        const validos = porcentajesEsp.filter(p => p.especialidad_id && p.porcentaje > 0)
        await api.put(`/profesionales/${profesionalId}/porcentajes`, { porcentajes: validos })
        setPctEspGuardado(validos)
        setPorcentajesEsp(validos)
      }

      if (form.rol === 'profesional' && !profesionalId && id) await cargarProfesional(id)

      setUsuario(prev => prev ? { ...prev, ...form } : null)
      setEditando(false)
    } catch (err: any) {
      setError('Error al guardar: ' + err.message)
    } finally {
      setGuardando(false)
    }
  }

  function cancelarEdicion() {
    setEditando(false)
    setEspSeleccionadas(espAsignadas)
    setPorcentajeInstalacion(pctInstalacionGuardado)
    setPorcentajePracticas(pctPracticasGuardado)
    setPorcentajesEsp(pctEspGuardado)
    if (usuario) setForm({ nombre: usuario.nombre, rol: usuario.rol, sucursal_id: usuario.sucursal_id })
  }

  function agregarPorcentajeEsp() {
    const espDisponible = especialidades.find(e => !porcentajesEsp.some(p => p.especialidad_id === e.id))
    if (espDisponible) setPorcentajesEsp(prev => [...prev, { especialidad_id: espDisponible.id, porcentaje: 0 }])
  }

  function actualizarPorcentajeEsp(idx: number, field: 'especialidad_id' | 'porcentaje', value: string | number) {
    setPorcentajesEsp(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p))
  }

  function eliminarPorcentajeEsp(idx: number) {
    setPorcentajesEsp(prev => prev.filter((_, i) => i !== idx))
  }

  async function desactivarUsuario() {
    try {
      await api.put(`/usuarios/${id}`, { activo: false })
      navigate('/usuarios')
    } catch {
      setError('Error al desactivar')
    }
    setConfirmarDesactivar(false)
  }

  async function eliminarUsuario() {
    await api.delete(`/usuarios/${id}`)
    navigate('/usuarios')
    setConfirmarEliminar(false)
  }

  function toggleEsp(espId: string) {
    setEspSeleccionadas(prev => prev.includes(espId) ? prev.filter(e => e !== espId) : [...prev, espId])
  }

  const puedeGestionar = ['admin', 'super_admin'].includes(rolActual)
  const puedeDesactivar = puedeGestionar && usuario?.rol !== 'admin' && usuario?.rol !== 'super_admin'
  const puedeEliminar = puedeGestionar && usuario?.rol !== 'admin' && usuario?.rol !== 'super_admin'

  const etiquetaRol: Record<string, string> = {
    admin: '👑 Admin', super_admin: '👑 Super Admin', jefe_clinica: '🏥 Jefe de Clínica',
    profesional: '🦷 Profesional', secretaria: '💼 Secretaria', recepcionista: '💼 Recepcionista',
    telemarketer: '📞 Telemarketer', asistente: '🤝 Asistente', supervisora: '👁️ Supervisora',
  }

  const horariosPorSucursal = sucursales
    .map(s => ({ sucursal: s, horarios: horarios.filter((h: any) => h.sucursal_id === s.id) }))
    .filter(g => g.horarios.length > 0)

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Cargando...</div>
  if (!usuario) return <div className="text-gray-400">Usuario no encontrado</div>

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto p-6">
        <button onClick={() => navigate('/usuarios')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm">
          <ArrowLeft size={16} /> Volver a usuarios
        </button>

        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">{usuario.nombre}</h1>
            <p className="text-gray-500 text-sm">{usuario.email}</p>
            {!usuario.activo && (
              <span className="inline-block mt-1 px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">
                Usuario desactivado
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {editando ? (
              <>
                <button onClick={cancelarEdicion}
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
                {puedeDesactivar && usuario.activo && (
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
                {puedeGestionar && (
                  <button onClick={() => setEditando(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
                    Editar
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-800 mb-4">Datos del usuario</h2>
              <div className="space-y-3">
                <Campo label="Nombre" value={form.nombre} editando={editando}
                  onChange={v => setForm({ ...form, nombre: v })} />
                <Campo label="Email" value={usuario.email} editando={false} onChange={() => {}} />
                <div>
                  <p className="text-xs text-gray-400 mb-1">Rol</p>
                  {editando ? (
                    <select value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="secretaria">Secretaria</option>
                      <option value="recepcionista">Recepcionista</option>
                      <option value="telemarketer">Telemarketer</option>
                      <option value="asistente">Asistente</option>
                      <option value="supervisora">Supervisora</option>
                      <option value="jefe_clinica">Jefe de Clínica</option>
                      <option value="profesional">Profesional</option>
                    </select>
                  ) : (
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                      {etiquetaRol[usuario.rol] || usuario.rol}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Sucursal principal</p>
                  {editando ? (
                    <select value={form.sucursal_id} onChange={e => setForm({ ...form, sucursal_id: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                    </select>
                  ) : (
                    <p className="text-sm text-gray-800">{usuario.sucursales?.nombre || '-'}</p>
                  )}
                </div>
              </div>
            </div>

            {usuario.rol === 'profesional' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h2 className="font-semibold text-gray-800 mb-4">Especialidades</h2>
                {editando ? (
                  <div className="space-y-2">
                    {especialidades.map(esp => (
                      <label key={esp.id} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={espSeleccionadas.includes(esp.id)}
                          onChange={() => toggleEsp(esp.id)}
                          className="rounded border-gray-300 text-blue-600" />
                        <span className="text-sm text-gray-700">{esp.nombre}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {espAsignadas.length === 0 ? (
                      <p className="text-gray-400 text-sm">Sin especialidades asignadas</p>
                    ) : (
                      especialidades.filter(e => espAsignadas.includes(e.id)).map(e => (
                        <span key={e.id} className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                          {e.nombre}
                        </span>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {usuario.rol === 'profesional' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-800 mb-4">Porcentajes de ganancia</h2>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Porcentaje Instalación (%)</p>
                  {editando ? (
                    <input type="number" min="0" max="100" step="0.1"
                      value={porcentajeInstalacion}
                      onChange={e => setPorcentajeInstalacion(e.target.value)}
                      placeholder="Ej: 20"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  ) : (
                    <p className="text-sm text-gray-800 font-medium">
                      {pctInstalacionGuardado ? `${pctInstalacionGuardado}%` : '-'}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Porcentaje Prácticas (%)</p>
                  {editando ? (
                    <input type="number" min="0" max="100" step="0.1"
                      value={porcentajePracticas}
                      onChange={e => setPorcentajePracticas(e.target.value)}
                      placeholder="Ej: 15"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  ) : (
                    <p className="text-sm text-gray-800 font-medium">
                      {pctPracticasGuardado ? `${pctPracticasGuardado}%` : '-'}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-500 font-medium">Porcentajes por especialidad</p>
                  {editando && (
                    <button type="button" onClick={agregarPorcentajeEsp}
                      disabled={porcentajesEsp.length >= especialidades.length}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 disabled:opacity-40">
                      <Plus size={12} /> Agregar especialidad
                    </button>
                  )}
                </div>

                {!editando && pctEspGuardado.length === 0 && (
                  <p className="text-sm text-gray-400">Sin porcentajes por especialidad</p>
                )}

                {!editando && pctEspGuardado.length > 0 && (
                  <div className="space-y-1">
                    {pctEspGuardado.map((pe, idx) => {
                      const esp = especialidades.find(e => e.id === pe.especialidad_id)
                      return (
                        <div key={idx} className="flex items-center justify-between py-1.5 px-3 bg-gray-50 rounded-lg text-sm">
                          <span className="text-gray-700">{esp?.nombre || '-'}</span>
                          <span className="font-semibold text-blue-700">{pe.porcentaje}%</span>
                        </div>
                      )
                    })}
                  </div>
                )}

                {editando && (
                  <div className="space-y-2">
                    {porcentajesEsp.map((pe, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <select value={pe.especialidad_id}
                          onChange={e => actualizarPorcentajeEsp(idx, 'especialidad_id', e.target.value)}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                          {especialidades.map(e => (
                            <option key={e.id} value={e.id}
                              disabled={porcentajesEsp.some((p, i) => i !== idx && p.especialidad_id === e.id)}>
                              {e.nombre}
                            </option>
                          ))}
                        </select>
                        <div className="relative w-28">
                          <input type="number" min="0" max="100" step="0.1"
                            value={pe.porcentaje}
                            onChange={e => actualizarPorcentajeEsp(idx, 'porcentaje', parseFloat(e.target.value) || 0)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-7" />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                        </div>
                        <button type="button" onClick={() => eliminarPorcentajeEsp(idx)}
                          className="text-red-400 hover:text-red-600 p-1">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    {porcentajesEsp.length === 0 && (
                      <p className="text-xs text-gray-400">Sin porcentajes por especialidad. Hacé click en "Agregar especialidad" para añadir.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {usuario.rol === 'profesional' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-gray-800">Horarios de atención</h2>
                {puedeGestionar && profesionalId && (
                  <button onClick={() => setMostrarFormHorario(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700">
                    <Plus size={14} /> Agregar horario
                  </button>
                )}
                {puedeGestionar && !profesionalId && (
                  <button onClick={() => id && cargarProfesional(id)}
                    className="flex items-center gap-2 border border-blue-300 text-blue-600 px-3 py-1.5 rounded-lg text-sm hover:bg-blue-50">
                    Reintentar carga
                  </button>
                )}
              </div>

              {horarios.length === 0 ? (
                <p className="text-gray-400 text-sm">Sin horarios cargados</p>
              ) : (
                <div className="space-y-4">
                  {horariosPorSucursal.map(({ sucursal, horarios: hs }) => (
                    <div key={sucursal.id}>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{sucursal.nombre}</p>
                      <div className="space-y-1">
                        {hs.map((h: any) => (
                          <div key={h.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-gray-700 w-20">{DIAS[h.dia_semana]}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs ${
                                h.turno === 'mañana' ? 'bg-yellow-100 text-yellow-700' :
                                h.turno === 'tarde' ? 'bg-blue-100 text-blue-700' :
                                'bg-purple-100 text-purple-700'
                              }`}>{h.turno}</span>
                              <span className="text-gray-600">{h.hora_inicio} - {h.hora_fin}</span>
                            </div>
                            {puedeGestionar && (
                              <div className="flex items-center gap-1">
                                <button onClick={() => setHorarioEditar(h)} className="text-gray-400 hover:text-blue-600 p-1">
                                  <Pencil size={14} />
                                </button>
                                <button onClick={() => setConfirmarEliminarHorario(h.id)} className="text-red-400 hover:text-red-600 p-1">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {mostrarFormHorario && profesionalId && (
          <FormularioHorario profesionalId={profesionalId} horariosExistentes={horarios} sucursales={sucursales}
            onClose={() => setMostrarFormHorario(false)}
            onGuardado={() => { setMostrarFormHorario(false); cargarHorarios(profesionalId) }} />
        )}

        {horarioEditar && profesionalId && (
          <FormularioHorario profesionalId={profesionalId} horariosExistentes={horarios} sucursales={sucursales}
            horarioEditar={horarioEditar}
            onClose={() => setHorarioEditar(null)}
            onGuardado={() => { setHorarioEditar(null); cargarHorarios(profesionalId) }} />
        )}

        {confirmarEliminarHorario && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">¿Eliminar horario?</h2>
              <p className="text-gray-500 text-sm mb-6">Esta acción no se puede deshacer.</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmarEliminarHorario(null)}
                  className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm hover:bg-gray-50">Cancelar</button>
                <button onClick={confirmarYEliminarHorario}
                  className="flex-1 bg-red-500 text-white rounded-lg py-2 text-sm hover:bg-red-600">Sí, eliminar</button>
              </div>
            </div>
          </div>
        )}

        {confirmarDesactivar && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">¿Desactivar usuario?</h2>
              <p className="text-gray-500 text-sm mb-6">¿Estás seguro de que querés desactivar a <strong>{usuario.nombre}</strong>?</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmarDesactivar(false)}
                  className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm hover:bg-gray-50">Cancelar</button>
                <button onClick={desactivarUsuario}
                  className="flex-1 bg-orange-500 text-white rounded-lg py-2 text-sm hover:bg-orange-600">Sí, desactivar</button>
              </div>
            </div>
          </div>
        )}

        {confirmarEliminar && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">¿Eliminar usuario?</h2>
              <p className="text-gray-500 text-sm mb-6">¿Estás seguro de que querés eliminar permanentemente a <strong>{usuario.nombre}</strong>?</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmarEliminar(false)}
                  className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm hover:bg-gray-50">Cancelar</button>
                <button onClick={eliminarUsuario}
                  className="flex-1 bg-red-500 text-white rounded-lg py-2 text-sm hover:bg-red-600">Sí, eliminar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Formulario horario ────────────────────────────────────────────────────────
function FormularioHorario({ profesionalId, horariosExistentes, sucursales, horarioEditar, onClose, onGuardado }: {
  profesionalId: string; horariosExistentes: Horario[]
  sucursales: { id: string; nombre: string }[]
  horarioEditar?: Horario | null; onClose: () => void; onGuardado: () => void
}) {
  const [form, setForm] = useState({
    sucursal_id: horarioEditar?.sucursal_id || sucursales[0]?.id || '',
    dia_semana: horarioEditar?.dia_semana ?? 1,
    turno: horarioEditar?.turno || 'mañana',
    hora_inicio: horarioEditar?.hora_inicio || '08:00',
    hora_fin: horarioEditar?.hora_fin || '14:00'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function actualizarHoras(turno: string) {
    if (turno === 'mañana') setForm(f => ({ ...f, turno, hora_inicio: '08:00', hora_fin: '14:00' }))
    else if (turno === 'tarde') setForm(f => ({ ...f, turno, hora_inicio: '14:00', hora_fin: '20:00' }))
    else setForm(f => ({ ...f, turno, hora_inicio: '08:00', hora_fin: '20:00' }))
  }

  function verificarConflictoSucursal(): string | null {
    const otros = horariosExistentes.filter(h =>
      h.sucursal_id !== form.sucursal_id && h.dia_semana === form.dia_semana &&
      (!horarioEditar || h.id !== horarioEditar.id)
    )
    for (const h of otros) {
      if (form.hora_inicio < h.hora_fin && form.hora_fin > h.hora_inicio) {
        const suc = (h as any).sucursales?.nombre || 'otra sucursal'
        return `El profesional ya tiene horario ese día en ${suc}. No puede estar en dos sucursales al mismo tiempo.`
      }
    }
    return null
  }

  async function unificarSiCorresponde(): Promise<boolean> {
    const mismos = horariosExistentes.filter(h =>
      h.sucursal_id === form.sucursal_id && h.dia_semana === form.dia_semana &&
      (!horarioEditar || h.id !== horarioEditar.id)
    )
    const tieneMañana = mismos.find(h => h.turno === 'mañana')
    const tieneTarde = mismos.find(h => h.turno === 'tarde')

    if (form.turno === 'tarde' && tieneMañana) {
      await api.delete(`/horarios-profesionales/${tieneMañana.id}`)
      await api.post('/horarios-profesionales', { profesional_id: profesionalId, sucursal_id: form.sucursal_id, dia_semana: form.dia_semana, turno: 'completo', hora_inicio: '08:00', hora_fin: '20:00' })
      return true
    }
    if (form.turno === 'mañana' && tieneTarde) {
      await api.delete(`/horarios-profesionales/${tieneTarde.id}`)
      await api.post('/horarios-profesionales', { profesional_id: profesionalId, sucursal_id: form.sucursal_id, dia_semana: form.dia_semana, turno: 'completo', hora_inicio: '08:00', hora_fin: '20:00' })
      return true
    }
    return false
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('')
    const conflicto = verificarConflictoSucursal()
    if (conflicto) { setError(conflicto); setLoading(false); return }
    try {
      if (!horarioEditar) {
        const unificado = await unificarSiCorresponde()
        if (unificado) { onGuardado(); return }
      }
      if (horarioEditar?.id) {
        await api.put(`/horarios-profesionales/${horarioEditar.id}`, {
          sucursal_id: form.sucursal_id, dia_semana: form.dia_semana,
          turno: form.turno, hora_inicio: form.hora_inicio, hora_fin: form.hora_fin
        })
      } else {
        await api.post('/horarios-profesionales', { ...form, profesional_id: profesionalId })
      }
      onGuardado()
    } catch (err: any) {
      setError(err.message || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">{horarioEditar ? 'Editar horario' : 'Agregar horario'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal</label>
            <select value={form.sucursal_id} onChange={e => setForm({ ...form, sucursal_id: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Día</label>
            <select value={form.dia_semana} onChange={e => setForm({ ...form, dia_semana: Number(e.target.value) })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {[1,2,3,4,5,6].map(d => <option key={d} value={d}>{DIAS[d]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Turno</label>
            <select value={form.turno} onChange={e => actualizarHoras(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="mañana">Mañana (8:00 - 14:00)</option>
              <option value="tarde">Tarde (14:00 - 20:00)</option>
              <option value="completo">Completo (8:00 - 20:00)</option>
            </select>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
              <input type="time" value={form.hora_inicio} onChange={e => setForm({ ...form, hora_inicio: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
              <input type="time" value={form.hora_fin} onChange={e => setForm({ ...form, hora_fin: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3"><p className="text-red-600 text-sm">{error}</p></div>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Campo({ label, value, editando, onChange }: {
  label: string; value: string; editando: boolean; onChange: (v: string) => void
}) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      {editando ? (
        <input value={value} onChange={e => onChange(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      ) : (
        <p className="text-sm text-gray-800">{value || '-'}</p>
      )}
    </div>
  )
}
