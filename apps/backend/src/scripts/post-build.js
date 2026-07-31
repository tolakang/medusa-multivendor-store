const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const MEDUSA_SERVER_PATH = path.join(process.cwd(), '.medusa', 'server');

// Check if .medusa/server exists - if not, build process failed
if (!fs.existsSync(MEDUSA_SERVER_PATH)) {
  throw new Error('.medusa/server directory not found. This indicates the Medusa build process failed. Please check for build errors.');
}

// Copy package-lock.json (npm) to .medusa/server for deterministic installs
const lockfile = path.join(process.cwd(), 'package-lock.json');
if (fs.existsSync(lockfile)) {
  fs.copyFileSync(lockfile, path.join(MEDUSA_SERVER_PATH, 'package-lock.json'));
  console.log('Copied package-lock.json to .medusa/server/');
}

// Copy .env if it exists (for local builds)
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  fs.copyFileSync(envPath, path.join(MEDUSA_SERVER_PATH, '.env'));
  console.log('Copied .env to .medusa/server/');
}

// Install production dependencies in .medusa/server
console.log('Installing production dependencies in .medusa/server...');
try {
  execSync('npm install --production', {
    cwd: MEDUSA_SERVER_PATH,
    stdio: 'inherit'
  });
  console.log('Production dependencies installed successfully.');
} catch (error) {
  console.error('Failed to install production dependencies:', error.message);
  process.exit(1);
}
