const express = require('express');
const router = express.Router();

const pedidoController = require('../controllers/pedido.controller');
const validate = require('../middlewares/validate');
const { crearPedidoSchema, cambiarEstadoSchema } = require('../validators/pedido.validator');
const { verificarToken, autorizar } = require('../middlewares/authMiddleware');

router.use(verificarToken);

// El alcance por rol (Vendedor ve solo lo suyo, Admin ve todo) se aplica
// dentro de pedido.service, no aquí: la ruta es la misma para ambos roles,
// pero el filtrado/autorización de fila depende del pedido consultado.
router.get('/', autorizar('pedidos.ver'), pedidoController.listar);
router.get('/:id', autorizar('pedidos.ver'), pedidoController.obtener);
router.get('/:id/comprobante', autorizar('pedidos.ver'), pedidoController.comprobante);
router.post('/', autorizar('pedidos.crear'), validate(crearPedidoSchema), pedidoController.crear);
// El permiso exacto (pedidos.editar o pedidos.cancelar) depende del estado
// destino que se pida, así que se valida dentro del controller.
router.patch('/:id/estado', validate(cambiarEstadoSchema), pedidoController.cambiarEstado);

module.exports = router;
