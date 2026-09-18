const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboard.controller');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

// El contenido que se devuelve difiere según el rol (ver dashboard.service);
// la ruta es una sola, ambos roles pueden llamarla.
router.get('/', verificarToken, verificarRol('Admin', 'Vendedor'), dashboardController.obtener);

module.exports = router;
