-- =====================================================
-- KLOWEZONE COMPLETE DATABASE SETUP - 100% SAFE
-- Ejecutar en Supabase SQL Editor - Limpia y recrea todo
-- =====================================================

-- ⚠️ ADVERTENCIA: Este script limpia TODO y recrea desde cero
-- Solo úsalo si quieres empezar completamente limpio
-- Perderás TODOS los datos existentes

-- =====================================================
-- LIMPIEZA COMPLETA (opcional - descomenta si quieres limpiar)
-- =====================================================

-- Descomenta estas líneas SOLO si quieres eliminar TODO:
/*
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

-- Eliminar columna de auth.users si existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'auth'
        AND table_name = 'users'
        AND column_name = 'active_org_id'
    ) THEN
        ALTER TABLE auth.users DROP COLUMN active_org_id;
    END IF;
END $$;
*/

-- =====================================================
-- FUNCIONES HELPER
-- =====================================================

-- Función para crear políticas si no existen
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
-- TABLAS BASE
-- =====================================================

-- Tabla: profiles
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    nombre_completo TEXT,
    avatar_url TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: user_profiles
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    business_type TEXT NOT NULL CHECK (business_type IN ('Contabilidad', 'Diseño', 'Desarrollo de Software', 'Marketing', 'Consultoría', 'E-commerce', 'Educación', 'Salud', 'Legal', 'Construcción', 'Otro')),
    business_name TEXT NOT NULL,
    location TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'MXN' CHECK (currency IN ('MXN', 'USD', 'EUR', 'COP', 'PEN', 'ARS')),
    team_size TEXT NOT NULL CHECK (team_size IN ('Solo yo', '2-5 personas', '6-20 personas', '21-50 personas', 'Más de 50 personas')),
    primary_goals TEXT[] NOT NULL DEFAULT '{}' CHECK (
        array_length(primary_goals, 1) >= 1 AND
        primary_goals <@ ARRAY['Gestión de Clientes', 'Gestión de Proyectos', 'Facturación', 'Propuestas', 'Reportes', 'Colaboración', 'Automatización']
    ),
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: clientes
CREATE TABLE IF NOT EXISTS clientes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL,
    telefono TEXT,
    estado TEXT NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo', 'Pendiente')),
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: proyectos
CREATE TABLE IF NOT EXISTS proyectos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    nombre_proyecto TEXT NOT NULL,
    descripcion TEXT,
    estado TEXT NOT NULL DEFAULT 'Planificación' CHECK (estado IN ('Planificación', 'En Progreso', 'Completado', 'Pausado', 'Cancelado')),
    prioridad TEXT NOT NULL DEFAULT 'Media' CHECK (prioridad IN ('Baja', 'Media', 'Alta', 'Urgente')),
    fecha_entrega DATE,
    presupuesto_estimado DECIMAL(10,2),
    precio_venta DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_profiles_business_type ON user_profiles(business_type);
