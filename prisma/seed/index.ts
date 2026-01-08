import { PrismaClient, Role, Permission } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create permissions
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

    // Pages permissions
    { name: 'pages.read', resource: 'pages', action: 'read', description: 'View pages' },
    { name: 'pages.create', resource: 'pages', action: 'create', description: 'Create pages' },
    { name: 'pages.update', resource: 'pages', action: 'update', description: 'Update pages' },
    { name: 'pages.delete', resource: 'pages', action: 'delete', description: 'Delete pages' },

    // Media permissions
    { name: 'media.read', resource: 'media', action: 'read', description: 'View media files' },
    { name: 'media.upload', resource: 'media', action: 'upload', description: 'Upload media files' },
    { name: 'media.delete', resource: 'media', action: 'delete', description: 'Delete media files' },

    // Settings permissions
    { name: 'settings.read', resource: 'settings', action: 'read', description: 'View system settings' },
    { name: 'settings.update', resource: 'settings', action: 'update', description: 'Update system settings' },

    // Analytics permissions
    { name: 'analytics.read', resource: 'analytics', action: 'read', description: 'View analytics' },
    { name: 'analytics.export', resource: 'analytics', action: 'export', description: 'Export analytics data' },

    // Logs permissions
    { name: 'logs.read', resource: 'logs', action: 'read', description: 'View system logs' },
    { name: 'logs.delete', resource: 'logs', action: 'delete', description: 'Delete old logs' },

    // Feedback permissions
    { name: 'feedback.read', resource: 'feedback', action: 'read', description: 'View user feedback' },
    { name: 'feedback.update', resource: 'feedback', action: 'update', description: 'Update feedback status' },
    { name: 'feedback.delete', resource: 'feedback', action: 'delete', description: 'Delete feedback' },
  ]

  console.log('Creating permissions...')
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    })
  }

  // Create roles
  const roles = [
    {
      name: 'superadmin',
      description: 'Full system access',
      isSystem: true,
      permissions: permissions.map(p => p.name) // All permissions
    },
    {
      name: 'admin',
      description: 'Administrative access',
      isSystem: true,
      permissions: [
        'users.read', 'users.create', 'users.update',
        'posts.read', 'posts.create', 'posts.update', 'posts.publish',
        'pages.read', 'pages.create', 'pages.update',
        'media.read', 'media.upload', 'media.delete',
        'settings.read', 'settings.update',
        'analytics.read', 'analytics.export',
        'logs.read',
        'feedback.read', 'feedback.update'
      ]
    },
    {
      name: 'editor',
      description: 'Content management access',
      isSystem: true,
      permissions: [
        'posts.read', 'posts.create', 'posts.update',
        'pages.read', 'pages.create', 'pages.update',
        'media.read', 'media.upload',
        'analytics.read'
      ]
    },
    {
      name: 'analyst',
      description: 'Analytics and reporting access',
      isSystem: true,
      permissions: [
        'analytics.read', 'analytics.export',
        'logs.read'
      ]
    },
    {
      name: 'support',
      description: 'Customer support access',
      isSystem: true,
      permissions: [
        'users.read',
        'feedback.read', 'feedback.update'
      ]
    }
  ]

  console.log('Creating roles...')
  for (const roleData of roles) {
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      update: {},
      create: {
        name: roleData.name,
        description: roleData.description,
        isSystem: roleData.isSystem,
      },
    })

    // Assign permissions to role
    for (const permissionName of roleData.permissions) {
      const permission = await prisma.permission.findUnique({
        where: { name: permissionName }
      })

      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permission.id
            }
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: permission.id
          }
        })
      }
    }
  }

  // Create superadmin user
  const superAdminRole = await prisma.role.findUnique({
    where: { name: 'superadmin' }
  })

  if (superAdminRole) {
    const hashedPassword = await bcrypt.hash('SuperAdmin123!', 12)

    await prisma.user.upsert({
      where: { email: 'admin@klowezone.com' },
      update: {},
      create: {
        email: 'admin@klowezone.com',
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        roleId: superAdminRole.id,
        isVerified: true,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'
      },
    })

    console.log('✅ Superadmin user created: admin@klowezone.com')
    console.log('🔑 Password: SuperAdmin123!')
  }

  // Create some sample testimonials
  console.log('Creating sample testimonials...')
  const adminUser = await prisma.user.findUnique({
    where: { email: 'admin@klowezone.com' }
  })

  if (adminUser) {
    const testimonials = [
      {
        name: 'María González',
        position: 'CEO',
        company: 'TechStartup Inc.',
        content: 'KloweZone transformó completamente nuestra presencia online. La plataforma es intuitiva y poderosa.',
        rating: 5,
        authorId: adminUser.id
      },
      {
        name: 'Carlos Rodríguez',
        position: 'Marketing Manager',
        company: 'Digital Agency',
        content: 'Excelente soporte y funcionalidades. Nos permite gestionar todo el contenido de nuestros clientes de manera eficiente.',
        rating: 5,
        authorId: adminUser.id
      },
      {
        name: 'Ana López',
        position: 'Content Creator',
        company: 'Freelance',
        content: 'La interfaz es hermosa y fácil de usar. Me encanta cómo puedo publicar contenido rápidamente.',
        rating: 4,
        authorId: adminUser.id
      }
    ]

    for (const testimonial of testimonials) {
      // Check if testimonial already exists
      const existing = await prisma.testimonial.findFirst({
        where: {
          name: testimonial.name,
          company: testimonial.company || ''
        }
      })

      if (!existing) {
        await prisma.testimonial.create({
          data: testimonial
        })
      }
    }
  }

  // Create default system configuration
  console.log('Creating default system configuration...')

  const defaultConfigs = [
    {
      key: 'site.name',
      value: 'KloweZone',
      category: 'system',
      isSecret: false
    },
    {
      key: 'site.description',
      value: 'Plataforma integral de gestión de contenido y clientes',
      category: 'system',
      isSecret: false
    },
    {
      key: 'email.default_provider',
      value: 'smtp',
      category: 'email',
      isSecret: false
    },
    {
      key: 'ai.default_provider',
      value: 'openai',
      category: 'ai',
      isSecret: false
    },
    {
      key: 'ai.default_model',
      value: 'gpt-4',
      category: 'ai',
      isSecret: false
    },
    {
      key: 'storage.default_provider',
      value: 'local',
      category: 'storage',
      isSecret: false
    }
  ]

  for (const config of defaultConfigs) {
    const existingConfig = await prisma.systemConfig.findFirst({
      where: {
        key: config.key,
        organizationId: null, // Global configs
      },
    })

    if (!existingConfig) {
      await prisma.systemConfig.create({
        data: config,
      })
    }
  }

  console.log('✅ Seed completed successfully!')
  console.log('')
  console.log('👤 Superadmin credentials:')
  console.log('   Email: admin@klowezone.com')
  console.log('   Password: SuperAdmin123!')
  console.log('')
  console.log('🔗 Admin Panel: http://localhost:3000/admin')
  console.log('')
  console.log('📝 Next steps:')
  console.log('   1. Configure email providers in /admin/settings/integrations')
  console.log('   2. Set up AI providers with your API keys')
  console.log('   3. Configure storage providers')
  console.log('   4. Create your first blog post in /admin/cms/blog')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })






