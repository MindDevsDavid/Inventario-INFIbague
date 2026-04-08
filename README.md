# Inventario TI

Sistema web para la gestión de activos tecnológicos de una organización. Permite registrar, editar y dar seguimiento a equipos, software y otros recursos de TI, asignándolos a encargados responsables.

---

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS v4 |
| Backend | Go + Fiber v2 |
| Base de datos | PostgreSQL 16 (Docker) |
| Autenticación | JWT (HS256, 8h) + bcrypt |

---

## Categorías de activos

- Programas
- Computadores
- Teléfonos
- UPSs
- Licencias
- Monitores
- Impresoras

Cada categoría tiene campos específicos (marca, modelo, serie, etc.) almacenados de forma dinámica.

---

## Requisitos previos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Go 1.21+](https://go.dev/dl/)
- [Node.js 18+](https://nodejs.org/)

---

## Configuración inicial

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd Inventario
```

### 2. Variables de entorno del backend (opcional)

El backend funciona con valores por defecto para desarrollo. Para producción, crea un archivo `.env` en `backend/`:

```env
JWT_SECRET=tu_secreto_seguro_aqui
ADMIN_USERNAME=admin
ADMIN_PASSWORD=tu_contraseña_segura
CORS_ORIGIN=http://localhost:5173
DATABASE_URL=postgres://inventario:inventario123@127.0.0.1:5433/inventario?sslmode=disable
```

---

## Cómo iniciar el proyecto

### 1. Iniciar Docker Desktop

Abre Docker Desktop y espera a que el servicio esté activo.

### 2. Iniciar la base de datos

```bash
docker compose up db -d
```

### 3. Iniciar el backend

```bash
cd backend
go run ./cmd/main.go
```

El backend estará disponible en `http://localhost:8080`.

### 4. Iniciar el frontend

```bash
cd frontend
npm install   # solo la primera vez
npm run dev
```

El frontend estará disponible en `http://localhost:5173`.

---

## Cómo apagar el proyecto

```bash
# Detener la base de datos
docker compose stop db

# El backend y frontend se detienen cerrando la terminal o con Ctrl+C
```

---

## Estructura del proyecto

```
Inventario/
├── backend/
│   ├── cmd/
│   │   └── main.go              # Punto de entrada, middleware y rutas
│   └── internal/
│       ├── config/              # Variables de entorno
│       ├── database/            # Conexión y migraciones de PostgreSQL
│       ├── handlers/            # Controladores HTTP (auth, items, encargados, users)
│       ├── middleware/          # JWT y control de roles
│       └── models/              # Structs de datos
├── frontend/
│   └── src/
│       ├── components/          # Navbar, ItemModal, ProtectedRoute
│       ├── config/              # Campos por categoría
│       ├── pages/               # Dashboard, Inventory, Encargados, Users, Login
│       └── services/
│           └── api.js           # Cliente Axios con interceptores
├── docker-compose.yml
└── README.md
```

---

## Roles de usuario

| Rol | Permisos |
|-----|---------|
| `admin` | Acceso completo: activos, encargados y gestión de usuarios |
| `usuario` | Acceso a activos y encargados (sin gestión de usuarios) |

El usuario `admin` se crea automáticamente al iniciar el backend si no existe.

---

## API

Base URL: `http://localhost:8080/api`

| Método | Ruta | Descripción | Rol requerido |
|--------|------|-------------|---------------|
| POST | `/auth/login` | Iniciar sesión | Público |
| GET | `/items` | Listar activos | Autenticado |
| POST | `/items` | Crear activo | Autenticado |
| PUT | `/items/:id` | Editar activo | Autenticado |
| DELETE | `/items/:id` | Eliminar activo | Autenticado |
| GET | `/encargados` | Listar encargados | Autenticado |
| POST | `/encargados` | Crear encargado | Autenticado |
| PUT | `/encargados/:id` | Editar encargado | Autenticado |
| PATCH | `/encargados/:id/toggle` | Activar/desactivar encargado | Autenticado |
| GET | `/users` | Listar usuarios | Admin |
| POST | `/users` | Crear usuario | Admin |
| PUT | `/users/:id` | Editar usuario | Admin |
| PATCH | `/users/:id/toggle` | Activar/desactivar usuario | Admin |
| GET | `/dashboard` | Resumen por categoría | Autenticado |
