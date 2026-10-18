// ============================================================================
// RUTAS DE RESERVAS
// Archivo: src/routes/reservas.routes.js
// ============================================================================
const express = require('express');
const router = express.Router();
const reservasController = require('../controllers/reservas.controller');
const { verifyToken } = require('../middlewares/auth');

router.get('/', verifyToken, reservasController.getReservas);
router.post('/', reservasController.createReserva); // Permite reserva pública o por mesero
router.delete('/:id', verifyToken, reservasController.deleteReserva);

module.exports = router;
