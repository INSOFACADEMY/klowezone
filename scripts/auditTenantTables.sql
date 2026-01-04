-- =====================================================
-- AUDIT TENANT TABLES - Confirmación Multi-Tenant
-- Ejecutar en Supabase SQL Editor
-- Auditoría A.1 - Confirmación objetiva
-- =====================================================

\echo '🔍 AUDITORÍA A.1 - TABLAS MULTI-TENANT'
\echo '====================================='

-- 1. Verificar existencia de tablas
\echo ''
\echo '1. 📋 EXISTENCIA DE TABLAS:'

SELECT
    'organizations' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'organizations'
        AND table_schema = 'public'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT
    'organization_members' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'organization_members'
        AND table_schema = 'public'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- 2. Verificar columna activeOrgId (en user_profiles)
\echo ''
\echo '2. 📊 COLUMNA activeOrgId EN user_profiles:'

SELECT
    'active_org_id column in user_profiles' as check_item,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles'
        AND column_name = 'active_org_id'
        AND table_schema = 'public'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- 3. Verificar índices principales
\echo ''
\echo '3. 🔍 ÍNDICES PRINCIPALES:'

SELECT
    'organizations_slug_key (unique)' as index_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'organizations'
        AND indexname = 'organizations_slug_key'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT
    'organization_members_org_user_key (unique)' as index_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'organization_members'
        AND indexname = 'organization_members_organization_id_user_id_key'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT
    'organizations_is_active_idx' as index_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'organizations'
        AND indexname = 'organizations_is_active_idx'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT
    'organization_members_org_id_idx' as index_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'organization_members'
        AND indexname = 'organization_members_organization_id_idx'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- 4. Verificar foreign keys
\echo ''
\echo '4. 🔗 FOREIGN KEYS:'

SELECT
    'organization_members.organization_id → organizations.id' as foreign_key,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'organization_members'
        AND kcu.column_name = 'organization_id'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT
    'organization_members.user_id → auth.users.id' as foreign_key,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'organization_members'
        AND kcu.column_name = 'user_id'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- 5. Verificar RLS
\echo ''
\echo '5. 🛡️ ROW LEVEL SECURITY (RLS):'

SELECT
    'organizations RLS enabled' as rls_check,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_tables
        WHERE tablename = 'organizations'
        AND rowsecurity = true
    ) THEN '✅ ENABLED' ELSE '❌ DISABLED' END as status
UNION ALL
SELECT
    'organization_members RLS enabled' as rls_check,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_tables
        WHERE tablename = 'organization_members'
        AND rowsecurity = true
    ) THEN '✅ ENABLED' ELSE '❌ DISABLED' END as status;

-- 6. Verificar políticas RLS
\echo ''
\echo '6. 📋 POLÍTICAS RLS ACTIVAS:'

SELECT
    tablename as tabla,
    policyname as politica,
    CASE
        WHEN policyname LIKE '%view%' THEN '👁️ READ'
        WHEN policyname LIKE '%insert%' THEN '➕ CREATE'
        WHEN policyname LIKE '%update%' THEN '✏️ UPDATE'
        WHEN policyname LIKE '%delete%' THEN '🗑️ DELETE'
        ELSE '❓ OTHER'
    END as tipo_acceso
FROM pg_policies
WHERE tablename IN ('organizations', 'organization_members')
ORDER BY tablename, policyname;

-- 7. Contar registros actuales
\echo ''
\echo '7. 📈 REGISTROS ACTUALES:'

SELECT
    'organizations' as tabla,
    COUNT(*) as registros
FROM organizations
UNION ALL
SELECT
    'organization_members' as tabla,
    COUNT(*) as registros
FROM organization_members;

-- 8. Resumen ejecutivo
\echo ''
\echo '8. 🎯 RESUMEN EJECUTIVO - AUDITORÍA A.1:'

WITH audit_results AS (
    SELECT
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('organizations', 'organization_members')) as tablas_existentes,
        (SELECT COUNT(*) FROM pg_policies WHERE tablename IN ('organizations', 'organization_members')) as politicas_rls,
        (SELECT COUNT(*) FROM pg_indexes WHERE tablename IN ('organizations', 'organization_members') AND indexname LIKE '%key') as indices_unicos,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'active_org_id') as columna_activa
)
SELECT
    CASE
        WHEN tablas_existentes = 2 AND politicas_rls >= 6 AND indices_unicos >= 2 AND columna_activa = 1
        THEN '✅ AUDITORÍA A.1 - ÉXITO COMPLETO: Multi-tenant correctamente configurado'
        WHEN tablas_existentes = 2 AND columna_activa = 1
        THEN '⚠️ AUDITORÍA A.1 - PARCIAL: Tablas existen pero revisar índices/políticas'
        ELSE '❌ AUDITORÍA A.1 - FALLIDO: Configuración incompleta'
    END as resultado_final,
    'Tablas: ' || tablas_existentes || '/2 | Políticas: ' || politicas_rls || '+ | Índices: ' || indices_unicos || '+ | Columna: ' || columna_activa || '/1' as detalles
FROM audit_results;

\echo ''
\echo '====================================='
\echo '🏁 AUDITORÍA A.1 COMPLETADA'
\echo '====================================='
