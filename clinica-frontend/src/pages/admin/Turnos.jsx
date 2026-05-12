import { useState, useEffect } from 'react'

function Turnos() {
  const [turnos, setTurnos] = useState([])
  const [tratamientos, setTratamientos] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')
  const [idPaciente, setIdPaciente] = useState('')
  const [idTratamiento, setIdTratamiento] = useState('')
  const [editando, setEditando] = useState(null)
  const [estadoEdit, setEstadoEdit] = useState('pendiente')
  const [error, setError] = useState('')

  const cargarDatos = async () => {
    const [turnosRes, tratRes, pacRes] = await Promise.all([
      fetch('http://localhost:3000/api/turnos'),
      fetch('http://localhost:3000/api/tratamientos'),
      fetch('http://localhost:3000/api/usuarios')
    ])
    setTurnos(await turnosRes.json())
    setTratamientos(await tratRes.json())
    setPacientes(await pacRes.json())
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!fecha || !hora || !idPaciente || !idTratamiento) {
      setError('Todos los campos son obligatorios')
      return
    }

    const metodo = editando ? 'PUT' : 'POST'
    const url = editando
      ? `http://localhost:3000/api/turnos/${editando}`
      : 'http://localhost:3000/api/turnos'

    await fetch(url, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fecha, hora,
        id_paciente: idPaciente,
        id_tratamiento: idTratamiento,
        estado: estadoEdit
      })
    })

    setFecha('')
    setHora('')
    setIdPaciente('')
    setIdTratamiento('')
    setEditando(null)
    cargarDatos()
  }

  const handleEditar = (t) => {
    setEditando(t.id)
    setFecha(t.fecha.split('T')[0])
    setHora(t.hora)
    setIdPaciente(t.id_paciente)
    setIdTratamiento(t.id_tratamiento)
    setEstadoEdit(t.estado)
  }

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar este turno?')) return
    await fetch(`http://localhost:3000/api/turnos/${id}`, { method: 'DELETE' })
    cargarDatos()
  }

  const coloresEstado = {
    pendiente: '#f39c12',
    confirmado: '#27ae60',
    cancelado: '#e74c3c'
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Gestión de Turnos</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: '2rem', background: '#f5f5f5', padding: '1rem', borderRadius: '8px' }}>
        <h2>{editando ? 'Editar Turno' : 'Nuevo Turno'}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label>Fecha</label><br />
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={{ width: '100%', padding: '0.5rem' }} />
          </div>
          <div>
            <label>Hora</label><br />
            <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} style={{ width: '100%', padding: '0.5rem' }} />
          </div>
          <div>
            <label>Paciente</label><br />
            <select value={idPaciente} onChange={(e) => setIdPaciente(e.target.value)} style={{ width: '100%', padding: '0.5rem' }}>
              <option value="">Seleccioná un paciente</option>
              {pacientes.filter(p => p.rol === 'paciente').map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Tratamiento</label><br />
            <select value={idTratamiento} onChange={(e) => setIdTratamiento(e.target.value)} style={{ width: '100%', padding: '0.5rem' }}>
              <option value="">Seleccioná un tratamiento</option>
              {tratamientos.map(t => (
                <option key={t.id} value={t.id}>{t.nombre} - ${t.precio}</option>
              ))}
            </select>
          </div>
          {editando && (
            <div>
              <label>Estado</label><br />
              <select value={estadoEdit} onChange={(e) => setEstadoEdit(e.target.value)} style={{ width: '100%', padding: '0.5rem' }}>
                <option value="pendiente">Pendiente</option>
                <option value="confirmado">Confirmado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          )}
        </div>
        {error && <p style={{ color: 'red', marginTop: '0.5rem' }}>{error}</p>}
        <div style={{ marginTop: '1rem' }}>
          <button type="submit" style={{ background: '#2c3e50', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            {editando ? 'Guardar cambios' : 'Agregar turno'}
          </button>
          {editando && (
            <button onClick={() => { setEditando(null); setFecha(''); setHora(''); setIdPaciente(''); setIdTratamiento('') }}
              style={{ marginLeft: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#2c3e50', color: 'white' }}>
            <th style={{ padding: '0.7rem' }}>Paciente</th>
            <th style={{ padding: '0.7rem' }}>Tratamiento</th>
            <th style={{ padding: '0.7rem' }}>Fecha</th>
            <th style={{ padding: '0.7rem' }}>Hora</th>
            <th style={{ padding: '0.7rem' }}>Estado</th>
            <th style={{ padding: '0.7rem' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {turnos.map((t) => (
            <tr key={t.id} style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '0.7rem' }}>{t.paciente_nombre}</td>
              <td style={{ padding: '0.7rem' }}>{t.tratamiento_nombre}</td>
              <td style={{ padding: '0.7rem' }}>{new Date(t.fecha).toLocaleDateString('es-AR')}</td>
              <td style={{ padding: '0.7rem' }}>{t.hora}</td>
              <td style={{ padding: '0.7rem' }}>
                <span style={{ background: coloresEstado[t.estado], color: 'white', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.85rem' }}>
                  {t.estado}
                </span>
              </td>
              <td style={{ padding: '0.7rem' }}>
                <button onClick={() => handleEditar(t)} style={{ marginRight: '0.5rem', background: '#3498db', color: 'white', border: 'none', padding: '0.3rem 0.7rem', borderRadius: '4px', cursor: 'pointer' }}>
                  Editar
                </button>
                <button onClick={() => handleEliminar(t.id)} style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '0.3rem 0.7rem', borderRadius: '4px', cursor: 'pointer' }}>
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Turnos