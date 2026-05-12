import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

const DIAS_NOMBRES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

function obtenerLunesActual() {
  const hoy = new Date()
  const dia = hoy.getDay()
  const diff = dia === 0 ? -6 : 1 - dia
  const lunes = new Date(hoy)
  lunes.setDate(hoy.getDate() + diff)
  lunes.setHours(0, 0, 0, 0)
  return lunes
}

function formatFecha(fecha) {
  return fecha.toISOString().split('T')[0]
}

function generarHorarios(horaInicio, horaFin, bloquesInhabilitados, diaSemana, espaciadoMin, duracionBloqueMin) {
  const horarios = []
  const [hI, mI] = horaInicio.split(':').map(Number)
  const [hF, mF] = horaFin.split(':').map(Number)
  let actual = hI * 60 + mI
  const fin = hF * 60 + mF - 15

  // Generar bloques automáticos por espaciado
  const bloquesAuto = []
  if (espaciadoMin && duracionBloqueMin) {
    let bloqueActual = hI * 60 + mI + espaciadoMin
    while (bloqueActual + duracionBloqueMin <= hF * 60 + mF) {
      bloquesAuto.push({ inicio: bloqueActual, fin: bloqueActual + duracionBloqueMin })
      bloqueActual += espaciadoMin + duracionBloqueMin
    }
  }

  while (actual <= fin) {
    const horas = Math.floor(actual / 60)
    const minutos = actual % 60
    const horaStr = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`

    const inhabilitadoManual = bloquesInhabilitados.some(b => {
      if (b.dia_semana !== diaSemana) return false
      const [bHI, bMI] = b.hora_inicio.split(':').map(Number)
      const [bHF, bMF] = b.hora_fin.split(':').map(Number)
      return actual >= bHI * 60 + bMI && actual < bHF * 60 + bMF
    })

    const inhabilitadoAuto = bloquesAuto.some(b => actual >= b.inicio && actual < b.fin)

    horarios.push({ hora: horaStr, inhabilitado: inhabilitadoManual || inhabilitadoAuto })
    actual += 15
  }
  return horarios
}

function Agenda() {
  const [profesionales, setProfesionales] = useState([])
  const [profesionalSeleccionado, setProfesionalSeleccionado] = useState(null)
  const [turnosSemana, setTurnosSemana] = useState([])
  const [ausencias, setAusencias] = useState([])
  const [horarios, setHorarios] = useState([])
  const [bloques, setBloques] = useState([])
  const [diasEspecialidad, setDiasEspecialidad] = useState([])
  const [cierres, setCierres] = useState([])
  const [semanaActual, setSemanaActual] = useState(obtenerLunesActual())
  const [modalTurno, setModalTurno] = useState(null)
  const [modalHorarios, setModalHorarios] = useState(false)
  const [modalBloque, setModalBloque] = useState(false)
  const [modalEspecialidad, setModalEspecialidad] = useState(false)
  const [modalCierres, setModalCierres] = useState(false)
  const [nota, setNota] = useState('')

  const [horarioFrecuencia, setHorarioFrecuencia] = useState('siempre')
  const [horarioFechaEsp, setHorarioFechaEsp] = useState('')
  const [horarioEspaciado, setHorarioEspaciado] = useState('')
  const [horarioDuracionBloque, setHorarioDuracionBloque] = useState('')

  const [horarioEditando, setHorarioEditando] = useState(null)
  const [horarioDia, setHorarioDia] = useState(0)
  const [horarioInicio, setHorarioInicio] = useState('08:00')
  const [horarioFin, setHorarioFin] = useState('14:00')

  const [bloqueEditando, setBloqueEditando] = useState(null)
  const [bloqueDia, setBloqueDia] = useState(0)
  const [bloqueInicio, setBloqueInicio] = useState('10:00')
  const [bloqueFin, setBloqueFin] = useState('10:30')
  const [bloqueMotivo, setBloqueMotivo] = useState('')

  const [espEditando, setEspEditando] = useState(null)
  const [espFecha, setEspFecha] = useState('')
  const [espSuplente, setEspSuplente] = useState('')
  const [espMotivo, setEspMotivo] = useState('')

  const [cierreEditando, setCierreEditando] = useState(null)
  const [cierreFecha, setCierreFecha] = useState('')
  const [cierreMotivo, setCierreMotivo] = useState('')
  const [cierreTipo, setCierreTipo] = useState('feriado')

  const { usuario } = useAuth()
  const usuarioActual = usuario || JSON.parse(localStorage.getItem('usuario'))
  const esAdminOEncargada = ['admin', 'superadmin', 'encargada'].includes(usuarioActual?.rol)
  const esProfesional = usuarioActual?.rol === 'profesional'

  function obtenerDiasSemana(lunes) {
    return Array.from({ length: 6 }, (_, i) => {
      const dia = new Date(lunes)
      dia.setDate(lunes.getDate() + i)
      return dia
    })
  }

  const diasSemana = obtenerDiasSemana(semanaActual)
  const mesAnio = semanaActual.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
    .replace(' de ', ' ').replace(/^\w/, c => c.toUpperCase())

  const cargarProfesionales = async () => {
    const res = await fetch('http://localhost:3000/api/usuarios/profesionales')
    const data = await res.json()
    setProfesionales(data)
    if (esProfesional) setProfesionalSeleccionado(usuarioActual)
    else if (data.length > 0) setProfesionalSeleccionado(data[0])
  }

  const cargarDatos = async () => {
    if (!profesionalSeleccionado) return
    const inicio = formatFecha(diasSemana[0])
    const fin = formatFecha(diasSemana[5])
    const [turnosRes, ausenciasRes, horariosRes, bloquesRes, espRes, cierresRes] = await Promise.all([
      fetch(`http://localhost:3000/api/agenda/turnos-semana?id_profesional=${profesionalSeleccionado.id}&fecha_inicio=${inicio}&fecha_fin=${fin}`),
      fetch(`http://localhost:3000/api/agenda/ausencias/${profesionalSeleccionado.id}`),
      fetch(`http://localhost:3000/api/agenda/horarios/${profesionalSeleccionado.id}`),
      fetch(`http://localhost:3000/api/agenda/bloques/${profesionalSeleccionado.id}`),
      fetch(`http://localhost:3000/api/agenda/especialidad/${profesionalSeleccionado.id}`),
      fetch(`http://localhost:3000/api/agenda/cierres`)
    ])
    setTurnosSemana(await turnosRes.json().catch(() => []))
    setAusencias(await ausenciasRes.json().catch(() => []))
    setHorarios(await horariosRes.json().catch(() => []))
    setBloques(await bloquesRes.json().catch(() => []))
    setDiasEspecialidad(await espRes.json().catch(() => []))
    setCierres(await cierresRes.json().catch(() => []))
  }

  useEffect(() => { cargarProfesionales() }, [])
  useEffect(() => { if (profesionalSeleccionado) cargarDatos() }, [profesionalSeleccionado, semanaActual])

  const esDiaCierre = (fecha) => cierres.find(c => c.fecha?.split('T')[0] === formatFecha(fecha))
  const esDiaEspecialidad = (fecha) => diasEspecialidad.find(d => d.fecha?.split('T')[0] === formatFecha(fecha))
  const turnosDelDiaHora = (fecha, hora) => turnosSemana.filter(t => t.fecha?.split('T')[0] === formatFecha(fecha) && t.hora?.slice(0, 5) === hora)
  const horarioDelDia = (diaSemana, fecha) => {
  return horarios.filter(h => {
    if (h.dia_semana !== diaSemana) return false
    if (!h.frecuencia || h.frecuencia === 'siempre') return true

    const fechaStr = formatFecha(fecha)

    if (h.frecuencia === 'unica_vez') {
      const fechaEsp = h.fecha_especifica?.split('T')[0]
      return fechaEsp === fechaStr
    }

    if (h.frecuencia === 'cada_2_semanas') {
  if (!h.fecha_especifica) return false
  const fechaEsp = h.fecha_especifica?.split('T')[0]

  const [anioI, mesI, diaI] = fechaEsp.split('-').map(Number)
  const [anioF, mesF, diaF] = fechaStr.split('-').map(Number)

  const fechaInicio = new Date(anioI, mesI - 1, diaI)
  const fechaActual = new Date(anioF, mesF - 1, diaF)

  if (fechaActual < fechaInicio) return false

  // Generar todas las fechas válidas desde el inicio hasta la fecha actual
  // Una fecha es válida si: es cada 14 días Y no es feriado
  // Si es feriado, se pasa a la semana siguiente (solo una vez)
  let fechaCandidata = new Date(fechaInicio)
  let ultimaFechaValida = null

  while (fechaCandidata <= fechaActual) {
    const strCandidata = formatFecha(fechaCandidata)
    const esFeriado = cierres.some(c => c.fecha?.split('T')[0] === strCandidata)

    if (!esFeriado) {
      ultimaFechaValida = new Date(fechaCandidata)
      // Si esta fecha coincide con fechaActual, devolver true
      if (strCandidata === fechaStr) return true
      // Avanzar 14 días para la próxima fecha normal
      fechaCandidata = new Date(fechaCandidata)
      fechaCandidata.setDate(fechaCandidata.getDate() + 14)
    } else {
      // Es feriado, pasar a la semana siguiente
      fechaCandidata = new Date(fechaCandidata)
      fechaCandidata.setDate(fechaCandidata.getDate() + 7)
    }
  }

  return false
}

    return false
  })
}

  const guardarNota = async () => {
    await fetch(`http://localhost:3000/api/agenda/nota/${modalTurno.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notas: nota })
    })
    setModalTurno(null); setNota(''); cargarDatos()
  }

  const limpiarHorario = () => {
  setHorarioEditando(null)
  setHorarioDia(0)
  setHorarioInicio('08:00')
  setHorarioFin('14:00')
  setHorarioFrecuencia('siempre')
  setHorarioFechaEsp('')
  setHorarioEspaciado('')
  setHorarioDuracionBloque('')
}
  const editarHorario = (h) => {
  setHorarioEditando(h.id)
  setHorarioDia(h.dia_semana)
  setHorarioInicio(h.hora_inicio.slice(0, 5))
  setHorarioFin(h.hora_fin.slice(0, 5))
  setHorarioFrecuencia(h.frecuencia || 'siempre')
  setHorarioFechaEsp(h.fecha_especifica?.split('T')[0] || '')
  setHorarioEspaciado(h.espaciado_minutos ? `${String(Math.floor(h.espaciado_minutos/60)).padStart(2,'0')}:${String(h.espaciado_minutos%60).padStart(2,'0')}` : '')
  setHorarioDuracionBloque(h.duracion_bloque_minutos ? `${String(Math.floor(h.duracion_bloque_minutos/60)).padStart(2,'0')}:${String(h.duracion_bloque_minutos%60).padStart(2,'0')}` : '')
}
  const guardarHorario = async () => {
  const espaciadoMin = horarioEspaciado ? (() => { const [h,m] = horarioEspaciado.split(':').map(Number); return h*60+m })() : null
  const duracionMin = horarioDuracionBloque ? (() => { const [h,m] = horarioDuracionBloque.split(':').map(Number); return h*60+m })() : null

  const url = horarioEditando
    ? `http://localhost:3000/api/agenda/horarios/${horarioEditando}`
    : 'http://localhost:3000/api/agenda/horarios'
  const method = horarioEditando ? 'PUT' : 'POST'

  await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id_profesional: profesionalSeleccionado.id,
      dia_semana: parseInt(horarioDia),
      hora_inicio: horarioInicio,
      hora_fin: horarioFin,
      frecuencia: horarioFrecuencia,
      fecha_especifica: horarioFechaEsp || null,
      espaciado_minutos: espaciadoMin,
      duracion_bloque_minutos: duracionMin
    })
  })
  limpiarHorario()
  cargarDatos()
}
  const eliminarHorario = async (id) => { if (!confirm('¿Eliminar?')) return; await fetch(`http://localhost:3000/api/agenda/horarios/${id}`, { method: 'DELETE' }); cargarDatos() }

  const limpiarBloque = () => { setBloqueEditando(null); setBloqueDia(0); setBloqueInicio('10:00'); setBloqueFin('10:30'); setBloqueMotivo('') }
  const editarBloque = (b) => { setBloqueEditando(b.id); setBloqueDia(b.dia_semana); setBloqueInicio(b.hora_inicio.slice(0, 5)); setBloqueFin(b.hora_fin.slice(0, 5)); setBloqueMotivo(b.motivo || '') }
  const guardarBloque = async () => {
    const url = bloqueEditando ? `http://localhost:3000/api/agenda/bloques/${bloqueEditando}` : 'http://localhost:3000/api/agenda/bloques'
    const method = bloqueEditando ? 'PUT' : 'POST'
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id_profesional: profesionalSeleccionado.id, dia_semana: parseInt(bloqueDia), hora_inicio: bloqueInicio, hora_fin: bloqueFin, motivo: bloqueMotivo }) })
    limpiarBloque(); cargarDatos()
  }
  const eliminarBloque = async (id) => { if (!confirm('¿Eliminar?')) return; await fetch(`http://localhost:3000/api/agenda/bloques/${id}`, { method: 'DELETE' }); cargarDatos() }

  const limpiarEsp = () => { setEspEditando(null); setEspFecha(''); setEspSuplente(''); setEspMotivo('') }
  const editarEsp = (d) => { setEspEditando(d.id); setEspFecha(d.fecha?.split('T')[0]); setEspSuplente(d.id_suplente || ''); setEspMotivo(d.motivo || '') }
  const guardarEspecialidad = async () => {
    const url = espEditando ? `http://localhost:3000/api/agenda/especialidad/${espEditando}` : 'http://localhost:3000/api/agenda/especialidad'
    const method = espEditando ? 'PUT' : 'POST'
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id_profesional: profesionalSeleccionado.id, fecha: espFecha, id_suplente: espSuplente || null, motivo: espMotivo }) })
    limpiarEsp(); cargarDatos()
  }
  const eliminarEspecialidad = async (id) => { if (!confirm('¿Revertir este día?')) return; await fetch(`http://localhost:3000/api/agenda/especialidad/${id}`, { method: 'DELETE' }); cargarDatos() }

  const limpiarCierre = () => { setCierreEditando(null); setCierreFecha(''); setCierreMotivo(''); setCierreTipo('feriado') }
  const editarCierre = (c) => { setCierreEditando(c.id); setCierreFecha(c.fecha?.split('T')[0]); setCierreMotivo(c.motivo); setCierreTipo(c.tipo) }
  const guardarCierre = async () => {
    if (!cierreFecha || !cierreMotivo) return alert('Fecha y motivo son obligatorios')
    const url = cierreEditando ? `http://localhost:3000/api/agenda/cierres/${cierreEditando}` : 'http://localhost:3000/api/agenda/cierres'
    const method = cierreEditando ? 'PUT' : 'POST'
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fecha: cierreFecha, motivo: cierreMotivo, tipo: cierreTipo }) })
    limpiarCierre(); cargarDatos()
  }
  const eliminarCierre = async (id) => { if (!confirm('¿Eliminar este cierre?')) return; await fetch(`http://localhost:3000/api/agenda/cierres/${id}`, { method: 'DELETE' }); cargarDatos() }

  const btnStyle = (color) => ({ background: color, color: 'white', border: 'none', padding: '0.2rem 0.6rem', borderRadius: '3px', cursor: 'pointer', fontSize: '0.85rem' })

  const colorTipo = { feriado: '#e74c3c', refaccion: '#e67e22', otro: '#8e44ad' }

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>Agenda</h1>
        {esAdminOEncargada && profesionalSeleccionado && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button onClick={() => setModalHorarios(true)} style={{ background: '#8e44ad', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer' }}>⏰ Horarios</button>
            <button onClick={() => setModalBloque(true)} style={{ background: '#e67e22', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer' }}>🚫 Bloques</button>
            <button onClick={() => setModalEspecialidad(true)} style={{ background: '#16a085', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer' }}>📋 Especialidad</button>
            <button onClick={() => setModalCierres(true)} style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer' }}>🏥 Cierres</button>
          </div>
        )}
      </div>

      {esAdminOEncargada && (
        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <label style={{ fontWeight: 'bold' }}>Profesional:</label>
          <select value={profesionalSeleccionado?.id || ''} onChange={(e) => setProfesionalSeleccionado(profesionales.find(p => p.id === parseInt(e.target.value)))}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}>
            {profesionales.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.especialidad ? `(${p.especialidad})` : ''}</option>)}
          </select>
          {profesionalSeleccionado?.color && <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: profesionalSeleccionado.color }} />}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button onClick={() => setSemanaActual(s => { const n = new Date(s); n.setDate(s.getDate() - 7); return n })}
          style={{ padding: '0.4rem 0.8rem', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc' }}>← Anterior</button>
        <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{mesAnio}</span>
        <button onClick={() => setSemanaActual(s => { const n = new Date(s); n.setDate(s.getDate() + 7); return n })}
          style={{ padding: '0.4rem 0.8rem', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc' }}>Siguiente →</button>
        <button onClick={() => setSemanaActual(obtenerLunesActual())}
          style={{ padding: '0.4rem 0.8rem', cursor: 'pointer', borderRadius: '4px', border: 'none', background: '#2c3e50', color: 'white' }}>Ir a esta semana</button>
      </div>

      <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '70vh', border: '1px solid #ddd', borderRadius: '8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr>
              <th style={{ padding: '0.7rem', background: '#2c3e50', color: 'white', width: '60px' }}>Hora</th>
              {diasSemana.map((dia, i) => {
                const cierre = esDiaCierre(dia)
                const especialidad = esDiaEspecialidad(dia)
                const hoy = formatFecha(new Date()) === formatFecha(dia)
                const hDia = horarioDelDia(i, dia)
                let bgColor = hoy ? '#2980b9' : '#2c3e50'
                if (cierre) bgColor = '#c0392b'
                else if (especialidad && !especialidad.id_suplente) bgColor = '#e74c3c'
                else if (especialidad && especialidad.id_suplente) bgColor = '#16a085'

                return (
                  <th key={i} style={{ padding: '0.5rem', background: bgColor, color: 'white', textAlign: 'center', minWidth: '130px' }}>
                    <div style={{ textTransform: 'capitalize', fontSize: '0.9rem' }}>
                      {dia.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'numeric' })}
                    </div>
                    {cierre && <div style={{ fontSize: '0.7rem', opacity: 0.9 }}>🏥 {cierre.motivo}</div>}
                    {!cierre && especialidad && !especialidad.id_suplente && <div style={{ fontSize: '0.7rem', opacity: 0.9 }}>Sin cobertura</div>}
                    {!cierre && especialidad && especialidad.id_suplente && <div style={{ fontSize: '0.7rem', opacity: 0.9 }}>Suplente: {especialidad.suplente_nombre}</div>}
                    {!cierre && !especialidad && hDia.length > 0 && (
  <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>
    {[...hDia]
      .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
      .map(h => `${h.hora_inicio.slice(0,5)}-${h.hora_fin.slice(0,5)}`)
      .join(' | ')}
  </div>
)}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {(() => {
              const todasLasHoras = new Set()
              diasSemana.forEach((dia, i) => {
  if (esDiaCierre(dia)) return
  horarioDelDia(i, dia).forEach(h => {
    generarHorarios(h.hora_inicio, h.hora_fin, bloques, i, h.espaciado_minutos, h.duracion_bloque_minutos).forEach(s => todasLasHoras.add(s.hora))
  })
})
              const horasOrdenadas = Array.from(todasLasHoras).sort()

              if (horasOrdenadas.length === 0) {
                return <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#aaa' }}>No hay horarios cargados para este profesional</td></tr>
              }

              return horasOrdenadas.map(hora => (
                <tr key={hora} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '0.3rem 0.5rem', background: '#f8f9fa', fontWeight: 'bold', fontSize: '0.8rem', textAlign: 'center', color: '#555', position: 'sticky', left: 0 }}>
                    {hora}
                  </td>
                  {diasSemana.map((dia, i) => {
                    const cierre = esDiaCierre(dia)
                    const especialidad = esDiaEspecialidad(dia)
                    const sinCobertura = especialidad && !especialidad.id_suplente

                    if (cierre) return <td key={i} style={{ background: '#fdecea', border: '1px solid #eee' }} />
                    if (sinCobertura) return <td key={i} style={{ background: '#fdecea', border: '1px solid #eee' }} />

                    const hDia = horarioDelDia(i, dia)
                    const slots = hDia.flatMap(h => generarHorarios(h.hora_inicio, h.hora_fin, bloques, i, h.espaciado_minutos, h.duracion_bloque_minutos))
                    const slot = slots.find(s => s.hora === hora)
                    const turnosCelda = turnosDelDiaHora(dia, hora)

                    if (!slot) return <td key={i} style={{ background: '#f5f5f5', border: '1px solid #eee' }} />
                    if (slot.inhabilitado) return <td key={i} style={{ background: '#ffeeba', border: '1px solid #eee', textAlign: 'center', fontSize: '0.7rem', color: '#856404', padding: '0.2rem' }}>🚫</td>

                    return (
                      <td key={i} style={{ border: '1px solid #eee', padding: '1px', verticalAlign: 'top', height: '22px' }}>
                        {turnosCelda.map(t => (
                          <div key={t.id} onClick={() => { setModalTurno(t); setNota(t.notas || '') }}
                            style={{ background: profesionalSeleccionado?.color || '#3498db', color: 'white', borderRadius: '3px', padding: '0.2rem 0.4rem', cursor: 'pointer', fontSize: '0.75rem', marginBottom: '2px' }}>
                            <div style={{ fontWeight: 'bold' }}>{t.paciente_nombre}</div>
                            <div style={{ fontSize: '0.7rem', opacity: 0.9 }}>{t.tratamiento_nombre}</div>
                            {t.notas && <div style={{ fontSize: '0.65rem', fontStyle: 'italic' }}>📝</div>}
                          </div>
                        ))}
                        {turnosCelda.length === 0 && <div style={{ minHeight: '20px' }} />}
                      </td>
                    )
                  })}
                </tr>
              ))
            })()}
          </tbody>
        </table>
      </div>

      {/* Modal notas */}
      {modalTurno && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', width: '400px' }}>
            <h3>Turno: {modalTurno.paciente_nombre}</h3>
            <p><strong>Tratamiento:</strong> {modalTurno.tratamiento_nombre}</p>
            <p><strong>Hora:</strong> {modalTurno.hora?.slice(0, 5)}</p>
            <p><strong>Estado:</strong> {modalTurno.estado}</p>
            <label><strong>Notas:</strong></label><br />
            <textarea value={nota} onChange={(e) => setNota(e.target.value)} rows={4} style={{ width: '100%', padding: '0.5rem', marginTop: '0.3rem' }} placeholder="Agregar una nota..." />
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
              <button onClick={guardarNota} style={{ background: '#2c3e50', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Guardar nota</button>
              <button onClick={() => setModalTurno(null)} style={{ padding: '0.5rem 1rem', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc' }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal horarios */}
{modalHorarios && (
  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
    <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', width: '580px', maxHeight: '85vh', overflowY: 'auto' }}>
      <h3>{horarioEditando ? 'Editar Horario' : 'Horarios'} de {profesionalSeleccionado?.nombre}</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <div>
          <label>Día</label><br />
          <select value={horarioDia} onChange={(e) => setHorarioDia(e.target.value)} style={{ width: '100%', padding: '0.4rem' }}>
            {DIAS_NOMBRES.map((d, i) => <option key={i} value={i}>{d}</option>)}
          </select>
        </div>
        <div>
          <label>Desde</label><br />
          <input type="time" value={horarioInicio} onChange={(e) => setHorarioInicio(e.target.value)} style={{ width: '100%', padding: '0.4rem' }} />
        </div>
        <div>
          <label>Hasta</label><br />
          <input type="time" value={horarioFin} onChange={(e) => setHorarioFin(e.target.value)} style={{ width: '100%', padding: '0.4rem' }} />
        </div>
      </div>

      {/* Frecuencia */}
      <div style={{ marginBottom: '0.5rem' }}>
        <label>Frecuencia</label><br />
        <select value={horarioFrecuencia} onChange={(e) => setHorarioFrecuencia(e.target.value)} style={{ width: '100%', padding: '0.4rem' }}>
          <option value="siempre">Todas las semanas</option>
          <option value="unica_vez">Solo esta fecha</option>
          <option value="cada_2_semanas">Cada 2 semanas</option>
        </select>
      </div>

      {/* Fecha específica si no es siempre */}
      {(horarioFrecuencia === 'unica_vez' || horarioFrecuencia === 'cada_2_semanas') && (
        <div style={{ marginBottom: '0.5rem' }}>
          <label>{horarioFrecuencia === 'unica_vez' ? 'Fecha específica' : 'Fecha de inicio (cada 2 semanas desde acá)'}</label><br />
          <input type="date" value={horarioFechaEsp} onChange={(e) => setHorarioFechaEsp(e.target.value)} style={{ width: '100%', padding: '0.4rem' }} />
        </div>
      )}

      {/* Espaciado automático de bloques */}
      <div style={{ background: '#f8f9fa', padding: '0.8rem', borderRadius: '6px', marginBottom: '0.8rem' }}>
        <label style={{ fontWeight: 'bold' }}>Espaciado automático de bloques inhabilitados</label>
        <p style={{ fontSize: '0.8rem', color: '#666', margin: '0.2rem 0 0.5rem' }}>
          Cada cuánto tiempo se genera un bloque inhabilitado automáticamente
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <div>
            <label style={{ fontSize: '0.85rem' }}>Espaciado (hh:mm)</label><br />
            <input 
              type="time" 
              value={horarioEspaciado} 
              onChange={(e) => setHorarioEspaciado(e.target.value)}
              style={{ width: '100%', padding: '0.4rem' }}
              placeholder="01:45"
            />
            <span style={{ fontSize: '0.75rem', color: '#888' }}>Ej: 01:45 = cada 1h 45min</span>
          </div>
          <div>
            <label style={{ fontSize: '0.85rem' }}>Duración del bloque (hh:mm)</label><br />
            <input 
              type="time" 
              value={horarioDuracionBloque}
              onChange={(e) => setHorarioDuracionBloque(e.target.value)}
              style={{ width: '100%', padding: '0.4rem' }}
              placeholder="00:15"
            />
            <span style={{ fontSize: '0.75rem', color: '#888' }}>Ej: 00:15 = 15 minutos</span>
          </div>
        </div>
        {horarioEspaciado && horarioDuracionBloque && horarioInicio && (
          <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#2c3e50' }}>
            <strong>Vista previa de bloques:</strong> {(() => {
              const [hE, mE] = horarioEspaciado.split(':').map(Number)
              const [hD, mD] = horarioDuracionBloque.split(':').map(Number)
              const [hI, mI] = horarioInicio.split(':').map(Number)
              const [hF, mF] = horarioFin.split(':').map(Number)
              const espaciadoMin = hE * 60 + mE
              const duracionMin = hD * 60 + mD
              const inicioMin = hI * 60 + mI
              const finMin = hF * 60 + mF
              if (espaciadoMin === 0) return 'Espaciado inválido'
              const bloques = []
              let actual = inicioMin + espaciadoMin
              while (actual + duracionMin <= finMin) {
                const hIB = Math.floor(actual / 60)
                const mIB = actual % 60
                const hFB = Math.floor((actual + duracionMin) / 60)
                const mFB = (actual + duracionMin) % 60
                bloques.push(`${String(hIB).padStart(2,'0')}:${String(mIB).padStart(2,'0')}-${String(hFB).padStart(2,'0')}:${String(mFB).padStart(2,'0')}`)
                actual += espaciadoMin + duracionMin
              }
              return bloques.length > 0 ? bloques.join(', ') : 'Sin bloques en este rango'
            })()}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button onClick={guardarHorario} style={{ background: '#8e44ad', color: 'white', border: 'none', padding: '0.4rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>
          {horarioEditando ? 'Guardar cambios' : 'Agregar horario'}
        </button>
        {horarioEditando && <button onClick={limpiarHorario} style={{ padding: '0.4rem 1rem', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc' }}>Cancelar</button>}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ padding: '0.5rem' }}>Día</th>
            <th style={{ padding: '0.5rem' }}>Desde</th>
            <th style={{ padding: '0.5rem' }}>Hasta</th>
            <th style={{ padding: '0.5rem' }}>Frecuencia</th>
            <th style={{ padding: '0.5rem' }}>Espaciado</th>
            <th style={{ padding: '0.5rem' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {horarios.map(h => (
            <tr key={h.id} style={{ borderBottom: '1px solid #eee', background: horarioEditando === h.id ? '#f0e6ff' : 'white' }}>
              <td style={{ padding: '0.5rem', textAlign: 'center' }}>{DIAS_NOMBRES[h.dia_semana]}</td>
              <td style={{ padding: '0.5rem', textAlign: 'center' }}>{h.hora_inicio?.slice(0, 5)}</td>
              <td style={{ padding: '0.5rem', textAlign: 'center' }}>{h.hora_fin?.slice(0, 5)}</td>
              <td style={{ padding: '0.5rem', textAlign: 'center', fontSize: '0.8rem' }}>
                {h.frecuencia === 'siempre' && 'Siempre'}
                {h.frecuencia === 'unica_vez' && `Solo ${h.fecha_especifica?.split('T')[0]}`}
                {h.frecuencia === 'cada_2_semanas' && `C/2 sem desde ${h.fecha_especifica?.split('T')[0]}`}
              </td>
              <td style={{ padding: '0.5rem', textAlign: 'center', fontSize: '0.8rem' }}>
                {h.espaciado_minutos ? `c/${h.espaciado_minutos}min (${h.duracion_bloque_minutos}min)` : '-'}
              </td>
              <td style={{ padding: '0.5rem', textAlign: 'center', display: 'flex', gap: '0.3rem', justifyContent: 'center' }}>
                <button onClick={() => editarHorario(h)} style={btnStyle('#3498db')}>Editar</button>
                <button onClick={() => eliminarHorario(h.id)} style={btnStyle('#e74c3c')}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={() => { setModalHorarios(false); limpiarHorario() }} style={{ marginTop: '1rem', padding: '0.4rem 1rem', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc' }}>Cerrar</button>
    </div>
  </div>
)}

      {/* Modal bloques */}
      {modalBloque && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', width: '520px', maxHeight: '80vh', overflowY: 'auto' }}>
            <h3>{bloqueEditando ? 'Editar Bloque' : 'Bloques inhabilitados'} de {profesionalSeleccionado?.nombre}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <div><label>Día</label><br /><select value={bloqueDia} onChange={(e) => setBloqueDia(e.target.value)} style={{ width: '100%', padding: '0.4rem' }}>{DIAS_NOMBRES.map((d, i) => <option key={i} value={i}>{d}</option>)}</select></div>
              <div><label>Desde</label><br /><input type="time" value={bloqueInicio} onChange={(e) => setBloqueInicio(e.target.value)} style={{ width: '100%', padding: '0.4rem' }} /></div>
              <div><label>Hasta</label><br /><input type="time" value={bloqueFin} onChange={(e) => setBloqueFin(e.target.value)} style={{ width: '100%', padding: '0.4rem' }} /></div>
            </div>
            <input placeholder="Motivo (opcional)" value={bloqueMotivo} onChange={(e) => setBloqueMotivo(e.target.value)} style={{ width: '100%', padding: '0.4rem', marginBottom: '0.5rem' }} />
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <button onClick={guardarBloque} style={{ background: '#e67e22', color: 'white', border: 'none', padding: '0.4rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>{bloqueEditando ? 'Guardar cambios' : 'Agregar'}</button>
              {bloqueEditando && <button onClick={limpiarBloque} style={{ padding: '0.4rem 1rem', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc' }}>Cancelar</button>}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#f5f5f5' }}><th style={{ padding: '0.5rem' }}>Día</th><th style={{ padding: '0.5rem' }}>Desde</th><th style={{ padding: '0.5rem' }}>Hasta</th><th style={{ padding: '0.5rem' }}>Motivo</th><th style={{ padding: '0.5rem' }}>Acciones</th></tr></thead>
              <tbody>{bloques.map(b => (
                <tr key={b.id} style={{ borderBottom: '1px solid #eee', background: bloqueEditando === b.id ? '#fff3e0' : 'white' }}>
                  <td style={{ padding: '0.5rem', textAlign: 'center' }}>{DIAS_NOMBRES[b.dia_semana]}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'center' }}>{b.hora_inicio?.slice(0, 5)}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'center' }}>{b.hora_fin?.slice(0, 5)}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'center' }}>{b.motivo || '-'}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'center', display: 'flex', gap: '0.3rem', justifyContent: 'center' }}>
                    <button onClick={() => editarBloque(b)} style={btnStyle('#3498db')}>Editar</button>
                    <button onClick={() => eliminarBloque(b.id)} style={btnStyle('#e74c3c')}>Eliminar</button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
            <button onClick={() => { setModalBloque(false); limpiarBloque() }} style={{ marginTop: '1rem', padding: '0.4rem 1rem', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc' }}>Cerrar</button>
          </div>
        </div>
      )}

      {/* Modal especialidad */}
      {modalEspecialidad && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', width: '520px', maxHeight: '80vh', overflowY: 'auto' }}>
            <h3>{espEditando ? 'Editar día' : 'Días de especialidad'} de {profesionalSeleccionado?.nombre}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <div><label>Fecha</label><br /><input type="date" value={espFecha} onChange={(e) => setEspFecha(e.target.value)} style={{ width: '100%', padding: '0.4rem' }} /></div>
              <div><label>Suplente</label><br />
                <select value={espSuplente} onChange={(e) => setEspSuplente(e.target.value)} style={{ width: '100%', padding: '0.4rem' }}>
                  <option value="">Sin suplente</option>
                  {profesionales.filter(p => p.id !== profesionalSeleccionado?.id).map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
            </div>
            <input placeholder="Motivo (opcional)" value={espMotivo} onChange={(e) => setEspMotivo(e.target.value)} style={{ width: '100%', padding: '0.4rem', marginBottom: '0.5rem' }} />
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <button onClick={guardarEspecialidad} style={{ background: '#16a085', color: 'white', border: 'none', padding: '0.4rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>{espEditando ? 'Guardar cambios' : 'Registrar'}</button>
              {espEditando && <button onClick={limpiarEsp} style={{ padding: '0.4rem 1rem', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc' }}>Cancelar</button>}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#f5f5f5' }}><th style={{ padding: '0.5rem' }}>Fecha</th><th style={{ padding: '0.5rem' }}>Suplente</th><th style={{ padding: '0.5rem' }}>Motivo</th><th style={{ padding: '0.5rem' }}>Acciones</th></tr></thead>
              <tbody>{diasEspecialidad.map(d => (
                <tr key={d.id} style={{ borderBottom: '1px solid #eee', background: espEditando === d.id ? '#e8f8f5' : 'white' }}>
                  <td style={{ padding: '0.5rem', textAlign: 'center' }}>{new Date(d.fecha).toLocaleDateString('es-AR')}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'center' }}>{d.suplente_nombre || <span style={{ color: '#e74c3c' }}>Sin cobertura</span>}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'center' }}>{d.motivo || '-'}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'center', display: 'flex', gap: '0.3rem', justifyContent: 'center' }}>
                    <button onClick={() => editarEsp(d)} style={btnStyle('#3498db')}>Editar</button>
                    <button onClick={() => eliminarEspecialidad(d.id)} style={btnStyle('#e74c3c')}>Revertir</button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
            <button onClick={() => { setModalEspecialidad(false); limpiarEsp() }} style={{ marginTop: '1rem', padding: '0.4rem 1rem', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc' }}>Cerrar</button>
          </div>
        </div>
      )}

      {/* Modal cierres */}
      {modalCierres && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', width: '520px', maxHeight: '80vh', overflowY: 'auto' }}>
            <h3>{cierreEditando ? 'Editar cierre' : 'Cierres y feriados'}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <div><label>Fecha</label><br /><input type="date" value={cierreFecha} onChange={(e) => setCierreFecha(e.target.value)} style={{ width: '100%', padding: '0.4rem' }} /></div>
              <div><label>Tipo</label><br />
                <select value={cierreTipo} onChange={(e) => setCierreTipo(e.target.value)} style={{ width: '100%', padding: '0.4rem' }}>
                  <option value="feriado">Feriado</option>
                  <option value="refaccion">Refacción</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
            </div>
            <input placeholder="Motivo" value={cierreMotivo} onChange={(e) => setCierreMotivo(e.target.value)} style={{ width: '100%', padding: '0.4rem', marginBottom: '0.5rem' }} />
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <button onClick={guardarCierre} style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '0.4rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>{cierreEditando ? 'Guardar cambios' : 'Registrar cierre'}</button>
              {cierreEditando && <button onClick={limpiarCierre} style={{ padding: '0.4rem 1rem', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc' }}>Cancelar</button>}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#f5f5f5' }}><th style={{ padding: '0.5rem' }}>Fecha</th><th style={{ padding: '0.5rem' }}>Tipo</th><th style={{ padding: '0.5rem' }}>Motivo</th><th style={{ padding: '0.5rem' }}>Acciones</th></tr></thead>
              <tbody>{cierres.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #eee', background: cierreEditando === c.id ? '#fdecea' : 'white' }}>
                  <td style={{ padding: '0.5rem', textAlign: 'center' }}>{new Date(c.fecha).toLocaleDateString('es-AR')}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'center' }}><span style={{ background: colorTipo[c.tipo], color: 'white', padding: '0.2rem 0.5rem', borderRadius: '10px', fontSize: '0.8rem' }}>{c.tipo}</span></td>
                  <td style={{ padding: '0.5rem', textAlign: 'center' }}>{c.motivo}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'center', display: 'flex', gap: '0.3rem', justifyContent: 'center' }}>
                    <button onClick={() => editarCierre(c)} style={btnStyle('#3498db')}>Editar</button>
                    <button onClick={() => eliminarCierre(c.id)} style={btnStyle('#e74c3c')}>Eliminar</button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
            <button onClick={() => { setModalCierres(false); limpiarCierre() }} style={{ marginTop: '1rem', padding: '0.4rem 1rem', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc' }}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Agenda