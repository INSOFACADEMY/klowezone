import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Import Supabase client directly
import { createClient } from '@supabase/supabase-js';

async function testClientCreation() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  console.log('🧪 Testing client creation with different scenarios...\n');

  try {
    // First, get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.log('❌ No authenticated user found. Please log in to the application first.');
      return;
    }

    console.log('✅ User authenticated:', user.email);

    // Test cases
    const testCases = [
      {
        name: 'Cliente con email completo',
        data: {
          nombre: 'Juan Pérez',
          email: 'juan@example.com',
          telefono: '+525512345678',
          estado: 'Activo',
          notas: 'Cliente de prueba con email'
        }
      },
      {
        name: 'Cliente sin email',
        data: {
          nombre: 'María García',
          email: 'na@klowezone.com', // Valor por defecto
          telefono: '+525512345679',
          estado: 'Activo',
          notas: 'Cliente sin email real'
        }
      },
      {
        name: 'Cliente sin teléfono',
        data: {
          nombre: 'Carlos López',
          email: 'carlos@example.com',
          telefono: '0000000000', // Valor por defecto
          estado: 'Activo',
          notas: 'Cliente sin teléfono'
        }
      },
      {
        name: 'Cliente mínimo',
        data: {
          nombre: 'Ana Rodríguez',
          email: 'ana@example.com',
          telefono: null,
          estado: 'Activo',
          notas: null
        }
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n📋 Testing: ${testCase.name}`);

      try {
        const { data, error } = await supabase
          .from('clientes')
          .insert([{
            ...testCase.data,
            user_id: user.id
          }])
          .select()
          .single();

        if (error) {
          console.log('❌ Error creating client:', error.message);
        } else {
          console.log('✅ Client created successfully:', {
            id: data.id,
            nombre: data.nombre,
            email: data.email,
            telefono: data.telefono
          });
        }
      } catch (err) {
        console.log('❌ Unexpected error:', err.message);
      }
    }

    // List all clients created
    console.log('\n📊 All clients in database:');
    const { data: clients, error: listError } = await supabase
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (listError) {
      console.log('❌ Error listing clients:', listError);
    } else {
      clients.forEach((client, index) => {
        console.log(`${index + 1}. ${client.nombre} (${client.email}) - Tel: ${client.telefono || 'N/A'}`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testClientCreation();

