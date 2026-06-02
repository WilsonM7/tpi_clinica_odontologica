import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  ChevronLeft, ChevronRight, Search, SlidersHorizontal, X,
  BanIcon, MessageCircle, UserRound, CreditCard, PanelLeftClose, PanelLeftOpen
} from 'lucide-react'
import {
  format, addDays, addWeeks, addMonths, addYears,
  subDays, subWeeks, subMonths, subYears,
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  startOfYear, endOfYear, isSameDay, isSameMonth,
  isToday, eachDayOfInterval, eachWeekOfInterval,
} from 'date-fns'
import { es } from 'date-fns/locale'

type Vista = 'dia' | 'semana' | 'mes' | 'año'

type Turno = {
  id: string
  paciente_id: string
  profesional_id: string
  consultorio_id: string
  sucursal_id: string
  fecha_hora: string
  duracion_minutos: number
  estado: string
  notas: string
  practica_id: string | null
  radiografia: string | null
  pacientes: { apellido_nombre: string; telefono?: string; id: string }
  profesionales: { usuario_id: string; id: string; usuarios: { nombre: string } }
  consultorios: { nombre: string; id: string }
  practicas?: { nombre: string }
}

type Profesional = { id: string; usuario_id: string; usuarios: { nombre: string } }
type Sucursal = { id: string; nombre: string }
type Consultorio = { id: string; nombre: string; orden: number; sucursal_id: string }
type HorarioProfesional = { profesional_id: string; dia_semana: number; hora_inicio: string; hora_fin: string }
type AusenciaProfesional = { profesional_id: string; fecha_desde: string; fecha_hasta: string }
type DiaInhabilitado = { id: string; fecha: string; sucursal_id: string | null; motivo: string }
type Especialidad = { id: string; nombre: string }

const SLOT_H = 40

