const express = require('express');
const router = express.Router();

const rolController = require('../controllers/rol.controller');
const validate = require('../middlewares/validate');
const {
  crearRolSchema,
  editarRolSchema,
  cambiarEstadoSchema,
  asignarPermisosSchema
} = require('../validators/rol.validator');
const { verificarToken, autorizar } = require('../middlewares/authMiddleware');

router.use(verificarToken);

router.get('/', autorizar('roles.ver'), rolController.listar);
router.get('/:id', autorizar('roles.ver'), rolController.obtener);
router.post('/', autorizar('roles.crear'), validate(crearRolSchema), rolController.crear);
router.put('/:id', autorizar('roles.editar'), validate(editarRolSchema), rolController.editar);
router.patch(
  '/:id/estado',
  autorizar('roles.eliminar'),
  validate(cambiarEstadoSchema),
  rolController.cambiarEstado
);
router.delete('/:id', autorizar('roles.eliminar'), rolController.eliminar);

router.get('/:id/permisos', autorizar('roles.ver'), rolController.obtenerPermisos);
router.put(
  '/:id/permisos',
  autorizar('roles.asignar_permisos'),
  validate(asignarPermisosSchema),
  rolController.asignarPermisos
);

module.exports = router;
