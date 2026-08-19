#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');

function run(cmd, cwd) {
  console.log(`Running: ${cmd} in ${cwd}`);
  execSync(cmd, { cwd, stdio: 'inherit' });
}

const root = __dirname;
const backend = path.join(root, 'backend');
const frontend = path.join(root, 'frontend');

// Build backend - install typescript as dev dependency
run('npm install', backend);
run('npx tsc -p tsconfig.json', backend);

// Build frontend
run('npm install', frontend);
run('npx tsc -b && npx vite build', frontend);

console.log('Build complete!');
