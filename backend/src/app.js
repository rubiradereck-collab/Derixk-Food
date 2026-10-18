// ============================================================================
// CONFIGURACIÓN DE LA APLICACIÓN EXPRESS
// Archivo: src/app.js
// ============================================================================
const express = require('express');
const cors = require('cors');

// Importación de rutas
const authRoutes = require('./routes/auth.routes');
const platosRoutes = require('./routes/platos.routes');
const categoriasRoutes = require('./routes/categorias.routes');
const mesasRoutes = require('./routes/mesas.routes');
const reservasRoutes = require('./routes/reservas.routes');
const pedidosRoutes = require('./routes/pedidos.routes');
const reportesRoutes = require('./routes/reportes.routes');

const app = express();

// Middlewares globales
app.use(cors()); // Habilita peticiones CORS desde el frontend Angular (http://localhost:4200)
app.use(express.json()); // Parser de JSON en cuerpos de peticiones
app.use(express.urlencoded({ extended: true }));

// Endpoint base de verificación de estado (Health check)
app.get('/', (req, res) => {
  res.status(200).json({
    ok: true,
    sistema: 'API REST - Derixk Food (Gestión de Restaurante)',
    institucion: 'Universidad Técnica de Machala (UTMACH)',
    periodo: '2026-2',
    estado: 'Servidor en línea y conectado a PostgreSQL',
    version: '1.0.0',
  });
});

// Montaje de rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/platos', platosRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/mesas', mesasRoutes);
app.use('/api/reservas', reservasRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/reportes', reportesRoutes);

// Manejador de rutas no encontradas (404)
app.use((req, res, next) => {
  res.status(404).json({
    ok: false,
    mensaje: `La ruta solicitada [${req.method}] ${req.originalUrl} no existe en este servidor.`,
  });
});

const { manejadorErrores } = require('./middlewares/errores');

// Manejador global de excepciones (500 y PostgreSQL)
app.use(manejadorErrores);

module.exports = app;
