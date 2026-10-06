const express = require('express');
const router = express.Router();

const categoriaController = require('../controllers/categoria.controller');
const validate = require('../middlewares/validate');
const { crearCategoriaSchema } = require('../validators/categoria.validator');
const { verificarToken, autorizar } = require('../middlewares/authMiddleware');

router.use(verificarToken);

router.get('/', autorizar('categorias.ver'), categoriaController.listar);
router.post('/', autorizar('categorias.crear'), validate(crearCategoriaSchema), categoriaController.crear);

module.exports = router;
