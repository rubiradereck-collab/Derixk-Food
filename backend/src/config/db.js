// ============================================================================
// CONEXIÓN A POSTGRESQL + HELPER TRANSACCIONAL ACID
// Archivo: src/config/db.js
// ============================================================================
const { Pool, types } = require('pg');
require('dotenv').config();

// NUMERIC (OID 1700) llega como string ("4.50") en node-pg; lo convertimos a number
types.setTypeParser(1700, parseFloat);

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'restaurante_db',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Error imprevisto en el pool de PostgreSQL:', err.message);
});

/**
 * Ejecuta fn(client) dentro de una transacción BEGIN/COMMIT controlada.
 * Ante cualquier error ejecuta ROLLBACK, libera la conexión (descartándola si quedó rota)
 * y relanza el error.
 * Si se pasa usuario autenticado, publica su correo en 'app.usuario' para los triggers de auditoría.
 */
async function withTransaction(usuario, fn) {
  // Soporte si se llama como withTransaction(fn)
  if (typeof usuario === 'function') {
    fn = usuario;
    usuario = null;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (usuario && usuario.email) {
      await client.query("SELECT set_config('app.usuario', $1, true)", [usuario.email]);
    }
    const resultado = await fn(client);
    await client.query('COMMIT');
    client.release();
    return resultado;
  } catch (err) {
    await client.query('ROLLBACK').then(
      () => client.release(),
      (rollbackErr) => client.release(rollbackErr)
    );
    throw err;
  }
}

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  withTransaction,
};
