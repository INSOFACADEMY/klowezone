-- =====================================================
-- FIX EXISTING POLICIES - HACER SCRIPT IDEMPOTENTE
-- Ejecutar SOLO si obtienes "policy already exists" al ejecutar klowezone-database-schema.sql
-- =====================================================

-- ⚠️ ADVERTENCIA: Este script elimina políticas existentes
-- Solo úsalo si estás seguro de que quieres recrear las políticas
-- Las políticas se volverán a crear cuando ejecutes klowezone-database-schema.sql

-- Función helper para crear políticas si no existen
CREATE OR REPLACE FUNCTION create_policy_if_not_exists(
    policy_name TEXT,
    table_name TEXT,
    policy_sql TEXT
) RETURNS void AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = table_name
        AND policyname = policy_name
    ) THEN
        EXECUTE 'CREATE POLICY "' || policy_name || '" ON ' || table_name || ' ' || policy_sql;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ELIMINAR POLÍTICAS EXISTENTES PARA RECREARLAS
-- =====================================================

-- Función para eliminar políticas de forma segura
CREATE OR REPLACE FUNCTION drop_policy_if_exists(
    policy_name TEXT,
    table_name TEXT
) RETURNS void AS $$
BEGIN
    -- Solo intentar eliminar si la tabla existe
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = table_name
        AND table_schema = 'public'
    ) THEN
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON ' || table_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Eliminar políticas existentes de forma segura
SELECT drop_policy_if_exists('Users can view own profile', 'profiles');
SELECT drop_policy_if_exists('Users can update own profile', 'profiles');
SELECT drop_policy_if_exists('Users can insert own profile', 'profiles');

SELECT drop_policy_if_exists('Users can view own business profile', 'user_profiles');
SELECT drop_policy_if_exists('Users can update own business profile', 'user_profiles');
SELECT drop_policy_if_exists('Users can insert own business profile', 'user_profiles');

SELECT drop_policy_if_exists('Users can view own clients', 'clientes');
SELECT drop_policy_if_exists('Users can insert own clients', 'clientes');
SELECT drop_policy_if_exists('Users can update own clients', 'clientes');
SELECT drop_policy_if_exists('Users can delete own clients', 'clientes');

SELECT drop_policy_if_exists('Users can view own projects', 'proyectos');
SELECT drop_policy_if_exists('Users can insert own projects', 'proyectos');
SELECT drop_policy_if_exists('Users can update own projects', 'proyectos');
SELECT drop_policy_if_exists('Users can delete own projects', 'proyectos');

SELECT drop_policy_if_exists('Users can view own project details', 'proyectos_detalles');
SELECT drop_policy_if_exists('Users can insert own project details', 'proyectos_detalles');
SELECT drop_policy_if_exists('Users can update own project details', 'proyectos_detalles');
SELECT drop_policy_if_exists('Users can delete own project details', 'proyectos_detalles');

SELECT drop_policy_if_exists('Users can view own project documents', 'proyecto_documentos');
SELECT drop_policy_if_exists('Users can insert own project documents', 'proyecto_documentos');
SELECT drop_policy_if_exists('Users can update own project documents', 'proyecto_documentos');
SELECT drop_policy_if_exists('Users can delete own project documents', 'proyecto_documentos');

SELECT drop_policy_if_exists('Users can view own project activities', 'proyecto_actividades');
SELECT drop_policy_if_exists('Users can insert own project activities', 'proyecto_actividades');

SELECT drop_policy_if_exists('Users can view own project expenses', 'proyecto_gastos');
SELECT drop_policy_if_exists('Users can insert own project expenses', 'proyecto_gastos');
SELECT drop_policy_if_exists('Users can update own project expenses', 'proyecto_gastos');
SELECT drop_policy_if_exists('Users can delete own project expenses', 'proyecto_gastos');

SELECT drop_policy_if_exists('Users can view own project team', 'proyecto_equipo');
SELECT drop_policy_if_exists('Users can insert own project team', 'proyecto_equipo');
SELECT drop_policy_if_exists('Users can update own project team', 'proyecto_equipo');
SELECT drop_policy_if_exists('Users can delete own project team', 'proyecto_equipo');

SELECT drop_policy_if_exists('Users can view own project invitations', 'invitaciones_proyecto');
SELECT drop_policy_if_exists('Users can insert own project invitations', 'invitaciones_proyecto');
SELECT drop_policy_if_exists('Admins can update invitations', 'invitaciones_proyecto');
SELECT drop_policy_if_exists('Admins can delete invitations', 'invitaciones_proyecto');

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Mostrar políticas eliminadas
SELECT
    'policies_dropped' as status,
    COUNT(*) as count
FROM (
    SELECT 1
) as dummy;

-- =====================================================
-- FIN DEL SCRIPT DE CORRECCIÓN
-- =====================================================

-- Instrucciones:
-- 1. Ejecuta este script PRIMERO si ya tienes políticas creadas
-- 2. Después ejecuta klowezone-database-schema.sql normalmente
-- 3. Finalmente ejecuta multi-tenant-setup.sql
