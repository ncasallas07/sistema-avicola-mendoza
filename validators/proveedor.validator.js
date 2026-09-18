const Joi = require('joi');

const crearProveedorSchema = Joi.object({
  nombre_razon_social: Joi.string().min(2).max(200).required(),
  identificacion: Joi.string().min(3).max(30).required(),
  telefono: Joi.string()
    .pattern(/^[0-9+\-\s]{7,20}$/)
    .allow('', null),
  correo: Joi.string().email().allow('', null),
  direccion: Joi.string().max(255).allow('', null)
});

const editarProveedorSchema = crearProveedorSchema
  .fork(['nombre_razon_social', 'identificacion'], (campo) => campo.optional())
  .min(1);

const cambiarEstadoSchema = Joi.object({
  estado: Joi.string().valid('activo', 'inactivo').required()
});

module.exports = { crearProveedorSchema, editarProveedorSchema, cambiarEstadoSchema };
