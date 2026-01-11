# 🔄 AUDITORÍA UI - Organization Switcher en AdminDashboard

## 🎯 OBJETIVO
Verificar que el Organization Switcher funcione correctamente en el topbar del AdminDashboard, incluyendo búsqueda, cambio de organización y feedback visual.

## 📋 PRE-REQUISITOS
- Usuario con acceso a múltiples organizaciones (OWNER/MEMBER/ADMIN)
- Navegador web moderno (Chrome/Firefox/Edge)
- Conexión a internet estable
- Token de autenticación válido

## 🧪 ESCENARIOS DE PRUEBA

### **Escenario 1: Usuario con Múltiples Organizaciones**

#### **Paso 1: Acceso al AdminDashboard**
```
URL: /admin/dashboard
Resultado esperado: ✅ Topbar muestra Organization Switcher con org activa
```

#### **Paso 2: Verificación de Estado Inicial**
```
Elementos a verificar:
□ Organization Switcher visible en topbar (lado derecho)
□ Nombre de organización activa mostrado
□ Badge de rol (OWNER/MEMBER/VIEWER) visible
□ Icono de edificio presente
□ Dropdown cerrado por defecto
```

#### **Paso 3: Abrir Dropdown**
```
Acción: Click en Organization Switcher
Resultado esperado:
□ Dropdown se abre hacia abajo
□ Lista de organizaciones disponibles
□ Organización actual marcada con check verde
□ Campo de búsqueda visible en la parte superior
□ Backdrop cubre la pantalla
```

#### **Paso 4: Funcionalidad de Búsqueda**
```
Acción: Escribir texto en campo de búsqueda
Ejemplos:
- "test" → filtra organizaciones con "test"
- "org-a" → muestra solo organizaciones con "org-a"
- "" → muestra todas las organizaciones
Resultado esperado:
□ Filtrado en tiempo real
□ Case insensitive
□ Busca en nombre Y slug
```

#### **Paso 5: Cambio de Organización**
```
Acción: Click en organización diferente
Resultado esperado:
□ Loading spinner aparece
□ API call a /api/me/org/switch
□ Dropdown se cierra automáticamente
□ Toast verde aparece: "Organización cambiada"
□ Página se refresca (router.refresh)
□ Nueva organización activa en switcher
□ Badge de rol actualizado
```

#### **Paso 6: Verificación de Persistencia**
```
Acción: Recargar página (F5)
Resultado esperado:
□ Organización seleccionada persiste
□ Switcher muestra la organización correcta
□ Badge de rol correcto
```

#### **Paso 7: Manejo de Errores**
```
Acciones a probar:
□ Intentar cambiar a org sin permisos
□ Token expirado/inválido
□ Error de red durante cambio
Resultado esperado:
□ Mensaje de error claro
□ Estado visual apropiado (loading → error)
□ No cambio de organización
```

### **Escenario 2: Usuario con Una Sola Organización**

#### **Paso 1: Estado Visual**
```
Resultado esperado:
□ Organization Switcher visible pero deshabilitado
□ Opacidad reducida (50%)
□ Cursor "not-allowed"
□ Tooltip al hacer hover: "Solo tienes acceso a una organización"
```

#### **Paso 2: Funcionalidad**
```
Acción: Click en switcher deshabilitado
Resultado esperado:
□ No abre dropdown
□ No hace API calls
□ Tooltip informativo visible
```

## 🔍 VERIFICACIÓN TÉCNICA

### **API Endpoints**
```bash
# Verificar endpoint de lista
curl -H "Authorization: Bearer YOUR_TOKEN" /api/me/orgs
# Expected: 200 OK with organizations array

# Verificar endpoint de cambio
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"orgId": "org-id-here"}' \
  /api/me/org/switch
# Expected: 200 OK with success message
```

### **Componente React**
```typescript
// Verificar props y estado
□ isOpen: boolean (dropdown state)
□ isLoading: boolean (switching state)
□ data: OrgData (organizations + current)
□ error: string | null (error messages)
□ searchQuery: string (search filter)
□ showToast: boolean (success feedback)
```

### **Responsive Design**
```
Breakpoints a verificar:
□ Desktop (>1024px): Switcher completo
□ Tablet (768px-1024px): Texto truncado si necesario
□ Mobile (<768px): Switcher adaptado
```

## 📸 SCREENSHOTS RECOMENDADOS

### **Estado Inicial**
- Topbar con Organization Switcher cerrado
- Mostrar organización activa y rol

### **Dropdown Abierto**
- Lista completa de organizaciones
- Campo de búsqueda
- Organización actual destacada

### **Búsqueda Activa**
- Texto en campo de búsqueda
- Resultados filtrados

### **Cambio en Progreso**
- Loading spinner visible
- Dropdown aún abierto

### **Toast de Éxito**
- Toast verde en esquina superior derecha
- Mensaje "Organización cambiada"

### **Estado de Error**
- Mensaje de error visible
- Switcher en estado normal

### **Modo Una Organización**
- Switcher deshabilitado con tooltip
- Estilo visual diferenciado

## ✅ CRITERIOS DE APROBACIÓN

- [ ] **Funcionalidad Core**: Cambio de organización funciona
- [ ] **UX/UI**: Interfaz intuitiva y responsive
- [ ] **Búsqueda**: Filtrado funciona correctamente
- [ ] **Feedback**: Toast de éxito visible
- [ ] **Persistencia**: Organización persiste en reload
- [ ] **Manejo de Errores**: Estados de error apropiados
- [ ] **Accesibilidad**: Keyboard navigation y screen readers
- [ ] **Performance**: Carga rápida, sin lag
- [ ] **Edge Cases**: Una sola org, permisos insuficientes

## 🐛 BUGS CONOCIDOS Y SOLUCIONES

### **Issue: Dropdown no se cierra automáticamente**
```typescript
// Solución: Agregar setIsOpen(false) después del éxito
setIsOpen(false)
setSearchQuery('')
```

### **Issue: Toast no aparece**
```typescript
// Solución: Verificar estado showToast y timeout
setShowToast(true)
setTimeout(() => setShowToast(false), 3000)
```

### **Issue: Búsqueda no filtra correctamente**
```typescript
// Solución: Usar useMemo para filteredOrganizations
const filteredOrganizations = useMemo(() => {
  return data?.organizations.filter(org =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []
}, [data?.organizations, searchQuery])
```

## 📊 RESULTADOS DE LA AUDITORÍA

### **Puntuación Global: __/10**

| Categoría | Puntuación | Comentarios |
|-----------|------------|-------------|
| Funcionalidad | __/10 | |
| UX/UI | __/10 | |
| Performance | __/10 | |
| Accesibilidad | __/10 | |
| Manejo de Errores | __/10 | |

### **Recomendaciones de Mejora:**
1.
2.
3.

### **Conclusión:**
[APROBADO/REQUIERE CORRECCIONES/RECHAZADO]

---

*Auditoría realizada el: [FECHA]*
*Versión probada: [VERSION]*
*Browser: [BROWSER]*







