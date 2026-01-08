// Test del flujo completo del admin
const https = require('http');

async function testAdminFlow() {
  console.log('🔐 Probando flujo completo del admin...\n');

  // Paso 1: Login
  console.log('1️⃣ Intentando login...');
  const loginResponse = await makeRequest('/api/auth/login', 'POST', {
    email: 'admin@klowezone.com',
    password: 'SuperAdmin123!'
  });

  if (loginResponse.status !== 200) {
    console.log('❌ Login falló:', loginResponse.status);
    return;
  }

  console.log('✅ Login exitoso');

  // Paso 2: Verificar que puede acceder al dashboard
  console.log('\n2️⃣ Verificando acceso al dashboard...');
  const dashboardResponse = await makeRequest('/dashboard');

  if (dashboardResponse.status === 302 && dashboardResponse.headers.location?.includes('/onboarding')) {
    console.log('❌ Dashboard redirige a onboarding');
    return;
  }

  if (dashboardResponse.status === 200) {
    console.log('✅ Dashboard accesible sin onboarding');
  } else {
    console.log('⚠️ Estado inesperado del dashboard:', dashboardResponse.status);
  }

  // Paso 3: Verificar acceso al admin
  console.log('\n3️⃣ Verificando acceso al panel admin...');
  const adminResponse = await makeRequest('/admin');

  if (adminResponse.status === 302 && adminResponse.headers.location?.includes('/login')) {
    console.log('❌ Admin requiere login (esperado si no hay cookie)');
  } else if (adminResponse.status === 200) {
    console.log('✅ Admin accesible');
  } else {
    console.log('⚠️ Estado inesperado del admin:', adminResponse.status);
  }

  console.log('\n🎉 Flujo de admin completado');
}

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', (error) => {
      resolve({ status: 0, error: error.message });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

testAdminFlow();



