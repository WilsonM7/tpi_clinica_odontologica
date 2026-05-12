import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function Navbar() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  const usuarioActual = usuario || JSON.parse(localStorage.getItem('usuario'))

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav style={{
      background: '#2c3e50',
      padding: '0 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      height: '60px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
    }}>

      <Link to="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.2rem' }}>
        🦷 Clínica Odontológica
      </Link>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>

        {/* Sin login */}
        {!usuarioActual && (
          <>
            <Link to="/login" style={linkStyle}>Iniciar Sesión</Link>
            <Link to="/register" style={linkStyle}>Registrarse</Link>
          </>
        )}

        {/* Admin */}
        {usuarioActual?.rol === 'admin' && (
          <>
            <Link to="/admin/tratamientos" style={linkStyle}>Tratamientos</Link>
            <Link to="/admin/turnos" style={linkStyle}>Turnos</Link>
            <Link to="/admin/usuarios" style={linkStyle}>Usuarios</Link>
          </>
        )}

        {/* Superadmin */}
        {usuarioActual?.rol === 'superadmin' && (
          <>
            <Link to="/superadmin/usuarios" style={linkStyle}>Usuarios</Link>
            <Link to="/admin/tratamientos" style={linkStyle}>Tratamientos</Link>
            <Link to="/admin/turnos" style={linkStyle}>Turnos</Link>
            <Link to="/admin/importar" style={linkStyle}>Importar</Link>
          </>
        )}

        {['admin', 'superadmin', 'profesional', 'encargada', 'supervisora', 'secretaria', 'asistente', 'telemarketer'].includes(usuarioActual?.rol) && (
  <Link to="/agenda" style={linkStyle}>Agenda</Link>
         )}

        {/* Paciente */}
        {usuarioActual?.rol === 'paciente' && (
          <Link to="/paciente/turnos" style={linkStyle}>Mis Turnos</Link>
        )}

        {/* Usuario logueado */}
        {usuarioActual && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: '#bdc3c7', fontSize: '0.9rem' }}>
              👤 {usuarioActual.nombre}
            </span>
            <button onClick={handleLogout} style={{
              background: '#e74c3c',
              color: 'white',
              border: 'none',
              padding: '0.4rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}>
              Cerrar Sesión
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}

const linkStyle = {
  color: 'white',
  textDecoration: 'none',
  padding: '0.4rem 0.8rem',
  borderRadius: '4px',
  transition: 'background 0.2s',
  fontSize: '0.95rem'
}

export default Navbar