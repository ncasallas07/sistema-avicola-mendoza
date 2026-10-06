const express = require('express');
const router = express.Router();

const reporteController = require('../controllers/reporte.controller');
const { verificarToken, autorizar } = require('../middlewares/authMiddleware');

// Todas las rutas de reportes requieren reportes.ver; si además se pide
// ?formato=csv, reporte.controller exige adicionalmente reportes.exportar.
router.use(verificarToken, autorizar('reportes.ver'));

router.get('/ventas', reporteController.ventasPorPeriodo);
router.get('/pedidos', reporteController.pedidosPorPeriodo);
router.get('/ventas-por-vendedor', reporteController.ventasPorVendedor);
router.get('/productos-mas-vendidos', reporteController.productosMasVendidos);
router.get('/inventario', reporteController.estadoInventario);
router.get('/stock-bajo', reporteController.stockBajo);
router.get('/clientes-por-zona', reporteController.clientesPorZona);

module.exports = router;
