const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Usuario, Rol } = require('../models');

const login = async ({ email, password }) => {
  const usuario = await Usuario.findOne({
    where: { email },
    include: [{ model: Rol, as: 'rol' }]
  });

  if (!usuario || usuario.estado !== 'activo') {
    const error = new Error('Credenciales inválidas');
    error.status = 401;
    throw error;
  }

  const passwordValida = await bcrypt.compare(password, usuario.password);
  if (!passwordValida) {
    const error = new Error('Credenciales inválidas');
    error.status = 401;
    throw error;
  }

  const token = jwt.sign(
    { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol.nombre },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  return {
    token,
    usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol.nombre }
  };
};

module.exports = { login };
