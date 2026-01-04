-- =====================================================
-- FIX TRIGGERS ONLY - Solución específica para triggers duplicados
-- Ejecutar ÚNICAMENTE si tienes el error de trigger duplicado
-- =====================================================

-- Verificar qué triggers existen actualmente
SELECT
    tgname as trigger_name,
    tgrelid::regclass as table_name
FROM pg_trigger
WHERE tgname LIKE '%updated_at%'
ORDER BY table_name, trigger_name;

-- Eliminar triggers problemáticos usando SQL dinámico
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    -- Buscar y eliminar todos los triggers updated_at
    FOR trigger_record IN
        SELECT tgname, tgrelid::regclass::text as table_name
        FROM pg_trigger
        WHERE tgname LIKE '%updated_at%'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_record.tgname || ' ON ' || trigger_record.table_name;
        RAISE NOTICE 'Eliminado trigger: % en tabla: %', trigger_record.tgname, trigger_record.table_name;
    END LOOP;
END $$;

-- Recrear triggers desde cero
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para tablas base
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

-- Triggers para tablas multi-tenant
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verificación final
SELECT
    'Triggers recreados exitosamente' as status,
    COUNT(*) as total_triggers
FROM pg_trigger
WHERE tgname LIKE '%updated_at%';

-- =====================================================
-- FIN - Ahora puedes continuar normalmente
-- =====================================================
