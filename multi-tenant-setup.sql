-- =====================================================
-- MULTI-TENANT BASE TABLES SETUP
-- Ejecutar en Supabase SQL Editor
-- Fecha: 2025-01-03
-- =====================================================

-- ⚠️ IMPORTANTE: Este script asume que ya tienes las tablas base de KloweZone
-- Si no has ejecutado klowezone-database-schema.sql primero, hazlo antes.

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
-- MODIFICACIONES A TABLAS EXISTENTES
-- =====================================================

-- Agregar columna active_org_id a la tabla auth.users si no existe
-- NOTA: En Supabase, los usuarios están en auth.users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'auth'
        AND table_name = 'users'
        AND column_name = 'active_org_id'
    ) THEN
        ALTER TABLE auth.users ADD COLUMN active_org_id TEXT;
        -- Crear índice para la nueva columna
        CREATE INDEX IF NOT EXISTS idx_auth_users_active_org ON auth.users(active_org_id);
    END IF;
END $$;

-- =====================================================
-- NUEVAS TABLAS MULTI-TENANT
-- =====================================================

-- Crear tabla organizations
CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    logo TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla organization_members
CREATE TABLE IF NOT EXISTS organization_members (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(organization_id, user_id)
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para organizations
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_active ON organizations(is_active);
CREATE INDEX IF NOT EXISTS idx_organizations_created_at ON organizations(created_at DESC);

-- Índices para organization_members
CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_role ON organization_members(role);
CREATE INDEX IF NOT EXISTS idx_organization_members_joined_at ON organization_members(joined_at DESC);

-- Índice para auth.users (ya creado arriba en el DO block)

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS para organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS para organization_members
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS DE SEGURIDAD
-- =====================================================

-- Políticas para organizations
SELECT create_policy_if_not_exists(
    'Members can view their organizations',
    'organizations',
    'FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_id = organizations.id
            AND user_id = auth.uid()
        )
    )'
);

SELECT create_policy_if_not_exists(
    'Owners can insert organizations',
    'organizations',
    'FOR INSERT WITH CHECK (true)' -- Permitir creación inicial, validar después
);

SELECT create_policy_if_not_exists(
    'Owners can update organizations',
    'organizations',
    'FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_id = organizations.id
            AND user_id = auth.uid()
            AND role = ''OWNER''
        )
    )'
);

SELECT create_policy_if_not_exists(
    'Owners can delete organizations',
    'organizations',
    'FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_id = organizations.id
            AND user_id = auth.uid()
            AND role = ''OWNER''
        )
    )'
);

-- Políticas para organization_members
SELECT create_policy_if_not_exists(
    'Members can view organization members',
    'organization_members',
    'FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
        )
    )'
);

SELECT create_policy_if_not_exists(
    'Users can join organizations',
    'organization_members',
    'FOR INSERT WITH CHECK (user_id = auth.uid())'
);

SELECT create_policy_if_not_exists(
    'Admins can manage members',
    'organization_members',
    'FOR ALL USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = organization_members.organization_id
            AND om.user_id = auth.uid()
            AND om.role IN (''OWNER'', ''ADMIN'')
        )
    )'
);

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Función para actualizar updated_at (asegurarse de que existe)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para organizations
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DATOS DE PRUEBA (OPCIONAL)
-- =====================================================

-- Insertar una organización de ejemplo (descomenta si quieres datos de prueba)
/*
INSERT INTO organizations (name, slug, description) VALUES
('Mi Empresa Demo', 'mi-empresa-demo', 'Organización de ejemplo para testing')
ON CONFLICT (slug) DO NOTHING;
*/

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar que la columna active_org_id existe en auth.users
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'auth'
AND table_name = 'users'
AND column_name = 'active_org_id';

-- Mostrar resumen de tablas multi-tenant
SELECT
    'organizations' as table_name,
    COUNT(*) as records
FROM organizations
UNION ALL
SELECT
    'organization_members' as table_name,
    COUNT(*) as records
FROM organization_members;

-- Mostrar políticas RLS creadas
SELECT
    schemaname,
    tablename,
    policyname,
    cmd as operation,
    LEFT(qual, 100) || '...' as condition
FROM pg_policies
WHERE tablename IN ('organizations', 'organization_members')
ORDER BY tablename, policyname;

-- Verificar índices creados
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('organizations', 'organization_members')
OR (schemaname = 'auth' AND tablename = 'users' AND indexname LIKE '%active_org%')
ORDER BY tablename, indexname;

-- =====================================================
-- FIN DEL SCRIPT MULTI-TENANT
-- =====================================================

-- Instrucciones de ejecución:
-- 1. PRIMERO: Ejecuta klowezone-database-schema.sql (tablas base)
-- 2. SEGUNDO: Ejecuta este script (multi-tenant-setup.sql)
-- 3. Verifica que no hay errores en la ejecución
-- 4. Las queries de verificación se ejecutan automáticamente al final

-- Resultado esperado:
-- ✅ Columna active_org_id agregada a auth.users
-- ✅ Tabla organizations creada
-- ✅ Tabla organization_members creada
-- ✅ Políticas RLS activas (7 políticas)
-- ✅ Índices de performance creados

-- Testing rápido:
-- INSERT INTO organizations (name, slug) VALUES ('Test Org', 'test-org');
-- SELECT * FROM organizations; -- Debería mostrar 1 registro
