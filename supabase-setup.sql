-- Script SQL para configurar la tabla de clientes en Supabase
-- Ejecutar en el SQL Editor de Supabase Dashboard

-- Crear tabla de clientes
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

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_clientes_user_id ON clientes(user_id);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);
CREATE INDEX IF NOT EXISTS idx_clientes_estado ON clientes(estado);
CREATE INDEX IF NOT EXISTS idx_clientes_created_at ON clientes(created_at DESC);

-- Habilitar Row Level Security (RLS)
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Política RLS: Los usuarios solo pueden ver sus propios clientes
CREATE POLICY "Users can view own clients" ON clientes
    FOR SELECT USING (auth.uid() = user_id);

-- Política RLS: Los usuarios solo pueden insertar clientes para sí mismos
CREATE POLICY "Users can insert own clients" ON clientes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política RLS: Los usuarios solo pueden actualizar sus propios clientes
CREATE POLICY "Users can update own clients" ON clientes
    FOR UPDATE USING (auth.uid() = user_id);

-- Política RLS: Los usuarios solo pueden eliminar sus propios clientes
CREATE POLICY "Users can delete own clients" ON clientes
    FOR DELETE USING (auth.uid() = user_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at
CREATE TRIGGER update_clientes_updated_at
    BEFORE UPDATE ON clientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar algunos datos de ejemplo (opcional - para testing)
-- Nota: Estos datos se insertarán para el usuario que ejecute el script
INSERT INTO clientes (user_id, nombre, email, telefono, estado, notas) VALUES
    (auth.uid(), 'Empresa ABC S.A.', 'contacto@empresaabc.com', '+1234567890', 'Activo', 'Cliente potencial de gran tamaño'),
    (auth.uid(), 'Startup XYZ', 'info@startupxyz.com', '+0987654321', 'Pendiente', 'Startup innovadora en tecnología'),
    (auth.uid(), 'Consultora Digital', 'admin@consultoradigital.com', '+1122334455', 'Activo', 'Especialistas en transformación digital')
ON CONFLICT DO NOTHING;

-- Comentarios para documentación
COMMENT ON TABLE clientes IS 'Tabla de clientes del sistema Klowezone';
COMMENT ON COLUMN clientes.id IS 'ID único del cliente (UUID)';
COMMENT ON COLUMN clientes.user_id IS 'ID del usuario propietario (FK a auth.users)';
COMMENT ON COLUMN clientes.nombre IS 'Nombre completo del cliente';
COMMENT ON COLUMN clientes.email IS 'Email de contacto del cliente';
COMMENT ON COLUMN clientes.telefono IS 'Número de teléfono del cliente';
COMMENT ON COLUMN clientes.estado IS 'Estado del cliente: Activo, Inactivo, Pendiente';
COMMENT ON COLUMN clientes.notas IS 'Notas adicionales sobre el cliente';
COMMENT ON COLUMN clientes.created_at IS 'Fecha de creación del registro';
COMMENT ON COLUMN clientes.updated_at IS 'Fecha de última actualización';