const HORARIOS: string[] = []
for (let h = 8; h < 20; h++) {
  for (let m = 0; m < 60; m += 15) {
    if ((h === 13 && m === 45) || (h === 19 && m === 45)) continue
    HORARIOS.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`)
  }
}

const DIAS_SEMANA_LABELS = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB']
const DIAS_NOMBRE_LARGO: Record<number, string> = {
  0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles',
  4: 'Jueves', 5: 'Viernes', 6: 'Sábado'
}
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const ROLES_PUEDEN_MODIFICAR = ['super_admin', 'jefe_clinica', 'secretaria', 'telemarketer', 'supervisora']

const ESTADOS = [
  { value: 'ofrecido',     label: 'Ofrecido',     clase: 'bg-yellow-100 border-yellow-400 text-yellow-800' },
  { value: 'agendado',     label: 'Agendado',     clase: 'bg-green-100 border-green-400 text-green-800' },
  { value: 'confirmado',   label: 'Confirmado',   clase: 'bg-green-100 border-green-400 text-green-800' },
  { value: 'atendido',     label: 'Atendido',     clase: 'bg-green-200 border-green-600 text-green-900' },
  { value: 'ausente',      label: 'Ausente',      clase: 'bg-red-100 border-red-400 text-red-700' },
  { value: 'reprogramado', label: 'Reprogramado', clase: 'bg-red-50 border-red-300 text-red-500' },
  { value: 'pendiente',    label: 'Pendiente',    clase: 'bg-blue-100 border-blue-400 text-blue-800' },
]

const RADIO_ESTADOS = [
  { value: 'realizada',    label: 'Realizada',    clase: 'bg-green-100 text-green-700',     dot: 'bg-green-500' },
  { value: 'traer',        label: 'Traer',        clase: 'bg-yellow-100 text-yellow-700',   dot: 'bg-yellow-500' },
  { value: 'no_realizada', label: 'No realizada', clase: 'bg-red-100 text-red-700',         dot: 'bg-red-500' },
  { value: 'pedir',        label: 'Pedir',        clase: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-700' },
  { value: 'pedir_ambas',  label: 'Pedir ambas',  clase: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-700' },
]

function normHora(h: string): string { return h ? h.substring(0, 5) : '' }
function numConsultorio(nombre: string): string {
  const m = nombre.match(/\d+/); return m ? m[0] : nombre
}
function claseDeEstado(estado: string) {
  return ESTADOS.find(e => e.value === estado)?.clase || 'bg-blue-100 border-blue-400 text-blue-800'
}
function radioDot(estado: string | null) {
  if (!estado) return null
  return RADIO_ESTADOS.find(r => r.value === estado)?.dot || null
}
function toLocalAR(fechaISO: string): Date {
  return new Date(new Date(fechaISO).getTime())
}
function toUTC(fechaLocalAR: Date): string {
  return new Date(fechaLocalAR.getTime() - 3 * 3600000).toISOString()
}
function franjaHoraria(hora: string): 'mañana' | 'tarde' {
  return parseInt(hora.split(':')[0]) < 14 ? 'mañana' : 'tarde'
}

function ColumnaHoras() {
  return (
    <div className="w-14 flex-shrink-0 bg-white border-r border-gray-200">
      {HORARIOS.map((hora) => (
        <div key={hora}
          className="flex items-center justify-end pr-2 border-b border-gray-100"
          style={{ height: SLOT_H }}>
          <span className="text-xs text-gray-400 leading-none">{hora}</span>
        </div>
      ))}
    </div>
  )
}

export default function Agenda() {
  const navigate = useNavigate()
  const [vista, setVista] = useState<Vista>('semana')
  const [fechaActual, setFechaActual] = useState(new Date())
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [profesionales, setProfesionales] = useState<Profesional[]>([])
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([])
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  // nombre único para el state de consultorios del componente padre
  const [consultorios, setConsultorios] = useState<Consultorio[]>([])
  const [sucursalId, setSucursalId] = useState('')
  const [profesionalFiltro, setProfesionalFiltro] = useState('')
  const [especialidadFiltro, setEspecialidadFiltro] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('')
  const [radioFiltro, setRadioFiltro] = useState('')
  const [soloLibres, setSoloLibres] = useState(false)
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [mostrarBusqueda, setMostrarBusqueda] = useState(false)
  const [busquedaTexto, setBusquedaTexto] = useState('')
  const [resultadosBusqueda, setResultadosBusqueda] = useState<Turno[]>([])
  const [mostrarFormTurno, setMostrarFormTurno] = useState(false)
  const [mostrarBajaDia, setMostrarBajaDia] = useState(false)
  const [turnoSeleccionado, setTurnoSeleccionado] = useState<Turno | null>(null)
  const [fechaHoraSeleccionada, setFechaHoraSeleccionada] = useState<Date | null>(null)
  const [consultorioPreseleccionado, setConsultorioPreseleccionado] = useState<string>('')
  const [horaActual, setHoraActual] = useState(new Date())
  const [miniCalAbierto, setMiniCalAbierto] = useState(true)
  const [rolActual, setRolActual] = useState('')
  const [horariosProf, setHorariosProf] = useState<HorarioProfesional[]>([])
  const [ausencias, setAusencias] = useState<AusenciaProfesional[]>([])
  const [diasInhabilitados, setDiasInhabilitados] = useState<DiaInhabilitado[]>([])

  useEffect(() => {
    cargarDatos()
    cargarRolActual()
    const interval = setInterval(() => setHoraActual(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (sucursalId) {
      cargarConsultorios()
      cargarTurnos()
      cargarHorariosProfesionales()
      cargarDiasInhabilitados()
      cargarAusencias()
    }
  }, [sucursalId, fechaActual, vista, profesionalFiltro, especialidadFiltro, estadoFiltro, radioFiltro])

  function getRango(v: Vista, fecha: Date): { desde: Date; hasta: Date } {
    if (v === 'dia') {
      const desde = new Date(fecha); desde.setHours(0,0,0,0)
      const hasta = new Date(fecha); hasta.setHours(23,59,59,999)
      return { desde, hasta }
    }
    if (v === 'semana') return {
      desde: startOfWeek(fecha, { weekStartsOn: 1 }),
      hasta: endOfWeek(fecha, { weekStartsOn: 1 })
    }
    if (v === 'mes') return { desde: startOfMonth(fecha), hasta: endOfMonth(fecha) }
    return { desde: startOfYear(fecha), hasta: endOfYear(fecha) }
  }

  async function cargarRolActual() {
    const { data } = await supabase.auth.getUser()
    if (data.user) {
      const { data: u } = await supabase.from('usuarios').select('rol').eq('id', data.user.id).single()
      setRolActual(u?.rol || '')
    }
  }

  async function cargarDatos() {
    const [{ data: sucs }, { data: profs }, { data: esps }] = await Promise.all([
      supabase.from('sucursales').select('*').eq('activa', true),
      supabase.from('profesionales').select('*, usuarios(nombre)').eq('activo', true),
      supabase.from('especialidades').select('*').order('nombre')
    ])
    setSucursales(sucs || [])
    setProfesionales(profs || [])
    setEspecialidades(esps || [])
    if (sucs && sucs.length > 0) setSucursalId(sucs[0].id)
  }

  async function cargarConsultorios() {
    const { data } = await supabase.from('consultorios').select('*')
      .eq('sucursal_id', sucursalId).eq('activo', true).order('orden')
    setConsultorios(data || [])
  }

  async function cargarHorariosProfesionales() {
    const { data } = await supabase.from('profesional_horarios')
      .select('profesional_id, dia_semana, hora_inicio, hora_fin')
      .eq('sucursal_id', sucursalId).eq('activo', true)
    setHorariosProf(data || [])
  }

  async function cargarAusencias() {
    const { desde, hasta } = getRango(vista, fechaActual)
    const { data } = await supabase.from('profesional_ausencias')
      .select('profesional_id, fecha_desde, fecha_hasta')
      .lte('fecha_desde', format(hasta, 'yyyy-MM-dd'))
      .gte('fecha_hasta', format(desde, 'yyyy-MM-dd'))
    setAusencias(data || [])
  }

  async function cargarDiasInhabilitados() {
    const { desde, hasta } = getRango(vista, fechaActual)
    const { data } = await supabase.from('dias_inhabilitados').select('*')
      .gte('fecha', format(desde, 'yyyy-MM-dd'))
      .lte('fecha', format(hasta, 'yyyy-MM-dd'))
    setDiasInhabilitados(data || [])
  }

  async function cargarTurnos() {
    const { desde, hasta } = getRango(vista, fechaActual)
    const desdeUTC = toUTC(desde)
    const hastaUTC = toUTC(hasta)

    let query = supabase.from('turnos')
      .select('*, pacientes(id, apellido_nombre, telefono), profesionales(id, usuario_id, usuarios(nombre)), consultorios(id, nombre), practicas(nombre)')
      .eq('sucursal_id', sucursalId)
      .gte('fecha_hora', desdeUTC)
      .lte('fecha_hora', hastaUTC)

    if (profesionalFiltro) query = query.eq('profesional_id', profesionalFiltro)
    if (estadoFiltro) query = query.eq('estado', estadoFiltro)
    if (radioFiltro) query = query.eq('radiografia', radioFiltro)

    const { data } = await query
    let resultado = data || []

    if (especialidadFiltro) {
      const { data: profEsps } = await supabase
        .from('profesional_especialidades').select('profesional_id').eq('especialidad_id', especialidadFiltro)
      const profIds = (profEsps || []).map((pe: any) => pe.profesional_id)
      resultado = resultado.filter(t => profIds.includes(t.profesional_id))
    }

    setTurnos(resultado)
  }

  async function buscarTurnos(q: string) {
    if (q.length < 2) { setResultadosBusqueda([]); return }
    const { data } = await supabase.from('turnos')
      .select('*, pacientes(id, apellido_nombre, telefono), profesionales(id, usuario_id, usuarios(nombre)), consultorios(id, nombre), practicas(nombre)')
      .eq('sucursal_id', sucursalId).order('fecha_hora', { ascending: false }).limit(50)
    const q2 = q.toLowerCase()
    setResultadosBusqueda((data || []).filter(t =>
      t.pacientes?.apellido_nombre?.toLowerCase().includes(q2) ||
      t.practicas?.nombre?.toLowerCase().includes(q2) ||
      t.profesionales?.usuarios?.nombre?.toLowerCase().includes(q2)
    ))
  }

  function navegar(dir: 1 | -1) {
    if (vista === 'dia') setFechaActual(dir === 1 ? addDays(fechaActual, 1) : subDays(fechaActual, 1))
    else if (vista === 'semana') setFechaActual(dir === 1 ? addWeeks(fechaActual, 1) : subWeeks(fechaActual, 1))
    else if (vista === 'mes') setFechaActual(dir === 1 ? addMonths(fechaActual, 1) : subMonths(fechaActual, 1))
    else setFechaActual(dir === 1 ? addYears(fechaActual, 1) : subYears(fechaActual, 1))
  }

  function tituloNavegacion() {
    if (vista === 'dia') return format(fechaActual, "d 'de' MMMM yyyy", { locale: es })
    if (vista === 'semana') {
      const ini = startOfWeek(fechaActual, { weekStartsOn: 1 })
      const fin = endOfWeek(fechaActual, { weekStartsOn: 1 })
      return `${format(ini, 'd MMM', { locale: es })} - ${format(fin, 'd MMM yyyy', { locale: es })}`
    }
    if (vista === 'mes') return format(fechaActual, 'MMMM yyyy', { locale: es })
    return format(fechaActual, 'yyyy')
  }

  function turnosDia(fecha: Date) {
    return turnos.filter(t => isSameDay(toLocalAR(t.fecha_hora), fecha))
  }

  function turnosEnSlot(fecha: Date, hora: string, consultorioId: string) {
    const [h, m] = hora.split(':').map(Number)
    return turnos.filter(t => {
      const ft = toLocalAR(t.fecha_hora)
      return isSameDay(ft, fecha)
        && ft.getHours() === h && ft.getMinutes() === m
        && t.consultorio_id === consultorioId
    })
  }

  function diaInhabilitado(fecha: Date): DiaInhabilitado | null {
    const s = format(fecha, 'yyyy-MM-dd')
    return diasInhabilitados.find(
      d => d.fecha === s && (d.sucursal_id === null || d.sucursal_id === sucursalId)
    ) ?? null
  }

  function profesionalAusente(profesionalId: string, fecha: Date): boolean {
    const s = format(fecha, 'yyyy-MM-dd')
    return ausencias.some(a =>
      a.profesional_id === profesionalId && a.fecha_desde <= s && a.fecha_hasta >= s
    )
  }

  function profesionalesActivosEnFecha(fecha: Date, hora: string): number {
    if (diaInhabilitado(fecha)) return 0
    const dia = fecha.getDay()
    const profIds = new Set(
      horariosProf
        .filter(hp =>
          hp.dia_semana === dia &&
          hora >= normHora(hp.hora_inicio) &&
          hora < normHora(hp.hora_fin) &&
          !profesionalAusente(hp.profesional_id, fecha)
        )
        .map(hp => hp.profesional_id)
    )
    return profIds.size
  }

  function celdaHabilitada(fecha: Date, hora: string, consultorioIdx: number): boolean {
    if (diaInhabilitado(fecha)) return false
    if (profesionalFiltro) {
      const dia = fecha.getDay()
      const tieneHorario = horariosProf.some(hp =>
        hp.profesional_id === profesionalFiltro &&
        hp.dia_semana === dia &&
        hora >= normHora(hp.hora_inicio) &&
        hora < normHora(hp.hora_fin)
      )
      if (!tieneHorario) return false
      return !profesionalAusente(profesionalFiltro, fecha)
    }
    const activos = profesionalesActivosEnFecha(fecha, hora)
    return consultorioIdx < activos
  }

  function posicionHoraActual() {
    const h = horaActual.getHours(); const m = horaActual.getMinutes()
    if (h < 8 || h >= 20) return -1
    return ((h - 8) * 60 + m) / 15 * SLOT_H
  }

  function headerDia(fecha: Date, compact = false): React.ReactNode {
    const diaInh = diaInhabilitado(fecha)
    if (compact) {
      return (
        <div className="flex flex-col items-center py-1">
          <span className="text-xs text-gray-500">
            {DIAS_SEMANA_LABELS[fecha.getDay() === 0 ? 6 : fecha.getDay() - 1]}
          </span>
          <span className={`text-sm font-medium ${isToday(fecha) ? 'bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center' : 'text-gray-700'}`}>
            {format(fecha, 'd')}
          </span>
          {diaInh && <span className="text-xs text-orange-500" title={diaInh.motivo}>🚫</span>}
        </div>
      )
    }
    return (
      <div className="flex flex-col items-center gap-0.5 py-2">
        <span className={`text-sm font-semibold ${isToday(fecha) ? 'text-blue-600' : 'text-gray-800'}`}>
          {DIAS_NOMBRE_LARGO[fecha.getDay()]} {format(fecha, 'dd/MM/yyyy')}
        </span>
        {diaInh && <span className="text-xs text-orange-600 font-medium">🚫 {diaInh.motivo}</span>}
      </div>
    )
  }

  const puedeModificar = ROLES_PUEDEN_MODIFICAR.includes(rolActual)

  const diasSemana = eachDayOfInterval({
    start: startOfWeek(fechaActual, { weekStartsOn: 1 }),
    end: endOfWeek(fechaActual, { weekStartsOn: 1 })
  }).filter(d => d.getDay() !== 0)

  function abrirFormTurno(fecha: Date, hora: string, consultorioId: string) {
    const [h, m] = hora.split(':').map(Number)
    const dt = new Date(fecha); dt.setHours(h, m, 0, 0)
    setFechaHoraSeleccionada(dt)
    setConsultorioPreseleccionado(consultorioId)
    setMostrarFormTurno(true)
  }

  function renderTurno(t: Turno, compact = false, ocultarContenido = false) {
    const clase = ocultarContenido
      ? 'bg-red-100 border-red-300'
      : claseDeEstado(t.estado)
    const altoSlots = Math.ceil((t.duracion_minutos || 15) / 15)

    if (ocultarContenido) {
      return (
        <div key={t.id}
          className={`absolute inset-x-0.5 top-0 rounded border-l-2 z-10 ${clase}`}
          style={{ height: `${altoSlots * SLOT_H - 1}px` }}
        />
      )
    }

    const tachado = t.estado === 'reprogramado'
    const tel = t.pacientes?.telefono
    const wappUrl = tel ? `https://wa.me/${tel.replace(/\D/g, '')}` : null
    const dot = radioDot(t.radiografia)
    return (
      <div key={t.id}
        onClick={e => { e.stopPropagation(); setTurnoSeleccionado(t) }}
        className={`absolute inset-x-0.5 top-0 rounded px-1 text-xs border-l-2 cursor-pointer z-10 overflow-hidden ${clase}`}
        style={{ height: `${altoSlots * SLOT_H - 1}px` }}>
        <div className="flex items-start gap-0.5 pt-0.5">
          {dot && <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-0.5 ${dot}`} title={t.radiografia || ''} />}
          <div className="flex-1 min-w-0">
            <p className={`font-medium leading-tight truncate ${tachado ? 'line-through' : ''}`}>
              {t.pacientes?.apellido_nombre}
            </p>
            {(t.practicas?.nombre || t.notas) && (
  <p className="truncate opacity-75 leading-tight">
    {t.practicas?.nombre || t.notas}
  </p>
)}
          </div>
          {!compact && (
            <div className="flex gap-0.5 flex-shrink-0">
              {wappUrl && (
                <a href={wappUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                  <MessageCircle size={9} className="opacity-50 hover:opacity-100" />
                </a>
              )}
              <a href={`/pacientes/${t.pacientes?.id}`} onClick={e => e.stopPropagation()}>
                <UserRound size={9} className="opacity-50 hover:opacity-100" />
              </a>
            </div>
          )}
        </div>
      </div>
    )
  }

  function FilasCeldas({ fecha }: { fecha: Date }) {
    const diaInh = diaInhabilitado(fecha)
    return (
      <>
        {HORARIOS.map(hora => (
          <div key={hora} className="flex border-b border-gray-100" style={{ height: SLOT_H }}>
            {consultorios.map((con, idx) => {
              const habilitada = celdaHabilitada(fecha, hora, idx)
              const ts = turnosEnSlot(fecha, hora, con.id)
              const tieneturno = ts.length > 0

              const bg = diaInh
                ? 'bg-orange-50 cursor-not-allowed'
                : !habilitada
                ? 'bg-red-50 cursor-not-allowed'
                : soloLibres && tieneturno
                ? 'bg-red-100 cursor-not-allowed'
                : tieneturno
                ? ''
                : puedeModificar
                ? 'cursor-pointer hover:bg-blue-50'
                : 'cursor-default'

              return (
                <div key={con.id}
                  className={`flex-1 border-r border-gray-100 last:border-r-0 relative ${bg}`}
                  onClick={() => {
                    if (!habilitada || !puedeModificar || diaInh || (soloLibres && tieneturno)) return
                    abrirFormTurno(fecha, hora, con.id)
                  }}>
                  {ts.map(t => renderTurno(t, consultorios.length > 3, soloLibres))}
                </div>
              )
            })}
          </div>
        ))}
      </>
    )
  }

  function VistaDia() {
    const diaInh = diaInhabilitado(fechaActual)
    const posLinea = posicionHoraActual()
    return (
      <div className="overflow-auto flex-1">
        <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
          <div className={`flex ${diaInh ? 'bg-orange-50' : 'bg-white'}`}>
            <div className="w-14 flex-shrink-0 border-r border-gray-200" />
            <div className="flex-1 flex items-center justify-center py-2">
              {headerDia(fechaActual)}
            </div>
          </div>
          {consultorios.length > 0 && (
            <div className="flex border-t border-gray-100 bg-white">
              <div className="w-14 flex-shrink-0 border-r border-gray-200" />
              {consultorios.map((con, idx) => {
                const hab = celdaHabilitada(fechaActual, '08:00', idx)
                return (
                  <div key={con.id}
                    className={`flex-1 text-center py-1 text-xs font-semibold border-r border-gray-200 last:border-r-0 ${hab ? 'text-gray-600 bg-white' : 'text-red-400 bg-red-50'}`}>
                    {numConsultorio(con.nombre)}
                  </div>
                )
              })}
            </div>
          )}
        </div>
        <div className="flex relative">
          {isToday(fechaActual) && posLinea >= 0 && (
            <div className="absolute left-14 right-0 flex items-center z-10 pointer-events-none"
              style={{ top: `${posLinea}px` }}>
              <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 flex-shrink-0" />
              <div className="flex-1 h-0.5 bg-red-500" />
            </div>
          )}
          <ColumnaHoras />
          <div className="flex-1 min-w-0">
            <FilasCeldas fecha={fechaActual} />
          </div>
        </div>
      </div>
    )
  }

  function VistaSemana() {
    const posLinea = posicionHoraActual()
    return (
      <div className="overflow-auto flex-1">
        <div className="flex sticky top-0 z-20 bg-white border-b border-gray-200">
          <div className="w-14 flex-shrink-0 border-r border-gray-200" />
          {diasSemana.map(dia => {
            const inh = diaInhabilitado(dia)
            return (
              <div key={dia.toISOString()}
                className={`flex-1 border-r border-gray-200 last:border-r-0 ${inh ? 'bg-orange-50' : 'bg-white'}`}
                style={{ minWidth: 0 }}>
                {headerDia(dia, true)}
              </div>
            )
          })}
        </div>
        {consultorios.length > 0 && (
          <div className="flex sticky top-[52px] z-20 bg-white border-b border-gray-200">
            <div className="w-14 flex-shrink-0 border-r border-gray-200" />
            {diasSemana.map(dia => (
              <div key={dia.toISOString()} className="flex-1 flex border-r border-gray-200 last:border-r-0" style={{ minWidth: 0 }}>
                {consultorios.map((con, idx) => {
                  const hab = celdaHabilitada(dia, '08:00', idx)
                  return (
                    <div key={con.id}
                      className={`flex-1 text-center py-1 text-xs font-semibold border-r border-gray-100 last:border-r-0 ${hab ? 'text-gray-400 bg-white' : 'text-red-300 bg-red-50'}`}>
                      {numConsultorio(con.nombre)}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}
        <div className="flex relative">
          <ColumnaHoras />
          {diasSemana.map(dia => (
            <div key={dia.toISOString()} className="flex-1 border-r border-gray-200 last:border-r-0 relative" style={{ minWidth: 0 }}>
              {isToday(dia) && posLinea >= 0 && (
                <div className="absolute left-0 right-0 flex items-center z-10 pointer-events-none"
                  style={{ top: `${posLinea}px` }}>
                  <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 flex-shrink-0" />
                  <div className="flex-1 h-0.5 bg-red-500" />
                </div>
              )}
              <FilasCeldas fecha={dia} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-2 bg-white border-b border-gray-200 flex-shrink-0">
        <button onClick={() => setMiniCalAbierto(!miniCalAbierto)}
          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 flex-shrink-0"
          title={miniCalAbierto ? 'Ocultar calendario' : 'Mostrar calendario'}>
          {miniCalAbierto ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
        </button>
        <button onClick={() => setFechaActual(new Date())}
          className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex-shrink-0">Hoy</button>
        <button onClick={() => navegar(-1)} className="p-1.5 hover:bg-gray-100 rounded-lg flex-shrink-0"><ChevronLeft size={16} /></button>
        <button onClick={() => navegar(1)} className="p-1.5 hover:bg-gray-100 rounded-lg flex-shrink-0"><ChevronRight size={16} /></button>
        <span className="text-sm font-medium text-gray-800 capitalize min-w-44 text-center flex-shrink-0">{tituloNavegacion()}</span>
        <div className="flex-1" />
        {puedeModificar && (
          <button onClick={() => setMostrarBajaDia(true)}
            className="flex items-center gap-1 px-2 py-1 border border-orange-300 text-orange-600 rounded-lg text-xs hover:bg-orange-50 flex-shrink-0">
            <BanIcon size={14} /> Baja del día
          </button>
        )}
        <button onClick={() => { setMostrarBusqueda(!mostrarBusqueda); setBusquedaTexto(''); setResultadosBusqueda([]) }}
          className={`p-1.5 hover:bg-gray-100 rounded-lg ${mostrarBusqueda ? 'bg-blue-50' : ''}`}>
          <Search size={16} className={mostrarBusqueda ? 'text-blue-600' : 'text-gray-600'} />
        </button>
        <button onClick={() => setMostrarFiltros(!mostrarFiltros)}
          className={`p-1.5 hover:bg-gray-100 rounded-lg ${mostrarFiltros ? 'bg-blue-50' : ''}`}>
          <SlidersHorizontal size={16} className={mostrarFiltros ? 'text-blue-600' : 'text-gray-600'} />
        </button>
        <select value={sucursalId} onChange={e => setSucursalId(e.target.value)}
          className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none">
          {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </select>
        <select value={vista} onChange={e => setVista(e.target.value as Vista)}
          className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none">
          <option value="dia">Día</option>
          <option value="semana">Semana</option>
          <option value="mes">Mes</option>
          <option value="año">Año</option>
        </select>
      </div>

      {mostrarBusqueda && (
        <div className="px-4 py-2 bg-white border-b border-gray-200 flex-shrink-0">
          <div className="relative max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input autoFocus value={busquedaTexto}
              onChange={e => { setBusquedaTexto(e.target.value); buscarTurnos(e.target.value) }}
              placeholder="Buscar paciente, práctica o profesional..."
              className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {resultadosBusqueda.length > 0 && (
            <div className="mt-2 border border-gray-200 rounded-lg max-h-60 overflow-y-auto bg-white shadow-lg">
              {resultadosBusqueda.map(t => (
                <div key={t.id}
                  onClick={() => { setTurnoSeleccionado(t); setMostrarBusqueda(false) }}
                  className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0">
                  <div className="flex justify-between">
                    <span className="font-medium">{t.pacientes?.apellido_nombre}</span>
                    <span className="text-xs text-gray-400">{format(toLocalAR(t.fecha_hora), 'dd/MM/yyyy HH:mm')}</span>
                  </div>
                  <div className="text-xs text-gray-500 flex gap-2 mt-0.5">
                    <span>{t.profesionales?.usuarios?.nombre}</span>
                    {t.practicas?.nombre && <span>· {t.practicas.nombre}</span>}
                    <span className={`ml-auto px-1.5 rounded-full border ${claseDeEstado(t.estado)}`}>{t.estado}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {busquedaTexto.length >= 2 && resultadosBusqueda.length === 0 && (
            <p className="text-xs text-gray-400 mt-2">Sin resultados</p>
          )}
        </div>
      )}

      {mostrarFiltros && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-200 flex-shrink-0">
          <span className="text-sm text-gray-600 font-medium">Filtrar:</span>
          <select value={profesionalFiltro} onChange={e => setProfesionalFiltro(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none">
            <option value="">Todos los profesionales</option>
            {profesionales.map(p => <option key={p.id} value={p.id}>{p.usuarios?.nombre}</option>)}
          </select>
          <select value={especialidadFiltro} onChange={e => setEspecialidadFiltro(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none">
            <option value="">Todas las especialidades</option>
            {especialidades.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
          <select value={estadoFiltro} onChange={e => setEstadoFiltro(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none">
            <option value="">Todos los estados</option>
            {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
          </select>
          <select value={radioFiltro} onChange={e => setRadioFiltro(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none">
            <option value="">Todas las radiografías</option>
            {RADIO_ESTADOS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={soloLibres} onChange={e => setSoloLibres(e.target.checked)}
              className="rounded border-gray-300 text-blue-600" />
            Solo libres
          </label>
          <button onClick={() => {
            setProfesionalFiltro(''); setEspecialidadFiltro(''); setEstadoFiltro('')
            setRadioFiltro(''); setSoloLibres(false); setMostrarFiltros(false)
          }} className="text-sm text-gray-500 hover:text-gray-700 ml-auto">Limpiar</button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {miniCalAbierto && (
          <div className="w-44 flex-shrink-0 border-r border-gray-200 bg-white p-3 overflow-y-auto">
            <MiniCalendario fecha={fechaActual} onSelect={setFechaActual} />
          </div>
        )}
        <div className="flex-1 flex flex-col overflow-hidden">
          {vista === 'dia' && <VistaDia />}
          {vista === 'semana' && <VistaSemana />}
          {vista === 'mes' && (
            <div className="overflow-auto flex-1 p-2">
              <div className="grid grid-cols-7 mb-1">
                {['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'].map(d => (
                  <div key={d} className="text-center text-xs font-medium text-gray-500 py-1">{d}</div>
                ))}
              </div>
              {eachWeekOfInterval({ start: startOfMonth(fechaActual), end: endOfMonth(fechaActual) }, { weekStartsOn: 1 }).map(semana => (
                <div key={semana.toISOString()} className="grid grid-cols-7">
                  {eachDayOfInterval({ start: semana, end: addDays(semana, 6) }).map(dia => {
                    const ts = turnosDia(dia)
                    const esEsteMes = isSameMonth(dia, fechaActual)
                    const diaInh = diaInhabilitado(dia)
                    return (
                      <div key={dia.toISOString()}
                        onClick={() => { setFechaActual(dia); setVista('dia') }}
                        className={`min-h-20 border border-gray-100 p-1 cursor-pointer hover:bg-gray-50 ${!esEsteMes ? 'opacity-40' : ''} ${diaInh ? 'bg-orange-50' : ''}`}>
                        <div className="flex items-center gap-1">
                          <span className={`text-sm font-medium inline-flex items-center justify-center w-6 h-6 ${isToday(dia) ? 'bg-blue-600 text-white rounded-full' : 'text-gray-700'}`}>
                            {format(dia, 'd')}
                          </span>
                          {diaInh && <span className="text-xs text-orange-500" title={diaInh.motivo}>🚫</span>}
                        </div>
                        <div className="mt-1 space-y-0.5">
                          {ts.slice(0, 3).map(t => (
                            <div key={t.id} className={`text-xs rounded px-1 truncate border-l-2 ${claseDeEstado(t.estado)}`}>
                              {t.pacientes?.apellido_nombre}
                            </div>
                          ))}
                          {ts.length > 3 && <div className="text-xs text-gray-500">+{ts.length - 3} más</div>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
          {vista === 'año' && (
            <div className="overflow-auto flex-1 p-6 grid grid-cols-4 gap-6">
              {MESES.map((mes, idx) => {
                const fechaMes = new Date(fechaActual.getFullYear(), idx, 1)
                return (
                  <div key={mes}>
                    <h3 className="text-sm font-semibold text-gray-800 mb-2">{mes}</h3>
                    <div className="grid grid-cols-7 gap-0">
                      {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                        <div key={d} className="text-center text-xs text-gray-400">{d}</div>
                      ))}
                      {eachWeekOfInterval({ start: startOfMonth(fechaMes), end: endOfMonth(fechaMes) }, { weekStartsOn: 1 }).map(semana =>
                        eachDayOfInterval({ start: semana, end: addDays(semana, 6) }).map(dia => {
                          const esEsteMes = isSameMonth(dia, fechaMes)
                          const ts = turnosDia(dia)
                          const diaInh = diaInhabilitado(dia)
                          return (
                            <div key={dia.toISOString()}
                              onClick={() => { setFechaActual(dia); setVista('dia') }}
                              className={`text-center text-xs py-0.5 cursor-pointer rounded ${!esEsteMes ? 'opacity-20' : ''} ${isToday(dia) ? 'bg-blue-600 text-white rounded-full' : diaInh ? 'bg-orange-100 text-orange-600' : ts.length > 0 ? 'text-blue-600 font-medium' : 'text-gray-700 hover:bg-blue-50'}`}>
                              {format(dia, 'd')}
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {mostrarFormTurno && (
        <FormularioTurno
          fechaHora={fechaHoraSeleccionada}
          sucursalId={sucursalId}
          consultorioPreseleccionado={consultorioPreseleccionado}
          horariosProf={horariosProf}
          ausencias={ausencias}
          consultorios={consultorios}
          profesionalesActivosEnFecha={profesionalesActivosEnFecha}
          onClose={() => setMostrarFormTurno(false)}
          onGuardado={() => { setMostrarFormTurno(false); cargarTurnos() }} />
      )}
      {turnoSeleccionado && (
        <DetalleTurno turno={turnoSeleccionado} puedeModificar={puedeModificar}
          onClose={() => setTurnoSeleccionado(null)}
          onActualizado={() => { setTurnoSeleccionado(null); cargarTurnos() }}
          onIrACaja={t => { setTurnoSeleccionado(null); navigate('/caja', { state: { turno: t } }) }} />
      )}
      {mostrarBajaDia && (
        <ModalBajaDia sucursales={sucursales}
          onClose={() => setMostrarBajaDia(false)}
          onGuardado={() => { setMostrarBajaDia(false); cargarDiasInhabilitados() }} />
      )}
    </div>
  )
}

// ── Mini calendario ───────────────────────────────────────────────────────────
function MiniCalendario({ fecha, onSelect }: { fecha: Date; onSelect: (d: Date) => void }) {
  const [mes, setMes] = useState(new Date(fecha))
  return (
    <div className="text-xs">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-gray-700 capitalize">{format(mes, 'MMMM yyyy', { locale: es })}</span>
        <div className="flex gap-1">
          <button onClick={() => setMes(subMonths(mes, 1))} className="p-0.5 hover:bg-gray-100 rounded"><ChevronLeft size={12} /></button>
          <button onClick={() => setMes(addMonths(mes, 1))} className="p-0.5 hover:bg-gray-100 rounded"><ChevronRight size={12} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 text-center">
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => <div key={d} className="text-gray-400 pb-1">{d}</div>)}
        {eachWeekOfInterval({ start: startOfMonth(mes), end: endOfMonth(mes) }, { weekStartsOn: 1 }).map(semana =>
          eachDayOfInterval({ start: semana, end: addDays(semana, 6) }).map(dia => (
            <div key={dia.toISOString()} onClick={() => onSelect(dia)}
              className={`cursor-pointer rounded-full w-5 h-5 flex items-center justify-center mx-auto my-0.5
                ${isSameDay(dia, fecha) ? 'bg-blue-600 text-white' : ''}
                ${isToday(dia) && !isSameDay(dia, fecha) ? 'text-blue-600 font-bold' : ''}
                ${!isSameMonth(dia, mes) ? 'text-gray-300' : 'text-gray-700 hover:bg-gray-100'}`}>
              {format(dia, 'd')}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ── Modal Baja del día ────────────────────────────────────────────────────────
function ModalBajaDia({ sucursales, onClose, onGuardado }: {
  sucursales: Sucursal[]; onClose: () => void; onGuardado: () => void
}) {
  const [form, setForm] = useState({ fecha: format(new Date(), 'yyyy-MM-dd'), sucursal_id: 'ambas', motivo: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.motivo.trim()) { setError('Ingresá un motivo'); return }
    setLoading(true)
    const { data: user } = await supabase.auth.getUser()
    const creado_por = user.user?.id
    if (form.sucursal_id === 'ambas') {
      for (const s of sucursales) {
        await supabase.from('dias_inhabilitados').insert({ fecha: form.fecha, sucursal_id: s.id, motivo: form.motivo, creado_por })
      }
    } else {
      await supabase.from('dias_inhabilitados').insert({ fecha: form.fecha, sucursal_id: form.sucursal_id, motivo: form.motivo, creado_por })
    }
    setLoading(false); onGuardado()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-gray-800">Baja del día</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
            <input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal</label>
            <select value={form.sucursal_id} onChange={e => setForm({ ...form, sucursal_id: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="ambas">Ambas sucursales</option>
              {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
            <input value={form.motivo} onChange={e => setForm({ ...form, motivo: e.target.value })}
              placeholder="Ej: Feriado, Mantenimiento..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-orange-500 text-white rounded-lg py-2 text-sm hover:bg-orange-600 disabled:opacity-50">
              {loading ? 'Guardando...' : 'Inhabilitar día'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Formulario nuevo turno ────────────────────────────────────────────────────
function FormularioTurno({ fechaHora, sucursalId, consultorioPreseleccionado, horariosProf, ausencias, consultorios, profesionalesActivosEnFecha, onClose, onGuardado }: {
  fechaHora: Date | null
  sucursalId: string
  consultorioPreseleccionado?: string
  horariosProf: HorarioProfesional[]
  ausencias: AusenciaProfesional[]
  consultorios: Consultorio[]
  profesionalesActivosEnFecha: (fecha: Date, hora: string) => number
  onClose: () => void
  onGuardado: () => void
}) {
  const [pacientes, setPacientes] = useState<any[]>([])
  const [profesionales, setProfesionales] = useState<any[]>([])
  const [todasLasPracticas, setTodasLasPracticas] = useState<any[]>([])
  const CONTROL_AGENDA_ID = '__control__'
  const [tratamientosPaciente, setTratamientosPaciente] = useState<any[]>([])
  const [advertenciaProf, setAdvertenciaProf] = useState('')
  const [practicasFiltradas, setPracticasFiltradas] = useState<any[]>([])
  const [busquedaPaciente, setBusquedaPaciente] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    paciente_id: '', profesional_id: '',
    consultorio_id: consultorioPreseleccionado || '',
    practica_id: '', radiografia: '',
    fecha_hora: fechaHora ? format(fechaHora, "yyyy-MM-dd'T'HH:mm") : '',
    duracion_minutos: 15, notas: '', estado: 'agendado'
  })

  useEffect(() => {
    const dt = fechaHora
    const diaSemana = dt ? dt.getDay() : -1
    const hora = dt
      ? `${dt.getHours().toString().padStart(2, '0')}:${dt.getMinutes().toString().padStart(2, '0')}`
      : ''
    const fechaStr = dt ? format(dt, 'yyyy-MM-dd') : ''

    Promise.all([
      supabase.from('profesionales').select('*, usuarios(nombre)').eq('activo', true),
      supabase.from('practicas').select('*').eq('activa', true).order('nombre')
    ]).then(([{ data: profs }, { data: pracs }]) => {
      let profsFiltrados = profs || []

      // Filtrar profesionales con horario activo ese día y hora, sin ausencias
      if (dt && diaSemana >= 0 && hora) {
        const profsConHorario = new Set(
          horariosProf
            .filter(hp =>
              hp.dia_semana === diaSemana &&
              hora >= normHora(hp.hora_inicio) &&
              hora < normHora(hp.hora_fin)
            )
            .map(hp => hp.profesional_id)
        )
        profsFiltrados = profsFiltrados.filter(p =>
          profsConHorario.has(p.id) &&
          !ausencias.some(a =>
            a.profesional_id === p.id &&
            a.fecha_desde <= fechaStr &&
            a.fecha_hasta >= fechaStr
          )
        )
      }

      setProfesionales(profsFiltrados)
      setTodasLasPracticas(pracs || [])
      setPracticasFiltradas(pracs || [])
    })
  }, [])
useEffect(() => {
  if (!form.paciente_id) { setTratamientosPaciente([]); setAdvertenciaProf(''); return }
  supabase.from('tratamientos')
    .select('profesional_id, tipo_material, profesionales(usuarios(nombre))')
    .eq('paciente_id', form.paciente_id)
    .in('estado', ['en tratamiento', 'en finalizacion'])
    .then(({ data }) => setTratamientosPaciente(data || []))
}, [form.paciente_id])

useEffect(() => {
  if (form.practica_id !== CONTROL_AGENDA_ID || !form.profesional_id || tratamientosPaciente.length === 0) {
    setAdvertenciaProf(''); return
  }
  const tto = tratamientosPaciente[0]
  if (tto && tto.profesional_id !== form.profesional_id) {
    const nombre = tto.profesionales?.usuarios?.nombre || 'otro profesional'
    setAdvertenciaProf(`Este paciente sigue su tratamiento con ${nombre}. ¿Desea agendarlo de todas formas?`)
  } else {
    setAdvertenciaProf('')
  }
}, [form.practica_id, form.profesional_id, tratamientosPaciente])
  async function handleProfesionalChange(profesionalId: string) {
    setForm(f => ({ ...f, profesional_id: profesionalId, practica_id: '' }))
    if (!profesionalId) {
      setPracticasFiltradas(todasLasPracticas)
      return
    }
    const { data: espIds } = await supabase
      .from('profesional_especialidades')
      .select('especialidad_id')
      .eq('profesional_id', profesionalId)
    if (!espIds || espIds.length === 0) {
      setPracticasFiltradas(todasLasPracticas)
      return
    }
    const ids = espIds.map((e: any) => e.especialidad_id)
    setPracticasFiltradas(
      todasLasPracticas.filter(p => !p.especialidad_id || ids.includes(p.especialidad_id))
    )
  }

  async function buscarPacientes(q: string) {
    if (q.length < 2) { setPacientes([]); return }
    const { data } = await supabase.from('pacientes').select('id, apellido_nombre, dni')
      .eq('activo', true).or(`apellido_nombre.ilike.%${q}%,dni.ilike.%${q}%`).limit(10)
    setPacientes(data || [])
  }

  function validarHorarioProfesional(): string | null {
    if (!form.profesional_id || !form.fecha_hora) return null
    const dt = new Date(form.fecha_hora)
    const diaSemana = dt.getDay()
    const hora = `${dt.getHours().toString().padStart(2, '0')}:${dt.getMinutes().toString().padStart(2, '0')}`
    const fechaStr = format(dt, 'yyyy-MM-dd')
    const ausente = ausencias.some(a =>
      a.profesional_id === form.profesional_id &&
      a.fecha_desde <= fechaStr && a.fecha_hasta >= fechaStr
    )
    if (ausente) return 'El profesional tiene una ausencia registrada para esa fecha'
    const tieneHorario = horariosProf.some(hp =>
      hp.profesional_id === form.profesional_id &&
      hp.dia_semana === diaSemana &&
      hora >= normHora(hp.hora_inicio) &&
      hora < normHora(hp.hora_fin)
    )
    if (!tieneHorario) return 'El profesional no tiene horario asignado para ese día y hora'
    return null
  }

  function validarConsultorioHabilitado(): string | null {
    if (!form.consultorio_id || !form.fecha_hora) return null
    const dt = new Date(form.fecha_hora)
    const hora = `${dt.getHours().toString().padStart(2, '0')}:${dt.getMinutes().toString().padStart(2, '0')}`
    const activos = profesionalesActivosEnFecha(dt, hora)
    if (activos === 0) return 'No hay profesionales activos para ese día y hora'
    const idx = consultorios.findIndex(c => c.id === form.consultorio_id)
    if (idx >= activos) {
      const nombresHabilitados = consultorios.slice(0, activos).map(c => numConsultorio(c.nombre)).join(', ')
      return `Solo hay ${activos} consultorio${activos > 1 ? 's' : ''} habilitado${activos > 1 ? 's' : ''} para ese horario. Agendá en: ${nombresHabilitados}`
    }
    return null
  }

  async function validarConsultorioLibreParaProfesional(): Promise<string | null> {
  if (!form.consultorio_id || !form.profesional_id || !form.fecha_hora) return null
  const dt = new Date(form.fecha_hora)
  const fechaStr = format(dt, 'yyyy-MM-dd')
  const hora = `${dt.getHours().toString().padStart(2, '0')}:${dt.getMinutes().toString().padStart(2, '0')}`
  const franja = franjaHoraria(hora)
  const desdeUTC = toUTC(new Date(`${fechaStr}T00:00:00`))
  const hastaUTC = toUTC(new Date(`${fechaStr}T23:59:59`))
  const { data: turnosConsultorio } = await supabase
    .from('turnos')
    .select('profesional_id, fecha_hora')
    .eq('consultorio_id', form.consultorio_id)
    .gte('fecha_hora', desdeUTC)
    .lte('fecha_hora', hastaUTC)
    .neq('estado', 'cancelado')
    .neq('estado', 'reprogramado')

  if (!turnosConsultorio || turnosConsultorio.length === 0) return null

  const turnosEnFranja = turnosConsultorio.filter(t => {
    const horaLocal = toLocalAR(t.fecha_hora)
    const horaStr = `${horaLocal.getHours().toString().padStart(2, '0')}:${horaLocal.getMinutes().toString().padStart(2, '0')}`
    return franjaHoraria(horaStr) === franja
  })

  if (turnosEnFranja.length === 0) return null

  const profExistente = turnosEnFranja[0].profesional_id
  if (profExistente !== form.profesional_id) {
    const consultoriosOcupados = new Set<string>()
    const { data: todosLosTurnos } = await supabase
      .from('turnos')
      .select('consultorio_id, fecha_hora')
      .gte('fecha_hora', desdeUTC)
      .lte('fecha_hora', hastaUTC)
      .neq('estado', 'cancelado')
      .neq('estado', 'reprogramado')

    ;(todosLosTurnos || []).forEach(t => {
      const horaLocal = toLocalAR(t.fecha_hora)
      const horaStr = `${horaLocal.getHours().toString().padStart(2, '0')}:${horaLocal.getMinutes().toString().padStart(2, '0')}`
      if (franjaHoraria(horaStr) === franja) consultoriosOcupados.add(t.consultorio_id)
    })

      const activos = profesionalesActivosEnFecha(dt, hora)
      const consultoriosLibres = consultorios
        .filter((c, idx) => idx < activos && !consultoriosOcupados.has(c.id))
        .map(c => c.nombre)

    if (consultoriosLibres.length > 0) {
      return `Ese consultorio ya está asignado a otro profesional. Consultorio${consultoriosLibres.length > 1 ? 's' : ''} libre${consultoriosLibres.length > 1 ? 's' : ''}: ${consultoriosLibres.join(', ')}`
    }
    return 'Ese consultorio ya está asignado a otro profesional en esta franja horaria'
  }

  return null
}

  async function validarConsultorioProfesional(): Promise<string | null> {
    if (!form.profesional_id || !form.consultorio_id || !form.fecha_hora) return null
    const dt = new Date(form.fecha_hora)
    const fechaStr = format(dt, 'yyyy-MM-dd')
    const hora = `${dt.getHours().toString().padStart(2, '0')}:${dt.getMinutes().toString().padStart(2, '0')}`
    const franja = franjaHoraria(hora)
    const desdeUTC = toUTC(new Date(`${fechaStr}T00:00:00`))
    const hastaUTC = toUTC(new Date(`${fechaStr}T23:59:59`))
    const { data: turnosDia } = await supabase
      .from('turnos')
      .select('consultorio_id, fecha_hora, consultorios(nombre)')
      .eq('profesional_id', form.profesional_id)
      .gte('fecha_hora', desdeUTC)
      .lte('fecha_hora', hastaUTC)
      .neq('estado', 'cancelado')
      .neq('estado', 'reprogramado')
    if (!turnosDia || turnosDia.length === 0) return null
    const turnosEnFranja = turnosDia.filter(t => {
      const horaLocal = toLocalAR(t.fecha_hora)
      const horaStr = `${horaLocal.getHours().toString().padStart(2, '0')}:${horaLocal.getMinutes().toString().padStart(2, '0')}`
      return franjaHoraria(horaStr) === franja
    })
    if (turnosEnFranja.length === 0) return null
    const consultorioExistente = turnosEnFranja[0].consultorio_id
    if (consultorioExistente !== form.consultorio_id) {
      const nombreCon = (turnosEnFranja[0] as any).consultorios?.nombre || consultorioExistente
      return `El profesional atiende en ${nombreCon} en esta franja horaria`
    }
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('')
    if (!form.paciente_id) { setError('Seleccioná un paciente'); setLoading(false); return }
    if (!form.profesional_id) { setError('Seleccioná un profesional'); setLoading(false); return }
    if (!form.consultorio_id) { setError('Seleccioná un consultorio'); setLoading(false); return }
    if (!form.fecha_hora) { setError('Ingresá fecha y hora'); setLoading(false); return }

    const errorHorario = validarHorarioProfesional()
    if (errorHorario) { setError(errorHorario); setLoading(false); return }

    const errorConsultorioHab = validarConsultorioHabilitado()
    if (errorConsultorioHab) { setError(errorConsultorioHab); setLoading(false); return }

    const errorConsultorioOcupado = await validarConsultorioLibreParaProfesional()
    if (errorConsultorioOcupado) { setError(errorConsultorioOcupado); setLoading(false); return } 

    const errorConsultorio = await validarConsultorioProfesional()
    if (errorConsultorio) { setError(errorConsultorio); setLoading(false); return }

    const fechaLocalAR = new Date(form.fecha_hora)
    const fechaUTC = toUTC(fechaLocalAR)

    const { data: existente } = await supabase.from('turnos').select('id')
      .eq('consultorio_id', form.consultorio_id).eq('fecha_hora', fechaUTC).maybeSingle()
    if (existente) { setError('Ya existe un turno en ese consultorio a esa hora'); setLoading(false); return }

    const { error: err } = await supabase.from('turnos').insert({
      paciente_id: form.paciente_id, profesional_id: form.profesional_id,
      consultorio_id: form.consultorio_id, practica_id: (form.practica_id && form.practica_id !== CONTROL_AGENDA_ID) ? form.practica_id : null,
      radiografia: form.radiografia || null, sucursal_id: sucursalId,
      fecha_hora: fechaUTC, duracion_minutos: form.duracion_minutos,
      notas: form.practica_id === CONTROL_AGENDA_ID && !form.notas ? 'Control de tratamiento' : form.notas,
estado: form.estado,
    })
    if (err) {
      setError(err.code === '23505' ? 'Ya existe un turno en ese consultorio a esa hora' : `Error: ${err.message}`)
    } else { onGuardado() }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Nuevo turno</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Paciente *</label>
            <input value={busquedaPaciente}
              onChange={e => { setBusquedaPaciente(e.target.value); buscarPacientes(e.target.value) }}
              placeholder="Buscar por nombre o DNI..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {pacientes.length > 0 && (
              <div className="border border-gray-200 rounded-lg mt-1 max-h-40 overflow-y-auto">
                {pacientes.map(p => (
                  <div key={p.id}
                    onClick={() => { setForm(f => ({ ...f, paciente_id: p.id })); setBusquedaPaciente(p.apellido_nombre); setPacientes([]) }}
                    className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer">
                    {p.apellido_nombre} <span className="text-gray-400 text-xs">{p.dni}</span>
                  </div>
                ))}
              </div>
            )}
            {form.paciente_id && <p className="text-xs text-green-600 mt-1">✓ Paciente seleccionado</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Profesional *</label>
            <select value={form.profesional_id}
              onChange={e => handleProfesionalChange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">-- Seleccioná --</option>
              {profesionales.map(p => <option key={p.id} value={p.id}>{p.usuarios?.nombre}</option>)}
            </select>
            {advertenciaProf && (
  <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 text-sm text-yellow-800 flex items-start gap-2">
    <span>⚠️</span>
    <span>{advertenciaProf}</span>
  </div>
)}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Consultorio *</label>
            <select value={form.consultorio_id} onChange={e => setForm(f => ({ ...f, consultorio_id: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">-- Seleccioná --</option>
                {(() => {
                  if (!form.fecha_hora) return consultorios
                  const dt = new Date(form.fecha_hora)
                  const hora = `${dt.getHours().toString().padStart(2, '0')}:${dt.getMinutes().toString().padStart(2, '0')}`
                  const activos = profesionalesActivosEnFecha(dt, hora)
                  return activos > 0 ? consultorios.slice(0, activos) : consultorios
                })().map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Práctica
              {form.profesional_id && <span className="text-xs text-gray-400 ml-1">(filtrada por especialidad)</span>}
            </label>
            <select value={form.practica_id} onChange={e => setForm(f => ({ ...f, practica_id: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">-- Sin práctica --</option>
<option value={CONTROL_AGENDA_ID}>⭐ Control de tratamiento</option>
{practicasFiltradas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Radiografía</label>
            <select value={form.radiografia} onChange={e => setForm(f => ({ ...f, radiografia: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">-- Sin indicación --</option>
              {RADIO_ESTADOS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y hora *</label>
            <input type="datetime-local" value={form.fecha_hora}
              onChange={e => setForm(f => ({ ...f, fecha_hora: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duración</label>
            <select value={form.duracion_minutos} onChange={e => setForm(f => ({ ...f, duracion_minutos: Number(e.target.value) }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value={15}>15 minutos</option>
              <option value={30}>30 minutos</option>
              <option value={45}>45 minutos</option>
              <option value={60}>60 minutos</option>
              <option value={90}>90 minutos</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
              rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3"><p className="text-red-600 text-sm">{error}</p></div>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Guardando...' : 'Guardar turno'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Detalle turno ─────────────────────────────────────────────────────────────
function DetalleTurno({ turno, puedeModificar, onClose, onActualizado, onIrACaja }: {
  turno: Turno; puedeModificar: boolean; onClose: () => void
  onActualizado: () => void; onIrACaja: (t: Turno) => void
}) {
  const [practicas, setPracticas] = useState<any[]>([])
  const [notas, setNotas] = useState(turno.notas || '')
  const [estado, setEstado] = useState(turno.estado)
  const [practicaId, setPracticaId] = useState(turno.practica_id || '')
  const [radiografia, setRadiografia] = useState(turno.radiografia || '')
  const [guardando, setGuardando] = useState(false)
  const [confirmarEliminar, setConfirmarEliminar] = useState(false)

  useEffect(() => {
    supabase.from('practicas').select('*').eq('activa', true).order('nombre')
      .then(({ data }) => setPracticas(data || []))
  }, [])

  const tel = turno.pacientes?.telefono
  const wappUrl = tel ? `https://wa.me/${tel.replace(/\D/g, '')}` : null
  const radioInfo = RADIO_ESTADOS.find(r => r.value === radiografia)

  async function guardar() {
    setGuardando(true)
    await supabase.from('turnos').update({
      notas, estado, practica_id: practicaId || null, radiografia: radiografia || null
    }).eq('id', turno.id)
    setGuardando(false); onActualizado()
  }

  async function eliminar() {
    await supabase.from('turnos').delete().eq('id', turno.id); onActualizado()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Detalle del turno</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400">Paciente</p>
              <p className="font-medium text-gray-800">{turno.pacientes?.apellido_nombre}</p>
              {tel && <p className="text-xs text-gray-500 mt-0.5">{tel}</p>}
            </div>
            <div className="flex gap-1.5 mt-1">
              {wappUrl && (
                <a href={wappUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-green-600 border border-green-200 rounded px-2 py-1 hover:bg-green-50">
                  <MessageCircle size={12} /> WA
                </a>
              )}
              <a href={`/pacientes/${turno.pacientes?.id}`}
                className="flex items-center gap-1 text-xs text-blue-600 border border-blue-200 rounded px-2 py-1 hover:bg-blue-50">
                <UserRound size={12} /> Ficha
              </a>
            </div>
          </div>
          <div><p className="text-xs text-gray-400">Profesional</p><p className="text-gray-800">{turno.profesionales?.usuarios?.nombre}</p></div>
          <div><p className="text-xs text-gray-400">Consultorio</p><p className="text-gray-800">{turno.consultorios?.nombre}</p></div>
          <div>
            <p className="text-xs text-gray-400">Fecha y hora</p>
            <p className="text-gray-800">{format(toLocalAR(turno.fecha_hora), "dd/MM/yyyy 'a las' HH:mm")}</p>
          </div>
          {puedeModificar ? (
            <>
              <div>
                <p className="text-xs text-gray-400 mb-1">Práctica</p>
                <select value={practicaId} onChange={e => setPracticaId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Sin práctica --</option>
                  {practicas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Radiografía</p>
                <select value={radiografia} onChange={e => setRadiografia(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Sin indicación --</option>
                  {RADIO_ESTADOS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Estado</p>
                <select value={estado} onChange={e => setEstado(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                </select>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Notas</p>
                <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </>
          ) : (
            <>
              {turno.practicas?.nombre && <div><p className="text-xs text-gray-400">Práctica</p><p className="text-gray-800">{turno.practicas.nombre}</p></div>}
              {radiografia && radioInfo && (
                <div>
                  <p className="text-xs text-gray-400">Radiografía</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${radioInfo.clase}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${radioInfo.dot}`} />
                    {radioInfo.label}
                  </span>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400">Estado</p>
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs border ${claseDeEstado(estado)}`}>{estado}</span>
              </div>
              {notas && <div><p className="text-xs text-gray-400">Notas</p><p className="text-gray-800">{notas}</p></div>}
            </>
          )}
        </div>
        {puedeModificar ? (
          <>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setConfirmarEliminar(true)}
                className="border border-red-300 text-red-500 rounded-lg py-2 px-3 text-sm hover:bg-red-50">Eliminar</button>
              <button onClick={guardar} disabled={guardando}
                className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700 disabled:opacity-50">
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
            <button onClick={() => onIrACaja(turno)}
              className="w-full mt-2 flex items-center justify-center gap-2 border border-green-300 text-green-700 rounded-lg py-2 text-sm hover:bg-green-50">
              <CreditCard size={14} /> Ir a Caja
            </button>
            {confirmarEliminar && (
              <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-700 mb-2">¿Seguro que querés eliminar este turno?</p>
                <div className="flex gap-2">
                  <button onClick={() => setConfirmarEliminar(false)}
                    className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-1.5 text-sm hover:bg-gray-50">Cancelar</button>
                  <button onClick={eliminar}
                    className="flex-1 bg-red-500 text-white rounded-lg py-1.5 text-sm hover:bg-red-600">Sí, eliminar</button>
                </div>
              </div>
            )}
          </>
        ) : (
          <button onClick={onClose} className="w-full mt-4 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm hover:bg-gray-50">Cerrar</button>
        )}
      </div>
    </div>
  )
}
