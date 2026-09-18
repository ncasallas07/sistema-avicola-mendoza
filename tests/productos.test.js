const request = require('supertest');
const app = require('../app');
const { limpiarBaseDatos, sembrarBase, crearProducto, PASSWORD_PRUEBA, db } = require('./helpers/db');
const { login } = require('./helpers/auth');

describe('Productos', () => {
  let tokenAdmin;
  let tokenVendedor;
  let categoriaId;

  beforeAll(async () => {
    await limpiarBaseDatos();
    const semilla = await sembrarBase();
    categoriaId = semilla.categoria.id;
    tokenAdmin = (await login(semilla.usuarioAdmin.email, PASSWORD_PRUEBA)).token;
    tokenVendedor = (await login(semilla.usuarioVendedor1.email, PASSWORD_PRUEBA)).token;
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  it('Admin crea un producto válido', async () => {
    const res = await request(app)
      .post('/api/productos')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        nombre: 'Pollo entero',
        categoria_id: categoriaId,
        unidad_medida: 'kg',
        precio: 9500,
        cantidad_disponible: 30,
        stock_minimo: 5
      });

    expect(res.status).toBe(201);
    expect(res.body.data.cantidad_disponible).toBe(30);
  });

  it('Vendedor NO puede crear productos', async () => {
    const res = await request(app)
      .post('/api/productos')
      .set('Authorization', `Bearer ${tokenVendedor}`)
      .send({ nombre: 'X', categoria_id: categoriaId, unidad_medida: 'kg', precio: 1000 });
    expect(res.status).toBe(403);
  });

  it('rechaza un producto con categoría inexistente', async () => {
    const res = await request(app)
      .post('/api/productos')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Sin categoría', categoria_id: 999999, unidad_medida: 'kg', precio: 1000 });
    expect(res.status).toBe(400);
  });

  it('rechaza un precio negativo o cero', async () => {
    const res = await request(app)
      .post('/api/productos')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Precio inválido', categoria_id: categoriaId, unidad_medida: 'kg', precio: -5 });
    expect(res.status).toBe(400);
  });

  it('rechaza un nombre vacío', async () => {
    const res = await request(app)
      .post('/api/productos')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ categoria_id: categoriaId, unidad_medida: 'kg', precio: 1000 });
    expect(res.status).toBe(400);
  });

  it('edita un producto, pero editar NO permite modificar cantidad_disponible directamente', async () => {
    const producto = await crearProducto(categoriaId, { cantidad_disponible: 40 });

    const res = await request(app)
      .put(`/api/productos/${producto.id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ precio: 15000, cantidad_disponible: 999 });

    expect(res.status).toBe(200);
    expect(Number(res.body.data.precio)).toBe(15000);
    // El stock solo se ajusta desde /api/inventario, no desde la edición del producto.
    expect(res.body.data.cantidad_disponible).toBe(40);
  });

  it('activa/desactiva un producto (solo Admin)', async () => {
    const producto = await crearProducto(categoriaId);
    const res = await request(app)
      .patch(`/api/productos/${producto.id}/estado`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ estado: 'inactivo' });

    expect(res.status).toBe(200);
    expect(res.body.data.estado).toBe('inactivo');
  });

  it('filtra productos con stock bajo', async () => {
    await crearProducto(categoriaId, { nombre: 'Stock bajo test', cantidad_disponible: 2, stock_minimo: 10 });
    const res = await request(app)
      .get('/api/productos')
      .query({ stock_bajo: 'true' })
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.data.every((p) => p.cantidad_disponible <= p.stock_minimo)).toBe(true);
  });
});
