const authService = require('../services/auth.service');
const passwordResetService = require('../services/passwordReset.service');
const { exito } = require('../utils/response');
const { obtenerPermisosDeRol } = require('../services/autorizacion.service');

const MENSAJE_RECUPERACION_GENERICO =
  'Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.';

const login = async (req, res) => {
  const resultado = await authService.login(req.body);
  exito(res, { mensaje: 'Login exitoso', datos: resultado });
};

const logout = async (req, res) => {
  exito(res, { mensaje: 'Sesión cerrada' });
};

// Permite al frontend refrescar sus permisos (p. ej. tras recargar la
// página) sin tener que volver a iniciar sesión.
const me = async (req, res) => {
  const permisos = Array.from(await obtenerPermisosDeRol(req.usuario.rol));
  exito(res, { datos: { ...req.usuario, permisos } });
};

// Respuesta idéntica exista o no el correo, y exista o no un error al enviar
// el email: lo contrario permitiría enumerar usuarios registrados.
const solicitarRecuperacion = async (req, res) => {
  await passwordResetService.solicitarRecuperacion(req.body.email);
  exito(res, { mensaje: MENSAJE_RECUPERACION_GENERICO });
};

const restablecerPassword = async (req, res) => {
  await passwordResetService.restablecerPassword(req.body.token, req.body.password);
  exito(res, { mensaje: 'Contraseña restablecida correctamente. Ya puedes iniciar sesión.' });
};

module.exports = { login, logout, me, solicitarRecuperacion, restablecerPassword };
