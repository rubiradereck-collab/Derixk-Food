// ============================================================================
// RUTAS DE PLATOS
// Archivo: src/routes/platos.routes.js
// ============================================================================
const express = require('express');
const router = express.Router();
const platosController = require('../controllers/platos.controller');
const { verifyToken } = require('../middlewares/auth');
const { checkRole } = require('../middlewares/role');

// Rutas de lectura (públicas para que el catálogo de la SPA sea accesible)
router.get('/', platosController.getPlatos);
router.get('/:id', platosController.getPlatoById);

// Rutas de mutación (protegidas por token y restringidas al Administrador)
router.post('/', verifyToken, checkRole('administrador'), platosController.createPlato);
router.put('/:id', verifyToken, checkRole('administrador'), platosController.updatePlato);
router.delete('/:id', verifyToken, checkRole('administrador'), platosController.deletePlato);

module.exports = router;
