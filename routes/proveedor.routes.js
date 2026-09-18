const express = require('express');
const router = express.Router();

const proveedorController = require('../controllers/proveedor.controller');
const validate = require('../middlewares/validate');
const {
  crearProveedorSchema,
  editarProveedorSchema,
  cambiarEstadoSchema
} = require('../validators/proveedor.validator');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

// Gestión de proveedores: exclusiva del Administrador (el Vendedor no la necesita).
router.use(verificarToken, verificarRol('Admin'));

router.get('/', proveedorController.listar);
router.get('/:id', proveedorController.obtener);
router.post('/', validate(crearProveedorSchema), proveedorController.crear);
router.put('/:id', validate(editarProveedorSchema), proveedorController.editar);
router.patch('/:id/estado', validate(cambiarEstadoSchema), proveedorController.cambiarEstado);

module.exports = router;
