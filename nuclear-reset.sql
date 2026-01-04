-- =====================================================
-- NUCLEAR RESET - Limpieza Total y Recreación
-- Ejecutar ÚNICAMENTE si quieres empezar desde cero
-- ⚠️ ELIMINARÁ TODOS LOS DATOS EXISTENTES ⚠️
-- =====================================================

-- Paso 1: Eliminar TODO en orden inverso de dependencias
DROP TABLE IF EXISTS organization_members CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS invitaciones_proyecto CASCADE;
DROP TABLE IF EXISTS proyecto_equipo CASCADE;
DROP TABLE IF EXISTS proyecto_gastos CASCADE;
DROP TABLE IF EXISTS proyecto_actividades CASCADE;
DROP TABLE IF EXISTS proyecto_documentos CASCADE;
DROP TABLE IF EXISTS proyectos_detalles CASCADE;
DROP TABLE IF EXISTS proyectos CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Eliminar columna de auth.users
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'auth'
        AND table_name = 'users'
        AND column_name = 'active_org_id'
    ) THEN
        ALTER TABLE auth.users DROP COLUMN IF EXISTS active_org_id;
    END IF;
END $$;

-- Paso 2: Recrear desde cero - Ejecutar setup-complete-safe.sql después de este

-- =====================================================
-- VERIFICACIÓN DE LIMPIEZA
-- =====================================================

SELECT
    'Limpieza completada - Todas las tablas eliminadas' as status,
    NOW() as timestamp;

-- Instrucciones:
-- 1. Ejecuta este script para limpiar TODO
-- 2. Luego ejecuta setup-complete-safe.sql para recrear
-- 3. ⚠️ PERDERÁS TODOS LOS DATOS ⚠️
