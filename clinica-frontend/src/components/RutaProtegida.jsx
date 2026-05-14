import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function RutaProtegida({ children, rolRequerido, rolesPermitidos }) {
  const { usuario } = useAuth()
  const usuarioGuardado = localStorage.getItem('usuario')

  if (!usuario && !usuarioGuardado) return <Navigate to="/login" />

  const usuarioActual = usuario || JSON.parse(usuarioGuardado)

  if (rolRequerido && usuarioActual.rol !== rolRequerido) return <Navigate to="/" />

  if (rolesPermitidos && !rolesPermitidos.includes(usuarioActual.rol)) return <Navigate to="/" />

  return children
}

export default RutaProtegida