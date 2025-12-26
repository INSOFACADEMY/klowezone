import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function getProjectId() {
  try {
    const { prisma } = await import('./src/lib/prisma.ts');
    const project = await prisma.project.findFirst();
    if (project) {
      console.log('Project ID:', project.id);
    } else {
      console.log('No projects found');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

getProjectId();
