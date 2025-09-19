/**
 * Jest Global Setup for UI Testing
 * Runs once before all test suites
 */

const fs = require('fs').promises;
const path = require('path');

module.exports = async () => {
  console.log('🚀 Setting up UI test environment...');

  // Ensure test directories exist
  const testDirs = [
    path.join(__dirname, 'screenshots'),
    path.join(__dirname, '__snapshots__'),
    path.join(__dirname, '__diffs__'),
    path.join(__dirname, 'reports')
  ];

  for (const dir of testDirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    } catch (error) {
      if (error.code !== 'EEXIST') {
        console.error(`❌ Failed to create directory ${dir}:`, error.message);
      }
    }
  }

  // Check if extension is built
  const extensionPath = path.resolve(__dirname, '../../dist');
  const manifestPath = path.join(extensionPath, 'manifest.json');

  try {
    await fs.access(manifestPath);
    console.log('✅ Extension build found');
  } catch (error) {
    console.warn('⚠️ Extension not built - tests may fail. Run "npm run build" first.');
  }

  // Set environment variables for testing
  process.env.NODE_ENV = 'test';
  process.env.UI_TESTING = 'true';

  console.log('✅ UI test environment setup complete');
};