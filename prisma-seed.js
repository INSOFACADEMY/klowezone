import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function prismaSeed() {
  const { prisma } = await import('./src/lib/prisma.ts');

  console.log('🌱 Starting Prisma database seed...\n');

  try {
    // Step 1: Clear existing data
    console.log('1. Clearing existing data...');
    try {
      await prisma.projectActivity.deleteMany({});
      console.log('✅ Cleared project activities');
    } catch (e) {
      console.log('⚠️ Could not clear project activities');
    }

    try {
      await prisma.projectDocument.deleteMany({});
      console.log('✅ Cleared project documents');
    } catch (e) {
      console.log('⚠️ Could not clear project documents');
    }

    try {
      await prisma.project.deleteMany({});
      console.log('✅ Cleared projects');
    } catch (e) {
      console.log('⚠️ Could not clear projects');
    }

    console.log('✅ Data clearing completed');

    // Step 2: Check for existing user
    console.log('\n2. Checking for existing user...');
    const existingUsers = await prisma.user.findMany({ take: 1 });

    if (existingUsers.length === 0) {
      console.log('❌ No users found. Please create a user first.');
      return;
    }

    const userId = existingUsers[0].id;
    console.log('✅ Using existing user ID:', userId);

    // NOTE: Clients table doesn't exist in Prisma schema, only in Supabase
    // We'll work with the existing tables: Project, ProjectDocument, ProjectActivity
    console.log('\n3. Skipping clients - table not in Prisma schema...');

    // Step 4: Create test projects
    console.log('\n4. Creating test projects...');
    // Use the same userId for cliente_id since we're not using the clients table in Prisma
    const clienteId = userId;

    const testProjects = [
      {
        nombre_proyecto: 'Rediseño Web Corporativo',
        descripcion: 'Rediseño completo del sitio web corporativo con enfoque en UX/UI moderno',
        estado: 'EN_PROGRESO',
        prioridad: 'ALTA',
        presupuesto: 85000,
        fecha_entrega: new Date('2025-03-15'),
        user_id: userId,
        cliente_id: clienteId
      },
      {
        nombre_proyecto: 'Aplicación Móvil E-commerce',
        descripcion: 'Desarrollo de app móvil nativa para plataforma de comercio electrónico',
        estado: 'PLANIFICACION',
        prioridad: 'URGENTE',
        presupuesto: 120000,
        fecha_entrega: new Date('2025-05-01'),
        user_id: userId,
        cliente_id: clienteId
      },
      {
        nombre_proyecto: 'Sistema de Gestión Empresarial',
        descripcion: 'Implementación de ERP personalizado para gestión integral de la empresa',
        estado: 'COMPLETADO',
        prioridad: 'MEDIA',
        presupuesto: 200000,
        fecha_entrega: new Date('2024-12-01'),
        user_id: userId,
        cliente_id: clienteId
      }
    ];

    const createdProjects = [];
    for (const project of testProjects) {
      const createdProject = await prisma.project.create({
        data: project
      });
      createdProjects.push(createdProject);
      console.log('✅ Created project:', project.nombre_proyecto, 'ID:', createdProject.id);
    }

    // Step 5: Create project activities
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
      },
      {
        project_id: createdProjects[2].id,
        tipo: 'TASK_UPDATE',
        titulo: 'Implementación finalizada',
        descripcion: 'El sistema ERP ha sido implementado exitosamente y está en producción.'
      }
    ];

    for (const activity of activities) {
      const createdActivity = await prisma.projectActivity.create({
        data: activity
      });
      console.log('✅ Created activity:', createdActivity.titulo);
    }

    // Step 6: Final verification
    console.log('\n6. Final verification...');

    const clientCount = await prisma.client.count();
    const projectCount = await prisma.project.count();
    const activityCount = await prisma.projectActivity.count();

    console.log(`📊 Database populated successfully!`);
    console.log(`   Clients: ${clientCount}`);
    console.log(`   Projects: ${projectCount}`);
    console.log(`   Activities: ${activityCount}`);

    if (createdProjects.length > 0) {
      console.log(`\n🎯 PROJECT IDs for verification:`);
      createdProjects.forEach((project, index) => {
        console.log(`   ${index + 1}. ${project.nombre_proyecto}: ${project.id}`);
      });

      const firstProjectId = createdProjects[0].id;
      console.log(`\n🔗 Test URL: http://localhost:3000/dashboard/projects/${firstProjectId}`);
      console.log(`\n✅ PRISMA SEED COMPLETED SUCCESSFULLY!`);
      console.log(`\n**ID del primer proyecto para verificación: ${firstProjectId}**`);
    }

  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    await prisma.$disconnect();
  }
}

prismaSeed();
