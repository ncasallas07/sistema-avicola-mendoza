const express = require('express');
const router = express.Router();

const pedidoController = require('../controllers/pedido.controller');
const validate = require('../middlewares/validate');
const { crearPedidoSchema, cambiarEstadoSchema } = require('../validators/pedido.validator');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

router.use(verificarToken, verificarRol('Admin', 'Vendedor'));

// El alcance por rol (Vendedor ve solo lo suyo, Admin ve todo) se aplica
// dentro de pedido.service, no aquí: la ruta es la misma para ambos roles,
// pero el filtrado/autorización de fila depende del pedido consultado.
router.get('/', pedidoController.listar);
router.get('/:id', pedidoController.obtener);
router.get('/:id/comprobante', pedidoController.comprobante);
router.post('/', validate(crearPedidoSchema), pedidoController.crear);
router.patch('/:id/estado', validate(cambiarEstadoSchema), pedidoController.cambiarEstado);

module.exports = router;
