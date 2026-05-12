import { BrowserRouter, Routes, Route } from 'react-router-dom'
import RutaProtegida from './components/RutaProtegida'
import Navbar from './components/layout/Navbar'
import Tratamientos from './pages/admin/Tratamientos'
import Home from './pages/Home'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Turnos from './pages/admin/Turnos'
import Usuarios from './pages/superadmin/Usuarios'
import MisTurnos from './pages/paciente/MisTurnos'
import Agenda from './pages/agenda/Agenda'
import ImportarPacientes from './pages/admin/ImportarPacientes'

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/admin/importar" element={
        <RutaProtegida rolesPermitidos={['admin', 'superadmin']}>
        <ImportarPacientes />
        </RutaProtegida>
        } />
        <Route path="/agenda" element={
          <RutaProtegida rolesPermitidos={['admin', 'superadmin', 'profesional', 'encargada', 'supervisora', 'secretaria', 'asistente', 'telemarketer']}>
          <Agenda />
          </RutaProtegida>
        } />
        <Route path="/agenda" element={
          <RutaProtegida>
          <Agenda />
          </RutaProtegida>
        } />
        <Route path="/admin/usuarios" element={
        <RutaProtegida rolRequerido="admin">
        <Usuarios />
        </RutaProtegida>
        } />
        <Route path="/paciente/turnos" element={
        <RutaProtegida rolRequerido="paciente">
        <MisTurnos />
        </RutaProtegida>
        } />
        <Route path="/superadmin/usuarios" element={
        <RutaProtegida rolRequerido="superadmin">
        <Usuarios />
        </RutaProtegida>
        } />
        <Route path="/admin/turnos" element={
        <RutaProtegida rolRequerido="admin">
        <Turnos />
        </RutaProtegida>
        } />
        <Route path="/admin/tratamientos" element={
        <RutaProtegida rolRequerido="admin">
        <Tratamientos />
        </RutaProtegida>
        } />
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/admin" element={
          <RutaProtegida rolRequerido="admin">
            <h1>Panel Admin</h1>
          </RutaProtegida>
        } />

        <Route path="/superadmin" element={
          <RutaProtegida rolRequerido="superadmin">
            <h1>Panel Super Admin</h1>
          </RutaProtegida>
        } />

        <Route path="/paciente" element={
          <RutaProtegida rolRequerido="paciente">
            <h1>Panel Paciente</h1>
          </RutaProtegida>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App