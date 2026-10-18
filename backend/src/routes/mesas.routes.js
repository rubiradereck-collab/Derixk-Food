// ============================================================================
// RUTAS DE MESAS
// Archivo: src/routes/mesas.routes.js
// ============================================================================
const express = require('express');
const router = express.Router();
const mesasController = require('../controllers/mesas.controller');
const { verifyToken } = require('../middlewares/auth');
const { checkRole } = require('../middlewares/role');

router.get('/', mesasController.getMesas);
router.post('/', verifyToken, checkRole('administrador'), mesasController.createMesa);
router.put('/:id', verifyToken, checkRole('administrador', 'mesero'), mesasController.updateMesa);

module.exports = router;
