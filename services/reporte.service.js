const { Op, fn, col, literal } = require('sequelize');
const db = require('../models');
const { Pedido, DetallePedido, Producto, Cliente, Usuario } = db;

const filtroFechas = (desde, hasta) => {
  if (!desde && !hasta) return {};
  const rango = {};
  if (desde) rango[Op.gte] = desde;
  if (hasta) rango[Op.lte] = hasta;
  return { fecha_creacion: rango };
};

// Un pedido "Pendiente" aún no es una venta real (no descontó inventario) y
// "Cancelado" nunca se concretó — los reportes de ventas solo cuentan pedidos
// que ya fueron confirmados.
const ESTADOS_VENTA_CONFIRMADA = ['Confirmado', 'En preparación', 'Enviado', 'Entregado'];

const ventasPorPeriodo = async ({ desde, hasta } = {}) => {
  return Pedido.findAll({
    where: { ...filtroFechas(desde, hasta), estado: { [Op.in]: ESTADOS_VENTA_CONFIRMADA } },
    include: [{ model: Cliente, as: 'cliente', attributes: ['nombre_razon_social'] }],
    order: [['fecha_creacion', 'ASC']]
  });
};

const pedidosPorPeriodo = async ({ desde, hasta, estado } = {}) => {
  const where = filtroFechas(desde, hasta);
  if (estado) where.estado = estado;
  return Pedido.findAll({
    where,
    include: [
      { model: Cliente, as: 'cliente', attributes: ['nombre_razon_social'] },
      { model: Usuario, as: 'creadoPor', attributes: ['nombre'] }
    ],
    order: [['fecha_creacion', 'ASC']]
  });
};

const ventasPorVendedor = async ({ desde, hasta } = {}) => {
  return Pedido.findAll({
    attributes: [
      'usuario_id',
      [fn('COUNT', col('Pedido.id')), 'total_pedidos'],
      [fn('SUM', col('total')), 'total_vendido']
    ],
    where: { ...filtroFechas(desde, hasta), estado: { [Op.in]: ESTADOS_VENTA_CONFIRMADA } },
    include: [{ model: Usuario, as: 'creadoPor', attributes: ['nombre'] }],
    group: ['usuario_id', 'creadoPor.id', 'creadoPor.nombre']
  });
};

const productosMasVendidos = async ({ desde, hasta } = {}) => {
  return DetallePedido.findAll({
    attributes: ['producto_id', [fn('SUM', col('DetallePedido.cantidad')), 'cantidad_vendida']],
    include: [
      { model: Producto, as: 'producto', attributes: ['nombre'] },
      {
        model: Pedido,
        as: 'pedido',
        attributes: [],
        where: { ...filtroFechas(desde, hasta), estado: { [Op.in]: ESTADOS_VENTA_CONFIRMADA } }
      }
    ],
    group: ['producto_id', 'producto.id', 'producto.nombre'],
    order: [[literal('cantidad_vendida'), 'DESC']]
  });
};

const estadoInventario = async () => {
  return Producto.findAll({ where: { estado: 'activo' }, order: [['nombre', 'ASC']] });
};

const stockBajo = async () => {
  const productos = await Producto.findAll({ where: { estado: 'activo' } });
  return productos.filter((p) => p.cantidad_disponible <= p.stock_minimo);
};

const clientesPorZona = async () => {
  return Cliente.findAll({
    attributes: ['zona', [fn('COUNT', col('id')), 'total_clientes']],
    where: { estado: 'activo' },
    group: ['zona']
  });
};

module.exports = {
  ventasPorPeriodo,
  pedidosPorPeriodo,
  ventasPorVendedor,
  productosMasVendidos,
  estadoInventario,
  stockBajo,
  clientesPorZona
};
