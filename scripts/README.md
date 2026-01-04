# Scripts de Utilidad - Klowezone

Esta carpeta contiene scripts de utilidad para testing, configuración y mantenimiento del proyecto Klowezone.

## 📁 Scripts Disponibles

### 👔 `test-chief-growth-officer.ts` - Demostración del Chief Growth Officer

**Propósito:** Muestra cómo funciona el agente IA Chief Growth Officer en acción.

**Qué hace:**
- Simula el análisis de métricas de ROI existentes
- Demuestra las 3 variantes psicológicas de campañas
- Genera imágenes para cada variante
- Proporciona recomendaciones data-driven
- Muestra el flujo completo de generación de campañas

**Uso:**
```bash
npm run test-cgo
```

**Salida de ejemplo:**
```
👔 === CHIEF GROWTH OFFICER DEMO ===

🎯 FASE 1: Análisis de Performance Actual
📊 Analizando métricas de ROI existentes...
📈 MÉTRICAS CONSOLIDADAS:
   💰 Inversión Total: $1250
   💸 Revenue Generado: $3800
   📊 ROI General: 204%

🎭 VARIANTE A: DOLOR (Problem/Solution)
   📝 Descripción: Enfocada en el tiempo perdido sin automatización
   🖼️ Imagen generada: https://api.dalle.mock/image/...

🚀 RECOMENDACIÓN FINAL:
   ✅ Elige la VARIANTE B (Deseo/Status) para maximizar ROI
```

### 📊 `test-campaigns.ts` - Sistema Completo de Rastreo de Campañas

**Propósito:** Prueba completa del sistema de atribución de ROI y rastreo de campañas.

**Qué hace:**
- ✅ Simula llegada a página con `fb_campaign_id`
- ✅ Verifica almacenamiento y recuperación del localStorage
- ✅ Prueba limpieza automática después de registro
- ✅ Valida manejo de expiración de campañas
- ✅ Testea diferentes tipos de parámetros de campaña
- ✅ Confirma integración con sistema de ROI

**Uso:**
```bash
npm run test-campaigns
```

**Ejemplo de salida:**
```
🧪 Probando sistema de rastreo de campañas...
1️⃣ TEST: Detección de campaign_id en URL
   ✅ Campaign ID guardado: 6970537367061

2️⃣ TEST: Recuperación de campaign_id almacenado
   ✅ Coincide con original: true

5️⃣ TEST: Diferentes tipos de parámetros
   ✅ fb_campaign_id: true
   ✅ utm_campaign: true
   ✅ Priorización correcta: true

🎉 Todos los tests completados exitosamente!
```

### 🔍 `test-meta.ts` - Verificar Estado de Cuenta Meta (Facebook Ads)

**Propósito:** Verifica el estado de una cuenta publicitaria de Meta (Facebook Ads) mediante la Graph API.

**Uso:**
```bash
npm run test-meta
```

**Requisitos:**
- Variables de entorno configuradas en `.env.local`:
  - `META_ACCESS_TOKEN`: Access token válido de Meta
  - `META_AD_ACCOUNT_ID`: ID de la cuenta publicitaria (sin el prefijo 'act_')

**Ejemplo de salida:**
```
🔍 Verificando estado de cuenta publicitaria Meta...
📡 Account ID: act_1392389852618164
🌐 URL: https://graph.facebook.com/v24.0/act_1392389852618164?fields=account_status,disable_reason&access_token=***TOKEN***

✅ Respuesta exitosa de Meta API:
   Account ID: act_1392389852618164
   Account Status: 1
🟢 Estado: ACTIVA
   La cuenta publicitaria está activa y lista para crear campañas.
```

**Estados de Cuenta:**
- `1` - 🟢 **ACTIVA**: La cuenta está activa y puede crear campañas
- `2` - 🔴 **DESHABILITADA**: La cuenta está deshabilitada (ver `disable_reason`)
- `3` - 🟡 **EN REVISIÓN**: La cuenta está siendo revisada por Meta
- `7` - ⏸️ **PAUSADA**: La cuenta está pausada temporalmente
- `9` - ⏳ **PENDIENTE**: La cuenta está pendiente de aprobación
- `101` - 🚫 **RECHAZADA**: La cuenta fue rechazada

**Configuración:**
1. Obtén un access token de Meta Business Manager
2. Añade al archivo `.env.local`:
   ```
   META_ACCESS_TOKEN=tu_access_token_aqui
   META_AD_ACCOUNT_ID=tu_account_id_aqui
   ```
3. Ejecuta el script: `npm run test-meta`

