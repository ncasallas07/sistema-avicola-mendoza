const express = require('express');
const router = express.Router();

const productoController = require('../controllers/producto.controller');
const validate = require('../middlewares/validate');
const {
  crearProductoSchema,
  editarProductoSchema,
  cambiarEstadoSchema
} = require('../validators/producto.validator');
const { verificarToken, autorizar } = require('../middlewares/authMiddleware');

router.use(verificarToken);

router.get('/', autorizar('productos.ver'), productoController.listar);
router.get('/:id', autorizar('productos.ver'), productoController.obtener);
router.post('/', autorizar('productos.crear'), validate(crearProductoSchema), productoController.crear);
router.put('/:id', autorizar('productos.editar'), validate(editarProductoSchema), productoController.editar);
router.patch(
  '/:id/estado',
  autorizar('productos.eliminar'),
  validate(cambiarEstadoSchema),
  productoController.cambiarEstado
);

module.exports = router;
