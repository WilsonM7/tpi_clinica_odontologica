import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

function Home() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div>
      <h1>Clínica Odontológica</h1>
      {usuario ? (
        <div>
          <p>Bienvenido, {usuario.nombre} — Rol: {usuario.rol}</p>
          <button onClick={handleLogout}>Cerrar sesión</button>
        </div>
      ) : (
        <p>No hay usuario logueado</p>
      )}
    </div>
  )
}

export default Home