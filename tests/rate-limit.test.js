const request = require('supertest');
const app = require('../app');
const { db } = require('./helpers/db');

// Vive en su propio archivo a propósito: Jest le da a cada archivo de test una
// instancia nueva de la app (y por lo tanto del limitador en memoria), así que
// el conteo de intentos no se mezcla con los logins de otras suites como
// auth.test.js.
describe('Rate limit de login', () => {
  afterAll(async () => {
    await db.sequelize.close();
  });

  it('responde 429 con el mismo formato {success, message, data} del resto de la API al superar el límite de intentos', async () => {
    const credencialesInvalidas = { email: 'no-existe@avicolamendoza.com', password: 'lo-que-sea' };

    // El límite configurado es de 10 solicitudes por ventana (routes/auth.routes.js).
    // Se agotan las primeras 10 (fallan con 401, pero igual cuentan contra el
    // límite) y se verifica que la solicitud número 11 sea rechazada por el
    // middleware de rate limiting, no por la lógica de autenticación.
    for (let i = 0; i < 10; i++) {
      await request(app).post('/api/auth/login').send(credencialesInvalidas);
    }

    const res = await request(app).post('/api/auth/login').send(credencialesInvalidas);

    expect(res.status).toBe(429);
    expect(res.body).toEqual({
      success: false,
      message: expect.any(String),
      data: null
    });
  });
});
