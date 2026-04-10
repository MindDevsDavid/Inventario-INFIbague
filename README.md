# Inventario TI

Sistema web para la gestión de activos tecnológicos y soporte técnico de una organización. Permite registrar, editar y dar seguimiento a equipos, software y otros recursos de TI, asignándolos a encargados responsables. Incluye un sistema de tickets de soporte con historial y comunicación entre usuarios y técnicos.

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
│       ├── handlers/            # Controladores HTTP (auth, items, encargados, users, tickets)
│       ├── middleware/          # JWT y control de roles
│       └── models/              # Structs de datos
├── frontend/
│   └── src/
│       ├── components/          # Navbar, ItemModal, TicketModal, ProtectedRoute
│       ├── config/              # Campos por categoría
│       ├── pages/               # Dashboard, Inventory, Encargados, Users, Support, TicketDetail, Login
│       └── services/
│           └── api.js           # Cliente Axios con interceptores
├── docker-compose.yml
└── README.md
```

---

## Roles de usuario

| Rol | Activos | Encargados | Usuarios | Soporte |
|-----|---------|------------|----------|---------|
| `admin` | CRUD completo | Editar, activar/desactivar | CRUD completo | Ve todos los tickets, asigna técnicos, cambia estado/urgencia |
| `operador` | Crear, editar | Editar, activar/desactivar | — | Ve solo tickets asignados a él, cambia estado/urgencia (no puede reasignar técnico) |
| `usuario` | Solo lectura | Solo lectura | — | Crea tickets, ve solo los suyos, envía comunicaciones |

El usuario `admin` se crea automáticamente al iniciar el backend si no existe.

Al crear un usuario se crea automáticamente su encargado vinculado. El campo **Oficina** determina qué activos puede ver cada usuario al crear un ticket.

---

## Sistema de soporte

### Flujo de un ticket

1. Un **usuario** crea una solicitud seleccionando tipo de incidencia, urgencia y opcionalmente un activo de su oficina.
2. Un **admin** asigna el ticket a un técnico (operador).
3. El **operador** gestiona el ticket: cambia estado y urgencia, agrega notas privadas o comunicaciones.
4. El **usuario** puede ver el estado del ticket y enviar comunicaciones.

### Estados de un ticket

| Estado | Descripción |
|--------|-------------|
| Abierto | Recién creado, pendiente de atención |
| En Proceso | Un técnico está trabajando en él |
| Esperando respuesta | Se requiere información del usuario |
| Esperando repuesto | En espera de un componente o recurso |
| Resuelto | El problema fue solucionado |
| Cerrado | Ticket finalizado |

### Urgencias

Baja, Media, Alta, Crítica.

### Historial

Cada ticket mantiene un historial automático de cambios (estado, urgencia, asignación de técnico) y permite dos tipos de mensajes:

- **Comunicación**: visible para todos (usuario, operador, admin).
- **Nota privada**: visible solo para operadores y admins.

---

## API

Base URL: `http://localhost:8080/api`

### Autenticación

| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| POST | `/auth/login` | Iniciar sesión | Público |

### Perfil

| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| GET | `/me` | Datos del usuario autenticado | Autenticado |
| GET | `/me/assets` | Activos de la oficina del usuario | Autenticado |

### Activos

| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| GET | `/items` | Listar activos | Autenticado |
| GET | `/items/:id` | Detalle de un activo | Autenticado |
| POST | `/items` | Crear activo | Admin / Operador |
| PUT | `/items/:id` | Editar activo | Admin / Operador |
| DELETE | `/items/:id` | Eliminar activo | Admin |

### Encargados

| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| GET | `/encargados` | Listar encargados | Autenticado |
| PUT | `/encargados/:id` | Editar encargado | Admin / Operador |
| PATCH | `/encargados/:id/toggle` | Activar/desactivar encargado | Admin / Operador |

### Usuarios

| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| GET | `/users` | Listar usuarios | Admin |
| POST | `/users` | Crear usuario (+ encargado) | Admin |
| PUT | `/users/:id` | Editar usuario | Admin |
| PATCH | `/users/:id/toggle` | Activar/desactivar usuario | Admin |

### Tickets de soporte

| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| GET | `/tickets` | Listar tickets (filtrado por rol) | Autenticado |
| GET | `/tickets/:id` | Detalle de un ticket | Autenticado (con restricción por rol) |
| POST | `/tickets` | Crear ticket | Autenticado |
| PUT | `/tickets/:id` | Actualizar estado/urgencia/técnico | Admin / Operador |
| GET | `/tickets/:id/history` | Historial del ticket | Autenticado (con restricción por rol) |
| POST | `/tickets/:id/notes` | Agregar nota o comunicación | Autenticado (con restricción por rol) |
| GET | `/tecnicos` | Listar técnicos disponibles | Autenticado |

### Dashboard

| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| GET | `/dashboard` | Resumen por categoría | Autenticado |
