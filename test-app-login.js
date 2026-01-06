// Test login through the app's API
const https = require('http');

async function testAppLogin() {
  console.log('🔐 Probando login a través de la aplicación...\n');

  const postData = JSON.stringify({
    email: 'admin@klowezone.com',
    password: 'SuperAdmin123!'
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const responseData = JSON.parse(data);
          console.log('📡 Status:', res.statusCode);
          console.log('📄 Response:', JSON.stringify(responseData, null, 2));

          if (res.statusCode === 200 && responseData.success) {
            console.log('\n✅ ¡LOGIN EXITOSO! El usuario puede acceder a la aplicación');
          } else {
            console.log('\n❌ Login falló:', responseData.error || responseData.message);
          }
          resolve();
        } catch (error) {
          console.log('❌ Error parsing response:', error.message);
          console.log('📄 Raw response:', data);
          resolve();
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Error de conexión:', error.message);
      console.log('💡 Asegúrate de que el servidor esté corriendo: npm run dev');
      resolve();
    });

    req.write(postData);
    req.end();
  });
}

testAppLogin();
