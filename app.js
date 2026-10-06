const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const errorHandler = require('./middlewares/errorHandler');

const authRoutes = require('./routes/auth.routes');
const usuarioRoutes = require('./routes/usuario.routes');
const clienteRoutes = require('./routes/cliente.routes');
const proveedorRoutes = require('./routes/proveedor.routes');
const categoriaRoutes = require('./routes/categoria.routes');
const productoRoutes = require('./routes/producto.routes');
const inventarioRoutes = require('./routes/inventario.routes');
const pedidoRoutes = require('./routes/pedido.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const reporteRoutes = require('./routes/reporte.routes');
const rolRoutes = require('./routes/rol.routes');
const permisoRoutes = require('./routes/permiso.routes');

const app = express();

// En producción (Railway) el proceso corre detrás de un único proxy inverso
// que termina TLS. Sin esto, req.ip siempre sería la IP de ese proxy (nunca
// la del cliente real), y el rate limit de /auth/login terminaría tratando
// a todos los usuarios como una sola IP. Se confía en un solo salto (no en
// "true", que confiaría en cualquier proxy) para no habilitar spoofing de
// IP vía la cabecera X-Forwarded-For.
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(helmet());

// En desarrollo siempre se permite el Vite dev server local; en producción
// se agrega el dominio real del frontend (Vercel) vía variable de entorno.
// Sin FRONTEND_URL configurada, solo queda habilitado el origen de
// desarrollo (nunca "*"), ya que la API usa autorización real.
const origenesPermitidos = [
  'http://localhost:5173',
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map((o) => o.trim()) : [])
];
app.use(cors({ origin: origenesPermitidos }));

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ mensaje: 'API AVÍCOLA MENDOZA funcionando' });
});

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/proveedores', proveedorRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/roles', rolRoutes);
app.use('/api/permisos', permisoRoutes);

app.use(errorHandler);

module.exports = app;
