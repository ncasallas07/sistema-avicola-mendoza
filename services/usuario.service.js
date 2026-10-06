const bcrypt = require('bcryptjs');
const { Usuario, Rol, Permiso } = require('../models');
const { esRolAdministrador, contarAdministradoresActivos } = require('./autorizacion.service');

const listar = async () => {
  return Usuario.findAll({
    attributes: { exclude: ['password'] },
    include: [{ model: Rol, as: 'rol', attributes: ['id', 'nombre'] }]
  });
};

const obtenerRolActivo = async (rol_id) => {
  const rol = await Rol.findByPk(rol_id, { include: [{ model: Permiso, as: 'permisos' }] });
  if (!rol || rol.estado !== 'activo') {
    const error = new Error('Rol inválido o inactivo');
    error.status = 400;
    throw error;
  }
  return rol;
};

const crear = async ({ nombre, email, password, rol_id }) => {
  const existente = await Usuario.findOne({ where: { email } });
  if (existente) {
    const error = new Error('El email ya está registrado');
    error.status = 409;
    throw error;
  }

  const rol = await obtenerRolActivo(rol_id);

  const passwordHash = await bcrypt.hash(password, 10);
  const usuario = await Usuario.create({
    nombre,
    email,
    password: passwordHash,
    rol_id: rol.id
  });

  return { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: { id: rol.id, nombre: rol.nombre } };
};

const editar = async (id, cambios) => {
  const usuario = await Usuario.findByPk(id, { include: [{ model: Rol, as: 'rol', include: [{ model: Permiso, as: 'permisos' }] }] });
  if (!usuario) {
    const error = new Error('Usuario no encontrado');
    error.status = 404;
    throw error;
  }

  if (cambios.rol_id && cambios.rol_id !== usuario.rol_id) {
    const nuevoRol = await obtenerRolActivo(cambios.rol_id);

    if (esRolAdministrador(usuario.rol) && !esRolAdministrador(nuevoRol)) {
      const restantes = await contarAdministradoresActivos({ excluirUsuarioId: usuario.id });
      if (restantes === 0) {
        const error = new Error(
          'No puedes cambiarle el rol a este usuario: es el único administrador activo del sistema.'
        );
        error.status = 409;
        throw error;
      }
    }

    usuario.rol_id = nuevoRol.id;
  }

  if (cambios.nombre) usuario.nombre = cambios.nombre;
  if (cambios.email) usuario.email = cambios.email;

  await usuario.save();
  return usuario;
};

const cambiarEstado = async (id, estado) => {
  const usuario = await Usuario.findByPk(id, { include: [{ model: Rol, as: 'rol', include: [{ model: Permiso, as: 'permisos' }] }] });
  if (!usuario) {
    const error = new Error('Usuario no encontrado');
    error.status = 404;
    throw error;
  }

  if (estado === 'inactivo' && esRolAdministrador(usuario.rol)) {
    const restantes = await contarAdministradoresActivos({ excluirUsuarioId: usuario.id });
    if (restantes === 0) {
      const error = new Error('No puedes desactivar al único administrador activo del sistema.');
      error.status = 409;
      throw error;
    }
  }

  usuario.estado = estado;
  await usuario.save();
  return usuario;
};

module.exports = { listar, crear, editar, cambiarEstado };
