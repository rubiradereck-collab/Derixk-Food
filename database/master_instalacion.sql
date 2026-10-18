-- ============================================================================
-- PROYECTO INTEGRADOR: SISTEMA DE GESTIÓN DE RESTAURANTE
-- MATERIAS: Tecnologías Web & Administración de Bases de Datos (5to Nivel - UTMACH)
-- ARCHIVO: master_instalacion.sql
-- DESCRIPCIÓN: SCRIPT MAESTRO INTEGRAL. Ejecutar completo en Query Tool sobre 'restaurante_db'.
--              Crea tablas, restricciones, datos ecuatorianos, vistas, triggers,
--              procedimientos y roles con un solo clic (F5).
-- ============================================================================

-- ============================================================================
-- PASO 1: LIMPIEZA PREVIA Y SEGURA DE OBJETOS
-- ============================================================================
DROP VIEW IF EXISTS v_platos_mas_vendidos CASCADE;
DROP VIEW IF EXISTS v_ventas_por_mes CASCADE;

DROP TABLE IF EXISTS auditoria_precios CASCADE;
DROP TABLE IF EXISTS detalle_pedido CASCADE;
DROP TABLE IF EXISTS pedidos CASCADE;
DROP TABLE IF EXISTS reservas CASCADE;
DROP TABLE IF EXISTS mesas CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS platos CASCADE;
DROP TABLE IF EXISTS categorias CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- ============================================================================
-- PASO 2: ESTRUCTURA DE TABLAS (DDL) CON CONSTRAINTS
-- ============================================================================

-- 1. Roles del sistema
CREATE TABLE roles (
    id_rol SERIAL PRIMARY KEY,
    nombre VARCHAR(30) NOT NULL UNIQUE,
    CONSTRAINT chk_nombre_rol CHECK (nombre IN ('administrador', 'mesero', 'cocina'))
);

-- 2. Usuarios del personal
CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    id_rol INT NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_usuarios_roles FOREIGN KEY (id_rol) 
        REFERENCES roles(id_rol) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- 3. Categorías de platos
