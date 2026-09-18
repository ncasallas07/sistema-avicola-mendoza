const express = require('express');
const router = express.Router();

const reporteController = require('../controllers/reporte.controller');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

router.use(verificarToken, verificarRol('Admin'));

router.get('/ventas', reporteController.ventasPorPeriodo);
router.get('/pedidos', reporteController.pedidosPorPeriodo);
router.get('/ventas-por-vendedor', reporteController.ventasPorVendedor);
router.get('/productos-mas-vendidos', reporteController.productosMasVendidos);
router.get('/inventario', reporteController.estadoInventario);
router.get('/stock-bajo', reporteController.stockBajo);
router.get('/clientes-por-zona', reporteController.clientesPorZona);

module.exports = router;
