import dotenv from 'dotenv';
import { prisma } from './src/lib/prisma.ts';

dotenv.config({ path: '.env.local' });

async function checkProjects() {
  try {
    console.log('🔍 Verificando proyectos en la base de datos...\n');

    const projects = await prisma.project.findMany({
      select: {
        id: true,
        nombre_proyecto: true,
        user_id: true,
        cliente_id: true,
        estado: true,
        prioridad: true
      },
      take: 10
    });

    console.log(`📊 Encontrados ${projects.length} proyectos:`);
    console.log('');

    projects.forEach((project, index) => {
      console.log(`${index + 1}. ID: ${project.id}`);
      console.log(`   Nombre: ${project.nombre_proyecto}`);
      console.log(`   Cliente ID: ${project.cliente_id}`);
      console.log(`   User ID: ${project.user_id}`);
      console.log(`   Estado: ${project.estado}`);
      console.log(`   Prioridad: ${project.prioridad}`);
      console.log('');
    });

    // También verificar si hay usuarios en la tabla User
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      },
      take: 5
    });

    console.log(`👥 Usuarios encontrados: ${users.length}`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.email}) - ID: ${user.id}`);
    });

  } catch (error) {
    console.error('❌ Error al verificar proyectos:', error);
  }
}

checkProjects();
