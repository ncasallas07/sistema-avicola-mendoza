# Sistema Web Integral para la Gestión Comercial de una Distribuidora Avícola

Plataforma web para AVÍCOLA MENDOZA que centraliza la gestión de clientes, proveedores, productos, inventario, pedidos, reportes y comprobantes comerciales, con roles y permisos dinámicos (los perfiles Administrador y Vendedor vienen precargados, pero un administrador puede crear roles nuevos y asignarles permisos sin tocar código) y tema claro/oscuro.

## Demo en línea

| Componente | Servicio | URL |
|---|---|---|
| Aplicación (frontend) | Vercel | https://avicola-mendoza.vercel.app |
| API (backend) | Render | https://avicola-mendoza-api.onrender.com |
| Base de datos | Aiven for MySQL 8.4 | Acceso privado (solo desde el backend) |

> El backend usa el plan gratuito de Render: tras ~15 minutos sin uso se suspende y la primera petición puede tardar alrededor de 50 segundos en responder. Ver [Despliegue](#despliegue).

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

| Variable | Obligatoria | Descripción |
|---|---|---|
| `DB_HOST` | Sí | Host de MySQL |
| `DB_PORT` | Sí | Puerto de MySQL (3306 por defecto) |
| `DB_USER` | Sí | Usuario de MySQL |
| `DB_PASSWORD` | Sí | Contraseña de MySQL |
| `DB_NAME` | Sí | Nombre de la base de datos |
| `DB_NAME_TEST` | No | Base usada por `npm test` (por defecto `<DB_NAME>_test`) |
| `DB_SSL` | No | `true` solo si el proveedor de MySQL exige TLS (ver [Despliegue](#despliegue)) |
| `PORT` | Sí | Puerto en el que escucha Express |
| `JWT_SECRET` | Sí | Secreto para firmar los JWT — **debe ser distinto y aleatorio en producción** |
| `JWT_EXPIRES_IN` | Sí | Vigencia del token (p. ej. `8h`) |
| `NODE_ENV` | Sí | `development` \| `test` \| `production` |
| `FRONTEND_URL` | Solo en producción | URL pública del frontend (Vercel), para CORS **y** para armar el enlace del correo de recuperación de contraseña. Admite varias separadas por coma (se usa la primera para el enlace) |
| `SMTP_HOST` | Solo en producción | Host del proveedor SMTP para enviar el correo de recuperación. Sin esto, en desarrollo el enlace se imprime en consola en vez de enviarse |
| `SMTP_PORT` | No | Puerto SMTP (587 por defecto; 465 activa conexión implícita en TLS) |
| `SMTP_USER` / `SMTP_PASSWORD` | No | Credenciales del proveedor SMTP, si las requiere |
| `SMTP_FROM` | No | Remitente del correo (por defecto `"AVÍCOLA MENDOZA" <no-reply@avicolamendoza.com>`) |

Frontend:

```bash
cd frontend
cp .env.example .env
```

| Variable | Obligatoria | Descripción |
|---|---|---|
| `VITE_API_URL` | Sí | URL base de la API. En local: `http://localhost:3000/api`. En Vercel: la URL pública del backend en Render + `/api` |

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

## Roles y permisos

El sistema de autorización es dinámico: `usuarios → rol_id → roles ↔ rol_permisos ↔ permisos`. Un administrador gestiona todo esto desde **Roles y permisos** en la interfaz (crear/editar/activar-desactivar roles, asignarles permisos, asignar un rol a cada usuario) sin modificar código. El backend es siempre la autoridad real: cada ruta exige un código de permiso concreto vía el middleware `autorizar(codigo)`, verificado contra la base de datos en cada petición (no contra el JWT), de forma que retirarle un permiso a un rol afecta de inmediato a los usuarios que lo tengan.

Los dos roles precargados por el seeder son:

- **Administrador**: todos los permisos del sistema (usuarios, roles, proveedores, productos, inventario, pedidos, reportes).
- **Vendedor**: gestiona clientes y pedidos propios, consulta productos e inventario; no accede a usuarios, roles, proveedores ni reportes.

El sistema protege además al último administrador: no es posible desactivar, eliminar o quitarle los permisos de administración al único rol/usuario capaz de gestionar roles y usuarios.

### Ficha de empleado

Además de nombre/correo/rol, un usuario puede tener datos de empleado (todos opcionales): tipo y número de documento (CC/CE/TI/PA — se exigen juntos, no uno sin el otro), teléfono, dirección, cargo, RH (lista controlada: A+, A-, B+, B-, AB+, AB-, O+, O-), EPS, ARL, fecha de nacimiento (no puede ser futura) y fecha de ingreso (no puede ser anterior a la fecha de nacimiento). Se gestionan con los mismos permisos (`usuarios.crear`/`usuarios.editar`) y endpoints ya existentes de usuarios.

## Recuperación de contraseña

Flujo independiente del login, que no usa el JWT de sesión en ningún punto:

1. `POST /api/auth/forgot-password` `{ email }` — siempre responde el mismo mensaje genérico exista o no el correo (evita enumerar usuarios). Si el correo corresponde a un usuario activo, genera un token y envía un enlace a `${FRONTEND_URL}/restablecer-contrasena?token=...`.
2. `POST /api/auth/reset-password` `{ token, password }` — valida que el token exista, no haya expirado (60 minutos) y no se haya usado antes; si es válido, actualiza la contraseña (con el mismo hash de bcrypt que usa el resto del sistema) e invalida el token de inmediato.

El token se genera con `crypto.randomBytes(32)` (no es un JWT ni se deriva de uno) y en la base de datos solo se guarda su hash SHA-256 (tabla `password_reset_tokens`), nunca el token en claro. Ambos endpoints son públicos (no requieren sesión ni permisos — recuperar la propia cuenta no depende de rol) y tienen su propio límite de solicitudes por IP, igual que el login.

## Tema claro/oscuro

La interfaz soporta modo claro y oscuro (`ThemeContext` + clase `.dark` de Tailwind), con un control visible en la barra superior y en el login. La preferencia se guarda en `localStorage` (clave `avicola-mendoza-tema`) y se aplica antes del primer render para evitar el parpadeo de tema al cargar la página.

## Seguridad

Mecanismos implementados en el backend:

- **JWT** para autenticación de sesión (`jsonwebtoken`).
- **bcrypt/bcryptjs** para el hash de contraseñas — nunca se almacenan en texto plano.
- **Joi** para validar los datos de entrada en todos los endpoints de escritura.
- **Helmet** para cabeceras HTTP de seguridad.
- **Rate limiting** (`express-rate-limit`) en el endpoint de login, para mitigar intentos de fuerza bruta. En producción (`NODE_ENV=production`) se habilita `trust proxy` con un único salto (el proxy de Render), para que el límite se aplique por IP real del cliente y no quede expuesto a spoofing vía `X-Forwarded-For`.
- **Roles y permisos** verificados en el backend en cada petición (middleware `autorizar(codigo)`), no únicamente ocultos en la interfaz.
- **CORS restringido por entorno**: en desarrollo siempre se permite `http://localhost:5173`; en producción se agrega además el dominio del frontend configurado en `FRONTEND_URL`. Nunca se usa `origin: '*'`.

## Despliegue

Arquitectura de publicación prevista:

```text
Frontend → Vercel (React + Vite)
Backend  → Railway (Node.js + Express, servidor tradicional vía "npm start")
Database → MySQL administrado en Railway
```

### Frontend (Vercel)

1. Conectar el repositorio de GitHub en Vercel, con **Root Directory = `frontend`**.
2. Build command: `npm run build` · Output directory: `dist` (detectado automáticamente para un proyecto Vite).
3. Configurar la variable de entorno `VITE_API_URL` en Vercel con la URL pública del backend en Railway (p. ej. `https://tu-backend.up.railway.app/api`).
4. `frontend/vercel.json` ya incluye el *rewrite* necesario para que rutas como `/pedidos/5` o `/roles` no devuelvan 404 al recargar directamente (fallback de SPA a `index.html`).

### Backend (Railway)

1. Conectar el repositorio; Railway detecta el proyecto Node automáticamente y ejecuta `npm start` (no requiere adaptarlo a funciones serverless).
2. Configurar las variables de entorno del backend (ver tabla en [Variables de entorno](#variables-de-entorno)), incluyendo `NODE_ENV=production` y `FRONTEND_URL` con la URL real de Vercel.
3. El `JWT_SECRET` de producción debe generarse nuevo (largo y aleatorio) y nunca reutilizar el de desarrollo.

### Base de datos (MySQL en Railway)

1. Aprovisionar un plugin de MySQL en Railway y tomar sus credenciales (host, puerto, usuario, contraseña, nombre de base) para las variables `DB_*` del backend.
2. Si el proveedor exige TLS en la conexión, poner `DB_SSL=true`.
3. Aplicar una sola vez, contra esa base (vía la consola/shell de Railway o una ejecución puntual con las variables de producción):
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

> Este repositorio no incluye URLs ni credenciales de un despliegue real: deben configurarse en Vercel/Railway por quien tenga acceso a esas cuentas.
