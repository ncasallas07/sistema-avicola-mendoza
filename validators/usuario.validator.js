const Joi = require('joi');

const crearUsuarioSchema = Joi.object({
  nombre: Joi.string().min(2).max(150).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  rol: Joi.string().valid('Admin', 'Vendedor').required()
});

const editarUsuarioSchema = Joi.object({
  nombre: Joi.string().min(2).max(150),
  email: Joi.string().email(),
  rol: Joi.string().valid('Admin', 'Vendedor')
}).min(1);

const cambiarEstadoSchema = Joi.object({
  estado: Joi.string().valid('activo', 'inactivo').required()
});

module.exports = { crearUsuarioSchema, editarUsuarioSchema, cambiarEstadoSchema };
