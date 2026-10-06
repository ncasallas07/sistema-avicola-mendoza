const Joi = require('joi');

const crearRolSchema = Joi.object({
  nombre: Joi.string().min(2).max(50).required(),
  descripcion: Joi.string().max(255).allow('', null),
  estado: Joi.string().valid('activo', 'inactivo')
});

const editarRolSchema = Joi.object({
  nombre: Joi.string().min(2).max(50),
  descripcion: Joi.string().max(255).allow('', null)
}).min(1);

const cambiarEstadoSchema = Joi.object({
  estado: Joi.string().valid('activo', 'inactivo').required()
});

const asignarPermisosSchema = Joi.object({
  permisos: Joi.array().items(Joi.number().integer().positive()).required()
});

module.exports = { crearRolSchema, editarRolSchema, cambiarEstadoSchema, asignarPermisosSchema };
