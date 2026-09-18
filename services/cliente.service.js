const { Op } = require('sequelize');
const { Cliente, Pedido } = require('../models');

const listar = async ({ nombre, documento, zona, estado } = {}) => {
  const where = {};
  if (nombre) where.nombre_razon_social = { [Op.like]: `%${nombre}%` };
  if (documento) where.documento = { [Op.like]: `%${documento}%` };
  if (zona) where.zona = zona;
  if (estado) where.estado = estado;
  return Cliente.findAll({ where, order: [['nombre_razon_social', 'ASC']] });
};

const obtenerPorId = async (id) => {
  const cliente = await Cliente.findByPk(id, {
    include: [{ model: Pedido, as: 'pedidos' }]
  });
  if (!cliente) {
    const error = new Error('Cliente no encontrado');
    error.status = 404;
    throw error;
  }
  return cliente;
};

const crear = async (datos) => {
  const existente = await Cliente.findOne({ where: { documento: datos.documento } });
  if (existente) {
    const error = new Error('Ya existe un cliente con ese documento');
    error.status = 409;
    throw error;
  }
  return Cliente.create(datos);
};

const editar = async (id, cambios) => {
  const cliente = await Cliente.findByPk(id);
  if (!cliente) {
    const error = new Error('Cliente no encontrado');
    error.status = 404;
    throw error;
  }
  await cliente.update(cambios);
  return cliente;
};

const cambiarEstado = async (id, estado) => {
  const cliente = await Cliente.findByPk(id);
  if (!cliente) {
    const error = new Error('Cliente no encontrado');
    error.status = 404;
    throw error;
  }
  cliente.estado = estado;
  await cliente.save();
  return cliente;
};

module.exports = { listar, obtenerPorId, crear, editar, cambiarEstado };
