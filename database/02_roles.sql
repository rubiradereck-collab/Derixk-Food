-- ============================================================================
-- PROYECTO INTEGRADOR: SISTEMA DE GESTIÓN DE RESTAURANTE
-- MATERIAS: Tecnologías Web & Administración de Bases de Datos (5to Nivel - UTMACH)
-- ARCHIVO: 02_roles.sql
-- DESCRIPCIÓN: Creación de roles en PostgreSQL y asignación de privilegios (Principio de mínimo privilegio).
-- ============================================================================

-- 1. CREACIÓN DE ROLES (Idempotente)
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

-- 2. REVOCACIÓN PREVENTIVA DE PRIVILEGIOS PÚBLICOS
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC;

-- Conceder conexión a la base de datos a los roles
GRANT CONNECT ON DATABASE restaurante_db TO rol_admin, rol_mesero, rol_cocina, rol_solo_lectura;
GRANT USAGE ON SCHEMA public TO rol_admin, rol_mesero, rol_cocina, rol_solo_lectura;

-- ============================================================================
-- 3. ASIGNACIÓN DE PRIVILEGIOS POR ROL
-- ============================================================================

-- A. ROL ADMINISTRADOR: Control total sobre los objetos de la aplicación
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO rol_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO rol_admin;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO rol_admin;

-- B. ROL MESERO: Acceso operativo para toma de comandas y reservas
-- Solo lectura en catálogo de roles, categorías y platos
GRANT SELECT ON TABLE roles, categorias, platos TO rol_mesero;
-- Gestión de clientes, mesas, reservas y pedidos
GRANT SELECT, INSERT, UPDATE ON TABLE clientes, reservas, pedidos, detalle_pedido TO rol_mesero;
GRANT SELECT, UPDATE (estado) ON TABLE mesas TO rol_mesero;
-- Uso de secuencias para autoincrementales
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO rol_mesero;

-- C. ROL COCINA: Visualización de comandas y actualización de su fase
GRANT SELECT ON TABLE platos, categorias, detalle_pedido TO rol_cocina;
GRANT SELECT, UPDATE (estado) ON TABLE pedidos TO rol_cocina;

-- D. ROL SOLO LECTURA: Auditoría gerencial y generación de reportes
GRANT SELECT ON ALL TABLES IN SCHEMA public TO rol_solo_lectura;

-- ============================================================================
-- 4. CONSULTA DE VERIFICACIÓN DE PRIVILEGIOS (Para evidencia en pgAdmin 4)
-- ============================================================================
-- Esta consulta demuestra la matriz de permisos configurada:
SELECT 
    grantee AS rol,
    table_name AS tabla,
    string_agg(privilege_type, ', ' ORDER BY privilege_type) AS privilegios_otorgados
FROM information_schema.role_table_grants
WHERE table_schema = 'public' 
  AND grantee IN ('rol_admin', 'rol_mesero', 'rol_cocina', 'rol_solo_lectura')
GROUP BY grantee, table_name
ORDER BY grantee, table_name;
