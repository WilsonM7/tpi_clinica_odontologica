import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ShieldAlert } from 'lucide-react'

type Props = {
  rolesPermitidos: string[]
  children: React.ReactNode
}

/**
 * Guarda de ruta basada en roles (RBAC).
 * Si el usuario no tiene el rol requerido muestra acceso denegado.
 */
export default function RutaProtegida({ rolesPermitidos, children }: Props) {
  const [rol, setRol]       = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function verificar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/'); return }

      const { data } = await supabase
        .from('usuarios')
        .select('rol')
        .eq('id', user.id)
        .single()

      setRol(data?.rol || '')
      setLoading(false)
    }
    verificar()
  }, [navigate])

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
      Verificando permisos...
    </div>
  )

  if (!rolesPermitidos.includes(rol || '')) return (
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
