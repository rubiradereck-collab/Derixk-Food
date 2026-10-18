// ============================================================================
// RUTAS DE PEDIDOS / COMANDAS
// Archivo: src/routes/pedidos.routes.js
// ============================================================================
const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidos.controller');
const { verifyToken } = require('../middlewares/auth');
const { checkRole } = require('../middlewares/role');

// Consultas del monitor de cocina y comandas
router.get('/', pedidosController.getPedidos);
router.get('/:id', pedidosController.getPedidoById);
router.post('/', pedidosController.createPedido);
router.put('/:id/estado', pedidosController.updateEstadoPedido);

module.exports = router;
