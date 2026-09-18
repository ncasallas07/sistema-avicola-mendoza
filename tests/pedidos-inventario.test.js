const request = require('supertest');
const app = require('../app');
const { limpiarBaseDatos, sembrarBase, crearCliente, crearProducto, PASSWORD_PRUEBA, db } = require('./helpers/db');
const { login } = require('./helpers/auth');

// Suite crítica: el descuento de inventario debe ocurrir únicamente al
// confirmar un pedido, nunca al crearlo, y nunca dos veces sobre el mismo pedido.
describe('Pedidos + Inventario (reglas críticas)', () => {
  let tokenAdmin;
  let categoriaId;

  // Cada caso necesita niveles de stock exactos y predecibles, así que se
  // limpia y re-siembra la base antes de cada prueba (no solo una vez por archivo).
  beforeEach(async () => {
    await limpiarBaseDatos();
    const semilla = await sembrarBase();
    categoriaId = semilla.categoria.id;
    tokenAdmin = (await login(semilla.usuarioAdmin.email, PASSWORD_PRUEBA)).token;
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  const crearPedidoSimple = async (productoId, cantidad, clienteId) => {
    return request(app)
      .post('/api/pedidos')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ cliente_id: clienteId, items: [{ producto_id: productoId, cantidad }] });
  };

  it('Caso 1 — crear pedido deja estado Pendiente y NO descuenta inventario', async () => {
    const cliente = await crearCliente();
    const producto = await crearProducto(categoriaId, { cantidad_disponible: 20 });

    const res = await crearPedidoSimple(producto.id, 5, cliente.id);

    expect(res.status).toBe(201);
    expect(res.body.data.estado).toBe('Pendiente');

    await producto.reload();
    expect(producto.cantidad_disponible).toBe(20);

    const movimientos = await db.MovimientoInventario.findAll({ where: { producto_id: producto.id } });
    expect(movimientos.length).toBe(0);
  });

  it('Caso 2 — confirmar un pedido con stock suficiente descuenta y registra el movimiento', async () => {
    const cliente = await crearCliente();
    const producto = await crearProducto(categoriaId, { cantidad_disponible: 20 });
    const pedido = (await crearPedidoSimple(producto.id, 8, cliente.id)).body.data;

    const res = await request(app)
      .patch(`/api/pedidos/${pedido.id}/estado`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ estado: 'Confirmado' });

    expect(res.status).toBe(200);
    expect(res.body.data.estado).toBe('Confirmado');

    await producto.reload();
    expect(producto.cantidad_disponible).toBe(12); // 20 - 8

    const movimientos = await db.MovimientoInventario.findAll({ where: { producto_id: producto.id } });
    expect(movimientos.length).toBe(1);
    expect(movimientos[0].tipo).toBe('Salida');
    expect(movimientos[0].motivo).toBe('Pedido');
    expect(movimientos[0].cantidad).toBe(8);
    expect(movimientos[0].pedido_id).toBe(pedido.id);
  });

  it('Caso 3 — confirmar sin stock suficiente se rechaza sin tocar el inventario', async () => {
    const cliente = await crearCliente();
    const producto = await crearProducto(categoriaId, { cantidad_disponible: 5 });
    const pedido = (await crearPedidoSimple(producto.id, 50, cliente.id)).body.data;

    const res = await request(app)
      .patch(`/api/pedidos/${pedido.id}/estado`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ estado: 'Confirmado' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/no hay inventario suficiente/i);

    await producto.reload();
    expect(producto.cantidad_disponible).toBe(5);

    const pedidoActualizado = await db.Pedido.findByPk(pedido.id);
    expect(pedidoActualizado.estado).toBe('Pendiente');

    const movimientos = await db.MovimientoInventario.count({ where: { producto_id: producto.id } });
    expect(movimientos).toBe(0);
  });

  it('Caso 4 — confirmar dos veces el mismo pedido no descuenta dos veces', async () => {
    const cliente = await crearCliente();
    const producto = await crearProducto(categoriaId, { cantidad_disponible: 20 });
    const pedido = (await crearPedidoSimple(producto.id, 6, cliente.id)).body.data;

    const primeraConfirmacion = await request(app)
      .patch(`/api/pedidos/${pedido.id}/estado`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ estado: 'Confirmado' });
    expect(primeraConfirmacion.status).toBe(200);

    const segundaConfirmacion = await request(app)
      .patch(`/api/pedidos/${pedido.id}/estado`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ estado: 'Confirmado' });
    expect(segundaConfirmacion.status).toBe(400);

    await producto.reload();
    expect(producto.cantidad_disponible).toBe(14); // 20 - 6, una sola vez

    const movimientos = await db.MovimientoInventario.count({ where: { producto_id: producto.id } });
    expect(movimientos).toBe(1);
  });

  it('Caso 5 — cancelar un pedido ya confirmado devuelve el inventario exactamente una vez', async () => {
    const cliente = await crearCliente();
    const producto = await crearProducto(categoriaId, { cantidad_disponible: 20 });
    const pedido = (await crearPedidoSimple(producto.id, 6, cliente.id)).body.data;

    await request(app)
      .patch(`/api/pedidos/${pedido.id}/estado`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ estado: 'Confirmado' });

    const cancelar = await request(app)
      .patch(`/api/pedidos/${pedido.id}/estado`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ estado: 'Cancelado' });
    expect(cancelar.status).toBe(200);

    await producto.reload();
    expect(producto.cantidad_disponible).toBe(20); // vuelve al valor original

    const devoluciones = await db.MovimientoInventario.findAll({
      where: { producto_id: producto.id, motivo: 'Devolución por cancelación' }
    });
    expect(devoluciones.length).toBe(1);
    expect(devoluciones[0].tipo).toBe('Entrada');
    expect(devoluciones[0].cantidad).toBe(6);

    // Intentar cancelar de nuevo debe rechazarse y no devolver una segunda vez
    const cancelarOtraVez = await request(app)
      .patch(`/api/pedidos/${pedido.id}/estado`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ estado: 'Cancelado' });
    expect(cancelarOtraVez.status).toBe(400);

    await producto.reload();
    expect(producto.cantidad_disponible).toBe(20);
    const devolucionesFinal = await db.MovimientoInventario.count({
      where: { producto_id: producto.id, motivo: 'Devolución por cancelación' }
    });
    expect(devolucionesFinal).toBe(1);
  });

  it('Caso 6 — cancelar un pedido que nunca se confirmó NO genera ninguna devolución', async () => {
    const cliente = await crearCliente();
    const producto = await crearProducto(categoriaId, { cantidad_disponible: 20 });
    const pedido = (await crearPedidoSimple(producto.id, 6, cliente.id)).body.data;

    const res = await request(app)
      .patch(`/api/pedidos/${pedido.id}/estado`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ estado: 'Cancelado' });

    expect(res.status).toBe(200);
    expect(res.body.data.estado).toBe('Cancelado');

    await producto.reload();
    expect(producto.cantidad_disponible).toBe(20); // nunca se tocó

    const movimientos = await db.MovimientoInventario.count({ where: { producto_id: producto.id } });
    expect(movimientos).toBe(0);
  });

  it('Caso 7 — pedido con múltiples productos calcula subtotales/total y descuenta cada línea al confirmar', async () => {
    const cliente = await crearCliente();
    const productoA = await crearProducto(categoriaId, { nombre: 'Producto A', precio: 1000, cantidad_disponible: 20 });
    const productoB = await crearProducto(categoriaId, { nombre: 'Producto B', precio: 2500, cantidad_disponible: 20 });

    const crear = await request(app)
      .post('/api/pedidos')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        cliente_id: cliente.id,
        items: [
          { producto_id: productoA.id, cantidad: 3 },
          { producto_id: productoB.id, cantidad: 2 }
        ]
      });

    expect(crear.status).toBe(201);
    const pedido = crear.body.data;
    expect(Number(pedido.subtotal)).toBe(3 * 1000 + 2 * 2500); // 8000
    expect(Number(pedido.total)).toBe(8000);
    expect(pedido.detalles.length).toBe(2);

    const detalleA = pedido.detalles.find((d) => d.producto_id === productoA.id);
    const detalleB = pedido.detalles.find((d) => d.producto_id === productoB.id);
    expect(Number(detalleA.subtotal_linea)).toBe(3000);
    expect(Number(detalleB.subtotal_linea)).toBe(5000);

    await request(app)
      .patch(`/api/pedidos/${pedido.id}/estado`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ estado: 'Confirmado' });

    await productoA.reload();
    await productoB.reload();
    expect(productoA.cantidad_disponible).toBe(17); // 20 - 3
    expect(productoB.cantidad_disponible).toBe(18); // 20 - 2

    const movimientos = await db.MovimientoInventario.findAll({ where: { pedido_id: pedido.id } });
    expect(movimientos.length).toBe(2);
  });

  it('trazabilidad: el movimiento de inventario registra quién y cuándo lo generó', async () => {
    const cliente = await crearCliente();
    const producto = await crearProducto(categoriaId, { cantidad_disponible: 20 });
    const pedido = (await crearPedidoSimple(producto.id, 4, cliente.id)).body.data;

    await request(app)
      .patch(`/api/pedidos/${pedido.id}/estado`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ estado: 'Confirmado' });

    const movimiento = await db.MovimientoInventario.findOne({ where: { pedido_id: pedido.id } });
    expect(movimiento.usuario_id).toBeDefined();
    expect(movimiento.fecha).toBeDefined();
    expect(movimiento.producto_id).toBe(producto.id);
  });

  it('no se puede confirmar un pedido con un salto de estado inválido', async () => {
    const cliente = await crearCliente();
    const producto = await crearProducto(categoriaId, { cantidad_disponible: 20 });
    const pedido = (await crearPedidoSimple(producto.id, 2, cliente.id)).body.data;

    const res = await request(app)
      .patch(`/api/pedidos/${pedido.id}/estado`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ estado: 'Entregado' }); // salta Confirmado/En preparación/Enviado

    expect(res.status).toBe(400);
  });
});
