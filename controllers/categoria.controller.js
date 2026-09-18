const categoriaService = require('../services/categoria.service');
const { exito } = require('../utils/response');

const listar = async (req, res) => {
  const categorias = await categoriaService.listar();
  exito(res, { datos: categorias });
};

const crear = async (req, res) => {
  const categoria = await categoriaService.crear(req.body);
  exito(res, { mensaje: 'Categoría creada correctamente', datos: categoria, status: 201 });
};

module.exports = { listar, crear };
