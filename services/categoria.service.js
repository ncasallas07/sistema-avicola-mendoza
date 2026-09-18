const { Categoria } = require('../models');

const listar = async () => Categoria.findAll({ order: [['nombre', 'ASC']] });

const crear = async (datos) => Categoria.create(datos);

module.exports = { listar, crear };
