// Script para verificar específicamente la conexión con Neon
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function checkNeonConnection() {
  console.log('🔍 VERIFICACIÓN DE CONEXIÓN NEON POSTGRESQL');
  console.log('='.repeat(60));
  console.log('');

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.log('❌ ERROR: DATABASE_URL no está configurada en .env.local');
    console.log('');
    console.log('💡 Solución: Agrega la siguiente línea a .env.local:');
    console.log('DATABASE_URL=postgresql://tu-usuario:tu-password@tu-host/tu-db?sslmode=require');
    return;
  }

  console.log('📋 CONFIGURACIÓN ACTUAL:');
  try {
    const url = new URL(databaseUrl);

    console.log(`   🌐 Host: ${url.hostname}`);
    console.log(`   🔌 Puerto: ${url.port || '5432'}`);
    console.log(`   🗄️  Base de datos: ${url.pathname.slice(1)}`);
    console.log(`   👤 Usuario: ${url.username}`);
    console.log(`   🔒 Password: ${url.password ? 'Configurada (oculta)' : '❌ NO CONFIGURADA'}`);
    console.log(`   🔐 SSL: ${url.searchParams.get('sslmode') || 'no especificado'}`);
    console.log('');

    if (!url.password) {
      console.log('❌ ERROR: La password no está configurada en la DATABASE_URL');
      console.log('');
      console.log('💡 Solución: La URL debe incluir la password en el formato:');
      console.log('postgresql://usuario:password@host/database?sslmode=require');
      return;
    }

    console.log('🧪 PROBANDO CONEXIÓN...');

    const pool = new Pool({
      connectionString: databaseUrl,
      connectionTimeoutMillis: 15000, // 15 segundos
      query_timeout: 10000,
      ssl: {
        rejectUnauthorized: false // Para conexiones SSL de Neon
      }
    });

    try {
      const client = await pool.connect();
      console.log('✅ CONEXIÓN EXITOSA');

      // Verificar detalles de la conexión
      const result = await client.query(`
        SELECT
          current_database() as database,
          current_user as user,
          version() as version,
          current_setting('timezone') as timezone
      `);

      console.log('');
      console.log('📊 DETALLES DE LA CONEXIÓN:');
      console.log(`   🗄️  Base de datos: ${result.rows[0].database}`);
      console.log(`   👤 Usuario conectado: ${result.rows[0].user}`);
      console.log(`   📋 Versión PostgreSQL: ${result.rows[0].version.split(' ')[1]} ${result.rows[0].version.split(' ')[2]}`);
      console.log(`   🌍 Zona horaria: ${result.rows[0].timezone}`);

      // Verificar que sea una base de datos de Neon
      const isNeon = url.hostname.includes('neon.tech') || url.hostname.includes('aws.neon.tech');
      console.log(`   🟢 Es Neon: ${isNeon ? 'Sí' : 'No'}`);

      client.release();

      console.log('');
      console.log('🎉 ¡CONEXIÓN NEON FUNCIONANDO CORRECTAMENTE!');
      console.log('');
      console.log('✅ Prisma debería funcionar ahora:');
      console.log('   npm run db:push');
      console.log('   npm run db:generate');
      console.log('   npm run db:seed');

    } catch (error) {
      console.log('❌ ERROR DE CONEXIÓN:');
      console.log(`   Código: ${error.code || 'Desconocido'}`);
      console.log(`   Mensaje: ${error.message}`);

      console.log('');
      console.log('🔧 POSIBLES SOLUCIONES:');

      if (error.code === 'ENOTFOUND') {
        console.log('1. El host no existe o no es accesible');
        console.log('   • Verifica que el host en la URL sea correcto');
        console.log('   • Confirma que Neon esté activo');
      } else if (error.code === 'ECONNREFUSED') {
        console.log('1. El puerto 5432 está bloqueado');
        console.log('   • Verifica que no haya firewall bloqueando el puerto');
        console.log('   • Confirma que Neon permita conexiones desde tu IP');
      } else if (error.message.includes('password authentication failed')) {
        console.log('1. Credenciales incorrectas');
        console.log('   • El usuario o password son incorrectos');
        console.log('   • Las credenciales pueden haber expirado');
      } else if (error.message.includes('does not exist')) {
        console.log('1. La base de datos no existe');
        console.log('   • Verifica el nombre de la base de datos');
        console.log('   • Confirma que la base de datos fue creada en Neon');
      }

      console.log('');
      console.log('📋 PARA OBTENER LAS CREDENCIALES CORRECTAS:');
      console.log('1. Ve a: https://console.neon.tech');
      console.log('2. Selecciona tu proyecto');
      console.log('3. Ve a "Connection Details"');
      console.log('4. Copia la "Connection string" completa');
      console.log('5. Actualiza DATABASE_URL en .env.local');

    } finally {
      await pool.end();
    }

  } catch (error) {
    console.log('❌ ERROR EN LA CONFIGURACIÓN:');
    console.log(`   ${error.message}`);
    console.log('');
    console.log('💡 La DATABASE_URL no tiene un formato válido de URL PostgreSQL');
  }

  console.log('');
  console.log('='.repeat(60));
}

checkNeonConnection().catch(console.error);
