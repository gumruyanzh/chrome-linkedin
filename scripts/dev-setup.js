#!/usr/bin/env node

/**
 * Development setup script
 * Sets up the development environment and validates dependencies
 */

import { execSync } from 'child_process';
import { existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🛠️ Setting up LinkedIn Chrome Extension development environment...\n');

try {
  // Check Node.js version
  console.log('🔍 Checking Node.js version...');
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

  if (majorVersion < 16) {
    throw new Error(`Node.js 16+ required, found ${nodeVersion}`);
  }
  console.log(`✅ Node.js ${nodeVersion} is compatible`);

  // Install dependencies
  console.log('📦 Installing dependencies...');
  execSync('npm install', { cwd: projectRoot, stdio: 'inherit' });

  // Check if git is initialized
  console.log('🔍 Checking git repository...');
  if (!existsSync(join(projectRoot, '.git'))) {
    console.log('📝 Initializing git repository...');
    execSync('git init', { cwd: projectRoot, stdio: 'inherit' });
    execSync('git add .', { cwd: projectRoot, stdio: 'inherit' });
    execSync('git commit -m "Initial commit: LinkedIn Chrome Extension setup"', { cwd: projectRoot, stdio: 'inherit' });
  } else {
    console.log('✅ Git repository already initialized');
  }

  // Create development environment file
  console.log('⚙️ Creating development environment...');
  const envContent = `# LinkedIn Chrome Extension Development Environment
NODE_ENV=development
VITE_DEV_MODE=true
VITE_DEBUG=true
`;

  writeFileSync(join(projectRoot, '.env.development'), envContent);

  // Run initial tests
  console.log('🧪 Running initial tests...');
  execSync('npm test', { cwd: projectRoot, stdio: 'inherit' });

  // Run linting
  console.log('🔍 Running linter...');
  execSync('npm run lint', { cwd: projectRoot, stdio: 'inherit' });

  // Format code
  console.log('💅 Formatting code...');
  execSync('npm run format', { cwd: projectRoot, stdio: 'inherit' });

  // Create initial build
  console.log('🏗️ Creating initial build...');
  execSync('npm run build:extension', { cwd: projectRoot, stdio: 'inherit' });

  console.log('\n🎉 Development environment setup complete!');
  console.log('\n📋 Next steps:');
  console.log('1. npm run dev - Start development server');
  console.log('2. npm test -- --watch - Run tests in watch mode');
  console.log('3. Load dist/ folder in Chrome Extensions (Developer mode)');
  console.log('4. Navigate to LinkedIn and test the extension');

} catch (error) {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
}