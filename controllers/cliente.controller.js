const clienteService = require('../services/cliente.service');
const { exito } = require('../utils/response');

const listar = async (req, res) => {
  const clientes = await clienteService.listar(req.query);
  exito(res, { datos: clientes });
};

const obtener = async (req, res) => {
  const cliente = await clienteService.obtenerPorId(req.params.id);
  exito(res, { datos: cliente });
};

const crear = async (req, res) => {
  const cliente = await clienteService.crear(req.body);
  exito(res, { mensaje: 'Cliente creado correctamente', datos: cliente, status: 201 });
};

const editar = async (req, res) => {
  const cliente = await clienteService.editar(req.params.id, req.body);
  exito(res, { mensaje: 'Cliente actualizado correctamente', datos: cliente });
};

const cambiarEstado = async (req, res) => {
  const cliente = await clienteService.cambiarEstado(req.params.id, req.body.estado);
  exito(res, { mensaje: 'Estado del cliente actualizado', datos: cliente });
};

module.exports = { listar, obtener, crear, editar, cambiarEstado };
