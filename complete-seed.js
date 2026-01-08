import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

async function completeSeed() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  console.log('🧹 Starting complete database seed...\n');

  try {
    // Step 1: Clear existing data (in correct order due to foreign keys)
    console.log('1. Clearing existing data...');

    // Delete in reverse dependency order
    await supabase.from('project_activities').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('project_documents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('clientes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('roles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('permissions').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    console.log('✅ Database cleared');

    // Step 2: Create permissions
    console.log('\n2. Creating permissions...');
    const permissions = [
      // User management
      { name: 'users.read', resource: 'users', action: 'read', description: 'View users' },
      { name: 'users.create', resource: 'users', action: 'create', description: 'Create users' },
      { name: 'users.update', resource: 'users', action: 'update', description: 'Update users' },
      { name: 'users.delete', resource: 'users', action: 'delete', description: 'Delete users' },

      // CMS permissions
      { name: 'posts.read', resource: 'posts', action: 'read', description: 'View blog posts' },
      { name: 'posts.create', resource: 'posts', action: 'create', description: 'Create blog posts' },
      { name: 'posts.update', resource: 'posts', action: 'update', description: 'Update blog posts' },
      { name: 'posts.delete', resource: 'posts', action: 'delete', description: 'Delete blog posts' },
      { name: 'posts.publish', resource: 'posts', action: 'publish', description: 'Publish blog posts' },
    ];

    const createdPermissions = [];
    for (const permission of permissions) {
      const { data, error } = await supabase
        .from('permissions')
        .insert([permission])
        .select()
        .single();

      if (error) {
        console.log('❌ Error creating permission:', permission.name, error);
      } else {
        createdPermissions.push(data);
        console.log('✅ Created permission:', permission.name);
      }
    }

    // Step 3: Create roles
    console.log('\n3. Creating roles...');
    const roles = [
      {
        name: 'superadmin',
        description: 'Full system access',
        isSystem: true
      },
      {
        name: 'admin',
        description: 'Administrative access',
        isSystem: true
      }
    ];

    const createdRoles = [];
    for (const role of roles) {
      const { data, error } = await supabase
        .from('roles')
        .insert([role])
        .select()
        .single();

      if (error) {
        console.log('❌ Error creating role:', role.name, error);
      } else {
        createdRoles.push(data);
        console.log('✅ Created role:', role.name);
      }
    }

    // Step 4: Create role_permissions relationships
    console.log('\n4. Assigning permissions to roles...');
    const superAdminRole = createdRoles.find(r => r.name === 'superadmin');
    const adminRole = createdRoles.find(r => r.name === 'admin');

    if (superAdminRole) {
      for (const permission of createdPermissions) {
        const { error } = await supabase
          .from('role_permissions')
          .insert([{
            roleId: superAdminRole.id,
            permissionId: permission.id
          }]);

        if (error) {
          console.log('❌ Error assigning permission to superadmin:', error);
        }
      }
      console.log('✅ Assigned all permissions to superadmin');
    }

    if (adminRole) {
      const adminPermissions = createdPermissions.filter(p =>
        !p.name.includes('users.delete') // Admin can't delete users
      );

      for (const permission of adminPermissions) {
        const { error } = await supabase
          .from('role_permissions')
          .insert([{
            roleId: adminRole.id,
            permissionId: permission.id
          }]);

        if (error) {
          console.log('❌ Error assigning permission to admin:', error);
        }
      }
      console.log('✅ Assigned permissions to admin');
    }

    // Step 5: Create admin user
    console.log('\n5. Creating admin user...');
    const hashedPassword = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6fM4tHc/i'; // 'SuperAdmin123!'

    const { data: adminUser, error: userError } = await supabase.auth.signUp({
      email: 'admin@klowezone.com',
      password: 'SuperAdmin123!'
    });

    if (userError) {
      console.log('❌ Error creating auth user:', userError);
    } else {
      console.log('✅ Auth user created');

      // Insert user record with role
      const { data: userRecord, error: userRecordError } = await supabase
        .from('users')
        .insert([{
          id: adminUser.user?.id,
          email: 'admin@klowezone.com',
          password: hashedPassword,
          firstName: 'Super',
          lastName: 'Admin',
          roleId: superAdminRole.id,
          isVerified: true,
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'
        }])
        .select()
        .single();

      if (userRecordError) {
        console.log('❌ Error creating user record:', userRecordError);
      } else {
        console.log('✅ User record created:', userRecord.id);
      }
    }

    // Step 6: Create test clients
    console.log('\n6. Creating test clients...');
    const testClients = [
      {
        nombre: 'María González',
        email: 'maria@example.com',
        telefono: '+525512345678',
        estado: 'Activo',
        notas: 'Cliente de prueba 1'
      },
      {
        nombre: 'Carlos Rodríguez',
        email: 'carlos@example.com',
        telefono: '+525512345679',
        estado: 'Activo',
        notas: 'Cliente de prueba 2'
      },
      {
        nombre: 'Ana López',
        email: 'ana@example.com',
        telefono: '+525512345680',
        estado: 'Pendiente',
        notas: 'Cliente de prueba 3'
      },
      {
        nombre: 'Pedro Sánchez',
        email: 'na@klowezone.com', // Cliente sin email
        telefono: '0000000000', // Sin teléfono
        estado: 'Activo',
        notas: 'Cliente sin contacto'
      }
    ];

    const createdClients = [];
    for (const client of testClients) {
      const { data, error } = await supabase
        .from('clientes')
        .insert([{
          ...client,
          user_id: adminUser.user?.id
        }])
        .select()
        .single();

      if (error) {
        console.log('❌ Error creating client:', client.nombre, error);
      } else {
        createdClients.push(data);
        console.log('✅ Created client:', client.nombre, 'ID:', data.id);
      }
    }

    // Step 7: Create test projects
    console.log('\n7. Creating test projects...');
    const testProjects = [
      {
        nombre_proyecto: 'Rediseño Web Corporativo',
        descripcion: 'Rediseño completo del sitio web corporativo con enfoque en UX/UI moderno',
        estado: 'EN_PROGRESO',
        prioridad: 'ALTA',
        presupuesto: 85000,
        fecha_entrega: '2025-03-15',
        user_id: adminUser.user?.id,
        cliente_id: createdClients[0].id
      },
      {
        nombre_proyecto: 'Aplicación Móvil E-commerce',
        descripcion: 'Desarrollo de app móvil nativa para plataforma de comercio electrónico',
        estado: 'PLANIFICACION',
        prioridad: 'URGENTE',
        presupuesto: 120000,
        fecha_entrega: '2025-05-01',
        user_id: adminUser.user?.id,
        cliente_id: createdClients[1].id
      },
      {
        nombre_proyecto: 'Sistema de Gestión Empresarial',
        descripcion: 'Implementación de ERP personalizado para gestión integral de la empresa',
        estado: 'COMPLETADO',
        prioridad: 'MEDIA',
        presupuesto: 200000,
        fecha_entrega: '2024-12-01',
        user_id: adminUser.user?.id,
        cliente_id: createdClients[2].id
      },
      {
        nombre_proyecto: 'Consultoría Digital',
        descripcion: 'Asesoría estratégica en transformación digital y marketing online',
        estado: 'EN_PROGRESO',
        prioridad: 'MEDIA',
        presupuesto: 45000,
        fecha_entrega: '2025-02-28',
        user_id: adminUser.user?.id,
        cliente_id: createdClients[0].id
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

    // Step 8: Create project activities/milestones
    console.log('\n8. Creating project activities...');
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
      },
      {
        project_id: createdProjects[2].id,
        tipo: 'TASK_UPDATE',
        titulo: 'Implementación finalizada',
        descripcion: 'El sistema ERP ha sido implementado exitosamente y está en producción.'
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
        console.log('✅ Created activity:', activity.titulo);
      }
    }

    // Step 9: Final verification
    console.log('\n9. Final verification...');

    const { data: finalClients, error: clientsError } = await supabase
      .from('clientes')
      .select('*');

    const { data: finalProjects, error: projectsError } = await supabase
      .from('projects')
      .select('*');

    console.log(`📊 Final counts:`);
    console.log(`   Clients: ${finalClients?.length || 0}`);
    console.log(`   Projects: ${finalProjects?.length || 0}`);

    if (finalProjects && finalProjects.length > 0) {
      console.log(`\n🎯 PROJECT IDs for verification:`);
      finalProjects.forEach((project, index) => {
        console.log(`   ${index + 1}. ${project.nombre_proyecto}: ${project.id}`);
      });

      // Return the first project ID for verification
      const firstProjectId = finalProjects[0].id;
      console.log(`\n🔗 Test URL: http://localhost:3000/dashboard/projects/${firstProjectId}`);
      console.log(`\n✅ SEED COMPLETED SUCCESSFULLY!`);
      console.log(`\nFirst project ID for verification: ${firstProjectId}`);
    }

  } catch (error) {
    console.error('❌ Unexpected error during seeding:', error);
  }
}

completeSeed();










