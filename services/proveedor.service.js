const { Op } = require('sequelize');
const { Proveedor } = require('../models');

const listar = async ({ nombre, identificacion, estado } = {}) => {
  const where = {};
  if (nombre) where.nombre_razon_social = { [Op.like]: `%${nombre}%` };
  if (identificacion) where.identificacion = { [Op.like]: `%${identificacion}%` };
  if (estado) where.estado = estado;
  return Proveedor.findAll({ where, order: [['nombre_razon_social', 'ASC']] });
};

const obtenerPorId = async (id) => {
  const proveedor = await Proveedor.findByPk(id);
  if (!proveedor) {
    const error = new Error('Proveedor no encontrado');
    error.status = 404;
    throw error;
  }
  return proveedor;
};

const crear = async (datos) => {
  const existente = await Proveedor.findOne({ where: { identificacion: datos.identificacion } });
  if (existente) {
    const error = new Error('Ya existe un proveedor con esa identificación');
    error.status = 409;
    throw error;
  }
  return Proveedor.create(datos);
};

const editar = async (id, cambios) => {
  const proveedor = await obtenerPorId(id);
  await proveedor.update(cambios);
  return proveedor;
};

const cambiarEstado = async (id, estado) => {
  const proveedor = await obtenerPorId(id);
  proveedor.estado = estado;
  await proveedor.save();
  return proveedor;
};

module.exports = { listar, obtenerPorId, crear, editar, cambiarEstado };
