#!/bin/bash

# Test script for admin API endpoints
# JWT_SECRET and MASTER_KEY are configured in .env.local

BASE_URL="http://localhost:3000"
# Generate a valid JWT token for admin user:
# node -e "
#   const { generateToken } = require('./src/lib/auth');
#   const token = generateToken({
#     userId: 'admin-user-id',
#     email: 'admin@klowezone.com',
#     role: 'superadmin'
#   });
#   console.log('Token:', token);
# "
TOKEN="GENERATE_VALID_ADMIN_JWT_TOKEN_HERE"

echo "🧪 Testing Admin API Endpoints"
echo "================================"
echo ""

echo "📋 Testing /api/admin/automations (GET - List workflows)"
echo "------------------------------------------------------"

echo "❌ Without token (expected: 401):"
curl -X GET "$BASE_URL/api/admin/automations" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n"

echo "✅ With valid token (expected: 200):"
curl -X GET "$BASE_URL/api/admin/automations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -w "\nStatus: %{http_code}\n\n"

echo ""

echo "📋 Testing /api/admin/automations (POST - Create workflow)"
echo "--------------------------------------------------------"

echo "❌ Without token (expected: 401):"
curl -X POST "$BASE_URL/api/admin/automations" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Workflow","trigger":"MANUAL","actions":[]}' \
  -w "\nStatus: %{http_code}\n\n"

echo "✅ With valid token (expected: 201):"
curl -X POST "$BASE_URL/api/admin/automations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Test Workflow","trigger":"MANUAL","actions":[]}' \
  -w "\nStatus: %{http_code}\n\n"

echo ""

echo "📋 Testing /api/admin/automations/[id] (PUT - Update workflow)"
echo "-----------------------------------------------------------"

echo "❌ Without token (expected: 401):"
curl -X PUT "$BASE_URL/api/admin/automations/test-id-123" \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Workflow"}' \
  -w "\nStatus: %{http_code}\n\n"

echo "✅ With valid token (expected: 200):"
curl -X PUT "$BASE_URL/api/admin/automations/test-id-123" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Updated Workflow"}' \
  -w "\nStatus: %{http_code}\n\n"

echo ""

echo "📋 Testing /api/admin/automations/[id] (DELETE - Delete workflow)"
echo "--------------------------------------------------------------"

echo "❌ Without token (expected: 401):"
curl -X DELETE "$BASE_URL/api/admin/automations/test-id-123" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n"

echo "✅ With valid token (expected: 200):"
curl -X DELETE "$BASE_URL/api/admin/automations/test-id-123" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -w "\nStatus: %{http_code}\n\n"

echo ""

echo "📋 Testing /api/admin/automations/[id] (PATCH - Toggle workflow)"
echo "--------------------------------------------------------------"

echo "❌ Without token (expected: 401):"
curl -X PATCH "$BASE_URL/api/admin/automations/test-id-123" \
  -H "Content-Type: application/json" \
  -d '{"isActive":true}' \
  -w "\nStatus: %{http_code}\n\n"

echo "✅ With valid token (expected: 200):"
curl -X PATCH "$BASE_URL/api/admin/automations/test-id-123" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"isActive":true}' \
  -w "\nStatus: %{http_code}\n\n"

echo ""

echo "📋 Testing /api/admin/automations/trigger (POST - Trigger automation)"
echo "-------------------------------------------------------------------"

echo "❌ Without token (expected: 401):"
curl -X POST "$BASE_URL/api/admin/automations/trigger" \
  -H "Content-Type: application/json" \
  -d '{"triggerType":"NEW_LEAD"}' \
  -w "\nStatus: %{http_code}\n\n"

echo "✅ With valid token (expected: 200):"
curl -X POST "$BASE_URL/api/admin/automations/trigger" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"triggerType":"NEW_LEAD"}' \
  -w "\nStatus: %{http_code}\n\n"

echo ""

echo "📋 Testing /api/admin/jobs/process (POST - Process jobs)"
echo "------------------------------------------------------"

echo "❌ Without token (expected: 401):"
curl -X POST "$BASE_URL/api/admin/jobs/process" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n"

echo "✅ With valid token (expected: 200):"
curl -X POST "$BASE_URL/api/admin/jobs/process" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -w "\nStatus: %{http_code}\n\n"

echo ""
echo "🎯 Summary of expected status codes:"
echo "===================================="
echo "❌ Without token: 401 (Authentication required)"
echo "✅ With valid token: 200/201 (Success)"
echo "🚫 Without permissions: 403 (Insufficient permissions)"
echo ""
echo "📝 Notes:"
echo "- Replace YOUR_JWT_TOKEN with a valid admin JWT token"
echo "- Some endpoints may return 403 if user lacks specific permissions"
echo "- Endpoints validate permissions based on user role and assigned permissions"
