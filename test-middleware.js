// Test del middleware
const https = require('http');

async function testMiddleware() {
  console.log('🧪 Probando middleware de protección admin...\n');

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/admin',
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      console.log('📡 Status Code:', res.statusCode);
      console.log('📍 Location Header:', res.headers.location || 'Ninguno');

      if (res.statusCode === 302 && res.headers.location) {
        console.log('✅ MIDDLEWARE FUNCIONANDO: Redirigió correctamente a login');
      } else if (res.statusCode === 200) {
        console.log('❌ MIDDLEWARE FALLANDO: Permitió acceso sin autenticación');
      } else {
        console.log('⚠️ Respuesta inesperada:', res.statusCode);
      }

      res.on('data', (chunk) => {
        // Consumir los datos para cerrar la conexión
      });

      res.on('end', () => {
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log('❌ Error de conexión:', error.message);
      console.log('💡 Asegúrate de que el servidor esté corriendo: npm run dev');
      resolve();
    });

    req.end();
  });
}

testMiddleware();



