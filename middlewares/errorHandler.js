const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({
    success: false,
    message: status >= 500 ? 'Error en el servidor' : err.message,
    data: null
  });
};

module.exports = errorHandler;
