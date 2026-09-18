const Joi = require('joi');

// "Pedido" y "Devolución por cancelación" son motivos generados internamente
// por el módulo de pedidos, nunca por un movimiento manual.
const movimientoSchema = Joi.object({
  producto_id: Joi.number().integer().positive().required(),
  cantidad: Joi.number().integer().positive().required(),
  motivo: Joi.string().valid('Compra', 'Ajuste').required()
});

module.exports = { movimientoSchema };
