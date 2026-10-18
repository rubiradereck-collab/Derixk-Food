// ============================================================================
// CONTROLADOR DE CATEGORÍAS
// Archivo: src/controllers/categorias.controller.js
// ============================================================================
const db = require('../config/db');

const getCategorias = async (req, res) => {
  try {
    const query = `
      SELECT 
        c.id_categoria, 
        c.nombre, 
        COUNT(p.id_plato)::INT AS total_platos
      FROM categorias c
      LEFT JOIN platos p ON c.id_categoria = p.id_categoria
      GROUP BY c.id_categoria, c.nombre
      ORDER BY c.nombre ASC
    `;
    const result = await db.query(query);

    res.status(200).json({
      ok: true,
      total: result.rowCount,
      categorias: result.rows,
    });
  } catch (error) {
    console.error('Error en getCategorias:', error);
    res.status(500).json({
      ok: false,
      mensaje: 'Error al consultar las categorías.',
      error: error.message,
    });
  }
};

const createCategoria = async (req, res) => {
  const { nombre } = req.body;

  if (!nombre || nombre.trim().length === 0) {
    return res.status(400).json({
      ok: false,
      mensaje: 'El nombre de la categoría es requerido.',
    });
  }

  try {
    const query = 'INSERT INTO categorias (nombre) VALUES ($1) RETURNING *';
    const result = await db.query(query, [nombre.trim()]);

    res.status(201).json({
      ok: true,
      mensaje: 'Categoría creada con éxito.',
      categoria: result.rows[0],
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({
        ok: false,
        mensaje: `La categoría "${nombre}" ya existe en el sistema.`,
      });
    }
    res.status(500).json({
      ok: false,
      mensaje: 'Error al crear la categoría.',
      error: error.message,
    });
  }
};

module.exports = {
  getCategorias,
  createCategoria,
};
