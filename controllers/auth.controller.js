const authService = require('../services/auth.service');
const { exito } = require('../utils/response');
const { obtenerPermisosDeRol } = require('../services/autorizacion.service');

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

module.exports = { login, logout, me };
