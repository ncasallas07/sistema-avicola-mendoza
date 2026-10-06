const { Op } = require('sequelize');
const { Rol, Permiso, Usuario } = require('../models');

// Un rol se considera "administrador" (capaz de gestionar el sistema de
// roles/usuarios) si tiene AMBOS permisos. Se usa para impedir que el
// sistema quede sin nadie que pueda recuperar el control (ver sección 12
// del requerimiento: proteger al administrador principal) sin depender de
// un nombre de rol fijo, para que siga funcionando aunque se renombre o se
// cree un rol distinto con las mismas capacidades.
const PERMISOS_ADMINISTRACION = ['usuarios.cambiar_rol', 'roles.asignar_permisos'];

const obtenerPermisosDeRol = async (rolNombre) => {
  const rol = await Rol.findOne({
    where: { nombre: rolNombre, estado: 'activo' },
    include: [{ model: Permiso, as: 'permisos', where: { estado: 'activo' }, required: false }]
  });
  if (!rol) return new Set();
  return new Set(rol.permisos.map((p) => p.codigo));
};

const tienePermiso = async (rolNombre, codigo) => {
  const permisos = await obtenerPermisosDeRol(rolNombre);
  return permisos.has(codigo);
};

const esRolAdministrador = (rolConPermisos) =>
  PERMISOS_ADMINISTRACION.every((codigo) => rolConPermisos.permisos?.some((p) => p.codigo === codigo));

// Cuenta cuántos usuarios activos, con un rol activo "administrador",
// quedarían distintos de excluirUsuarioId/excluirRolId. Se usa antes de
// desactivar un usuario, cambiarle el rol, desactivar un rol o retirarle
// permisos críticos, para no dejar el sistema sin nadie que pueda
// administrarlo.
const contarAdministradoresActivos = async ({ excluirUsuarioId, excluirRolId } = {}) => {
  const roles = await Rol.findAll({
    where: { estado: 'activo', ...(excluirRolId ? { id: { [Op.ne]: excluirRolId } } : {}) },
    include: [{ model: Permiso, as: 'permisos' }]
  });
  const idsRolesAdmin = roles.filter(esRolAdministrador).map((r) => r.id);
  if (idsRolesAdmin.length === 0) return 0;

  return Usuario.count({
    where: {
      estado: 'activo',
      rol_id: { [Op.in]: idsRolesAdmin },
      ...(excluirUsuarioId ? { id: { [Op.ne]: excluirUsuarioId } } : {})
    }
  });
};

module.exports = {
  PERMISOS_ADMINISTRACION,
  obtenerPermisosDeRol,
  tienePermiso,
  esRolAdministrador,
  contarAdministradoresActivos
};
