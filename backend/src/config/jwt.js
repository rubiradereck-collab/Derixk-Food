// ============================================================================
// CONFIGURACIÓN JWT
// Archivo: src/config/jwt.js
// ============================================================================
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'clave_secreta_utmach_restaurante_2026_segura_jwt';

if (!JWT_SECRET || JWT_SECRET.length < 16) {
  console.warn('⚠️ Se recomienda definir un JWT_SECRET robusto en backend/.env');
}

module.exports = {
  JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',
};
