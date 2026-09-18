const inventarioService = require('../services/inventario.service');
const { exito } = require('../utils/response');

const listarExistencias = async (req, res) => {
  const existencias = await inventarioService.listarExistencias(req.query);
  exito(res, { datos: existencias });
};

const listarMovimientos = async (req, res) => {
  const movimientos = await inventarioService.listarMovimientos(req.query);
  exito(res, { datos: movimientos });
};

const registrarEntrada = async (req, res) => {
  const movimiento = await inventarioService.registrarEntrada(req.body, req.usuario);
  exito(res, { mensaje: 'Entrada de inventario registrada', datos: movimiento, status: 201 });
};

const registrarSalida = async (req, res) => {
  const movimiento = await inventarioService.registrarSalida(req.body, req.usuario);
  exito(res, { mensaje: 'Salida de inventario registrada', datos: movimiento, status: 201 });
};

module.exports = { listarExistencias, listarMovimientos, registrarEntrada, registrarSalida };
