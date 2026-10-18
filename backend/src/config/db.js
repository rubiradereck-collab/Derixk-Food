// ============================================================================
// CONEXIÓN A BASE DE DATOS POSTGRESQL CON POOL DE CONEXIONES
// Archivo: src/config/db.js
// ============================================================================
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'restaurante_db',
  max: 20, // Máximo 20 clientes concurrentes en el pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Evento de confirmación de conexión
pool.on('connect', () => {
  // Conexión activa en el pool
});

pool.on('error', (err) => {
  console.error('Error imprevisto en el pool de PostgreSQL:', err.message);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
