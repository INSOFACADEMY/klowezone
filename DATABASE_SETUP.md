# 🗄️ Configuración de Base de Datos - Klowezone

## ✅ Script SQL Corregido Disponible
**Archivo:** `klowezone-neon-init.sql` - Script completo corregido y optimizado para Neon

## Estado Actual
Actualmente el proyecto está configurado para usar **SQLite** para desarrollo rápido, pero está preparado para **PostgreSQL** en producción.

## 🔧 Corrección del Error de CHECK Constraints

**Problema anterior:** PostgreSQL no permite subqueries en CHECK constraints
```sql
-- ❌ ERROR: cannot use subquery in check constraint
CONSTRAINT ck_email_providers_single_default CHECK (
    NOT (is_default = TRUE AND EXISTS (
        SELECT 1 FROM email_providers WHERE is_default = TRUE AND id != email_providers.id
    ))
)
```

**Solución implementada:** Triggers para lógica de negocio
```sql
-- ✅ Triggers para asegurar solo un proveedor default
CREATE OR REPLACE FUNCTION ensure_single_default_provider()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = TRUE THEN
        UPDATE email_providers SET is_default = FALSE WHERE id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Configuración Actual (.env)
```bash
DATABASE_URL="file:./dev.db"  # SQLite temporal
```

## Para Configurar PostgreSQL

### 1. Instalar PostgreSQL

**Windows:**
```bash
# Descarga desde: https://www.postgresql.org/download/windows/
# O usando Chocolatey: choco install postgresql
```

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Crear Base de Datos y Usuario

```bash
# Acceder como superusuario
sudo -u postgres psql

# Dentro de PostgreSQL
CREATE DATABASE klowezone;
CREATE USER tu_usuario WITH ENCRYPTED PASSWORD 'tu_password';
GRANT ALL PRIVILEGES ON DATABASE klowezone TO tu_usuario;
\q
```

### 3. Actualizar Variables de Entorno

Modifica tu archivo `.env` (o `.env.local`):

```bash
# Cambia esta línea:
DATABASE_URL="file:./dev.db"

# Por esta (ajusta con tus credenciales):
DATABASE_URL="postgresql://tu_usuario:tu_password@localhost:5432/klowezone"
```

### 4. Ejecutar Migraciones

```bash
# Crear y aplicar migraciones
npx prisma migrate dev --name init

# O si ya tienes el schema, solo sincronizar:
npx prisma db push
```

### 5. Verificar Conexión

```bash
# Abrir Prisma Studio para verificar
npx prisma studio

# O ejecutar una consulta de prueba
npx prisma db execute --file ./test-connection.sql
```

## Ejemplos de DATABASE_URL para Diferentes Proveedores

### Desarrollo Local
```bash
DATABASE_URL="postgresql://postgres:mypassword@localhost:5432/klowezone"
```

### Railway
```bash
DATABASE_URL="postgresql://postgres:password@containers-us-west-1.railway.app:1234/railway"
```

### Supabase
```bash
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.your-project-ref.supabase.co:5432/postgres"
```

### AWS RDS
```bash
DATABASE_URL="postgresql://username:password@your-rds-endpoint.rds.amazonaws.com:5432/klowezone"
```

### Neon
```bash
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-1.neon.tech/dbname?sslmode=require"
```

## Verificación de Funcionamiento

Una vez configurado, deberías poder:

1. ✅ Ejecutar `npm run dev` sin errores
2. ✅ Acceder a `/admin/automations` y crear workflows
3. ✅ Los datos se persisten en PostgreSQL
4. ✅ Ejecutar `npx prisma studio` para ver la base de datos

## Verificación Post-Ejecución

Después de ejecutar el script en Neon, verifica que todo esté correcto:

```sql
-- Verificar tablas creadas
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Verificar datos iniciales
SELECT 'Roles' as table_name, COUNT(*) as count FROM roles
UNION ALL
SELECT 'Permissions', COUNT(*) FROM permissions
UNION ALL
SELECT 'Users', COUNT(*) FROM users;

-- Verificar funciones y triggers
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY trigger_name;
```

## Comandos Útiles

```bash
# Generar cliente Prisma
npx prisma generate

# Ver estado de migraciones
npx prisma migrate status

# Crear nueva migración
npx prisma migrate dev --name nombre_migracion

# Resetear base de datos (cuidado!)
npx prisma migrate reset

# Sembrar datos
npx prisma db seed
```

## Solución de Problemas

### Error: "Can't reach database server"
- Verifica que PostgreSQL esté ejecutándose
- Confirma las credenciales en DATABASE_URL
- Asegúrate de que el puerto 5432 esté abierto

### Error: "Database does not exist"
```bash
createdb klowezone
```

### Error: "Role does not exist"
```bash
sudo -u postgres createuser --createdb --encrypted --pwprompt tu_usuario
```

¿Necesitas ayuda con algún paso específico?
