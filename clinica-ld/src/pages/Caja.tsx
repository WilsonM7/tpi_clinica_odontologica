import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Search, X, CheckCircle, Pencil, Send } from 'lucide-react'
import { format } from 'date-fns'

const CONTROL_ID = '__control__'

const CUOTA_BASE_MAP: Record<string, number> = {
  'metalicos':           42000,
  'porcelana':           48000,
  'zafiro':              59000,
  'alineador invisible': 60000,
  'ortopedia':           42000,
  'metalicos complejo':  48000,
  'porcelana complejo':  60000,
}

const INFERIOR_PRECIO_MAP: Record<string, number> = {
  'metalicos complejo': 280000,
  'porcelana complejo': 370000,
}

const MATERIALES = ['metalicos', 'porcelana', 'zafiro', 'alineador invisible', 'ortopedia']

type Config = { descartable: number; bracket: number; tubo: number; arco: number; recargo: number }
type Paciente = { id: string; apellido_nombre: string; dni: string }
type Practica = { id: string; nombre: string; valor: number; multa: number | null; tipo_multa: string | null; cobra_descartable: boolean; especialidad_id: string | null }
type Tratamiento = { id: string; tipo_material: string; tipo_tto: string; cuota_base: number; estado: string; entrega?: number; especialidades?: { nombre: string } }
type Especialidad = { id: string; nombre: string }
type Profesional = { id: string; usuarios: { nombre: string } }
type ProfConPorcentajes = {
  id: string
  porcentaje_instalacion: number | null
  porcentaje_practicas: number | null
  profesional_porcentajes_especialidad: { especialidad_id: string; porcentaje: number }[]
}
type UltimoCobro = {
  cobroId: string
  turnoId: string
  fecha: string
  practicaNombre: string
  valorPractica: number
  esInstalacion: boolean
  especialidadId: string | null
  multaBase: number
}
type Cobro = {
  id: string; fecha: string; subtotal: number; multa: number; deuda_anterior: number
  total: number; medio_pago: string; monto_pagado: number; diferencia: number
  practicas?: { nombre: string }; pacientes?: { apellido_nombre: string }
}
type TurnoState = {
  id: string; paciente_id: string; profesional_id: string; sucursal_id: string
  practica_id: string | null
  pacientes: { id: string; apellido_nombre: string; dni: string }
}

function esInstalacion(nombre: string): boolean {
  const n = nombre.toLowerCase()
  return n.includes('instalac') && !n.includes('inferior')
}
function esInferiorComplejo(nombre: string): boolean {
  const n = nombre.toLowerCase()
  return n.includes('inferior') && n.includes('complejo')
}
function esComplejo(nombre: string): boolean {
  const n = nombre.toLowerCase()
  return n.includes('complejo') && !n.includes('inferior')
}
function materialDePractica(nombre: string): string {
  const n = nombre.toLowerCase()
  const complejo = n.includes('complejo')
  if (n.includes('zafiro')) return 'zafiro'
  if (n.includes('porcelana')) return complejo ? 'porcelana complejo' : 'porcelana'
  if (n.includes('metal')) return complejo ? 'metalicos complejo' : 'metalicos'
  if (n.includes('invisible') || n.includes('alineador')) return 'alineador invisible'
  if (n.includes('ortopedia')) return 'ortopedia'
  return ''
}
function materialMasCaro(a: string, b: string): string {
  return (CUOTA_BASE_MAP[a] || 0) >= (CUOTA_BASE_MAP[b] || 0) ? a : b
}

