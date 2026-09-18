const Joi = require('joi');

const crearProductoSchema = Joi.object({
  nombre: Joi.string().min(2).max(150).required(),
  descripcion: Joi.string().max(255).allow('', null),
  categoria_id: Joi.number().integer().positive().required(),
  textura_presentacion: Joi.string().max(100).allow('', null),
  unidad_medida: Joi.string().max(30).required(),
  precio: Joi.number().positive().required(),
  cantidad_disponible: Joi.number().integer().min(0).default(0),
  stock_minimo: Joi.number().integer().min(0).default(0)
});

const editarProductoSchema = Joi.object({
  nombre: Joi.string().min(2).max(150),
  descripcion: Joi.string().max(255).allow('', null),
  categoria_id: Joi.number().integer().positive(),
  textura_presentacion: Joi.string().max(100).allow('', null),
  unidad_medida: Joi.string().max(30),
  precio: Joi.number().positive(),
  stock_minimo: Joi.number().integer().min(0)
}).min(1);

const cambiarEstadoSchema = Joi.object({
  estado: Joi.string().valid('activo', 'inactivo').required()
});

module.exports = { crearProductoSchema, editarProductoSchema, cambiarEstadoSchema };
