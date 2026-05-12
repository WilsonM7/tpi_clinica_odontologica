import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

const ROLES = [
  { value: 'paciente', label: 'Paciente' },
  { value: 'profesional', label: 'Profesional' },
  { value: 'encargada', label: 'Encargada' },
  { value: 'supervisora', label: 'Supervisora' },
  { value: 'secretaria', label: 'Secretaria' },
  { value: 'telemarketer', label: 'Telemarketer' },
  { value: 'asistente', label: 'Asistente' },
  { value: 'admin', label: 'Admin' },
  { value: 'superadmin', label: 'Superadmin' },
]

const ESPECIALIDADES = ['General', 'Ortodoncia', 'Periodoncia', 'Endodoncia', 'Implante', 'Ortopedia']

const COMO_NOS_CONOCIO = [
  { value: 'cartel', label: 'Cartel' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'google', label: 'Google' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'radio', label: 'Radio' },
  { value: 'recomendacion', label: 'Recomendación' },
  { value: 'tiktok', label: 'TikTok' },
]

const input = { width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }
const label = { fontWeight: 'bold', fontSize: '0.85rem', color: '#555' }

function calcularEdad(fechaNac) {
  if (!fechaNac) return ''
  const hoy = new Date()
  const nac = new Date(fechaNac)
  let edad = hoy.getFullYear() - nac.getFullYear()
  const m = hoy.getMonth() - nac.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--
  return edad
}

const ESTADO_INICIAL = {
  nombre: '', email: '', password: '', rol: 'paciente', color: '#3498db',
  especialidades: [], sucursal_id: '',
  dni: '', telefono: '', fecha_nacimiento: '', domicilio: '', reside: '',
  ocupacion: '', como_nos_conocio: '', fecha_ingreso_sistema: '',
  obra_social: '', numero_afiliado: ''
}

