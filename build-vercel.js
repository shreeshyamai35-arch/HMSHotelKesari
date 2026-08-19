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

// Build backend
run('npm install', backend);
run('npm run build', backend);

// Build frontend
run('npm install', frontend);
run('npm run build', frontend);

console.log('Build complete!');
