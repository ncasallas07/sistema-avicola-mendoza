const request = require('supertest');
const app = require('../app');
const { limpiarBaseDatos, sembrarBase, crearProducto, PASSWORD_PRUEBA, db } = require('./helpers/db');
const { login } = require('./helpers/auth');

// Movimientos manuales de inventario (entradas y salidas), indicador de
// existencias y consulta del historial de movimientos.
describe('Inventario: movimientos manuales y existencias', () => {
  let semilla;
  let tokenAdmin;
  let tokenVendedor;

  beforeAll(async () => {
    await limpiarBaseDatos();
    semilla = await sembrarBase();
    tokenAdmin = (await login(semilla.usuarioAdmin.email, PASSWORD_PRUEBA)).token;
    tokenVendedor = (await login(semilla.usuarioVendedor1.email, PASSWORD_PRUEBA)).token;
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  const mover = (tipo, token, body) =>
    request(app).post(`/api/inventario/${tipo}`).set('Authorization', `Bearer ${token}`).send(body);
  const get = (ruta, token) => request(app).get(ruta).set('Authorization', `Bearer ${token}`);

  it('una entrada por compra suma las unidades y queda registrada con el usuario', async () => {
    const producto = await crearProducto(semilla.categoria.id, { cantidad_disponible: 10 });
    const res = await mover('entrada', tokenAdmin, { producto_id: producto.id, cantidad: 15, motivo: 'Compra' });
    expect(res.status).toBe(201);
    await producto.reload();
    expect(producto.cantidad_disponible).toBe(25);
    const mov = await db.MovimientoInventario.findByPk(res.body.data.id);
    expect(mov.tipo).toBe('Entrada');
    expect(mov.motivo).toBe('Compra');
    expect(mov.usuario_id).toBe(semilla.usuarioAdmin.id);
  });

  it('una salida por ajuste resta las unidades', async () => {
    const producto = await crearProducto(semilla.categoria.id, { cantidad_disponible: 10 });
    const res = await mover('salida', tokenAdmin, { producto_id: producto.id, cantidad: 4, motivo: 'Ajuste' });
    expect(res.status).toBe(201);
    await producto.reload();
    expect(producto.cantidad_disponible).toBe(6);
  });

  it('no permite retirar más unidades de las disponibles', async () => {
    const producto = await crearProducto(semilla.categoria.id, { cantidad_disponible: 3 });
    const res = await mover('salida', tokenAdmin, { producto_id: producto.id, cantidad: 4, motivo: 'Ajuste' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Inventario insuficiente/);
    await producto.reload();
    expect(producto.cantidad_disponible).toBe(3);
  });

  it('no permite mover un producto inactivo o inexistente', async () => {
    const inactivo = await crearProducto(semilla.categoria.id, { estado: 'inactivo' });
    expect((await mover('entrada', tokenAdmin, { producto_id: inactivo.id, cantidad: 1, motivo: 'Compra' })).status).toBe(400);
    expect((await mover('salida', tokenAdmin, { producto_id: 999999, cantidad: 1, motivo: 'Ajuste' })).status).toBe(400);
  });

  it('rechaza motivos reservados para los pedidos y cantidades no válidas', async () => {
    const producto = await crearProducto(semilla.categoria.id);
    for (const body of [
      { producto_id: producto.id, cantidad: 1, motivo: 'Pedido' },
      { producto_id: producto.id, cantidad: 1, motivo: 'Devolución por cancelación' },
      { producto_id: producto.id, cantidad: 0, motivo: 'Compra' },
      { producto_id: producto.id, cantidad: -2, motivo: 'Compra' }
    ]) {
      expect((await mover('entrada', tokenAdmin, body)).status).toBe(400);
    }
  });

  it('un vendedor sin el permiso de movimientos no puede registrar entradas ni salidas', async () => {
    const producto = await crearProducto(semilla.categoria.id, { cantidad_disponible: 10 });
    expect((await mover('entrada', tokenVendedor, { producto_id: producto.id, cantidad: 1, motivo: 'Compra' })).status).toBe(403);
    expect((await mover('salida', tokenVendedor, { producto_id: producto.id, cantidad: 1, motivo: 'Ajuste' })).status).toBe(403);
    await producto.reload();
    expect(producto.cantidad_disponible).toBe(10);
  });

  it('las existencias indican si cada producto está normal, bajo o agotado y se pueden filtrar', async () => {
    const normal = await crearProducto(semilla.categoria.id, { nombre: 'Normal', cantidad_disponible: 20, stock_minimo: 5 });
    const bajo = await crearProducto(semilla.categoria.id, { nombre: 'Bajo', cantidad_disponible: 5, stock_minimo: 5 });
    const agotado = await crearProducto(semilla.categoria.id, { nombre: 'Agotado', cantidad_disponible: 0, stock_minimo: 5 });
    const res = await get('/api/inventario', tokenVendedor);
    expect(res.status).toBe(200);
    const indicador = (p) => res.body.data.find((x) => x.id === p.id).indicador;
    expect(indicador(normal)).toBe('normal');
    expect(indicador(bajo)).toBe('bajo');
    expect(indicador(agotado)).toBe('agotado');
    const soloBajos = await get('/api/inventario?indicador=bajo', tokenVendedor);
    expect(soloBajos.body.data.every((p) => p.indicador === 'bajo')).toBe(true);
  });

  it('el historial de movimientos muestra producto y usuario, y se filtra por producto y fechas', async () => {
    const producto = await crearProducto(semilla.categoria.id, { nombre: 'Con historial' });
    await mover('entrada', tokenAdmin, { producto_id: producto.id, cantidad: 2, motivo: 'Compra' });
    const res = await get(`/api/inventario/movimientos?producto_id=${producto.id}`, tokenAdmin);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].producto.nombre).toBe('Con historial');
    expect(res.body.data[0].usuario.nombre).toBe(semilla.usuarioAdmin.nombre);
    const futuro = await get(`/api/inventario/movimientos?producto_id=${producto.id}&desde=2999-01-01`, tokenAdmin);
    expect(futuro.body.data).toHaveLength(0);
    const pasado = await get(`/api/inventario/movimientos?producto_id=${producto.id}&hasta=2000-01-01`, tokenAdmin);
    expect(pasado.body.data).toHaveLength(0);
  });
});
