const rolService = require('../services/rol.service');
const { exito } = require('../utils/response');

const listar = async (req, res) => {
  const roles = await rolService.listar();
  exito(res, { datos: roles });
};

const obtener = async (req, res) => {
  const rol = await rolService.obtener(req.params.id);
  exito(res, { datos: rol });
};

const crear = async (req, res) => {
  const rol = await rolService.crear(req.body);
  exito(res, { mensaje: 'Rol creado correctamente', datos: rol, status: 201 });
};

const editar = async (req, res) => {
  const rol = await rolService.editar(req.params.id, req.body);
  exito(res, { mensaje: 'Rol actualizado correctamente', datos: rol });
};

const cambiarEstado = async (req, res) => {
  const rol = await rolService.cambiarEstado(req.params.id, req.body.estado);
  exito(res, { mensaje: 'Estado del rol actualizado', datos: rol });
};

const eliminar = async (req, res) => {
  await rolService.eliminar(req.params.id);
  exito(res, { mensaje: 'Rol eliminado correctamente' });
};

const obtenerPermisos = async (req, res) => {
  const permisos = await rolService.obtenerPermisos(req.params.id);
  exito(res, { datos: permisos });
};

const asignarPermisos = async (req, res) => {
  const rol = await rolService.asignarPermisos(req.params.id, req.body.permisos);
  exito(res, { mensaje: 'Permisos actualizados correctamente', datos: rol });
};

module.exports = { listar, obtener, crear, editar, cambiarEstado, eliminar, obtenerPermisos, asignarPermisos };
