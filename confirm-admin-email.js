// Script para confirmar el email del admin
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Necesitamos la service role key para confirmar emails
);

async function confirmAdminEmail() {
  console.log('📧 Confirmando email del administrador...');

  try {
    // Primero necesitamos obtener el usuario
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('❌ Error obteniendo usuarios:', listError.message);
      console.log('💡 Asegúrate de tener SUPABASE_SERVICE_ROLE_KEY en .env.local');
      return;
    }

    const adminUser = users.users.find(u => u.email === 'admin@klowezone.com');

    if (!adminUser) {
      console.error('❌ Usuario admin no encontrado');
      return;
    }

    console.log('👤 Usuario encontrado:', adminUser.id);

    // Confirmar el email
    const { error: confirmError } = await supabase.auth.admin.updateUserById(adminUser.id, {
      email_confirm: true
    });

    if (confirmError) {
      console.error('❌ Error confirmando email:', confirmError.message);
      return;
    }

    console.log('✅ Email confirmado exitosamente!');

    // Probar login nuevamente
    console.log('\n🔐 Probando login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'admin@klowezone.com',
      password: 'SuperAdmin123!'
    });

    if (loginError) {
      console.error('❌ Error de login:', loginError.message);
    } else {
      console.log('✅ Login exitoso!');
      console.log('🆔 User ID:', loginData.user.id);
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
  }
}

confirmAdminEmail();



