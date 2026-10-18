-- ============================================================================
-- PROYECTO INTEGRADOR: SISTEMA DE GESTIÓN DE RESTAURANTE
-- MATERIAS: Tecnologías Web & Administración de Bases de Datos (5to Nivel - UTMACH)
-- ARCHIVO: 01_ddl.sql
-- DESCRIPCIÓN: Definición de estructura física, tablas, constraints e índices.
-- ============================================================================

-- 1. CREACIÓN DE LA BASE DE DATOS (Ejecutar conectado a la BD 'postgres' si se desea crear desde cero)
-- CREATE DATABASE restaurante_db WITH ENCODING = 'UTF8';
-- \c restaurante_db;

-- 2. LIMPIEZA DE TABLAS PREVIAS (Orden inverso por dependencias de llaves foráneas)
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
-- 3. CREACIÓN DE TABLAS
-- ============================================================================

-- Tabla 1: Roles de usuario
CREATE TABLE roles (
    id_rol SERIAL PRIMARY KEY,
    nombre VARCHAR(30) NOT NULL UNIQUE,
    CONSTRAINT chk_nombre_rol CHECK (nombre IN ('administrador', 'mesero', 'cocina'))
);

-- Tabla 2: Usuarios del personal
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

-- Tabla 3: Categorías de platos
CREATE TABLE categorias (
    id_categoria SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

-- Tabla 4: Platos del menú
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

-- Tabla 5: Clientes
CREATE TABLE clientes (
    id_cliente SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    cedula VARCHAR(13) NOT NULL UNIQUE,
    telefono VARCHAR(15),
    email VARCHAR(120)
);

-- Tabla 6: Mesas del restaurante
CREATE TABLE mesas (
    id_mesa SERIAL PRIMARY KEY,
    numero INT NOT NULL UNIQUE,
    capacidad INT NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'libre',
    CONSTRAINT chk_numero_mesa_positivo CHECK (numero > 0),
    CONSTRAINT chk_capacidad_positiva CHECK (capacidad > 0),
    CONSTRAINT chk_estado_mesa CHECK (estado IN ('libre', 'ocupada', 'reservada'))
);

-- Tabla 7: Reservas de mesas
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

-- Tabla 8: Pedidos / Comandas
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

-- Tabla 9: Detalle del pedido
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

-- Tabla 10: Auditoría de cambios de precios en platos
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

-- ============================================================================
-- 4. ÍNDICES PARA OPTIMIZACIÓN DE CONSULTAS Y CONCURRENCIA
-- ============================================================================
CREATE INDEX idx_platos_categoria ON platos(id_categoria);
CREATE INDEX idx_platos_nombre ON platos(nombre);
CREATE INDEX idx_pedidos_mesa ON pedidos(id_mesa);
CREATE INDEX idx_pedidos_fecha ON pedidos(fecha_hora);
CREATE INDEX idx_detalle_pedido_pedido ON detalle_pedido(id_pedido);
CREATE INDEX idx_detalle_pedido_plato ON detalle_pedido(id_plato);
CREATE INDEX idx_reservas_mesa_fecha ON reservas(id_mesa, fecha_hora);
