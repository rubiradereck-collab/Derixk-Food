-- ============================================================================
-- PROYECTO INTEGRADOR: SISTEMA DE GESTIÓN DE RESTAURANTE
-- MATERIAS: Tecnologías Web & Administración de Bases de Datos (5to Nivel - UTMACH)
-- ARCHIVO: 03_dml.sql
-- DESCRIPCIÓN: Inserción de datos iniciales y casos de prueba realistas (Gastronomía Ecuatoriana).
-- ============================================================================

-- 1. ROLES
INSERT INTO roles (nombre) VALUES
('administrador'),
('mesero'),
('cocina');

-- 2. CATEGORÍAS TÍPICAS
INSERT INTO categorias (nombre) VALUES
('Desayunos Típicos'),
('Sopas y Caldos'),
('Mariscos y Ceviches'),
('Platos Fuertes Tradicionales'),
('Bebidas y Jugos Naturales'),
('Postres Criollos');

-- 3. USUARIOS (Contraseña por defecto para pruebas: Admin123*)
INSERT INTO usuarios (nombre, email, password_hash, id_rol, activo) VALUES
('Milton Valarezo (Admin)', 'admin@restaurante.ec',   '$2a$10$srhWGH7NfurJEDz8b/mareLxUs8Z57KtKQ9Ju6B7GXRs8pDdejvM.', 1, TRUE),
('Administrador General',   'admin@restaurante.com',  '$2a$10$srhWGH7NfurJEDz8b/mareLxUs8Z57KtKQ9Ju6B7GXRs8pDdejvM.', 1, TRUE),
('Juan Carlos Pérez',       'jperez@restaurante.ec',  '$2a$10$srhWGH7NfurJEDz8b/mareLxUs8Z57KtKQ9Ju6B7GXRs8pDdejvM.', 2, TRUE),
('Mesero de Turno',         'mesero@restaurante.com', '$2a$10$srhWGH7NfurJEDz8b/mareLxUs8Z57KtKQ9Ju6B7GXRs8pDdejvM.', 2, TRUE),
('Chef Segundo Rosero',     'cocina@restaurante.ec',  '$2a$10$srhWGH7NfurJEDz8b/mareLxUs8Z57KtKQ9Ju6B7GXRs8pDdejvM.', 3, TRUE),
('Jefe de Cocina',          'cocina@restaurante.com', '$2a$10$srhWGH7NfurJEDz8b/mareLxUs8Z57KtKQ9Ju6B7GXRs8pDdejvM.', 3, TRUE);

-- 4. PLATOS TÍPICOS ECUATORIANOS (Mínimo 12 platos con stock y precio)
INSERT INTO platos (nombre, descripcion, precio, imagen, stock, disponible, id_categoria) VALUES
('Encebollado Mixto', 'Tradicional sopa costeña a base de albacora fresca, camarón, yuca suave, cebolla encurtida y chifles.', 4.50, 'assets/img/platos/encebollado.png', 35, TRUE, 2),
('Bolón Mixto Especial', 'Masa de plátano verde con generoso queso manaba y chicharrón crocante, acompañado de café pasado.', 3.00, 'assets/img/platos/bolon.png', 50, TRUE, 1),
('Tigrillo Zarumeño', 'Plátano verde majado con queso criollo, chicharrón, huevo revuelto y toque de cebolla blanca.', 4.00, 'assets/img/platos/tigrillo.png', 28, TRUE, 1),
('Ceviche de Camarón', 'Camarones del Golfo de Guayaquil marinados en cítricos con cebolla paiteña, cilantro, salsa de tomate y mostaza.', 6.50, 'assets/img/platos/ceviche-camaron.png', 25, TRUE, 3),
('Arroz Marinero Machaleño', 'Arroz salteado con camarón, calamar, concha prieta, cangrejo y vegetales aromáticos.', 8.50, 'assets/img/platos/arroz-marinero.png', 20, TRUE, 3),
('Cazuela de Pescado y Mariscos', 'Plato horneado de plátano verde con pasta de maní, pescado de roca y mariscos gratinados.', 7.00, 'assets/img/platos/cazuela.png', 18, TRUE, 3),
('Seco de Pollo Criollo', 'Pollo estofado con cerveza o chicha, naranjilla, hierbitas, servido con arroz amarillo y maduro frito.', 4.75, 'assets/img/platos/seco-pollo.png', 40, TRUE, 4),
('Guatita Ecuatoriana', 'Guiso tradicional de mondongo en suave y cremosa salsa de maní con papas, servido con arroz y aguacate.', 4.25, 'assets/img/platos/guatita.png', 22, TRUE, 4),
('Caldo de Bola de Verde', 'Sopa sustanciosa con bola de plátano verde rellena de carne especiada, huevo duro y verduras.', 5.00, 'assets/img/platos/caldo-bola.png', 15, TRUE, 2),
('Corvina Frita con Patacones', 'Corvina entera marinada con especias costeñas, servida con patacones crujientes y ensalada fresca.', 7.50, 'assets/img/platos/corvina-frita.png', 16, TRUE, 4),
('Jugo Natural de Tamarindo (1L)', 'Bebida refrescante elaborada con pulpa de tamarindo natural endulzada con panela.', 2.50, 'assets/img/platos/jugo-tamarindo.png', 60, TRUE, 5),
('Colada Morada Tradicional', 'Bebida espesa ancestral a base de harina de maíz morado, mortiño, mora, piña y hierbas aromáticas.', 2.75, 'assets/img/platos/colada-morada.png', 30, TRUE, 5);

