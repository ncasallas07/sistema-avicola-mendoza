const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../app');
const { limpiarBaseDatos, sembrarBase, PASSWORD_PRUEBA, db } = require('./helpers/db');
const passwordResetService = require('../services/passwordReset.service');

// Sin SMTP_HOST configurado (no existe en el .env de pruebas), el servicio de
// correo registra el enlace de recuperación en consola en vez de enviarlo
// (ver services/email.service.js) — así se puede probar el flujo completo
// capturando ese log, sin depender de un servidor SMTP real.
const capturarEnlace = () => {
  let tokenCapturado = null;
  const spy = jest.spyOn(console, 'log').mockImplementation((msg) => {
    if (typeof msg === 'string' && msg.includes('Enlace de recuperación')) {
      const coincidencia = msg.match(/token=([a-f0-9]+)/);
      if (coincidencia) tokenCapturado = coincidencia[1];
    }
  });
  return { spy, obtenerToken: () => tokenCapturado };
};

describe('Recuperación de contraseña', () => {
  let usuarioVendedor1;
  let usuarioInactivo;

  beforeEach(async () => {
    await limpiarBaseDatos();
    const semilla = await sembrarBase();
    usuarioVendedor1 = semilla.usuarioVendedor1;
    usuarioInactivo = semilla.usuarioInactivo;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe('POST /api/auth/forgot-password', () => {
    it('con un correo válido, genera un token de recuperación', async () => {
      const { spy, obtenerToken } = capturarEnlace();

      const res = await request(app).post('/api/auth/forgot-password').send({ email: usuarioVendedor1.email });

      expect(res.status).toBe(200);
      expect(obtenerToken()).toEqual(expect.stringMatching(/^[a-f0-9]{64}$/));

      const token = await db.PasswordResetToken.findOne({ where: { usuario_id: usuarioVendedor1.id } });
      expect(token).not.toBeNull();
      expect(token.usado_en).toBeNull();
      expect(token.expira_en.getTime()).toBeGreaterThan(Date.now());
      spy.mockRestore();
    });

    it('con un correo que no existe, responde igual que con uno válido (sin revelar nada)', async () => {
      const { spy: spyExistente, obtenerToken: tokenExistente } = capturarEnlace();
      const resExistente = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: usuarioVendedor1.email });
      spyExistente.mockRestore();

      const { spy: spyInexistente, obtenerToken: tokenInexistente } = capturarEnlace();
      const resInexistente = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'correoquenoexiste@avicolamendoza.com' });
      spyInexistente.mockRestore();

      expect(resInexistente.status).toBe(resExistente.status);
      expect(resInexistente.body).toEqual(resExistente.body);
      expect(resInexistente.body.message).toMatch(/si el correo está registrado/i);
      // El correo inexistente nunca generó un enlace/token real.
      expect(tokenInexistente()).toBeNull();
      expect(tokenExistente()).not.toBeNull();
    });

    it('un usuario desactivado se trata igual que uno inexistente: no genera token', async () => {
      const { spy, obtenerToken } = capturarEnlace();
      const res = await request(app).post('/api/auth/forgot-password').send({ email: usuarioInactivo.email });
      spy.mockRestore();

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/si el correo está registrado/i);
      expect(obtenerToken()).toBeNull();

      const token = await db.PasswordResetToken.findOne({ where: { usuario_id: usuarioInactivo.id } });
      expect(token).toBeNull();
    });

    it('rechaza un correo con formato inválido antes de llegar al servicio', async () => {
      const res = await request(app).post('/api/auth/forgot-password').send({ email: 'no-es-un-correo' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('con un token inválido (que nunca existió), rechaza el restablecimiento', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'a'.repeat(64), password: 'NuevaClave123!' });
      expect(res.status).toBe(400);
    });

    it('con un token expirado, rechaza el restablecimiento', async () => {
      const tokenCrudo = 'b'.repeat(64);
      await db.PasswordResetToken.create({
        usuario_id: usuarioVendedor1.id,
        token_hash: passwordResetService.hashearToken(tokenCrudo),
        expira_en: new Date(Date.now() - 1000)
      });

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: tokenCrudo, password: 'NuevaClave123!' });
      expect(res.status).toBe(400);
    });

    it('con un token ya utilizado, rechaza el restablecimiento', async () => {
      const tokenCrudo = 'c'.repeat(64);
      await db.PasswordResetToken.create({
        usuario_id: usuarioVendedor1.id,
        token_hash: passwordResetService.hashearToken(tokenCrudo),
        expira_en: new Date(Date.now() + 60 * 60 * 1000),
        usado_en: new Date()
      });

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: tokenCrudo, password: 'NuevaClave123!' });
      expect(res.status).toBe(400);
    });

    it('rechaza una contraseña nueva que no cumple el mínimo de 8 caracteres', async () => {
      const tokenCrudo = 'd'.repeat(64);
      await db.PasswordResetToken.create({
        usuario_id: usuarioVendedor1.id,
        token_hash: passwordResetService.hashearToken(tokenCrudo),
        expira_en: new Date(Date.now() + 60 * 60 * 1000)
      });

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: tokenCrudo, password: 'corta' });
      expect(res.status).toBe(400);
    });

    it('con un token válido, restablece la contraseña, la guarda con hash y el token no puede reutilizarse', async () => {
      // Se genera el token llamando directamente al servicio (no vía HTTP):
      // esta prueba cubre reset-password, no el rate limit de forgot-password
      // (ese se cubre aparte en tests/rate-limit.test.js), así que no debe
      // consumir su cupo de solicitudes por ventana.
      const { spy, obtenerToken } = capturarEnlace();
      await passwordResetService.solicitarRecuperacion(usuarioVendedor1.email);
      spy.mockRestore();
      const token = obtenerToken();

      const nuevaPassword = 'NuevaClave123!';
      const res = await request(app).post('/api/auth/reset-password').send({ token, password: nuevaPassword });
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/restablecida correctamente/i);

      // La nueva contraseña se guardó con el mismo mecanismo de hash
      // (bcrypt) que usa el resto del sistema, nunca en texto plano.
      const usuarioActualizado = await db.Usuario.findByPk(usuarioVendedor1.id);
      expect(usuarioActualizado.password).not.toBe(nuevaPassword);
      expect(await bcrypt.compare(nuevaPassword, usuarioActualizado.password)).toBe(true);

      // Login funciona con la nueva contraseña...
      const login = await request(app)
        .post('/api/auth/login')
        .send({ email: usuarioVendedor1.email, password: nuevaPassword });
      expect(login.status).toBe(200);

      // ...y ya no con la anterior.
      const loginViejo = await request(app)
        .post('/api/auth/login')
        .send({ email: usuarioVendedor1.email, password: PASSWORD_PRUEBA });
      expect(loginViejo.status).toBe(401);

      // El mismo token no puede volver a usarse.
      const segundoIntento = await request(app)
        .post('/api/auth/reset-password')
        .send({ token, password: 'OtraClave456!' });
      expect(segundoIntento.status).toBe(400);
    });

    it('al pedir un nuevo enlace, el anterior (sin usar) queda invalidado', async () => {
      const primera = capturarEnlace();
      await passwordResetService.solicitarRecuperacion(usuarioVendedor1.email);
      primera.spy.mockRestore();
      const tokenViejo = primera.obtenerToken();

      const segunda = capturarEnlace();
      await passwordResetService.solicitarRecuperacion(usuarioVendedor1.email);
      segunda.spy.mockRestore();

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: tokenViejo, password: 'NuevaClave123!' });
      expect(res.status).toBe(400);
    });
  });
});
