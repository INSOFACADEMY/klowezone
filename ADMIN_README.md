# 🚀 Panel de Administración KloweZone

## Descripción

Panel de administración enterprise completo para KloweZone con arquitectura multi-tenant escalable.

## Características Principales

### 🎨 UI/UX
- **Layout Enterprise**: Sidebar + topbar + command palette (Cmd+K)
- **Dashboard con KPIs**: Métricas en tiempo real, alertas y health checks
- **Navegación modular**: Dashboard, Configuración, CMS, Clientes, etc.
- **Tablas avanzadas**: Filtros, sorting, paginación, columnas configurables
- **Estados enterprise**: Skeletons, loaders, empty states

### 🔐 Sistema RBAC
- **Roles jerárquicos**: Superadmin, Admin, Editor, Analista, Soporte
- **Permisos granulares**: Control por recurso y acción
- **Multi-tenant**: Arquitectura preparada para múltiples organizaciones

### 📊 Módulos Funcionales

#### 1. **Configuración**
- **Email**: SMTP, SendGrid, Resend con credenciales cifradas
- **IA**: OpenAI, Anthropic, Google AI con límites de uso
- **Storage**: S3, R2, local con gestión de archivos
- **RBAC**: Gestión completa de roles y permisos

#### 2. **CMS**
- **Blog Posts**: Editor con SEO, estados (draft/published), scheduling
- **Páginas**: Gestión de páginas estáticas
- **Testimonios**: CRUD con ratings y metadata
- **Media Library**: Upload, tags, thumbnails automáticos

#### 3. **Métricas**
- **Eventos**: Server/client-side tracking
- **Dashboard**: Filtros por fecha, export CSV
- **Analytics**: Métricas personalizables

#### 4. **Logs**
- **Error Logs**: Stack traces, contexto, severidad
- **Audit Logs**: Cambios en settings/CMS (quién/cuándo/qué)
- **Incidentes**: Sistema de tickets con timeline

#### 5. **Feedback**
- **Captura**: Formulario in-app con screenshots
- **Gestión**: Bandeja con estados y asignación
- **Comentarios**: Internos y públicos

## 🛠️ Instalación y Configuración

### 1. **Dependencias**
```bash
npm install prisma @prisma/client bcryptjs @types/bcryptjs tsx
```

### 2. **Base de Datos**
```bash
# Configurar PostgreSQL
createdb klowezone

# Variables de entorno (.env)
DATABASE_URL="postgresql://username:password@localhost:5432/klowezone"
MASTER_KEY="your-32-byte-hex-key"  # Generar con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET="your-secure-jwt-secret-key-here"
```

### 3. **Inicializar Prisma**
```bash
# Generar cliente
npm run db:generate

# Crear tablas
npm run db:push

# Ejecutar seed
npm run db:seed
```

### 4. **Configurar Proveedores**

#### Email (SMTP)
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="tu-email@gmail.com"
SMTP_PASS="tu-app-password"
```

#### Email (SendGrid)
```env
SENDGRID_API_KEY="tu-api-key"
```

#### IA (OpenAI)
```env
OPENAI_API_KEY="tu-api-key"
```

#### Storage (S3)
```env
AWS_ACCESS_KEY_ID="tu-access-key"
AWS_SECRET_ACCESS_KEY="tu-secret-key"
AWS_S3_BUCKET="tu-bucket"
AWS_REGION="us-east-1"
```

### 5. **Iniciar Servidor**
```bash
npm run dev
```

Acceder al panel: `http://localhost:3000/admin`

## 👤 Credenciales Iniciales

