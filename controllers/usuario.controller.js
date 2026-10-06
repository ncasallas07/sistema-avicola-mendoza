const usuarioService = require('../services/usuario.service');
const { exito } = require('../utils/response');
const { tienePermiso } = require('../services/autorizacion.service');

const listar = async (req, res) => {
  const usuarios = await usuarioService.listar();
  exito(res, { datos: usuarios });
};

const crear = async (req, res) => {
  const usuario = await usuarioService.crear(req.body);
  exito(res, { mensaje: 'Usuario creado correctamente', datos: usuario, status: 201 });
};

// Editar el nombre/email de un usuario requiere usuarios.editar (ya validado
// por la ruta); cambiarle el rol es una acción más sensible y exige además
// usuarios.cambiar_rol.
const editar = async (req, res) => {
  if (req.body.rol_id && !(await tienePermiso(req.usuario.rol, 'usuarios.cambiar_rol'))) {
    const error = new Error('No tienes permisos para realizar esta acción.');
    error.status = 403;
    throw error;
  }

  const usuario = await usuarioService.editar(req.params.id, req.body);
  exito(res, { mensaje: 'Usuario actualizado correctamente', datos: usuario });
};

const cambiarEstado = async (req, res) => {
  const usuario = await usuarioService.cambiarEstado(req.params.id, req.body.estado);
  exito(res, { mensaje: 'Estado del usuario actualizado', datos: usuario });
};

module.exports = { listar, crear, editar, cambiarEstado };
