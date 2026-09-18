const usuarioService = require('../services/usuario.service');
const { exito } = require('../utils/response');

const listar = async (req, res) => {
  const usuarios = await usuarioService.listar();
  exito(res, { datos: usuarios });
};

const crear = async (req, res) => {
  const usuario = await usuarioService.crear(req.body);
  exito(res, { mensaje: 'Usuario creado correctamente', datos: usuario, status: 201 });
};

const editar = async (req, res) => {
  const usuario = await usuarioService.editar(req.params.id, req.body);
  exito(res, { mensaje: 'Usuario actualizado correctamente', datos: usuario });
};

const cambiarEstado = async (req, res) => {
  const usuario = await usuarioService.cambiarEstado(req.params.id, req.body.estado);
  exito(res, { mensaje: 'Estado del usuario actualizado', datos: usuario });
};

module.exports = { listar, crear, editar, cambiarEstado };
