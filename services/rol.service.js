const { Rol, Permiso, Usuario, sequelize } = require('../models');
const { contarAdministradoresActivos, esRolAdministrador } = require('./autorizacion.service');

const listar = async () => {
  const roles = await Rol.findAll({
    include: [{ model: Permiso, as: 'permisos', attributes: ['id'] }],
    order: [['id', 'ASC']]
  });

  const conteoUsuarios = await Usuario.findAll({
    attributes: ['rol_id', [sequelize.fn('COUNT', sequelize.col('id')), 'total']],
    group: ['rol_id']
  });
  const usuariosPorRol = Object.fromEntries(conteoUsuarios.map((c) => [c.rol_id, Number(c.get('total'))]));

  return roles.map((rol) => ({
    id: rol.id,
    nombre: rol.nombre,
    descripcion: rol.descripcion,
    estado: rol.estado,
    fecha_creacion: rol.fecha_creacion,
    total_permisos: rol.permisos.length,
    total_usuarios: usuariosPorRol[rol.id] || 0
  }));
};

const obtener = async (id) => {
  const rol = await Rol.findByPk(id, { include: [{ model: Permiso, as: 'permisos' }] });
  if (!rol) {
    const error = new Error('Rol no encontrado');
    error.status = 404;
    throw error;
  }
  return rol;
};

const crear = async ({ nombre, descripcion, estado }) => {
  const existente = await Rol.findOne({ where: { nombre } });
  if (existente) {
    const error = new Error('Ya existe un rol con ese nombre');
    error.status = 409;
    throw error;
  }

  return Rol.create({ nombre, descripcion: descripcion || null, estado: estado || 'activo' });
};

const editar = async (id, cambios) => {
  const rol = await obtener(id);

  if (cambios.nombre && cambios.nombre !== rol.nombre) {
    const existente = await Rol.findOne({ where: { nombre: cambios.nombre } });
    if (existente) {
      const error = new Error('Ya existe un rol con ese nombre');
      error.status = 409;
      throw error;
    }
    rol.nombre = cambios.nombre;
  }

  if (cambios.descripcion !== undefined) rol.descripcion = cambios.descripcion || null;

  await rol.save();
  return rol;
};

const cambiarEstado = async (id, estado) => {
  const rol = await obtener(id);

  if (estado === 'inactivo' && esRolAdministrador(rol)) {
    const restantes = await contarAdministradoresActivos({ excluirRolId: rol.id });
    if (restantes === 0) {
      const error = new Error(
        'No puedes desactivar este rol: es el único que puede administrar roles y usuarios en el sistema.'
      );
      error.status = 409;
      throw error;
    }
  }

  rol.estado = estado;
  await rol.save();
  return rol;
};

const eliminar = async (id) => {
  const rol = await obtener(id);

  const usuariosAsociados = await Usuario.count({ where: { rol_id: id } });
  if (usuariosAsociados > 0) {
    const error = new Error(
      `No se puede eliminar el rol "${rol.nombre}": tiene ${usuariosAsociados} usuario(s) asociado(s). Desactívalo en su lugar.`
    );
    error.status = 409;
    throw error;
  }

  await rol.destroy();
};

const obtenerPermisos = async (id) => {
  const rol = await obtener(id);
  return rol.permisos;
};

const asignarPermisos = async (id, permisoIds) => {
  const rol = await obtener(id);

  const permisosValidos = await Permiso.findAll({ where: { id: permisoIds } });
  if (permisosValidos.length !== permisoIds.length) {
    const error = new Error('Alguno de los permisos indicados no existe');
    error.status = 400;
    throw error;
  }

  if (esRolAdministrador(rol)) {
    const codigosNuevos = new Set(permisosValidos.map((p) => p.codigo));
    const seguiraSiendoAdmin = ['usuarios.cambiar_rol', 'roles.asignar_permisos'].every((c) =>
      codigosNuevos.has(c)
    );
    if (!seguiraSiendoAdmin) {
      const restantes = await contarAdministradoresActivos({ excluirRolId: rol.id });
      if (restantes === 0) {
        const error = new Error(
          'No puedes retirarle estos permisos a este rol: quedaría el sistema sin nadie que pueda administrar roles y usuarios.'
        );
        error.status = 409;
        throw error;
      }
    }
  }

  await rol.setPermisos(permisosValidos);
  return obtener(id);
};

module.exports = { listar, obtener, crear, editar, cambiarEstado, eliminar, obtenerPermisos, asignarPermisos };
