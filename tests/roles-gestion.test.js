const request = require('supertest');
const app = require('../app');
const { limpiarBaseDatos, sembrarBase, PASSWORD_PRUEBA, db } = require('./helpers/db');
const { login } = require('./helpers/auth');

// Gestión de roles desde la API: edición, estado, eliminación, asignación de
// permisos y efecto inmediato sobre los usuarios del rol. Incluye las categorías.
describe('Roles: gestión y efecto de los cambios', () => {
  let semilla;
  let tokenAdmin;

  beforeAll(async () => {
    await limpiarBaseDatos();
    semilla = await sembrarBase();
    tokenAdmin = (await login(semilla.usuarioAdmin.email, PASSWORD_PRUEBA)).token;
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  const api = (metodo, ruta, token = tokenAdmin) => request(app)[metodo](`/api${ruta}`).set('Authorization', `Bearer ${token}`);
  const idsDe = async (codigos) => (await db.Permiso.findAll({ where: { codigo: codigos } })).map((p) => p.id);

  it('lista los roles con el total de permisos y de usuarios', async () => {
    const res = await api('get', '/roles');
    expect(res.status).toBe(200);
    const vendedor = res.body.data.find((r) => r.id === semilla.rolVendedor.id);
    expect(vendedor.total_permisos).toBeGreaterThan(0);
    expect(vendedor.total_usuarios).toBeGreaterThan(0);
  });

  it('obtiene un rol con sus permisos y responde 404 si no existe', async () => {
    const res = await api('get', `/roles/${semilla.rolVendedor.id}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.permisos)).toBe(true);
    expect((await api('get', '/roles/999999')).status).toBe(404);
    expect((await api('get', `/roles/${semilla.rolVendedor.id}/permisos`)).status).toBe(200);
  });

  it('edita el nombre y la descripción, y rechaza un nombre repetido', async () => {
    const rol = (await api('post', '/roles').send({ nombre: 'Supervisor', descripcion: 'Inicial' })).body.data;
    const editado = await api('put', `/roles/${rol.id}`).send({ nombre: 'Supervisor de zona', descripcion: 'Actualizada' });
    expect(editado.status).toBe(200);
    expect(editado.body.data.nombre).toBe('Supervisor de zona');
    expect(editado.body.data.descripcion).toBe('Actualizada');
    expect((await api('put', `/roles/${rol.id}`).send({ nombre: semilla.rolVendedor.nombre })).status).toBe(409);
  });

  it('rechaza permisos inexistentes al asignarlos', async () => {
    const rol = (await api('post', '/roles').send({ nombre: 'Prueba permisos' })).body.data;
    const res = await api('put', `/roles/${rol.id}/permisos`).send({ permisos: [999999] });
    expect(res.status).toBe(400);
  });

  it('retirar un permiso o desactivar el rol bloquea de inmediato a sus usuarios', async () => {
    const rol = (await api('post', '/roles').send({ nombre: 'Bodega' })).body.data;
    expect((await api('put', `/roles/${rol.id}/permisos`).send({ permisos: await idsDe(['inventario.ver', 'productos.ver']) })).status).toBe(200);
    await api('post', '/usuarios').send({ nombre: 'Auxiliar', email: 'auxiliar@avicolamendoza.com', password: 'Clave12345', rol_id: rol.id });
    const token = (await login('auxiliar@avicolamendoza.com', 'Clave12345')).token;
    expect((await api('get', '/inventario', token)).status).toBe(200);

    // Retirar el permiso tiene efecto sin volver a iniciar sesión.
    await api('put', `/roles/${rol.id}/permisos`).send({ permisos: await idsDe(['productos.ver']) });
    expect((await api('get', '/inventario', token)).status).toBe(403);
    expect((await api('get', '/productos', token)).status).toBe(200);

    // Un rol inactivo no concede ningún permiso.
    expect((await api('patch', `/roles/${rol.id}/estado`).send({ estado: 'inactivo' })).status).toBe(200);
    expect((await api('get', '/productos', token)).status).toBe(403);
    expect((await api('patch', `/roles/${rol.id}/estado`).send({ estado: 'activo' })).status).toBe(200);
    expect((await api('get', '/productos', token)).status).toBe(200);
  });

  it('elimina un rol sin usuarios y responde 404 si se intenta de nuevo', async () => {
    const rol = (await api('post', '/roles').send({ nombre: 'Temporal' })).body.data;
    expect((await api('delete', `/roles/${rol.id}`)).status).toBe(200);
    expect(await db.Rol.findByPk(rol.id)).toBeNull();
    expect((await api('delete', `/roles/${rol.id}`)).status).toBe(404);
  });

  it('las categorías se listan y el administrador puede crearlas sin repetir el nombre', async () => {
    const lista = await api('get', '/categorias');
    expect(lista.status).toBe(200);
    const nueva = await api('post', '/categorias').send({ nombre: 'Marinados' });
    expect(nueva.status).toBe(201);
    expect((await api('post', '/categorias').send({ nombre: 'Marinados' })).status).toBe(409);
  });
});
