const { PrismaClient } = require('@prisma/client');

async function migrate() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DIRECT_URL || process.env.DATABASE_URL
      }
    }
  });

  try {
    console.log('Testing connection...');
    await prisma.$connect();
    console.log('Connected successfully');
    
    console.log('Checking users table...');
    const userCount = await prisma.user.count();
    console.log(`Users table exists, count: ${userCount}`);
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Connection error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

migrate();
