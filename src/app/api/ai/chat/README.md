# AI Chat API - OpenAI Function Calling

Esta API implementa un sistema de chat inteligente con OpenAI Function Calling que permite a una IA interactuar automáticamente con las herramientas de gestión de proyectos de Klowezone.

## 🚀 Características

- **OpenAI Function Calling**: La IA puede decidir automáticamente cuándo usar funciones
- **Autenticación JWT**: Seguridad completa con validación de usuarios
- **5 funciones disponibles**: Gestión completa de proyectos y comunicación
- **Respuestas en español**: Optimizado para usuarios hispanohablantes

## 📡 Endpoint

```
POST /api/ai/chat
```

## 🔐 Autenticación

Requiere un token JWT válido en el header `Authorization`:

```
Authorization: Bearer <your-jwt-token>
```

## 📝 Request Body

```json
{
  "message": "Mensaje del usuario",
  "conversationHistory": [
    {
      "role": "user",
      "content": "¿Cuáles son mis proyectos?"
    },
    {
      "role": "assistant",
      "content": "Voy a consultar tus proyectos..."
    }
  ]
}
```

## 🎯 Funciones Disponibles

### 1. `getUserProjects`
Obtiene todos los proyectos del usuario con información detallada.

**Parámetros:**
- `userId` (automático): ID del usuario autenticado

**Respuesta:** Array de proyectos con cliente, estado, fechas, etc.

### 2. `createTaskForUser`
Crea una nueva tarea en un proyecto específico.

**Parámetros:**
- `userId` (automático): ID del usuario autenticado
- `taskData` (objeto):
  - `proyecto_id` (requerido): ID del proyecto
  - `titulo` (requerido): Título de la tarea
  - `descripcion` (opcional): Descripción detallada
  - `estado` (opcional): "To Do", "In Progress", "Review", "Done"
  - `prioridad` (opcional): "Baja", "Media", "Alta", "Urgente"
  - `asignado_a` (opcional): ID del usuario asignado
  - `fecha_inicio` (opcional): Fecha YYYY-MM-DD
  - `fecha_entrega` (opcional): Fecha YYYY-MM-DD
  - `tiempo_estimado` (opcional): Ej: "4 hours"
  - `progreso` (opcional): Número 0-100
  - `etiquetas` (opcional): Array de strings

### 3. `createFacebookAdCampaign`
Crea una campaña publicitaria en Facebook Ads con el nombre, presupuesto diario y texto del anuncio especificados. Si las credenciales de Meta están configuradas, crea la campaña real; de lo contrario, simula la creación.

**Parámetros:**
- `userId` (automático): ID del usuario autenticado
- `campaignData` (objeto):
  - `campaignName` (requerido): Nombre de la campaña publicitaria
  - `dailyBudget` (requerido): Presupuesto diario en dólares (mínimo 1)
  - `adText` (requerido): Texto principal del anuncio publicitario
  - `targetAudience` (opcional): Audiencia objetivo para la campaña
  - `objective` (opcional): "OUTCOME_AWARENESS", "OUTCOME_TRAFFIC", "OUTCOME_ENGAGEMENT", "OUTCOME_LEADS", "OUTCOME_SALES", "LINK_CLICKS", "REACH" (por defecto: "OUTCOME_TRAFFIC")

**Variables de entorno requeridas para creación real:**
- `META_ACCESS_TOKEN`: Access token válido de Meta
- `META_AD_ACCOUNT_ID`: ID de la cuenta publicitaria (sin prefijo 'act_')

*Si no están configuradas, la función simulará la creación y devolverá un ID ficticio.*

**Respuesta:**
```json
{
  "success": true,
  "campaignId": "fb_campaign_1234567890_abc123def",
  "message": "Campaña \"Campaña de Verano\" creada exitosamente en Facebook Ads",
  "campaignDetails": {
    "name": "Campaña de Verano",
    "budget": 50,
    "status": "PAUSED",
    "objective": "TRAFFIC",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 4. `sendWhatsAppMessage`
Envía mensajes de WhatsApp usando templates predefinidos.

**Parámetros:**
- `userId` (automático): ID del usuario autenticado
- `phoneNumber`: Número con código de país (ej: "+521234567890")
- `templateKey`: "welcome", "milestoneCompleted", "paymentReminder", "projectUpdate", "meetingReschedule", "documentShared"
- `clientName`: Nombre del cliente para personalizar
- `params` (opcional): Array de parámetros adicionales

### 5. `getUserProjectStats`
Obtiene estadísticas rápidas de proyectos.

**Parámetros:**
- `userId` (automático): ID del usuario autenticado

**Respuesta:**
```json
{
  "total": 5,
  "completados": 2,
  "enProgreso": 1,
  "planificacion": 2
}
```

### 6. `searchUserProjects`
Busca proyectos por nombre o descripción.

**Parámetros:**
- `userId` (automático): ID del usuario autenticado
- `query`: Texto a buscar

## 💬 Ejemplos de Uso

### Consultar proyectos
```javascript
const response = await fetch('/api/ai/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-jwt-token'
  },
  body: JSON.stringify({
    message: "¿Cuáles son mis proyectos actuales?"
  })
});

const data = await response.json();
console.log(data.response); // Respuesta de la IA
console.log(data.functionCalled); // Información sobre función ejecutada
```

### Crear una tarea
```javascript
const response = await fetch('/api/ai/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-jwt-token'
  },
  body: JSON.stringify({
    message: "Crea una tarea llamada 'Revisar diseño' en el proyecto de TechCorp con prioridad alta"
  })
});
```

### Enviar WhatsApp
```javascript
const response = await fetch('/api/ai/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-jwt-token'
  },
  body: JSON.stringify({
    message: "Envía un mensaje de bienvenida por WhatsApp a Juan Pérez al número +521234567890"
  })
});
```

### Crear campaña de Facebook
```javascript
const response = await fetch('/api/ai/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-jwt-token'
  },
  body: JSON.stringify({
    message: "Crea una campaña de Facebook llamada 'Campaña Verano 2024' con presupuesto diario de $50 y texto 'Descubre nuestros productos de verano con 30% descuento'"
  })
});
```

## 🔄 Flujo de Funcionamiento

1. **Usuario envía mensaje** → API recibe el mensaje
2. **OpenAI analiza** → Decide si necesita llamar una función
3. **Función se ejecuta** → Se valida seguridad y se ejecuta la función
4. **Resultado se procesa** → OpenAI genera respuesta final
5. **Respuesta se devuelve** → Usuario recibe respuesta contextual

## 🛡️ Seguridad

- **Validación JWT**: Solo usuarios autenticados pueden usar la API
- **Control de acceso**: Cada función valida que el usuario tenga permisos
- **Logging**: Todas las acciones se registran para auditoría
- **Rate limiting**: Recomendado implementar en producción

## ⚙️ Configuración

Asegúrate de tener configurada la variable de entorno:

```env
NEXT_PUBLIC_OPENAI_API_KEY=your-openai-api-key
```

## 🧪 Testing

Para probar la API:

```bash
# GET request para ver información
curl http://localhost:3000/api/ai/chat

# POST request con mensaje
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{"message": "¿Qué proyectos tengo?"}'
```
