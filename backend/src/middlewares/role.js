// ============================================================================
// MIDDLEWARE DE CONTROL DE ACCESO BASADO EN ROLES (RBAC)
// Archivo: src/middlewares/role.js
// ============================================================================

/**
 * Middleware para validar que el usuario autenticado posea alguno de los roles permitidos.
 * @param  {...string} rolesPermitidos - Lista de nombres de roles ('administrador', 'mesero', 'cocina')
 */
const checkRole = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        ok: false,
        mensaje: 'Usuario no autenticado.',
      });
    }

    const { rol } = req.usuario;

    if (!rolesPermitidos.includes(rol)) {
      return res.status(403).json({
        ok: false,
        mensaje: `Acceso denegado: El rol '${rol}' no cuenta con permisos suficientes para esta acción. Roles requeridos: [${rolesPermitidos.join(', ')}].`,
      });
    }

    next();
  };
};

module.exports = { checkRole };