CREATE TABLE categorias (
    id_categoria SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

-- 4. Platos del menú
CREATE TABLE platos (
    id_plato SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    precio NUMERIC(8,2) NOT NULL,
    imagen VARCHAR(255) NOT NULL DEFAULT 'assets/img/platos/default.png',
    stock INT NOT NULL DEFAULT 0,
    disponible BOOLEAN NOT NULL DEFAULT TRUE,
    id_categoria INT NOT NULL,
    CONSTRAINT chk_precio_positivo CHECK (precio > 0),
    CONSTRAINT chk_stock_no_negativo CHECK (stock >= 0),
    CONSTRAINT fk_platos_categorias FOREIGN KEY (id_categoria) 
        REFERENCES categorias(id_categoria) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- 5. Clientes
CREATE TABLE clientes (
    id_cliente SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    cedula VARCHAR(13) NOT NULL UNIQUE,
    telefono VARCHAR(15),
    email VARCHAR(120)
);

-- 6. Mesas físicas
CREATE TABLE mesas (
    id_mesa SERIAL PRIMARY KEY,
    numero INT NOT NULL UNIQUE,
    capacidad INT NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'libre',
    CONSTRAINT chk_numero_mesa_positivo CHECK (numero > 0),
    CONSTRAINT chk_capacidad_positiva CHECK (capacidad > 0),
    CONSTRAINT chk_estado_mesa CHECK (estado IN ('libre', 'ocupada', 'reservada'))
);

-- 7. Reservas de mesas
CREATE TABLE reservas (
    id_reserva SERIAL PRIMARY KEY,
    id_cliente INT NOT NULL,
    id_mesa INT NOT NULL,
    fecha_hora TIMESTAMP NOT NULL,
    num_personas INT NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'confirmada',
    CONSTRAINT chk_num_personas_positivo CHECK (num_personas > 0),
    CONSTRAINT chk_estado_reserva CHECK (estado IN ('pendiente', 'confirmada', 'cancelada', 'completada')),
    CONSTRAINT fk_reservas_clientes FOREIGN KEY (id_cliente) 
        REFERENCES clientes(id_cliente) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_reservas_mesas FOREIGN KEY (id_mesa) 
        REFERENCES mesas(id_mesa) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- 8. Pedidos / Comandas
CREATE TABLE pedidos (
    id_pedido SERIAL PRIMARY KEY,
    id_cliente INT NOT NULL,
    id_mesa INT NOT NULL,
    id_usuario INT NOT NULL,
    fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    CONSTRAINT chk_total_no_negativo CHECK (total >= 0),
    CONSTRAINT chk_estado_pedido CHECK (estado IN ('pendiente', 'en_cocina', 'listo', 'servido', 'pagado', 'cancelado')),
    CONSTRAINT fk_pedidos_clientes FOREIGN KEY (id_cliente) 
        REFERENCES clientes(id_cliente) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_pedidos_mesas FOREIGN KEY (id_mesa) 
        REFERENCES mesas(id_mesa) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_pedidos_usuarios FOREIGN KEY (id_usuario) 
        REFERENCES usuarios(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- 9. Detalle de pedidos
CREATE TABLE detalle_pedido (
    id_detalle SERIAL PRIMARY KEY,
    id_pedido INT NOT NULL,
    id_plato INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario NUMERIC(8,2) NOT NULL,
    subtotal NUMERIC(10,2) NOT NULL,
    CONSTRAINT chk_cantidad_positiva CHECK (cantidad > 0),
    CONSTRAINT chk_precio_unitario_positivo CHECK (precio_unitario > 0),
    CONSTRAINT chk_subtotal_no_negativo CHECK (subtotal >= 0),
    CONSTRAINT uk_pedido_plato UNIQUE (id_pedido, id_plato),
    CONSTRAINT fk_detalle_pedidos FOREIGN KEY (id_pedido) 
        REFERENCES pedidos(id_pedido) ON DELETE CASCADE,
    CONSTRAINT fk_detalle_platos FOREIGN KEY (id_plato) 
        REFERENCES platos(id_plato) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- 10. Auditoría de precios
CREATE TABLE auditoria_precios (
    id_auditoria SERIAL PRIMARY KEY,
    id_plato INT NOT NULL,
    precio_anterior NUMERIC(8,2) NOT NULL,
    precio_nuevo NUMERIC(8,2) NOT NULL,
    fecha_cambio TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    usuario_responsable VARCHAR(100) NOT NULL DEFAULT CURRENT_USER,
    CONSTRAINT fk_auditoria_platos FOREIGN KEY (id_plato) 
        REFERENCES platos(id_plato) ON DELETE CASCADE
);

-- Índices de aceleración
CREATE INDEX idx_platos_categoria ON platos(id_categoria);
CREATE INDEX idx_platos_nombre ON platos(nombre);
CREATE INDEX idx_pedidos_mesa ON pedidos(id_mesa);
CREATE INDEX idx_pedidos_fecha ON pedidos(fecha_hora);
CREATE INDEX idx_detalle_pedido_pedido ON detalle_pedido(id_pedido);
CREATE INDEX idx_detalle_pedido_plato ON detalle_pedido(id_plato);
CREATE INDEX idx_reservas_mesa_fecha ON reservas(id_mesa, fecha_hora);

-- ============================================================================
-- PASO 3: CARGA INICIAL DE DATOS REALISTAS (DML)
-- ============================================================================

-- Roles
INSERT INTO roles (nombre) VALUES
('administrador'),
('mesero'),
('cocina');

-- Categorías típicas
INSERT INTO categorias (nombre) VALUES
('Desayunos Típicos'),
('Sopas y Caldos'),
('Mariscos y Ceviches'),
('Platos Fuertes Tradicionales'),
('Bebidas y Jugos Naturales'),
('Postres Criollos');

-- Usuarios (Clave inicial 'Admin123*' cifrada con bcrypt)
INSERT INTO usuarios (nombre, email, password_hash, id_rol, activo) VALUES
('Milton Valarezo (Admin)', 'admin@restaurante.ec',   '$2a$10$srhWGH7NfurJEDz8b/mareLxUs8Z57KtKQ9Ju6B7GXRs8pDdejvM.', 1, TRUE),
('Administrador General',   'admin@restaurante.com',  '$2a$10$srhWGH7NfurJEDz8b/mareLxUs8Z57KtKQ9Ju6B7GXRs8pDdejvM.', 1, TRUE),
('Juan Carlos Pérez',       'jperez@restaurante.ec',  '$2a$10$srhWGH7NfurJEDz8b/mareLxUs8Z57KtKQ9Ju6B7GXRs8pDdejvM.', 2, TRUE),
('Mesero de Turno',         'mesero@restaurante.com', '$2a$10$srhWGH7NfurJEDz8b/mareLxUs8Z57KtKQ9Ju6B7GXRs8pDdejvM.', 2, TRUE),
('Chef Segundo Rosero',     'cocina@restaurante.ec',  '$2a$10$srhWGH7NfurJEDz8b/mareLxUs8Z57KtKQ9Ju6B7GXRs8pDdejvM.', 3, TRUE),
('Jefe de Cocina',          'cocina@restaurante.com', '$2a$10$srhWGH7NfurJEDz8b/mareLxUs8Z57KtKQ9Ju6B7GXRs8pDdejvM.', 3, TRUE);

-- 12 Platos típicos
INSERT INTO platos (nombre, descripcion, precio, imagen, stock, disponible, id_categoria) VALUES
('Encebollado Mixto', 'Tradicional sopa costeña a base de albacora fresca, camarón, yuca suave, cebolla encurtida y chifles.', 4.50, 'assets/img/platos/encebollado.png', 35, TRUE, 2),
('Bolón Mixto Especial', 'Masa de plátano verde con generoso queso manaba y chicharrón crocante, acompañado de café pasado.', 3.00, 'assets/img/platos/bolon.png', 50, TRUE, 1),
('Tigrillo Zarumeño', 'Plátano verde majado con queso criollo, chicharrón, huevo revuelto y toque de cebolla blanca.', 4.00, 'assets/img/platos/tigrillo.png', 28, TRUE, 1),
('Ceviche de Camarón', 'Camarones del Golfo marinados en cítricos con cebolla paiteña, cilantro, salsa de tomate y mostaza.', 6.50, 'assets/img/platos/ceviche-camaron.png', 25, TRUE, 3),
('Arroz Marinero Machaleño', 'Arroz salteado con camarón, calamar, concha prieta, cangrejo y vegetales aromáticos.', 8.50, 'assets/img/platos/arroz-marinero.png', 20, TRUE, 3),
('Cazuela de Pescado y Mariscos', 'Plato horneado de plátano verde con pasta de maní, pescado de roca y mariscos gratinados.', 7.00, 'assets/img/platos/cazuela.png', 18, TRUE, 3),
('Seco de Pollo Criollo', 'Pollo estofado con cerveza o chicha, naranjilla, hierbitas, servido con arroz amarillo y maduro frito.', 4.75, 'assets/img/platos/seco-pollo.png', 40, TRUE, 4),
('Guatita Ecuatoriana', 'Guiso tradicional de mondongo en suave y cremosa salsa de maní con papas, servido con arroz y aguacate.', 4.25, 'assets/img/platos/guatita.png', 22, TRUE, 4),
('Caldo de Bola de Verde', 'Sopa sustanciosa con bola de plátano verde rellena de carne especiada, huevo duro y verduras.', 5.00, 'assets/img/platos/caldo-bola.png', 15, TRUE, 2),
('Corvina Frita con Patacones', 'Corvina entera marinada con especias costeñas, servida con patacones crujientes y ensalada fresca.', 7.50, 'assets/img/platos/corvina-frita.png', 16, TRUE, 4),
('Jugo Natural de Tamarindo (1L)', 'Bebida refrescante elaborada con pulpa de tamarindo natural endulzada con panela.', 2.50, 'assets/img/platos/jugo-tamarindo.png', 60, TRUE, 5),
('Colada Morada Tradicional', 'Bebida espesa ancestral a base de harina de maíz morado, mortiño, mora, piña y hierbas aromáticas.', 2.75, 'assets/img/platos/colada-morada.png', 30, TRUE, 5);

-- Clientes
INSERT INTO clientes (nombre, cedula, telefono, email) VALUES
('Consumidor Final',      '9999999999',    '0000000000', 'final@restaurante.ec'),
('Luis Fernando Torres',  '0704589632',    '0987451236', 'ltorres@gmail.com'),
('Patricia Viviana Solano','0701458963',   '0996321458', 'psolano@hotmail.com'),
('Javier Alexander Bravo','0914785236',    '0968521479', 'jbravo@outlook.com'),
('Carmen Alexandra Morocho','0703698521',  '0974125896', 'cmorocho@yahoo.com'),
('David Andrés Benítez',  '1102589634',    '0951236987', 'dbenitez@gmail.com'),
('Gabriela Estefanía Vega','0702587413',   '0998741235', 'gvega@live.com'),
('Santiago Xavier Ramón', '0104789632',    '0985214763', 'sramon@gmail.com'),
('Andrea Carolina Quezada','0705412369',   '0978963214', 'aquezada@gmail.com'),
('Manuel Antonio Cabrera', '0706321458',   '0963258741', 'mcabrera@hotmail.com');

-- 10 Mesas físicas
INSERT INTO mesas (numero, capacidad, estado) VALUES
(1,  2, 'libre'),
(2,  2, 'ocupada'),
(3,  4, 'libre'),
(4,  4, 'ocupada'),
(5,  4, 'reservada'),
(6,  6, 'libre'),
(7,  6, 'ocupada'),
(8,  8, 'libre'),
(9,  8, 'reservada'),
(10, 12, 'libre');

-- Reservas
INSERT INTO reservas (id_cliente, id_mesa, fecha_hora, num_personas, estado) VALUES
(2,  5, '2026-11-01 13:00:00', 4, 'confirmada'),
(3,  9, '2026-11-01 20:00:00', 8, 'confirmada'),
(4,  1, '2026-11-02 12:30:00', 2, 'confirmada'),
(5,  3, '2026-11-02 14:00:00', 4, 'completada'),
(6,  6, '2026-11-03 19:30:00', 6, 'confirmada'),
(7,  7, '2026-11-03 21:00:00', 5, 'cancelada'),
(8,  8, '2026-11-04 13:30:00', 7, 'confirmada'),
(9,  2, '2026-11-04 15:00:00', 2, 'pendiente'),
(10, 4, '2026-11-05 12:00:00', 4, 'confirmada'),
(2,  10,'2026-11-05 20:30:00', 10, 'confirmada');

-- 10 Pedidos históricos
INSERT INTO pedidos (id_cliente, id_mesa, id_usuario, fecha_hora, estado, total) VALUES
(1,  2, 2, '2026-10-10 12:15:00', 'pagado',   14.50),
(2,  4, 3, '2026-10-10 13:00:00', 'pagado',   25.00),
(3,  7, 4, '2026-10-11 19:30:00', 'pagado',   38.00),
(4,  1, 2, '2026-10-12 12:45:00', 'pagado',   10.25),
(5,  3, 3, '2026-10-13 14:10:00', 'pagado',   14.75),
(6,  6, 4, '2026-10-14 20:00:00', 'pagado',   33.00),
(7,  2, 2, '2026-10-17 11:30:00', 'servido',  16.00),
(8,  4, 3, '2026-10-17 12:00:00', 'en_cocina',18.50),
(9,  7, 4, '2026-10-17 12:30:00', 'pendiente',22.50),
(10, 10,2, '2026-10-17 13:00:00', 'pendiente',44.00);

-- Líneas de detalle iniciales
INSERT INTO detalle_pedido (id_pedido, id_plato, cantidad, precio_unitario, subtotal) VALUES
(1, 1, 2, 4.50, 9.00),
(1, 11, 1, 2.50, 2.50),
(1, 2, 1, 3.00, 3.00),
(2, 4, 2, 6.50, 13.00),
(2, 7, 2, 4.75, 9.50),
(2, 11, 1, 2.50, 2.50),
(3, 5, 2, 8.50, 17.00),
(3, 6, 2, 7.00, 14.00),
(3, 10, 1, 7.00, 7.00),
(4, 7, 1, 4.75, 4.75),
(4, 12, 2, 2.75, 5.50),
(5, 3, 2, 4.00, 8.00),
(5, 8, 1, 4.25, 4.25),
(5, 11, 1, 2.50, 2.50),
(6, 5, 3, 8.50, 25.50),
(6, 11, 3, 2.50, 7.50),
(7, 1, 2, 4.50, 9.00),
(7, 6, 1, 7.00, 7.00),
(8, 4, 1, 6.50, 6.50),
(8, 7, 2, 4.75, 9.50),
(8, 11, 1, 2.50, 2.50),
(9, 5, 2, 8.50, 17.00),
(9, 12, 2, 2.75, 5.50),
(10, 5, 4, 8.50, 34.00),
(10, 11, 4, 2.50, 10.00);

-- Auditoría inicial de precios
INSERT INTO auditoria_precios (id_plato, precio_anterior, precio_nuevo, fecha_cambio, usuario_responsable) VALUES
(1, 4.00, 4.50, '2026-09-15 09:00:00', 'admin@restaurante.ec'),
(5, 8.00, 8.50, '2026-09-20 10:15:00', 'admin@restaurante.ec'),
(10,7.00, 7.50, '2026-10-01 08:30:00', 'admin@restaurante.ec');

-- ============================================================================
-- PASO 4: VISTAS REUTILIZABLES PARA REPORTES
-- ============================================================================

-- Vista de platos con total de ventas acumuladas
CREATE OR REPLACE VIEW v_platos_mas_vendidos AS
SELECT 
    p.id_plato,
    p.nombre AS nombre_plato,
    c.nombre AS categoria,
    p.precio AS precio_actual,
    COALESCE(SUM(dp.cantidad), 0) AS unidades_vendidas,
    COALESCE(SUM(dp.subtotal), 0.00) AS total_ingresos
FROM platos p
INNER JOIN categorias c ON p.id_categoria = c.id_categoria
LEFT JOIN detalle_pedido dp ON p.id_plato = dp.id_plato
LEFT JOIN pedidos ped ON dp.id_pedido = ped.id_pedido AND ped.estado = 'pagado'
GROUP BY p.id_plato, p.nombre, c.nombre, p.precio
ORDER BY unidades_vendidas DESC;

-- Vista de facturación consolidada por mes
CREATE OR REPLACE VIEW v_ventas_por_mes AS
SELECT 
    EXTRACT(YEAR FROM fecha_hora)::INT AS anio,
    EXTRACT(MONTH FROM fecha_hora)::INT AS mes,
    TO_CHAR(fecha_hora, 'TMMonth YYYY') AS mes_anio,
    COUNT(id_pedido) AS total_pedidos,
    ROUND(SUM(total), 2) AS total_facturado,
    ROUND(AVG(total), 2) AS ticket_promedio
FROM pedidos
WHERE estado = 'pagado'
GROUP BY 
    EXTRACT(YEAR FROM fecha_hora),
    EXTRACT(MONTH FROM fecha_hora),
    TO_CHAR(fecha_hora, 'TMMonth YYYY')
ORDER BY anio DESC, mes DESC;

-- ============================================================================
-- PASO 5: PROGRAMACIÓN EN BASE DE DATOS (TRIGGERS Y STORED PROCEDURES)
-- ============================================================================

-- 1. Trigger para descontar stock y computar subtotales automáticamente
CREATE OR REPLACE FUNCTION fn_descontar_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_stock_actual INT;
    v_precio_catalogo NUMERIC(8,2);
    v_nombre_plato VARCHAR(100);
BEGIN
    SELECT stock, precio, nombre 
    INTO v_stock_actual, v_precio_catalogo, v_nombre_plato
    FROM platos 
    WHERE id_plato = NEW.id_plato;

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


-- 2. Trigger para registrar auditoría de precios automáticamente
CREATE OR REPLACE FUNCTION fn_auditar_precio()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.precio <> NEW.precio THEN
        INSERT INTO auditoria_precios (
            id_plato, precio_anterior, precio_nuevo, fecha_cambio, usuario_responsable
        ) VALUES (
            OLD.id_plato, OLD.precio, NEW.precio, CURRENT_TIMESTAMP, CURRENT_USER
        );
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auditar_precio ON platos;
CREATE TRIGGER trg_auditar_precio
AFTER UPDATE OF precio ON platos
FOR EACH ROW
EXECUTE FUNCTION fn_auditar_precio();


-- 3. Trigger para validar solapamiento de horarios en reservas (+/- 2 horas)
CREATE OR REPLACE FUNCTION fn_validar_reserva()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_conflicto INT;
BEGIN
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


-- 4. Procedimiento para registrar apertura de pedido y ocupar la mesa
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
    SELECT estado INTO v_estado_mesa FROM mesas WHERE id_mesa = p_id_mesa;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'La mesa con ID % no existe.', p_id_mesa;
    END IF;

    IF v_estado_mesa = 'ocupada' THEN
        RAISE EXCEPTION 'La mesa % ya se encuentra ocupada.', p_id_mesa;
    END IF;

    INSERT INTO pedidos (id_cliente, id_mesa, id_usuario, fecha_hora, estado, total)
    VALUES (p_id_cliente, p_id_mesa, p_id_usuario, CURRENT_TIMESTAMP, 'pendiente', 0.00)
    RETURNING id_pedido INTO p_id_pedido_creado;

    UPDATE mesas SET estado = 'ocupada' WHERE id_mesa = p_id_mesa;
END;
$$;


-- 5. Procedimiento para cerrar pedido, computar total y liberar la mesa
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
    SELECT id_mesa, estado INTO v_id_mesa, v_estado_actual 
    FROM pedidos 
    WHERE id_pedido = p_id_pedido;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'El pedido #% no existe.', p_id_pedido;
    END IF;

    IF v_estado_actual = 'pagado' THEN
        RAISE EXCEPTION 'El pedido #% ya fue pagado previamente.', p_id_pedido;
    END IF;

    SELECT COALESCE(SUM(subtotal), 0.00) 
    INTO v_total_recalculado
    FROM detalle_pedido
    WHERE id_pedido = p_id_pedido;

    UPDATE pedidos
    SET estado = 'pagado',
        total = v_total_recalculado
    WHERE id_pedido = p_id_pedido;

    UPDATE mesas SET estado = 'libre' WHERE id_mesa = v_id_mesa;
END;
$$;

-- ============================================================================
-- PASO 6: CONFIGURACIÓN DE ROLES Y PRIVILEGIOS (MÍNIMO PRIVILEGIO)
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'rol_admin') THEN
        CREATE ROLE rol_admin WITH LOGIN PASSWORD 'AdminRestaurante2026';
    END IF;

    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'rol_mesero') THEN
        CREATE ROLE rol_mesero WITH LOGIN PASSWORD 'MeseroPass2026';
    END IF;

    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'rol_cocina') THEN
        CREATE ROLE rol_cocina WITH LOGIN PASSWORD 'CocinaPass2026';
    END IF;

    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'rol_solo_lectura') THEN
        CREATE ROLE rol_solo_lectura WITH LOGIN PASSWORD 'ConsultaPass2026';
    END IF;
END $$;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC;

GRANT CONNECT ON DATABASE restaurante_db TO rol_admin, rol_mesero, rol_cocina, rol_solo_lectura;
GRANT USAGE ON SCHEMA public TO rol_admin, rol_mesero, rol_cocina, rol_solo_lectura;

-- Permisos Admin
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO rol_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO rol_admin;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO rol_admin;

-- Permisos Mesero
GRANT SELECT ON TABLE roles, categorias, platos TO rol_mesero;
GRANT SELECT, INSERT, UPDATE ON TABLE clientes, reservas, pedidos, detalle_pedido TO rol_mesero;
GRANT SELECT, UPDATE (estado) ON TABLE mesas TO rol_mesero;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO rol_mesero;

-- Permisos Cocina
GRANT SELECT ON TABLE platos, categorias, detalle_pedido TO rol_cocina;
GRANT SELECT, UPDATE (estado) ON TABLE pedidos TO rol_cocina;

-- Permisos Solo Lectura
GRANT SELECT ON ALL TABLES IN SCHEMA public TO rol_solo_lectura;

-- Sincronizar secuencias autoincrementales
SELECT setval('roles_id_rol_seq', (SELECT MAX(id_rol) FROM roles));
SELECT setval('categorias_id_categoria_seq', (SELECT MAX(id_categoria) FROM categorias));
SELECT setval('usuarios_id_usuario_seq', (SELECT MAX(id_usuario) FROM usuarios));
SELECT setval('platos_id_plato_seq', (SELECT MAX(id_plato) FROM platos));
SELECT setval('clientes_id_cliente_seq', (SELECT MAX(id_cliente) FROM clientes));
SELECT setval('mesas_id_mesa_seq', (SELECT MAX(id_mesa) FROM mesas));
SELECT setval('reservas_id_reserva_seq', (SELECT MAX(id_reserva) FROM reservas));
SELECT setval('pedidos_id_pedido_seq', (SELECT MAX(id_pedido) FROM pedidos));
SELECT setval('detalle_pedido_id_detalle_seq', (SELECT MAX(id_detalle) FROM detalle_pedido));
SELECT setval('auditoria_precios_id_auditoria_seq', (SELECT COALESCE(MAX(id_auditoria), 1) FROM auditoria_precios));

-- ============================================================================
-- VERIFICACIÓN FINAL: RESUMEN DE INSTALACIÓN
-- ============================================================================
SELECT 
    'Instalación completada exitosamente' AS resultado,
    (SELECT COUNT(*) FROM platos) AS total_platos,
    (SELECT COUNT(*) FROM clientes) AS total_clientes,
    (SELECT COUNT(*) FROM mesas) AS total_mesas,
    (SELECT COUNT(*) FROM pedidos) AS total_pedidos;
