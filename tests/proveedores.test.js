const request = require('supertest');
const app = require('../app');
const { limpiarBaseDatos, sembrarBase, PASSWORD_PRUEBA, db } = require('./helpers/db');
const { login } = require('./helpers/auth');

describe('Proveedores', () => {
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

  it('el Vendedor no puede ni siquiera listar proveedores', async () => {
    const res = await request(app).get('/api/proveedores').set('Authorization', `Bearer ${tokenVendedor}`);
    expect(res.status).toBe(403);
  });

  it('Admin crea un proveedor válido', async () => {
    const res = await request(app)
      .post('/api/proveedores')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre_razon_social: 'Granja Central', identificacion: 'NIT-100' });

    expect(res.status).toBe(201);
    expect(res.body.data.estado).toBe('activo');
  });

  it('rechaza identificación duplicada', async () => {
    await request(app)
      .post('/api/proveedores')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre_razon_social: 'Proveedor A', identificacion: 'NIT-DUP' });

    const res = await request(app)
      .post('/api/proveedores')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre_razon_social: 'Proveedor B', identificacion: 'NIT-DUP' });

    expect(res.status).toBe(409);
  });

  it('rechaza un proveedor sin identificación', async () => {
    const res = await request(app)
      .post('/api/proveedores')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre_razon_social: 'Sin identificación' });
    expect(res.status).toBe(400);
  });

  it('edita un proveedor existente', async () => {
    const crear = await request(app)
      .post('/api/proveedores')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre_razon_social: 'Editable', identificacion: 'NIT-EDIT' });

    const res = await request(app)
      .put(`/api/proveedores/${crear.body.data.id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ telefono: '3009998877' });

    expect(res.status).toBe(200);
    expect(res.body.data.telefono).toBe('3009998877');
  });

  it('activa/desactiva un proveedor', async () => {
    const crear = await request(app)
      .post('/api/proveedores')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre_razon_social: 'Para desactivar', identificacion: 'NIT-OFF' });

    const res = await request(app)
      .patch(`/api/proveedores/${crear.body.data.id}/estado`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ estado: 'inactivo' });

    expect(res.status).toBe(200);
    expect(res.body.data.estado).toBe('inactivo');
  });

  it('busca proveedores por nombre', async () => {
    await request(app)
      .post('/api/proveedores')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre_razon_social: 'Distribuciones Únicas SAS', identificacion: 'NIT-BUSCA' });

    const res = await request(app)
      .get('/api/proveedores')
      .query({ nombre: 'Únicas' })
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});
