// ============================================================================
// CONTROLADOR DE AUTENTICACIÓN
// Archivo: src/controllers/auth.controller.js
// ============================================================================
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      ok: false,
      mensaje: 'El correo electrónico y la contraseña son requeridos.',
    });
  }

  try {
    const query = `
      SELECT u.id_usuario, u.nombre, u.email, u.password_hash, u.activo, r.nombre AS rol
      FROM usuarios u
      INNER JOIN roles r ON u.id_rol = r.id_rol
      WHERE u.email = $1
    `;
    const result = await db.query(query, [email.toLowerCase().trim()]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        ok: false,
        mensaje: 'Credenciales inválidas: correo o contraseña incorrectos.',
      });
    }

    const usuario = result.rows[0];

    if (!usuario.activo) {
      return res.status(403).json({
        ok: false,
        mensaje: 'La cuenta se encuentra inactiva. Contacte al administrador.',
      });
    }

    // Verificar contraseña con bcrypt
    const passwordValida = bcrypt.compareSync(password, usuario.password_hash);
    if (!passwordValida) {
      return res.status(401).json({
        ok: false,
        mensaje: 'Credenciales inválidas: correo o contraseña incorrectos.',
      });
    }

    // Generar token JWT con payload seguro
    const payload = {
      id_usuario: usuario.id_usuario,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'clave_secreta_utmach_restaurante_2026', {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    });

    res.status(200).json({
      ok: true,
      mensaje: `Bienvenido al sistema, ${usuario.nombre}.`,
      token,
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    console.error('Error en auth.login:', error);
    res.status(500).json({
      ok: false,
      mensaje: 'Error interno en el servidor al intentar iniciar sesión.',
      error: error.message,
    });
  }
};

const getPerfil = async (req, res) => {
  res.status(200).json({
    ok: true,
    usuario: req.usuario,
  });
};

module.exports = {
  login,
  getPerfil,
};
