import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Save, X } from 'lucide-react'

type Paciente = {
  id: string
  apellido_nombre: string
  dni: string
  telefono: string
  email: string
  como_conocio: string
  fecha_nacimiento: string
  fecha_ingreso: string
  activo: boolean
}

type Cobro = {
  id: string
  fecha: string
  subtotal: number
  multa: number
  deuda_anterior: number
  total: number
  medio_pago: string
  monto_pagado: number
  diferencia: number
}

type Tratamiento = {
  id: string
  estado: string
  tipo_material: string
  tipo_tto: string
  fecha_inicio: string
  cuota_base: number
  especialidades: { nombre: string }
  profesionales: { nombre_corto: string }
}

function formatFecha(fecha: string) {
  if (!fecha) return '-'
  const [anio, mes, dia] = fecha.split('-')
  return `${dia}/${mes}/${anio}`
}

export default function FichaPaciente() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [paciente, setPaciente] = useState<Paciente | null>(null)
  const [cobros, setCobros] = useState<Cobro[]>([])
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState<Partial<Paciente>>({})
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [confirmarEliminar, setConfirmarEliminar] = useState(false)
  const [confirmarDesactivar, setConfirmarDesactivar] = useState(false)
  const [rolUsuario, setRolUsuario] = useState('')

  useEffect(() => {
    cargarDatos()
    cargarRol()
  }, [id])

  async function cargarRol() {
    const { data } = await supabase.auth.getUser()
    if (data.user) {
      const { data: u } = await supabase
        .from('usuarios').select('rol').eq('id', data.user.id).single()
      setRolUsuario(u?.rol || '')
    }
  }

  async function cargarDatos() {
    setLoading(true)
    const [{ data: pac }, { data: cob }, { data: tra }] = await Promise.all([
      supabase.from('pacientes').select('*').eq('id', id).single(),
      supabase.from('cobros').select('*').eq('paciente_id', id).order('fecha', { ascending: false }),
      supabase.from('tratamientos').select('*, especialidades(nombre), profesionales(nombre_corto)').eq('paciente_id', id)
    ])
    setPaciente(pac)
    setForm(pac || {})
    setCobros(cob || [])
    setTratamientos(tra || [])
    setLoading(false)
  }

  async function guardarCambios() {
    setGuardando(true)
    setError('')
    const { error } = await supabase.from('pacientes').update(form).eq('id', id)
    if (error) {
      setError('Error al guardar')
    } else {
      setPaciente(form as Paciente)
      setEditando(false)
    }
    setGuardando(false)
  }

  async function desactivarPaciente() {
    const { error } = await supabase.from('pacientes').update({ activo: false }).eq('id', id)
    if (!error) navigate('/pacientes')
    else setError('Error al desactivar')
    setConfirmarDesactivar(false)
  }

  async function eliminarPaciente() {
    const { error } = await supabase.from('pacientes').delete().eq('id', id)
    if (!error) navigate('/pacientes')
    else setError('Error al eliminar permanentemente')
    setConfirmarEliminar(false)
  }

  const deudaTotal = cobros.reduce((acc, c) => acc + (c.diferencia || 0), 0)
  const puedeDesactivar = rolUsuario === 'super_admin' || rolUsuario === 'jefe_clinica'
  const puedeEliminar = rolUsuario === 'super_admin'

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Cargando...</div>
  if (!paciente) return <div className="text-gray-400">Paciente no encontrado</div>

  return (
    <div>
      <button
        onClick={() => navigate('/pacientes')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm"
      >
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
              <button
                onClick={() => { setEditando(false); setForm(paciente) }}
                className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                <X size={16} /> Cancelar
              </button>
              <button
                onClick={guardarCambios}
                disabled={guardando}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                <Save size={16} /> {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </>
          ) : (
            <>
              {puedeDesactivar && paciente.activo && (
                <button
                  onClick={() => setConfirmarDesactivar(true)}
                  className="border border-orange-300 text-orange-600 px-4 py-2 rounded-lg text-sm hover:bg-orange-50"
                >
                  Desactivar
                </button>
              )}
              {puedeEliminar && (
                <button
                  onClick={() => setConfirmarEliminar(true)}
                  className="border border-red-300 text-red-500 px-4 py-2 rounded-lg text-sm hover:bg-red-50"
                >
                  Eliminar
                </button>
              )}
              <button
                onClick={() => setEditando(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
              >
                Editar
              </button>
            </>
          )}
        </div>
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
            <Campo label="Fecha de nacimiento" value={form.fecha_nacimiento || ''} editando={editando}
              onChange={v => setForm({ ...form, fecha_nacimiento: v })} type="date" />
            <Campo label="Fecha de ingreso" value={form.fecha_ingreso || ''} editando={editando}
              onChange={v => setForm({ ...form, fecha_ingreso: v })} type="date" />

            {/* ¿Cómo nos conoció? — select cuando edita */}
            <div>
              <p className="text-xs text-gray-400 mb-1">¿Cómo nos conoció?</p>
              {editando ? (
                <select
                  value={form.como_conocio || ''}
                  onChange={e => setForm({ ...form, como_conocio: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
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
          <div className={`rounded-xl shadow-sm border p-5 ${
            deudaTotal > 0 ? 'bg-red-50 border-red-200' :
            deudaTotal < 0 ? 'bg-green-50 border-green-200' :
            'bg-white border-gray-200'
          }`}>
            <h2 className="font-semibold text-gray-800 mb-1">Saldo actual</h2>
            <p className={`text-2xl font-bold ${
              deudaTotal > 0 ? 'text-red-600' :
              deudaTotal < 0 ? 'text-green-600' :
              'text-gray-600'
            }`}>
              {deudaTotal > 0 ? `Debe $${deudaTotal.toLocaleString()}`
                : deudaTotal < 0 ? `A favor $${Math.abs(deudaTotal).toLocaleString()}`
                : 'Sin deuda'}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Tratamientos</h2>
            {tratamientos.length === 0 ? (
              <p className="text-gray-400 text-sm">Sin tratamientos registrados</p>
            ) : (
              <div className="space-y-2">
                {tratamientos.map(t => (
                  <div key={t.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg text-sm">
                    <div>
                      <p className="font-medium text-gray-800">{t.especialidades?.nombre}</p>
                      <p className="text-gray-500">
                        {t.profesionales?.nombre_corto} · {t.tipo_material} · desde {formatFecha(t.fecha_inicio)}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      t.estado === 'activo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {t.estado}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Historial de cobros</h2>
            </div>
            {cobros.length === 0 ? (
              <p className="text-gray-400 text-sm p-5">Sin cobros registrados</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2 text-gray-600 font-medium">Fecha</th>
                    <th className="text-left px-4 py-2 text-gray-600 font-medium">Total</th>
                    <th className="text-left px-4 py-2 text-gray-600 font-medium">Pagó</th>
                    <th className="text-left px-4 py-2 text-gray-600 font-medium">Medio</th>
                    <th className="text-left px-4 py-2 text-gray-600 font-medium">Dif</th>
                  </tr>
                </thead>
                <tbody>
                  {cobros.map(c => (
                    <tr key={c.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-600">{formatFecha(c.fecha)}</td>
                      <td className="px-4 py-2 text-gray-800">${c.total?.toLocaleString()}</td>
                      <td className="px-4 py-2 text-gray-800">${c.monto_pagado?.toLocaleString()}</td>
                      <td className="px-4 py-2 text-gray-500">{c.medio_pago}</td>
                      <td className={`px-4 py-2 font-medium ${
                        c.diferencia > 0 ? 'text-green-600' :
                        c.diferencia < 0 ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {c.diferencia === 0 ? '-' : `$${c.diferencia?.toLocaleString()}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Modal confirmar desactivar */}
      {confirmarDesactivar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">¿Desactivar paciente?</h2>
            <p className="text-gray-500 text-sm mb-6">
              ¿Estás seguro de que querés desactivar a <strong>{paciente.apellido_nombre}</strong>? El paciente no aparecerá en la lista pero se podrá restaurar.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmarDesactivar(false)}
                className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={desactivarPaciente}
                className="flex-1 bg-orange-500 text-white rounded-lg py-2 text-sm hover:bg-orange-600"
              >
                Sí, desactivar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminar */}
      {confirmarEliminar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">¿Eliminar paciente?</h2>
            <p className="text-gray-500 text-sm mb-6">
              ¿Estás seguro de que querés eliminar permanentemente a <strong>{paciente.apellido_nombre}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmarEliminar(false)}
                className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={eliminarPaciente}
                className="flex-1 bg-red-500 text-white rounded-lg py-2 text-sm hover:bg-red-600"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Campo({ label, value, editando, onChange, type = 'text' }: {
  label: string
  value: string
  editando: boolean
  onChange: (v: string) => void
  type?: string
}) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      {editando ? (
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      ) : (
        <p className="text-sm text-gray-800">
          {type === 'date' ? formatFecha(value) : (value || '-')}
        </p>
      )}
    </div>
  )
}