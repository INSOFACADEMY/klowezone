#!/usr/bin/env node

/**
 * Test findMany query on projects table
 */

require('dotenv').config({ path: '.env.local' })

async function testProjectsQuery() {
  console.log('🔍 Testing projects table findMany query...\n')

  try {
    // Import the Prisma client
    const { prisma } = await import('./src/lib/prisma.ts')

    // Test findMany on projects table
    console.log('📊 Executing: prisma.project.findMany()...')
    const projects = await prisma.project.findMany({
      take: 5, // Limit to 5 records for testing
      include: {
        cliente: {
          select: { firstName: true, lastName: true }
        }
      }
    })

    console.log(`✅ Query successful - Found ${projects.length} projects`)
    console.log('📋 Projects data:')
    projects.forEach((project, index) => {
      console.log(`   ${index + 1}. ${project.nombre_proyecto} (${project.estado}) - Client: ${project.cliente?.firstName} ${project.cliente?.lastName}`)
    })

    // Test count query
    const totalProjects = await prisma.project.count()
    console.log(`\n📈 Total projects in database: ${totalProjects}`)

    await prisma.$disconnect()
    console.log('\n🎉 Projects query test completed successfully!')

  } catch (error) {
    console.error('❌ Projects query test failed:', error.message)

    if (error.message.includes('connect')) {
      console.error('💡 Connection issue - check DATABASE_URL')
    } else if (error.message.includes('relation "public.projects" does not exist')) {
      console.error('💡 Table does not exist - run: npx prisma db push')
    } else if (error.message.includes('relation "public.users" does not exist')) {
      console.error('💡 Related table missing - check schema relationships')
    }

    process.exit(1)
  }
}

testProjectsQuery()











