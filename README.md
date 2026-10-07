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
| `BREVO_API_KEY` | Solo en producción | API key de Brevo para enviar el correo de recuperación por HTTPS (opción usada en Render, que bloquea los puertos SMTP en el plan gratuito). Tiene prioridad sobre SMTP |
| `MAIL_FROM_EMAIL` | Con Brevo | Correo remitente, previamente verificado en Brevo |
| `MAIL_FROM_NAME` | No | Nombre del remitente (por defecto `AVÍCOLA MENDOZA`) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` | No | Alternativa por SMTP, solo para hostings que permitan esos puertos. Sin Brevo ni SMTP, en desarrollo el enlace de recuperación se imprime en consola |

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

La aplicación está publicada con servicios en plan gratuito:

```text
Usuario ──▶ Vercel (React + Vite)  ──HTTPS──▶  Render (Node.js + Express)  ──TLS──▶  Aiven (MySQL 8.4)
            avicola-mendoza.vercel.app         avicola-mendoza-api.onrender.com
                                                        │
                                                        └──HTTPS──▶ Brevo (correo de recuperación)
```

Vercel despliega el frontend automáticamente con cada `git push` a `main`. **Render no**: el servicio está conectado como repositorio público, sin despliegue automático, así que después de cada `git push` hay que entrar a Render → *Manual Deploy* → *Deploy latest commit* (o conectar la cuenta de GitHub en *Settings → Repository* para activar el despliegue automático).

### Base de datos (Aiven for MySQL)

1. Crear un servicio **MySQL** en el plan **Free** de Aiven.
2. Tomar de *Connection information* el host, puerto, usuario (`avnadmin`), contraseña y base (`defaultdb`) para las variables `DB_*` del backend.
3. Aiven exige conexión cifrada, por lo que el backend usa `DB_SSL=true`.
4. Aiven exige que todas las tablas tengan llave primaria; las migraciones del proyecto ya cumplen esta condición.

### Backend (Render)

1. Crear un **Web Service** en Render a partir del repositorio, en el plan **Free**.
2. Configuración del servicio:

   | Campo | Valor |
   |---|---|
   | Root Directory | *(vacío, raíz del repositorio)* |
   | Build Command | `npm ci --include=dev` |
   | Start Command | `npm run db:migrate && npm start` |

   `--include=dev` es necesario porque `sequelize-cli` (usado por las migraciones) está en `devDependencies` y, con `NODE_ENV=production`, npm lo omitiría. Las migraciones pendientes se aplican solas en cada despliegue.
3. Variables de entorno:

   | Variable | Valor |
   |---|---|
   | `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Datos de conexión de Aiven |
   | `DB_SSL` | `true` |
   | `NODE_ENV` | `production` |
   | `NODE_VERSION` | `24` |
   | `JWT_SECRET` | Valor aleatorio (botón *Generate* de Render) |
   | `JWT_EXPIRES_IN` | `8h` |
   | `FRONTEND_URL` | `https://avicola-mendoza.vercel.app` |
   | `BREVO_API_KEY` | API key de Brevo (recuperación de contraseña) |
   | `MAIL_FROM_EMAIL` | Remitente verificado en Brevo |
   | `MAIL_FROM_NAME` | `AVÍCOLA MENDOZA` (opcional) |

   `PORT` no se define: Render lo asigna automáticamente.
4. **Datos iniciales (solo la primera vez):** el primer despliegue se hizo con el Start Command `npm run db:migrate && npm run db:seed && npm start` y, una vez cargados los datos, se dejó en `npm run db:migrate && npm start`. Los seeders no llevan registro de ejecución, así que **no deben volver a incluirse en el comando de inicio**.

### Correo de recuperación (Brevo)

Desde septiembre de 2025 los servicios gratuitos de Render bloquean la salida a los puertos SMTP (25, 465 y 587), así que el correo se envía con la **API HTTPS de Brevo** (puerto 443) en vez de SMTP:

1. Crear una cuenta gratuita en Brevo y verificar el correo remitente (*Senders, Domains & Dedicated IPs → Senders*).
2. Generar una API key (*SMTP & API → API Keys*).
3. Configurar en Render `BREVO_API_KEY` y `MAIL_FROM_EMAIL` (el remitente verificado) y volver a desplegar.

Si el envío falla, el usuario igual ve el mensaje genérico (para no revelar qué correos existen) y el motivo queda en los logs de Render como `No se pudo enviar el correo de recuperación: ...`.

### Frontend (Vercel)

1. Importar el repositorio en Vercel como proyecto único con **Root Directory = `frontend`** (preset Vite; build `npm run build`, salida `dist`).
2. Variable de entorno: `VITE_API_URL=https://avicola-mendoza-api.onrender.com/api`.
3. `frontend/vercel.json` incluye el *rewrite* que redirige todas las rutas a `index.html`, para que recargar `/pedidos/5`, `/roles` o `/restablecer-contrasena` no devuelva 404.

### Limitaciones del plan gratuito

- **Render:** el servicio se suspende tras ~15 minutos sin tráfico; la primera petición posterior puede tardar ~50 segundos.
- **Aiven:** el servicio gratuito se apaga tras un periodo de inactividad; si el backend no logra conectarse, se enciende desde la consola de Aiven (*Power on*).

> Las credenciales reales (contraseña de la base, `JWT_SECRET`, `BREVO_API_KEY`) solo están configuradas en los paneles de Render y Aiven; nunca se suben al repositorio.
