// ============================================================================
// RUTAS DE REPORTES GERENCIALES (solo administrador)
// Archivo: src/routes/reportes.routes.js
// ============================================================================
const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportes.controller');
const { verifyToken } = require('../middlewares/auth');
const { checkRole } = require('../middlewares/role');

router.use(verifyToken, checkRole('administrador'));

router.get('/ventas-mensuales', reportesController.getVentasMensuales);
router.get('/platos-top', reportesController.getPlatosTop);

module.exports = router;
