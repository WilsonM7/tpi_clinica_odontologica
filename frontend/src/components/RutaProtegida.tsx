import { useNavigate } from 'react-router-dom'
import { getUser } from '../lib/auth'
import { ShieldAlert } from 'lucide-react'

type Props = {
  rolesPermitidos: string[]
  children: React.ReactNode
}

export default function RutaProtegida({ rolesPermitidos, children }: Props) {
  const navigate = useNavigate()
  const user = getUser()

  if (!user) {
    navigate('/')
    return null
  }

  if (!rolesPermitidos.includes(user.rol)) return (
    <div className="flex flex-col items-center justify-center h-full gap-4 py-24">
      <div className="bg-red-50 border border-red-200 rounded-full p-5">
        <ShieldAlert size={40} className="text-red-400" />
      </div>
      <div className="text-center">
        <p className="text-lg font-semibold text-gray-700">Acceso denegado</p>
        <p className="text-sm text-gray-400 mt-1">
          No tenés permisos para acceder a esta sección.
        </p>
        <p className="text-xs text-gray-300 mt-0.5">
          Rol requerido: <span className="font-mono">{rolesPermitidos.join(' / ')}</span>
        </p>
      </div>
      <button
        onClick={() => navigate('/')}
        className="mt-2 px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm transition-colors"
      >
        Volver al inicio
      </button>
    </div>
  )

  return <>{children}</>
}
