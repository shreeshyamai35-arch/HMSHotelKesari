const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  const email = 'admin@hotelkesari.com';
  const password = 'Admin@123'; // Change this to your preferred password

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: {
      name: 'Admin User',
      email,
      passwordHash,
      role: 'ADMIN',
      department: 'Management',
      active: true,
    },
  });

  console.log('✓ Admin user ready:');
  console.log(`  Email: ${email}`);
  console.log(`  Password: ${password}`);
  console.log(`\n  Change the password after first login!`);

  await prisma.$disconnect();
}

createAdmin().catch(console.error);
