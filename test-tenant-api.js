// Script de prueba para el API de tenant
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000'; // Asumiendo que corre en desarrollo

async function testTenantAPI() {
  console.log('🧪 Probando API de Tenant...\n');

  try {
    // Prueba 1: Obtener org actual (sin force)
    console.log('📋 Prueba 1: Obtener organización actual');
    const response1 = await fetch(`${BASE_URL}/api/me/org`);
    const data1 = await response1.json();
    console.log('Status:', response1.status);
    console.log('Response:', JSON.stringify(data1, null, 2));
    console.log('');

    // Prueba 2: Forzar orgId inválida (debe ignorar)
    console.log('📋 Prueba 2: Forzar orgId inválida (no miembro)');
    const response2 = await fetch(`${BASE_URL}/api/me/org?force=invalid-org-id-123`);
    const data2 = await response2.json();
    console.log('Status:', response2.status);
    console.log('Response:', JSON.stringify(data2, null, 2));
    console.log('');

    // Prueba 3: Forzar orgId válida (debe devolver esa)
    console.log('📋 Prueba 3: Forzar orgId válida');
    const response3 = await fetch(`${BASE_URL}/api/me/org?force=cmjzbv8yi0000kcuvl3b09obh`);
    const data3 = await response3.json();
    console.log('Status:', response3.status);
    console.log('Response:', JSON.stringify(data3, null, 2));
    console.log('');

    // Prueba 4: Verificar que se mantuvo la org forzada
    console.log('📋 Prueba 4: Verificar que se mantuvo la org forzada');
    const response4 = await fetch(`${BASE_URL}/api/me/org`);
    const data4 = await response4.json();
    console.log('Status:', response4.status);
    console.log('Response:', JSON.stringify(data4, null, 2));

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
  }
}

testTenantAPI();
