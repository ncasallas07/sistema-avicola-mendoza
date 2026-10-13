const request = require('supertest');
const app = require('../app');
const { limpiarBaseDatos, sembrarBase, crearCliente, crearProducto, PASSWORD_PRUEBA, db } = require('./helpers/db');
const { login } = require('./helpers/auth');

describe('Usuarios: eliminación lógica', () => {
  let semilla;
  let tokenAdmin;
  let tokenVendedor;
  let pedidoHistorico;
  let movimientoHistorico;

  beforeAll(async () => {
    await limpiarBaseDatos();
    semilla = await sembrarBase();
    tokenAdmin = (await login(semilla.usuarioAdmin.email, PASSWORD_PRUEBA)).token;
    tokenVendedor = (await login(semilla.usuarioVendedor1.email, PASSWORD_PRUEBA)).token;

    // Historial del vendedor 2 que debe conservarse tras eliminarlo.
    const cliente = await crearCliente();
    const producto = await crearProducto(semilla.categoria.id);
    pedidoHistorico = await db.Pedido.create({
      numero_pedido: 'PED-900001', cliente_id: cliente.id, usuario_id: semilla.usuarioVendedor2.id,
      estado: 'Entregado', subtotal: 20000, total: 20000
    });
    await db.DetallePedido.create({ pedido_id: pedidoHistorico.id, producto_id: producto.id, cantidad: 2, precio_unitario: 10000, subtotal_linea: 20000 });
    movimientoHistorico = await db.MovimientoInventario.create({
      producto_id: producto.id, tipo: 'Salida', cantidad: 2, motivo: 'Pedido', pedido_id: pedidoHistorico.id, usuario_id: semilla.usuarioVendedor2.id
    });
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  const eliminar = (id, token) => request(app).delete(`/api/usuarios/${id}`).set('Authorization', `Bearer ${token}`);

  it('un usuario sin el permiso usuarios.eliminar no puede eliminar usuarios', async () => {
    const res = await eliminar(semilla.usuarioVendedor2.id, tokenVendedor);
    expect(res.status).toBe(403);
    const sigue = await db.Usuario.findByPk(semilla.usuarioVendedor2.id);
    expect(sigue.estado).toBe('activo');
  });

  it('el administrador elimina lógicamente a un usuario y responde con el formato estándar', async () => {
    const res = await eliminar(semilla.usuarioVendedor2.id, tokenAdmin);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.estado).toBe('eliminado');
  });

  it('el usuario eliminado desaparece de la lista habitual, pero los inactivos siguen apareciendo', async () => {
    const res = await request(app).get('/api/usuarios').set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
    const ids = res.body.data.map((u) => u.id);
    expect(ids).not.toContain(semilla.usuarioVendedor2.id);
    expect(ids).toContain(semilla.usuarioInactivo.id);
  });

  it('el registro del usuario permanece en la base de datos', async () => {
    const usuario = await db.Usuario.findByPk(semilla.usuarioVendedor2.id);
    expect(usuario).not.toBeNull();
    expect(usuario.estado).toBe('eliminado');
    expect(usuario.email).toBe(semilla.usuarioVendedor2.email);
  });

  it('sus pedidos y movimientos de inventario se conservan y siguen mostrando su nombre', async () => {
    const pedido = await db.Pedido.findByPk(pedidoHistorico.id);
    expect(pedido.usuario_id).toBe(semilla.usuarioVendedor2.id);
    const movimiento = await db.MovimientoInventario.findByPk(movimientoHistorico.id);
    expect(movimiento.usuario_id).toBe(semilla.usuarioVendedor2.id);

    const res = await request(app).get(`/api/pedidos/${pedidoHistorico.id}`).set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
    expect(res.body.data.creadoPor.nombre).toBe('Vendedor Dos');
    expect(res.body.data.detalles).toHaveLength(1);

    const movs = await request(app).get('/api/inventario/movimientos').set('Authorization', `Bearer ${tokenAdmin}`);
    expect(movs.body.data.find((m) => m.id === movimientoHistorico.id).usuario.nombre).toBe('Vendedor Dos');
  });

  it('un usuario eliminado no puede iniciar sesión ni recuperar la contraseña', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: semilla.usuarioVendedor2.email, password: PASSWORD_PRUEBA });
    expect(res.status).toBe(401);
    await request(app).post('/api/auth/forgot-password').send({ email: semilla.usuarioVendedor2.email });
    const tokens = await db.PasswordResetToken.count({ where: { usuario_id: semilla.usuarioVendedor2.id } });
    expect(tokens).toBe(0);
  });

  it('eliminar dos veces el mismo usuario, o uno inexistente, responde 404 controlado', async () => {
    const otraVez = await eliminar(semilla.usuarioVendedor2.id, tokenAdmin);
    expect(otraVez.status).toBe(404);
    expect(otraVez.body.success).toBe(false);
    const inexistente = await eliminar(999999, tokenAdmin);
    expect(inexistente.status).toBe(404);
  });

  it('un usuario eliminado no puede editarse ni reactivarse', async () => {
    const editar = await request(app).put(`/api/usuarios/${semilla.usuarioVendedor2.id}`).set('Authorization', `Bearer ${tokenAdmin}`).send({ nombre: 'Otro' });
    expect(editar.status).toBe(404);
    const reactivar = await request(app).patch(`/api/usuarios/${semilla.usuarioVendedor2.id}/estado`).set('Authorization', `Bearer ${tokenAdmin}`).send({ estado: 'activo' });
    expect(reactivar.status).toBe(404);
    expect((await db.Usuario.findByPk(semilla.usuarioVendedor2.id)).estado).toBe('eliminado');
  });

  it('la sesión abierta de un usuario deja de funcionar en cuanto es eliminado', async () => {
    const crear = await request(app).post('/api/usuarios').set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Con sesión abierta', email: 'sesion.abierta@avicolamendoza.com', password: 'Sesion12345', rol_id: semilla.rolVendedor.id });
    expect(crear.status).toBe(201);
    const token = (await login('sesion.abierta@avicolamendoza.com', 'Sesion12345')).token;
    expect((await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`)).status).toBe(200);

    expect((await eliminar(crear.body.data.id, tokenAdmin)).status).toBe(200);
    const despues = await request(app).get('/api/pedidos').set('Authorization', `Bearer ${token}`);
    expect(despues.status).toBe(401);
  });

  it('nadie puede eliminar su propia cuenta', async () => {
    const res = await eliminar(semilla.usuarioAdmin.id, tokenAdmin);
    expect(res.status).toBe(409);
    expect((await db.Usuario.findByPk(semilla.usuarioAdmin.id)).estado).toBe('activo');
  });

  it('no se permite eliminar al último administrador activo', async () => {
    // Rol con permiso para eliminar usuarios, pero sin capacidades de administración.
    const permisos = await db.Permiso.findAll({ where: { codigo: ['usuarios.ver', 'usuarios.eliminar'] } });
    const rolSupervisor = await db.Rol.create({ nombre: 'Supervisor', estado: 'activo' });
    await rolSupervisor.setPermisos(permisos);
    const crear = await request(app).post('/api/usuarios').set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Supervisor', email: 'supervisor@avicolamendoza.com', password: 'Supervisor123', rol_id: rolSupervisor.id });
    expect(crear.status).toBe(201);
    const tokenSupervisor = (await login('supervisor@avicolamendoza.com', 'Supervisor123')).token;

    const res = await eliminar(semilla.usuarioAdmin.id, tokenSupervisor);
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/único administrador/);
    expect((await db.Usuario.findByPk(semilla.usuarioAdmin.id)).estado).toBe('activo');
  });

  it('crear, editar y desactivar usuarios sigue funcionando', async () => {
    const crear = await request(app).post('/api/usuarios').set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Usuario Normal', email: 'usuario.normal@avicolamendoza.com', password: 'Normal12345', rol_id: semilla.rolVendedor.id });
    expect(crear.status).toBe(201);
    const id = crear.body.data.id;
    const editar = await request(app).put(`/api/usuarios/${id}`).set('Authorization', `Bearer ${tokenAdmin}`).send({ nombre: 'Usuario Editado' });
    expect(editar.status).toBe(200);
    expect(editar.body.data.nombre).toBe('Usuario Editado');
    const desactivar = await request(app).patch(`/api/usuarios/${id}/estado`).set('Authorization', `Bearer ${tokenAdmin}`).send({ estado: 'inactivo' });
    expect(desactivar.status).toBe(200);
    expect(desactivar.body.data.estado).toBe('inactivo');
  });
});
