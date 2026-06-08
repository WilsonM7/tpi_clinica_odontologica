import { useNavigate } from 'react-router-dom'
import { Users, Calendar, Stethoscope, UserCog} from 'lucide-react'

const SECCIONES = [
  {
    path: '/pacientes',
    icon: Users,
    label: 'Pacientes',
    descripcion: 'Gestión de pacientes',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    hover: 'hover:bg-blue-100 hover:border-blue-300',
  },
  {
    path: '/agenda',
    icon: Calendar,
    label: 'Agenda',
    descripcion: 'Turnos y horarios',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    hover: 'hover:bg-purple-100 hover:border-purple-300',
  },
  {
    path: '/practicas',
    icon: Stethoscope,
    label: 'Prácticas',
    descripcion: 'Gestión de prácticas',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    hover: 'hover:bg-orange-100 hover:border-orange-300',
  },
  {
    path: '/usuarios',
    icon: UserCog,
    label: 'Usuarios',
    descripcion: 'Gestión de usuarios',
    color: 'text-gray-600',
    bg: 'bg-gray-50',
    hover: 'hover:bg-gray-100 hover:border-gray-300',
  },
]

export default function Dashboard() {
  const navigate = useNavigate()

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-800">Home</h1>
          <p className="text-gray-500 mt-1">Bienvenido al sistema de gestión de Clinica Odontológica L&D</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {SECCIONES.map(({ path, icon: Icon, label, descripcion, color, bg, hover }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-transparent ${bg} ${hover} transition-all duration-150 cursor-pointer group`}
            >
              <div className={`p-3 rounded-xl bg-white shadow-sm group-hover:shadow-md transition-shadow`}>
                <Icon size={32} className={color} />
              </div>
              <div className="text-center">
                <p className={`font-semibold text-sm ${color}`}>{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{descripcion}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
