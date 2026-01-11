// Script simple para probar el login
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testLogin() {
  console.log('🔐 Probando login con credenciales admin...');

  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@klowezone.com',
    password: 'SuperAdmin123!'
  });

  if (error) {
    console.log('❌ Error de login:', error.message);
    return;
  }

  console.log('✅ Login exitoso!');
  console.log('🆔 User ID:', data.user.id);
  console.log('📧 Email:', data.user.email);
}

testLogin();







