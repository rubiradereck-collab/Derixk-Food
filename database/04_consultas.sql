-- ============================================================================
-- PROYECTO INTEGRADOR: SISTEMA DE GESTIÓN DE RESTAURANTE
-- MATERIAS: Tecnologías Web & Administración de Bases de Datos (5to Nivel - UTMACH)
-- ARCHIVO: 04_consultas.sql
-- DESCRIPCIÓN: Consultas avanzadas (JOIN múltiple, GROUP BY/HAVING, subconsultas y VISTAS).
-- ============================================================================

-- ============================================================================
-- CONSULTA 1: Catálogo completo de platos con categoría asociada
-- TEMA: Sentencia SELECT, INNER JOIN, WHERE, ORDER BY
-- PROPÓSITO: Proporciona la información requerida por la vista de Menú en Angular.
-- ============================================================================
SELECT 
    p.id_plato,
    p.nombre AS plato,
    c.nombre AS categoria,
    p.descripcion,
    p.precio,
    p.stock,
    p.disponible
FROM platos p
INNER JOIN categorias c ON p.id_categoria = c.id_categoria
WHERE p.disponible = TRUE
ORDER BY c.nombre ASC, p.precio DESC;


-- ============================================================================
-- CONSULTA 2: Reporte detallado de comanda (JOIN múltiple a 4 tablas)
-- TEMA: JOIN a múltiples tablas, alias, filtros compuestos
-- PROPÓSITO: Ver qué mesero atendió a qué cliente, en qué mesa y el estado del pedido.
-- ============================================================================
SELECT 
    ped.id_pedido,
    TO_CHAR(ped.fecha_hora, 'YYYY-MM-DD HH24:MI') AS fecha_atencion,
    m.numero AS numero_mesa,
    cli.nombre AS nombre_cliente,
    cli.cedula,
    u.nombre AS mesero_responsable,
    ped.estado,
    ped.total
FROM pedidos ped
INNER JOIN mesas m ON ped.id_mesa = m.id_mesa
INNER JOIN clientes cli ON ped.id_cliente = cli.id_cliente
INNER JOIN usuarios u ON ped.id_usuario = u.id_usuario
WHERE ped.estado IN ('servido', 'en_cocina', 'pendiente')
ORDER BY ped.fecha_hora DESC;


-- ============================================================================
-- CONSULTA 3: Métricas de precios e inventario por categoría
-- TEMA: Funciones de grupo (COUNT, AVG, MIN, MAX, SUM), GROUP BY
-- PROPÓSITO: Análisis de oferta por categoría gastronómica en el restaurante.
-- ============================================================================
SELECT 
    c.nombre AS categoria,
    COUNT(p.id_plato) AS total_platos,
    SUM(p.stock) AS stock_total_porciones,
    MIN(p.precio) AS precio_minimo,
    MAX(p.precio) AS precio_maximo,
    ROUND(AVG(p.precio), 2) AS precio_promedio
FROM categorias c
INNER JOIN platos p ON c.id_categoria = p.id_categoria
GROUP BY c.id_categoria, c.nombre
ORDER BY stock_total_porciones DESC;


-- ============================================================================
-- CONSULTA 4: Categorías premium según precio promedio
-- TEMA: GROUP BY con cláusula HAVING
-- PROPÓSITO: Filtrar únicamente las categorías cuyo precio promedio supere los $5.00 USD.
-- ============================================================================
SELECT 
    c.nombre AS categoria,
    COUNT(p.id_plato) AS cantidad_items,
    ROUND(AVG(p.precio), 2) AS precio_promedio
FROM categorias c
INNER JOIN platos p ON c.id_categoria = p.id_categoria
GROUP BY c.id_categoria, c.nombre
HAVING AVG(p.precio) >= 5.00
ORDER BY precio_promedio DESC;


