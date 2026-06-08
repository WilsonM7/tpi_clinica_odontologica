import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'

type OrdenItem = {
  id: string
  fecha: string
  hora_turno: string | null
  practica_nombre: string
  valor_practica: number
  multa: number
  porcentaje_ganancia: number
  ganancia_neta: number
  pacientes: { apellido_nombre: string }
  profesionales: { id: string; usuarios: { nombre: string } }
}

export default function OrdenLlegada() {
  const [fecha, setFecha] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [sucursales, setSucursales] = useState<any[]>([])
  const [sucursalId, setSucursalId] = useState('')
  const [items, setItems] = useState<OrdenItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { cargarSucursales() }, [])
  useEffect(() => { if (sucursalId) cargarOrden() }, [fecha, sucursalId])

  async function cargarSucursales() {
    const { data } = await supabase.from('sucursales').select('*').eq('activa', true)
    setSucursales(data || [])
    if (data && data.length > 0) setSucursalId(data[0].id)
  }

  async function cargarOrden() {
    setLoading(true)
    const { data } = await supabase
      .from('orden_llegada')
      .select('*, pacientes(apellido_nombre), profesionales(id, usuarios(nombre))')
      .eq('fecha', fecha)
      .eq('sucursal_id', sucursalId)
      .order('profesional_id')
      .order('hora_turno', { nullsFirst: false })
    setItems(data || [])
    setLoading(false)
  }

  // Agrupar por profesional
  const porProfesional: Record<string, { nombre: string; items: OrdenItem[] }> = {}
  for (const item of items) {
    const key = item.profesionales?.id || 'sin_prof'
    if (!porProfesional[key]) {
      porProfesional[key] = { nombre: item.profesionales?.usuarios?.nombre || '-', items: [] }
    }
    porProfesional[key].items.push(item)
  }

  function formatPeso(v: number) {
    return `$${(v || 0).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  function formatHora(h: string | null) {
    if (!h) return '-'
    return h.substring(0, 5)
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-semibold text-gray-800">Orden de llegada</h1>

        {/* Filtros */}
        <div className="flex gap-3 items-center flex-wrap">
          <input type="date" value={fecha}
            onChange={e => setFecha(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <div className="flex gap-2">
            {sucursales.map(s => (
              <button key={s.id}
                onClick={() => setSucursalId(s.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  sucursalId === s.id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}>
                {s.nombre}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-gray-400 text-sm">Cargando...</p>
        ) : Object.keys(porProfesional).length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
            <p className="text-gray-400 text-sm">No hay registros para esta fecha y sucursal</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(porProfesional).map(([profId, { nombre, items: profItems }]) => {
              const totalValor    = profItems.reduce((s, i) => s + (i.valor_practica || 0), 0)
              const totalMulta    = profItems.reduce((s, i) => s + (i.multa || 0), 0)
              const totalGanancia = profItems.reduce((s, i) => s + (i.ganancia_neta || 0), 0)

              return (
                <div key={profId} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                  {/* Header profesional */}
                  <div className="bg-blue-600 px-5 py-3 flex items-center justify-between">
                    <h2 className="font-semibold text-white text-lg">{nombre}</h2>
                    <div className="flex items-center gap-4 text-blue-100 text-sm">
                      <span>{profItems.length} paciente{profItems.length !== 1 ? 's' : ''}</span>
                      <span>Ganancia: <strong className="text-white">{formatPeso(totalGanancia)}</strong></span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-4 py-2.5 font-medium text-gray-600 w-8">#</th>
                          <th className="text-left px-4 py-2.5 font-medium text-gray-600">Hora</th>
                          <th className="text-left px-4 py-2.5 font-medium text-gray-600">Paciente</th>
                          <th className="text-left px-4 py-2.5 font-medium text-gray-600">Práctica</th>
                          <th className="text-right px-4 py-2.5 font-medium text-gray-600">Valor</th>
                          <th className="text-right px-4 py-2.5 font-medium text-gray-600">Multa</th>
                          <th className="text-right px-4 py-2.5 font-medium text-gray-600">%</th>
                          <th className="text-right px-4 py-2.5 font-medium text-gray-600">Ganancia neta</th>
                        </tr>
                      </thead>
                      <tbody>
                        {profItems.map((item, idx) => (
                          <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                            <td className="px-4 py-3 text-gray-600 font-medium">{formatHora(item.hora_turno)}</td>
                            <td className="px-4 py-3 font-medium text-gray-800">{item.pacientes?.apellido_nombre}</td>
                            <td className="px-4 py-3 text-gray-600">{item.practica_nombre}</td>
                            <td className="px-4 py-3 text-right text-gray-800">{formatPeso(item.valor_practica)}</td>
                            <td className={`px-4 py-3 text-right font-medium ${item.multa > 0 ? 'text-orange-600' : 'text-gray-300'}`}>
                              {item.multa > 0 ? formatPeso(item.multa) : '—'}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-500">{item.porcentaje_ganancia}%</td>
                            <td className="px-4 py-3 text-right font-bold text-green-700">{formatPeso(item.ganancia_neta)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                        <tr>
                          <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-gray-700">Total</td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-800">{formatPeso(totalValor)}</td>
                          <td className={`px-4 py-3 text-right font-semibold ${totalMulta > 0 ? 'text-orange-600' : 'text-gray-300'}`}>
                            {totalMulta > 0 ? formatPeso(totalMulta) : '—'}
                          </td>
                          <td />
                          <td className="px-4 py-3 text-right font-bold text-green-700 text-base">{formatPeso(totalGanancia)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
