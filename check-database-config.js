// Script para verificar la configuración de la base de datos
require('dotenv').config({ path: '.env.local' });

console.log('🔍 VERIFICACIÓN DE CONFIGURACIÓN DE BASE DE DATOS');
console.log('='.repeat(60));
console.log('');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.log('❌ ERROR: DATABASE_URL no está configurada en .env.local');
  console.log('');
  console.log('💡 SOLUCIÓN: Agrega esta línea a .env.local:');
  console.log('DATABASE_URL=postgresql://tu-usuario:tu-password@tu-host/tu-db?sslmode=require');
  process.exit(1);
}

console.log('✅ DATABASE_URL está configurada');
console.log('');

try {
  const url = new URL(databaseUrl);
  console.log('📋 ANÁLISIS DE LA URL DE CONEXIÓN:');
  console.log(`   🔗 Protocolo: ${url.protocol}`);
  console.log(`   🏠 Host: ${url.hostname}`);
  console.log(`   🔌 Puerto: ${url.port || '5432 (por defecto)'}`);
  console.log(`   👤 Usuario: ${url.username}`);
  console.log(`   🗄️  Base de datos: ${url.pathname.slice(1)}`);
  console.log(`   🔒 SSL: ${url.searchParams.get('sslmode') || 'no especificado'}`);
  console.log(`   🔑 Password: ${url.password ? '✅ Configurada' : '❌ NO configurada'}`);
  console.log('');

  // Verificar formato
  const issues = [];

  if (url.protocol !== 'postgresql:') {
    issues.push('Protocolo debe ser "postgresql:"');
  }

  if (!url.username) {
    issues.push('Usuario no especificado');
  }

  if (!url.password) {
    issues.push('Password no especificada');
  }

  if (!url.pathname.slice(1)) {
    issues.push('Base de datos no especificada');
  }

  if (url.searchParams.get('sslmode') !== 'require') {
    issues.push('SSL mode debe ser "require" para Neon');
  }

  if (issues.length > 0) {
    console.log('⚠️  PROBLEMAS ENCONTRADOS:');
    issues.forEach(issue => console.log(`   ❌ ${issue}`));
    console.log('');
  } else {
    console.log('✅ FORMATO DE URL CORRECTO');
    console.log('');
  }

  console.log('🧪 PRUEBA DE CONECTIVIDAD:');

  // Probar conexión básica con timeout corto
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 5000, // 5 segundos
  });

  console.log('   ⏳ Intentando conectar...');

  const timeout = setTimeout(() => {
    console.log('❌ Timeout: La conexión tardó más de 5 segundos');
    console.log('');
    console.log('💡 POSIBLES CAUSAS:');
    console.log('   • La base de datos de Neon está suspendida');
    console.log('   • Credenciales incorrectas');
    console.log('   • Problemas de red/firewall');
    console.log('   • IP no permitida en Neon');
    console.log('');
    console.log('🔧 SOLUCIONES:');
    console.log('   1. Ve a https://console.neon.tech');
    console.log('   2. Verifica que el proyecto esté activo');
    console.log('   3. Revisa las credenciales en "Connection Details"');
    console.log('   4. Genera una nueva password si es necesario');
    pool.end();
  }, 5000);

  pool.connect()
    .then(async (client) => {
      clearTimeout(timeout);
      console.log('✅ Conexión exitosa');

      try {
        const result = await client.query('SELECT version() as version, current_database() as db');
        console.log(`   🗄️  Base de datos: ${result.rows[0].db}`);
        console.log(`   📋 Versión: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`);
      } catch (queryError) {
        console.log('⚠️  Conexión OK pero error en consulta:', queryError.message);
      }

      client.release();
      pool.end();
    })
    .catch((error) => {
      clearTimeout(timeout);
      console.log('❌ Error de conexión:', error.message);
      console.log('');
      console.log('💡 POSIBLES CAUSAS Y SOLUCIONES:');
      console.log('');

      if (error.message.includes('password authentication failed')) {
        console.log('🔐 ERROR DE AUTENTICACIÓN:');
        console.log('   • Password incorrecta');
        console.log('   • Usuario incorrecto');
        console.log('   • Credenciales expiradas');
        console.log('');
        console.log('   ✅ SOLUCIÓN:');
        console.log('   1. Ve a Neon Console > Project Settings > Password');
        console.log('   2. Generate new password');
        console.log('   3. Actualiza DATABASE_URL en .env.local');
      } else if (error.message.includes('timeout')) {
        console.log('⏰ ERROR DE TIMEOUT:');
        console.log('   • Servidor no responde');
        console.log('   • Base de datos suspendida');
        console.log('   • Problemas de red');
        console.log('');
        console.log('   ✅ SOLUCIÓN:');
        console.log('   1. Verifica que el proyecto Neon esté activo');
        console.log('   2. Revisa el status en console.neon.tech');
      } else {
        console.log('❓ ERROR DESCONOCIDO:');
        console.log(`   ${error.message}`);
        console.log('');
        console.log('   ✅ SOLUCIÓN:');
        console.log('   Contacta soporte de Neon o verifica logs detallados');
      }

      pool.end();
    });

} catch (error) {
  console.log('❌ ERROR AL PARSEAR DATABASE_URL:', error.message);
  console.log('');
  console.log('💡 FORMATO ESPERADO:');
  console.log('postgresql://username:password@host/database?sslmode=require');
}

console.log('');
console.log('='.repeat(60));
