const { Permiso } = require('../models');
const { exito } = require('../utils/response');

const listar = async (req, res) => {
  const permisos = await Permiso.findAll({
    where: { estado: 'activo' },
    order: [['modulo', 'ASC'], ['codigo', 'ASC']]
  });
  exito(res, { datos: permisos });
};

module.exports = { listar };
