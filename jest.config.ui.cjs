/**
 * Jest Configuration for UI Testing
 * Specialized configuration for Puppeteer-based UI tests
 */

module.exports = {
  // Test environment
  testEnvironment: 'node', // Use node environment for Puppeteer

  // Test file patterns
  testMatch: [
    '<rootDir>/tests/ui/**/*.test.js'
  ],

  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/tests/ui/jest.setup.js'
  ],

  // Module paths
  modulePaths: ['<rootDir>'],

  // Transform settings
  transform: {
    '^.+\\.js$': 'babel-jest'
  },

  // Transform ignore patterns to handle ES modules
  transformIgnorePatterns: [
    'node_modules/(?!(pixelmatch|pngjs)/)'
  ],

  // Coverage settings
  collectCoverageFrom: [
    'tests/ui/utils/**/*.js',
    '!tests/ui/**/*.test.js',
    '!**/node_modules/**'
  ],

  // Test timeout
  testTimeout: 60000,

  // Verbose output
  verbose: true,

  // Setup and teardown
  globalSetup: '<rootDir>/tests/ui/jest.global-setup.js',
  globalTeardown: '<rootDir>/tests/ui/jest.global-teardown.js',

  // Custom matchers for image testing
  setupFilesAfterEnv: ['<rootDir>/tests/ui/jest.setup.js'],

  // Reporter configuration
  reporters: ['default'],

  // Error handling
  errorOnDeprecated: true,

  // Watch mode settings
  watchman: false,

  // Parallel execution
  maxWorkers: 1, // Run UI tests sequentially to avoid conflicts

  // Module name mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  }
};