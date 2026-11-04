const { Categoria } = require('../models');

const listar = async () => Categoria.findAll({ order: [['nombre', 'ASC']] });

const crear = async (datos) => {
  // El nombre es único en la base de datos: se responde 409, como en los demás
  // módulos, en lugar de dejar que el error de la restricción llegue como 500.
  const existente = await Categoria.findOne({ where: { nombre: datos.nombre } });
  if (existente) {
    const error = new Error('Ya existe una categoría con ese nombre');
    error.status = 409;
    throw error;
  }
  return Categoria.create(datos);
};

module.exports = { listar, crear };
