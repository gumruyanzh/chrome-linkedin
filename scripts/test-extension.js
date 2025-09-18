#!/usr/bin/env node

/**
 * Extension testing script
 * Runs comprehensive tests and generates coverage reports
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🧪 Running LinkedIn Chrome Extension tests...\n');

try {
  // Run unit tests with coverage
  console.log('🔬 Running unit tests with coverage...');
  execSync('npm run test:coverage', { cwd: projectRoot, stdio: 'inherit' });

  // Check coverage thresholds
  console.log('📊 Checking coverage thresholds...');
  if (existsSync(join(projectRoot, 'coverage', 'coverage-summary.json'))) {
    const coverage = JSON.parse(
      readFileSync(join(projectRoot, 'coverage', 'coverage-summary.json'), 'utf8')
    );

    const { total } = coverage;
    const thresholds = {
      statements: 90,
      branches: 90,
      functions: 90,
      lines: 90
    };

    let passed = true;

    Object.entries(thresholds).forEach(([metric, threshold]) => {
      const actual = total[metric].pct;
      if (actual < threshold) {
        console.log(`❌ ${metric}: ${actual}% < ${threshold}%`);
        passed = false;
      } else {
        console.log(`✅ ${metric}: ${actual}%`);
      }
    });

    if (!passed) {
      throw new Error('Coverage thresholds not met');
    }
  }

  // Run linting
  console.log('🔍 Running ESLint...');
  execSync('npm run lint', { cwd: projectRoot, stdio: 'inherit' });

  // Check code formatting
  console.log('💅 Checking code formatting...');
  try {
    execSync('npx prettier --check "src/**/*.{js,jsx,ts,tsx,css,md}"', {
      cwd: projectRoot,
      stdio: 'pipe'
    });
    console.log('✅ Code formatting is correct');
  } catch (error) {
    console.log('❌ Code formatting issues found');
    console.log('Run: npm run format');
    throw error;
  }

  // Test extension build
  console.log('🏗️ Testing extension build...');
  execSync('npm run build:extension', { cwd: projectRoot, stdio: 'inherit' });

  // Validate manifest
  console.log('📋 Validating manifest.json...');
  validateManifest();

  // Run Chrome extension specific tests
  console.log('🔌 Running Chrome extension tests...');
  runChromeExtensionTests();

  console.log('\n🎉 All tests passed!');
  console.log('📊 Coverage report: ./coverage/lcov-report/index.html');

} catch (error) {
  console.error('❌ Tests failed:', error.message);
  process.exit(1);
}

function validateManifest() {
  const manifestPath = join(projectRoot, 'dist', 'manifest.json');

  if (!existsSync(manifestPath)) {
    throw new Error('manifest.json not found in dist directory');
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

  // Required fields for Manifest V3
  const requiredFields = [
    'manifest_version',
    'name',
    'version',
    'description',
    'permissions',
    'action',
    'background'
  ];

  requiredFields.forEach(field => {
    if (!manifest[field]) {
      throw new Error(`Missing required field in manifest: ${field}`);
    }
  });

  // Validate manifest version
  if (manifest.manifest_version !== 3) {
    throw new Error('Extension must use Manifest V3');
  }

  // Validate permissions
  const allowedPermissions = [
    'storage',
    'tabs',
    'scripting',
    'activeTab'
  ];

  manifest.permissions.forEach(permission => {
    if (!allowedPermissions.includes(permission)) {
      console.warn(`⚠️ Non-standard permission: ${permission}`);
    }
  });

  console.log('✅ Manifest validation passed');
}

function runChromeExtensionTests() {
  // Test service worker syntax
  try {
    execSync('node -c dist/background/service-worker.js', {
      cwd: projectRoot,
      stdio: 'pipe'
    });
    console.log('✅ Service worker syntax valid');
  } catch (error) {
    throw new Error('Service worker syntax error');
  }

  // Test content script syntax
  try {
    execSync('node -c dist/content/linkedin-automation.js', {
      cwd: projectRoot,
      stdio: 'pipe'
    });
    console.log('✅ Content script syntax valid');
  } catch (error) {
    throw new Error('Content script syntax error');
  }

  // Test popup HTML structure
  const popupPath = join(projectRoot, 'dist', 'popup', 'popup.html');
  if (existsSync(popupPath)) {
    const popupContent = readFileSync(popupPath, 'utf8');

    // Basic HTML validation
    if (!popupContent.includes('<!DOCTYPE html>')) {
      throw new Error('Popup HTML missing DOCTYPE');
    }

    if (!popupContent.includes('<html')) {
      throw new Error('Popup HTML missing html tag');
    }

    console.log('✅ Popup HTML structure valid');
  }

  console.log('✅ Chrome extension specific tests passed');
}