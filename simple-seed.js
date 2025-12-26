import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

async function simpleSeed() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  console.log('🌱 Starting simple database seed...\n');

  try {
    // Step 1: Clear existing data
    console.log('1. Clearing existing data...');
    await supabase.from('project_activities').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('project_documents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('clientes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('✅ Data cleared');

    // Step 2: Use a fixed user ID for testing (bypass auth issues)
    console.log('\n2. Setting up test user...');
    // For testing purposes, use a fixed UUID that matches the pattern
    const userId = '550e8400-e29b-41d4-a716-446655440000';
    console.log('✅ Using test user ID:', userId);

    // Step 3: Create test clients
    console.log('\n3. Creating test clients...');
    const testClients = [
      {
        nombre: 'María González',
        email: 'maria@example.com',
        telefono: '+525512345678',
        estado: 'Activo',
        notas: 'Cliente de prueba 1 con teléfono',
        user_id: userId
      },
      {
        nombre: 'Carlos Rodríguez',
        email: 'carlos@example.com',
        telefono: '+525512345679',
        estado: 'Activo',
        notas: 'Cliente de prueba 2 con teléfono',
        user_id: userId
      },
      {
        nombre: 'Ana López',
        email: 'ana@example.com',
        telefono: '+525512345680',
        estado: 'Pendiente',
        notas: 'Cliente de prueba 3 con teléfono',
        user_id: userId
      },
      {
        nombre: 'Pedro Sánchez',
        email: 'na@klowezone.com',
        telefono: '0000000000',
        estado: 'Activo',
        notas: 'Cliente sin teléfono válido',
        user_id: userId
      }
    ];

    const createdClients = [];
    for (const client of testClients) {
      const { data, error } = await supabase
        .from('clientes')
        .insert([client])
        .select()
        .single();

      if (error) {
        console.log('❌ Error creating client:', client.nombre, error);
      } else {
        createdClients.push(data);
        console.log('✅ Created client:', client.nombre, 'ID:', data.id);
      }
    }

    // Step 4: Create test projects
    console.log('\n4. Creating test projects...');
    const testProjects = [
      {
        nombre_proyecto: 'Rediseño Web Corporativo',
        descripcion: 'Rediseño completo del sitio web corporativo con enfoque en UX/UI moderno',
        estado: 'EN_PROGRESO',
        prioridad: 'ALTA',
        presupuesto: 85000,
        fecha_entrega: '2025-03-15',
        user_id: userId,
        cliente_id: createdClients[0].id
      },
      {
        nombre_proyecto: 'Aplicación Móvil E-commerce',
        descripcion: 'Desarrollo de app móvil nativa para plataforma de comercio electrónico',
        estado: 'PLANIFICACION',
        prioridad: 'URGENTE',
        presupuesto: 120000,
        fecha_entrega: '2025-05-01',
        user_id: userId,
        cliente_id: createdClients[1].id
      },
      {
        nombre_proyecto: 'Sistema de Gestión Empresarial',
        descripcion: 'Implementación de ERP personalizado para gestión integral de la empresa',
        estado: 'COMPLETADO',
        prioridad: 'MEDIA',
        presupuesto: 200000,
        fecha_entrega: '2024-12-01',
        user_id: userId,
        cliente_id: createdClients[2].id
      }
    ];

    const createdProjects = [];
    for (const project of testProjects) {
      const { data, error } = await supabase
        .from('projects')
        .insert([project])
        .select()
        .single();

      if (error) {
        console.log('❌ Error creating project:', project.nombre_proyecto, error);
      } else {
        createdProjects.push(data);
        console.log('✅ Created project:', project.nombre_proyecto, 'ID:', data.id);
      }
    }

    // Step 5: Create some project activities
    console.log('\n5. Creating project activities...');
    const activities = [
      {
        project_id: createdProjects[0].id,
        tipo: 'TASK_UPDATE',
        titulo: 'Revisión inicial completada',
        descripcion: 'Se realizó la auditoría completa del sitio web actual y se definieron los requisitos del nuevo diseño.'
      },
      {
        project_id: createdProjects[0].id,
        tipo: 'TASK_UPDATE',
        titulo: 'Wireframes aprobados',
        descripcion: 'Los wireframes de la nueva interfaz han sido aprobados por el cliente.'
      }
    ];

    for (const activity of activities) {
      const { data, error } = await supabase
        .from('project_activities')
        .insert([activity])
        .select()
        .single();

      if (error) {
        console.log('❌ Error creating activity:', error);
      } else {
        console.log('✅ Created activity for project:', activity.project_id);
      }
    }

    // Step 6: Final verification and summary
    console.log('\n6. Final verification...');

    const { data: finalClients } = await supabase.from('clientes').select('*');
    const { data: finalProjects } = await supabase.from('projects').select('*');

    console.log(`📊 Database populated successfully!`);
    console.log(`   Clients: ${finalClients?.length || 0}`);
    console.log(`   Projects: ${finalProjects?.length || 0}`);

    console.log(`\n👤 Test User Credentials:`);
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);

    if (finalProjects && finalProjects.length > 0) {
      console.log(`\n🎯 PROJECT IDs for verification:`);
      finalProjects.forEach((project, index) => {
        console.log(`   ${index + 1}. ${project.nombre_proyecto}: ${project.id}`);
      });

      const firstProjectId = finalProjects[0].id;
      console.log(`\n🔗 Test URL: http://localhost:3000/dashboard/projects/${firstProjectId}`);
      console.log(`\n✅ SEED COMPLETED SUCCESSFULLY!`);
      console.log(`\n**ID del primer proyecto para verificación: ${firstProjectId}**`);
    }

  } catch (error) {
    console.error('❌ Unexpected error during seeding:', error);
  }
}

simpleSeed();