-- 5. CLIENTES (Mínimo 10 clientes con cédulas representativas)
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

-- 6. MESAS (Mínimo 10 mesas con diferente capacidad física)
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

-- 7. RESERVAS (Mínimo 10 reservas en horarios variados)
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

-- 8. PEDIDOS / COMANDAS (Mínimo 10 pedidos con diferentes fases y fechas de 2026)
INSERT INTO pedidos (id_cliente, id_mesa, id_usuario, fecha_hora, estado, total) VALUES
(1,  2, 2, '2026-10-10 12:15:00', 'pagado',   12.50),
(2,  4, 3, '2026-10-10 13:00:00', 'pagado',   24.50),
(3,  7, 4, '2026-10-11 19:30:00', 'pagado',   38.00),
(4,  1, 2, '2026-10-12 12:45:00', 'pagado',   10.25),
(5,  3, 3, '2026-10-13 14:10:00', 'pagado',   15.50),
(6,  6, 4, '2026-10-14 20:00:00', 'pagado',   33.25),
(7,  2, 2, '2026-10-17 11:30:00', 'servido',  16.00),
(8,  4, 3, '2026-10-17 12:00:00', 'en_cocina',19.75),
(9,  7, 4, '2026-10-17 12:30:00', 'pendiente',22.50),
(10, 10,2, '2026-10-17 13:00:00', 'pendiente',45.00);

-- 9. DETALLE DE PEDIDOS (Mínimo 20 líneas de detalle asociadas)
INSERT INTO detalle_pedido (id_pedido, id_plato, cantidad, precio_unitario, subtotal) VALUES
-- Pedido 1 ($12.50)
(1, 1, 2, 4.50, 9.00),
(1, 11, 1, 2.50, 2.50),
(1, 2, 1, 3.00, 3.00),
-- Pedido 2 ($24.50)
(2, 4, 2, 6.50, 13.00),
(2, 7, 2, 4.75, 9.50),
(2, 11, 1, 2.50, 2.50),
-- Pedido 3 ($38.00)
(3, 5, 2, 8.50, 17.00),
(3, 6, 2, 7.00, 14.00),
(3, 10, 1, 7.00, 7.00),
-- Pedido 4 ($10.25)
(4, 7, 1, 4.75, 4.75),
(4, 12, 2, 2.75, 5.50),
-- Pedido 5 ($15.50)
(5, 3, 2, 4.00, 8.00),
(5, 8, 1, 4.25, 4.25),
(5, 11, 1, 2.50, 2.50),
-- Pedido 6 ($33.25)
(6, 5, 3, 8.50, 25.50),
(6, 11, 3, 2.50, 7.50),
-- Pedido 7 ($16.00)
(7, 1, 2, 4.50, 9.00),
(7, 6, 1, 7.00, 7.00),
-- Pedido 8 ($19.75)
(8, 4, 1, 6.50, 6.50),
(8, 7, 2, 4.75, 9.50),
(8, 11, 1, 2.50, 2.50),
-- Pedido 9 ($22.50)
(9, 5, 2, 8.50, 17.00),
(9, 12, 2, 2.75, 5.50),
-- Pedido 10 ($45.00)
(10, 5, 4, 8.50, 34.00),
(10, 11, 4, 2.50, 10.00);

-- 10. AUDITORÍA DE PRECIOS INICIAL
INSERT INTO auditoria_precios (id_plato, precio_anterior, precio_nuevo, fecha_cambio, usuario_responsable) VALUES
(1, 4.00, 4.50, '2026-09-15 09:00:00', 'admin@restaurante.ec'),
(5, 8.00, 8.50, '2026-09-20 10:15:00', 'admin@restaurante.ec'),
(10,7.00, 7.50, '2026-10-01 08:30:00', 'admin@restaurante.ec');
