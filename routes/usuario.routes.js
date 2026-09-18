const express = require('express');
const router = express.Router();

const usuarioController = require('../controllers/usuario.controller');
const validate = require('../middlewares/validate');
const {
  crearUsuarioSchema,
  editarUsuarioSchema,
  cambiarEstadoSchema
} = require('../validators/usuario.validator');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

// Gestión de usuarios: exclusiva del Administrador.
router.use(verificarToken, verificarRol('Admin'));

router.get('/', usuarioController.listar);
router.post('/', validate(crearUsuarioSchema), usuarioController.crear);
router.put('/:id', validate(editarUsuarioSchema), usuarioController.editar);
router.patch('/:id/estado', validate(cambiarEstadoSchema), usuarioController.cambiarEstado);

module.exports = router;
