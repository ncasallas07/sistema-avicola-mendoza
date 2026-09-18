const Joi = require('joi');

const crearClienteSchema = Joi.object({
  nombre_razon_social: Joi.string().min(2).max(200).required(),
  documento: Joi.string().min(3).max(30).required(),
  telefono: Joi.string()
    .pattern(/^[0-9+\-\s]{7,20}$/)
    .allow('', null),
  correo: Joi.string().email().allow('', null),
  direccion: Joi.string().max(255).allow('', null),
  zona: Joi.string().max(100).allow('', null),
  ciudad: Joi.string().max(100).allow('', null)
});

const editarClienteSchema = crearClienteSchema
  .fork(['nombre_razon_social', 'documento'], (campo) => campo.optional())
  .min(1);

const cambiarEstadoSchema = Joi.object({
  estado: Joi.string().valid('activo', 'inactivo').required()
});

module.exports = { crearClienteSchema, editarClienteSchema, cambiarEstadoSchema };
