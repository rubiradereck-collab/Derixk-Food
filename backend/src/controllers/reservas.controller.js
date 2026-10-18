// ============================================================================
// CONTROLADOR DE RESERVAS
// Archivo: src/controllers/reservas.controller.js
// ============================================================================
const db = require('../config/db');

const getReservas = async (req, res) => {
  try {
    const query = `
      SELECT 
        r.id_reserva,
        r.fecha_hora,
        TO_CHAR(r.fecha_hora, 'YYYY-MM-DD HH24:MI') AS fecha_formateada,
        r.num_personas,
        r.estado,
        r.id_mesa,
        m.numero AS numero_mesa,
        m.capacidad AS capacidad_mesa,
        r.id_cliente,
        c.nombre AS nombre_cliente,
        c.cedula AS cedula_cliente,
        c.telefono AS telefono_cliente
      FROM reservas r
      INNER JOIN mesas m ON r.id_mesa = m.id_mesa
      INNER JOIN clientes c ON r.id_cliente = c.id_cliente
      ORDER BY r.fecha_hora DESC
    `;
    const result = await db.query(query);

    res.status(200).json({
      ok: true,
      total: result.rowCount,
      reservas: result.rows,
    });
  } catch (error) {
    console.error('Error en getReservas:', error);
    res.status(500).json({
      ok: false,
      mensaje: 'Error al consultar las reservas.',
      error: error.message,
    });
  }
};

const createReserva = async (req, res) => {
  const { id_cliente, id_mesa, fecha_hora, num_personas, nombre, cedula, telefono, email } = req.body;

  let clienteId = id_cliente;

  try {
    // Si envían datos de un cliente nuevo sin id_cliente registrado:
    if (!clienteId && cedula && nombre) {
      const clienteExistente = await db.query('SELECT id_cliente FROM clientes WHERE cedula = $1', [cedula]);
      if (clienteExistente.rowCount > 0) {
        clienteId = clienteExistente.rows[0].id_cliente;
      } else {
        const nuevoCliente = await db.query(
          'INSERT INTO clientes (nombre, cedula, telefono, email) VALUES ($1, $2, $3, $4) RETURNING id_cliente',
          [nombre.trim(), cedula.trim(), telefono || null, email || null]
        );
        clienteId = nuevoCliente.rows[0].id_cliente;
      }
    }

    if (!clienteId || !id_mesa || !fecha_hora || !num_personas) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Todos los campos de la reserva (cliente, mesa, fecha_hora y num_personas) son obligatorios.',
      });
    }

    // La inserción activa el trigger trg_validar_reserva en PostgreSQL (evita solapamientos en +/- 2h)
    const query = `
      INSERT INTO reservas (id_cliente, id_mesa, fecha_hora, num_personas, estado)
      VALUES ($1, $2, $3, $4, 'confirmada')
      RETURNING *
    `;
    const result = await db.query(query, [clienteId, id_mesa, fecha_hora, parseInt(num_personas, 10)]);

    res.status(201).json({
      ok: true,
      mensaje: 'Reserva agendada y confirmada con éxito.',
      reserva: result.rows[0],
    });
  } catch (error) {
    console.error('Error en createReserva:', error);
    // Captura explícita del RAISE EXCEPTION del trigger de PostgreSQL
    if (error.message && error.message.includes('Conflicto de horario')) {
      return res.status(400).json({
        ok: false,
        mensaje: error.message,
      });
    }
    res.status(500).json({
      ok: false,
      mensaje: 'Error al registrar la reserva.',
      error: error.message,
    });
  }
};

const deleteReserva = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      "UPDATE reservas SET estado = 'cancelada' WHERE id_reserva = $1 RETURNING *",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: `No se encontró la reserva con ID ${id}.`,
      });
    }

    res.status(200).json({
      ok: true,
      mensaje: 'Reserva cancelada correctamente.',
      reserva: result.rows[0],
    });
  } catch (error) {
    console.error('Error en deleteReserva:', error);
    res.status(500).json({
      ok: false,
      mensaje: 'Error al cancelar la reserva.',
      error: error.message,
    });
  }
};

module.exports = {
  getReservas,
  createReserva,
  deleteReserva,
};
