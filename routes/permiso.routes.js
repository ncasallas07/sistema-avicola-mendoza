const express = require('express');
const router = express.Router();

const permisoController = require('../controllers/permiso.controller');
const { verificarToken, autorizar } = require('../middlewares/authMiddleware');

// El catálogo de permisos solo lo necesita quien gestiona roles.
router.get('/', verificarToken, autorizar('roles.ver'), permisoController.listar);

module.exports = router;
