const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboard.controller');
const { verificarToken, autorizar } = require('../middlewares/authMiddleware');

// Acceso por permisos, como el resto del sistema: dashboard.ver permite ver los
// indicadores propios y dashboard.ver_global, los generales (ver dashboard.service).
// Así, un rol creado por el administrador también puede tener su dashboard.
router.get('/', verificarToken, autorizar('dashboard.ver'), dashboardController.obtener);

module.exports = router;
