import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function seedProjects() {
  const { prisma } = await import('./src/lib/prisma.ts');

  try {
    console.log('🌱 Seeding projects...\n');

    // Get existing users
    const users = await prisma.user.findMany();
    console.log(`👥 Found ${users.length} users`);

    if (users.length === 0) {
      console.log('❌ No users found. Run seed first to create admin user.');
      return;
    }

    // Create test projects (using the same user as both owner and client for simplicity)
    const projects = [
      {
        nombre_proyecto: 'Website Redesign',
        descripcion: 'Complete redesign of the company website with modern UI/UX',
        estado: 'EN_PROGRESO',
        prioridad: 'ALTA',
        presupuesto: 15000,
        fecha_entrega: new Date('2025-02-01'),
        user_id: users[0].id,
        cliente_id: users[0].id
      },
      {
        nombre_proyecto: 'Mobile App Development',
        descripcion: 'Native mobile app for iOS and Android platforms',
        estado: 'PLANIFICACION',
        prioridad: 'URGENTE',
        presupuesto: 25000,
        fecha_entrega: new Date('2025-03-15'),
        user_id: users[0].id,
        cliente_id: users[0].id
      },
      {
        nombre_proyecto: 'E-commerce Platform',
        descripcion: 'Full-featured online store with payment integration',
        estado: 'COMPLETADO',
        prioridad: 'MEDIA',
        presupuesto: 30000,
        fecha_entrega: new Date('2024-12-01'),
        user_id: users[0].id,
        cliente_id: users[0].id
      }
    ];

    console.log('\n📝 Creating projects...');
    for (const projectData of projects) {
      const project = await prisma.project.create({
        data: projectData
      });
      console.log(`✅ Created project: ${project.nombre_proyecto} (ID: ${project.id})`);
    }

    console.log('\n🎉 Seeding completed successfully!');
    console.log('You can now test the project detail page with these IDs');

  } catch (error) {
    console.error('❌ Error seeding projects:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedProjects();
