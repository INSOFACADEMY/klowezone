// Script con instrucciones para arreglar el login del admin
console.log('🔧 INSTRUCCIONES PARA ARREGLAR EL LOGIN DEL ADMIN');
console.log('================================================\n');

console.log('❌ PROBLEMA: El email del usuario admin@klowezone.com no está confirmado en Supabase');
console.log('🔒 Password: SuperAdmin123!\n');

console.log('✅ SOLUCIÓN 1: Confirmar email desde Supabase Studio (Recomendado)');
console.log('-------------------------------------------------------------------');
console.log('1. Ve a https://supabase.com/dashboard/project/YOUR_PROJECT/auth/users');
console.log('2. Busca el usuario: admin@klowezone.com');
console.log('3. Haz clic en "Confirm email" o marca como confirmado');
console.log('4. Guarda los cambios\n');

console.log('✅ SOLUCIÓN 2: Usar Service Role Key (Avanzado)');
console.log('-----------------------------------------------');
console.log('1. Ve a https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api');
console.log('2. Copia la "service_role" key');
console.log('3. Agrega a .env.local:');
console.log('   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui');
console.log('4. Ejecuta: node confirm-admin-email.js\n');

console.log('✅ SOLUCIÓN 3: Crear usuario desde cero');
console.log('---------------------------------------');
console.log('Si las anteriores no funcionan, podemos crear un nuevo usuario admin.');
console.log('Ejecuta: node create-admin-user.js\n');

console.log('📋 VERIFICACIÓN:');
console.log('---------------');
console.log('Después de confirmar el email, ejecuta:');
console.log('node test-login.js');
console.log('Debería mostrar: ✅ Login exitoso!\n');

console.log('🎯 PRUEBA FINAL:');
console.log('---------------');
console.log('1. Ve a http://localhost:3000/login');
console.log('2. Email: admin@klowezone.com');
console.log('3. Password: SuperAdmin123!');
console.log('4. Deberías poder acceder al panel de admin en /admin\n');







