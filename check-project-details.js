import dotenv from 'dotenv';
import { prisma } from './src/lib/prisma.ts';

dotenv.config({ path: '.env.local' });

async function checkProjectDetails() {
  try {
    console.log('🔍 Verificando proyecto específico: 8c70c01d-d298-4064-8f9b-cd32661c740d\n');

    const project = await prisma.project.findUnique({
      where: { id: '8c70c01d-d298-4064-8f9b-cd32661c740d' },
      include: {
        cliente: {
          select: { firstName: true, lastName: true, email: true, telefono: true }
        },
        owner: {
          select: { firstName: true, lastName: true, email: true, telefono: true }
        },
        documents: {
          orderBy: { created_at: 'desc' }
        },
        activities: {
          orderBy: { created_at: 'desc' },
          take: 10
        }
      }
    });

    if (project) {
      console.log('✅ Proyecto encontrado:');
      console.log('   ID:', project.id);
      console.log('   Nombre:', project.nombre_proyecto);
      console.log('   Descripción:', project.descripcion || 'Sin descripción');
      console.log('   Estado:', project.estado);
      console.log('   Prioridad:', project.prioridad);
      console.log('   Presupuesto:', project.presupuesto ? `$${project.presupuesto}` : 'No definido');
      console.log('   Fecha entrega:', project.fecha_entrega ? new Date(project.fecha_entrega).toLocaleDateString('es-ES') : 'No definida');
      console.log('');

      console.log('👤 Cliente:');
      console.log('   Nombre:', `${project.cliente.firstName} ${project.cliente.lastName}`);
      console.log('   Email:', project.cliente.email);
      console.log('   Teléfono:', project.cliente.telefono || 'No definido');
      console.log('');

      console.log('👨‍💼 Owner:');
      console.log('   Nombre:', `${project.owner.firstName} ${project.owner.lastName}`);
      console.log('   Email:', project.owner.email);
      console.log('   Teléfono:', project.owner.telefono || 'No definido');
      console.log('');

      console.log('📄 Documentos:', project.documents.length);
      if (project.documents.length > 0) {
        project.documents.forEach((doc, index) => {
          console.log(`   ${index + 1}. ${doc.nombre} (${doc.tipo})`);
        });
      }
      console.log('');

      console.log('📋 Actividades:', project.activities.length);
      if (project.activities.length > 0) {
        project.activities.slice(0, 5).forEach((activity, index) => {
          console.log(`   ${index + 1}. ${activity.titulo} (${activity.tipo}) - ${new Date(activity.created_at).toLocaleDateString('es-ES')}`);
        });
      }

    } else {
      console.log('❌ Proyecto no encontrado con ID: 8c70c01d-d298-4064-8f9b-cd32661c740d');

      // Listar todos los proyectos disponibles
      console.log('\n📋 Proyectos disponibles:');
      const allProjects = await prisma.project.findMany({
        select: {
          id: true,
          nombre_proyecto: true,
          estado: true
        },
        take: 10
      });

      allProjects.forEach((p, index) => {
        console.log(`${index + 1}. ${p.id} - ${p.nombre_proyecto} (${p.estado})`);
      });
    }

  } catch (error) {
    console.error('❌ Error al consultar proyecto:', error.message);
    console.error('Stack:', error.stack);
  }
}

checkProjectDetails();
