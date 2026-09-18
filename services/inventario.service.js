const { Op } = require('sequelize');
const db = require('../models');
const { sequelize, Producto, MovimientoInventario, Usuario } = db;

const listarExistencias = async ({ indicador } = {}) => {
  const productos = await Producto.findAll({
    where: { estado: 'activo' },
    order: [['nombre', 'ASC']]
  });

  const resultado = productos.map((p) => {
    let estadoStock = 'normal';
    if (p.cantidad_disponible <= 0) estadoStock = 'agotado';
    else if (p.cantidad_disponible <= p.stock_minimo) estadoStock = 'bajo';

    return {
      id: p.id,
      nombre: p.nombre,
      cantidad_disponible: p.cantidad_disponible,
      stock_minimo: p.stock_minimo,
      indicador: estadoStock
    };
  });

  if (!indicador) return resultado;
  return resultado.filter((p) => p.indicador === indicador);
};

const listarMovimientos = async ({ producto_id, desde, hasta } = {}) => {
  const where = {};
  if (producto_id) where.producto_id = producto_id;
  if (desde || hasta) {
    where.fecha = {};
    if (desde) where.fecha[Op.gte] = desde;
    if (hasta) where.fecha[Op.lte] = hasta;
  }

  return MovimientoInventario.findAll({
    where,
    include: [
      { model: Producto, as: 'producto', attributes: ['id', 'nombre'] },
      { model: Usuario, as: 'usuario', attributes: ['id', 'nombre'] }
    ],
    order: [['fecha', 'DESC']]
  });
};

const registrarEntrada = async ({ producto_id, cantidad, motivo }, usuarioAutenticado) => {
  return sequelize.transaction(async (t) => {
    const producto = await Producto.findByPk(producto_id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!producto || producto.estado !== 'activo') {
      const error = new Error('Producto no válido o inactivo');
      error.status = 400;
      throw error;
    }

    producto.cantidad_disponible += cantidad;
    await producto.save({ transaction: t });

    return MovimientoInventario.create(
      { producto_id, tipo: 'Entrada', cantidad, motivo, usuario_id: usuarioAutenticado.id },
      { transaction: t }
    );
  });
};

const registrarSalida = async ({ producto_id, cantidad, motivo }, usuarioAutenticado) => {
  return sequelize.transaction(async (t) => {
    const producto = await Producto.findByPk(producto_id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!producto || producto.estado !== 'activo') {
      const error = new Error('Producto no válido o inactivo');
      error.status = 400;
      throw error;
    }

    if (producto.cantidad_disponible < cantidad) {
      const error = new Error(
        `Inventario insuficiente. Disponible: ${producto.cantidad_disponible}, solicitado: ${cantidad}`
      );
      error.status = 400;
      throw error;
    }

    producto.cantidad_disponible -= cantidad;
    await producto.save({ transaction: t });

    return MovimientoInventario.create(
      { producto_id, tipo: 'Salida', cantidad, motivo, usuario_id: usuarioAutenticado.id },
      { transaction: t }
    );
  });
};

module.exports = { listarExistencias, listarMovimientos, registrarEntrada, registrarSalida };
