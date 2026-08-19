#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
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
run('npx prisma generate', backend);

console.log('Compiling TypeScript...');
run('node node_modules/typescript/lib/tsc.js -p tsconfig.json', backend);

// Build frontend
run('npm install', frontend);
run('npm run build', frontend);

// Create Vercel output structure for serverless function
console.log('Creating serverless function structure...');
const funcDir = path.join(root, '.vercel', 'output', 'functions', 'api', 'index.func');
fs.mkdirSync(funcDir, { recursive: true });

// Copy API handler
fs.copyFileSync(
  path.join(root, 'api', 'index.js'),
  path.join(funcDir, 'index.js')
);

// Write function config
fs.writeFileSync(
  path.join(funcDir, '.vc-config.json'),
  JSON.stringify({
    runtime: 'nodejs20.x',
    handler: 'index.js',
    launcherType: 'Nodejs'
  }, null, 2)
);

console.log('Build complete!');
