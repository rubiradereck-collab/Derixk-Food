// ============================================================================
// MANEJO CENTRALIZADO DE ERRORES HTTP Y POSTGRESQL
// Archivo: src/middlewares/errores.js
// ============================================================================

class HttpError extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
  }
}

// Envuelve un controlador async para que cualquier error llegue automáticamente a next(err)
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Traduce códigos SQLSTATE de PostgreSQL a respuestas HTTP comprensibles para el usuario
const ERRORES_PG = {
  P0001: [400, null], // RAISE EXCEPTION de nuestros triggers/SP: el mensaje ya es legible
  '22P02': [400, 'Formato de dato inválido (se esperaba un número).'],
  23505: [409, 'El registro ya existe en el sistema.'],
  23503: [409, 'El registro está relacionado con otros datos y no puede eliminarse.'],
  23514: [400, 'El valor no cumple las reglas del negocio.'],
  '23P01': [409, 'Conflicto de horario: la mesa ya tiene una reserva en esa franja de 2 horas.'],
};

// Middleware global de captura de errores
// eslint-disable-next-line no-unused-vars
const manejadorErrores = (err, req, res, next) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ ok: false, mensaje: err.message });
  }

  const pg = ERRORES_PG[err.code];
  if (pg) {
    const [status, mensaje] = pg;
    return res.status(status).json({ ok: false, mensaje: mensaje || err.message });
  }

  console.error(`[Error en ${req.method} ${req.originalUrl}]:`, err);
  res.status(500).json({ ok: false, mensaje: err.message || 'Error interno del servidor.' });
};

module.exports = { HttpError, asyncHandler, manejadorErrores };
