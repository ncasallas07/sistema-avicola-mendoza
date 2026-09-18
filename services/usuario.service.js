const bcrypt = require('bcryptjs');
const { Usuario, Rol } = require('../models');

const listar = async () => {
  return Usuario.findAll({
    attributes: { exclude: ['password'] },
    include: [{ model: Rol, as: 'rol', attributes: ['id', 'nombre'] }]
  });
};

const crear = async ({ nombre, email, password, rol }) => {
  const existente = await Usuario.findOne({ where: { email } });
  if (existente) {
    const error = new Error('El email ya está registrado');
    error.status = 409;
    throw error;
  }

  const rolEncontrado = await Rol.findOne({ where: { nombre: rol } });
  if (!rolEncontrado) {
    const error = new Error('Rol inválido');
    error.status = 400;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const usuario = await Usuario.create({
    nombre,
    email,
    password: passwordHash,
    rol_id: rolEncontrado.id
  });

  return { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: rolEncontrado.nombre };
};

const editar = async (id, cambios) => {
  const usuario = await Usuario.findByPk(id);
  if (!usuario) {
    const error = new Error('Usuario no encontrado');
    error.status = 404;
    throw error;
  }

  if (cambios.rol) {
    const rolEncontrado = await Rol.findOne({ where: { nombre: cambios.rol } });
    if (!rolEncontrado) {
      const error = new Error('Rol inválido');
      error.status = 400;
      throw error;
    }
    usuario.rol_id = rolEncontrado.id;
  }

  if (cambios.nombre) usuario.nombre = cambios.nombre;
  if (cambios.email) usuario.email = cambios.email;

  await usuario.save();
  return usuario;
};

const cambiarEstado = async (id, estado) => {
  const usuario = await Usuario.findByPk(id);
  if (!usuario) {
    const error = new Error('Usuario no encontrado');
    error.status = 404;
    throw error;
  }
  usuario.estado = estado;
  await usuario.save();
  return usuario;
};

module.exports = { listar, crear, editar, cambiarEstado };
