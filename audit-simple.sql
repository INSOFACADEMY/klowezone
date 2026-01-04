-- =====================================================
-- AUDITORÍA SIMPLE Y SEGURA - KLOWEZONE
-- Ejecutar en Supabase SQL Editor
-- =====================================================

\echo '=== TABLAS EXISTENTES ==='
SELECT
    schemaname as schema,
    tablename as table_name,
    tableowner as owner,
    CASE WHEN rowsecurity THEN 'RLS ✅' ELSE 'RLS ❌' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'user_profiles', 'clientes', 'proyectos', 'organizations', 'organization_members')
ORDER BY tablename;

\echo '=== REGISTROS POR TABLA ==='
SELECT 'profiles' as tabla, COUNT(*) as registros FROM profiles
UNION ALL
SELECT 'user_profiles' as tabla, COUNT(*) as registros FROM user_profiles
UNION ALL
SELECT 'clientes' as tabla, COUNT(*) as registros FROM clientes
UNION ALL
SELECT 'proyectos' as tabla, COUNT(*) as registros FROM proyectos
UNION ALL
SELECT 'organizations' as tabla, COUNT(*) as registros FROM organizations
UNION ALL
SELECT 'organization_members' as tabla, COUNT(*) as registros FROM organization_members;

\echo '=== POLÍTICAS RLS ==='
SELECT
    tablename as tabla,
    policyname as politica,
    cmd as operacion
FROM pg_policies
WHERE tablename IN ('profiles', 'user_profiles', 'clientes', 'proyectos', 'organizations', 'organization_members')
ORDER BY tablename, policyname;

\echo '=== TRIGGERS ==='
SELECT
    event_object_table as tabla,
    trigger_name as trigger,
    event_manipulation as evento
FROM information_schema.triggers
WHERE event_object_table IN ('profiles', 'user_profiles', 'clientes', 'proyectos', 'organizations', 'organization_members')
ORDER BY event_object_table;

\echo '=== ÍNDICES ==='
SELECT
    tablename as tabla,
    indexname as indice,
    CASE
        WHEN indexname LIKE 'idx_%' THEN 'CUSTOM ✅'
        WHEN indexname LIKE '%_pkey' THEN 'PRIMARY ✅'
        ELSE 'SYSTEM'
    END as tipo
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'user_profiles', 'clientes', 'proyectos', 'organizations', 'organization_members')
ORDER BY tablename;

\echo '=== MULTI-TENANT CHECK ==='
SELECT
    'Columna active_org_id existe' as check_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles'
        AND column_name = 'active_org_id'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

\echo '=== RESUMEN ==='
WITH stats AS (
    SELECT
        (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('profiles', 'user_profiles', 'clientes', 'proyectos', 'organizations', 'organization_members')) as tablas,
        (SELECT COUNT(*) FROM pg_policies WHERE tablename IN ('profiles', 'user_profiles', 'clientes', 'proyectos', 'organizations', 'organization_members')) as politicas,
        (SELECT COUNT(*) FROM information_schema.triggers WHERE event_object_table IN ('profiles', 'user_profiles', 'clientes', 'proyectos', 'organizations', 'organization_members')) as triggers
)
SELECT
    'TABLAS: ' || tablas || ' (esperado: 6)' as resumen,
    'POLÍTICAS: ' || politicas || ' (esperado: 16+)' as resumen2,
    'TRIGGERS: ' || triggers || ' (esperado: 5+)' as resumen3
FROM stats;

\echo '=== ✅ AUDITORÍA COMPLETADA ==='
