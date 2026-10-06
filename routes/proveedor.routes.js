const express = require('express');
const router = express.Router();

const proveedorController = require('../controllers/proveedor.controller');
const validate = require('../middlewares/validate');
const {
  crearProveedorSchema,
  editarProveedorSchema,
  cambiarEstadoSchema
} = require('../validators/proveedor.validator');
const { verificarToken, autorizar } = require('../middlewares/authMiddleware');

router.use(verificarToken);

router.get('/', autorizar('proveedores.ver'), proveedorController.listar);
router.get('/:id', autorizar('proveedores.ver'), proveedorController.obtener);
router.post('/', autorizar('proveedores.crear'), validate(crearProveedorSchema), proveedorController.crear);
router.put('/:id', autorizar('proveedores.editar'), validate(editarProveedorSchema), proveedorController.editar);
router.patch(
  '/:id/estado',
  autorizar('proveedores.eliminar'),
  validate(cambiarEstadoSchema),
  proveedorController.cambiarEstado
);

module.exports = router;
