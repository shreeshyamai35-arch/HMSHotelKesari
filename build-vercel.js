#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');

function run(cmd, cwd) {
  console.log(`Running: ${cmd} in ${cwd}`);
  try {
    const result = execSync(cmd, { cwd, stdio: 'pipe', encoding: 'utf-8' });
    console.log(result);
    return result;
  } catch (error) {
    console.error(`Command failed: ${cmd}`);
    console.error(`Exit code: ${error.status}`);
    console.error(`stdout: ${error.stdout}`);
    console.error(`stderr: ${error.stderr}`);
    console.error(`Error: ${error.message}`);
    process.exit(error.status || 1);
  }
}

const root = __dirname;
const backend = path.join(root, 'backend');
const frontend = path.join(root, 'frontend');

// Build backend
run('npm install', backend);

// Prisma requires DATABASE_URL even during generate
// Set to Vercel env var if available, otherwise use dummy
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/dummy';
  process.env.DIRECT_URL = 'postgresql://user:pass@localhost:5432/dummy';
  console.log('Using dummy DATABASE_URL for build (will be replaced at runtime)');
}

run('npx prisma generate', backend);
run('npx tsc -p tsconfig.json', backend);

// Build frontend
run('npm install', frontend);
run('npm run build', frontend);

console.log('Build complete!');
