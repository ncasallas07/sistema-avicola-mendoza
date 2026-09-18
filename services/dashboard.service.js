const { Op, fn, col, literal } = require('sequelize');
const db = require('../models');
const { Producto, Cliente, Pedido, DetallePedido } = db;

// El pipeline interno tiene 6 estados (Pendiente, Confirmado, En preparación,
// Enviado, Entregado, Cancelado), pero para el dashboard se agrupan en los 4
// grupos de negocio que pide esta fase: Pendiente / En proceso / Entregado / Cancelado.
const ESTADOS_EN_PROCESO = ['Confirmado', 'En preparación', 'Enviado'];

// Un pedido "Pendiente" todavía no descontó inventario ni es una venta real
// (es apenas una intención de compra); "Cancelado" nunca se concretó. Las
// métricas de ventas/productos más vendidos solo deben contar pedidos que ya
// pasaron por Confirmado (el punto donde el negocio se compromete de verdad).
const ESTADOS_VENTA_CONFIRMADA = ['Confirmado', 'En preparación', 'Enviado', 'Entregado'];

const filtroFecha = (desde, hasta) => {
  if (!desde && !hasta) return {};
  const rango = {};
  if (desde) rango[Op.gte] = desde;
  if (hasta) rango[Op.lte] = hasta;
  return { fecha_creacion: rango };
};

const contarPorGrupoEstado = async (whereBase = {}) => {
  const [pendiente, enProceso, entregado, cancelado] = await Promise.all([
    Pedido.count({ where: { ...whereBase, estado: 'Pendiente' } }),
    Pedido.count({ where: { ...whereBase, estado: { [Op.in]: ESTADOS_EN_PROCESO } } }),
    Pedido.count({ where: { ...whereBase, estado: 'Entregado' } }),
    Pedido.count({ where: { ...whereBase, estado: 'Cancelado' } })
  ]);
  return { pendiente, en_proceso: enProceso, entregado, cancelado };
};

const dashboardAdmin = async ({ desde, hasta } = {}) => {
  const [
    productosActivos,
    totalClientes,
    totalPedidos,
    pedidosPorEstado,
    ventasPeriodo,
    valorTotalPedidos,
    masVendidos
  ] = await Promise.all([
    Producto.findAll({ where: { estado: 'activo' } }),
    Cliente.count({ where: { estado: 'activo' } }),
    Pedido.count(),
    contarPorGrupoEstado(),
    Pedido.sum('total', {
      where: { ...filtroFecha(desde, hasta), estado: { [Op.in]: ESTADOS_VENTA_CONFIRMADA } }
    }),
    Pedido.sum('total', { where: { estado: { [Op.in]: ESTADOS_VENTA_CONFIRMADA } } }),
    DetallePedido.findAll({
      attributes: ['producto_id', [fn('SUM', col('DetallePedido.cantidad')), 'cantidad_vendida']],
      include: [
        { model: Producto, as: 'producto', attributes: ['nombre'] },
        { model: Pedido, as: 'pedido', attributes: [], where: { estado: { [Op.in]: ESTADOS_VENTA_CONFIRMADA } } }
      ],
      group: ['producto_id', 'producto.id', 'producto.nombre'],
      order: [[literal('cantidad_vendida'), 'DESC']],
      limit: 5
    })
  ]);

  return {
    total_productos: productosActivos.length,
    productos_stock_bajo: productosActivos.filter((p) => p.cantidad_disponible > 0 && p.cantidad_disponible <= p.stock_minimo).length,
    productos_agotados: productosActivos.filter((p) => p.cantidad_disponible <= 0).length,
    total_clientes: totalClientes,
    total_pedidos: totalPedidos,
    pedidos_por_estado: pedidosPorEstado,
    ventas_periodo: Number(ventasPeriodo) || 0,
    valor_total_pedidos: Number(valorTotalPedidos) || 0,
    productos_mas_vendidos: masVendidos.map((d) => ({
      producto: d.producto.nombre,
      cantidad_vendida: Number(d.get('cantidad_vendida'))
    }))
  };
};

const dashboardVendedor = async (usuarioAutenticado, { desde, hasta } = {}) => {
  const whereBase = { usuario_id: usuarioAutenticado.id };

  const [totalPedidos, pedidosPorEstado, recientes, ventasPeriodo, totalClientes, totalProductos] = await Promise.all([
    Pedido.count({ where: whereBase }),
    contarPorGrupoEstado(whereBase),
    Pedido.findAll({
      where: whereBase,
      include: [{ model: Cliente, as: 'cliente', attributes: ['id', 'nombre_razon_social'] }],
      order: [['fecha_creacion', 'DESC']],
      limit: 5
    }),
    Pedido.sum('total', {
      where: { ...whereBase, ...filtroFecha(desde, hasta), estado: { [Op.in]: ESTADOS_VENTA_CONFIRMADA } }
    }),
    Cliente.count({ where: { estado: 'activo' } }),
    Producto.count({ where: { estado: 'activo' } })
  ]);

  return {
    total_pedidos: totalPedidos,
    pedidos_por_estado: pedidosPorEstado,
    pedidos_recientes: recientes,
    total_vendido_periodo: Number(ventasPeriodo) || 0,
    total_clientes: totalClientes,
    total_productos: totalProductos
  };
};

const obtenerDashboard = async (usuarioAutenticado, filtros) => {
  if (usuarioAutenticado.rol === 'Admin') return dashboardAdmin(filtros);
  return dashboardVendedor(usuarioAutenticado, filtros);
};

module.exports = { obtenerDashboard };
