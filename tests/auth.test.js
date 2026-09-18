const request = require('supertest');
const app = require('../app');
const { limpiarBaseDatos, sembrarBase, PASSWORD_PRUEBA, db } = require('./helpers/db');

describe('Autenticación', () => {
  let usuarioAdmin;
  let usuarioInactivo;

  beforeAll(async () => {
    await limpiarBaseDatos();
    const semilla = await sembrarBase();
    usuarioAdmin = semilla.usuarioAdmin;
    usuarioInactivo = semilla.usuarioInactivo;
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe('POST /api/auth/login', () => {
    it('inicia sesión con credenciales válidas y devuelve un token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: usuarioAdmin.email, password: PASSWORD_PRUEBA });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.usuario.rol).toBe('Admin');
      expect(res.body.data.usuario.email).toBe(usuarioAdmin.email);
    });

    it('rechaza contraseña incorrecta', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: usuarioAdmin.email, password: 'contraseña-incorrecta' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rechaza usuario inexistente', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'no-existe@avicolamendoza.com', password: PASSWORD_PRUEBA });

      expect(res.status).toBe(401);
    });

    it('rechaza cuando faltan campos obligatorios', async () => {
      const res = await request(app).post('/api/auth/login').send({ email: usuarioAdmin.email });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rechaza a un usuario inactivo aunque la contraseña sea correcta', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: usuarioInactivo.email, password: PASSWORD_PRUEBA });

      expect(res.status).toBe(401);
    });
  });

  describe('Protección de rutas', () => {
    it('rechaza una petición sin token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('rechaza un token inválido', async () => {
      const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer token-invalido');
      expect(res.status).toBe(403);
    });

    it('acepta un token válido y devuelve el usuario autenticado', async () => {
      const login = await request(app)
        .post('/api/auth/login')
        .send({ email: usuarioAdmin.email, password: PASSWORD_PRUEBA });
      const token = login.body.data.token;

      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      // /api/auth/me devuelve el payload del JWT (id, nombre, rol) — nunca
      // incluyó el email, ya que el token solo lleva lo mínimo necesario.
      expect(res.body.data.id).toBe(usuarioAdmin.id);
      expect(res.body.data.rol).toBe('Admin');
    });

    it('permite cerrar sesión con un token válido', async () => {
      const login = await request(app)
        .post('/api/auth/login')
        .send({ email: usuarioAdmin.email, password: PASSWORD_PRUEBA });
      const token = login.body.data.token;

      const res = await request(app).post('/api/auth/logout').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
