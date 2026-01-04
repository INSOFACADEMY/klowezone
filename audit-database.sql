-- =====================================================
-- DATABASE AUDIT - Verificación Completa de Setup
-- Ejecutar en Supabase SQL Editor después del setup
-- =====================================================

-- =====================================================
-- 1. VERIFICACIÓN DE TABLAS EXISTENTES
-- =====================================================

SELECT
    'TABLAS EXISTENTES' as audit_section,
    schemaname as schema,
    tablename as table_name,
    tableowner as owner,
    CASE
        WHEN rowsecurity THEN 'RLS ENABLED ✅'
        ELSE 'RLS DISABLED ⚠️'
    END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
    'profiles', 'user_profiles', 'clientes', 'proyectos',
    'organizations', 'organization_members'
)
ORDER BY tablename;

-- =====================================================
-- 2. VERIFICACIÓN DE COLUMNAS Y TIPOS DE DATOS
-- =====================================================

SELECT
    'COLUMNAS Y TIPOS' as audit_section,
    table_name,
    column_name,
    data_type,
    is_nullable,
    CASE
        WHEN column_name = 'active_org_id' THEN 'MULTI-TENANT KEY ✅'
        WHEN column_name LIKE '%_id' THEN 'FOREIGN KEY 🔗'
        WHEN column_name = 'created_at' THEN 'AUDIT FIELD 📅'
        WHEN column_name = 'updated_at' THEN 'AUDIT FIELD 📅'
        ELSE 'REGULAR FIELD 📝'
    END as field_type
FROM information_schema.columns
WHERE table_name IN (
    'profiles', 'user_profiles', 'clientes', 'proyectos',
    'organizations', 'organization_members'
)
AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- =====================================================
-- 3. VERIFICACIÓN DE ÍNDICES
-- =====================================================

SELECT
    'ÍNDICES CREADOS' as audit_section,
    schemaname as schema,
    tablename as table,
    indexname as index_name,
    CASE
        WHEN indexname LIKE 'idx_%' THEN 'CUSTOM INDEX ✅'
        WHEN indexname LIKE '%_pkey' THEN 'PRIMARY KEY ✅'
        WHEN indexname LIKE '%_key' THEN 'UNIQUE CONSTRAINT ✅'
        ELSE 'SYSTEM INDEX 📊'
    END as index_type
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN (
    'profiles', 'user_profiles', 'clientes', 'proyectos',
    'organizations', 'organization_members'
)
ORDER BY tablename, indexname;

-- =====================================================
-- 4. VERIFICACIÓN DE FOREIGN KEYS
-- =====================================================

SELECT
    'FOREIGN KEYS' as audit_section,
    tc.table_name as from_table,
    kcu.column_name as from_column,
    ccu.table_name as to_table,
    ccu.column_name as to_column,
    CASE
        WHEN ccu.table_name = 'auth.users' THEN 'AUTH REFERENCE ✅'
        WHEN ccu.table_name = 'organizations' THEN 'ORG REFERENCE ✅'
        ELSE 'TABLE REFERENCE 🔗'
    END as reference_type
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN (
      'profiles', 'user_profiles', 'clientes', 'proyectos',
      'organizations', 'organization_members'
  )
ORDER BY tc.table_name, kcu.column_name;

-- =====================================================
-- 5. VERIFICACIÓN DE POLÍTICAS RLS
-- =====================================================

SELECT
    'POLÍTICAS RLS' as audit_section,
    schemaname as schema,
    tablename as table,
    policyname as policy,
    permissive,
    roles,
    cmd as operation,
    CASE
        WHEN policyname LIKE '%view%' THEN 'READ ACCESS 👁️'
        WHEN policyname LIKE '%insert%' THEN 'CREATE ACCESS ➕'
        WHEN policyname LIKE '%update%' THEN 'UPDATE ACCESS ✏️'
        WHEN policyname LIKE '%delete%' THEN 'DELETE ACCESS 🗑️'
        ELSE 'OTHER ACCESS ❓'
    END as access_type
FROM pg_policies
WHERE tablename IN (
    'profiles', 'user_profiles', 'clientes', 'proyectos',
    'organizations', 'organization_members'
)
ORDER BY tablename, policyname;

-- =====================================================
-- 6. VERIFICACIÓN DE TRIGGERS
-- =====================================================

SELECT
    'TRIGGERS' as audit_section,
    event_object_table as table_name,
    trigger_name,
    event_manipulation as trigger_event,
    action_statement as action,
    CASE
        WHEN trigger_name LIKE '%updated_at%' THEN 'AUDIT TRIGGER ✅'
        ELSE 'CUSTOM TRIGGER ⚙️'
    END as trigger_type
FROM information_schema.triggers
WHERE event_object_table IN (
    'profiles', 'user_profiles', 'clientes', 'proyectos',
    'organizations', 'organization_members'
)
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- 7. VERIFICACIÓN DE UNIQUE CONSTRAINTS
-- =====================================================

SELECT
    'UNIQUE CONSTRAINTS' as audit_section,
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    CASE
        WHEN tc.constraint_name LIKE '%_pkey' THEN 'PRIMARY KEY 🔑'
        WHEN tc.constraint_name LIKE '%_key' THEN 'UNIQUE CONSTRAINT 🎯'
        ELSE 'COMPOSITE UNIQUE 🔗'
    END as constraint_type
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE')
  AND tc.table_name IN (
      'profiles', 'user_profiles', 'clientes', 'proyectos',
      'organizations', 'organization_members'
  )
ORDER BY tc.table_name, tc.constraint_name;

