const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // formato: "Bearer <token>"

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token no proporcionado', data: null });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Token inválido o expirado', data: null });
    }
    req.usuario = payload; // { id, rol, nombre }
    next();
  });
};

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

module.exports = { verificarToken, verificarRol };