export default function Caja() {
  const location = useLocation()
  const turnoDesdeAgenda = location.state?.turno as TurnoState | undefined

  const [config, setConfig] = useState<Config>({ descartable: 3000, bracket: 5000, tubo: 6000, arco: 5000, recargo: 0.15 })
  const [busqueda, setBusqueda] = useState('')
  const [resultadosBusqueda, setResultadosBusqueda] = useState<Paciente[]>([])
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<Paciente | null>(null)
  const [practicas, setPracticas] = useState<Practica[]>([])
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([])
  const [profesionales, setProfesionales] = useState<Profesional[]>([])
  const [tratamientosActivos, setTratamientosActivos] = useState<Tratamiento[]>([])
  const [tratamientoComplejoActivo, setTratamientoComplejoActivo] = useState<Tratamiento | null>(null)
  const [cobrosHistorial, setCobrosHistorial] = useState<Cobro[]>([])
  const [cobrosGenerales, setCobrosGenerales] = useState<Cobro[]>([])
  const [fechaFiltro, setFechaFiltro] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [sucursalId, setSucursalId] = useState('')
  const [usuarioId, setUsuarioId] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [exito, setExito] = useState(false)
  const [error, setError] = useState('')

  // Control
  const [tratamientoSeleccionado, setTratamientoSeleccionado] = useState<Tratamiento | null>(null)
  const [valorControl, setValorControl] = useState('')
  const [editandoValorControl, setEditandoValorControl] = useState(false)

  // Instalación
  const [esHibrido, setEsHibrido] = useState(false)
  const [materialHibrido2, setMaterialHibrido2] = useState('')
  const [profesionalInstalacion, setProfesionalInstalacion] = useState('')

  // Orden de llegada
  const [mostrarPanelOrden, setMostrarPanelOrden] = useState(false)
  const [enviadoAOrden, setEnviadoAOrden] = useState(false)
  const [ordenProfId, setOrdenProfId] = useState('')
  const [profConPorcentajes, setProfConPorcentajes] = useState<ProfConPorcentajes | null>(null)
  const [incluirMulta, setIncluirMulta] = useState(false)
  const [enviandoOrden, setEnviandoOrden] = useState(false)
  const [ultimoCobro, setUltimoCobro] = useState<UltimoCobro | null>(null)

  const [form, setForm] = useState({
    practica_id: '', turno_id: '',
    fecha: format(new Date(), 'yyyy-MM-dd'),
    brackets: 0, tubos: 0, arcos: 0,
    medio_pago: 'EFECTIVO', monto_pagado: '',
  })

  const practicaActual = practicas.find(p => p.id === form.practica_id)
  const esControlPractica         = form.practica_id === CONTROL_ID
  const esInstalacionPractica     = practicaActual ? esInstalacion(practicaActual.nombre) : false
  const esInferiorComplejoPractica = practicaActual ? esInferiorComplejo(practicaActual.nombre) : false
  const esComplejoSuperior        = esInstalacionPractica && practicaActual ? esComplejo(practicaActual.nombre) : false
  const materialBase              = practicaActual ? materialDePractica(practicaActual.nombre) : ''

  useEffect(() => { cargarDatosIniciales() }, [])
  useEffect(() => { cargarCobrosGenerales() }, [fechaFiltro])

  useEffect(() => {
    if (turnoDesdeAgenda) {
      const pac = turnoDesdeAgenda.pacientes
      if (pac) setPacienteSeleccionado({ id: pac.id, apellido_nombre: pac.apellido_nombre, dni: pac.dni })
      setForm(f => ({ ...f, practica_id: turnoDesdeAgenda.practica_id || '', turno_id: turnoDesdeAgenda.id || '' }))
      if (turnoDesdeAgenda.profesional_id) setProfesionalInstalacion(turnoDesdeAgenda.profesional_id)
    }
  }, [turnoDesdeAgenda])

  useEffect(() => {
    if (pacienteSeleccionado) {
      cargarHistorial(pacienteSeleccionado.id)
      cargarTratamientosActivos(pacienteSeleccionado.id)
      // Resetear panel orden al cambiar paciente
      setMostrarPanelOrden(false)
      setEnviadoAOrden(false)
      setUltimoCobro(null)
    }
  }, [pacienteSeleccionado?.id])

  useEffect(() => {
    if (esControlPractica && tratamientosActivos.length === 1) seleccionarTratamiento(tratamientosActivos[0])
    if (!esControlPractica) { setTratamientoSeleccionado(null); setValorControl(''); setEditandoValorControl(false) }
  }, [esControlPractica, tratamientosActivos])

  useEffect(() => {
    if (!esInstalacionPractica) { setEsHibrido(false); setMaterialHibrido2('') }
  }, [form.practica_id])

  useEffect(() => {
    if (ordenProfId) cargarProfConPorcentajes(ordenProfId)
    else setProfConPorcentajes(null)
  }, [ordenProfId])

  async function cargarDatosIniciales() {
    const [{ data: user }, { data: sucs }, { data: pracs }, { data: esps }, { data: profs }, { data: conf }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from('sucursales').select('id').eq('activa', true).limit(1).single(),
      supabase.from('practicas').select('id, nombre, valor, multa, tipo_multa, cobra_descartable, especialidad_id').eq('activa', true).order('nombre'),
      supabase.from('especialidades').select('id, nombre').order('nombre'),
      supabase.from('profesionales').select('id, usuarios(nombre)').eq('activo', true),
      supabase.from('configuracion').select('clave, valor'),
    ])
    if (user.user) setUsuarioId(user.user.id)
    if (sucs) setSucursalId(sucs.id)
    setPracticas(pracs || [])
    setEspecialidades(esps || [])
    setProfesionales(profs || [])
    if (conf) {
      const get = (k: string, def: number) => parseFloat((conf.find((c: any) => c.clave === k)?.valor) || def.toString()) || def
      setConfig({ descartable: get('descartable', 3000), bracket: get('bracket', 5000), tubo: get('tubo', 6000), arco: get('arco', 5000), recargo: get('recargo_tarjeta', 15) / 100 })
    }
  }

  async function cargarTratamientosActivos(pacienteId: string) {
    const { data } = await supabase.from('tratamientos')
      .select('id, tipo_material, tipo_tto, cuota_base, estado, entrega, especialidades(nombre)')
      .eq('paciente_id', pacienteId)
      .in('estado', ['en tratamiento', 'en finalizacion'])
    const lista = data || []
    setTratamientosActivos(lista)
    setTratamientoComplejoActivo(lista.find(t => t.tipo_material?.toLowerCase().includes('complejo')) || null)
  }

  async function cargarHistorial(pacienteId: string) {
    const { data } = await supabase.from('cobros')
      .select('*, practicas!practica_id(nombre)')
      .eq('paciente_id', pacienteId)
      .order('fecha', { ascending: false }).limit(20)
    setCobrosHistorial(data || [])
  }

  async function cargarCobrosGenerales() {
    const { data } = await supabase.from('cobros')
      .select('*, practicas!practica_id(nombre), pacientes(apellido_nombre)')
      .eq('fecha', fechaFiltro).order('created_at', { ascending: false })
    setCobrosGenerales(data || [])
  }

  async function cargarProfConPorcentajes(profesionalId: string) {
    const { data } = await supabase.from('profesionales')
      .select('id, porcentaje_instalacion, porcentaje_practicas, profesional_porcentajes_especialidad(especialidad_id, porcentaje)')
      .eq('id', profesionalId).single()
    setProfConPorcentajes(data as ProfConPorcentajes || null)
  }

  async function buscarPacientes(q: string) {
    if (q.length < 2) { setResultadosBusqueda([]); return }
    const { data } = await supabase.from('pacientes').select('id, apellido_nombre, dni')
      .eq('activo', true).or(`apellido_nombre.ilike.%${q}%,dni.ilike.%${q}%`).limit(8)
    setResultadosBusqueda(data || [])
  }

  function seleccionarPaciente(p: Paciente) {
    setPacienteSeleccionado(p); setBusqueda(p.apellido_nombre)
    setResultadosBusqueda([]); setExito(false); setError('')
  }

  function limpiarPaciente() {
    setPacienteSeleccionado(null); setBusqueda(''); setCobrosHistorial([])
    setTratamientosActivos([]); setTratamientoComplejoActivo(null); setTratamientoSeleccionado(null)
    setValorControl(''); setEditandoValorControl(false)
    setEsHibrido(false); setMaterialHibrido2(''); setProfesionalInstalacion('')
    setMostrarPanelOrden(false); setEnviadoAOrden(false); setUltimoCobro(null)
    setForm(f => ({ ...f, practica_id: '', turno_id: '', brackets: 0, tubos: 0, arcos: 0, monto_pagado: '', medio_pago: 'EFECTIVO' }))
    setExito(false); setError('')
  }

  function seleccionarTratamiento(t: Tratamiento) {
    setTratamientoSeleccionado(t); setValorControl(t.cuota_base.toString()); setEditandoValorControl(false)
  }

  function labelTratamiento(t: Tratamiento) {
    return `${t.tipo_material} · $${Number(t.cuota_base).toLocaleString('es-AR')}`
  }

  // ── Cálculos cobro ──────────────────────────────────────────────────────
  const deudaAnterior = cobrosHistorial.reduce((acc, c) => {
    if (c.diferencia < 0) return acc + Math.abs(c.diferencia)
    if (c.diferencia > 0) return acc - c.diferencia
    return acc
  }, 0)
  const deudaAnteriorFinal = Math.max(0, deudaAnterior)

  const tieneDescartable = esControlPractica || esInferiorComplejoPractica || practicaActual?.cobra_descartable || false
  const montoDescartable = tieneDescartable ? config.descartable : 0

  const precioInferiorBloqueado = tratamientoComplejoActivo?.entrega
    || INFERIOR_PRECIO_MAP[materialDePractica(practicaActual?.nombre || '')] || 0

  const subtotalPractica = esControlPractica
    ? (parseFloat(valorControl) || 0)
    : esInferiorComplejoPractica
      ? precioInferiorBloqueado
      : (practicaActual?.valor || 0)

  const subtotalMateriales = (form.brackets * config.bracket) + (form.tubos * config.tubo) + (form.arcos * config.arco)
  const subtotalBase = subtotalPractica + subtotalMateriales + montoDescartable
  const tieneRecargo = form.medio_pago !== 'EFECTIVO'
  const recargo = tieneRecargo ? subtotalBase * config.recargo : 0
  const subtotalConRecargo = subtotalBase + recargo
  const total = subtotalConRecargo + deudaAnteriorFinal
  const montoPagadoNum = parseFloat(form.monto_pagado || '0') || 0
  const diferencia = montoPagadoNum - total

  // ── Cálculos orden de llegada ──────────────────────────────────────────
  function determinarPorcentaje(): number {
    if (!profConPorcentajes || !ultimoCobro) return 0
    if (ultimoCobro.esInstalacion) return profConPorcentajes.porcentaje_instalacion || 0
    if (ultimoCobro.especialidadId && profConPorcentajes.profesional_porcentajes_especialidad?.length) {
      const match = profConPorcentajes.profesional_porcentajes_especialidad.find(
        e => e.especialidad_id === ultimoCobro.especialidadId
      )
      if (match) return match.porcentaje
    }
    return profConPorcentajes.porcentaje_practicas || 0
  }

  function calcularMontoMulta(): number {
    if (!incluirMulta || !ultimoCobro) return 0
    return ultimoCobro.multaBase
  }

  const pctActual = determinarPorcentaje()
  const multaActual = calcularMontoMulta()
  const gananciaActual = ultimoCobro ? ((ultimoCobro.valorPractica + multaActual) * pctActual / 100) : 0

  // Totales día
  const totalDia        = cobrosGenerales.reduce((acc, c) => acc + (c.monto_pagado || 0), 0)
  const totalEfectivo   = cobrosGenerales.filter(c => c.medio_pago === 'EFECTIVO').reduce((acc, c) => acc + (c.monto_pagado || 0), 0)
  const totalElectronico = cobrosGenerales.filter(c => c.medio_pago !== 'EFECTIVO').reduce((acc, c) => acc + (c.monto_pagado || 0), 0)

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault()
    if (!pacienteSeleccionado) { setError('Seleccioná un paciente'); return }
    if (esControlPractica && !tratamientoSeleccionado) { setError('Seleccioná el tratamiento para el control'); return }
    if (esInstalacionPractica && !profesionalInstalacion) { setError('Seleccioná el profesional que realiza la instalación'); return }
    if (esInferiorComplejoPractica && !tratamientoComplejoActivo) { setError('No se encontró un tratamiento complejo activo para este paciente'); return }

    setGuardando(true); setError('')

    if (esControlPractica && tratamientoSeleccionado) {
      const nuevoValor = parseFloat(valorControl) || 0
      if (nuevoValor !== tratamientoSeleccionado.cuota_base) {
        await supabase.from('tratamientos').update({ cuota_base: nuevoValor }).eq('id', tratamientoSeleccionado.id)
      }
    }

    let tratamientoId: string | null = null
    if (esInstalacionPractica) {
      let materialFinal = materialBase
      let tipoMaterialLabel = materialBase
      if (esHibrido && materialHibrido2) {
        const masCaro = materialMasCaro(materialBase, materialHibrido2)
        tipoMaterialLabel = `Híbrido ${materialBase} + ${materialHibrido2}`
        materialFinal = masCaro
      }
      const esOrtopedia = materialFinal === 'ortopedia'
      const esp = especialidades.find(e => e.nombre.toLowerCase().includes(esOrtopedia ? 'ortopedia' : 'ortodoncia'))
      const cuotaBase = CUOTA_BASE_MAP[materialFinal] || 42000

      let precioInferiorActual: number | null = null
      if (esComplejoSuperior) {
        const matSinComplejo = materialFinal.replace(' complejo', '')
        const practicaInferior = practicas.find(p =>
          p.nombre.toLowerCase().includes('inferior') &&
          p.nombre.toLowerCase().includes(matSinComplejo) &&
          p.nombre.toLowerCase().includes('complejo')
        )
        precioInferiorActual = practicaInferior?.valor || INFERIOR_PRECIO_MAP[materialFinal] || null
      }

      const { data: tto } = await supabase.from('tratamientos').insert({
        paciente_id: pacienteSeleccionado.id,
        profesional_id: profesionalInstalacion || null,
        especialidad_id: esp?.id || null,
        tipo_material: tipoMaterialLabel,
        tipo_tto: esOrtopedia ? 'ortopedia' : 'ortodoncia',
        cuota_base: cuotaBase,
        entrega: precioInferiorActual,
        fecha_inicio: form.fecha,
        estado: 'en tratamiento',
      }).select('id').single()
      tratamientoId = tto?.id || null
    }

    if (esInferiorComplejoPractica) {
      tratamientoId = tratamientoComplejoActivo?.id || null
    }

    const { data: cobroData, error: err } = await supabase.from('cobros').insert({
      paciente_id: pacienteSeleccionado.id,
      turno_id: form.turno_id || null,
      sucursal_id: sucursalId || null,
      usuario_id: usuarioId || null,
      practica_id: esControlPractica ? null : (form.practica_id || null),
      tratamiento_id: esControlPractica ? tratamientoSeleccionado?.id : (tratamientoId || null),
      fecha: form.fecha,
      subtotal: subtotalConRecargo,
      multa: 0,
      deuda_anterior: deudaAnteriorFinal,
      total,
      medio_pago: form.medio_pago,
      monto_pagado: montoPagadoNum,
      diferencia,
      deuda_pagada: diferencia >= 0 ? deudaAnteriorFinal : 0,
      brackets: form.brackets,
      tubos: form.tubos,
      arcos: form.arcos,
    }).select('id').single()

    if (err) {
      setError('Error al guardar: ' + err.message)
    } else {
      // Calcular multa base para el orden de llegada
      let multaBase = 0
      if (esControlPractica && tratamientoSeleccionado) {
        multaBase = tratamientoSeleccionado.cuota_base || 0
      } else if (practicaActual?.multa) {
        multaBase = practicaActual.multa
      }

      // Guardar datos del cobro para el panel de orden
      const savedTurnoId = form.turno_id
      const savedFecha = form.fecha
      setUltimoCobro({
        cobroId: cobroData?.id || '',
        turnoId: savedTurnoId,
        fecha: savedFecha,
        practicaNombre: esControlPractica ? 'Control de tratamiento' : (practicaActual?.nombre || '-'),
        valorPractica: subtotalPractica,
        esInstalacion: esInstalacionPractica || esInferiorComplejoPractica,
        especialidadId: practicaActual?.especialidad_id || null,
        multaBase,
      })

      // Pre-llenar profesional en orden
      const profPreselect = turnoDesdeAgenda?.profesional_id || profesionalInstalacion || ''
      setOrdenProfId(profPreselect)
      setIncluirMulta(false)
      setMostrarPanelOrden(true)
      setEnviadoAOrden(false)
      setExito(true)

      await cargarHistorial(pacienteSeleccionado.id)
      await cargarTratamientosActivos(pacienteSeleccionado.id)
      if (savedFecha === fechaFiltro) await cargarCobrosGenerales()

      setForm(f => ({ ...f, practica_id: '', brackets: 0, tubos: 0, arcos: 0, monto_pagado: '', medio_pago: 'EFECTIVO', turno_id: '' }))
      setTratamientoSeleccionado(null); setValorControl(''); setEditandoValorControl(false)
      setEsHibrido(false); setMaterialHibrido2('')
    }
    setGuardando(false)
  }

  async function enviarAOrdenLlegada() {
    if (!pacienteSeleccionado || !ordenProfId || !ultimoCobro) return
    setEnviandoOrden(true)

    // Obtener hora del turno
    let horaTurno: string | null = null
    if (ultimoCobro.turnoId) {
      const { data: turno } = await supabase.from('turnos').select('fecha_hora').eq('id', ultimoCobro.turnoId).single()
      if (turno) {
        const dt = new Date(turno.fecha_hora)
        horaTurno = `${dt.getHours().toString().padStart(2, '0')}:${dt.getMinutes().toString().padStart(2, '0')}:00`
      }
    }

    const pct = determinarPorcentaje()
    const multa = calcularMontoMulta()
    const ganancia = ((ultimoCobro.valorPractica + multa) * pct) / 100

    await supabase.from('orden_llegada').insert({
      fecha: ultimoCobro.fecha,
      paciente_id: pacienteSeleccionado.id,
      profesional_id: ordenProfId,
      sucursal_id: sucursalId,
      cobro_id: ultimoCobro.cobroId,
      turno_id: ultimoCobro.turnoId || null,
      practica_nombre: ultimoCobro.practicaNombre,
      valor_practica: ultimoCobro.valorPractica,
      multa,
      porcentaje_ganancia: pct,
      ganancia_neta: ganancia,
      hora_turno: horaTurno,
    })

    setEnviadoAOrden(true)
    setMostrarPanelOrden(false)
    setEnviandoOrden(false)
  }

  function formatPeso(v: number) {
    return `$${v.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }
  function formatFecha(f: string) {
    if (!f) return '-'
    const [a, m, d] = f.split('-')
    return `${d}/${m}/${a}`
  }

  const MEDIOS_PAGO = [
    { value: 'EFECTIVO',      label: 'Efectivo',       sub: 'Sin recargo' },
    { value: 'TRANSF NERE',   label: 'Transf. Nere',   sub: `+${config.recargo * 100}%` },
    { value: 'TRANSF DELFI',  label: 'Transf. Delfi',  sub: `+${config.recargo * 100}%` },
    { value: 'TARJETA NERE',  label: 'Tarjeta Nere',   sub: `+${config.recargo * 100}%` },
    { value: 'TARJETA DELFI', label: 'Tarjeta Delfi',  sub: `+${config.recargo * 100}%` },
  ]

  const labelResumenPractica = esControlPractica ? 'Control de tratamiento'
    : esInferiorComplejoPractica ? 'Entrega inferior (precio bloqueado)'
    : esInstalacionPractica ? 'Instalación'
    : 'Práctica'

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-semibold text-gray-800">Caja</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">

            {/* Paciente */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-800 mb-3">Paciente</h2>
              {!pacienteSeleccionado ? (
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={busqueda}
                    onChange={e => { setBusqueda(e.target.value); buscarPacientes(e.target.value) }}
                    placeholder="Buscar por nombre o DNI..."
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {resultadosBusqueda.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 border border-gray-200 rounded-lg bg-white shadow-lg z-10 max-h-48 overflow-y-auto">
                      {resultadosBusqueda.map(p => (
                        <div key={p.id} onClick={() => seleccionarPaciente(p)}
                          className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100 last:border-0">
                          <span className="font-medium text-gray-800">{p.apellido_nombre}</span>
                          <span className="text-gray-400 ml-2 text-xs">{p.dni}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between bg-blue-50 rounded-lg px-4 py-3">
                  <div>
                    <p className="font-semibold text-gray-800">{pacienteSeleccionado.apellido_nombre}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{pacienteSeleccionado.dni}</p>
                  </div>
                  <button onClick={limpiarPaciente} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
              )}
              {pacienteSeleccionado && (
                <div className={`mt-3 rounded-lg px-4 py-3 flex items-center justify-between ${deudaAnteriorFinal > 0 ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                  <span className="text-sm font-medium text-gray-700">Deuda anterior</span>
                  <span className={`font-bold text-lg ${deudaAnteriorFinal > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {deudaAnteriorFinal > 0 ? formatPeso(deudaAnteriorFinal) : 'Sin deuda'}
                  </span>
                </div>
              )}
            </div>

            {/* Formulario */}
            {pacienteSeleccionado && (
              <form onSubmit={handleGuardar} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                <h2 className="font-semibold text-gray-800">Nuevo cobro</h2>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                    <input type="date" value={form.fecha}
                      onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Práctica</label>
                    <select value={form.practica_id}
                      onChange={e => setForm(f => ({ ...f, practica_id: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">-- Sin práctica --</option>
                      <option value={CONTROL_ID}>⭐ Control de tratamiento</option>
                      {practicas.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} — {formatPeso(p.valor)}{p.cobra_descartable ? ' + desc.' : ''}
                        </option>
                      ))}
                    </select>
                    {tieneDescartable && (
                      <p className="text-xs text-blue-600 mt-1">Incluye descartable: +{formatPeso(config.descartable)}</p>
                    )}
                  </div>
                </div>

                {/* Panel instalación */}
                {esInstalacionPractica && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-3">
                    <p className="text-sm font-semibold text-emerald-800">
                      🦷 Instalación{esComplejoSuperior ? ' complejo — entrega superior' : ''} — Se creará un nuevo tratamiento
                    </p>
                    <p className="text-xs text-emerald-700">
                      Material: <strong>{materialBase}</strong> · Control futuro: <strong>{formatPeso(CUOTA_BASE_MAP[materialBase] || 0)}</strong>
                    </p>
                    {esComplejoSuperior && (
                      <div className="bg-emerald-100 rounded-lg px-3 py-2 text-xs text-emerald-800">
                        💾 El precio de la entrega inferior quedará bloqueado al valor actual.
                      </div>
                    )}
                    {!esComplejoSuperior && (
                      <>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={esHibrido}
                            onChange={e => { setEsHibrido(e.target.checked); if (!e.target.checked) setMaterialHibrido2('') }}
                            className="rounded border-gray-300 text-emerald-600 w-4 h-4" />
                          <span className="text-sm text-emerald-800 font-medium">Tratamiento híbrido</span>
                        </label>
                        {esHibrido && (
                          <div>
                            <label className="block text-xs text-emerald-700 mb-1">Segundo material</label>
                            <select value={materialHibrido2} onChange={e => setMaterialHibrido2(e.target.value)}
                              className="w-full border border-emerald-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                              <option value="">-- Seleccioná --</option>
                              {MATERIALES.filter(m => m !== materialBase).map(m => (
                                <option key={m} value={m}>{m} · control {formatPeso(CUOTA_BASE_MAP[m] || 0)}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </>
                    )}
                    <div>
                      <label className="block text-xs text-emerald-700 mb-1">Profesional que instala *</label>
                      <select value={profesionalInstalacion} onChange={e => setProfesionalInstalacion(e.target.value)}
                        className="w-full border border-emerald-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                        <option value="">-- Seleccioná --</option>
                        {profesionales.map(p => <option key={p.id} value={p.id}>{p.usuarios?.nombre}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                {/* Panel inferior complejo */}
                {esInferiorComplejoPractica && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-2">
                    <p className="text-sm font-semibold text-purple-800">📦 Entrega inferior — Precio bloqueado</p>
                    {tratamientoComplejoActivo ? (
                      <>
                        <p className="text-xs text-purple-700">Tratamiento: <strong>{tratamientoComplejoActivo.tipo_material}</strong></p>
                        <p className="text-xs text-purple-700">Precio bloqueado: <strong>{formatPeso(precioInferiorBloqueado)}</strong></p>
                      </>
                    ) : (
                      <p className="text-xs text-orange-600">⚠️ No se encontró un tratamiento complejo activo para este paciente.</p>
                    )}
                  </div>
                )}

                {/* Panel control */}
                {esControlPractica && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                    <p className="text-sm font-medium text-blue-800">Control de tratamiento</p>
                    {tratamientosActivos.length === 0 ? (
                      <p className="text-sm text-orange-600">El paciente no tiene tratamientos activos</p>
                    ) : tratamientosActivos.length === 1 ? (
                      <div className="bg-white rounded-lg px-3 py-2 text-sm text-gray-700 border border-blue-200">
                        {labelTratamiento(tratamientosActivos[0])}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="block text-xs text-blue-700">Seleccioná el tratamiento</label>
                        {tratamientosActivos.map(t => (
                          <label key={t.id} className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer ${tratamientoSeleccionado?.id === t.id ? 'border-blue-500 bg-blue-100' : 'border-gray-200 bg-white hover:border-blue-300'}`}>
                            <input type="radio" name="tratamiento" checked={tratamientoSeleccionado?.id === t.id} onChange={() => seleccionarTratamiento(t)} className="text-blue-600" />
                            <span className="text-sm text-gray-700">{labelTratamiento(t)}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    {tratamientoSeleccionado && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs text-blue-700">Valor del control</label>
                          <button type="button" onClick={() => setEditandoValorControl(v => !v)}
                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                            <Pencil size={11} />{editandoValorControl ? 'Cancelar' : 'Modificar'}
                          </button>
                        </div>
                        {editandoValorControl ? (
                          <div className="space-y-1">
                            <input type="number" min="0" value={valorControl} onChange={e => setValorControl(e.target.value)}
                              className="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            <p className="text-xs text-blue-600">El nuevo valor se guardará en el tratamiento.</p>
                          </div>
                        ) : (
                          <div className="bg-white rounded-lg px-3 py-2 border border-blue-200 text-sm font-semibold text-gray-800">
                            {formatPeso(parseFloat(valorControl) || 0)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Materiales */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Materiales</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[{ key: 'brackets', label: 'Brackets', costo: config.bracket },
                      { key: 'tubos', label: 'Tubos', costo: config.tubo },
                      { key: 'arcos', label: 'Arcos', costo: config.arco }].map(mat => (
                      <div key={mat.key}>
                        <label className="block text-xs text-gray-500 mb-1">{mat.label} ({formatPeso(mat.costo)} c/u)</label>
                        <input type="number" min="0" value={(form as any)[mat.key]}
                          onChange={e => setForm(f => ({ ...f, [mat.key]: parseInt(e.target.value) || 0 }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Medio de pago */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Medio de pago</label>
                  <div className="flex gap-2 flex-wrap">
                    {MEDIOS_PAGO.map(op => (
                      <button key={op.value} type="button"
                        onClick={() => setForm(f => ({ ...f, medio_pago: op.value }))}
                        className={`flex-1 min-w-[80px] py-2 px-2 rounded-lg border text-xs font-medium transition-colors ${form.medio_pago === op.value ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                        <div>{op.label}</div>
                        <div className={`text-xs mt-0.5 ${form.medio_pago === op.value ? 'text-blue-100' : 'text-gray-400'}`}>{op.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resumen */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>{labelResumenPractica}</span><span>{formatPeso(subtotalPractica)}</span>
                  </div>
                  {tieneDescartable && <div className="flex justify-between text-blue-600"><span>Descartable</span><span>+{formatPeso(montoDescartable)}</span></div>}
                  {subtotalMateriales > 0 && <div className="flex justify-between text-gray-600"><span>Materiales</span><span>{formatPeso(subtotalMateriales)}</span></div>}
                  {tieneRecargo && <div className="flex justify-between text-orange-600"><span>Recargo {form.medio_pago.toLowerCase()} ({config.recargo * 100}%)</span><span>+{formatPeso(recargo)}</span></div>}
                  {deudaAnteriorFinal > 0 && <div className="flex justify-between text-red-600"><span>Deuda anterior</span><span>+{formatPeso(deudaAnteriorFinal)}</span></div>}
                  <div className="flex justify-between font-bold text-gray-800 pt-2 border-t border-gray-200 text-base">
                    <span>Total</span><span>{formatPeso(total)}</span>
                  </div>
                </div>

                {/* Monto pagado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monto pagado</label>
                  <input type="number" min="0" value={form.monto_pagado}
                    onChange={e => setForm(f => ({ ...f, monto_pagado: e.target.value }))}
                    placeholder="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {form.monto_pagado !== '' && (
                    <div className={`mt-2 text-sm font-medium flex justify-between px-1 ${diferencia < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      <span>{diferencia < 0 ? 'Queda debiendo' : 'A favor'}</span>
                      <span>{formatPeso(Math.abs(diferencia))}</span>
                    </div>
                  )}
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                {exito && (
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                    <CheckCircle size={16} />
                    <span className="text-sm font-medium">Cobro registrado correctamente</span>
                  </div>
                )}

                {/* Panel orden de llegada */}
                {mostrarPanelOrden && !enviadoAOrden && ultimoCobro && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 space-y-3">
                    <p className="text-sm font-semibold text-indigo-800 flex items-center gap-2">
                      <Send size={14} /> Agregar al orden de llegada
                    </p>

                    {/* Profesional */}
                    <div>
                      <label className="block text-xs font-medium text-indigo-700 mb-1">Profesional</label>
                      <select value={ordenProfId} onChange={e => setOrdenProfId(e.target.value)}
                        className="w-full border border-indigo-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="">-- Seleccioná --</option>
                        {profesionales.map(p => <option key={p.id} value={p.id}>{p.usuarios?.nombre}</option>)}
                      </select>
                    </div>

                    {/* Info práctica */}
                    {ultimoCobro && (
                      <div className="bg-white rounded-lg px-3 py-2 border border-indigo-200 text-xs text-gray-600 space-y-1">
                        <div className="flex justify-between">
                          <span>Práctica:</span><span className="font-medium text-gray-800">{ultimoCobro.practicaNombre}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Valor (sin descartable):</span><span className="font-medium text-gray-800">{formatPeso(ultimoCobro.valorPractica)}</span>
                        </div>
                        {profConPorcentajes && ordenProfId && (
                          <div className="flex justify-between text-indigo-700">
                            <span>Porcentaje:</span><span className="font-semibold">{pctActual}%</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Multa */}
                    {ultimoCobro.multaBase > 0 && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={incluirMulta} onChange={e => setIncluirMulta(e.target.checked)}
                          className="rounded border-gray-300 text-indigo-600 w-4 h-4" />
                        <span className="text-sm text-indigo-800">
                          Incluir multa por falta: <strong>{formatPeso(ultimoCobro.multaBase)}</strong>
                        </span>
                      </label>
                    )}

                    {/* Ganancia calculada */}
                    {profConPorcentajes && ordenProfId && (
                      <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex items-center justify-between">
                        <span className="text-sm text-green-700">Ganancia neta del profesional:</span>
                        <span className="font-bold text-green-700 text-base">{formatPeso(gananciaActual)}</span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button type="button" onClick={() => { setMostrarPanelOrden(false); setEnviadoAOrden(true) }}
                        className="flex-1 border border-gray-300 text-gray-600 rounded-lg py-2 text-sm hover:bg-gray-50">
                        Omitir
                      </button>
                      <button type="button" onClick={enviarAOrdenLlegada}
                        disabled={!ordenProfId || enviandoOrden}
                        className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
                        <Send size={14} />
                        {enviandoOrden ? 'Enviando...' : 'Enviar al orden'}
                      </button>
                    </div>
                  </div>
                )}

                {enviadoAOrden && (
                  <p className="text-xs text-indigo-600 flex items-center gap-1">
                    <CheckCircle size={12} /> Agregado al orden de llegada
                  </p>
                )}

                <button type="submit" disabled={guardando}
                  className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {guardando ? 'Guardando...' : esInstalacionPractica ? 'Registrar instalación' : esInferiorComplejoPractica ? 'Registrar entrega inferior' : 'Registrar cobro'}
                </button>
              </form>
            )}
          </div>

          {/* Historial paciente */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-6">
              <h2 className="font-semibold text-gray-800 mb-4">Historial del paciente</h2>
              {!pacienteSeleccionado ? (
                <p className="text-sm text-gray-400 text-center py-8">Seleccioná un paciente</p>
              ) : cobrosHistorial.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Sin cobros registrados</p>
              ) : (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                  {cobrosHistorial.map(c => (
                    <div key={c.id} className="border border-gray-100 rounded-lg p-3 text-sm">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs text-gray-400">{formatFecha(c.fecha)}</span>
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${c.diferencia < 0 ? 'bg-red-100 text-red-600' : c.diferencia > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                          {c.diferencia < 0 ? `Debe ${formatPeso(Math.abs(c.diferencia))}` : c.diferencia > 0 ? `A favor ${formatPeso(c.diferencia)}` : 'Saldado'}
                        </span>
                      </div>
                      {c.practicas?.nombre && <p className="text-gray-700 font-medium truncate">{c.practicas.nombre}</p>}
                      <div className="flex justify-between text-gray-500 mt-1">
                        <span>Total: {formatPeso(c.total)}</span>
                        <span>Pagó: {formatPeso(c.monto_pagado)}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{c.medio_pago}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Listado general */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="font-semibold text-gray-800">Registro de cobros</h2>
            <input type="date" value={fechaFiltro} onChange={e => setFechaFiltro(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {cobrosGenerales.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Total cobrado', valor: totalDia,        color: 'bg-blue-50',   text: 'text-blue-700' },
                { label: 'Efectivo',      valor: totalEfectivo,   color: 'bg-green-50',  text: 'text-green-700' },
                { label: 'Electrónico',   valor: totalElectronico, color: 'bg-orange-50', text: 'text-orange-700' },
              ].map(r => (
                <div key={r.label} className={`${r.color} rounded-lg px-4 py-3 text-center`}>
                  <p className="text-xs text-gray-500 mb-0.5">{r.label}</p>
                  <p className={`font-bold text-lg ${r.text}`}>{formatPeso(r.valor)}</p>
                </div>
              ))}
            </div>
          )}
          {cobrosGenerales.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No hay cobros para esta fecha</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600">Paciente</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600">Práctica</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600">Medio de pago</th>
                    <th className="text-right px-4 py-2.5 font-medium text-gray-600">Total</th>
                    <th className="text-right px-4 py-2.5 font-medium text-gray-600">Pagó</th>
                    <th className="text-right px-4 py-2.5 font-medium text-gray-600">Diferencia</th>
                  </tr>
                </thead>
                <tbody>
                  {cobrosGenerales.map(c => (
                    <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium text-gray-800">{c.pacientes?.apellido_nombre || '-'}</td>
                      <td className="px-4 py-2.5 text-gray-600">{c.practicas?.nombre || 'Control'}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.medio_pago === 'EFECTIVO' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                          {c.medio_pago}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-gray-800">{formatPeso(c.total)}</td>
                      <td className="px-4 py-2.5 text-right text-gray-800">{formatPeso(c.monto_pagado)}</td>
                      <td className={`px-4 py-2.5 text-right font-medium ${c.diferencia < 0 ? 'text-red-600' : c.diferencia > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                        {c.diferencia === 0 ? '—' : c.diferencia < 0 ? `-${formatPeso(Math.abs(c.diferencia))}` : `+${formatPeso(c.diferencia)}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
