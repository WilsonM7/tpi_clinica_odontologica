import { useState } from 'react'

const IMPORTACIONES = [
  {
    key: 'pacientes',
    titulo: 'Importar Pacientes (BASE DD)',
    descripcion: 'Importa los datos básicos de pacientes desde la pestaña BASE DD.',
    endpoint: 'http://localhost:3000/api/import/pacientes',
    campo: 'archivo'
  },
  {
    key: 'hcorto',
    titulo: 'Importar Seguimientos HC ORTO',
    descripcion: 'Importa los tratamientos activos de ortodoncia desde la pestaña HC ORTO.',
    endpoint: 'http://localhost:3000/api/import/hc-orto',
    campo: 'archivo'
  },
  {
  key: 'aband',
  titulo: 'Importar Abandonos (ABAND)',
  descripcion: 'Importa pacientes que abandonaron su tratamiento de ortodoncia.',
  endpoint: 'http://localhost:3000/api/import/aband',
  campo: 'archivo'
  },
  {
  key: 'retiro',
  titulo: 'Importar Retiros (RETIRO)',
  descripcion: 'Importa pacientes que finalizaron o se retiraron del tratamiento.',
  endpoint: 'http://localhost:3000/api/import/retiro',
  campo: 'archivo'
  }
]

function SeccionImport({ config }) {
  const [archivo, setArchivo] = useState(null)
  const [resultado, setResultado] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  const handleImportar = async () => {
    if (!archivo) { setError('Seleccioná un archivo Excel'); return }
    setCargando(true)
    setError('')
    setResultado(null)

    const formData = new FormData()
    formData.append(config.campo, archivo)

    try {
      const res = await fetch(config.endpoint, { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setResultado(data)
    } catch (err) {
      setError('No se pudo conectar con el servidor')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div style={{ background: '#f9f9f9', border: '1px solid #ddd', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem' }}>
      <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>{config.titulo}</h2>
      <p style={{ color: '#666', fontSize: '0.9rem' }}>{config.descripcion}</p>

      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={(e) => { setArchivo(e.target.files[0]); setResultado(null); setError('') }}
        style={{ display: 'block', marginBottom: '1rem' }}
      />

      {error && <p style={{ color: 'red', fontSize: '0.9rem' }}>{error}</p>}

      <button
        onClick={handleImportar}
        disabled={cargando || !archivo}
        style={{ background: '#2c3e50', color: 'white', padding: '0.6rem 1.2rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        {cargando ? 'Importando...' : 'Importar'}
      </button>

      {resultado && (
        <div style={{ marginTop: '1rem', background: '#e8f8f5', padding: '1rem', borderRadius: '6px' }}>
          <p style={{ color: '#16a085', fontWeight: 'bold' }}>✅ {resultado.mensaje}</p>
          <p><strong>Importados:</strong> {resultado.importados}</p>
          <p><strong>Omitidos:</strong> {resultado.omitidos}</p>
          {resultado.errores?.length > 0 && (
            <div>
              <p><strong>Errores ({resultado.errores.length}):</strong></p>
              {resultado.errores.map((e, i) => (
                <p key={i} style={{ color: 'red', fontSize: '0.82rem', margin: '2px 0' }}>{e}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ImportarPacientes() {
  return (
    <div style={{ padding: '2rem', maxWidth: '650px' }}>
      <h1>Importar Datos</h1>
      <p style={{ color: '#666' }}>Ejecutá cada importación en orden: primero BASE DD, luego HC ORTO.</p>
      {IMPORTACIONES.map(config => (
        <SeccionImport key={config.key} config={config} />
      ))}
    </div>
  )
}

export default ImportarPacientes