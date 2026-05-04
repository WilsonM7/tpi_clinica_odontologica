import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

function MisTurnos() {
  const [turnos, setTurnos] = useState([])
  const { usuario } = useAuth()

  const usuarioActual = usuario || JSON.parse(localStorage.getItem('usuario'))

  useEffect(() => {
    if (!usuarioActual) return
    const cargarTurnos = async () => {
      const res = await fetch(`http://localhost:3000/api/turnos/paciente/${usuarioActual.id}`)
      const data = await res.json()
      setTurnos(data)
    }
    cargarTurnos()
  }, [])

  const coloresEstado = {
    pendiente: '#f39c12',
    confirmado: '#27ae60',
    cancelado: '#e74c3c'
  }

  if (!usuarioActual) return <p>Cargando...</p>

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Mis Turnos</h1>
      <p>Bienvenido/a, {usuarioActual.nombre}</p>

      {turnos.length === 0 ? (
        <p style={{ color: '#666', marginTop: '2rem' }}>No tenés turnos registrados todavía.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
          <thead>
            <tr style={{ background: '#2c3e50', color: 'white' }}>
              <th style={{ padding: '0.7rem' }}>Tratamiento</th>
              <th style={{ padding: '0.7rem' }}>Fecha</th>
              <th style={{ padding: '0.7rem' }}>Hora</th>
              <th style={{ padding: '0.7rem' }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {turnos.map((t) => (
              <tr key={t.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '0.7rem' }}>{t.tratamiento_nombre}</td>
                <td style={{ padding: '0.7rem' }}>{new Date(t.fecha).toLocaleDateString('es-AR')}</td>
                <td style={{ padding: '0.7rem' }}>{t.hora}</td>
                <td style={{ padding: '0.7rem' }}>
                  <span style={{ background: coloresEstado[t.estado], color: 'white', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.85rem' }}>
                    {t.estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default MisTurnos