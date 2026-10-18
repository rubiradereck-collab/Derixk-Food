// ============================================================================
// RUTAS DE PEDIDOS / COMANDAS (todas requieren sesión)
// Archivo: src/routes/pedidos.routes.js
// ============================================================================
const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidos.controller');
const { verifyToken } = require('../middlewares/auth');
const { checkRole } = require('../middlewares/role');
const { asyncHandler } = require('../middlewares/errores');

router.use(verifyToken); // << ninguna ruta de pedidos es pública

router.get('/', checkRole('administrador', 'mesero', 'cocina'), pedidosController.getPedidos);
router.get('/:id', checkRole('administrador', 'mesero', 'cocina'), pedidosController.getPedidoById);
router.post('/', checkRole('administrador', 'mesero'), asyncHandler(pedidosController.createPedido));
// El rol exacto se valida por transición dentro del controlador
router.put('/:id/estado', asyncHandler(pedidosController.updateEstadoPedido));

module.exports = router;
