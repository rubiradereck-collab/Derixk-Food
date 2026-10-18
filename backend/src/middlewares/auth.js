// ============================================================================
// MIDDLEWARE DE AUTENTICACIÓN JWT
// Archivo: src/middlewares/auth.js
// ============================================================================
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      ok: false,
      mensaje: 'Acceso no autorizado: No se proporcionó un token de sesión válido.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'clave_secreta_utmach_restaurante_2026');
    req.usuario = decoded; // { id_usuario, nombre, email, rol }
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        ok: false,
        mensaje: 'La sesión ha expirado. Por favor, inicie sesión nuevamente.',
      });
    }
    return res.status(403).json({
      ok: false,
      mensaje: 'Token de autenticación inválido.',
    });
  }
};

module.exports = { verifyToken };
