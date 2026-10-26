const request = require('supertest');
const app = require('../app');
const { limpiarBaseDatos, sembrarBase, PASSWORD_PRUEBA, db } = require('./helpers/db');
const { login } = require('./helpers/auth');
const passwordResetService = require('../services/passwordReset.service');

// Dashboard autorizado por permisos (también para roles personalizados) e
// invalidación de las sesiones abiertas al restablecer la contraseña.
describe('Dashboard por permisos y sesiones', () => {
  let semilla;
  let tokenAdmin;

  // Se siembra una sola vez por el límite de 10 inicios de sesión por ventana.
  beforeAll(async () => {
    await limpiarBaseDatos();
    semilla = await sembrarBase();
    tokenAdmin = (await login(semilla.usuarioAdmin.email, PASSWORD_PRUEBA)).token;
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  // Crea un rol con los permisos indicados y un usuario con ese rol; devuelve su token.
  const usuarioConRol = async (nombreRol, codigos) => {
    const permisos = await db.Permiso.findAll({ where: { codigo: codigos } });
    const rol = await db.Rol.create({ nombre: nombreRol, estado: 'activo' });
    await rol.setPermisos(permisos);
    const email = `${nombreRol.toLowerCase().replace(/\s/g, '.')}@avicolamendoza.com`;
    const crear = await request(app).post('/api/usuarios').set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: nombreRol, email, password: 'Clave12345', rol_id: rol.id });
    expect(crear.status).toBe(201);
    return (await login(email, 'Clave12345')).token;
  };

  const dashboard = (token) => request(app).get('/api/dashboard').set('Authorization', `Bearer ${token}`);

  it('un rol personalizado sin el permiso dashboard.ver no accede al dashboard', async () => {
    const token = await usuarioConRol('Auxiliar Bodega', ['inventario.ver']);
    expect((await dashboard(token)).status).toBe(403);
  });

  it('un rol personalizado con dashboard.ver ve solo sus propios indicadores', async () => {
    const token = await usuarioConRol('Asesor Comercial', ['dashboard.ver', 'pedidos.ver']);
    const res = await dashboard(token);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('pedidos_recientes');
    expect(res.body.data).not.toHaveProperty('productos_stock_bajo');
  });

  it('un rol personalizado con dashboard.ver_global ve los indicadores generales', async () => {
    const token = await usuarioConRol('Supervisor Ventas', ['dashboard.ver', 'dashboard.ver_global']);
    const res = await dashboard(token);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('productos_stock_bajo');
    expect(res.body.data).toHaveProperty('pedidos_por_estado');
  });

  it('las sesiones abiertas dejan de funcionar cuando el usuario restablece su contraseña', async () => {
    const usuario = semilla.usuarioVendedor2;
    const tokenViejo = (await login(usuario.email, PASSWORD_PRUEBA)).token;
    expect((await request(app).get('/api/auth/me').set('Authorization', `Bearer ${tokenViejo}`)).status).toBe(200);

    const tokenCrudo = 'c'.repeat(64);
    await db.PasswordResetToken.create({
      usuario_id: usuario.id,
      token_hash: passwordResetService.hashearToken(tokenCrudo),
      expira_en: new Date(Date.now() + 30 * 60 * 1000)
    });
    const reset = await request(app).post('/api/auth/reset-password').send({ token: tokenCrudo, password: 'OtraClave123!' });
    expect(reset.status).toBe(200);

    // El token emitido antes del cambio ya no sirve...
    expect((await request(app).get('/api/auth/me').set('Authorization', `Bearer ${tokenViejo}`)).status).toBe(401);
    // ...y una sesión nueva con la nueva contraseña sí funciona.
    const tokenNuevo = (await login(usuario.email, 'OtraClave123!')).token;
    expect((await request(app).get('/api/auth/me').set('Authorization', `Bearer ${tokenNuevo}`)).status).toBe(200);
  });

  it('restablecer la contraseña de un usuario no cierra la sesión de los demás', async () => {
    expect((await request(app).get('/api/auth/me').set('Authorization', `Bearer ${tokenAdmin}`)).status).toBe(200);
  });
});
