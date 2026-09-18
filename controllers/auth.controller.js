const authService = require('../services/auth.service');
const { exito } = require('../utils/response');

const login = async (req, res) => {
  const resultado = await authService.login(req.body);
  exito(res, { mensaje: 'Login exitoso', datos: resultado });
};

const logout = async (req, res) => {
  exito(res, { mensaje: 'Sesión cerrada' });
};

const me = async (req, res) => {
  exito(res, { datos: req.usuario });
};

module.exports = { login, logout, me };
