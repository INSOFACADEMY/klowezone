-- =====================================================
-- KLOWEZONE DATABASE SCHEMA - Script Completo
-- Ejecutar en el SQL Editor de Supabase Dashboard
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

-- =====================================================
-- MULTI-TENANT BASE TABLES - SCRIPT SEPARADO
-- Ejecutar SOLO ESTA SECCIÓN si ya tienes la base de datos configurada
-- =====================================================

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
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);
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
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre_proyecto TEXT NOT NULL,
    descripcion TEXT,
    estado TEXT NOT NULL DEFAULT 'Planificación' CHECK (estado IN ('Planificación', 'En Progreso', 'Completado', 'Pausado', 'Cancelado')),
    prioridad TEXT DEFAULT 'Media' CHECK (prioridad IN ('Baja', 'Media', 'Alta', 'Urgente')),
    fecha_entrega DATE,
    presupuesto DECIMAL(10,2),
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

-- Triggers para actualizar updated_at en todas las tablas
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clientes_updated_at
    BEFORE UPDATE ON clientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proyectos_updated_at
    BEFORE UPDATE ON proyectos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para crear automáticamente un perfil cuando se registra un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insertar perfil básico
  INSERT INTO public.profiles (id, nombre_completo, email, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );

  -- Insertar perfil de negocio básico (será completado en onboarding)
  INSERT INTO public.user_profiles (id, business_type, business_name, location, currency, team_size, primary_goals, onboarding_completed)
  VALUES (
    NEW.id,
    'Otro', -- Valor temporal, se actualizará en onboarding
    COALESCE(NEW.raw_user_meta_data->>'business_name', 'Mi Negocio'), -- Valor temporal
    'México', -- Valor temporal
    'MXN', -- Valor por defecto
    'Solo yo', -- Valor temporal
    ARRAY['Gestión de Clientes', 'Gestión de Proyectos'], -- Valores temporales
    FALSE -- Onboarding no completado
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automáticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =====================================================
-- DATOS DE EJEMPLO (opcional - para testing)
-- =====================================================

-- Nota: Los siguientes INSERTs usarán el user_id del usuario que ejecute el script
-- Si quieres datos de ejemplo, ejecuta esto después de haber creado al menos un usuario

/*
-- Insertar datos de ejemplo para el usuario actual
INSERT INTO clientes (user_id, nombre, email, telefono, estado, notas) VALUES
    (auth.uid(), 'Empresa ABC S.A.', 'contacto@empresaabc.com', '+1234567890', 'Activo', 'Cliente potencial de gran tamaño'),
    (auth.uid(), 'Startup XYZ', 'info@startupxyz.com', '+0987654321', 'Pendiente', 'Startup innovadora en tecnología'),
    (auth.uid(), 'Consultora Digital', 'admin@consultoradigital.com', '+1122334455', 'Activo', 'Especialistas en transformación digital')
ON CONFLICT DO NOTHING;

INSERT INTO proyectos (cliente_id, user_id, nombre_proyecto, descripcion, estado, prioridad, fecha_entrega, presupuesto) VALUES
    ((SELECT id FROM clientes WHERE nombre = 'Empresa ABC S.A.' AND user_id = auth.uid() LIMIT 1), auth.uid(),
     'Sistema de Gestión Empresarial', 'Desarrollo de ERP completo para gestión empresarial', 'En Progreso', 'Alta', '2024-03-15', 15000.00),

    ((SELECT id FROM clientes WHERE nombre = 'Startup XYZ' AND user_id = auth.uid() LIMIT 1), auth.uid(),
     'Plataforma E-commerce', 'Desarrollo de tienda online con integración de pagos', 'Planificación', 'Media', '2024-04-30', 8500.00),

    ((SELECT id FROM clientes WHERE nombre = 'Consultora Digital' AND user_id = auth.uid() LIMIT 1), auth.uid(),
     'Auditoría de Seguridad', 'Revisión completa de seguridad informática', 'Completado', 'Urgente', '2024-01-20', 3200.00)
ON CONFLICT DO NOTHING;
*/

-- =====================================================
-- VISTAS ÚTILES (opcional)
-- =====================================================

-- Vista para ver proyectos con información del cliente
CREATE OR REPLACE VIEW proyectos_con_clientes AS
SELECT
    p.*,
    c.nombre as cliente_nombre,
    c.email as cliente_email,
    c.estado as cliente_estado
FROM proyectos p
LEFT JOIN clientes c ON p.cliente_id = c.id
WHERE p.user_id = auth.uid();

-- Vista para estadísticas de dashboard
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
    COUNT(DISTINCT c.id) as total_clientes,
    COUNT(DISTINCT p.id) as total_proyectos,
    COUNT(DISTINCT CASE WHEN p.estado = 'Completado' THEN p.id END) as proyectos_completados,
    COUNT(DISTINCT CASE WHEN p.estado = 'En Progreso' THEN p.id END) as proyectos_activos,
    SUM(p.presupuesto) as presupuesto_total
FROM clientes c
LEFT JOIN proyectos p ON c.id = p.cliente_id
WHERE c.user_id = auth.uid();

-- =====================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE profiles IS 'Perfiles de usuario básicos con información personal';
COMMENT ON TABLE user_profiles IS 'Perfiles de negocio extendidos con configuración empresarial';
COMMENT ON TABLE clientes IS 'Tabla de clientes del sistema Klowezone';
COMMENT ON TABLE proyectos IS 'Tabla de proyectos asociados a clientes';

COMMENT ON COLUMN profiles.id IS 'ID único del usuario (FK a auth.users)';
COMMENT ON COLUMN profiles.nombre_completo IS 'Nombre completo del usuario';
COMMENT ON COLUMN profiles.avatar_url IS 'URL del avatar del usuario';
COMMENT ON COLUMN profiles.email IS 'Email del usuario (duplicado de auth.users)';

COMMENT ON COLUMN user_profiles.id IS 'ID único del usuario (FK a auth.users)';
COMMENT ON COLUMN user_profiles.business_type IS 'Tipo de negocio/actividad principal';
COMMENT ON COLUMN user_profiles.business_name IS 'Nombre del negocio o empresa';
COMMENT ON COLUMN user_profiles.location IS 'Ubicación geográfica del negocio';
COMMENT ON COLUMN user_profiles.currency IS 'Moneda principal de operaciones';
COMMENT ON COLUMN user_profiles.team_size IS 'Tamaño del equipo de trabajo';
COMMENT ON COLUMN user_profiles.primary_goals IS 'Objetivos principales del negocio';
COMMENT ON COLUMN user_profiles.onboarding_completed IS 'Indica si el usuario completó el proceso de onboarding';

COMMENT ON COLUMN clientes.id IS 'ID único del cliente';
COMMENT ON COLUMN clientes.user_id IS 'ID del usuario propietario (FK a auth.users)';
COMMENT ON COLUMN clientes.nombre IS 'Nombre completo del cliente';
COMMENT ON COLUMN clientes.email IS 'Email de contacto del cliente';
COMMENT ON COLUMN clientes.telefono IS 'Número de teléfono del cliente';
COMMENT ON COLUMN clientes.estado IS 'Estado del cliente: Activo, Inactivo, Pendiente';
COMMENT ON COLUMN clientes.notas IS 'Notas adicionales sobre el cliente';

COMMENT ON COLUMN proyectos.id IS 'ID único del proyecto';
COMMENT ON COLUMN proyectos.cliente_id IS 'ID del cliente asociado (FK a clientes)';
COMMENT ON COLUMN proyectos.user_id IS 'ID del usuario propietario (FK a auth.users)';
COMMENT ON COLUMN proyectos.nombre_proyecto IS 'Nombre del proyecto';
COMMENT ON COLUMN proyectos.descripcion IS 'Descripción detallada del proyecto';
COMMENT ON COLUMN proyectos.estado IS 'Estado del proyecto: Planificación, En Progreso, Completado, Pausado, Cancelado';
COMMENT ON COLUMN proyectos.prioridad IS 'Prioridad del proyecto: Baja, Media, Alta, Urgente';
COMMENT ON COLUMN proyectos.fecha_entrega IS 'Fecha estimada de entrega';
COMMENT ON COLUMN proyectos.presupuesto IS 'Presupuesto asignado al proyecto';

-- =====================================================
-- SCRIPT ADICIONAL: USER_PROFILES (Onboarding)
-- =====================================================

-- Para agregar la funcionalidad de onboarding después de haber creado las tablas básicas,
-- ejecuta solo esta sección:

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

-- Política: Los usuarios solo pueden ver su propio perfil de negocio
CREATE POLICY "Users can view own business profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

-- Política: Los usuarios solo pueden actualizar su propio perfil de negocio
CREATE POLICY "Users can update own business profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Política: Los usuarios pueden insertar su propio perfil de negocio
CREATE POLICY "Users can insert own business profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Actualizar trigger para incluir user_profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insertar perfil básico
  INSERT INTO public.profiles (id, nombre_completo, email, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );

  -- Insertar perfil de negocio básico (será completado en onboarding)
  INSERT INTO public.user_profiles (id, business_type, business_name, location, currency, team_size, primary_goals, onboarding_completed)
  VALUES (
    NEW.id,
    'Otro', -- Valor temporal, se actualizará en onboarding
    COALESCE(NEW.raw_user_meta_data->>'business_name', 'Mi Negocio'), -- Valor temporal
    'México', -- Valor temporal
    'MXN', -- Valor por defecto
    'Solo yo', -- Valor temporal
    ARRAY['Gestión de Clientes', 'Gestión de Proyectos'], -- Valores temporales
    FALSE -- Onboarding no completado
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Agregar trigger para user_profiles
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Actualizar comentarios
COMMENT ON TABLE user_profiles IS 'Perfiles de negocio extendidos con configuración empresarial';
COMMENT ON COLUMN user_profiles.id IS 'ID único del usuario (FK a auth.users)';
COMMENT ON COLUMN user_profiles.business_type IS 'Tipo de negocio/actividad principal';
COMMENT ON COLUMN user_profiles.business_name IS 'Nombre del negocio o empresa';
COMMENT ON COLUMN user_profiles.location IS 'Ubicación geográfica del negocio';
COMMENT ON COLUMN user_profiles.currency IS 'Moneda principal de operaciones';
COMMENT ON COLUMN user_profiles.team_size IS 'Tamaño del equipo de trabajo';
COMMENT ON COLUMN user_profiles.primary_goals IS 'Objetivos principales del negocio';
COMMENT ON COLUMN user_profiles.onboarding_completed IS 'Indica si el usuario completo el proceso de onboarding';

-- =====================================================
-- FIN DEL SCRIPT ADICIONAL
-- =====================================================

-- =====================================================
-- TABLAS PARA ESCALAR - PROYECTOS AVANZADOS
-- =====================================================

-- =====================================================
-- TABLA: proyectos_detalles (Detalles avanzados de proyectos)
-- =====================================================

CREATE TABLE IF NOT EXISTS proyectos_detalles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    horas_estimadas DECIMAL(8,2),
    horas_reales DECIMAL(8,2) DEFAULT 0,
    equipo_ids UUID[] DEFAULT '{}', -- Array de IDs de usuarios invitados
    prioridad TEXT DEFAULT 'Media' CHECK (prioridad IN ('Baja', 'Media', 'Alta', 'Urgente')),
    complejidad TEXT DEFAULT 'Media' CHECK (complejidad IN ('Baja', 'Media', 'Alta', 'Muy Alta')),
    tecnologias TEXT[] DEFAULT '{}', -- Tecnologías/herramientas utilizadas
    notas_internas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para proyectos_detalles
CREATE INDEX IF NOT EXISTS idx_proyectos_detalles_proyecto_id ON proyectos_detalles(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_proyectos_detalles_user_id ON proyectos_detalles(user_id);
CREATE INDEX IF NOT EXISTS idx_proyectos_detalles_prioridad ON proyectos_detalles(prioridad);
CREATE INDEX IF NOT EXISTS idx_proyectos_detalles_created_at ON proyectos_detalles(created_at DESC);

-- RLS para proyectos_detalles
ALTER TABLE proyectos_detalles ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver detalles de sus propios proyectos
CREATE POLICY "Users can view own project details" ON proyectos_detalles
    FOR SELECT USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden crear detalles para sus propios proyectos
CREATE POLICY "Users can insert own project details" ON proyectos_detalles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios solo pueden actualizar detalles de sus propios proyectos
CREATE POLICY "Users can update own project details" ON proyectos_detalles
    FOR UPDATE USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden eliminar detalles de sus propios proyectos
CREATE POLICY "Users can delete own project details" ON proyectos_detalles
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- TABLA: tareas (Sistema de tareas por proyecto)
-- =====================================================

CREATE TABLE IF NOT EXISTS tareas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    asignado_a UUID REFERENCES auth.users(id), -- Puede ser null (sin asignar)
    estado TEXT NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'En Progreso', 'Completada', 'Bloqueada', 'Cancelada')),
    prioridad TEXT DEFAULT 'Media' CHECK (prioridad IN ('Baja', 'Media', 'Alta', 'Urgente')),
    fecha_limite TIMESTAMP WITH TIME ZONE,
    fecha_completada TIMESTAMP WITH TIME ZONE,
    tiempo_estimado INTERVAL, -- Ej: '4 hours', '2 days'
    tiempo_real INTERVAL,
    etiquetas TEXT[] DEFAULT '{}', -- Para categorización adicional
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para tareas
CREATE INDEX IF NOT EXISTS idx_tareas_proyecto_id ON tareas(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_tareas_user_id ON tareas(user_id);
CREATE INDEX IF NOT EXISTS idx_tareas_asignado_a ON tareas(asignado_a);
CREATE INDEX IF NOT EXISTS idx_tareas_estado ON tareas(estado);
CREATE INDEX IF NOT EXISTS idx_tareas_prioridad ON tareas(prioridad);
CREATE INDEX IF NOT EXISTS idx_tareas_fecha_limite ON tareas(fecha_limite);
CREATE INDEX IF NOT EXISTS idx_tareas_created_at ON tareas(created_at DESC);

-- RLS para tareas
ALTER TABLE tareas ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver tareas de sus propios proyectos
CREATE POLICY "Users can view own project tasks" ON tareas
    FOR SELECT USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden crear tareas para sus propios proyectos
CREATE POLICY "Users can insert own project tasks" ON tareas
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios solo pueden actualizar tareas de sus propios proyectos
CREATE POLICY "Users can update own project tasks" ON tareas
    FOR UPDATE USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden eliminar tareas de sus propios proyectos
CREATE POLICY "Users can delete own project tasks" ON tareas
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- TABLA: finanzas_proyecto (Gestión financiera de proyectos)
-- =====================================================

CREATE TABLE IF NOT EXISTS finanzas_proyecto (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    monto_total DECIMAL(12,2),
    gastos_ejecutados DECIMAL(12,2) DEFAULT 0,
    metodo_pago TEXT CHECK (metodo_pago IN ('Efectivo', 'Transferencia', 'Tarjeta de Crédito', 'PayPal', 'Stripe', 'Otro')),
    moneda TEXT NOT NULL DEFAULT 'MXN' CHECK (moneda IN ('MXN', 'USD', 'EUR', 'COP', 'PEN', 'ARS')),
    fecha_presupuesto TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notas_financieras TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para finanzas_proyecto
CREATE INDEX IF NOT EXISTS idx_finanzas_proyecto_proyecto_id ON finanzas_proyecto(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_finanzas_proyecto_user_id ON finanzas_proyecto(user_id);
CREATE INDEX IF NOT EXISTS idx_finanzas_proyecto_metodo_pago ON finanzas_proyecto(metodo_pago);
CREATE INDEX IF NOT EXISTS idx_finanzas_proyecto_moneda ON finanzas_proyecto(moneda);
CREATE INDEX IF NOT EXISTS idx_finanzas_proyecto_created_at ON finanzas_proyecto(created_at DESC);

-- RLS para finanzas_proyecto
ALTER TABLE finanzas_proyecto ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver finanzas de sus propios proyectos
CREATE POLICY "Users can view own project finances" ON finanzas_proyecto
    FOR SELECT USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden crear finanzas para sus propios proyectos
CREATE POLICY "Users can insert own project finances" ON finanzas_proyecto
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios solo pueden actualizar finanzas de sus propios proyectos
CREATE POLICY "Users can update own project finances" ON finanzas_proyecto
    FOR UPDATE USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden eliminar finanzas de sus propios proyectos
CREATE POLICY "Users can delete own project finances" ON finanzas_proyecto
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- FUNCIONES Y TRIGGERS PARA NUEVAS TABLAS
-- =====================================================

-- Triggers para actualizar updated_at en las nuevas tablas
CREATE TRIGGER update_proyectos_detalles_updated_at
    BEFORE UPDATE ON proyectos_detalles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tareas_updated_at
    BEFORE UPDATE ON tareas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_finanzas_proyecto_updated_at
    BEFORE UPDATE ON finanzas_proyecto
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMENTARIOS DE DOCUMENTACIÓN PARA NUEVAS TABLAS
-- =====================================================

COMMENT ON TABLE proyectos_detalles IS 'Detalles avanzados y configuración extendida de proyectos';
COMMENT ON TABLE tareas IS 'Sistema de gestión de tareas individuales por proyecto';
COMMENT ON TABLE finanzas_proyecto IS 'Gestión financiera y presupuestaria de proyectos';

COMMENT ON COLUMN proyectos_detalles.id IS 'ID único del detalle de proyecto';
COMMENT ON COLUMN proyectos_detalles.proyecto_id IS 'Referencia al proyecto principal';
COMMENT ON COLUMN proyectos_detalles.user_id IS 'ID del propietario del proyecto';
COMMENT ON COLUMN proyectos_detalles.horas_estimadas IS 'Horas estimadas para completar el proyecto';
COMMENT ON COLUMN proyectos_detalles.horas_reales IS 'Horas reales trabajadas en el proyecto';
COMMENT ON COLUMN proyectos_detalles.equipo_ids IS 'Array de IDs de usuarios colaboradores';
COMMENT ON COLUMN proyectos_detalles.prioridad IS 'Prioridad del proyecto (Baja, Media, Alta, Urgente)';
COMMENT ON COLUMN proyectos_detalles.complejidad IS 'Complejidad técnica del proyecto';
COMMENT ON COLUMN proyectos_detalles.tecnologias IS 'Array de tecnologías y herramientas utilizadas';
COMMENT ON COLUMN proyectos_detalles.notas_internas IS 'Notas internas del equipo sobre el proyecto';

COMMENT ON COLUMN tareas.id IS 'ID único de la tarea';
COMMENT ON COLUMN tareas.proyecto_id IS 'Proyecto al que pertenece la tarea';
COMMENT ON COLUMN tareas.user_id IS 'Propietario del proyecto (no necesariamente el asignado)';
COMMENT ON COLUMN tareas.titulo IS 'Título descriptivo de la tarea';
COMMENT ON COLUMN tareas.descripcion IS 'Descripción detallada de la tarea';
COMMENT ON COLUMN tareas.asignado_a IS 'Usuario asignado para ejecutar la tarea';
COMMENT ON COLUMN tareas.estado IS 'Estado actual de la tarea';
COMMENT ON COLUMN tareas.prioridad IS 'Prioridad de la tarea';
COMMENT ON COLUMN tareas.fecha_limite IS 'Fecha límite para completar la tarea';
COMMENT ON COLUMN tareas.fecha_completada IS 'Fecha en que se completó la tarea';
COMMENT ON COLUMN tareas.tiempo_estimado IS 'Tiempo estimado para la tarea (intervalo)';
COMMENT ON COLUMN tareas.tiempo_real IS 'Tiempo real empleado en la tarea';
COMMENT ON COLUMN tareas.etiquetas IS 'Etiquetas para categorización de tareas';

COMMENT ON COLUMN finanzas_proyecto.id IS 'ID único del registro financiero';
COMMENT ON COLUMN finanzas_proyecto.proyecto_id IS 'Proyecto al que pertenece el presupuesto';
COMMENT ON COLUMN finanzas_proyecto.user_id IS 'Propietario del proyecto';
COMMENT ON COLUMN finanzas_proyecto.monto_total IS 'Monto total presupuestado';
COMMENT ON COLUMN finanzas_proyecto.gastos_ejecutados IS 'Gastos reales ejecutados';
COMMENT ON COLUMN finanzas_proyecto.metodo_pago IS 'Método de pago preferido';
COMMENT ON COLUMN finanzas_proyecto.moneda IS 'Moneda del presupuesto';
COMMENT ON COLUMN finanzas_proyecto.fecha_presupuesto IS 'Fecha de creación del presupuesto';
COMMENT ON COLUMN finanzas_proyecto.notas_financieras IS 'Notas sobre decisiones financieras';

-- =====================================================
-- GESTIÓN AVANZADA DE PROYECTOS - FUNCIONALIDADES PREMIUM
-- =====================================================

-- =====================================================
-- TABLA: tareas (Gestión avanzada de tareas)
-- =====================================================

CREATE TABLE IF NOT EXISTS tareas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    estado TEXT NOT NULL DEFAULT 'To Do' CHECK (estado IN ('To Do', 'In Progress', 'Review', 'Done')),
    prioridad TEXT CHECK (prioridad IN ('Baja', 'Media', 'Alta', 'Urgente')),
    asignado_a UUID REFERENCES auth.users(id), -- Puede ser null (sin asignar)
    fecha_inicio TIMESTAMP WITH TIME ZONE,
    fecha_entrega TIMESTAMP WITH TIME ZONE,
    orden_kanban INTEGER DEFAULT 0, -- Para persistir el orden en la vista Kanban
    tiempo_estimado INTERVAL, -- Ej: '4 hours', '2 days'
    tiempo_real INTERVAL DEFAULT '0 hours',
    progreso INTEGER DEFAULT 0 CHECK (progreso >= 0 AND progreso <= 100),
    etiquetas TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para tareas
CREATE INDEX IF NOT EXISTS idx_tareas_proyecto_id ON tareas(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_tareas_user_id ON tareas(user_id);
CREATE INDEX IF NOT EXISTS idx_tareas_asignado_a ON tareas(asignado_a);
CREATE INDEX IF NOT EXISTS idx_tareas_estado ON tareas(estado);
CREATE INDEX IF NOT EXISTS idx_tareas_prioridad ON tareas(prioridad);
CREATE INDEX IF NOT EXISTS idx_tareas_fecha_entrega ON tareas(fecha_entrega);
CREATE INDEX IF NOT EXISTS idx_tareas_orden_kanban ON tareas(orden_kanban);
CREATE INDEX IF NOT EXISTS idx_tareas_created_at ON tareas(created_at DESC);

-- RLS para tareas
ALTER TABLE tareas ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver tareas de sus propios proyectos
CREATE POLICY "Users can view own project tasks" ON tareas
    FOR SELECT USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden crear tareas para sus propios proyectos
CREATE POLICY "Users can insert own project tasks" ON tareas
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios solo pueden actualizar tareas de sus propios proyectos
CREATE POLICY "Users can update own project tasks" ON tareas
    FOR UPDATE USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden eliminar tareas de sus propios proyectos
CREATE POLICY "Users can delete own project tasks" ON tareas
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- TABLA: time_entries (Time Tracking de Excelencia)
-- =====================================================

CREATE TABLE IF NOT EXISTS time_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tarea_id UUID REFERENCES tareas(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE, -- Para queries más eficientes
    descripcion TEXT,
    inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    fin TIMESTAMP WITH TIME ZONE,
    duracion_segundos INTEGER, -- Calculado al detener el timer
    es_facturable BOOLEAN DEFAULT TRUE,
    tarifa_por_hora DECIMAL(10,2),
    costo_total DECIMAL(10,2), -- Calculado automáticamente
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para time_entries
CREATE INDEX IF NOT EXISTS idx_time_entries_tarea_id ON time_entries(tarea_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_proyecto_id ON time_entries(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_inicio ON time_entries(inicio DESC);
CREATE INDEX IF NOT EXISTS idx_time_entries_created_at ON time_entries(created_at DESC);

-- RLS para time_entries
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propias entradas de tiempo
CREATE POLICY "Users can view own time entries" ON time_entries
    FOR SELECT USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden crear sus propias entradas de tiempo
CREATE POLICY "Users can insert own time entries" ON time_entries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios solo pueden actualizar sus propias entradas de tiempo
CREATE POLICY "Users can update own time entries" ON time_entries
    FOR UPDATE USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden eliminar sus propias entradas de tiempo
CREATE POLICY "Users can delete own time entries" ON time_entries
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- TABLA: proyecto_equipo (Equipo y Roles del Proyecto)
-- =====================================================

CREATE TABLE IF NOT EXISTS proyecto_equipo (
    proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rol TEXT NOT NULL CHECK (rol IN ('Admin', 'Staff', 'Viewer', 'Client')),
    invitado_por UUID REFERENCES auth.users(id), -- Quién invitó a este usuario
    fecha_invitacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ultimo_acceso TIMESTAMP WITH TIME ZONE,
    permisos_especiales JSONB DEFAULT '{}', -- Para permisos granulares futuros
    PRIMARY KEY (proyecto_id, user_id)
);

-- Índices para proyecto_equipo
CREATE INDEX IF NOT EXISTS idx_proyecto_equipo_proyecto_id ON proyecto_equipo(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_proyecto_equipo_user_id ON proyecto_equipo(user_id);
CREATE INDEX IF NOT EXISTS idx_proyecto_equipo_rol ON proyecto_equipo(rol);
CREATE INDEX IF NOT EXISTS idx_proyecto_equipo_fecha_invitacion ON proyecto_equipo(fecha_invitacion DESC);

-- RLS para proyecto_equipo
ALTER TABLE proyecto_equipo ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver equipos de proyectos donde participan
CREATE POLICY "Users can view project teams they belong to" ON proyecto_equipo
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM proyecto_equipo pe2
            WHERE pe2.proyecto_id = proyecto_equipo.proyecto_id
            AND pe2.user_id = auth.uid()
            AND pe2.rol IN ('Admin', 'Staff')
        )
    );

-- Política: Solo Admins pueden agregar miembros al equipo
CREATE POLICY "Only admins can manage team members" ON proyecto_equipo
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM proyecto_equipo pe2
            WHERE pe2.proyecto_id = proyecto_equipo.proyecto_id
            AND pe2.user_id = auth.uid()
            AND pe2.rol = 'Admin'
        )
    );

-- Política: Solo Admins pueden actualizar roles
CREATE POLICY "Only admins can update team roles" ON proyecto_equipo
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM proyecto_equipo pe2
            WHERE pe2.proyecto_id = proyecto_equipo.proyecto_id
            AND pe2.user_id = auth.uid()
            AND pe2.rol = 'Admin'
        )
    );

-- Política: Solo Admins pueden eliminar miembros
CREATE POLICY "Only admins can remove team members" ON proyecto_equipo
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM proyecto_equipo pe2
            WHERE pe2.proyecto_id = proyecto_equipo.proyecto_id
            AND pe2.user_id = auth.uid()
            AND pe2.rol = 'Admin'
        )
    );

-- =====================================================
-- FUNCIONES ÚTILES PARA TIME TRACKING
-- =====================================================

-- Función para calcular el costo total automáticamente
CREATE OR REPLACE FUNCTION calculate_time_entry_cost()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.fin IS NOT NULL AND NEW.duracion_segundos IS NOT NULL AND NEW.tarifa_por_hora IS NOT NULL THEN
        NEW.costo_total = (NEW.duracion_segundos / 3600.0) * NEW.tarifa_por_hora;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular costo automáticamente
CREATE TRIGGER calculate_time_entry_cost_trigger
    BEFORE INSERT OR UPDATE ON time_entries
    FOR EACH ROW EXECUTE FUNCTION calculate_time_entry_cost();

-- Función para actualizar tiempo real en tareas
CREATE OR REPLACE FUNCTION update_task_time()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Sumar tiempo a la tarea
        UPDATE tareas
        SET tiempo_real = COALESCE(tiempo_real, INTERVAL '0 hours') + (NEW.duracion_segundos || ' seconds')::INTERVAL
        WHERE id = NEW.tarea_id;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Ajustar tiempo si cambió la duración
        UPDATE tareas
        SET tiempo_real = COALESCE(tiempo_real, INTERVAL '0 hours') -
                         (COALESCE(OLD.duracion_segundos, 0) || ' seconds')::INTERVAL +
                         (COALESCE(NEW.duracion_segundos, 0) || ' seconds')::INTERVAL
        WHERE id = NEW.tarea_id;
    ELSIF TG_OP = 'DELETE' THEN
        -- Restar tiempo de la tarea
        UPDATE tareas
        SET tiempo_real = GREATEST(COALESCE(tiempo_real, INTERVAL '0 hours') - (OLD.duracion_segundos || ' seconds')::INTERVAL, INTERVAL '0 hours')
        WHERE id = OLD.tarea_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para mantener tiempo real actualizado en tareas
CREATE TRIGGER update_task_time_trigger
    AFTER INSERT OR UPDATE OR DELETE ON time_entries
    FOR EACH ROW EXECUTE FUNCTION update_task_time();

-- =====================================================
-- TRIGGERS PARA NUEVAS TABLAS PREMIUM
-- =====================================================

CREATE TRIGGER update_tareas_updated_at
    BEFORE UPDATE ON tareas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_entries_updated_at
    BEFORE UPDATE ON time_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMENTARIOS DE DOCUMENTACIÓN PREMIUM
-- =====================================================

COMMENT ON TABLE tareas IS 'Sistema avanzado de gestión de tareas con Kanban y asignación';
COMMENT ON TABLE time_entries IS 'Control de tiempo profesional con facturación automática';
COMMENT ON TABLE proyecto_equipo IS 'Gestión de equipos colaborativos con roles y permisos';

COMMENT ON COLUMN tareas.id IS 'ID único de la tarea';
COMMENT ON COLUMN tareas.proyecto_id IS 'Proyecto al que pertenece la tarea';
COMMENT ON COLUMN tareas.user_id IS 'Propietario del proyecto';
COMMENT ON COLUMN tareas.titulo IS 'Título descriptivo de la tarea';
COMMENT ON COLUMN tareas.estado IS 'Estado Kanban de la tarea';
COMMENT ON COLUMN tareas.orden_kanban IS 'Posición en el tablero Kanban';
COMMENT ON COLUMN tareas.tiempo_estimado IS 'Tiempo estimado para completar la tarea';
COMMENT ON COLUMN tareas.tiempo_real IS 'Tiempo real acumulado en time entries';
COMMENT ON COLUMN tareas.progreso IS 'Porcentaje de completación (0-100)';

COMMENT ON COLUMN time_entries.tarea_id IS 'Tarea asociada al time entry';
COMMENT ON COLUMN time_entries.duracion_segundos IS 'Duración en segundos del trabajo';
COMMENT ON COLUMN time_entries.es_facturable IS 'Si este tiempo es facturable al cliente';
COMMENT ON COLUMN time_entries.tarifa_por_hora IS 'Tarifa por hora para facturación';
COMMENT ON COLUMN time_entries.costo_total IS 'Costo total calculado automáticamente';

COMMENT ON COLUMN proyecto_equipo.rol IS 'Rol del usuario en el proyecto';
COMMENT ON COLUMN proyecto_equipo.invitado_por IS 'Usuario que realizó la invitación';
COMMENT ON COLUMN proyecto_equipo.permisos_especiales IS 'Permisos granulares adicionales';

-- =====================================================
-- SISTEMA DE INVITACIONES ENTERPRISE
-- =====================================================

-- Tabla para gestionar invitaciones pendientes
CREATE TABLE IF NOT EXISTS invitaciones_proyecto (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    rol TEXT NOT NULL CHECK (rol IN ('Admin', 'Staff', 'Viewer')) DEFAULT 'Staff',
    token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    invitado_por UUID REFERENCES auth.users(id),
    estado TEXT NOT NULL CHECK (estado IN ('Pendiente', 'Aceptada', 'Expirada', 'Rechazada')) DEFAULT 'Pendiente',
    fecha_expiracion TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    fecha_aceptacion TIMESTAMP WITH TIME ZONE,
    notas_admin TEXT, -- Notas internas del admin
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para invitaciones_proyecto
CREATE INDEX IF NOT EXISTS idx_invitaciones_proyecto_proyecto_id ON invitaciones_proyecto(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_invitaciones_proyecto_email ON invitaciones_proyecto(email);
CREATE INDEX IF NOT EXISTS idx_invitaciones_proyecto_token ON invitaciones_proyecto(token);
CREATE INDEX IF NOT EXISTS idx_invitaciones_proyecto_estado ON invitaciones_proyecto(estado);
CREATE INDEX IF NOT EXISTS idx_invitaciones_proyecto_fecha_expiracion ON invitaciones_proyecto(fecha_expiracion);

-- RLS para invitaciones_proyecto
ALTER TABLE invitaciones_proyecto ENABLE ROW LEVEL SECURITY;

-- Política: Solo admins del proyecto pueden crear invitaciones
CREATE POLICY "Admins can create invitations" ON invitaciones_proyecto
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM proyecto_equipo
            WHERE proyecto_id = invitaciones_proyecto.proyecto_id
            AND user_id = auth.uid()
            AND rol = 'Admin'
        )
    );

-- Política: Solo admins pueden ver invitaciones de sus proyectos
CREATE POLICY "Admins can view project invitations" ON invitaciones_proyecto
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM proyecto_equipo
            WHERE proyecto_id = invitaciones_proyecto.proyecto_id
            AND user_id = auth.uid()
            AND rol = 'Admin'
        )
    );

