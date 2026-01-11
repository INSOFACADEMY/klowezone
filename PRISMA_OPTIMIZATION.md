# 🗄️ OPTIMIZACIÓN PRISMA - KLOWEZONE

## 📊 ANÁLISIS ACTUAL DEL ESQUEMA

### **Tablas Multi-Tenant Principales**
- `organizations` (15 registros actuales)
- `organization_members` (15 registros actuales)
- `users` (registros de Supabase)
- `audit_logs` (logs de auditoría)
- `api_keys` (claves de API)
- `event_logs` (logs de webhooks)

### **Índices Actuales**
```sql
-- Organizations
@@map("organizations")

-- Organization Members
@@index([organizationId])
@@index([userId])
@@unique([organizationId, userId])

-- API Keys
@@index([organizationId])
@@unique([keyPrefix, organizationId])

-- Audit Logs
@@index([organizationId, action])
@@index([organizationId, createdAt])

-- Event Logs
@@index([organizationId, eventType])
@@unique([organizationId, idempotencyKey])
```

---

## 🔧 OPTIMIZACIONES RECOMENDADAS

### **1. Índices Estratégicos Adicionales**

```prisma
model OrganizationMember {
  // ... campos existentes ...
  @@index([organizationId, role]) // Para consultas por rol en org
  @@index([userId, organizationId]) // Para membresías de usuario
}

model AuditLog {
  // ... campos existentes ...
  @@index([organizationId, resource]) // Para filtrar por recurso
  @@index([organizationId, userId]) // Para auditoría por usuario
  @@index([createdAt]) // Para rangos de fecha globales
}

model EventLog {
  // ... campos existentes ...
  @@index([organizationId, createdAt]) // Para eventos por tiempo
  @@index([eventType, createdAt]) // Para análisis global
}

model ApiKey {
  // ... campos existentes ...
  @@index([organizationId, isRevoked]) // Para claves activas
  @@index([lastUsedAt]) // Para claves inactivas
}
```

### **2. Optimización de Consultas**

#### **Problema Actual:** Consultas N+1 en relaciones
```typescript
// INEFICIENTE - Causa N+1 queries
const orgs = await prisma.organization.findMany({
  include: {
    members: true,
    apiKeys: true,
    auditLogs: true
  }
})
```

#### **Solución Recomendada:**
```typescript
// EFICIENTE - Usa select y limita campos
const orgs = await prisma.organization.findMany({
  select: {
    id: true,
    name: true,
    _count: {
      select: {
        members: true,
        apiKeys: true,
        auditLogs: true
      }
    }
  }
})
```

### **3. Paginación Optimizada**

#### **Implementar Cursor-Based Pagination**
```typescript
// Para listas grandes
async function getAuditLogsPaginated(orgId: string, cursor?: string, limit = 50) {
  return await prisma.auditLog.findMany({
    where: { organizationId: orgId },
    take: limit,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: 'desc' }
  })
}
```

### **4. Connection Pooling**

#### **Configuración Recomendada:**
```typescript
// En lib/prisma.ts
export const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],

  // Connection pooling
  transactionOptions: {
    maxWait: 5000, // 5 segundos máximo de espera
    timeout: 10000, // 10 segundos timeout
  },
})
```

---

## 📈 EVALUACIÓN PARA 10,000 ORGANIZACIONES

### **Hipótesis de Crecimiento**
- **10,000 organizaciones activas**
- **Promedio 5 miembros por organización** = 50,000 usuarios
- **Promedio 10 API keys por organización** = 100,000 API keys
- **Promedio 100 eventos/día por organización** = 1M eventos/día
- **Promedio 50 acciones auditadas/día por organización** = 500K auditorías/día

### **Análisis de Rendimiento**

#### **1. Consultas por Organización**
```typescript
// Query actual (con índices optimizados)
const orgData = await prisma.organization.findUnique({
  where: { id: orgId },
  include: {
    members: { where: { role: 'OWNER' } }, // Indexado
    apiKeys: { where: { isRevoked: false } }, // Indexado
    _count: {
      select: { auditLogs: true, eventLogs: true }
    }
  }
})
// Tiempo estimado: < 50ms
```

#### **2. Listados Paginados**
```typescript
// Para dashboards con paginación
const events = await prisma.eventLog.findMany({
  where: { organizationId: orgId },
  orderBy: { createdAt: 'desc' },
  take: 20,
  skip: page * 20
})
// Con índices: < 100ms para páginas profundas
```

#### **3. Búsquedas y Filtros**
```typescript
// Búsqueda de auditoría
const audits = await prisma.auditLog.findMany({
  where: {
    organizationId: orgId,
    action: 'user.login',
    createdAt: { gte: startDate }
  }
})
// Con índices compuestos: < 200ms
```

