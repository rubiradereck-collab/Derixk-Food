// ============================================================================
// RUTAS DE AUTENTICACIÓN
// Archivo: src/routes/auth.routes.js
// ============================================================================
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middlewares/auth');

router.post('/login', authController.login);
router.get('/perfil', verifyToken, authController.getPerfil);

module.exports = router;