-- Política: Solo admins pueden actualizar invitaciones
CREATE POLICY "Admins can update invitations" ON invitaciones_proyecto
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM proyecto_equipo
            WHERE proyecto_id = invitaciones_proyecto.proyecto_id
            AND user_id = auth.uid()
            AND rol = 'Admin'
        )
    );

-- Política: Solo admins pueden eliminar invitaciones
CREATE POLICY "Admins can delete invitations" ON invitaciones_proyecto
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM proyecto_equipo
            WHERE proyecto_id = invitaciones_proyecto.proyecto_id
            AND user_id = auth.uid()
            AND rol = 'Admin'
        )
    );

-- Función para expirar invitaciones automáticamente
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
    UPDATE invitaciones_proyecto
    SET estado = 'Expirada', updated_at = NOW()
    WHERE estado = 'Pendiente'
    AND fecha_expiracion < NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE TRIGGER update_invitaciones_proyecto_updated_at
    BEFORE UPDATE ON invitaciones_proyecto
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- MULTI-TENANT TABLES
-- =====================================================

-- ⚠️ IMPORTANTE: Las tablas multi-tenant se crean con un script separado
-- Ejecuta el archivo "multi-tenant-setup.sql" para configurar multi-tenant
-- NO ejecutes las políticas aquí si ya existen en tu base de datos

