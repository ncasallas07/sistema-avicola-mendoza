const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate');
const { loginSchema, solicitarRecuperacionSchema, restablecerPasswordSchema } = require('../validators/auth.validator');
const { verificarToken } = require('../middlewares/authMiddleware');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  // Misma forma de respuesta {success, message, data} que usa el resto de la
  // API (utils/response.js y middlewares/errorHandler.js), para que el
  // interceptor de Axios del frontend pueda leer error.response.data.message.
  message: { success: false, message: 'Demasiados intentos de inicio de sesión, intenta más tarde', data: null }
});

// Mismo patrón que loginLimiter. Límite algo más bajo que el de login porque
// cada solicitud exitosa dispara un correo real: sin este límite, alguien
// podría usar el formulario para bombardear la bandeja de entrada de un
// usuario o intentar enumerar correos registrados a fuerza bruta.
const recuperacionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiadas solicitudes de recuperación, intenta más tarde',
    data: null
  }
});

const restablecerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Demasiados intentos, intenta más tarde', data: null }
});

router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.post('/logout', verificarToken, authController.logout);
router.get('/me', verificarToken, authController.me);

// Público a propósito (sin verificarToken): un usuario que olvidó su
// contraseña, por definición, no tiene una sesión válida. No depende de
// roles ni permisos — cualquiera puede recuperar SU PROPIA cuenta por correo.
router.post(
  '/forgot-password',
  recuperacionLimiter,
  validate(solicitarRecuperacionSchema),
  authController.solicitarRecuperacion
);
router.post(
  '/reset-password',
  restablecerLimiter,
  validate(restablecerPasswordSchema),
  authController.restablecerPassword
);

module.exports = router;
