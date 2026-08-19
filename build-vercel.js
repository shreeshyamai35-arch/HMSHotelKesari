#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');

function run(cmd, cwd) {
  console.log(`Running: ${cmd} in ${cwd}`);
  try {
    execSync(cmd, { cwd, stdio: 'inherit' });
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
run('npm install', backend);
run('npx prisma generate', backend);
run('npx tsc -p tsconfig.json', backend);

// Build api serverless function
run('npx --package=typescript tsc api/index.ts --outDir api --module commonjs --esModuleInterop true --skipLibCheck true', root);

// Build frontend
run('npm install', frontend);
run('npm run build', frontend);

console.log('Build complete!');