-- =====================================================
-- FIN DEL SCRIPT COMPLETO
-- =====================================================

-- Instrucciones de uso:

-- OPCIONES DE EJECUCIÓN:

-- 🔄 PRIMERA VEZ (nada configurado):
--    1. Ejecuta klowezone-database-schema.sql completo
--    2. Después ejecuta multi-tenant-setup.sql

-- 🔧 SI YA TIENES POLÍTICAS CREADAS (error "policy already exists"):
--    1. Ejecuta fix-existing-policies.sql (elimina políticas existentes)
--    2. Ejecuta klowezone-database-schema.sql completo
--    3. Después ejecuta multi-tenant-setup.sql

-- ⚡ SI YA TIENES TODO MENOS MULTI-TENANT:
--    1. Solo ejecuta multi-tenant-setup.sql

-- 📍 PASOS GENERALES:
-- 1. Ve a Supabase Dashboard > SQL Editor
-- 2. Pega el/los script(s) correspondiente(s) en orden
-- 3. Ejecuta cada uno por separado
-- 4. Verifica que no hay errores
-- 5. Las políticas RLS protegerán automáticamente los datos
--
-- Próximos pasos después de ejecutar el SQL:
-- 1. El onboarding se activará automáticamente para nuevos usuarios
-- 2. Los usuarios existentes pueden acceder directamente al dashboard (onboarding opcional)
-- 3. Si vas a usar multi-tenant: ejecuta "multi-tenant-setup.sql"
-- 4. Prueba el flujo completo: registro -> onboarding -> dashboard
--
-- NUEVAS FUNCIONALIDADES DISPONIBLES:
-- - Gestión avanzada de proyectos con detalles técnicos
-- - Sistema completo de tareas asignables
-- - Control financiero y presupuestario por proyecto
-- - Base multi-tenant preparada (opcional)