-- ============================================================================
-- CONSULTA 5: Resumen de ventas agrupadas por mesero
-- TEMA: Agregación con JOIN múltiple
-- PROPÓSITO: Evaluar el desempeño de cada mesero por volumen cobrado.
-- ============================================================================
SELECT 
    u.id_usuario,
    u.nombre AS mesero,
    COUNT(ped.id_pedido) AS total_pedidos_atendidos,
    SUM(ped.total) AS total_recaudado
FROM usuarios u
INNER JOIN pedidos ped ON u.id_usuario = ped.id_usuario
WHERE ped.estado = 'pagado'
GROUP BY u.id_usuario, u.nombre
ORDER BY total_recaudado DESC;


-- ============================================================================
-- CONSULTA 6: Platos pertenecientes a categorías populares
-- TEMA: Subconsulta con operador IN
-- PROPÓSITO: Encontrar platos de aquellas categorías que tienen más de 2 platos registrados.
-- ============================================================================
SELECT 
    id_plato,
    nombre AS plato,
    precio,
    stock
FROM platos
WHERE id_categoria IN (
    SELECT id_categoria
    FROM platos
    GROUP BY id_categoria
    HAVING COUNT(id_plato) >= 2
)
ORDER BY precio ASC;


-- ============================================================================
-- CONSULTA 7: Platos sin rotación de venta
-- TEMA: Subconsulta con operador NOT EXISTS
-- PROPÓSITO: Detectar platos de la carta que nunca han formado parte de un pedido.
-- ============================================================================
SELECT 
    p.id_plato,
    p.nombre AS plato_sin_ventas,
    p.precio,
    p.stock
FROM platos p
WHERE NOT EXISTS (
    SELECT 1 
    FROM detalle_pedido dp 
    WHERE dp.id_plato = p.id_plato
);


-- ============================================================================
-- CONSULTA 8: Clientes de alto valor
-- TEMA: Subconsulta correlacionada con operador EXISTS
-- PROPÓSITO: Identificar clientes que hayan realizado al menos un pedido superior a $25.00 USD.
-- ============================================================================
SELECT 
    c.id_cliente,
    c.nombre,
    c.cedula,
    c.telefono
FROM clientes c
WHERE EXISTS (
    SELECT 1 
    FROM pedidos ped 
    WHERE ped.id_cliente = c.id_cliente 
      AND ped.total >= 25.00
)
ORDER BY c.nombre ASC;


-- ============================================================================
-- CONSULTA 9: Búsqueda dinámica con funciones de texto, fecha y formato
-- TEMA: LIKE/ILIKE, CONCAT, TO_CHAR, AGE y CAST
-- PROPÓSITO: Buscar reservas próximas con datos concatenados y cálculo de tiempo restante.
-- ============================================================================
SELECT 
    r.id_reserva,
    CONCAT(c.nombre, ' (CI: ', c.cedula, ')') AS cliente_info,
    CONCAT('Mesa #', m.numero, ' [Capacidad: ', m.capacidad, ' personas]') AS mesa_info,
    TO_CHAR(r.fecha_hora, 'DD/MM/YYYY HH12:MI AM') AS fecha_reserva_formateada,
    r.num_personas,
    r.estado
FROM reservas r
INNER JOIN clientes c ON r.id_cliente = c.id_cliente
INNER JOIN mesas m ON r.id_mesa = m.id_mesa
WHERE c.nombre ILIKE '%Torres%' OR c.nombre ILIKE '%Solano%'
ORDER BY r.fecha_hora ASC;


-- ============================================================================
-- CONSULTA 10: VISTAS REUTILIZABLES PARA REPORTES DEL SISTEMA
-- TEMA: CREATE VIEW, consultas complejas encapsuladas
-- ============================================================================

-- VISTA 1: v_platos_mas_vendidos
-- Encapsula el cálculo de unidades vendidas y recaudación por plato.
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

-- VISTA 2: v_ventas_por_mes
-- Agrupa la facturación por año y mes con ticket promedio.
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

-- Demostración de consulta sobre las vistas creadas:
SELECT * FROM v_platos_mas_vendidos LIMIT 5;
SELECT * FROM v_ventas_por_mes;
