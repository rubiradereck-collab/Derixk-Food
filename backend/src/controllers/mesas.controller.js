// ============================================================================
// CONTROLADOR DE MESAS
// Archivo: src/controllers/mesas.controller.js
// ============================================================================
const db = require('../config/db');

const getMesas = async (req, res) => {
  try {
    const query = `
      SELECT 
        m.id_mesa,
        m.numero,
        m.capacidad,
        m.estado,
        (
          SELECT ped.id_pedido 
          FROM pedidos ped 
          WHERE ped.id_mesa = m.id_mesa AND ped.estado NOT IN ('pagado', 'cancelado') 
          ORDER BY ped.fecha_hora DESC LIMIT 1
        ) AS id_pedido_activo
      FROM mesas m
      ORDER BY m.numero ASC
    `;
    const result = await db.query(query);

    res.status(200).json({
      ok: true,
      total: result.rowCount,
      mesas: result.rows,
    });
  } catch (error) {
    console.error('Error en getMesas:', error);
    res.status(500).json({
      ok: false,
      mensaje: 'Error al consultar las mesas.',
      error: error.message,
    });
  }
};

const createMesa = async (req, res) => {
  const { numero, capacidad } = req.body;

  if (!numero || !capacidad) {
    return res.status(400).json({
      ok: false,
      mensaje: 'El número y la capacidad de la mesa son requeridos.',
    });
  }

  try {
    const query = `
      INSERT INTO mesas (numero, capacidad, estado)
      VALUES ($1, $2, 'libre')
      RETURNING *
    `;
    const result = await db.query(query, [parseInt(numero, 10), parseInt(capacidad, 10)]);

    res.status(201).json({
      ok: true,
      mensaje: 'Mesa registrada correctamente.',
      mesa: result.rows[0],
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({
        ok: false,
        mensaje: `La mesa número ${numero} ya existe.`,
      });
    }
    res.status(500).json({
      ok: false,
      mensaje: 'Error al registrar la mesa.',
      error: error.message,
    });
  }
};

const updateMesa = async (req, res) => {
  const { id } = req.params;
  const { estado, capacidad } = req.body;

  try {
    const query = `
      UPDATE mesas
      SET 
        estado = COALESCE($1, estado),
        capacidad = COALESCE($2, capacidad)
      WHERE id_mesa = $3
      RETURNING *
    `;
    const result = await db.query(query, [estado || null, capacidad || null, id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: `No se encontró la mesa con ID ${id}.`,
      });
    }

    res.status(200).json({
      ok: true,
      mensaje: 'Mesa actualizada correctamente.',
      mesa: result.rows[0],
    });
  } catch (error) {
    console.error('Error en updateMesa:', error);
    res.status(500).json({
      ok: false,
      mensaje: 'Error al actualizar la mesa.',
      error: error.message,
    });
  }
};

module.exports = {
  getMesas,
  createMesa,
  updateMesa,
};
