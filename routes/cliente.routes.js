const express = require('express');
const router = express.Router();

const clienteController = require('../controllers/cliente.controller');
const validate = require('../middlewares/validate');
const {
  crearClienteSchema,
  editarClienteSchema,
  cambiarEstadoSchema
} = require('../validators/cliente.validator');
const { verificarToken, autorizar } = require('../middlewares/authMiddleware');

router.use(verificarToken);

router.get('/', autorizar('clientes.ver'), clienteController.listar);
router.get('/:id', autorizar('clientes.ver'), clienteController.obtener);
router.post('/', autorizar('clientes.crear'), validate(crearClienteSchema), clienteController.crear);
router.put('/:id', autorizar('clientes.editar'), validate(editarClienteSchema), clienteController.editar);
router.patch(
  '/:id/estado',
  autorizar('clientes.eliminar'),
  validate(cambiarEstadoSchema),
  clienteController.cambiarEstado
);

module.exports = router;
