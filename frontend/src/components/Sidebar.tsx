import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Calendar,
  UserCog, LogOut, ChevronLeft, ChevronRight,
  Stethoscope
} from 'lucide-react'
import { logout } from '../lib/auth'

const menu = [
  { path: '/',              icon: LayoutDashboard, label: 'Home' },
  { path: '/pacientes',     icon: Users,           label: 'Pacientes' },
  { path: '/agenda',        icon: Calendar,        label: 'Agenda' },
  { path: '/practicas',     icon: Stethoscope,     label: 'Prácticas' },
  { path: '/usuarios',      icon: UserCog,         label: 'Usuarios' },
]

type SidebarProps = { collapsed: boolean; onToggle: () => void }

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <aside className={`h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-200 flex-shrink-0 relative ${collapsed ? 'w-16' : 'w-56'}`}>

      <div className={`border-b border-gray-200 flex items-center justify-center ${collapsed ? 'py-4 px-2' : 'p-4'}`}>
        <img src="/logo.jpg" alt="Clínica Odontológica"
          className={`object-cover rounded-full transition-all duration-200 ${collapsed ? 'h-8 w-8' : 'h-16 w-16'}`} />
      </div>

      <button
        onClick={onToggle}
        title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        className="absolute top-6 -right-3 z-10 flex items-center justify-center w-6 h-6 rounded-full bg-white border border-gray-200 shadow-sm text-gray-500 hover:text-gray-700 hover:shadow-md transition-all"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {menu.map(({ path, icon: Icon, label }) => (
          <NavLink key={path} to={path} end={path === '/'}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${collapsed ? 'justify-center' : ''} ${
                isActive ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
              }`
            }>
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && label}
          </NavLink>
        ))}
      </nav>

      <div className="p-2 border-t border-gray-200">
        <button onClick={handleLogout}
          title={collapsed ? 'Cerrar sesión' : undefined}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-red-50 hover:text-red-500 w-full transition-colors ${collapsed ? 'justify-center' : ''}`}>
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && 'Cerrar sesión'}
        </button>
      </div>

    </aside>
  )
}
