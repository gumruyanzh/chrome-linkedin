#!/usr/bin/env node

/**
 * Build script for Chrome Extension
 * Builds the extension and prepares it for Chrome Web Store or local testing
 */

import { execSync } from 'child_process';
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🚀 Building LinkedIn Chrome Extension...\n');

try {
  // Clean dist directory
  console.log('🧹 Cleaning dist directory...');
  execSync('rm -rf dist', { cwd: projectRoot, stdio: 'inherit' });

  // Create dist directory
  if (!existsSync(join(projectRoot, 'dist'))) {
    mkdirSync(join(projectRoot, 'dist'), { recursive: true });
  }

  // Build with Vite
  console.log('📦 Building with Vite...');
  execSync('npm run build', { cwd: projectRoot, stdio: 'inherit' });

  // Copy manifest.json
  console.log('📋 Copying manifest.json...');
  copyFileSync(
    join(projectRoot, 'src', 'manifest.json'),
    join(projectRoot, 'dist', 'manifest.json')
  );

  // Create icons directory and add placeholder icons
  console.log('🎨 Creating icons...');
  const iconsDir = join(projectRoot, 'dist', 'icons');
  if (!existsSync(iconsDir)) {
    mkdirSync(iconsDir, { recursive: true });
  }

  // Create placeholder icons (in a real project, you'd use actual icon files)
  const iconSizes = [16, 32, 48, 128];
  iconSizes.forEach(size => {
    const iconContent = createPlaceholderIcon(size);
    writeFileSync(join(iconsDir, `icon-${size}.png`), iconContent);
  });

  // Create build info
  console.log('ℹ️ Creating build info...');
  const buildInfo = {
    version: '1.0.0',
    buildTime: new Date().toISOString(),
    gitCommit: getGitCommit(),
    environment: process.env.NODE_ENV || 'development'
  };

  writeFileSync(
    join(projectRoot, 'dist', 'build-info.json'),
    JSON.stringify(buildInfo, null, 2)
  );

  // Validate build
  console.log('✅ Validating build...');
  validateBuild();

  console.log('\n🎉 Build completed successfully!');
  console.log('📁 Extension files are in the ./dist directory');
  console.log('🔧 To load in Chrome: go to chrome://extensions/, enable Developer mode, and click "Load unpacked"');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

function createPlaceholderIcon(size) {
  // Create a simple base64 encoded PNG placeholder
  // In a real project, you'd use actual PNG files
  const canvas = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="#0073b1"/>
    <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="white" font-family="Arial" font-size="${Math.floor(size/4)}">LI</text>
  </svg>`;

  // This is a placeholder - in production you'd use real PNG files
  return Buffer.from(canvas);
}

function getGitCommit() {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8', cwd: projectRoot }).trim();
  } catch {
    return 'unknown';
  }
}

function validateBuild() {
  const requiredFiles = [
    'manifest.json',
    'popup/popup.js',
    'background/service-worker.js',
    'content/linkedin-automation.js',
    'styles/tailwind.css'
  ];

  const missing = requiredFiles.filter(file => {
    return !existsSync(join(projectRoot, 'dist', file));
  });

  if (missing.length > 0) {
    throw new Error(`Missing required files: ${missing.join(', ')}`);
  }

  console.log('✅ All required files present');
}