-- =====================================================
-- 8. VERIFICACIÓN DE DATOS DE PRUEBA
-- =====================================================

SELECT
    'REGISTROS POR TABLA' as audit_section,
    'profiles' as table_name,
    COUNT(*) as record_count
FROM profiles
UNION ALL
SELECT
    'REGISTROS POR TABLA' as audit_section,
    'user_profiles' as table_name,
    COUNT(*) as record_count
FROM user_profiles
UNION ALL
SELECT
    'REGISTROS POR TABLA' as audit_section,
    'clientes' as table_name,
    COUNT(*) as record_count
FROM clientes
UNION ALL
SELECT
    'REGISTROS POR TABLA' as audit_section,
    'proyectos' as table_name,
    COUNT(*) as record_count
FROM proyectos
UNION ALL
SELECT
    'REGISTROS POR TABLA' as audit_section,
    'organizations' as table_name,
    COUNT(*) as record_count
FROM organizations
UNION ALL
SELECT
    'REGISTROS POR TABLA' as audit_section,
    'organization_members' as table_name,
    COUNT(*) as record_count
FROM organization_members;

-- =====================================================
-- 9. VERIFICACIÓN DE MULTI-TENANT READINESS
-- =====================================================

-- Verificar columna active_org_id
SELECT
    'MULTI-TENANT STATUS' as audit_section,
    'active_org_id column' as check_name,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'user_profiles'
            AND column_name = 'active_org_id'
        ) THEN 'EXISTS ✅'
        ELSE 'MISSING ❌'
    END as status
UNION ALL
-- Verificar tabla organizations
SELECT
    'MULTI-TENANT STATUS' as audit_section,
    'organizations table' as check_name,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_name = 'organizations'
        ) THEN 'EXISTS ✅'
        ELSE 'MISSING ❌'
    END as status
UNION ALL
-- Verificar tabla organization_members
SELECT
    'MULTI-TENANT STATUS' as audit_section,
    'organization_members table' as check_name,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_name = 'organization_members'
        ) THEN 'EXISTS ✅'
        ELSE 'MISSING ❌'
    END as status
UNION ALL
-- Verificar RLS en organizations
SELECT
    'MULTI-TENANT STATUS' as audit_section,
    'organizations RLS' as check_name,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM pg_tables
            WHERE tablename = 'organizations' AND rowsecurity = true
        ) THEN 'ENABLED ✅'
        ELSE 'DISABLED ❌'
    END as status
UNION ALL
-- Verificar RLS en organization_members
SELECT
    'MULTI-TENANT STATUS' as audit_section,
    'organization_members RLS' as check_name,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM pg_tables
            WHERE tablename = 'organization_members' AND rowsecurity = true
        ) THEN 'ENABLED ✅'
        ELSE 'DISABLED ❌'
    END as status;

-- =====================================================
-- 10. VERIFICACIÓN DE FUNCIONES HELPER
-- =====================================================

SELECT
    'HELPER FUNCTIONS' as audit_section,
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments,
    CASE
        WHEN proname = 'create_policy_if_not_exists' THEN 'POLICY CREATOR ✅'
        WHEN proname = 'update_updated_at_column' THEN 'AUDIT TRIGGER ✅'
        ELSE 'CUSTOM FUNCTION ⚙️'
    END as function_type
FROM pg_proc
WHERE proname IN ('create_policy_if_not_exists', 'update_updated_at_column', 'setup_updated_at_triggers', 'create_all_triggers')
ORDER BY proname;

-- =====================================================
-- RESUMEN EJECUTIVO
-- =====================================================

-- Contar elementos por categoría
WITH audit_counts AS (
    SELECT 'TABLAS' as category, COUNT(*) as count FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('profiles', 'user_profiles', 'clientes', 'proyectos', 'organizations', 'organization_members')
    UNION ALL
    SELECT 'POLÍTICAS RLS' as category, COUNT(*) as count FROM pg_policies WHERE tablename IN ('profiles', 'user_profiles', 'clientes', 'proyectos', 'organizations', 'organization_members')
    UNION ALL
    SELECT 'TRIGGERS' as category, COUNT(*) as count FROM information_schema.triggers WHERE event_object_table IN ('profiles', 'user_profiles', 'clientes', 'proyectos', 'organizations', 'organization_members')
    UNION ALL
    SELECT 'ÍNDICES' as category, COUNT(*) as count FROM pg_indexes WHERE schemaname = 'public' AND tablename IN ('profiles', 'user_profiles', 'clientes', 'proyectos', 'organizations', 'organization_members') AND indexname LIKE 'idx_%'
)
SELECT
    'RESUMEN EJECUTIVO' as audit_section,
    category,
    count as quantity,
    CASE
        WHEN category = 'TABLAS' AND count = 6 THEN '✅ COMPLETO'
        WHEN category = 'POLÍTICAS RLS' AND count >= 16 THEN '✅ COMPLETO'
        WHEN category = 'TRIGGERS' AND count >= 5 THEN '✅ COMPLETO'
        WHEN category = 'ÍNDICES' AND count >= 10 THEN '✅ COMPLETO'
        ELSE '⚠️ VERIFICAR'
    END as status
FROM audit_counts
ORDER BY
    CASE category
        WHEN 'TABLAS' THEN 1
        WHEN 'POLÍTICAS RLS' THEN 2
        WHEN 'TRIGGERS' THEN 3
        WHEN 'ÍNDICES' THEN 4
    END;

-- =====================================================
-- AUDITORÍA COMPLETADA
-- =====================================================

-- Si todo muestra ✅ entonces la base de datos está correctamente configurada
-- Si hay algún ❌ o ⚠️ entonces revisar la configuración
