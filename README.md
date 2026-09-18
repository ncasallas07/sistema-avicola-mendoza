# Sistema Web Integral para la Gestión Comercial de una Distribuidora Avícola

Plataforma web para AVÍCOLA MENDOZA que centraliza la gestión de clientes, proveedores, productos, inventario, pedidos, reportes y comprobantes comerciales, con control de acceso por roles (Administrador y Vendedor).

## Tecnologías

**Frontend**
- React 19
- Vite
- Tailwind CSS v4

**Backend**
- Node.js 24
- Express 5
- Sequelize 6
- MySQL

**Seguridad**
- JWT
- bcrypt
- Joi (validación de datos)

**Testing**
- Jest
- Supertest
- Playwright (verificación funcional/responsive del frontend)

## Estructura del proyecto

```
avicola-mendoza-backend/
├── app.js                 # Configuración de la app Express (rutas, middlewares)
├── server.js               # Punto de arranque (conecta BD y levanta el servidor)
├── config/                 # Configuración de Sequelize (desarrollo/test/producción)
├── models/                 # Modelos Sequelize
├── migrations/             # Migraciones de base de datos
├── seeders/                 # Datos iniciales de ejemplo (roles, usuario admin, etc.)
├── controllers/             # Controladores HTTP (delgados, delegan a services)
├── services/                # Reglas de negocio
├── routes/                   # Definición de endpoints por módulo
├── middlewares/               # Autenticación, validación, manejo de errores
├── validators/                 # Esquemas Joi por módulo
├── utils/                       # Utilidades (comprobante PDF, CSV, respuesta estándar)
├── tests/                       # Suite de pruebas automatizadas (Jest + Supertest)
│   └── helpers/                  # Utilidades para pruebas (seed, limpieza de BD, login)
└── frontend/                     # Aplicación React (Vite)
    └── src/
        ├── pages/                  # Pantallas de la aplicación
        ├── components/              # Componentes de UI reutilizables
        ├── services/                 # Cliente HTTP hacia la API
        ├── context/                   # Autenticación y notificaciones (toasts)
        └── hooks/                      # Hooks reutilizables
```

## Requisitos previos

- Node.js 24.x y npm (versión usada durante el desarrollo: Node v24.20.0 / npm 11.19.0).
- Un servidor MySQL accesible (local o remoto).
- Los archivos `.env` (raíz y `frontend/`) configurados a partir de sus respectivos `.env.example` — ver la sección [Variables de entorno](#variables-de-entorno).

## Instalación

Backend (desde la raíz del proyecto):

```bash
npm install
```

Frontend:

```bash
cd frontend
npm install
```

## Variables de entorno

Copia los archivos de ejemplo y completa los valores reales localmente. **Nunca subas `.env` al repositorio.**

Backend:

```bash
cp .env.example .env
```

Variables requeridas: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`, `PORT`, `JWT_SECRET`, `JWT_EXPIRES_IN`.

Frontend:

```bash
cd frontend
cp .env.example .env
```

Variable requerida: `VITE_API_URL` (URL base de la API, por defecto `http://localhost:3000/api`).

## Ejecución

Backend:

```bash
npm run dev
```

Frontend (en otra terminal):

```bash
cd frontend
npm run dev
```

Antes del primer arranque, aplica las migraciones y carga los datos iniciales:

```bash
npm run db:migrate
npm run db:seed
```

## Build

Build de producción del frontend:

```bash
cd frontend
npm run build
```

Genera la carpeta `frontend/dist/` con los archivos estáticos listos para desplegar. `dist/` es un artefacto de compilación generado, no código fuente — está excluido de Git mediante `.gitignore` y no debe subirse al repositorio.

## Testing

El backend cuenta con una suite automatizada (Jest + Supertest) que cubre autenticación, roles y permisos, clientes, proveedores, productos, el flujo crítico de pedidos + inventario (creación, confirmación, cancelación, trazabilidad), dashboard, reportes y la generación del comprobante en PDF.

```bash
npm test
```

Las pruebas corren contra una base de datos separada (`avicola_mendoza_test` por defecto) para no afectar los datos de desarrollo. Antes de la primera ejecución, aplica las migraciones sobre esa base:

```bash
npm run db:migrate:test
```

El frontend se verificó funcionalmente y en distintos tamaños de pantalla mediante Playwright durante el desarrollo; no cuenta con una suite automatizada persistida en el repositorio.

## Roles

- **Administrador**: acceso completo (usuarios, proveedores, productos, inventario, pedidos, reportes).
- **Vendedor**: gestiona clientes y pedidos propios, consulta productos e inventario; no accede a usuarios, proveedores ni reportes.

## Seguridad

Mecanismos implementados en el backend:

- **JWT** para autenticación de sesión (`jsonwebtoken`).
- **bcrypt/bcryptjs** para el hash de contraseñas — nunca se almacenan en texto plano.
- **Joi** para validar los datos de entrada en todos los endpoints de escritura.
- **Helmet** para cabeceras HTTP de seguridad.
- **Rate limiting** (`express-rate-limit`) en el endpoint de login, para mitigar intentos de fuerza bruta.
- **Roles y permisos** verificados en el backend (middlewares de autenticación/autorización), no únicamente ocultos en la interfaz.
- **CORS** habilitado a nivel de aplicación.

CORS está configurado actualmente de forma abierta, apropiada para el entorno de desarrollo. Antes de un despliegue público debe restringirse al dominio real del frontend.
