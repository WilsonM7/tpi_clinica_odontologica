import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, DollarSign, Calendar, UserCog, LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'


const menu = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/pacientes', icon: Users, label: 'Pacientes' },
  { path: '/caja', icon: DollarSign, label: 'Caja' },
  { path: '/agenda', icon: Calendar, label: 'Agenda' },
  { path: '/usuarios', icon: UserCog, label: 'Usuarios' },
]

export default function Sidebar() {
  return (
    <aside className="w-56 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <img src="/logo.jpg" alt="L&D" className="h-60 w-60 object-cover rounded-full" />
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {menu.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-gray-200">
        <button
          onClick={() => supabase.auth.signOut()}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-red-50 hover:text-red-500 w-full transition-colors"
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}