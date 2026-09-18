const reporteService = require('../services/reporte.service');
const { exito } = require('../utils/response');
const { aCSV } = require('../utils/csv');

const responder = (req, res, datos, nombreArchivo) => {
  if (req.query.formato === 'csv') {
    const filas = datos.map((d) => (d.toJSON ? d.toJSON() : d));
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}.csv"`);
    return res.send(aCSV(filas));
  }
  return exito(res, { datos });
};

const ventasPorPeriodo = async (req, res) => {
  const datos = await reporteService.ventasPorPeriodo(req.query);
  responder(req, res, datos, 'ventas_por_periodo');
};

const pedidosPorPeriodo = async (req, res) => {
  const datos = await reporteService.pedidosPorPeriodo(req.query);
  responder(req, res, datos, 'pedidos_por_periodo');
};

const ventasPorVendedor = async (req, res) => {
  const datos = await reporteService.ventasPorVendedor(req.query);
  responder(req, res, datos, 'ventas_por_vendedor');
};

const productosMasVendidos = async (req, res) => {
  const datos = await reporteService.productosMasVendidos(req.query);
  responder(req, res, datos, 'productos_mas_vendidos');
};

const estadoInventario = async (req, res) => {
  const datos = await reporteService.estadoInventario();
  responder(req, res, datos, 'estado_inventario');
};

const stockBajo = async (req, res) => {
  const datos = await reporteService.stockBajo();
  responder(req, res, datos, 'stock_bajo');
};

const clientesPorZona = async (req, res) => {
  const datos = await reporteService.clientesPorZona();
  responder(req, res, datos, 'clientes_por_zona');
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