```
Email: admin@klowezone.com
Password: SuperAdmin123!
```

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── admin/                    # Panel de administración
│   │   ├── layout.tsx           # Layout del admin
│   │   ├── dashboard/           # Dashboard principal
│   │   ├── settings/            # Configuración del sistema
│   │   ├── cms/                 # Sistema de gestión de contenido
│   │   ├── clients/             # Gestión de clientes
│   │   ├── automations/         # Automatizaciones
│   │   ├── metrics/             # Métricas y analytics
│   │   ├── logs/                # Logs del sistema
│   │   └── feedback/            # Sistema de feedback
│   └── api/                     # Endpoints de la API
├── components/
│   ├── admin/                   # Componentes del admin
│   │   ├── admin-sidebar.tsx
│   │   ├── admin-topbar.tsx
│   │   └── admin-command-palette.tsx
│   └── ui/                      # Componentes de UI reutilizables
├── lib/
│   ├── encryption/              # Utilidades de cifrado
│   ├── prisma.ts                # Cliente de Prisma
│   └── utils.ts                 # Utilidades generales
└── prisma/
    ├── schema.prisma            # Esquema de la base de datos
    └── seed/
        └── index.ts             # Datos iniciales
```

## 🔐 Sistema RBAC

### Roles Incluidos
- **Superadmin**: Acceso completo al sistema
- **Admin**: Gestión administrativa
- **Editor**: Gestión de contenido
- **Analista**: Acceso a métricas y reportes
- **Soporte**: Atención al cliente y feedback

### Permisos
- **Users**: CRUD de usuarios
- **Posts**: Gestión de blog posts
- **Pages**: Gestión de páginas
- **Media**: Upload y gestión de archivos
- **Settings**: Configuración del sistema
- **Analytics**: Acceso a métricas
- **Logs**: Visualización de logs
- **Feedback**: Gestión de feedback

## 🛡️ Seguridad

### Cifrado de Secrets
- **AES-256-GCM**: Para credenciales sensibles
- **MASTER_KEY**: Clave maestra de 32 bytes
- **Rotación**: Sistema preparado para rotación de claves

### Autenticación
- **JWT**: Tokens seguros con expiración
- **Middleware**: Validación de permisos en cada ruta
- **Audit**: Registro de todas las acciones

## 📊 APIs Principales

### Configuración
```
POST   /api/admin/settings/email-providers
POST   /api/admin/settings/ai-providers
POST   /api/admin/settings/storage-providers
GET    /api/admin/settings/roles
POST   /api/admin/settings/roles
```

### CMS
```
GET    /api/admin/cms/posts
POST   /api/admin/cms/posts
PUT    /api/admin/cms/posts/[id]
DELETE /api/admin/cms/posts/[id]
POST   /api/admin/cms/posts/[id]/publish
```

### Logs
```
GET    /api/admin/logs/errors
GET    /api/admin/logs/audit
POST   /api/admin/logs/incidents
PUT    /api/admin/logs/incidents/[id]
```

### Feedback
```
GET    /api/admin/feedback
POST   /api/admin/feedback
PUT    /api/admin/feedback/[id]/status
POST   /api/admin/feedback/[id]/comments
```

## 🚀 Próximos Pasos

1. **Configurar proveedores externos** (email, IA, storage)
2. **Crear usuarios adicionales** con diferentes roles
3. **Personalizar dashboard** con métricas específicas
4. **Implementar notificaciones** push/email
5. **Agregar tests** automatizados
6. **Configurar CI/CD** para deployments

## 🐛 Solución de Problemas

### Error de conexión a DB
```bash
# Verificar que PostgreSQL esté corriendo
psql -U username -d klowezone

# Recrear base de datos
npm run db:reset
```

### Error de MASTER_KEY
```bash
# Generar nueva clave
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Actualizar .env y reiniciar
```

### Problemas de permisos
```bash
# Verificar roles en Prisma Studio
npm run db:studio

# Resetear permisos
npm run db:seed
```

## 📈 Métricas y Monitoreo

- **Health Checks**: Automáticos cada 30 segundos
- **Error Tracking**: Logs con stack traces
- **Performance**: Métricas de respuesta de APIs
- **Uptime**: Monitoreo de servicios externos

## 🎯 Arquitectura

- **Multi-tenant**: Preparado para múltiples organizaciones
- **Escalable**: Arquitectura preparada para crecimiento
- **Seguro**: Cifrado de datos sensibles
- **Auditable**: Registro completo de acciones
- **Mantenible**: Código modular y bien documentado

---

**¡Bienvenido al futuro de la gestión empresarial con KloweZone!** 🚀
