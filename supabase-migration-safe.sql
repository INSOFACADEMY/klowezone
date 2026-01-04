-- =====================================================
-- SUPABASE MIGRATION SAFE - Multi-Tenant Base Tables
-- Ejecutar en Supabase SQL Editor
-- Versión segura con IF NOT EXISTS
-- =====================================================

-- =====================================================
-- 1. MODIFICACIONES A TABLAS EXISTENTES
-- =====================================================

-- Agregar columna active_org_id a user_profiles (no podemos modificar auth.users)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS active_org_id TEXT;

-- Crear índice para la nueva columna
CREATE INDEX IF NOT EXISTS idx_user_profiles_active_org_id ON user_profiles(active_org_id);

-- =====================================================
-- 2. ENUM PARA ROLES
-- =====================================================

-- Crear enum si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'org_role') THEN
        CREATE TYPE org_role AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER');
    END IF;
END $$;

-- =====================================================
-- 3. TABLAS MULTI-TENANT
-- =====================================================

-- Tabla: organizations
CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    logo TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: organization_members
CREATE TABLE IF NOT EXISTS organization_members (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role org_role NOT NULL DEFAULT 'MEMBER',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. ÍNDICES Y CONSTRAINTS
-- =====================================================

-- Índices únicos
CREATE UNIQUE INDEX IF NOT EXISTS organizations_slug_key ON organizations(slug);
CREATE UNIQUE INDEX IF NOT EXISTS organization_members_organization_id_user_id_key ON organization_members(organization_id, user_id);

-- Índices de performance
CREATE INDEX IF NOT EXISTS organizations_is_active_idx ON organizations(is_active);
CREATE INDEX IF NOT EXISTS organizations_created_at_idx ON organizations(created_at DESC);

CREATE INDEX IF NOT EXISTS organization_members_organization_id_idx ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS organization_members_user_id_idx ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS organization_members_role_idx ON organization_members(role);
CREATE INDEX IF NOT EXISTS organization_members_joined_at_idx ON organization_members(joined_at DESC);

-- =====================================================
-- 5. POLÍTICAS RLS
-- =====================================================

-- Función helper para crear políticas
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

-- Habilitar RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

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
    'FOR INSERT WITH CHECK (true)'
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
-- 6. TRIGGERS
-- =====================================================

-- Función para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para tablas multi-tenant
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Confirmar que todo se creó correctamente
SELECT
    'MULTI-TENANT SETUP COMPLETED' as status,
    NOW() as completed_at;

-- Contar tablas creadas
SELECT
    'organizations' as table_name,
    COUNT(*) as records
FROM organizations
UNION ALL
SELECT
    'organization_members' as table_name,
    COUNT(*) as records
FROM organization_members;

-- Verificar políticas
SELECT
    'RLS POLICIES' as type,
    COUNT(*) as count
FROM pg_policies
WHERE tablename IN ('organizations', 'organization_members');

-- =====================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================
