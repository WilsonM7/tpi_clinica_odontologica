# Backend — Clínica Odontológica

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
│   │   └── database.js          → Conexión Sequelize + SQLite
│   ├── models/
│   │   └── index.js             → Modelos y asociaciones
│   ├── routes/
│   │   ├── index.js             → Router raíz de /api
│   │   ├── auth.routes.js       → POST /api/auth/login, GET /api/auth/me
│   │   └── ...                  → Resto de rutas
│   ├── controllers/             → Lógica de cada endpoint
│   ├── middleware/
│   │   └── auth.middleware.js   → Verificación de JWT
│   └── app.js                   → Express: CORS, middlewares, rutas
├── server.js                    → Entry point
├── database.sqlite              → Archivo de BD (en .gitignore)
├── .env                         → Variables locales (no commitear)
├── .env.example                 → Plantilla de variables
└── package.json
```

---

## Cómo levantar el proyecto completo

### Terminal 1 — Backend

```bash
cd backend
npm install
npm run seed   # Solo la primera vez o al modificar modelos
npm run dev
```

### Terminal 2 — Frontend

```bash
cd frontend
npm install
npm run dev
```

El frontend queda en `http://localhost:5173` y el backend en `http://localhost:3001`.
