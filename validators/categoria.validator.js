const Joi = require('joi');

const crearCategoriaSchema = Joi.object({
  nombre: Joi.string().min(2).max(100).required(),
  descripcion: Joi.string().max(255).allow('', null)
});

module.exports = { crearCategoriaSchema };
