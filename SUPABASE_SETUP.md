# Configuración de Supabase - Klowezone

## 📋 Pasos para configurar las credenciales

### 1. Crear archivo .env.local
Crea un archivo llamado `.env.local` en la raíz del proyecto con el siguiente contenido:

```env
NEXT_PUBLIC_SUPABASE_URL=https://nrzcndmeqknocoorfhvn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_publishable_key_aquí
```

### 2. Obtener las credenciales
1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Settings > API**
4. Copia la **URL** y la **anon/public key**
5. Reemplaza `tu_publishable_key_aquí` en el archivo `.env.local`

### 3. Verificar la configuración
Ejecuta el siguiente comando para probar la conexión:

```bash
npm run test-connection
```

### 4. Funcionalidades implementadas

#### ✅ Página de Registro (`/signup`)
- Formulario completo con validación
- Diseño glassmorphism consistente
- Animaciones con Framer Motion
- Integración con Supabase Auth
- Estados de carga y error
- Redirección automática al dashboard

#### ✅ Dashboard Preliminar (`/dashboard`)
- Verificación de autenticación
- Estadísticas básicas
- Acciones rápidas
- Diseño profesional con glassmorphism
- Protección de rutas

#### ✅ Flujo de Usuario
1. **Landing Page** → Botón "Comenzar Gratis" → `/signup`
2. **Registro exitoso** → Email de confirmación → `/dashboard`
3. **Dashboard** → Funcionalidades principales

### 5. Próximos pasos recomendados

1. **Configurar Email Templates** en Supabase para emails de confirmación
2. **Crear tablas de base de datos** para proyectos, clientes, etc.
3. **Implementar middleware** para protección de rutas
4. **Agregar más páginas** del dashboard (proyectos, clientes, etc.)

### 6. Comandos útiles

```bash
# Iniciar desarrollo
npm run dev

# Probar conexión con Supabase
npm run test-connection

# Verificar linting
npm run lint
```

### 7. URLs importantes
- **Landing Page**: `http://localhost:3000/`
- **Registro**: `http://localhost:3000/signup`
- **Dashboard**: `http://localhost:3000/dashboard`

¡Tu aplicación Klowezone está lista para recibir usuarios! 🚀











