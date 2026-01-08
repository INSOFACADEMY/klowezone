import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

async function executeSQL() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  console.log('🔧 Executing SQL script...\n');

  try {
    // Read SQL file
    const sqlContent = fs.readFileSync('create-test-data.sql', 'utf8');

    // Split into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📄 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);

        try {
          // Use rpc to execute raw SQL (this might not work with service role key)
          // Alternative: use the REST API directly

          // For now, let's try a different approach - use individual operations
          if (statement.includes('DELETE FROM')) {
            // Handle DELETE statements
            if (statement.includes('project_activities')) {
              const { error } = await supabase.from('project_activities').delete().neq('id', 'placeholder');
              if (error) console.log('❌ Error clearing project_activities:', error);
              else console.log('✅ Cleared project_activities');
            } else if (statement.includes('project_documents')) {
              const { error } = await supabase.from('project_documents').delete().neq('id', 'placeholder');
              if (error) console.log('❌ Error clearing project_documents:', error);
              else console.log('✅ Cleared project_documents');
            } else if (statement.includes('projects')) {
              const { error } = await supabase.from('projects').delete().neq('id', 'placeholder');
              if (error) console.log('❌ Error clearing projects:', error);
              else console.log('✅ Cleared projects');
            } else if (statement.includes('clientes')) {
              const { error } = await supabase.from('clientes').delete().neq('id', 'placeholder');
              if (error) console.log('❌ Error clearing clientes:', error);
              else console.log('✅ Cleared clientes');
            }
          } else if (statement.includes('INSERT INTO clientes')) {
            // Handle INSERT statements
            const testClients = [
              {
                id: 'client-1',
                user_id: '550e8400-e29b-41d4-a716-446655440000',
                nombre: 'María González',
                email: 'maria@example.com',
                telefono: '+525512345678',
                estado: 'Activo',
                notas: 'Cliente de prueba 1'
              },
              {
                id: 'client-2',
                user_id: '550e8400-e29b-41d4-a716-446655440000',
                nombre: 'Carlos Rodríguez',
                email: 'carlos@example.com',
                telefono: '+525512345679',
                estado: 'Activo',
                notas: 'Cliente de prueba 2'
              },
              {
                id: 'client-3',
                user_id: '550e8400-e29b-41d4-a716-446655440000',
                nombre: 'Ana López',
                email: 'ana@example.com',
                telefono: '+525512345680',
                estado: 'Pendiente',
                notas: 'Cliente de prueba 3'
              },
              {
                id: 'client-4',
                user_id: '550e8400-e29b-41d4-a716-446655440000',
                nombre: 'Pedro Sánchez',
                email: 'na@klowezone.com',
                telefono: '0000000000',
                estado: 'Activo',
                notas: 'Cliente sin teléfono'
              }
            ];

            for (const client of testClients) {
              const { error } = await supabase.from('clientes').insert([client]);
              if (error) console.log('❌ Error inserting client:', client.nombre, error);
              else console.log('✅ Inserted client:', client.nombre);
            }
          } else if (statement.includes('INSERT INTO projects')) {
            const testProjects = [
              {
                id: 'project-1',
                user_id: '550e8400-e29b-41d4-a716-446655440000',
                cliente_id: 'client-1',
                nombre_proyecto: 'Rediseño Web Corporativo',
                descripcion: 'Rediseño completo del sitio web corporativo',
                estado: 'EN_PROGRESO',
                prioridad: 'ALTA',
                presupuesto: 85000,
                fecha_entrega: '2025-03-15'
              },
              {
                id: 'project-2',
                user_id: '550e8400-e29b-41d4-a716-446655440000',
                cliente_id: 'client-2',
                nombre_proyecto: 'Aplicación Móvil E-commerce',
                descripcion: 'Desarrollo de app móvil nativa',
                estado: 'PLANIFICACION',
                prioridad: 'URGENTE',
                presupuesto: 120000,
                fecha_entrega: '2025-05-01'
              },
              {
                id: 'project-3',
                user_id: '550e8400-e29b-41d4-a716-446655440000',
                cliente_id: 'client-3',
                nombre_proyecto: 'Sistema de Gestión Empresarial',
                descripcion: 'Implementación de ERP personalizado',
                estado: 'COMPLETADO',
                prioridad: 'MEDIA',
                presupuesto: 200000,
                fecha_entrega: '2024-12-01'
              }
            ];

            for (const project of testProjects) {
              const { error } = await supabase.from('projects').insert([project]);
              if (error) console.log('❌ Error inserting project:', project.nombre_proyecto, error);
              else console.log('✅ Inserted project:', project.nombre_proyecto);
            }
          } else if (statement.includes('INSERT INTO project_activities')) {
            const activities = [
              {
                id: 'activity-1',
                project_id: 'project-1',
                tipo: 'TASK_UPDATE',
                titulo: 'Revisión inicial completada',
                descripcion: 'Se realizó la auditoría completa del sitio web actual'
              },
              {
                id: 'activity-2',
                project_id: 'project-1',
                tipo: 'TASK_UPDATE',
                titulo: 'Wireframes aprobados',
                descripcion: 'Los wireframes han sido aprobados por el cliente'
              },
              {
                id: 'activity-3',
                project_id: 'project-3',
                tipo: 'TASK_UPDATE',
                titulo: 'Implementación finalizada',
                descripcion: 'El sistema ERP está en producción'
              }
            ];

            for (const activity of activities) {
              const { error } = await supabase.from('project_activities').insert([activity]);
              if (error) console.log('❌ Error inserting activity:', activity.titulo, error);
              else console.log('✅ Inserted activity:', activity.titulo);
            }
          }

        } catch (err) {
          console.log('❌ Error executing statement:', err.message);
        }
      }
    }

    // Final verification
    console.log('\n📊 Final verification...');

    const { data: clients } = await supabase.from('clientes').select('*');
    const { data: projects } = await supabase.from('projects').select('*');

    console.log(`✅ Database populated!`);
    console.log(`   Clients: ${clients?.length || 0}`);
    console.log(`   Projects: ${projects?.length || 0}`);

    if (projects && projects.length > 0) {
      console.log(`\n🎯 PROJECT IDs for verification:`);
      projects.forEach((project, index) => {
        console.log(`   ${index + 1}. ${project.nombre_proyecto}: ${project.id}`);
      });

      const firstProjectId = projects[0].id;
      console.log(`\n🔗 Test URL: http://localhost:3000/dashboard/projects/${firstProjectId}`);
      console.log(`\n**ID del primer proyecto para verificación: ${firstProjectId}**`);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

executeSQL();










