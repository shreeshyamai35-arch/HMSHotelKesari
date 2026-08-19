#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');

function run(cmd, cwd) {
  console.log(`Running: ${cmd} in ${cwd}`);
  try {
    const result = execSync(cmd, { cwd, stdio: 'inherit', encoding: 'utf-8' });
    return result;
  } catch (error) {
    console.error(`Command failed: ${cmd}`);
    console.error(`Exit code: ${error.status}`);
    console.error(`Error: ${error.message}`);
    process.exit(error.status || 1);
  }
}

const root = __dirname;
const backend = path.join(root, 'backend');
const frontend = path.join(root, 'frontend');

// Build backend
console.log('Installing backend dependencies...');
run('npm install', backend);

// Set dummy DATABASE_URL for Prisma generate
// (Prisma validates connection string format even though it doesn't connect)
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/dummy';
process.env.DIRECT_URL = process.env.DIRECT_URL || 'postgresql://user:pass@localhost:5432/dummy';

console.log('DATABASE_URL for build:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@'));
console.log('DIRECT_URL for build:', process.env.DIRECT_URL.replace(/:[^:@]+@/, ':***@'));

console.log('Generating Prisma Client...');
try {
  execSync('npx prisma generate --skip-generate', {
    cwd: backend,
    stdio: ['pipe', 'pipe', 'pipe'],
    encoding: 'utf-8',
    env: { ...process.env }
  });
} catch (error) {
  console.log('Prisma generate with --skip-generate failed, trying without flag...');
  try {
    execSync('npx prisma generate', {
      cwd: backend,
      stdio: 'inherit',
      encoding: 'utf-8',
      env: { ...process.env }
    });
  } catch (error2) {
    console.error('Prisma generate failed!');
    console.error('Error:', error2.message);
    console.error('Exit code:', error2.status);
    if (error2.stderr) console.error('stderr:', error2.stderr);
    if (error2.stdout) console.error('stdout:', error2.stdout);
    process.exit(1);
  }
}

console.log('Compiling TypeScript...');
run('npx tsc -p tsconfig.json', backend);

// Build frontend
run('npm install', frontend);
run('npm run build', frontend);

console.log('Build complete!');
