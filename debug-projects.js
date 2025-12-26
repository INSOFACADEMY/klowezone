import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function debugProjects() {
  const { prisma } = await import('./src/lib/prisma.ts');

  try {
    console.log('🔍 Debugging projects in database...\n');

    // Get all projects
    const projects = await prisma.project.findMany({
      include: {
        cliente: true,
        owner: true
      }
    });

    console.log(`📊 Found ${projects.length} projects:\n`);

    projects.forEach((project, index) => {
      console.log(`${index + 1}. Project:`, {
        id: project.id,
        nombre: project.nombre_proyecto,
        user_id: project.user_id,
        cliente_id: project.cliente_id,
        cliente: project.cliente ? `${project.cliente.firstName} ${project.cliente.lastName}` : 'N/A',
        owner: project.owner ? `${project.owner.firstName} ${project.owner.lastName}` : 'N/A'
      });
    });

    if (projects.length > 0) {
      // Test specific project lookup
      const testProjectId = projects[0].id;
      console.log(`\n🧪 Testing findUnique with ID: ${testProjectId}`);

      const foundProject = await prisma.project.findUnique({
        where: { id: testProjectId },
        include: {
          cliente: {
            select: { firstName: true, lastName: true, email: true }
          },
          owner: {
            select: { firstName: true, lastName: true, email: true }
          }
        }
      });

      if (foundProject) {
        console.log('✅ Project found:', {
          id: foundProject.id,
          nombre: foundProject.nombre_proyecto,
          user_id: foundProject.user_id
        });
      } else {
        console.log('❌ Project not found with findUnique');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugProjects();
