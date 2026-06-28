import { useEffect, useState } from 'react'
import api from '../services/api'
import { format } from 'date-fns'

type OrdenItem = {
  id: string
  fecha: string
  hora_llegada: string
  numero_orden: number
  estado: string
  paciente: { id: string; nombre: string; apellido: string; dni: string } | null
  profesional: { id: string; nombre: string; apellido: string } | null
}

type Sucursal = { id: string; nombre: string }

export default function OrdenLlegada() {
  const [fecha, setFecha] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [sucursalId, setSucursalId] = useState('')
  const [items, setItems] = useState<OrdenItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { cargarSucursales() }, [])
  useEffect(() => { cargarOrden() }, [fecha])

  async function cargarSucursales() {
    try {
      const data = await api.get<Sucursal[]>('/sucursales')
      setSucursales(data)
      if (data.length > 0) setSucursalId(data[0].id)
    } catch {
      setSucursales([])
    }
  }

  async function cargarOrden() {
    setLoading(true)
    try {
      const data = await api.get<OrdenItem[]>(`/orden-llegada?fecha=${fecha}`)
      setItems(data)
    } catch {
      setItems([])
    }
    setLoading(false)
  }

  // Agrupar por profesional
  const porProfesional: Record<string, { nombre: string; items: OrdenItem[] }> = {}
  for (const item of items) {
    const key = item.profesional?.id || 'sin_prof'
    if (!porProfesional[key]) {
      const nombre = item.profesional
        ? `${item.profesional.nombre} ${item.profesional.apellido}`
        : 'Sin profesional asignado'
      porProfesional[key] = { nombre, items: [] }
    }
    porProfesional[key].items.push(item)
  }

  function claseEstado(estado: string) {
    switch (estado) {
      case 'esperando': return 'bg-yellow-100 text-yellow-700'
      case 'atendido': return 'bg-green-100 text-green-700'
      case 'cancelado': return 'bg-red-100 text-red-600'
      default: return 'bg-gray-100 text-gray-500'
    }
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
            <p className="text-gray-400 text-sm">No hay registros para esta fecha</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(porProfesional).map(([profId, { nombre, items: profItems }]) => (
              <div key={profId} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                {/* Header profesional */}
                <div className="bg-blue-600 px-5 py-3 flex items-center justify-between">
                  <h2 className="font-semibold text-white text-lg">{nombre}</h2>
                  <div className="flex items-center gap-4 text-blue-100 text-sm">
                    <span>{profItems.length} paciente{profItems.length !== 1 ? 's' : ''}</span>
                    <span>
                      Esperando: <strong className="text-white">
                        {profItems.filter(i => i.estado === 'esperando').length}
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-2.5 font-medium text-gray-600 w-8">#</th>
                        <th className="text-left px-4 py-2.5 font-medium text-gray-600">Hora llegada</th>
                        <th className="text-left px-4 py-2.5 font-medium text-gray-600">Paciente</th>
                        <th className="text-left px-4 py-2.5 font-medium text-gray-600">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profItems.map((item) => (
                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-400 text-xs">{item.numero_orden}</td>
                          <td className="px-4 py-3 text-gray-600 font-medium">
                            {item.hora_llegada ? item.hora_llegada.substring(0, 5) : '-'}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-800">
                            {item.paciente
                              ? `${item.paciente.apellido}, ${item.paciente.nombre}`
                              : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${claseEstado(item.estado)}`}>
                              {item.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                      <tr>
                        <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-gray-700">
                          Total: {profItems.length} paciente{profItems.length !== 1 ? 's' : ''}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
