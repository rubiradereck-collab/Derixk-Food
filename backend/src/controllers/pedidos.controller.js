// ============================================================================
// CONTROLADOR DE PEDIDOS Y COMANDAS
// Archivo: src/controllers/pedidos.controller.js
// Demuestra el uso de transacciones ACID y procedimientos almacenados de PostgreSQL
// ============================================================================
const db = require('../config/db');
const { HttpError } = require('../middlewares/errores');

// GET /api/pedidos (Listado general de pedidos con estado y totales)
const getPedidos = async (req, res) => {
  const { estado, mesa } = req.query;

  try {
    let query = `
      SELECT 
        p.id_pedido,
        p.fecha_hora,
        TO_CHAR(p.fecha_hora, 'YYYY-MM-DD HH24:MI:SS') AS fecha_formateada,
        p.estado,
        p.total,
        p.id_mesa,
        m.numero AS numero_mesa,
        p.id_cliente,
        c.nombre AS nombre_cliente,
        c.cedula AS cedula_cliente,
        p.id_usuario,
        u.nombre AS mesero_responsable,
        (SELECT COUNT(*)::INT FROM detalle_pedido dp WHERE dp.id_pedido = p.id_pedido) AS total_items
      FROM pedidos p
      INNER JOIN mesas m ON p.id_mesa = m.id_mesa
      INNER JOIN clientes c ON p.id_cliente = c.id_cliente
      INNER JOIN usuarios u ON p.id_usuario = u.id_usuario
      WHERE 1=1
    `;
    const params = [];

    if (estado) {
      params.push(estado);
      query += ` AND p.estado = $${params.length}`;
    }

    if (mesa) {
      params.push(parseInt(mesa, 10));
      query += ` AND m.numero = $${params.length}`;
    }

    query += ` ORDER BY p.fecha_hora DESC`;

    const result = await db.query(query, params);
    res.status(200).json({
      ok: true,
      total: result.rowCount,
      pedidos: result.rows,
    });
  } catch (error) {
    console.error('Error en getPedidos:', error);
    res.status(500).json({
      ok: false,
      mensaje: 'Error al consultar las comandas.',
      error: error.message,
    });
  }
};

// GET /api/pedidos/:id (Detalle completo de un pedido con sus líneas de platos)
const getPedidoById = async (req, res) => {
  const { id } = req.params;

  try {
    const pedidoQuery = `
      SELECT 
        p.id_pedido,
        p.fecha_hora,
        TO_CHAR(p.fecha_hora, 'YYYY-MM-DD HH24:MI:SS') AS fecha_formateada,
        p.estado,
        p.total,
        p.id_mesa,
        m.numero AS numero_mesa,
        m.capacidad AS capacidad_mesa,
        p.id_cliente,
        c.nombre AS nombre_cliente,
        c.cedula AS cedula_cliente,
        c.telefono AS telefono_cliente,
        p.id_usuario,
        u.nombre AS mesero_responsable
      FROM pedidos p
      INNER JOIN mesas m ON p.id_mesa = m.id_mesa
      INNER JOIN clientes c ON p.id_cliente = c.id_cliente
      INNER JOIN usuarios u ON p.id_usuario = u.id_usuario
      WHERE p.id_pedido = $1
    `;
    const pedidoResult = await db.query(pedidoQuery, [id]);

    if (pedidoResult.rowCount === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: `No se encontró el pedido #${id}.`,
      });
    }

    // Consulta de las líneas de detalle asociadas
    const detalleQuery = `
      SELECT 
        dp.id_detalle,
        dp.id_plato,
        p.nombre AS nombre_plato,
        p.imagen AS imagen_plato,
        dp.cantidad,
        dp.precio_unitario,
        dp.subtotal
      FROM detalle_pedido dp
      INNER JOIN platos p ON dp.id_plato = p.id_plato
      WHERE dp.id_pedido = $1
      ORDER BY dp.id_detalle ASC
    `;
    const detalleResult = await db.query(detalleQuery, [id]);

    res.status(200).json({
      ok: true,
      pedido: {
        ...pedidoResult.rows[0],
        detalles: detalleResult.rows,
      },
    });
  } catch (error) {
    console.error('Error en getPedidoById:', error);
    res.status(500).json({
      ok: false,
      mensaje: 'Error al consultar el detalle de la comanda.',
      error: error.message,
    });
  }
};

