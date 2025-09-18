// Simplified tests for Chrome Storage integration
import { STORAGE_KEYS } from '../utils/storage.js';
import { createChromeExtensionMock } from './chrome-mock.js';

// Mock the webextension-polyfill import
jest.mock('webextension-polyfill', () => ({}), { virtual: true });

describe('Chrome Storage - Basic Tests', () => {
  let chromeMock;

  beforeEach(() => {
    chromeMock = createChromeExtensionMock();
    global.chrome = chromeMock;
  });

  describe('Storage Keys', () => {
    test('should have all required storage keys defined', () => {
      expect(STORAGE_KEYS).toHaveProperty('SETTINGS');
      expect(STORAGE_KEYS).toHaveProperty('ANALYTICS');
      expect(STORAGE_KEYS).toHaveProperty('TEMPLATES');
      expect(STORAGE_KEYS).toHaveProperty('SAVED_SEARCHES');
      expect(STORAGE_KEYS).toHaveProperty('CONNECTION_QUEUE');
      expect(STORAGE_KEYS).toHaveProperty('USER_PROFILE');
    });

    test('should use consistent naming convention', () => {
      Object.values(STORAGE_KEYS).forEach(key => {
        expect(typeof key).toBe('string');
        expect(key).toMatch(/^[a-z_]+$/); // lowercase with underscores
      });
    });
  });

  describe('Basic Chrome Storage Operations', () => {
    test('should have chrome storage mock available', () => {
      expect(global.chrome).toBeDefined();
      expect(global.chrome.storage).toBeDefined();
      expect(global.chrome.storage.local).toBeDefined();
    });

    test('chrome storage mock should work', async () => {
      await global.chrome.storage.local.set({ test: 'value' });
      const result = await global.chrome.storage.local.get('test');

      expect(result.test).toBe('value');
    });
  });
});
