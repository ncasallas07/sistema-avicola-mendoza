const express = require('express');
const router = express.Router();

const inventarioController = require('../controllers/inventario.controller');
const validate = require('../middlewares/validate');
const { movimientoSchema } = require('../validators/inventario.validator');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

router.use(verificarToken);

router.get('/', verificarRol('Admin', 'Vendedor'), inventarioController.listarExistencias);
router.get('/movimientos', verificarRol('Admin', 'Vendedor'), inventarioController.listarMovimientos);
// Los ajustes manuales de inventario (compras, ajustes) son exclusivos del Administrador.
router.post(
  '/entrada',
  verificarRol('Admin'),
  validate(movimientoSchema),
  inventarioController.registrarEntrada
);
router.post(
  '/salida',
  verificarRol('Admin'),
  validate(movimientoSchema),
  inventarioController.registrarSalida
);

module.exports = router;
