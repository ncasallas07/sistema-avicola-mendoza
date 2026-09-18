const express = require('express');
const router = express.Router();

const clienteController = require('../controllers/cliente.controller');
const validate = require('../middlewares/validate');
const {
  crearClienteSchema,
  editarClienteSchema,
  cambiarEstadoSchema
} = require('../validators/cliente.validator');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

router.use(verificarToken);

router.get('/', verificarRol('Admin', 'Vendedor'), clienteController.listar);
router.get('/:id', verificarRol('Admin', 'Vendedor'), clienteController.obtener);
router.post('/', verificarRol('Admin', 'Vendedor'), validate(crearClienteSchema), clienteController.crear);
router.put('/:id', verificarRol('Admin', 'Vendedor'), validate(editarClienteSchema), clienteController.editar);
// Activar/desactivar un cliente es una acción administrativa sensible.
router.patch(
  '/:id/estado',
  verificarRol('Admin'),
  validate(cambiarEstadoSchema),
  clienteController.cambiarEstado
);

module.exports = router;
