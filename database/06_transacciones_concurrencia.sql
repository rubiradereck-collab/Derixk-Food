-- ============================================================================
-- PROYECTO INTEGRADOR: SISTEMA DE GESTIÓN DE RESTAURANTE
-- MATERIAS: Tecnologías Web & Administración de Bases de Datos (5to Nivel - UTMACH)
-- ARCHIVO: 06_transacciones_concurrencia.sql
-- DESCRIPCIÓN: Control transaccional ACID (COMMIT/ROLLBACK) y guía de concurrencia/bloqueos en pgAdmin 4.
-- ============================================================================

-- ============================================================================
-- SECCIÓN 1: DEMOSTRACIÓN DE ATOMICIDAD (ACID) CON COMMIT Y ROLLBACK
-- ============================================================================

-- EJEMPLO 1.1: Transacción Atómica Exitosa (COMMIT)
-- Objetivo: Garantizar que la cabecera del pedido, sus ítems y la mesa se actualicen todos juntos.
BEGIN;

    -- Paso 1: Ocupar la mesa 1
    UPDATE mesas SET estado = 'ocupada' WHERE id_mesa = 1;

    -- Paso 2: Crear el pedido
    INSERT INTO pedidos (id_pedido, id_cliente, id_mesa, id_usuario, fecha_hora, estado, total)
    VALUES (100, 2, 1, 2, CURRENT_TIMESTAMP, 'pendiente', 0.00);

    -- Paso 3: Agregar ítems al pedido (el trigger descontará stock automáticamente)
    INSERT INTO detalle_pedido (id_pedido, id_plato, cantidad, precio_unitario, subtotal)
    VALUES (100, 1, 2, 4.50, 9.00);

    INSERT INTO detalle_pedido (id_pedido, id_plato, cantidad, precio_unitario, subtotal)
    VALUES (100, 11, 2, 2.50, 5.00);

    -- Paso 4: Actualizar el total consolidado
    UPDATE pedidos 
    SET total = (SELECT SUM(subtotal) FROM detalle_pedido WHERE id_pedido = 100)
    WHERE id_pedido = 100;

COMMIT; -- Todo se guarda de manera definitiva e íntegra.

-- Verificar resultado:
SELECT * FROM pedidos WHERE id_pedido = 100;
SELECT * FROM detalle_pedido WHERE id_pedido = 100;


-- EJEMPLO 1.2: Transacción con Fallo Controlado y Recuperación (ROLLBACK)
-- Objetivo: Demostrar que ante un error de negocio (ej. falta de stock en el 2do ítem),
-- NINGUNA operación previa (ni cabecera ni mesa ocupada) queda guardada a medias (Atomicidad).
BEGIN;

    -- Paso 1: Intentar ocupar la mesa 3
    UPDATE mesas SET estado = 'ocupada' WHERE id_mesa = 3;

    -- Paso 2: Crear pedido temporal 101
    INSERT INTO pedidos (id_pedido, id_cliente, id_mesa, id_usuario, fecha_hora, estado, total)
    VALUES (101, 3, 3, 2, CURRENT_TIMESTAMP, 'pendiente', 0.00);

    -- Paso 3: Primer ítem válido
    INSERT INTO detalle_pedido (id_pedido, id_plato, cantidad, precio_unitario, subtotal)
    VALUES (101, 2, 1, 3.00, 3.00);

    -- Paso 4: Segundo ítem INVÁLIDO (forzamos un error por cantidad o id inexistente)
    -- Si intentáramos insertar un plato inexistente:
    -- INSERT INTO detalle_pedido (id_pedido, id_plato, cantidad, precio_unitario, subtotal)
    -- VALUES (101, 9999, 1, 5.00, 5.00);

-- Al producirse el error, ejecutamos ROLLBACK:
ROLLBACK; -- Deshace TODO: la mesa 3 sigue libre y el pedido 101 no existe.

-- Verificación de recuperación:
SELECT * FROM pedidos WHERE id_pedido = 101; -- Retorna 0 filas
SELECT estado FROM mesas WHERE id_mesa = 3;  -- Sigue 'libre'


