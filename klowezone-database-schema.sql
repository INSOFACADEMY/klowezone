-- =====================================================
-- KLOWEZONE DATABASE SCHEMA - Script Completo
-- Ejecutar en el SQL Editor de Supabase Dashboard
-- =====================================================

-- =====================================================
-- TABLA: profiles (Perfiles de usuario)
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

-- Política: Los usuarios solo pueden ver su propio perfil
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Política: Los usuarios solo pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Política: Los usuarios pueden insertar su propio perfil durante el registro
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

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

-- Política: Los usuarios solo pueden ver sus propios clientes
CREATE POLICY "Users can view own clients" ON clientes
    FOR SELECT USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden insertar clientes para sí mismos
CREATE POLICY "Users can insert own clients" ON clientes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios solo pueden actualizar sus propios clientes
CREATE POLICY "Users can update own clients" ON clientes
    FOR UPDATE USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden eliminar sus propios clientes
CREATE POLICY "Users can delete own clients" ON clientes
    FOR DELETE USING (auth.uid() = user_id);

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

-- Política: Los usuarios solo pueden ver sus propios proyectos
CREATE POLICY "Users can view own projects" ON proyectos
    FOR SELECT USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden insertar proyectos para sí mismos
CREATE POLICY "Users can insert own projects" ON proyectos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios solo pueden actualizar sus propios proyectos
CREATE POLICY "Users can update own projects" ON proyectos
    FOR UPDATE USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden eliminar sus propios proyectos
CREATE POLICY "Users can delete own projects" ON proyectos
    FOR DELETE USING (auth.uid() = user_id);

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
  INSERT INTO public.profiles (id, nombre_completo, email, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
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

COMMENT ON TABLE profiles IS 'Perfiles de usuario extendidos con información adicional';
COMMENT ON TABLE clientes IS 'Tabla de clientes del sistema Klowezone';
COMMENT ON TABLE proyectos IS 'Tabla de proyectos asociados a clientes';

COMMENT ON COLUMN profiles.id IS 'ID único del usuario (FK a auth.users)';
COMMENT ON COLUMN profiles.nombre_completo IS 'Nombre completo del usuario';
COMMENT ON COLUMN profiles.avatar_url IS 'URL del avatar del usuario';
COMMENT ON COLUMN profiles.email IS 'Email del usuario (duplicado de auth.users)';

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
-- FIN DEL SCRIPT
-- =====================================================

-- Instrucciones de uso:
-- 1. Copia todo este script
-- 2. Ve a Supabase Dashboard > SQL Editor
-- 3. Pega el script y ejecuta
-- 4. Verifica que las tablas se crearon correctamente
-- 5. Las políticas RLS protegerán automáticamente los datos de cada usuario
