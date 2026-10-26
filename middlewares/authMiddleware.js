const jwt = require('jsonwebtoken');
const { obtenerPermisosDeRol } = require('../services/autorizacion.service');
const { Usuario } = require('../models');

const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // formato: "Bearer <token>"

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token no proporcionado', data: null });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, payload) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Token inválido o expirado', data: null });
    }
    try {
      // Un token deja de ser válido de inmediato, sin esperar a que expire, si el
      // usuario fue eliminado (eliminación lógica) o si restableció su contraseña
      // después de emitirse el token (version_sesion distinta).
      const usuario = await Usuario.findByPk(payload.id, { attributes: ['id', 'estado', 'version_sesion'] });
      if (!usuario || usuario.estado === 'eliminado' || (payload.ver ?? 0) !== usuario.version_sesion) {
        return res.status(401).json({ success: false, message: 'La sesión ya no es válida', data: null });
      }
      req.usuario = payload; // { id, rol, nombre }
      next();
    } catch (error) {
      next(error);
    }
  });
};

// Mantenido por compatibilidad; ninguna ruta lo usa desde que el dashboard pasó
// a autorizarse por permisos (dashboard.ver). Para todas las rutas se usa
// autorizar(), que valida contra la tabla de permisos en vez de una lista de
// nombres de rol fija en el código.
const verificarRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
      return res
        .status(403)
        .json({ success: false, message: 'No tienes permiso para esta acción', data: null });
    }
    next();
  };
};

// Middleware de autorización dinámica: exige que el rol del usuario
// autenticado (consultado en la base, no en el JWT) tenga TODOS los códigos
// de permiso indicados. Así, retirarle un permiso a un rol bloquea de
// inmediato a los usuarios que lo tengan, sin esperar a que expire su token.
const autorizar = (...codigosPermiso) => {
  return async (req, res, next) => {
    try {
      if (!req.usuario) {
        return res.status(401).json({ success: false, message: 'Token no proporcionado', data: null });
      }

      const permisosDelRol = await obtenerPermisosDeRol(req.usuario.rol);
      const autorizado = codigosPermiso.every((codigo) => permisosDelRol.has(codigo));

      if (!autorizado) {
        return res
          .status(403)
          .json({ success: false, message: 'No tienes permisos para realizar esta acción.', data: null });
      }

      req.permisos = permisosDelRol;
      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = { verificarToken, verificarRol, autorizar };
