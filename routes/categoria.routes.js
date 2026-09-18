const express = require('express');
const router = express.Router();

const categoriaController = require('../controllers/categoria.controller');
const validate = require('../middlewares/validate');
const { crearCategoriaSchema } = require('../validators/categoria.validator');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

router.use(verificarToken);

router.get('/', verificarRol('Admin', 'Vendedor'), categoriaController.listar);
router.post('/', verificarRol('Admin'), validate(crearCategoriaSchema), categoriaController.crear);

module.exports = router;
