// ============================================================================
// CONTROLADOR DE REPORTES Y ANALÍTICA
// Archivo: src/controllers/reportes.controller.js
// Consume directamente las Vistas creadas en PostgreSQL (v_ventas_por_mes y v_platos_mas_vendidos)
// ============================================================================
const db = require('../config/db');

// GET /api/reportes/ventas-mensuales
const getVentasMensuales = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM v_ventas_por_mes');
    res.status(200).json({
      ok: true,
      total_periodos: result.rowCount,
      ventas: result.rows,
    });
  } catch (error) {
    console.error('Error en getVentasMensuales:', error);
    res.status(500).json({
      ok: false,
      mensaje: 'Error al consultar el consolidado mensual de ventas.',
      error: error.message,
    });
  }
};

// GET /api/reportes/platos-top
const getPlatosTop = async (req, res) => {
  const limite = parseInt(req.query.limite, 10) || 10;

  try {
    const result = await db.query('SELECT * FROM v_platos_mas_vendidos LIMIT $1', [limite]);
    res.status(200).json({
      ok: true,
      limite,
      total: result.rowCount,
      platos: result.rows,
    });
  } catch (error) {
    console.error('Error en getPlatosTop:', error);
    res.status(500).json({
      ok: false,
      mensaje: 'Error al consultar el ranking de platos más vendidos.',
      error: error.message,
    });
  }
};

module.exports = {
  getVentasMensuales,
  getPlatosTop,
};
