const request = require('supertest');
const app = require('../app');
const { limpiarBaseDatos, sembrarBase, crearCliente, crearProducto, PASSWORD_PRUEBA, db } = require('./helpers/db');
const { login } = require('./helpers/auth');

// Exportación de los reportes a CSV: permiso, formato compatible con Excel
// (punto y coma, BOM, CRLF y decimales con coma) y los siete reportes.
describe('Reportes: exportación CSV', () => {
  let semilla;
  let tokenAdmin;
  let tokenVendedor;

  beforeAll(async () => {
    await limpiarBaseDatos();
    semilla = await sembrarBase();
    tokenAdmin = (await login(semilla.usuarioAdmin.email, PASSWORD_PRUEBA)).token;
    tokenVendedor = (await login(semilla.usuarioVendedor1.email, PASSWORD_PRUEBA)).token;

    const cliente = await crearCliente({ nombre_razon_social: 'Asadero Ñandú "El Rey"', zona: 'Sur' });
    const producto = await crearProducto(semilla.categoria.id, { nombre: 'Pechuga', precio: 12500.5, cantidad_disponible: 3, stock_minimo: 5 });
    const pedido = await db.Pedido.create({
      numero_pedido: 'PED-800001', cliente_id: cliente.id, usuario_id: semilla.usuarioVendedor1.id,
      estado: 'Entregado', subtotal: 25001, total: 25001
    });
    await db.DetallePedido.create({ pedido_id: pedido.id, producto_id: producto.id, cantidad: 2, precio_unitario: 12500.5, subtotal_linea: 25001 });
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  const csv = (ruta, token) =>
    request(app).get(`/api/reportes/${ruta}`).query({ formato: 'csv' }).set('Authorization', `Bearer ${token}`)
      .buffer(true).parse((res, cb) => { let d = ''; res.setEncoding('utf8'); res.on('data', (c) => { d += c; }); res.on('end', () => cb(null, d)); });

  it('un usuario sin reportes.exportar no puede descargar el CSV', async () => {
    const res = await csv('ventas', tokenVendedor);
    expect(res.status).toBe(403);
  });

  it('un rol con reportes.ver pero sin reportes.exportar ve el reporte y no lo descarga', async () => {
    const permisos = await db.Permiso.findAll({ where: { codigo: ['reportes.ver'] } });
    const rol = await db.Rol.create({ nombre: 'Consulta reportes', estado: 'activo' });
    await rol.setPermisos(permisos);
    await request(app).post('/api/usuarios').set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Consulta', email: 'consulta@avicolamendoza.com', password: 'Clave12345', rol_id: rol.id });
    const token = (await login('consulta@avicolamendoza.com', 'Clave12345')).token;
    expect((await request(app).get('/api/reportes/ventas').set('Authorization', `Bearer ${token}`)).status).toBe(200);
    expect((await csv('ventas', token)).status).toBe(403);
  });

  it('el CSV se entrega con el tipo, el nombre de archivo y el formato que espera Excel', async () => {
    const res = await csv('pedidos', tokenAdmin);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv; charset=utf-8/);
    expect(res.headers['content-disposition']).toMatch(/attachment; filename="pedidos_por_periodo\.csv"/);
    const texto = res.body;
    expect(texto.startsWith('﻿')).toBe(true);
    const lineas = texto.slice(1).split('\r\n');
    expect(lineas.length).toBe(2);
    expect(lineas[0]).toContain('";"');
    // Relación incluida: se muestra el nombre del cliente, con las comillas escapadas.
    expect(lineas[1]).toContain('"Asadero Ñandú ""El Rey"""');
    // Fechas en formato AAAA-MM-DD HH:mm.
    expect(lineas[1]).toMatch(/"\d{4}-\d{2}-\d{2} \d{2}:\d{2}"/);
  });

  it('los valores decimales se escriben con coma', async () => {
    const res = await csv('productos-mas-vendidos', tokenAdmin);
    expect(res.status).toBe(200);
    expect(res.body).not.toMatch(/\d\.\d/);
  });

  it('los siete reportes se pueden descargar en CSV', async () => {
    for (const ruta of ['ventas', 'pedidos', 'ventas-por-vendedor', 'productos-mas-vendidos', 'inventario', 'stock-bajo', 'clientes-por-zona']) {
      const res = await csv(ruta, tokenAdmin);
      expect(res.status).toBe(200);
      expect(res.body.startsWith('﻿')).toBe(true);
    }
  });

  it('un reporte sin datos devuelve un CSV vacío y válido', async () => {
    const res = await csv('ventas?desde=2000-01-01&hasta=2000-01-02', tokenAdmin);
    expect(res.status).toBe(200);
    expect(res.body).toBe('\uFEFF');
  });
});
