const express = require('express');
const router = express.Router();

const usuarioController = require('../controllers/usuario.controller');
const validate = require('../middlewares/validate');
const {
  crearUsuarioSchema,
  editarUsuarioSchema,
  cambiarEstadoSchema
} = require('../validators/usuario.validator');
const { verificarToken, autorizar } = require('../middlewares/authMiddleware');

router.use(verificarToken);

router.get('/', autorizar('usuarios.ver'), usuarioController.listar);
router.post('/', autorizar('usuarios.crear'), validate(crearUsuarioSchema), usuarioController.crear);
router.put('/:id', autorizar('usuarios.editar'), validate(editarUsuarioSchema), usuarioController.editar);
router.patch(
  '/:id/estado',
  autorizar('usuarios.eliminar'),
  validate(cambiarEstadoSchema),
  usuarioController.cambiarEstado
);

module.exports = router;
