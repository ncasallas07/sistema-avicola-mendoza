const reporteService = require('../services/reporte.service');
const { exito } = require('../utils/response');
const { aCSV } = require('../utils/csv');
const { tienePermiso } = require('../services/autorizacion.service');

const responder = async (req, res, datos, nombreArchivo) => {
  if (req.query.formato === 'csv') {
    if (!(await tienePermiso(req.usuario.rol, 'reportes.exportar'))) {
      const error = new Error('No tienes permisos para realizar esta acción.');
      error.status = 403;
      throw error;
    }
    const filas = datos.map((d) => (d.toJSON ? d.toJSON() : d));
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}.csv"`);
    return res.send(aCSV(filas));
  }
  return exito(res, { datos });
};

const ventasPorPeriodo = async (req, res) => {
  const datos = await reporteService.ventasPorPeriodo(req.query);
  return responder(req, res, datos, 'ventas_por_periodo');
};

const pedidosPorPeriodo = async (req, res) => {
  const datos = await reporteService.pedidosPorPeriodo(req.query);
  return responder(req, res, datos, 'pedidos_por_periodo');
};

const ventasPorVendedor = async (req, res) => {
  const datos = await reporteService.ventasPorVendedor(req.query);
  return responder(req, res, datos, 'ventas_por_vendedor');
};

const productosMasVendidos = async (req, res) => {
  const datos = await reporteService.productosMasVendidos(req.query);
  return responder(req, res, datos, 'productos_mas_vendidos');
};

const estadoInventario = async (req, res) => {
  const datos = await reporteService.estadoInventario();
  return responder(req, res, datos, 'estado_inventario');
};

const stockBajo = async (req, res) => {
  const datos = await reporteService.stockBajo();
  return responder(req, res, datos, 'stock_bajo');
};

const clientesPorZona = async (req, res) => {
  const datos = await reporteService.clientesPorZona();
  return responder(req, res, datos, 'clientes_por_zona');
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
