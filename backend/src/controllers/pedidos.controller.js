// ============================================================================
// CONTROLADOR DE PEDIDOS Y COMANDAS
// Archivo: src/controllers/pedidos.controller.js
// Demuestra el uso de transacciones ACID y procedimientos almacenados de PostgreSQL
// ============================================================================
const db = require('../config/db');

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

// POST /api/pedidos (TRANSACCIÓN ATÓMICA CON CLIENTE DEL POOL)
// Ejecuta BEGIN -> Inserción cabecera -> Inserción detalles (Triggers descuentan stock) -> COMMIT / ROLLBACK
const createPedido = async (req, res) => {
  const { id_cliente, id_mesa, items } = req.body;
  const id_usuario = (req.usuario && req.usuario.id_usuario) ? req.usuario.id_usuario : 1; // Extraído del token JWT o Milton Valarezo por defecto

  if (!id_mesa || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      ok: false,
      mensaje: 'Debe especificar la mesa y al menos un plato en la orden.',
    });
  }

  // Si no especifican cliente, se asigna por defecto el id_cliente 1 ("Consumidor Final")
  const clienteFinalId = id_cliente || 1;

  // Obtenemos un cliente dedicado del pool para controlar la transacción
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN'); // << INICIO DE TRANSACCIÓN ATÓMICA (ACID)

    // 1. Validar estado de la mesa con bloqueo pesimista
    const mesaQuery = 'SELECT estado FROM mesas WHERE id_mesa = $1 FOR UPDATE';
    const mesaResult = await client.query(mesaQuery, [id_mesa]);

    if (mesaResult.rowCount === 0) {
      throw new Error(`La mesa #${id_mesa} no existe.`);
    }

    // 2. Insertar cabecera del pedido
    const insertPedidoQuery = `
      INSERT INTO pedidos (id_cliente, id_mesa, id_usuario, fecha_hora, estado, total)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, 'pendiente', 0.00)
      RETURNING id_pedido
    `;
    const pedidoCreado = await client.query(insertPedidoQuery, [clienteFinalId, id_mesa, id_usuario]);
    const idPedido = pedidoCreado.rows[0].id_pedido;

    // 3. Cambiar estado de la mesa a 'ocupada'
    await client.query("UPDATE mesas SET estado = 'ocupada' WHERE id_mesa = $1", [id_mesa]);

    let totalAcumulado = 0;

    // 4. Insertar cada línea de detalle
    // Nota: El trigger 'trg_descontar_stock' en PostgreSQL validará stock y restará unidades
    for (const item of items) {
      const { id_plato, cantidad } = item;
      if (!id_plato || !cantidad || cantidad <= 0) {
        throw new Error('Todos los platos del pedido deben tener un ID válido y cantidad mayor a cero.');
      }

      // Consultar precio unitario del catálogo
      const platoRes = await client.query('SELECT precio FROM platos WHERE id_plato = $1', [id_plato]);
      if (platoRes.rowCount === 0) {
        throw new Error(`El plato con ID ${id_plato} no existe.`);
      }
      const precioUnitario = parseFloat(platoRes.rows[0].precio);
      const subtotal = precioUnitario * parseInt(cantidad, 10);
      totalAcumulado += subtotal;

      const insertDetalleQuery = `
        INSERT INTO detalle_pedido (id_pedido, id_plato, cantidad, precio_unitario, subtotal)
        VALUES ($1, $2, $3, $4, $5)
      `;
      await client.query(insertDetalleQuery, [idPedido, id_plato, parseInt(cantidad, 10), precioUnitario, subtotal]);
    }

    // 5. Actualizar el total definitivo en la cabecera del pedido
    await client.query('UPDATE pedidos SET total = $1 WHERE id_pedido = $2', [totalAcumulado, idPedido]);

    await client.query('COMMIT'); // << CONFIRMACIÓN DEFINITIVA DE LA TRANSACCIÓN

    res.status(201).json({
      ok: true,
      mensaje: `Pedido #${idPedido} registrado con éxito bajo transacción atómica.`,
      id_pedido: idPedido,
      total: totalAcumulado,
    });
  } catch (error) {
    await client.query('ROLLBACK'); // << REVERSIÓN EN CASO DE CUALQUIER FALLA
    console.error('Rollback ejecutado en createPedido:', error.message);

    // Si el error provino del RAISE EXCEPTION del trigger de stock:
    const status = error.message.includes('Stock insuficiente') ? 400 : 500;
    res.status(status).json({
      ok: false,
      mensaje: error.message || 'Error al procesar el pedido. Se aplicó ROLLBACK en la base de datos.',
    });
  } finally {
    client.release(); // Liberar el cliente de regreso al pool
  }
};

// PUT /api/pedidos/:id/estado (Actualizar estado: pendiente -> en_cocina -> listo -> servido -> pagado)
const updateEstadoPedido = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  const estadosValidos = ['pendiente', 'en_cocina', 'listo', 'servido', 'pagado', 'cancelado'];

  if (!estado || !estadosValidos.includes(estado)) {
    return res.status(400).json({
      ok: false,
      mensaje: `Estado inválido. Debe ser uno de: [${estadosValidos.join(', ')}].`,
    });
  }

  try {
    // Si el nuevo estado es 'pagado', ejecutamos el Procedimiento Almacenado de PostgreSQL sp_cerrar_pedido
    if (estado === 'pagado') {
      await db.query('CALL sp_cerrar_pedido($1)', [id]);
      return res.status(200).json({
        ok: true,
        mensaje: `Pedido #${id} pagado y cerrado exitosamente mediante procedimiento almacenado. Mesa liberada.`,
      });
    }

    // Para cualquier otro cambio de fase:
    const result = await db.query(
      'UPDATE pedidos SET estado = $1 WHERE id_pedido = $2 RETURNING *',
      [estado, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: `No se encontró el pedido #${id}.`,
      });
    }

    // Si el pedido se canceló, liberamos la mesa
    if (estado === 'cancelado') {
      await db.query('UPDATE mesas SET estado = \'libre\' WHERE id_mesa = $1', [result.rows[0].id_mesa]);
    }

    res.status(200).json({
      ok: true,
      mensaje: `Estado del pedido #${id} actualizado a "${estado}".`,
      pedido: result.rows[0],
    });
  } catch (error) {
    console.error('Error en updateEstadoPedido:', error);
    res.status(500).json({
      ok: false,
      mensaje: error.message || 'Error al actualizar el estado de la comanda.',
    });
  }
};

module.exports = {
  getPedidos,
  getPedidoById,
  createPedido,
  updateEstadoPedido,
};
