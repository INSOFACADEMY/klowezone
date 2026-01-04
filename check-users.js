import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkUsers() {
  const { prisma } = await import('./src/lib/prisma.ts');

  console.log('🔍 Checking existing users in database...\n');

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      }
    });

    console.log(`Found ${users.length} users:`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.email}) - ID: ${user.id}`);
    });

    if (users.length > 0) {
      console.log(`\n✅ First user ID for testing: ${users[0].id}`);
    } else {
      console.log('\n❌ No users found. Need to create users first.');
    }

  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();