### **Estimaciones de Almacenamiento**

#### **Por Organización (Mensual)**
- **Event Logs:** ~3MB (100 eventos/día × 30 días × ~1KB/evento)
- **Audit Logs:** ~1.5MB (50 acciones/día × 30 días × ~1KB/acción)
- **API Keys:** ~0.1MB (10 keys × metadatos)

#### **Total para 10k Organizaciones**
- **Event Logs:** ~30GB/mes
- **Audit Logs:** ~15GB/mes
- **API Keys:** ~1GB total
- **Base:** ~50GB total (con réplicas y backups)

### **Estrategias de Escalabilidad**

#### **1. Particionamiento por Organización**
```sql
-- Crear particiones por rango de organization_id
CREATE TABLE audit_logs_y2024 PARTITION OF audit_logs
  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- Para organizaciones grandes
CREATE TABLE audit_logs_org_123 PARTITION OF audit_logs
  FOR VALUES IN ('org-123');
```

#### **2. Archivado Automático**
```typescript
// Archivar logs antiguos automáticamente
async function archiveOldLogs() {
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  await prisma.auditLog.updateMany({
    where: {
      createdAt: { lt: threeMonthsAgo },
      archived: false
    },
    data: { archived: true }
  })
}
```

#### **3. Read Replicas**
```typescript
// Para consultas de solo lectura
const readPrisma = new PrismaClient({
  datasourceUrl: process.env.READ_REPLICA_URL
})

// Usar read replica para dashboards
const dashboardData = await readPrisma.eventLog.findMany({...})
```

### **Configuración de Base de Datos**

#### **PostgreSQL para 10k Orgs**
```sql
-- Configuración recomendada
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;

-- Connection pooling
ALTER SYSTEM SET max_connections = 200;
-- Usar PgBouncer para pool de conexiones
```

#### **Índices Optimizados**
```sql
-- Índices parciales para datos activos
CREATE INDEX CONCURRENTLY idx_audit_logs_active
  ON audit_logs(organization_id, created_at)
  WHERE archived = false;

-- Índices por organización para aislamiento
CREATE INDEX CONCURRENTLY idx_event_logs_org_time
  ON event_logs(organization_id, created_at DESC)
  WHERE created_at > NOW() - INTERVAL '90 days';
```

### **Monitoreo y Alertas**

#### **Queries para Monitoreo**
```sql
-- Rendimiento por organización
SELECT
  organization_id,
  COUNT(*) as total_queries,
  AVG(duration_ms) as avg_duration,
  MAX(duration_ms) as max_duration
FROM query_logs
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY organization_id
ORDER BY avg_duration DESC;

-- Uso de almacenamiento por organización
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE tablename LIKE '%audit_logs%' OR tablename LIKE '%event_logs%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### **Recomendaciones de Infraestructura**

#### **Para 10k Organizaciones**
- **CPU:** 4-8 cores
- **RAM:** 16-32 GB
- **Storage:** 500GB SSD (con crecimiento)
- **Read Replicas:** 2-3 réplicas
- **Connection Pooler:** PgBouncer o similar

#### **Escalado Horizontal**
```typescript
// Implementar sharding por organización
function getShardForOrg(orgId: string): string {
  const shard = parseInt(orgId.slice(-2), 16) % 4; // 4 shards
  return `shard_${shard}`;
}
```

### **Métricas de Rendimiento Objetivo**

| Operación | Tiempo Objetivo | Percentil 95 |
|-----------|----------------|--------------|
| Login | < 500ms | < 1s |
| Dashboard load | < 2s | < 5s |
| API Key verification | < 100ms | < 200ms |
| Event ingestion | < 200ms | < 500ms |
| Audit log query | < 300ms | < 1s |

### **Plan de Migración**

#### **Fase 1: Optimización Actual**
- [ ] Agregar índices recomendados
- [ ] Implementar paginación cursor-based
- [ ] Configurar connection pooling

#### **Fase 2: Monitoreo**
- [ ] Implementar métricas de rendimiento
- [ ] Configurar alertas automáticas
- [ ] Establecer baselines

#### **Fase 3: Escalado**
- [ ] Implementar read replicas
- [ ] Configurar archivado automático
- [ ] Preparar particionamiento

---

## 📊 CONCLUSIONES

**Estado Actual:** ADECUADO para 10k organizaciones con optimizaciones

**Recomendaciones:**
1. ✅ Implementar índices adicionales
2. ✅ Configurar read replicas
3. ✅ Implementar archivado automático
4. ✅ Monitoreo continuo de rendimiento

**Tiempo Estimado:** 2-3 semanas para optimizaciones completas

**Capacidad:** Sistema puede manejar 10k+ organizaciones con configuración adecuada







