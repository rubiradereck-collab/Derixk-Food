// ============================================================================
// RUTAS DE CATEGORÍAS
// Archivo: src/routes/categorias.routes.js
// ============================================================================
const express = require('express');
const router = express.Router();
const categoriasController = require('../controllers/categorias.controller');
const { verifyToken } = require('../middlewares/auth');
const { checkRole } = require('../middlewares/role');

router.get('/', categoriasController.getCategorias);
router.post('/', verifyToken, checkRole('administrador'), categoriasController.createCategoria);

module.exports = router;
