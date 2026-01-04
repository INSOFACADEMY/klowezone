-- =====================================================
-- KLOWEZONE DATABASE SETUP - VERSIÓN SEGURA
-- Ejecutar en Supabase SQL Editor - 100% Idempotente
-- =====================================================

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

-- Función helper para crear triggers si no existen
CREATE OR REPLACE FUNCTION create_trigger_if_not_exists(
    trigger_name TEXT,
    table_name TEXT,
    trigger_sql TEXT
) RETURNS void AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = trigger_name
        AND tgrelid = (SELECT oid FROM pg_class WHERE relname = table_name)
    ) THEN
        EXECUTE 'CREATE TRIGGER ' || trigger_name || ' ' || trigger_sql;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TABLA: profiles (Perfiles de usuario básicos)
-- =====================================================

CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    nombre_completo TEXT,
    avatar_url TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);

-- RLS para profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
SELECT create_policy_if_not_exists(
    'Users can view own profile',
    'profiles',
    'FOR SELECT USING (auth.uid() = id)'
);

SELECT create_policy_if_not_exists(
    'Users can update own profile',
    'profiles',
    'FOR UPDATE USING (auth.uid() = id)'
);

SELECT create_policy_if_not_exists(
    'Users can insert own profile',
    'profiles',
    'FOR INSERT WITH CHECK (auth.uid() = id)'
);

-- =====================================================
-- TABLA: user_profiles (Perfiles de negocio extendidos)
-- =====================================================

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

-- Índices para user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_business_type ON user_profiles(business_type);
CREATE INDEX IF NOT EXISTS idx_user_profiles_location ON user_profiles(location);
CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding_completed ON user_profiles(onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at DESC);

-- RLS para user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para user_profiles
SELECT create_policy_if_not_exists(
    'Users can view own business profile',
    'user_profiles',
    'FOR SELECT USING (auth.uid() = id)'
);

SELECT create_policy_if_not_exists(
    'Users can update own business profile',
    'user_profiles',
    'FOR UPDATE USING (auth.uid() = id)'
);

SELECT create_policy_if_not_exists(
    'Users can insert own business profile',
    'user_profiles',
    'FOR INSERT WITH CHECK (auth.uid() = id)'
);

-- =====================================================
-- TABLA: clientes (Gestión de clientes)
-- =====================================================

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

-- Índices para clientes
CREATE INDEX IF NOT EXISTS idx_clientes_user_id ON clientes(user_id);
CREATE INDEX IF NOT EXISTS idx_clientes_estado ON clientes(estado);
CREATE INDEX IF NOT EXISTS idx_clientes_created_at ON clientes(created_at DESC);

-- RLS para clientes
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Políticas para clientes
SELECT create_policy_if_not_exists(
    'Users can view own clients',
    'clientes',
    'FOR SELECT USING (auth.uid() = user_id)'
);

SELECT create_policy_if_not_exists(
    'Users can insert own clients',
    'clientes',
    'FOR INSERT WITH CHECK (auth.uid() = user_id)'
);

SELECT create_policy_if_not_exists(
    'Users can update own clients',
    'clientes',
    'FOR UPDATE USING (auth.uid() = user_id)'
);

SELECT create_policy_if_not_exists(
    'Users can delete own clients',
    'clientes',
    'FOR DELETE USING (auth.uid() = user_id)'
);

-- =====================================================
-- TABLA: proyectos (Gestión de proyectos)
-- =====================================================

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

-- Índices para proyectos
CREATE INDEX IF NOT EXISTS idx_proyectos_user_id ON proyectos(user_id);
CREATE INDEX IF NOT EXISTS idx_proyectos_cliente_id ON proyectos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_proyectos_estado ON proyectos(estado);
CREATE INDEX IF NOT EXISTS idx_proyectos_prioridad ON proyectos(prioridad);
CREATE INDEX IF NOT EXISTS idx_proyectos_fecha_entrega ON proyectos(fecha_entrega);
CREATE INDEX IF NOT EXISTS idx_proyectos_created_at ON proyectos(created_at DESC);

-- RLS para proyectos
ALTER TABLE proyectos ENABLE ROW LEVEL SECURITY;

-- Políticas para proyectos
SELECT create_policy_if_not_exists(
    'Users can view own projects',
    'proyectos',
    'FOR SELECT USING (auth.uid() = user_id)'
);

SELECT create_policy_if_not_exists(
    'Users can insert own projects',
    'proyectos',
    'FOR INSERT WITH CHECK (auth.uid() = user_id)'
);

SELECT create_policy_if_not_exists(
    'Users can update own projects',
    'proyectos',
    'FOR UPDATE USING (auth.uid() = user_id)'
);

SELECT create_policy_if_not_exists(
    'Users can delete own projects',
    'proyectos',
    'FOR DELETE USING (auth.uid() = user_id)'
);

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at (creados de forma segura)
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

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Mostrar resumen de tablas creadas
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
FROM proyectos;

-- =====================================================
-- PRÓXIMO PASO: MULTI-TENANT
-- =====================================================

-- Después de ejecutar este script exitosamente,
-- ejecuta: multi-tenant-setup.sql

-- =====================================================
-- FIN DEL SCRIPT BASE
-- =====================================================
