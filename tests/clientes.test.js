const request = require('supertest');
const app = require('../app');
const { limpiarBaseDatos, sembrarBase, crearCliente, PASSWORD_PRUEBA, db } = require('./helpers/db');
const { login } = require('./helpers/auth');

describe('Clientes', () => {
  let tokenAdmin;
  let tokenVendedor;

  beforeAll(async () => {
    await limpiarBaseDatos();
    const semilla = await sembrarBase();
    tokenAdmin = (await login(semilla.usuarioAdmin.email, PASSWORD_PRUEBA)).token;
    tokenVendedor = (await login(semilla.usuarioVendedor1.email, PASSWORD_PRUEBA)).token;
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  it('crea un cliente válido (rol Vendedor también puede)', async () => {
    const res = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${tokenVendedor}`)
      .send({ nombre_razon_social: 'Tienda Uno', documento: 'DOC-001', zona: 'Norte' });

    expect(res.status).toBe(201);
    expect(res.body.data.nombre_razon_social).toBe('Tienda Uno');
    expect(res.body.data.estado).toBe('activo');
  });

  it('rechaza un cliente sin nombre', async () => {
    const res = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ documento: 'DOC-002' });

    expect(res.status).toBe(400);
  });

  it('rechaza un documento duplicado', async () => {
    await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre_razon_social: 'Cliente A', documento: 'DOC-DUP' });

    const res = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre_razon_social: 'Cliente B', documento: 'DOC-DUP' });

    expect(res.status).toBe(409);
  });

  it('lista clientes y permite filtrar por zona', async () => {
    await crearCliente({ zona: 'Sur', documento: `Z-${Date.now()}` });
    const res = await request(app)
      .get('/api/clientes')
      .query({ zona: 'Sur' })
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.data.every((c) => c.zona === 'Sur')).toBe(true);
  });

  it('obtiene un cliente por id con su historial de pedidos', async () => {
    const cliente = await crearCliente();
    const res = await request(app)
      .get(`/api/clientes/${cliente.id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(cliente.id);
    expect(Array.isArray(res.body.data.pedidos)).toBe(true);
  });

  it('devuelve 404 al consultar un cliente inexistente', async () => {
    const res = await request(app).get('/api/clientes/999999').set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(404);
  });

  it('actualiza los datos de un cliente', async () => {
    const cliente = await crearCliente();
    const res = await request(app)
      .put(`/api/clientes/${cliente.id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ telefono: '3001234567' });

    expect(res.status).toBe(200);
    expect(res.body.data.telefono).toBe('3001234567');
  });

  it('solo Admin puede activar/desactivar clientes', async () => {
    const cliente = await crearCliente();

    const resVendedor = await request(app)
      .patch(`/api/clientes/${cliente.id}/estado`)
      .set('Authorization', `Bearer ${tokenVendedor}`)
      .send({ estado: 'inactivo' });
    expect(resVendedor.status).toBe(403);

    const resAdmin = await request(app)
      .patch(`/api/clientes/${cliente.id}/estado`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ estado: 'inactivo' });
    expect(resAdmin.status).toBe(200);
    expect(resAdmin.body.data.estado).toBe('inactivo');
  });
});
