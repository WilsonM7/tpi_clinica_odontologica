# Sistema de Gestión — Clínica Odontológica

Trabajo Práctico Integrador — Programación III

Aplicación web para la gestión de una clínica odontológica. Permite administrar pacientes, turnos, prácticas y profesionales desde una interfaz web con backend propio.

---

## Tecnologías utilizadas

**Frontend:** React + Vite + TypeScript, Tailwind CSS  
**Backend:** Node.js + Express, Sequelize v6, SQLite  
**Autenticación:** Supabase Auth (pendiente de migración al backend propio)

---

## Estructura del proyecto

```
tpi_clinica_odontologica/
├── backend/      # API REST con Node.js + Express
└── frontend/     # Aplicación React + Vite
```

---

## Requisitos previos

- Node.js v18 o superior
- npm

---

## Cómo ejecutar el backend

```bash
cd backend
npm install
npm run seed     # Crea las tablas y carga datos de ejemplo
npm run dev      # Inicia el servidor en http://localhost:3001
```

Para verificar que el servidor está corriendo: `http://localhost:3001/api/health`

---

## Cómo ejecutar el frontend

```bash
cd frontend
npm install
npm run dev      # Inicia la app en http://localhost:5173
```

---

## Variables de entorno

Tanto el backend como el frontend requieren un archivo `.env` en su carpeta respectiva. Cada uno tiene un `.env.example` como referencia.

**Backend (`backend/.env`):** configuración de puerto, base de datos y claves de Supabase.  
**Frontend (`frontend/.env`):** URL del backend y claves de Supabase para autenticación.

No commitear archivos `.env` con valores reales.

---

## Carga de datos iniciales

El comando `npm run seed` (ejecutado desde `backend/`) elimina y recrea todas las tablas, luego inserta datos de prueba: una sede, consultorios, profesionales, pacientes y turnos para la semana actual.

Hay que correrlo al menos una vez antes de usar la app, y también cada vez que se modifique el esquema de la base de datos.

---

## Funcionalidades principales

- Login con sesión persistente
- Gestión de pacientes (alta, edición, búsqueda, desactivación)
- Ficha de paciente con historial de tratamientos y cobros
- Agenda de turnos semanal/mensual para una sede
- Gestión de prácticas odontológicas por especialidad
- Gestión de usuarios y profesionales
- Orden de llegada diaria