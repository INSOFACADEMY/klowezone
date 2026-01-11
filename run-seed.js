import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function runSeed() {
  try {
    // Import the seed function and run it with our configured Prisma client
    const { prisma } = await import('./src/lib/prisma.ts');

    console.log('🌱 Starting seed with configured Prisma client...\n');

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
    ];

    console.log('Creating permissions...');
    for (const permission of permissions) {
      await prisma.permission.upsert({
        where: { name: permission.name },
        update: {},
        create: permission,
      });
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
      }
    ];

    console.log('Creating roles...');
    for (const roleData of roles) {
      const role = await prisma.role.upsert({
        where: { name: roleData.name },
        update: {},
        create: {
          name: roleData.name,
          description: roleData.description,
          isSystem: roleData.isSystem,
        },
      });

      // Assign permissions to role
      for (const permissionName of roleData.permissions) {
        const permission = await prisma.permission.findUnique({
          where: { name: permissionName }
        });

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
          });
        }
      }
    }

    // Create superadmin user
    const superAdminRole = await prisma.role.findUnique({
      where: { name: 'superadmin' }
    });

    if (superAdminRole) {
      // Hash password using bcrypt
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.default.hash('SuperAdmin123!', 12);

      const user = await prisma.user.upsert({
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
      });

      console.log('✅ Superadmin user created');
      console.log('👤 User ID:', user.id);
    }

    console.log('🎉 Seed completed successfully!');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    const { prisma } = await import('./src/lib/prisma.ts');
    await prisma.$disconnect();
  }
}

runSeed();














