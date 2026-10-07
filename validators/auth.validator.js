const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const solicitarRecuperacionSchema = Joi.object({
  email: Joi.string().email().required()
});

// Misma regla de contraseña que ya usa la creación de usuarios
// (validators/usuario.validator.js: Joi.string().min(8)).
const restablecerPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(8).required()
});

module.exports = { loginSchema, solicitarRecuperacionSchema, restablecerPasswordSchema };
