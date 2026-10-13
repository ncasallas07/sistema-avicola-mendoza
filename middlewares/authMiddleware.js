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
      // Un token emitido antes de que el usuario fuera eliminado (eliminación
      // lógica) deja de ser válido de inmediato, sin esperar a que expire.
      const usuario = await Usuario.findByPk(payload.id, { attributes: ['id', 'estado'] });
      if (!usuario || usuario.estado === 'eliminado') {
        return res.status(401).json({ success: false, message: 'La sesión ya no es válida', data: null });
      }
      req.usuario = payload; // { id, rol, nombre }
      next();
    } catch (error) {
      next(error);
    }
  });
};

// Mantenido por compatibilidad (lo sigue usando la ruta de dashboard, que no
// corresponde a un permiso de módulo concreto). Para el resto de rutas se usa
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