function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [sucursales, setSucursales] = useState([])
  const [form, setForm] = useState(ESTADO_INICIAL)
  const [editando, setEditando] = useState(null)
  const [error, setError] = useState('')
  const [filtroRol, setFiltroRol] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const { usuario } = useAuth()
  const usuarioActual = usuario || JSON.parse(localStorage.getItem('usuario'))

  const cargarUsuarios = async () => {
    const res = await fetch('http://localhost:3000/api/usuarios')
    const data = await res.json()
    setUsuarios(data)
  }

  const cargarSucursales = async () => {
    const res = await fetch('http://localhost:3000/api/sucursales')
    const data = await res.json()
    setSucursales(data)
  }

  useEffect(() => {
    cargarUsuarios()
    cargarSucursales()
  }, [])

  const limpiarForm = () => {
    setForm(ESTADO_INICIAL)
    setEditando(null)
    setError('')
  }

  const setField = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const toggleEspecialidad = (esp) => {
    const lista = form.especialidades
    setField('especialidades', lista.includes(esp) ? lista.filter(x => x !== esp) : [...lista, esp])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.nombre || !form.email || !form.rol) {
      setError('Nombre, email y rol son obligatorios')
      return
    }
    if (!editando && !form.password) {
      setError('La contraseña es obligatoria para nuevos usuarios')
      return
    }
    if (usuarioActual.rol === 'admin' && form.rol !== 'paciente') {
      setError('Como admin solo podés crear usuarios con rol paciente')
      return
    }

    const body = {
      ...form,
      especialidad: form.especialidades.join(','),
      sucursal_id: form.sucursal_id || null
    }
    if (editando && !form.password) delete body.password

    const metodo = editando ? 'PUT' : 'POST'
    const url = editando
      ? `http://localhost:3000/api/usuarios/${editando}`
      : 'http://localhost:3000/api/usuarios'

    const res = await fetch(url, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); return }
    limpiarForm()
    cargarUsuarios()
  }

  const handleEditar = (u) => {
    if (usuarioActual.rol === 'admin' && u.rol !== 'paciente') return
    setEditando(u.id)
    setForm({
      nombre: u.nombre || '',
      email: u.email || '',
      password: '',
      rol: u.rol || 'paciente',
      color: u.color || '#3498db',
      especialidades: u.especialidad ? u.especialidad.split(',') : [],
      sucursal_id: u.sucursal_id || '',
      dni: u.dni || '',
      telefono: u.telefono || '',
      fecha_nacimiento: u.fecha_nacimiento ? u.fecha_nacimiento.split('T')[0] : '',
      domicilio: u.domicilio || '',
      reside: u.reside || '',
      ocupacion: u.ocupacion || '',
      como_nos_conocio: u.como_nos_conocio || '',
      fecha_ingreso_sistema: u.fecha_ingreso_sistema ? u.fecha_ingreso_sistema.split('T')[0] : '',
      obra_social: u.obra_social || '',
      numero_afiliado: u.numero_afiliado || ''
    })
  }

  const handleEliminar = async (u) => {
    if (u.id === usuarioActual.id) { alert('No podés eliminar tu propio usuario'); return }
    if (usuarioActual.rol === 'admin' && u.rol !== 'paciente') { alert('Como admin solo podés eliminar pacientes'); return }
    if (!confirm('¿Eliminar este usuario?')) return
    await fetch(`http://localhost:3000/api/usuarios/${u.id}`, { method: 'DELETE' })
    cargarUsuarios()
  }

  const esProfesional = ['profesional', 'encargada'].includes(form.rol)
  const esPaciente = form.rol === 'paciente'

  const usuariosFiltrados = usuarios
    .filter(u => filtroRol === 'todos' || u.rol === filtroRol)
    .filter(u => !busqueda || u.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || u.dni?.includes(busqueda))

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
      <h1>Gestión de Usuarios</h1>

      {/* FORMULARIO */}
      <form onSubmit={handleSubmit} style={{ marginBottom: '2rem', background: '#f5f5f5', padding: '1.5rem', borderRadius: '8px' }}>
        <h2 style={{ marginTop: 0 }}>{editando ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>

        {/* DATOS BÁSICOS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={label}>Nombre *</label><br />
            <input value={form.nombre} onChange={e => setField('nombre', e.target.value)} style={input} />
          </div>
          <div>
            <label style={label}>Email *</label><br />
            <input type="email" value={form.email} onChange={e => setField('email', e.target.value)} style={input} />
          </div>
          {!editando && (
            <div>
              <label style={label}>Contraseña *</label><br />
              <input type="password" value={form.password} onChange={e => setField('password', e.target.value)} style={input} />
            </div>
          )}
          <div>
            <label style={label}>Rol *</label><br />
            <select value={form.rol} onChange={e => setField('rol', e.target.value)} style={input}
              disabled={usuarioActual.rol === 'admin'}>
              {ROLES.filter(r => usuarioActual.rol === 'admin' ? r.value === 'paciente' : true).map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={label}>DNI</label><br />
            <input value={form.dni} onChange={e => setField('dni', e.target.value)} style={input} />
          </div>
          <div>
            <label style={label}>Teléfono</label><br />
            <input value={form.telefono} onChange={e => setField('telefono', e.target.value)} style={input} />
          </div>
          <div>
            <label style={label}>Fecha de nacimiento</label><br />
            <input type="date" value={form.fecha_nacimiento} onChange={e => setField('fecha_nacimiento', e.target.value)} style={input} />
            {form.fecha_nacimiento && (
              <span style={{ fontSize: '0.82rem', color: '#666' }}>Edad: {calcularEdad(form.fecha_nacimiento)} años</span>
            )}
          </div>
          <div>
            <label style={label}>Fecha de ingreso al sistema</label><br />
            <input type="date" value={form.fecha_ingreso_sistema} onChange={e => setField('fecha_ingreso_sistema', e.target.value)} style={input} />
          </div>
        </div>

        {/* DATOS DE PACIENTE */}
        {esPaciente && (
          <>
            <hr style={{ margin: '1rem 0' }} />
            <h3 style={{ marginTop: 0, fontSize: '1rem', color: '#2c3e50' }}>Datos del paciente</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={label}>Domicilio</label><br />
                <input value={form.domicilio} onChange={e => setField('domicilio', e.target.value)} style={input} />
              </div>
              <div>
                <label style={label}>Localidad donde reside</label><br />
                <input value={form.reside} onChange={e => setField('reside', e.target.value)} style={input} />
              </div>
              <div>
                <label style={label}>Ocupación</label><br />
                <input value={form.ocupacion} onChange={e => setField('ocupacion', e.target.value)} style={input} />
              </div>
              <div>
                <label style={label}>¿Cómo nos conoció?</label><br />
                <select value={form.como_nos_conocio} onChange={e => setField('como_nos_conocio', e.target.value)} style={input}>
                  <option value=''>Seleccionar...</option>
                  {COMO_NOS_CONOCIO.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={label}>Obra Social</label><br />
                <input value={form.obra_social} onChange={e => setField('obra_social', e.target.value)} style={input} />
              </div>
              <div>
                <label style={label}>Número de afiliado</label><br />
                <input value={form.numero_afiliado} onChange={e => setField('numero_afiliado', e.target.value)} style={input} />
              </div>
            </div>
          </>
        )}

        {/* DATOS DE PROFESIONAL */}
        {esProfesional && (
          <>
            <hr style={{ margin: '1rem 0' }} />
            <h3 style={{ marginTop: 0, fontSize: '1rem', color: '#2c3e50' }}>Datos del profesional</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={label}>Sucursal</label><br />
                <select value={form.sucursal_id} onChange={e => setField('sucursal_id', e.target.value)} style={input}>
                  <option value=''>Sin asignar</option>
                  {sucursales.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={label}>Color identificatorio</label><br />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.3rem' }}>
                  <input type="color" value={form.color} onChange={e => setField('color', e.target.value)}
                    style={{ width: '60px', height: '38px', padding: '2px', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '4px' }} />
                  <span style={{ background: form.color, color: 'white', padding: '0.3rem 0.8rem', borderRadius: '4px' }}>
                    Vista previa
                  </span>
                </div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={label}>Especialidades</label><br />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', marginTop: '0.5rem' }}>
                  {ESPECIALIDADES.map(esp => (
                    <label key={esp} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.especialidades.includes(esp)} onChange={() => toggleEspecialidad(esp)} />
                      {esp}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {error && <p style={{ color: 'red', marginTop: '0.5rem' }}>{error}</p>}

        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
          <button type="submit" style={{ background: '#2c3e50', color: 'white', padding: '0.5rem 1.2rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            {editando ? 'Guardar cambios' : 'Crear usuario'}
          </button>
          {editando && (
            <button type="button" onClick={limpiarForm}
              style={{ padding: '0.5rem 1rem', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc' }}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* BUSCADOR */}
      <div style={{ marginBottom: '1rem' }}>
        <input
          placeholder="Buscar por nombre o DNI..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={{ ...input, maxWidth: '300px' }}
        />
      </div>

      {/* FILTROS */}
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button onClick={() => setFiltroRol('todos')} style={{ padding: '0.3rem 0.8rem', borderRadius: '4px', border: 'none', cursor: 'pointer', background: filtroRol === 'todos' ? '#2c3e50' : '#ddd', color: filtroRol === 'todos' ? 'white' : 'black' }}>Todos</button>
        {ROLES.map(r => (
          <button key={r.value} onClick={() => setFiltroRol(r.value)}
            style={{ padding: '0.3rem 0.8rem', borderRadius: '4px', border: 'none', cursor: 'pointer', background: filtroRol === r.value ? '#2c3e50' : '#ddd', color: filtroRol === r.value ? 'white' : 'black' }}>
            {r.label}
          </button>
        ))}
      </div>

      {/* TABLA */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
        <thead>
          <tr style={{ background: '#2c3e50', color: 'white' }}>
            <th style={{ padding: '0.7rem', textAlign: 'left' }}>Nombre</th>
            <th style={{ padding: '0.7rem', textAlign: 'left' }}>DNI</th>
            <th style={{ padding: '0.7rem', textAlign: 'left' }}>Email</th>
            <th style={{ padding: '0.7rem', textAlign: 'left' }}>Rol</th>
            <th style={{ padding: '0.7rem', textAlign: 'left' }}>Sucursal / Esp.</th>
            <th style={{ padding: '0.7rem', textAlign: 'left' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuariosFiltrados.map((u) => (
            <tr key={u.id} style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '0.7rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {u.rol === 'profesional' && u.color && (
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: u.color, flexShrink: 0 }} />
                  )}
                  {u.nombre}
                </div>
              </td>
              <td style={{ padding: '0.7rem' }}>{u.dni || '-'}</td>
              <td style={{ padding: '0.7rem' }}>{u.email}</td>
              <td style={{ padding: '0.7rem' }}>
                <span style={{ background: '#2c3e50', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem' }}>
                  {u.rol}
                </span>
              </td>
              <td style={{ padding: '0.7rem' }}>
                {u.sucursal_nombre || u.especialidad || '-'}
              </td>
              <td style={{ padding: '0.7rem' }}>
                <button onClick={() => handleEditar(u)}
                  disabled={usuarioActual.rol === 'admin' && u.rol !== 'paciente'}
                  style={{ marginRight: '0.5rem', background: '#3498db', color: 'white', border: 'none', padding: '0.3rem 0.7rem', borderRadius: '4px', cursor: 'pointer', opacity: usuarioActual.rol === 'admin' && u.rol !== 'paciente' ? 0.4 : 1 }}>
                  Editar
                </button>
                <button onClick={() => handleEliminar(u)}
                  disabled={usuarioActual.rol === 'admin' && u.rol !== 'paciente'}
                  style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '0.3rem 0.7rem', borderRadius: '4px', cursor: 'pointer', opacity: usuarioActual.rol === 'admin' && u.rol !== 'paciente' ? 0.4 : 1 }}>
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

export default Usuarios