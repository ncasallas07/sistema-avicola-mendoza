const request = require('supertest');
const app = require('../app');
const { limpiarBaseDatos, sembrarBase, crearCliente, crearProducto, PASSWORD_PRUEBA, db } = require('./helpers/db');
const { login } = require('./helpers/auth');

describe('Dashboard y Reportes', () => {
  let tokenAdmin;
  let tokenVendedor;
  let categoriaId;
  let cliente;
  let producto;

  beforeAll(async () => {
    await limpiarBaseDatos();
    const semilla = await sembrarBase();
    categoriaId = semilla.categoria.id;
    tokenAdmin = (await login(semilla.usuarioAdmin.email, PASSWORD_PRUEBA)).token;
    tokenVendedor = (await login(semilla.usuarioVendedor1.email, PASSWORD_PRUEBA)).token;

    cliente = await crearCliente();
    producto = await crearProducto(categoriaId, { cantidad_disponible: 30 });

    // Un pedido que se queda Pendiente (no debe contar como venta)
    await request(app)
      .post('/api/pedidos')
      .set('Authorization', `Bearer ${tokenVendedor}`)
      .send({ cliente_id: cliente.id, items: [{ producto_id: producto.id, cantidad: 25 }] });

    // Un pedido que sí se confirma (debe contar como venta)
    const confirmado = await request(app)
      .post('/api/pedidos')
      .set('Authorization', `Bearer ${tokenVendedor}`)
      .send({ cliente_id: cliente.id, items: [{ producto_id: producto.id, cantidad: 4 }] });
    await request(app)
      .patch(`/api/pedidos/${confirmado.body.data.id}/estado`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ estado: 'Confirmado' });
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  it('el dashboard de Admin devuelve el desglose de pedidos por los 4 grupos de estado', async () => {
    const res = await request(app).get('/api/dashboard').set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
    expect(res.body.data.pedidos_por_estado).toEqual(
      expect.objectContaining({
        pendiente: expect.any(Number),
        en_proceso: expect.any(Number),
        entregado: expect.any(Number),
        cancelado: expect.any(Number)
      })
    );
  });

  it('el dashboard de Vendedor solo refleja sus propios pedidos', async () => {
    const res = await request(app).get('/api/dashboard').set('Authorization', `Bearer ${tokenVendedor}`);
    expect(res.status).toBe(200);
    expect(res.body.data.total_pedidos).toBe(2);
  });

  it('"productos más vendidos" NO cuenta un pedido que sigue Pendiente', async () => {
    const res = await request(app).get('/api/dashboard').set('Authorization', `Bearer ${tokenAdmin}`);
    const entrada = res.body.data.productos_mas_vendidos.find((p) => p.producto === producto.nombre);
    // Solo el pedido confirmado (4 unidades) debe contarse, no el pendiente (25 unidades).
    expect(entrada?.cantidad_vendida ?? 0).toBe(4);
  });

  it('los reportes son exclusivos de Admin', async () => {
    const res = await request(app).get('/api/reportes/ventas').set('Authorization', `Bearer ${tokenVendedor}`);
    expect(res.status).toBe(403);
  });

  it('el reporte de ventas por período solo incluye pedidos confirmados o posteriores', async () => {
    const res = await request(app).get('/api/reportes/ventas').set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
    const estados = res.body.data.map((p) => p.estado);
    expect(estados).not.toContain('Pendiente');
  });

  it('el reporte de pedidos por período acepta un filtro de estado', async () => {
    const res = await request(app)
      .get('/api/reportes/pedidos')
      .query({ estado: 'Pendiente' })
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
    expect(res.body.data.every((p) => p.estado === 'Pendiente')).toBe(true);
  });

  it('el reporte de clientes por zona responde correctamente', async () => {
    const res = await request(app).get('/api/reportes/clientes-por-zona').set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('el reporte de stock bajo solo incluye productos por debajo de su mínimo', async () => {
    await crearProducto(categoriaId, { nombre: 'Bajo stock', cantidad_disponible: 1, stock_minimo: 10 });
    const res = await request(app).get('/api/reportes/stock-bajo').set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
    expect(res.body.data.every((p) => p.cantidad_disponible <= p.stock_minimo)).toBe(true);
  });
});
