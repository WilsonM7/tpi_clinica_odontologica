# Backend — Clínica Odontológica L&D

Backend REST API construido con Node.js + Express + Sequelize + SQLite.

## Requisitos

- Node.js 18 o superior
- npm 9 o superior

## Instalación

```bash
cd backend
npm install
```

## Variables de entorno

Copiá `.env.example` a `.env` y completá los valores:

```bash
cp .env.example .env
```

Los valores por defecto funcionan directamente para desarrollo local.

## Cómo levantar

**Modo desarrollo** (con recarga automática via nodemon):

```bash
npm run dev
```

**Modo producción:**

```bash
npm start
```

El servidor queda disponible en `http://localhost:3001`.

## Endpoint de prueba

```
GET http://localhost:3001/api/health
```

Respuesta esperada:

```json
{
  "status": "ok",
  "message": "Backend funcionando correctamente",
  "database": "conectada",
  "timestamp": "2026-06-08T..."
}
```

---

## Estructura del proyecto

```
backend/
├── src/
│   ├── config/
│   │   └── database.js        → Conexión Sequelize + SQLite
│   ├── models/
│   │   └── index.js           → Registro central de modelos (se irán agregando)
│   ├── routes/
│   │   ├── index.js           → Router raíz de /api
│   │   └── health.routes.js   → GET /api/health
│   ├── controllers/
│   │   └── health.controller.js
│   ├── services/              → Lógica de negocio (próximas fases)
│   ├── middleware/            → Auth JWT, control de roles (próximas fases)
│   └── app.js                 → Express: CORS, middlewares, rutas
├── server.js                  → Entry point: carga .env, conecta DB, levanta app
├── database.sqlite            → Archivo de BD (generado automáticamente, en .gitignore)
├── .env                       → Variables locales (no commitear)
├── .env.example               → Plantilla de variables
└── package.json
```

---

## Cómo levantar el proyecto completo

### Terminal 1 — Backend

```bash
cd backend
npm install
npm run dev
```

### Terminal 2 — Frontend

```bash
cd frontend
npm install
npm run dev
```

El frontend queda en `http://localhost:5173` y el backend en `http://localhost:3001`.

---

## Estado de la migración desde Supabase

### ✅ Fase 1 — Completada

- Estructura de carpetas del backend creada
- Servidor Express con CORS configurado para Vite
- Sequelize conectado a SQLite
- Endpoint `GET /api/health` funcionando
- Capa `frontend/src/services/api.ts` lista para consumir el backend

### 🔜 Próximas fases

| Fase | Módulo | Descripción |
|------|--------|-------------|
| 2 | Autenticación | Reemplazar `supabase.auth.*` por JWT propio (`POST /api/auth/login`) |
| 3 | Pacientes | Migrar CRUD de pacientes (`GET/POST/PUT/DELETE /api/pacientes`) |
| 4 | Prácticas y catálogo | Especialidades, consultorios, sucursales, configuración |
| 5 | Turnos / Agenda | Migrar calendario y validaciones de disponibilidad |
| 6 | Cobros / Caja | Endpoint transaccional que reemplaza los inserts múltiples de Caja.tsx |
| 7 | Usuarios y Profesionales | Reemplazar edge functions `crear-usuario` y `eliminar-usuario` |
| 8 | Orden de llegada | Migrar consultas de OrdenLlegada.tsx |
