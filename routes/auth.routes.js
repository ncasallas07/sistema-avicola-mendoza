const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate');
const { loginSchema } = require('../validators/auth.validator');
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

router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.post('/logout', verificarToken, authController.logout);
router.get('/me', verificarToken, authController.me);

module.exports = router;
