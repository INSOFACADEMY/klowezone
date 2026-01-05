#!/bin/bash

# Script de prueba para la API Multi-Tenant
# Ejecutar: bash test-multi-tenant-api.sh

echo "🧪 PRUEBA DE API MULTI-TENANT - /api/me/org"
echo "==========================================="
echo ""

# NOTA: Reemplaza estos valores con los reales de tu setup
BASE_URL="http://localhost:3000"
JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWp6YmF4dzAwMjAwaTB1dnh1M3ZwMjcwIiwicm9sZSI6InN1cGVyYWRtaW4iLCJpYXQiOjE3MzI3MjA4ODUsImV4cCI6MTczMjcyNDQ4NX0.example-token-replace-with-real-one"

# IDs de organizaciones (reemplaza con los reales)
ORG_1_ID="cmjzbv8yi0000kcuvl3b09obh"  # Default Organization
ORG_2_ID="REPLACE_WITH_SECOND_ORG_ID"  # Test Organization
INVALID_ORG_ID="invalid-org-id-123"

echo "🔑 Usando JWT Token (primeros 50 caracteres):"
echo "${JWT_TOKEN:0:50}..."
echo ""

echo "📋 ESCENARIO 1: Obtener organización actual (sin force)"
echo "------------------------------------------------------"
echo "Esperado: 200 OK, retorna org activa del usuario"
curl -s -X GET "$BASE_URL/api/me/org" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" | jq . 2>/dev/null || echo "Respuesta raw (jq no disponible):"
curl -s -X GET "$BASE_URL/api/me/org" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json"
echo -e "\nStatus: $(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/api/me/org" -H "Authorization: Bearer $JWT_TOKEN" -H "Content-Type: application/json")"
echo ""

echo "📋 ESCENARIO 2: Force orgId inválida (usuario NO es miembro)"
echo "------------------------------------------------------------"
echo "Esperado: 400 Bad Request, error NOT_MEMBER"
curl -s -X GET "$BASE_URL/api/me/org?force=$INVALID_ORG_ID" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" | jq . 2>/dev/null || echo "Respuesta raw:"
curl -s -X GET "$BASE_URL/api/me/org?force=$INVALID_ORG_ID" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json"
echo -e "\nStatus: $(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/api/me/org?force=$INVALID_ORG_ID" -H "Authorization: Bearer $JWT_TOKEN" -H "Content-Type: application/json")"
echo ""

echo "📋 ESCENARIO 3: Force orgId válida (usuario SÍ es miembro)"
echo "----------------------------------------------------------"
echo "Esperado: 200 OK, cambia a la org forzada, forced: true"
curl -s -X GET "$BASE_URL/api/me/org?force=$ORG_2_ID" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" | jq . 2>/dev/null || echo "Respuesta raw:"
curl -s -X GET "$BASE_URL/api/me/org?force=$ORG_2_ID" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json"
echo -e "\nStatus: $(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/api/me/org?force=$ORG_2_ID" -H "Authorization: Bearer $JWT_TOKEN" -H "Content-Type: application/json")"
echo ""

echo "📋 ESCENARIO 4: Verificar que se mantuvo la org forzada"
echo "--------------------------------------------------------"
echo "Esperado: 200 OK, retorna la org forzada anteriormente"
curl -s -X GET "$BASE_URL/api/me/org" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" | jq . 2>/dev/null || echo "Respuesta raw:"
curl -s -X GET "$BASE_URL/api/me/org" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json"
echo -e "\nStatus: $(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/api/me/org" -H "Authorization: Bearer $JWT_TOKEN" -H "Content-Type: application/json")"
echo ""

echo "🎯 RESUMEN ESPERADO:"
echo "===================="
echo "• Escenario 1: 200 OK, organización actual del usuario"
echo "• Escenario 2: 400 Bad Request (NOT_MEMBER)"
echo "• Escenario 3: 200 OK, organización forzada (forced: true)"
echo "• Escenario 4: 200 OK, mantiene la organización forzada"
echo ""

echo "📝 INSTRUCCIONES:"
echo "================="
echo "1. Reemplaza JWT_TOKEN con un token válido de admin"
echo "2. Reemplaza ORG_2_ID con el ID real de la segunda organización"
echo "3. Asegúrate de que NODE_ENV=development para usar ?force="
echo "4. Ejecuta: bash test-multi-tenant-api.sh"
echo ""

echo "🔧 PARA OBTENER LOS IDs REALES:"
echo "================================"
echo "npx tsx -e \""
echo "import { prisma } from './src/lib/prisma';"
echo "(async () => {"
echo "  const user = await prisma.user.findFirst({"
echo "    include: { organizationMemberships: { include: { organization: true } } }"
echo "  });"
echo "  console.log('USER_ID:', user?.id);"
echo "  user?.organizationMemberships.forEach(m =>"
echo "    console.log('ORG:', m.organization.id, m.organization.name));"
echo "  await prisma.\$disconnect();"
echo "})();"
echo "\""

