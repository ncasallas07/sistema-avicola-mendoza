const request = require('supertest');
const app = require('../app');
const { limpiarBaseDatos, sembrarBase, crearCliente, crearProducto, PASSWORD_PRUEBA, db } = require('./helpers/db');
const { login } = require('./helpers/auth');

// Cancelación de pedidos ya enviados (decisión del administrador sobre el
// reingreso al inventario) y unicidad del número de pedido con creaciones simultáneas.
describe('Pedidos: cancelación después del envío y número de pedido', () => {
  let semilla;
  let tokenAdmin;
  let tokenVendedor;

  // Se siembra una sola vez: el límite de 10 inicios de sesión por ventana no
  // permite iniciar sesión antes de cada caso. Cada caso crea sus propios datos.
  beforeAll(async () => {
    await limpiarBaseDatos();
    semilla = await sembrarBase();
    tokenAdmin = (await login(semilla.usuarioAdmin.email, PASSWORD_PRUEBA)).token;
    tokenVendedor = (await login(semilla.usuarioVendedor1.email, PASSWORD_PRUEBA)).token;
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  const estado = (id, token, body) =>
    request(app).patch(`/api/pedidos/${id}/estado`).set('Authorization', `Bearer ${token}`).send(body);

  // Crea un pedido de 4 unidades y lo lleva hasta "Enviado" (stock: 20 → 16).
  const pedidoEnviado = async (token) => {
    const cliente = await crearCliente();
    const producto = await crearProducto(semilla.categoria.id, { cantidad_disponible: 20 });
    const pedido = (
      await request(app)
        .post('/api/pedidos')
        .set('Authorization', `Bearer ${token}`)
        .send({ cliente_id: cliente.id, items: [{ producto_id: producto.id, cantidad: 4 }] })
    ).body.data;
    for (const e of ['Confirmado', 'En preparación', 'Enviado']) {
      expect((await estado(pedido.id, token, { estado: e })).status).toBe(200);
    }
    await producto.reload();
    expect(producto.cantidad_disponible).toBe(16);
    return { pedido, producto };
  };

  it('un vendedor no puede cancelar un pedido que ya fue enviado, aunque sea suyo', async () => {
    const { pedido, producto } = await pedidoEnviado(tokenVendedor);
    const res = await estado(pedido.id, tokenVendedor, { estado: 'Cancelado', reingresar_inventario: true });
    expect(res.status).toBe(403);
    await producto.reload();
    expect(producto.cantidad_disponible).toBe(16);
    expect((await db.Pedido.findByPk(pedido.id)).estado).toBe('Enviado');
  });

  it('el administrador debe indicar si el producto regresa al inventario', async () => {
    const { pedido } = await pedidoEnviado(tokenAdmin);
    const res = await estado(pedido.id, tokenAdmin, { estado: 'Cancelado' });
    expect(res.status).toBe(400);
    expect((await db.Pedido.findByPk(pedido.id)).estado).toBe('Enviado');
  });

  it('si el administrador decide reingresar el producto, el inventario se devuelve una vez', async () => {
    const { pedido, producto } = await pedidoEnviado(tokenAdmin);
    const res = await estado(pedido.id, tokenAdmin, { estado: 'Cancelado', reingresar_inventario: true });
    expect(res.status).toBe(200);
    await producto.reload();
    expect(producto.cantidad_disponible).toBe(20);
    const entradas = await db.MovimientoInventario.findAll({ where: { pedido_id: pedido.id, tipo: 'Entrada' } });
    expect(entradas).toHaveLength(1);
    expect(entradas[0].motivo).toBe('Devolución por cancelación');
  });

  it('si el administrador decide no reingresarlo, el inventario no cambia y queda la constancia', async () => {
    const { pedido, producto } = await pedidoEnviado(tokenAdmin);
    const res = await estado(pedido.id, tokenAdmin, { estado: 'Cancelado', reingresar_inventario: false });
    expect(res.status).toBe(200);
    await producto.reload();
    expect(producto.cantidad_disponible).toBe(16);
    const entradas = await db.MovimientoInventario.count({ where: { pedido_id: pedido.id, tipo: 'Entrada' } });
    expect(entradas).toBe(0);
    const guardado = await db.Pedido.findByPk(pedido.id);
    expect(guardado.estado).toBe('Cancelado');
    expect(guardado.observaciones).toMatch(/no regresó al inventario/);
  });

  it('cancelar un pedido confirmado (aún en bodega) sigue devolviendo el inventario automáticamente', async () => {
    const cliente = await crearCliente();
    const producto = await crearProducto(semilla.categoria.id, { cantidad_disponible: 10 });
    const pedido = (
      await request(app)
        .post('/api/pedidos')
        .set('Authorization', `Bearer ${tokenVendedor}`)
        .send({ cliente_id: cliente.id, items: [{ producto_id: producto.id, cantidad: 3 }] })
    ).body.data;
    expect((await estado(pedido.id, tokenVendedor, { estado: 'Confirmado' })).status).toBe(200);
    expect((await estado(pedido.id, tokenVendedor, { estado: 'Cancelado' })).status).toBe(200);
    await producto.reload();
    expect(producto.cantidad_disponible).toBe(10);
  });

  it('diez pedidos creados al mismo tiempo reciben números distintos y todos se registran', async () => {
    const cliente = await crearCliente();
    const producto = await crearProducto(semilla.categoria.id, { cantidad_disponible: 100 });
    const respuestas = await Promise.all(
      Array.from({ length: 10 }, () =>
        request(app)
          .post('/api/pedidos')
          .set('Authorization', `Bearer ${tokenAdmin}`)
          .send({ cliente_id: cliente.id, items: [{ producto_id: producto.id, cantidad: 1 }] })
      )
    );
    expect(respuestas.map((r) => r.status)).toEqual(Array(10).fill(201));
    const numeros = respuestas.map((r) => r.body.data.numero_pedido);
    expect(new Set(numeros).size).toBe(10);
    for (const r of respuestas) {
      expect(r.body.data.numero_pedido).toBe(`PED-${String(r.body.data.id).padStart(6, '0')}`);
    }
  });
});
