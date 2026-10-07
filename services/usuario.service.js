const bcrypt = require('bcryptjs');
const { Usuario, Rol, Permiso } = require('../models');
const { esRolAdministrador, contarAdministradoresActivos } = require('./autorizacion.service');

const CAMPOS_EMPLEADO = [
  'tipo_documento',
  'numero_documento',
  'telefono',
  'direccion',
  'rh',
  'eps',
  'arl',
  'cargo',
  'fecha_nacimiento',
  'fecha_ingreso'
];

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

// fecha_ingreso antes de fecha_nacimiento es incoherente (nadie empieza a
// trabajar antes de nacer); el resto de combinaciones son válidas sin más
// reglas artificiales (altas/vinculaciones el mismo día de nacer no aplican
// en la práctica, pero no hace falta modelar una edad mínima aquí).
const validarCoherenciaFechas = ({ fecha_nacimiento, fecha_ingreso }) => {
  if (fecha_nacimiento && fecha_ingreso && new Date(fecha_ingreso) < new Date(fecha_nacimiento)) {
    const error = new Error('La fecha de ingreso no puede ser anterior a la fecha de nacimiento');
    error.status = 400;
    throw error;
  }
};

const asegurarNumeroDocumentoUnico = async (numero_documento, idExcluido) => {
  if (!numero_documento) return;
  const existente = await Usuario.findOne({ where: { numero_documento } });
  if (existente && existente.id !== idExcluido) {
    const error = new Error('Ya existe un usuario registrado con ese número de documento');
    error.status = 409;
    throw error;
  }
};

const serializar = (usuario, rol) => {
  const datos = { id: usuario.id, nombre: usuario.nombre, email: usuario.email, estado: usuario.estado, rol };
  for (const campo of CAMPOS_EMPLEADO) datos[campo] = usuario[campo] ?? null;
  return datos;
};

const crear = async (payload) => {
  const { nombre, email, password, rol_id, ...camposEmpleado } = payload;

  const existente = await Usuario.findOne({ where: { email } });
  if (existente) {
    const error = new Error('El email ya está registrado');
    error.status = 409;
    throw error;
  }

  validarCoherenciaFechas(camposEmpleado);
  await asegurarNumeroDocumentoUnico(camposEmpleado.numero_documento);

  const rol = await obtenerRolActivo(rol_id);

  const passwordHash = await bcrypt.hash(password, 10);
  const usuario = await Usuario.create({
    nombre,
    email,
    password: passwordHash,
    rol_id: rol.id,
    ...Object.fromEntries(CAMPOS_EMPLEADO.map((c) => [c, camposEmpleado[c] || null]))
  });

  return serializar(usuario, { id: rol.id, nombre: rol.nombre });
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

  const fechasAValidar = {
    fecha_nacimiento: cambios.fecha_nacimiento !== undefined ? cambios.fecha_nacimiento : usuario.fecha_nacimiento,
    fecha_ingreso: cambios.fecha_ingreso !== undefined ? cambios.fecha_ingreso : usuario.fecha_ingreso
  };
  validarCoherenciaFechas(fechasAValidar);

  if (cambios.numero_documento !== undefined) {
    await asegurarNumeroDocumentoUnico(cambios.numero_documento, usuario.id);
  }

  for (const campo of CAMPOS_EMPLEADO) {
    if (cambios[campo] !== undefined) usuario[campo] = cambios[campo] || null;
  }

  await usuario.save();
  return serializar(usuario, { id: usuario.rol.id, nombre: usuario.rol.nombre });
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
  return serializar(usuario, { id: usuario.rol.id, nombre: usuario.rol.nombre });
};

module.exports = { listar, crear, editar, cambiarEstado };
