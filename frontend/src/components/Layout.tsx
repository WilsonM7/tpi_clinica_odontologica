import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(prev => !prev)}
      />
      {/* overflow-hidden: la agenda maneja su propio scroll internamente */}
      <main className="flex-1 overflow-hidden min-w-0">
        <Outlet />
      </main>
    </div>
  )
}
