const Joi = require('joi');

const itemSchema = Joi.object({
  producto_id: Joi.number().integer().positive().required(),
  cantidad: Joi.number().integer().positive().required()
});

const crearPedidoSchema = Joi.object({
  cliente_id: Joi.number().integer().positive().required(),
  observaciones: Joi.string().max(500).allow('', null),
  items: Joi.array().items(itemSchema).min(1).required()
});

const cambiarEstadoSchema = Joi.object({
  estado: Joi.string().valid('Confirmado', 'En preparación', 'Enviado', 'Entregado', 'Cancelado').required()
});

module.exports = { crearPedidoSchema, cambiarEstadoSchema };
