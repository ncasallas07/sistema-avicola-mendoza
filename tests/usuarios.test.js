const request = require('supertest');
const app = require('../app');
const { limpiarBaseDatos, sembrarBase, PASSWORD_PRUEBA, db } = require('./helpers/db');
const { login } = require('./helpers/auth');

describe('Usuarios (ficha de empleado)', () => {
  let tokenAdmin;
  let tokenVendedor;
  let rolVendedorId;

  // beforeAll (no beforeEach): cada test usa su propio email/documento único,
  // así que no hace falta una base limpia por caso. Hacerlo por test
  // duplicaría los logins y superaría el límite del rate limiter de login
  // (10 por ventana — ver routes/auth.routes.js y tests/rate-limit.test.js).
  beforeAll(async () => {
    await limpiarBaseDatos();
    const semilla = await sembrarBase();
    rolVendedorId = semilla.rolVendedor.id;
    tokenAdmin = (await login(semilla.usuarioAdmin.email, PASSWORD_PRUEBA)).token;
    tokenVendedor = (await login(semilla.usuarioVendedor1.email, PASSWORD_PRUEBA)).token;
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe('Crear usuario con los nuevos campos', () => {
    it('acepta y guarda la ficha completa de empleado', async () => {
      const res = await request(app)
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          nombre: 'Empleado Completo',
          email: 'empleado.completo@avicolamendoza.com',
          password: 'Empleado123!',
          rol_id: rolVendedorId,
          tipo_documento: 'CC',
          numero_documento: '1020304050',
          telefono: '3001234567',
          direccion: 'Calle 10 # 20-30',
          rh: 'O+',
          eps: 'Sura EPS',
          arl: 'Positiva ARL',
          cargo: 'Auxiliar de ventas',
          fecha_nacimiento: '1995-05-20',
          fecha_ingreso: '2024-01-15'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.tipo_documento).toBe('CC');
      expect(res.body.data.numero_documento).toBe('1020304050');
      expect(res.body.data.rh).toBe('O+');
      expect(res.body.data.cargo).toBe('Auxiliar de ventas');
      // Nunca debe devolver el hash de la contraseña.
      expect(res.body.data.password).toBeUndefined();
    });

    it('permite crear un usuario sin ningún dato de empleado (todos opcionales)', async () => {
      const res = await request(app)
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          nombre: 'Empleado Mínimo',
          email: 'empleado.minimo@avicolamendoza.com',
          password: 'Empleado123!',
          rol_id: rolVendedorId
        });

      expect(res.status).toBe(201);
      expect(res.body.data.cargo).toBeNull();
    });
  });

  describe('Validaciones', () => {
    const base = {
      nombre: 'Empleado Prueba',
      email: 'empleado.prueba@avicolamendoza.com',
      password: 'Empleado123!'
    };

    it('rechaza un RH que no está en la lista controlada', async () => {
      const res = await request(app)
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ ...base, rol_id: rolVendedorId, rh: 'Z+' });
      expect(res.status).toBe(400);
    });

    it('rechaza una fecha de nacimiento futura', async () => {
      const unAnioAdelante = new Date();
      unAnioAdelante.setFullYear(unAnioAdelante.getFullYear() + 1);
      const res = await request(app)
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          ...base,
          rol_id: rolVendedorId,
          fecha_nacimiento: unAnioAdelante.toISOString().slice(0, 10)
        });
      expect(res.status).toBe(400);
    });

    it('rechaza un teléfono con formato inválido', async () => {
      const res = await request(app)
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ ...base, rol_id: rolVendedorId, telefono: 'abc' });
      expect(res.status).toBe(400);
    });

    it('rechaza fecha de ingreso anterior a la fecha de nacimiento', async () => {
      const res = await request(app)
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          ...base,
          rol_id: rolVendedorId,
          fecha_nacimiento: '2000-01-01',
          fecha_ingreso: '1999-01-01'
        });
      expect(res.status).toBe(400);
    });

    it('exige tipo y número de documento juntos (no uno sin el otro)', async () => {
      const res = await request(app)
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ ...base, rol_id: rolVendedorId, tipo_documento: 'CC' });
      expect(res.status).toBe(400);
    });

    it('rechaza un número de documento duplicado', async () => {
      await request(app)
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ ...base, rol_id: rolVendedorId, tipo_documento: 'CC', numero_documento: '999888777' });

      const res = await request(app)
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          nombre: 'Otro Empleado',
          email: 'otro.empleado@avicolamendoza.com',
          password: 'Empleado123!',
          rol_id: rolVendedorId,
          tipo_documento: 'CE',
          numero_documento: '999888777'
        });
      expect(res.status).toBe(409);
    });
  });

  describe('Actualizar usuario', () => {
    it('actualiza los campos de empleado de un usuario existente', async () => {
      const crear = await request(app)
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          nombre: 'Para Editar',
          email: 'para.editar@avicolamendoza.com',
          password: 'Empleado123!',
          rol_id: rolVendedorId
        });

      const res = await request(app)
        .put(`/api/usuarios/${crear.body.data.id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ cargo: 'Supervisor de bodega', telefono: '3109876543' });

      expect(res.status).toBe(200);
      expect(res.body.data.cargo).toBe('Supervisor de bodega');
      expect(res.body.data.telefono).toBe('3109876543');
      expect(res.body.data.password).toBeUndefined();
    });
  });

  describe('Compatibilidad con usuarios existentes', () => {
    it('los usuarios sembrados sin datos de empleado se listan sin error, con los campos nuevos en null', async () => {
      const res = await request(app).get('/api/usuarios').set('Authorization', `Bearer ${tokenAdmin}`);
      expect(res.status).toBe(200);
      const admin = res.body.data.find((u) => u.email === 'admin.test@avicolamendoza.com');
      expect(admin).toBeDefined();
      expect(admin.cargo).toBeNull();
      expect(admin.rh).toBeNull();
    });

    it('un usuario sembrado antes de estos campos puede seguir iniciando sesión normalmente', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin.test@avicolamendoza.com', password: PASSWORD_PRUEBA });
      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
    });
  });

  describe('Permisos de acceso', () => {
    it('un vendedor (sin usuarios.ver) no puede listar usuarios', async () => {
      const res = await request(app).get('/api/usuarios').set('Authorization', `Bearer ${tokenVendedor}`);
      expect(res.status).toBe(403);
    });

    it('un vendedor (sin usuarios.crear) no puede crear usuarios con ficha de empleado', async () => {
      const res = await request(app)
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${tokenVendedor}`)
        .send({
          nombre: 'Intento No Autorizado',
          email: 'intento@avicolamendoza.com',
          password: 'Empleado123!',
          rol_id: rolVendedorId
        });
      expect(res.status).toBe(403);
    });
  });
});
