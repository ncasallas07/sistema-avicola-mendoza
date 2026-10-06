const express = require('express');
const router = express.Router();

const inventarioController = require('../controllers/inventario.controller');
const validate = require('../middlewares/validate');
const { movimientoSchema } = require('../validators/inventario.validator');
const { verificarToken, autorizar } = require('../middlewares/authMiddleware');

router.use(verificarToken);

router.get('/', autorizar('inventario.ver'), inventarioController.listarExistencias);
router.get('/movimientos', autorizar('inventario.ver'), inventarioController.listarMovimientos);
router.post(
  '/entrada',
  autorizar('inventario.registrar_movimiento'),
  validate(movimientoSchema),
  inventarioController.registrarEntrada
);
router.post(
  '/salida',
  autorizar('inventario.registrar_movimiento'),
  validate(movimientoSchema),
  inventarioController.registrarSalida
);

module.exports = router;
