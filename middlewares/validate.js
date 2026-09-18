const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Datos inválidos',
      data: { errores: error.details.map((detalle) => detalle.message) }
    });
  }

  req.body = value;
  next();
};

module.exports = validate;
