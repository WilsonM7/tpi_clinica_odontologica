import { createContext, type ReactNode } from 'react'
import type { User } from '../lib/auth'

// Context de autenticación: centraliza el usuario logueado y los permisos por rol.
// Antes cada pantalla leía getUser() por su cuenta y definía sus roles a mano.
type AuthContextType = {
  user: User | null
  rol: string
  puedeGestionarUsuarios: boolean
  puedeGestionarPracticas: boolean
  puedeDesactivarPaciente: boolean
  puedeEliminarPaciente: boolean
  puedeAgendar: boolean
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  rol: '',
  puedeGestionarUsuarios: false,
  puedeGestionarPracticas: false,
  puedeDesactivarPaciente: false,
  puedeEliminarPaciente: false,
  puedeAgendar: false,
})

export function AuthProvider({ user, children }: { user: User | null; children: ReactNode }) {
  const rol = user?.rol || ''

  const value: AuthContextType = {
    user,
    rol,
    puedeGestionarUsuarios: ['admin', 'super_admin'].includes(rol),
    puedeGestionarPracticas: ['super_admin', 'jefe_clinica','admin'].includes(rol),
    puedeDesactivarPaciente: ['admin','super_admin', 'jefe_clinica'].includes(rol),
    puedeEliminarPaciente: rol === 'super_admin',
    puedeAgendar: ['super_admin', 'jefe_clinica', 'secretaria', 'telemarketer', 'supervisora', 'admin'].includes(rol),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
