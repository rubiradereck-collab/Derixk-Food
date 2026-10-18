// ============================================================================
// CONTROLADOR DE PLATOS
// Archivo: src/controllers/platos.controller.js
// ============================================================================
const db = require('../config/db');

// GET /api/platos (con soporte de filtros por categoría y búsqueda)
const getPlatos = async (req, res) => {
  const { categoria, q, disponible } = req.query;

  try {
    let query = `
      SELECT 
        p.id_plato,
        p.nombre,
        p.descripcion,
        p.precio,
        p.imagen,
        p.stock,
        p.disponible,
        p.id_categoria,
        c.nombre AS categoria
      FROM platos p
      INNER JOIN categorias c ON p.id_categoria = c.id_categoria
      WHERE 1=1
    `;
    const params = [];

    if (categoria) {
      params.push(categoria);
      query += ` AND p.id_categoria = $${params.length}`;
    }

    if (disponible !== undefined) {
      params.push(disponible === 'true');
      query += ` AND p.disponible = $${params.length}`;
    }

    if (q) {
      params.push(`%${q}%`);
      query += ` AND (p.nombre ILIKE $${params.length} OR p.descripcion ILIKE $${params.length})`;
    }

    query += ` ORDER BY p.id_plato ASC`;

    const result = await db.query(query, params);
    res.status(200).json({
      ok: true,
      total: result.rowCount,
      platos: result.rows,
    });
  } catch (error) {
    console.error('Error en getPlatos:', error);
    res.status(500).json({
      ok: false,
      mensaje: 'Error al obtener la lista de platos.',
      error: error.message,
    });
  }
};

// GET /api/platos/:id
const getPlatoById = async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      SELECT 
        p.id_plato,
        p.nombre,
        p.descripcion,
        p.precio,
        p.imagen,
        p.stock,
        p.disponible,
        p.id_categoria,
        c.nombre AS categoria
      FROM platos p
      INNER JOIN categorias c ON p.id_categoria = c.id_categoria
      WHERE p.id_plato = $1
    `;
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: `No se encontró ningún plato con ID ${id}.`,
      });
    }

    res.status(200).json({
      ok: true,
      plato: result.rows[0],
    });
  } catch (error) {
    console.error('Error en getPlatoById:', error);
    res.status(500).json({
      ok: false,
      mensaje: 'Error al consultar el plato solicitado.',
      error: error.message,
    });
  }
};

// POST /api/platos (Solo administrador)
const createPlato = async (req, res) => {
  const { nombre, descripcion, precio, imagen, stock, disponible, id_categoria } = req.body;

  if (!nombre || precio === undefined || !id_categoria) {
    return res.status(400).json({
      ok: false,
      mensaje: 'El nombre, precio y categoría son campos obligatorios.',
    });
  }

  if (Number(precio) <= 0) {
    return res.status(400).json({
      ok: false,
      mensaje: 'El precio del plato debe ser mayor a 0.',
    });
  }

  try {
    const query = `
      INSERT INTO platos (nombre, descripcion, precio, imagen, stock, disponible, id_categoria)
      VALUES ($1, $2, $3, COALESCE($4, 'assets/img/platos/default.png'), COALESCE($5, 0), COALESCE($6, TRUE), $7)
      RETURNING *
    `;
    const values = [
      nombre.trim(),
      descripcion || '',
      parseFloat(precio),
      imagen || null,
      parseInt(stock, 10) || 0,
      disponible !== undefined ? disponible : true,
      parseInt(id_categoria, 10),
    ];

    const result = await db.query(query, values);
    res.status(201).json({
      ok: true,
      mensaje: 'Plato registrado exitosamente.',
      plato: result.rows[0],
    });
  } catch (error) {
    console.error('Error en createPlato:', error);
    if (error.code === '23505') {
      return res.status(400).json({
        ok: false,
        mensaje: `Ya existe un plato registrado con el nombre "${nombre}".`,
      });
    }
    res.status(500).json({
      ok: false,
      mensaje: 'Error al registrar el nuevo plato.',
      error: error.message,
    });
  }
};

// PUT /api/platos/:id (Solo administrador - El trigger audita si el precio cambia)
const updatePlato = async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio, imagen, stock, disponible, id_categoria } = req.body;

  try {
    const query = `
      UPDATE platos 
      SET 
        nombre = COALESCE($1, nombre),
        descripcion = COALESCE($2, descripcion),
        precio = COALESCE($3, precio),
        imagen = COALESCE($4, imagen),
        stock = COALESCE($5, stock),
        disponible = COALESCE($6, disponible),
        id_categoria = COALESCE($7, id_categoria)
      WHERE id_plato = $8
      RETURNING *
    `;
    const values = [
      nombre ? nombre.trim() : null,
      descripcion !== undefined ? descripcion : null,
      precio !== undefined ? parseFloat(precio) : null,
      imagen || null,
      stock !== undefined ? parseInt(stock, 10) : null,
      disponible !== undefined ? disponible : null,
      id_categoria ? parseInt(id_categoria, 10) : null,
      id,
    ];

    // En transacción para que trg_auditar_precio registre al administrador real
    const result = await db.withTransaction(req.usuario, (client) => client.query(query, values));

    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: `No se encontró el plato con ID ${id} para actualizar.`,
      });
    }

    res.status(200).json({
      ok: true,
      mensaje: 'Plato actualizado correctamente.',
      plato: result.rows[0],
    });
  } catch (error) {
    console.error('Error en updatePlato:', error);
    res.status(500).json({
      ok: false,
      mensaje: 'Error al actualizar el plato.',
      error: error.message,
    });
  }
};

// DELETE /api/platos/:id (Solo administrador)
const deletePlato = async (req, res) => {
  const { id } = req.params;

  try {
    // Si ya tiene pedidos históricos asociados, no lo borramos físicamente para no quebrar FK, sino que se deshabilita
    const checkDetalle = await db.query('SELECT 1 FROM detalle_pedido WHERE id_plato = $1 LIMIT 1', [id]);
    
    if (checkDetalle.rowCount > 0) {
      await db.query('UPDATE platos SET disponible = FALSE, stock = 0 WHERE id_plato = $1', [id]);
      return res.status(200).json({
        ok: true,
        mensaje: 'El plato tiene ventas históricas asociadas; fue deshabilitado del catálogo para mantener integridad referencial.',
      });
    }

    const result = await db.query('DELETE FROM platos WHERE id_plato = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: `No se encontró ningún plato con ID ${id}.`,
      });
    }

    res.status(200).json({
      ok: true,
      mensaje: 'Plato eliminado definitivamente del catálogo.',
      plato: result.rows[0],
    });
  } catch (error) {
    console.error('Error en deletePlato:', error);
    res.status(500).json({
      ok: false,
      mensaje: 'Error al eliminar el plato.',
      error: error.message,
    });
  }
};

module.exports = {
  getPlatos,
  getPlatoById,
  createPlato,
  updatePlato,
  deletePlato,
};
