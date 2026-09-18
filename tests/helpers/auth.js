const request = require('supertest');
const app = require('../../app');

// Inicia sesión por la API real (no genera el JWT a mano) para que las
// pruebas ejerciten el mismo camino que un usuario real.
const login = async (email, password) => {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return res.body.data;
};

module.exports = { login };