-- ============================================================================
-- SECCIÓN 2: GUION DE CONCURRENCIA Y BLOQUEOS (EVIDENCIA CON 2 SESIONES PGADMIN)
-- ============================================================================
/*
INSTRUCCIONES PARA LA DEMOSTRACIÓN EN CLASE / SUSTENTACIÓN:
1. En pgAdmin 4, conéctate a 'restaurante_db'.
2. Abre dos ventanas de Query Tool independientes:
   - Pestaña 1: "Sesión A - Mesero 1"
   - Pestaña 2: "Sesión B - Mesero 2"
*/

-- ----------------------------------------------------------------------------
-- ESCENARIO: Dos meseros intentan ordenar concurrentemente el último plato en stock
-- Usaremos el plato con id_plato = 9 ('Caldo de Bola de Verde', stock = 1 para la prueba).
-- ----------------------------------------------------------------------------

-- Preparación inicial (ejecutar en cualquier sesión):
UPDATE platos SET stock = 1 WHERE id_plato = 9;

-- PASO 1 (En SESIÓN A - Mesero 1):
-- Inicia transacción y aplica BLOQUEO PESIMISTA sobre la fila del plato:
BEGIN;
SELECT id_plato, nombre, stock, precio 
FROM platos 
WHERE id_plato = 9 
FOR UPDATE; -- << Bloquea la fila en modo exclusivo para modificación
-- (NO hacer COMMIT todavía; dejar la sesión abierta)


-- PASO 2 (En SESIÓN B - Mesero 2):
-- El segundo mesero intenta acceder al mismo plato en modo concurrente:
BEGIN;
SELECT id_plato, nombre, stock, precio 
FROM platos 
WHERE id_plato = 9 
FOR UPDATE;
-- [OBSERVAR EN PGADMIN]: La Sesión B queda congelada (en estado de espera / bloqueada).


-- PASO 3 (En una TERCERA pestaña o sesión administrativa):
-- Consulta de monitoreo para mostrarle al docente quién bloquea a quién:
SELECT 
    blocked_locks.pid     AS pid_bloqueado,
    blocked_activity.usename  AS usuario_bloqueado,
    blocking_locks.pid    AS pid_bloqueador,
    blocking_activity.usename AS usuario_bloqueador,
    blocked_activity.query    AS consulta_en_espera
FROM  pg_catalog.pg_locks         blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks         blocking_locks 
    ON blocking_locks.locktype = blocked_locks.locktype
    AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
    AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
    AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
    AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
    AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
    AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
    AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
    AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
    AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
    AND blocking_locks.pid != blocked_locks.pid
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;


-- PASO 4 (En SESIÓN A):
-- El Mesero 1 descuenta la porción y confirma su transacción:
UPDATE platos SET stock = stock - 1 WHERE id_plato = 9;
COMMIT;


-- PASO 5 (En SESIÓN B):
-- En el instante en que Sesión A hace COMMIT, la Sesión B se libera automáticamente.
-- Ahora Sesión B lee el stock actualizado (= 0).
-- Al verificar que stock = 0, la lógica de negocio de la aplicación o el trigger
-- rechaza el pedido del Mesero 2, evitando venta de platos inexistentes.
ROLLBACK; -- Sesión B finaliza su intento


-- ============================================================================
-- SECCIÓN 3: SÍNTESIS TÉCNICA (CONTROL PESIMISTA VS. CONTROL OPTIMISTA)
-- ============================================================================
/*
1. CONTROL DE CONCURRENCIA PESIMISTA (Implementado arriba con SELECT ... FOR UPDATE):
   - Filosofía: Asume que las colisiones son frecuentes.
   - Mecanismo: Bloquea físicamente la fila en el motor de base de datos hasta que
     termine la transacción (COMMIT o ROLLBACK).
   - Aplicación: Ideal para stock crítico de inventario, asientos de avión o mesas de restaurante.

2. CONTROL DE CONCURRENCIA OPTIMISTA:
   - Filosofía: Asume que las colisiones son raras.
   - Mecanismo: No bloquea filas en lectura. Agrega una columna de control (ej. 'version INT').
     Al actualizar se valida: UPDATE platos SET precio = 5.0, version = version + 1 
                              WHERE id_plato = 1 AND version = 1;
     Si otra transacción modificó la versión antes, la sentencia afecta 0 filas (conflicto detectado),
     y el backend cancela la operación avisando al usuario que recargue los datos.
   - Aplicación: Ideal para sistemas de edición colaborativa o catálogos de alta lectura y baja escritura.
*/
