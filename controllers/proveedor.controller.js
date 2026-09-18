const proveedorService = require('../services/proveedor.service');
const { exito } = require('../utils/response');

const listar = async (req, res) => {
  const proveedores = await proveedorService.listar(req.query);
  exito(res, { datos: proveedores });
};

const obtener = async (req, res) => {
  const proveedor = await proveedorService.obtenerPorId(req.params.id);
  exito(res, { datos: proveedor });
};

const crear = async (req, res) => {
  const proveedor = await proveedorService.crear(req.body);
  exito(res, { mensaje: 'Proveedor creado correctamente', datos: proveedor, status: 201 });
};

const editar = async (req, res) => {
  const proveedor = await proveedorService.editar(req.params.id, req.body);
  exito(res, { mensaje: 'Proveedor actualizado correctamente', datos: proveedor });
};

const cambiarEstado = async (req, res) => {
  const proveedor = await proveedorService.cambiarEstado(req.params.id, req.body.estado);
  exito(res, { mensaje: 'Estado del proveedor actualizado', datos: proveedor });
};

module.exports = { listar, obtener, crear, editar, cambiarEstado };
