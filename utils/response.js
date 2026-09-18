const exito = (res, { mensaje = 'Operación exitosa', datos = null, status = 200 } = {}) => {
  return res.status(status).json({ success: true, message: mensaje, data: datos });
};

module.exports = { exito };
