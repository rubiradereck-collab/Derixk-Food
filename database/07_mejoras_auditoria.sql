-- ============================================================================
-- ARCHIVO: 07_mejoras_auditoria.sql
-- Mejoras derivadas de la auditoría técnica (ejecutar después de master_instalacion.sql)
-- ============================================================================

-- 1. Contraseñas semilla correctas (Mesero123* y Cocina123*)
UPDATE usuarios SET password_hash = '$2a$10$ZRC91qGwoW3gRUpaSgKGDOnYv69J3fi5FTDgJ0cZmKak19YNdjyfu'
WHERE id_rol = 2;
UPDATE usuarios SET password_hash = '$2a$10$duOTfsPs9/vp7QbUTF/U8uCNoc/To9XvGET8GrfQ5pIgtHGxjFD8C'
WHERE id_rol = 3;

-- 2. Stock: bloqueo pesimista dentro del trigger (cierra la condición de carrera)
CREATE OR REPLACE FUNCTION fn_descontar_stock()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_stock_actual INT;
    v_precio_catalogo NUMERIC(8,2);
    v_nombre_plato VARCHAR(100);
BEGIN
    SELECT stock, precio, nombre
    INTO v_stock_actual, v_precio_catalogo, v_nombre_plato
    FROM platos
    WHERE id_plato = NEW.id_plato
    FOR UPDATE;                         -- << el segundo pedido espera aquí

    IF NOT FOUND THEN
        RAISE EXCEPTION 'El plato con ID % no existe.', NEW.id_plato;
    END IF;

    IF v_stock_actual < NEW.cantidad THEN
        RAISE EXCEPTION 'Stock insuficiente para "%". Disponible: %, Solicitado: %',
                        v_nombre_plato, v_stock_actual, NEW.cantidad;
    END IF;

    NEW.precio_unitario := COALESCE(NEW.precio_unitario, v_precio_catalogo);
    NEW.subtotal := NEW.cantidad * NEW.precio_unitario;

    UPDATE platos
    SET stock = stock - NEW.cantidad,
        disponible = (stock - NEW.cantidad) > 0
    WHERE id_plato = NEW.id_plato;

    RETURN NEW;
END;
$$;

-- 3. Auditoría con el usuario REAL de la aplicación (no CURRENT_USER = postgres)
CREATE OR REPLACE FUNCTION fn_auditar_precio()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF OLD.precio <> NEW.precio THEN
        INSERT INTO auditoria_precios (id_plato, precio_anterior, precio_nuevo, fecha_cambio, usuario_responsable)
        VALUES (
            OLD.id_plato, OLD.precio, NEW.precio, CURRENT_TIMESTAMP,
            -- NULLIF: en un pool, tras el COMMIT la variable queda en '' (no en NULL)
            COALESCE(NULLIF(current_setting('app.usuario', true), ''), CURRENT_USER)
        );
    END IF;
    RETURN NEW;
END;
$$;

-- 4. Reservas: restricción de exclusión (sin carreras) + capacidad y fecha
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE reservas ADD CONSTRAINT excl_reserva_solapada
    EXCLUDE USING gist (
        id_mesa WITH =,
        tsrange(fecha_hora, fecha_hora + INTERVAL '2 hours') WITH &&
    ) WHERE (estado = 'confirmada');

CREATE OR REPLACE FUNCTION fn_validar_reserva()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_capacidad INT;
BEGIN
    SELECT capacidad INTO v_capacidad FROM mesas WHERE id_mesa = NEW.id_mesa;

    IF NEW.num_personas > v_capacidad THEN
        RAISE EXCEPTION 'La mesa % admite máximo % personas (solicitadas: %).',
                        NEW.id_mesa, v_capacidad, NEW.num_personas;
    END IF;

    IF TG_OP = 'INSERT' AND NEW.fecha_hora < CURRENT_TIMESTAMP THEN
        RAISE EXCEPTION 'No se puede reservar en una fecha pasada (%).', NEW.fecha_hora;
    END IF;

    RETURN NEW;   -- el solapamiento ahora lo garantiza excl_reserva_solapada
END;
$$;

-- 5. Cancelación atómica: devuelve stock y libera la mesa
CREATE OR REPLACE PROCEDURE sp_cancelar_pedido(IN p_id_pedido INT)
LANGUAGE plpgsql AS $$
DECLARE
    v_estado VARCHAR(20);
    v_id_mesa INT;
BEGIN
    SELECT estado, id_mesa INTO v_estado, v_id_mesa
    FROM pedidos WHERE id_pedido = p_id_pedido
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'El pedido #% no existe.', p_id_pedido;
    END IF;

    IF v_estado <> 'pendiente' THEN
        RAISE EXCEPTION 'Solo se pueden cancelar pedidos pendientes (el #% está "%").', p_id_pedido, v_estado;
    END IF;

    UPDATE platos p
    SET stock = p.stock + d.cantidad,
        disponible = TRUE
    FROM detalle_pedido d
    WHERE d.id_pedido = p_id_pedido AND p.id_plato = d.id_plato;

    UPDATE pedidos SET estado = 'cancelado' WHERE id_pedido = p_id_pedido;
    UPDATE mesas SET estado = 'libre' WHERE id_mesa = v_id_mesa;
END;
$$;

-- 6. Cierre: bloquear la fila y no cobrar pedidos cancelados
CREATE OR REPLACE PROCEDURE sp_cerrar_pedido(IN p_id_pedido INT)
LANGUAGE plpgsql AS $$
DECLARE
    v_id_mesa INT;
    v_total NUMERIC(10,2);
    v_estado VARCHAR(20);
BEGIN
    SELECT id_mesa, estado INTO v_id_mesa, v_estado
    FROM pedidos WHERE id_pedido = p_id_pedido
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'El pedido #% no existe.', p_id_pedido;
    END IF;

    IF v_estado IN ('pagado', 'cancelado') THEN
        RAISE EXCEPTION 'El pedido #% ya está "%" y no se puede cobrar.', p_id_pedido, v_estado;
    END IF;

    SELECT COALESCE(SUM(subtotal), 0) INTO v_total
    FROM detalle_pedido WHERE id_pedido = p_id_pedido;

    UPDATE pedidos SET estado = 'pagado', total = v_total WHERE id_pedido = p_id_pedido;
    UPDATE mesas SET estado = 'libre' WHERE id_mesa = v_id_mesa;
END;
$$;

-- 7. Usuario de aplicación con mínimo privilegio (el backend deja de usar 'postgres')
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_backend') THEN
        CREATE ROLE app_backend LOGIN PASSWORD 'cambiar_en_env';
    END IF;
END $$;
GRANT CONNECT ON DATABASE restaurante_db TO app_backend;
GRANT USAGE ON SCHEMA public TO app_backend;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_backend;
GRANT DELETE ON platos TO app_backend;
REVOKE UPDATE, DELETE ON auditoria_precios FROM app_backend;   -- auditoría inmutable
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_backend;
GRANT EXECUTE ON ALL PROCEDURES IN SCHEMA public TO app_backend;
