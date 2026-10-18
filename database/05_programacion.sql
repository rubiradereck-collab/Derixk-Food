-- ============================================================================
-- PROYECTO INTEGRADOR: SISTEMA DE GESTIÓN DE RESTAURANTE
-- MATERIAS: Tecnologías Web & Administración de Bases de Datos (5to Nivel - UTMACH)
-- ARCHIVO: 05_programacion.sql
-- DESCRIPCIÓN: Procedimientos almacenados, triggers y funciones de disparo con casos de prueba.
-- ============================================================================

-- ============================================================================
-- SECCIÓN 1: PROCEDIMIENTOS ALMACENADOS (STORED PROCEDURES)
-- ============================================================================

-- PROCEDIMIENTO 1: sp_registrar_pedido
-- Propósito: Apertura controlada de una comanda, validando y cambiando el estado de la mesa a 'ocupada'.
CREATE OR REPLACE PROCEDURE sp_registrar_pedido(
    IN p_id_cliente INT,
    IN p_id_mesa INT,
    IN p_id_usuario INT,
    OUT p_id_pedido_creado INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_estado_mesa VARCHAR(20);
BEGIN
    -- 1. Verificar si la mesa existe y obtener su estado actual
    SELECT estado INTO v_estado_mesa 
    FROM mesas 
    WHERE id_mesa = p_id_mesa;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'La mesa con ID % no existe en el sistema.', p_id_mesa;
    END IF;

    -- 2. Validar que la mesa no esté actualmente ocupada
    IF v_estado_mesa = 'ocupada' THEN
        RAISE EXCEPTION 'La mesa % ya se encuentra ocupada.', p_id_mesa;
    END IF;

    -- 3. Crear la cabecera del pedido
    INSERT INTO pedidos (id_cliente, id_mesa, id_usuario, fecha_hora, estado, total)
    VALUES (p_id_cliente, p_id_mesa, p_id_usuario, CURRENT_TIMESTAMP, 'pendiente', 0.00)
    RETURNING id_pedido INTO p_id_pedido_creado;

    -- 4. Actualizar el estado de la mesa a 'ocupada'
    UPDATE mesas 
    SET estado = 'ocupada' 
    WHERE id_mesa = p_id_mesa;

    RAISE NOTICE 'Pedido #% registrado con éxito en la mesa #%.', p_id_pedido_creado, p_id_mesa;
END;
$$;


-- PROCEDIMIENTO 2: sp_cerrar_pedido
-- Propósito: Cierre de cuenta, recálculo exacto del total desde los detalles y liberación de la mesa.
CREATE OR REPLACE PROCEDURE sp_cerrar_pedido(
    IN p_id_pedido INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_id_mesa INT;
    v_total_recalculado NUMERIC(10,2);
    v_estado_actual VARCHAR(20);
BEGIN
    -- 1. Obtener datos del pedido
    SELECT id_mesa, estado INTO v_id_mesa, v_estado_actual 
    FROM pedidos 
    WHERE id_pedido = p_id_pedido;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'El pedido #% no existe.', p_id_pedido;
    END IF;

    IF v_estado_actual = 'pagado' THEN
        RAISE EXCEPTION 'El pedido #% ya fue pagado y cerrado previamente.', p_id_pedido;
    END IF;

    -- 2. Recalcular el total exacto desde la tabla detalle_pedido
    SELECT COALESCE(SUM(subtotal), 0.00) 
    INTO v_total_recalculado
    FROM detalle_pedido
    WHERE id_pedido = p_id_pedido;

    -- 3. Marcar el pedido como pagado y actualizar su monto definitivo
    UPDATE pedidos
    SET estado = 'pagado',
        total = v_total_recalculado
    WHERE id_pedido = p_id_pedido;

    -- 4. Liberar la mesa correspondiente
    UPDATE mesas
    SET estado = 'libre'
    WHERE id_mesa = v_id_mesa;

    RAISE NOTICE 'Pedido #% cerrado exitosamente. Total cobrado: $%. Mesa #% liberada.', 
                 p_id_pedido, v_total_recalculado, v_id_mesa;
END;
$$;


-- ============================================================================
-- SECCIÓN 2: TRIGGERS Y FUNCIONES DE DISPARO (TRIGGER FUNCTIONS)
-- ============================================================================

-- TRIGGER 1: trg_descontar_stock
-- Evento: BEFORE INSERT ON detalle_pedido
-- Propósito: Validar disponibilidad de stock, calcular subtotal y restar unidades al plato.
CREATE OR REPLACE FUNCTION fn_descontar_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_stock_actual INT;
    v_precio_catalogo NUMERIC(8,2);
    v_nombre_plato VARCHAR(100);
BEGIN
    -- 1. Consultar información del plato solicitado
    SELECT stock, precio, nombre 
    INTO v_stock_actual, v_precio_catalogo, v_nombre_plato
    FROM platos 
    WHERE id_plato = NEW.id_plato;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'El plato con ID % no existe.', NEW.id_plato;
    END IF;

    -- 2. Validar si existe suficiente stock
    IF v_stock_actual < NEW.cantidad THEN
        RAISE EXCEPTION 'Stock insuficiente para "%". Disponible: %, Solicitado: %', 
                        v_nombre_plato, v_stock_actual, NEW.cantidad;
    END IF;

    -- 3. Asignar precio unitario del catálogo y computar subtotal
    NEW.precio_unitario := COALESCE(NEW.precio_unitario, v_precio_catalogo);
    NEW.subtotal := NEW.cantidad * NEW.precio_unitario;

    -- 4. Descontar las porciones consumidas del stock del plato
    UPDATE platos 
    SET stock = stock - NEW.cantidad,
        disponible = CASE WHEN (stock - NEW.cantidad) = 0 THEN FALSE ELSE TRUE END
    WHERE id_plato = NEW.id_plato;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_descontar_stock ON detalle_pedido;
CREATE TRIGGER trg_descontar_stock
BEFORE INSERT ON detalle_pedido
FOR EACH ROW
EXECUTE FUNCTION fn_descontar_stock();


-- TRIGGER 2: trg_auditar_precio
-- Evento: AFTER UPDATE OF precio ON platos
-- Propósito: Registrar de forma inmutable quién cambió el precio y cuándo.
CREATE OR REPLACE FUNCTION fn_auditar_precio()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.precio <> NEW.precio THEN
        INSERT INTO auditoria_precios (
            id_plato,
            precio_anterior,
            precio_nuevo,
            fecha_cambio,
            usuario_responsable
        ) VALUES (
            OLD.id_plato,
            OLD.precio,
            NEW.precio,
            CURRENT_TIMESTAMP,
            CURRENT_USER
        );
        RAISE NOTICE 'Auditoría registrada: Plato % cambió de $% a $%', OLD.id_plato, OLD.precio, NEW.precio;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auditar_precio ON platos;
CREATE TRIGGER trg_auditar_precio
AFTER UPDATE OF precio ON platos
FOR EACH ROW
EXECUTE FUNCTION fn_auditar_precio();


-- TRIGGER 3: trg_validar_reserva
-- Evento: BEFORE INSERT OR UPDATE ON reservas
-- Propósito: Impedir que una misma mesa sea reservada con un solapamiento menor a 2 horas.
CREATE OR REPLACE FUNCTION fn_validar_reserva()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_conflicto INT;
BEGIN
    -- Buscar reservas confirmadas para la misma mesa dentro de +/- 2 horas
    SELECT COUNT(*) INTO v_conflicto
    FROM reservas
    WHERE id_mesa = NEW.id_mesa
      AND estado = 'confirmada'
      AND (id_reserva <> COALESCE(NEW.id_reserva, 0))
      AND (fecha_hora BETWEEN NEW.fecha_hora - INTERVAL '2 hours' 
                          AND NEW.fecha_hora + INTERVAL '2 hours');

    IF v_conflicto > 0 THEN
        RAISE EXCEPTION 'Conflicto de horario: La mesa % ya cuenta con una reserva confirmada en una ventana de 2 horas respecto a %.',
                        NEW.id_mesa, NEW.fecha_hora;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validar_reserva ON reservas;
CREATE TRIGGER trg_validar_reserva
BEFORE INSERT OR UPDATE ON reservas
FOR EACH ROW
EXECUTE FUNCTION fn_validar_reserva();


-- ============================================================================
-- SECCIÓN 3: CASOS DE PRUEBA (EVIDENCIAS PARA SUSTENTACIÓN)
-- ============================================================================

-- CASO 1: Prueba exitosa de Procedimiento sp_registrar_pedido
-- Abre un nuevo pedido en la mesa 8 (que está libre)
CALL sp_registrar_pedido(2, 8, 2, NULL);
-- Verificar que la mesa 8 ahora está 'ocupada'
SELECT id_mesa, numero, estado FROM mesas WHERE id_mesa = 8;

-- CASO 2: Prueba exitosa del Trigger de Descuento de Stock
-- Consultar stock actual del plato 1 (Encebollado Mixto)
SELECT id_plato, nombre, stock FROM platos WHERE id_plato = 1;
-- Insertar detalle para el nuevo pedido recién abierto (usando MAX(id_pedido) para no duplicar llaves)
INSERT INTO detalle_pedido (id_pedido, id_plato, cantidad, precio_unitario, subtotal)
VALUES ((SELECT MAX(id_pedido) FROM pedidos), 1, 2, 4.50, 9.00);
-- Verificar que el stock disminuyó en 2 unidades automáticamente gracias al trigger
SELECT id_plato, nombre, stock FROM platos WHERE id_plato = 1;

-- CASO 3: Prueba exitosa de Auditoría de Precio
-- Modificar precio de 'Tigrillo Zarumeño' de $4.00 a $4.25
UPDATE platos SET precio = 4.25 WHERE id_plato = 3;
-- Consultar la tabla de auditoría para verificar la traza registrada por trg_auditar_precio
SELECT * FROM auditoria_precios WHERE id_plato = 3;

-- CASO 4: Prueba exitosa de Cierre de Pedido con Procedimiento sp_cerrar_pedido
-- Cerrar el pedido recién creado, calcular total exacto y liberar la mesa 8
CALL sp_cerrar_pedido((SELECT MAX(id_pedido) FROM pedidos));
-- Verificar que la mesa 8 volvió a quedar 'libre' y el pedido está 'pagado'
SELECT id_mesa, numero, estado FROM mesas WHERE id_mesa = 8;
SELECT id_pedido, estado, total FROM pedidos WHERE id_pedido = (SELECT MAX(id_pedido) FROM pedidos);

-- ============================================================================
-- CASOS DE PRUEBA DE RECHAZO (DESCOMENTAR INDIVIDUALMENTE PARA MOSTRAR AL DOCENTE)
-- ============================================================================
-- A. Intento de sobreventa (debe fallar por falta de stock):
-- INSERT INTO detalle_pedido (id_pedido, id_plato, cantidad, precio_unitario, subtotal)
-- VALUES (1, 4, 1000, 6.50, 6500.00);

-- B. Intento de solapamiento de reserva (debe fallar por ventana de 2 horas):
-- INSERT INTO reservas (id_cliente, id_mesa, fecha_hora, num_personas, estado)
-- VALUES (4, 5, '2026-11-01 13:30:00', 2, 'confirmada');
