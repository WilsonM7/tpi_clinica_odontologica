import { useNavigate } from 'react-router-dom'
import { FileQuestion } from 'lucide-react'

export default function NoEncontrado() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 py-24">
      <div className="bg-gray-50 border border-gray-200 rounded-full p-5">
        <FileQuestion size={40} className="text-gray-400" />
      </div>
      <div className="text-center">
        <p className="text-lg font-semibold text-gray-700">Página no encontrada</p>
        <p className="text-sm text-gray-400 mt-1">
          La página que buscás no existe o fue movida.
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
}
