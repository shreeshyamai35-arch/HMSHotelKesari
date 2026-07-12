import { createApp } from './app';
import { env } from './config/env';
import { startCronJobs } from './cron';
import prisma from './lib/prisma';

async function main() {
  const app = createApp();

  const server = app.listen(env.port, () => {
    console.log(`\n  Hotel Kesari API running on http://localhost:${env.port}`);
    console.log(`  Environment: ${env.nodeEnv}`);
    console.log(`  Health:      http://localhost:${env.port}/api/health\n`);
  });

  startCronJobs();

  const shutdown = async (signal: string) => {
    console.log(`\n[${signal}] shutting down...`);
    server.close();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