CREATE INDEX IF NOT EXISTS idx_user_profiles_location ON user_profiles(location);
CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding_completed ON user_profiles(onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_clientes_user_id ON clientes(user_id);
CREATE INDEX IF NOT EXISTS idx_clientes_estado ON clientes(estado);
CREATE INDEX IF NOT EXISTS idx_clientes_created_at ON clientes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_proyectos_user_id ON proyectos(user_id);
CREATE INDEX IF NOT EXISTS idx_proyectos_cliente_id ON proyectos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_proyectos_estado ON proyectos(estado);
CREATE INDEX IF NOT EXISTS idx_proyectos_prioridad ON proyectos(prioridad);
CREATE INDEX IF NOT EXISTS idx_proyectos_fecha_entrega ON proyectos(fecha_entrega);
CREATE INDEX IF NOT EXISTS idx_proyectos_created_at ON proyectos(created_at DESC);

-- =====================================================
-- RLS Y POLÍTICAS
-- =====================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE proyectos ENABLE ROW LEVEL SECURITY;

-- Políticas usando función helper
SELECT create_policy_if_not_exists('Users can view own profile', 'profiles', 'FOR SELECT USING (auth.uid() = id)');
SELECT create_policy_if_not_exists('Users can update own profile', 'profiles', 'FOR UPDATE USING (auth.uid() = id)');
SELECT create_policy_if_not_exists('Users can insert own profile', 'profiles', 'FOR INSERT WITH CHECK (auth.uid() = id)');

SELECT create_policy_if_not_exists('Users can view own business profile', 'user_profiles', 'FOR SELECT USING (auth.uid() = id)');
SELECT create_policy_if_not_exists('Users can update own business profile', 'user_profiles', 'FOR UPDATE USING (auth.uid() = id)');
SELECT create_policy_if_not_exists('Users can insert own business profile', 'user_profiles', 'FOR INSERT WITH CHECK (auth.uid() = id)');

SELECT create_policy_if_not_exists('Users can view own clients', 'clientes', 'FOR SELECT USING (auth.uid() = user_id)');
SELECT create_policy_if_not_exists('Users can insert own clients', 'clientes', 'FOR INSERT WITH CHECK (auth.uid() = user_id)');
SELECT create_policy_if_not_exists('Users can update own clients', 'clientes', 'FOR UPDATE USING (auth.uid() = user_id)');
SELECT create_policy_if_not_exists('Users can delete own clients', 'clientes', 'FOR DELETE USING (auth.uid() = user_id)');

SELECT create_policy_if_not_exists('Users can view own projects', 'proyectos', 'FOR SELECT USING (auth.uid() = user_id)');
SELECT create_policy_if_not_exists('Users can insert own projects', 'proyectos', 'FOR INSERT WITH CHECK (auth.uid() = user_id)');
SELECT create_policy_if_not_exists('Users can update own projects', 'proyectos', 'FOR UPDATE USING (auth.uid() = user_id)');
SELECT create_policy_if_not_exists('Users can delete own projects', 'proyectos', 'FOR DELETE USING (auth.uid() = user_id)');

-- =====================================================
-- TRIGGERS (eliminación agresiva primero)
-- =====================================================

-- Función placeholder (triggers se crean al final)
CREATE OR REPLACE FUNCTION setup_updated_at_triggers()
RETURNS void AS $$
BEGIN
    -- Los triggers se crean al final del script después de las tablas
    NULL;
END;
$$ LANGUAGE plpgsql;

-- Placeholder call
SELECT setup_updated_at_triggers();

-- =====================================================
-- MULTI-TENANT TABLES
-- =====================================================

-- Agregar columna active_org_id a user_profiles (no podemos modificar auth.users)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS active_org_id TEXT;

-- Tabla: organizations
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

-- Tabla: organization_members
CREATE TABLE IF NOT EXISTS organization_members (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- Índices multi-tenant
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_active ON organizations(is_active);
CREATE INDEX IF NOT EXISTS idx_organizations_created_at ON organizations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_role ON organization_members(role);
CREATE INDEX IF NOT EXISTS idx_organization_members_joined_at ON organization_members(joined_at DESC);

-- RLS multi-tenant
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Políticas multi-tenant
SELECT create_policy_if_not_exists('Members can view their organizations', 'organizations', 'FOR SELECT USING (EXISTS (SELECT 1 FROM organization_members WHERE organization_id = organizations.id AND user_id = auth.uid()))');
SELECT create_policy_if_not_exists('Owners can insert organizations', 'organizations', 'FOR INSERT WITH CHECK (true)');
SELECT create_policy_if_not_exists('Owners can update organizations', 'organizations', 'FOR UPDATE USING (EXISTS (SELECT 1 FROM organization_members WHERE organization_id = organizations.id AND user_id = auth.uid() AND role = ''OWNER''))');
SELECT create_policy_if_not_exists('Owners can delete organizations', 'organizations', 'FOR DELETE USING (EXISTS (SELECT 1 FROM organization_members WHERE organization_id = organizations.id AND user_id = auth.uid() AND role = ''OWNER''))');

SELECT create_policy_if_not_exists('Members can view organization members', 'organization_members', 'FOR SELECT USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()))');
SELECT create_policy_if_not_exists('Users can join organizations', 'organization_members', 'FOR INSERT WITH CHECK (user_id = auth.uid())');
SELECT create_policy_if_not_exists('Admins can manage members', 'organization_members', 'FOR ALL USING (EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = organization_members.organization_id AND om.user_id = auth.uid() AND om.role IN (''OWNER'', ''ADMIN'')))');

-- Trigger multi-tenant
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- CREACIÓN FINAL DE TODOS LOS TRIGGERS
-- =====================================================

-- Función para crear triggers de forma segura (después de que todas las tablas existan)
CREATE OR REPLACE FUNCTION create_all_triggers()
RETURNS void AS $$
BEGIN
    -- Triggers para tablas base
    DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
    CREATE TRIGGER update_profiles_updated_at
        BEFORE UPDATE ON profiles
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
    CREATE TRIGGER update_user_profiles_updated_at
        BEFORE UPDATE ON user_profiles
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS update_clientes_updated_at ON clientes;
    CREATE TRIGGER update_clientes_updated_at
        BEFORE UPDATE ON clientes
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS update_proyectos_updated_at ON proyectos;
    CREATE TRIGGER update_proyectos_updated_at
        BEFORE UPDATE ON proyectos
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    -- Triggers para tablas multi-tenant
    DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
    CREATE TRIGGER update_organizations_updated_at
        BEFORE UPDATE ON organizations
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

END;
$$ LANGUAGE plpgsql;

-- Crear todos los triggers al final
SELECT create_all_triggers();

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

-- Estado de todas las tablas
SELECT
    'profiles' as table_name,
    COUNT(*) as records
FROM profiles
UNION ALL
SELECT
    'user_profiles' as table_name,
    COUNT(*) as records
FROM user_profiles
UNION ALL
SELECT
    'clientes' as table_name,
    COUNT(*) as records
FROM clientes
UNION ALL
SELECT
    'proyectos' as table_name,
    COUNT(*) as records
FROM proyectos
UNION ALL
SELECT
    'organizations' as table_name,
    COUNT(*) as records
FROM organizations
UNION ALL
SELECT
    'organization_members' as table_name,
    COUNT(*) as records
FROM organization_members;

-- Políticas RLS activas
SELECT
    schemaname,
    tablename,
    policyname,
    cmd as operation
FROM pg_policies
WHERE tablename IN ('profiles', 'user_profiles', 'clientes', 'proyectos', 'organizations', 'organization_members')
ORDER BY tablename, policyname;

-- Columna active_org_id en user_profiles
SELECT
    'MULTI-TENANT COLUMN' as section,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles'
        AND column_name = 'active_org_id'
    ) THEN 'EXISTS - Ready for multi-tenant' ELSE 'MISSING - Check setup' END as status;

-- =====================================================
-- SETUP COMPLETADO
-- =====================================================

-- 🎉 ¡Base de datos lista para usar!
-- Todas las tablas, índices, políticas y triggers están configurados
