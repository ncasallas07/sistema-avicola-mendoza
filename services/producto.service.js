const { Op } = require('sequelize');
const { Producto, Categoria } = require('../models');

const listar = async ({ nombre, categoria_id, textura_presentacion, estado, stock_bajo } = {}) => {
  const where = {};
  if (nombre) where.nombre = { [Op.like]: `%${nombre}%` };
  if (categoria_id) where.categoria_id = categoria_id;
  if (textura_presentacion) where.textura_presentacion = { [Op.like]: `%${textura_presentacion}%` };
  if (estado) where.estado = estado;

  const productos = await Producto.findAll({
    where,
    include: [{ model: Categoria, as: 'categoria', attributes: ['id', 'nombre'] }],
    order: [['nombre', 'ASC']]
  });

  if (stock_bajo === 'true' || stock_bajo === true) {
    return productos.filter((p) => p.cantidad_disponible <= p.stock_minimo);
  }

  return productos;
};

const obtenerPorId = async (id) => {
  const producto = await Producto.findByPk(id, {
    include: [{ model: Categoria, as: 'categoria' }]
  });
  if (!producto) {
    const error = new Error('Producto no encontrado');
    error.status = 404;
    throw error;
  }
  return producto;
};

const crear = async (datos) => {
  const categoria = await Categoria.findByPk(datos.categoria_id);
  if (!categoria) {
    const error = new Error('Categoría no encontrada');
    error.status = 400;
    throw error;
  }
  return Producto.create(datos);
};

const editar = async (id, cambios) => {
  const producto = await obtenerPorId(id);

  if (cambios.categoria_id) {
    const categoria = await Categoria.findByPk(cambios.categoria_id);
    if (!categoria) {
      const error = new Error('Categoría no encontrada');
      error.status = 400;
      throw error;
    }
  }

  await producto.update(cambios);
  return producto;
};

const cambiarEstado = async (id, estado) => {
  const producto = await obtenerPorId(id);
  producto.estado = estado;
  await producto.save();
  return producto;
};

module.exports = { listar, obtenerPorId, crear, editar, cambiarEstado };
