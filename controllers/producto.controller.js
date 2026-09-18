const productoService = require('../services/producto.service');
const { exito } = require('../utils/response');

const listar = async (req, res) => {
  const productos = await productoService.listar(req.query);
  exito(res, { datos: productos });
};

const obtener = async (req, res) => {
  const producto = await productoService.obtenerPorId(req.params.id);
  exito(res, { datos: producto });
};

const crear = async (req, res) => {
  const producto = await productoService.crear(req.body);
  exito(res, { mensaje: 'Producto creado correctamente', datos: producto, status: 201 });
};

const editar = async (req, res) => {
  const producto = await productoService.editar(req.params.id, req.body);
  exito(res, { mensaje: 'Producto actualizado correctamente', datos: producto });
};

const cambiarEstado = async (req, res) => {
  const producto = await productoService.cambiarEstado(req.params.id, req.body.estado);
  exito(res, { mensaje: 'Estado del producto actualizado', datos: producto });
};

module.exports = { listar, obtener, crear, editar, cambiarEstado };
