const pedidoService = require('../services/pedido.service');
const { generarComprobantePDF } = require('../utils/comprobante');
const { exito } = require('../utils/response');

const listar = async (req, res) => {
  const pedidos = await pedidoService.listar(req.query, req.usuario);
  exito(res, { datos: pedidos });
};

const obtener = async (req, res) => {
  const pedido = await pedidoService.obtenerPorId(req.params.id, req.usuario);
  exito(res, { datos: pedido });
};

const crear = async (req, res) => {
  const pedido = await pedidoService.crear(req.body, req.usuario);
  exito(res, { mensaje: 'Pedido creado correctamente', datos: pedido, status: 201 });
};

const MENSAJES_ESTADO = {
  Confirmado: 'Pedido confirmado correctamente. Se descontó el inventario.',
  'En preparación': 'Pedido marcado como en preparación.',
  Enviado: 'Pedido marcado como enviado.',
  Entregado: 'Pedido marcado como entregado.',
  Cancelado: 'Pedido cancelado correctamente.'
};

const cambiarEstado = async (req, res) => {
  const pedido = await pedidoService.cambiarEstado(req.params.id, req.body.estado, req.usuario);
  exito(res, { mensaje: MENSAJES_ESTADO[pedido.estado] || 'Estado del pedido actualizado', datos: pedido });
};

const comprobante = async (req, res) => {
  const pedido = await pedidoService.obtenerPorId(req.params.id, req.usuario);
  const doc = generarComprobantePDF(pedido);
  const numero = pedido.numero_pedido.replace(/^PED-/, '');

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="Comprobante-Pedido-${numero}.pdf"`);
  doc.pipe(res);
  doc.end();
};

module.exports = { listar, obtener, crear, cambiarEstado, comprobante };
