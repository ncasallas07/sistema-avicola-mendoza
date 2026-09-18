const bcrypt = require('bcryptjs');
const db = require('../../models');

const PASSWORD_PRUEBA = 'Cambiar123!';

// Orden que respeta las llaves foráneas al vaciar la base de datos de pruebas
// entre archivos de test (FK checks se desactivan igual, pero mantener el
// orden documenta las dependencias reales del esquema).
const TABLAS_EN_ORDEN_DE_BORRADO = [
  'movimientos_inventario',
  'detalle_pedidos',
  'pedidos',
  'productos',
  'categorias',
  'clientes',
  'proveedores',
  'usuarios',
  'roles'
];

const limpiarBaseDatos = async () => {
  await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const tabla of TABLAS_EN_ORDEN_DE_BORRADO) {
    await db.sequelize.query(`TRUNCATE TABLE ${tabla}`);
  }
  await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
};

// Datos base mínimos que casi todas las suites necesitan: roles, un admin,
// dos vendedores (para probar aislamiento entre ellos) y una categoría.
const sembrarBase = async () => {
  const rolAdmin = await db.Rol.create({ nombre: 'Admin' });
  const rolVendedor = await db.Rol.create({ nombre: 'Vendedor' });

  // Costo de hash bajo únicamente en pruebas, para que la suite corra rápido;
  // el flujo de login real (bcrypt.compare) funciona igual sin importar el costo.
  const passwordHash = await bcrypt.hash(PASSWORD_PRUEBA, 4);

  const usuarioAdmin = await db.Usuario.create({
    nombre: 'Admin de prueba',
    email: 'admin.test@avicolamendoza.com',
    password: passwordHash,
    rol_id: rolAdmin.id,
    estado: 'activo'
  });

  const usuarioVendedor1 = await db.Usuario.create({
    nombre: 'Vendedor Uno',
    email: 'vendedor1.test@avicolamendoza.com',
    password: passwordHash,
    rol_id: rolVendedor.id,
    estado: 'activo'
  });

  const usuarioVendedor2 = await db.Usuario.create({
    nombre: 'Vendedor Dos',
    email: 'vendedor2.test@avicolamendoza.com',
    password: passwordHash,
    rol_id: rolVendedor.id,
    estado: 'activo'
  });

  const usuarioInactivo = await db.Usuario.create({
    nombre: 'Usuario Inactivo',
    email: 'inactivo.test@avicolamendoza.com',
    password: passwordHash,
    rol_id: rolVendedor.id,
    estado: 'inactivo'
  });

  const categoria = await db.Categoria.create({ nombre: 'General', descripcion: 'Categoría de pruebas' });

  return { rolAdmin, rolVendedor, usuarioAdmin, usuarioVendedor1, usuarioVendedor2, usuarioInactivo, categoria };
};

const crearCliente = (overrides = {}) =>
  db.Cliente.create({
    nombre_razon_social: 'Cliente de prueba',
    documento: `DOC-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    zona: 'Norte',
    estado: 'activo',
    ...overrides
  });

const crearProducto = (categoriaId, overrides = {}) =>
  db.Producto.create({
    nombre: 'Producto de prueba',
    categoria_id: categoriaId,
    unidad_medida: 'kg',
    precio: 10000,
    cantidad_disponible: 50,
    stock_minimo: 5,
    estado: 'activo',
    ...overrides
  });

module.exports = { limpiarBaseDatos, sembrarBase, crearCliente, crearProducto, PASSWORD_PRUEBA, db };
