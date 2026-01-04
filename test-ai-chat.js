// Script de prueba para la API de chat con IA
// Ejecutar con: node test-ai-chat.js

const fetch = globalThis.fetch;

async function testAIChat() {
  try {
    console.log('🧪 Probando API de Chat con IA...\n');

    // 1. Probar endpoint GET
    console.log('1. Probando endpoint GET...');
    const getResponse = await fetch('http://localhost:3000/api/ai/chat');
    const getData = await getResponse.json();
    console.log('✅ GET Response:', getData);
    console.log('');

    // 2. Probar endpoint POST sin autenticación (debería fallar)
    console.log('2. Probando POST sin autenticación...');
    const postResponseNoAuth = await fetch('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Hola'
      })
    });
    const postDataNoAuth = await postResponseNoAuth.json();
    console.log('✅ POST sin auth (esperado error):', postDataNoAuth);
    console.log('');

    // 3. Probar con mensaje de ejemplo
    console.log('3. Probando POST con mensaje de ejemplo...');
    const postResponse = await fetch('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Nota: En producción necesitarías un token JWT real
        'Authorization': 'Bearer fake-token-for-testing'
      },
      body: JSON.stringify({
        message: '¿Cuáles son mis proyectos actuales?',
        conversationHistory: []
      })
    });

    if (postResponse.status === 401) {
      console.log('✅ POST con auth (esperado error 401 - token inválido):', await postResponse.json());
    } else {
      const postData = await postResponse.json();
      console.log('✅ POST Response:', postData);
    }

    console.log('\n🎉 Pruebas completadas!');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);

    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 El servidor de desarrollo no está corriendo.');
      console.log('Ejecuta: npm run dev');
    }
  }
}

// Ejecutar pruebas
testAIChat();
