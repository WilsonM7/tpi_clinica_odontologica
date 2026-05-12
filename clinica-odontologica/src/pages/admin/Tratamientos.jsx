import { useState, useEffect } from 'react'

function Tratamientos() {
  const [tratamientos, setTratamientos] = useState([])
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [precio, setPrecio] = useState('')
  const [duracion, setDuracion] = useState(30)
  const [editando, setEditando] = useState(null)
  const [error, setError] = useState('')

  const cargarTratamientos = async () => {
    const res = await fetch('http://localhost:3000/api/tratamientos')
    const data = await res.json()
    setTratamientos(data)
  }

  useEffect(() => {
    cargarTratamientos()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!nombre || !precio) {
      setError('Nombre y precio son obligatorios')
      return
    }

    const metodo = editando ? 'PUT' : 'POST'
    const url = editando
      ? `http://localhost:3000/api/tratamientos/${editando}`
      : 'http://localhost:3000/api/tratamientos'

    await fetch(url, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, descripcion, precio, duracion_minutos: duracion })
    })

    setNombre('')
    setDescripcion('')
    setPrecio('')
    setDuracion(30)
    setEditando(null)
    cargarTratamientos()
  }

  const handleEditar = (t) => {
    setEditando(t.id)
    setNombre(t.nombre)
    setDescripcion(t.descripcion)
    setPrecio(t.precio)
    setDuracion(t.duracion_minutos)
  }

  const handleEliminar = async (id) => {
    if (!confirm('¿Estás seguro que querés eliminar este tratamiento?')) return
    await fetch(`http://localhost:3000/api/tratamientos/${id}`, { method: 'DELETE' })
    cargarTratamientos()
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Gestión de Tratamientos</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: '2rem', background: '#f5f5f5', padding: '1rem', borderRadius: '8px' }}>
        <h2>{editando ? 'Editar Tratamiento' : 'Nuevo Tratamiento'}</h2>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>Nombre</label><br />
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} style={{ width: '100%', padding: '0.5rem' }} />
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>Descripción</label><br />
          <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} style={{ width: '100%', padding: '0.5rem' }} />
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>Precio</label><br />
          <input type="number" value={precio} onChange={(e) => setPrecio(e.target.value)} style={{ width: '100%', padding: '0.5rem' }} />
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>Duración (minutos)</label><br />
          <input type="number" value={duracion} onChange={(e) => setDuracion(e.target.value)} style={{ width: '100%', padding: '0.5rem' }} min="1" />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" style={{ background: '#2c3e50', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          {editando ? 'Guardar cambios' : 'Agregar'}
        </button>
        {editando && (
          <button onClick={() => { setEditando(null); setNombre(''); setDescripcion(''); setPrecio(''); setDuracion(30) }}
            style={{ marginLeft: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
            Cancelar
          </button>
        )}
      </form>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#2c3e50', color: 'white' }}>
            <th style={{ padding: '0.7rem' }}>Nombre</th>
            <th style={{ padding: '0.7rem' }}>Descripción</th>
            <th style={{ padding: '0.7rem' }}>Precio</th>
            <th style={{ padding: '0.7rem' }}>Duración</th>
            <th style={{ padding: '0.7rem' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {tratamientos.map((t) => (
            <tr key={t.id} style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '0.7rem' }}>{t.nombre}</td>
              <td style={{ padding: '0.7rem' }}>{t.descripcion}</td>
              <td style={{ padding: '0.7rem' }}>${t.precio}</td>
              <td style={{ padding: '0.7rem' }}>{t.duracion_minutos} min</td>
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

export default Tratamientos