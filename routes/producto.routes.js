const express = require('express');
const router = express.Router();

const productoController = require('../controllers/producto.controller');
const validate = require('../middlewares/validate');
const {
  crearProductoSchema,
  editarProductoSchema,
  cambiarEstadoSchema
} = require('../validators/producto.validator');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

router.use(verificarToken);

router.get('/', verificarRol('Admin', 'Vendedor'), productoController.listar);
router.get('/:id', verificarRol('Admin', 'Vendedor'), productoController.obtener);
// Crear, editar y activar/desactivar productos es exclusivo del Administrador.
router.post('/', verificarRol('Admin'), validate(crearProductoSchema), productoController.crear);
router.put('/:id', verificarRol('Admin'), validate(editarProductoSchema), productoController.editar);
router.patch(
  '/:id/estado',
  verificarRol('Admin'),
  validate(cambiarEstadoSchema),
  productoController.cambiarEstado
);

module.exports = router;