// POST /api/pedidos — Transacción ACID que reutiliza sp_registrar_pedido
const createPedido = async (req, res) => {
  const { id_mesa, id_cliente = 1, items } = req.body;

  if (!Number.isInteger(id_mesa) || !Array.isArray(items) || items.length === 0) {
    throw new HttpError(400, 'Debe especificar la mesa y al menos un plato en la orden.');
  }

  // Validar y agrupar ítems repetidos (evita violar uk_pedido_plato)
  const cantidades = new Map();
  for (const { id_plato, cantidad } of items) {
    if (!Number.isInteger(id_plato) || !Number.isInteger(cantidad) || cantidad <= 0) {
      throw new HttpError(400, 'Cada plato necesita un ID válido y una cantidad entera mayor a cero.');
    }
    cantidades.set(id_plato, (cantidades.get(id_plato) || 0) + cantidad);
  }

  const pedido = await db.withTransaction(req.usuario, async (client) => {
    // 1. El SP bloquea la lógica de negocio: mesa existente y no ocupada
    const { rows } = await client.query('CALL sp_registrar_pedido($1, $2, $3, NULL)', [
      id_cliente,
      id_mesa,
      req.usuario.id_usuario, // siempre del token, nunca un valor por defecto
    ]);
    const idPedido = rows[0].p_id_pedido_creado;

    // 2. Detalles: trg_descontar_stock fija precio, subtotal y descuenta stock (con FOR UPDATE)
    for (const [idPlato, cantidad] of cantidades) {
      await client.query(
        'INSERT INTO detalle_pedido (id_pedido, id_plato, cantidad) VALUES ($1, $2, $3)',
        [idPedido, idPlato, cantidad]
      );
    }

    // 3. Total calculado en la BD, no en JavaScript
    const total = await client.query(
      `UPDATE pedidos
       SET total = (SELECT SUM(subtotal) FROM detalle_pedido WHERE id_pedido = $1)
       WHERE id_pedido = $1
       RETURNING id_pedido, total`,
      [idPedido]
    );
    return total.rows[0];
  });

  res.status(201).json({
    ok: true,
    mensaje: `Pedido #${pedido.id_pedido} enviado a cocina · Mesa ${id_mesa} · Total $${pedido.total.toFixed(2)}`,
    id_pedido: pedido.id_pedido,
    total: pedido.total,
  });
};

// Máquina de estados: transición permitida -> roles que pueden ejecutarla
const TRANSICIONES = {
  pendiente: { en_cocina: ['cocina', 'administrador'], cancelado: ['mesero', 'administrador'] },
  en_cocina: { listo: ['cocina', 'administrador'] },
  listo: { servido: ['mesero', 'administrador'] },
  servido: { pagado: ['mesero', 'administrador'] },
};

// PUT /api/pedidos/:id/estado
const updateEstadoPedido = async (req, res) => {
  const id = Number(req.params.id);
  const { estado: nuevo } = req.body;
  if (!Number.isInteger(id)) throw new HttpError(400, 'ID de pedido inválido.');

  await db.withTransaction(req.usuario, async (client) => {
    const actual = await client.query(
      'SELECT estado FROM pedidos WHERE id_pedido = $1 FOR UPDATE',
      [id]
    );
    if (actual.rowCount === 0) throw new HttpError(404, `No se encontró el pedido #${id}.`);

    const estadoActual = actual.rows[0].estado;
    const rolesPermitidos = TRANSICIONES[estadoActual]?.[nuevo];
    if (!rolesPermitidos) {
      throw new HttpError(409, `No se puede pasar de "${estadoActual}" a "${nuevo}".`);
    }
    if (!rolesPermitidos.includes(req.usuario.rol)) {
      throw new HttpError(403, `El rol "${req.usuario.rol}" no puede marcar un pedido como "${nuevo}".`);
    }

    if (nuevo === 'pagado') {
      await client.query('CALL sp_cerrar_pedido($1)', [id]);
    } else if (nuevo === 'cancelado') {
      await client.query('CALL sp_cancelar_pedido($1)', [id]); // devuelve stock y libera mesa
    } else {
      await client.query('UPDATE pedidos SET estado = $1 WHERE id_pedido = $2', [nuevo, id]);
    }
  });

  res.status(200).json({ ok: true, mensaje: `Pedido #${id} actualizado a "${nuevo}".` });
};

module.exports = {
  getPedidos,
  getPedidoById,
  createPedido,
  updateEstadoPedido,
};