**Solución de Problemas:**
- **Error 401**: Access token inválido o expirado
- **Error 403**: Sin permisos para acceder a la cuenta
- **Error de conexión**: Verificar conexión a internet

### 📢 `test-facebook-campaign.ts` - Probar Creación de Campañas Facebook

**Propósito:** Prueba la funcionalidad de creación de campañas de Facebook Ads del agente IA.

**Uso:**
```bash
npm run test-facebook
```

**Qué hace:**
- Crea una campaña de prueba con datos de ejemplo
- Si las credenciales están configuradas: crea campaña real en Facebook
- Si no hay credenciales: simula la creación y devuelve ID ficticio
- Muestra todos los detalles de la campaña creada

**Ejemplo de salida (con credenciales):**
```
📝 Datos de la campaña:
   Nombre: Campaña de Prueba - Verano 2024
   Presupuesto diario: $25
   Texto del anuncio: ¡Descubre nuestros productos de verano...
   Objetivo: OUTCOME_TRAFFIC

🚀 Creando campaña...
Agente creando campaña real de Facebook:
Campaña de Facebook creada exitosamente: 6970537367061

📊 Resultado:
   Éxito: true
   Mensaje: Campaña "Campaña de Prueba - Verano 2024" creada exitosamente en Facebook Ads
   ID de campaña: 6970537367061

💡 Modo: PRODUCCIÓN (API real)
```

**Ejemplo de salida (sin credenciales):**
```
📝 Datos de la campaña:
   Nombre: Campaña de Prueba - Verano 2024
   Presupuesto diario: $25
   Texto del anuncio: ¡Descubre nuestros productos...
   Objetivo: OUTCOME_TRAFFIC

🚀 Creando campaña...
Agente usando simulación - credenciales de Meta no configuradas

📊 Resultado:
   Éxito: true
   Mensaje: Campaña "Campaña de Prueba - Verano 2024" simulada exitosamente (credenciales no configuradas)
   ID de campaña: fb_campaign_1234567890_abc123def

💡 Modo: SIMULACIÓN (sin credenciales)
```

**Configuración requerida para modo real:**
- `META_ACCESS_TOKEN`: Access token válido
- `META_AD_ACCOUNT_ID`: ID de cuenta publicitaria

### 📊 `test-weekly-report.ts` - Reporte Semanal Profit-First

**Propósito:** Prueba el endpoint del reporte semanal automatizado que genera análisis Profit-First.

**Qué hace:**
- Ejecuta el endpoint `/api/cron/weekly-growth-report`
- Recopila métricas de campañas de la semana anterior
- Genera análisis ejecutivo con IA (CGO)
- Calcula distribución Profit-First
- Muestra campaña estrella y agujeros negros
- Proporciona recomendaciones estratégicas

**Uso:**
```bash
npm run test-weekly-report
```

**Salida de ejemplo:**
```
🧪 Probando endpoint del reporte semanal Profit-First...

📊 Resultado del Reporte Semanal:
==================================================
📅 Semana: 12/23/2025 - 12/29/2025
💰 Revenue Total: $2450.00
📈 Gasto Total: $1200.00
🎯 Leads Totales: 45
📊 ROI General: 104.2%

⭐ CAMPAÑA ESTRELLA:
   Nombre: Campaña Verano 2024
   ROI: 180.5%
   Revenue: $1800.00

🎯 ANÁLISIS CGO:
[Análisis ejecutivo generado por IA]

🚀 RECOMENDACIONES:
   1. 🚀 ROI excelente. Considera aumentar presupuesto...
   2. ⭐ Duplica presupuesto de "Campaña Verano 2024"...

💰 DISTRIBUCIÓN PROFIT-FIRST:
   Revenue Bruto: $2450.00
   Profit First (50%): $1225.00
   → Compensación Owner (30%): $367.50
   → Distribución Utilidades (20%): $245.00
   → Impuestos Owner (30%): $367.50
   → Reserva Utilidades (20%): $245.00
```

**Requisitos:**
- Servidor corriendo en `http://localhost:3000`
- Base de datos conectada con datos de campañas
- Variables de entorno configuradas
- OpenAI API key para análisis CGO

## 🚀 Ejecutar Scripts

Todos los scripts pueden ejecutarse usando:

```bash
# Usando npm (recomendado)
npm run test-meta

# O directamente con tsx
npx tsx scripts/test-meta.ts
```

## 📝 Notas

- Los scripts están escritos en TypeScript para mejor type safety
- Usan `tsx` para ejecución directa sin compilación previa
- Incluyen manejo completo de errores y logging detallado
- Están diseñados para desarrollo y testing, no para producción
