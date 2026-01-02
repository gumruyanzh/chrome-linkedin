// Comprehensive Storage Utility Tests
import {
  STORAGE_KEYS,
  getStorageData,
  setStorageData,
  removeStorageData,
  clearStorageData,
  getSettings,
  updateSettings,
  getAnalytics,
  logAnalytics,
  validateStorageData,
  sanitizeStorageData
} from '../utils/storage.js';

describe('Storage Utility Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup Chrome storage mock
    global.chrome = {
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
      }
    };
  });

  describe('STORAGE_KEYS', () => {
    test('should have all required storage keys defined', () => {
      expect(STORAGE_KEYS.SETTINGS).toBe('settings');
      expect(STORAGE_KEYS.ANALYTICS).toBe('analytics');
      expect(STORAGE_KEYS.TEMPLATES).toBe('message_templates');
      expect(STORAGE_KEYS.CONNECTION_DATABASE).toBe('connection_database');
      expect(STORAGE_KEYS.CAMPAIGNS).toBe('campaigns');
      expect(STORAGE_KEYS.AB_TESTS).toBe('ab_tests');
    });

    test('should have unique key values', () => {
      const values = Object.values(STORAGE_KEYS);
      const uniqueValues = new Set(values);
      expect(values.length).toBe(uniqueValues.size);
    });
  });

  describe('getStorageData', () => {
    test('should get data from local storage by default', async () => {
      const mockData = { settings: { test: true } };
      chrome.storage.local.get.mockResolvedValue(mockData);

      const result = await getStorageData('settings');

      expect(chrome.storage.local.get).toHaveBeenCalledWith('settings');
      expect(result).toEqual(mockData);
    });

    test('should get data from sync storage when specified', async () => {
      const mockData = { settings: { test: true } };
      chrome.storage.sync.get.mockResolvedValue(mockData);

      const result = await getStorageData('settings', 'sync');

      expect(chrome.storage.sync.get).toHaveBeenCalledWith('settings');
      expect(result).toEqual(mockData);
    });

    test('should get all data when keys is null', async () => {
      const mockData = { settings: {}, analytics: [] };
      chrome.storage.local.get.mockResolvedValue(mockData);

      const result = await getStorageData(null);

      expect(chrome.storage.local.get).toHaveBeenCalledWith(null);
      expect(result).toEqual(mockData);
    });

    test('should throw error on storage failure', async () => {
      chrome.storage.local.get.mockRejectedValue(new Error('Storage error'));

      await expect(getStorageData('settings')).rejects.toThrow('Storage error');
    });

    test('should handle array of keys', async () => {
      const mockData = { settings: {}, analytics: [] };
      chrome.storage.local.get.mockResolvedValue(mockData);

      const result = await getStorageData(['settings', 'analytics']);

      expect(chrome.storage.local.get).toHaveBeenCalledWith(['settings', 'analytics']);
      expect(result).toEqual(mockData);
    });
  });

  describe('setStorageData', () => {
    test('should set data in local storage by default', async () => {
      chrome.storage.local.set.mockResolvedValue();

      await setStorageData({ settings: { test: true } });

      expect(chrome.storage.local.set).toHaveBeenCalled();
    });

    test('should set data in sync storage when specified', async () => {
      chrome.storage.sync.set.mockResolvedValue();

      await setStorageData({ settings: { test: true } }, 'sync');

      expect(chrome.storage.sync.set).toHaveBeenCalled();
    });

    test('should sanitize data by default', async () => {
      chrome.storage.local.set.mockResolvedValue();

      const maliciousData = {
        name: '<script>alert("xss")</script>Hello'
      };

      await setStorageData(maliciousData);

      expect(chrome.storage.local.set).toHaveBeenCalled();
      const calledWith = chrome.storage.local.set.mock.calls[0][0];
      expect(calledWith.name).not.toContain('<script>');
    });

    test('should skip sanitization when option is false', async () => {
      chrome.storage.local.set.mockResolvedValue();

      const data = { name: 'test' };
      await setStorageData(data, 'local', { sanitize: false });

      expect(chrome.storage.local.set).toHaveBeenCalledWith(data);
    });

    test('should throw error on storage failure', async () => {
      chrome.storage.local.set.mockRejectedValue(new Error('Storage full'));

      await expect(setStorageData({ test: true })).rejects.toThrow('Storage full');
    });
  });

  describe('removeStorageData', () => {
    test('should remove single key from storage', async () => {
      chrome.storage.local.remove.mockResolvedValue();

      await removeStorageData('settings');

      expect(chrome.storage.local.remove).toHaveBeenCalledWith('settings');
    });

    test('should remove multiple keys from storage', async () => {
      chrome.storage.local.remove.mockResolvedValue();

      await removeStorageData(['settings', 'analytics']);

      expect(chrome.storage.local.remove).toHaveBeenCalledWith(['settings', 'analytics']);
    });

    test('should remove from sync storage when specified', async () => {
      chrome.storage.sync.remove.mockResolvedValue();

      await removeStorageData('settings', 'sync');

      expect(chrome.storage.sync.remove).toHaveBeenCalledWith('settings');
    });

    test('should throw error on removal failure', async () => {
      chrome.storage.local.remove.mockRejectedValue(new Error('Removal failed'));

      await expect(removeStorageData('settings')).rejects.toThrow('Removal failed');
    });
  });

  describe('clearStorageData', () => {
    test('should clear local storage by default', async () => {
      chrome.storage.local.clear.mockResolvedValue();

      await clearStorageData();

      expect(chrome.storage.local.clear).toHaveBeenCalled();
    });

    test('should clear sync storage when specified', async () => {
      chrome.storage.sync.clear.mockResolvedValue();

      await clearStorageData('sync');

      expect(chrome.storage.sync.clear).toHaveBeenCalled();
    });

    test('should throw error on clear failure', async () => {
      chrome.storage.local.clear.mockRejectedValue(new Error('Clear failed'));

      await expect(clearStorageData()).rejects.toThrow('Clear failed');
    });
  });

  describe('getSettings', () => {
    test('should return default settings when no saved settings', async () => {
      chrome.storage.local.get.mockResolvedValue({});

      const settings = await getSettings();

      expect(settings).toHaveProperty('connectionRequestsPerDay', 20);
      expect(settings).toHaveProperty('delayBetweenRequests', 5000);
      expect(settings).toHaveProperty('personalizedMessages', true);
      expect(settings).toHaveProperty('analyticsEnabled', true);
      expect(settings).toHaveProperty('safeModeEnabled', true);
    });

    test('should merge saved settings with defaults', async () => {
      chrome.storage.local.get.mockResolvedValue({
        settings: { connectionRequestsPerDay: 50 }
      });

      const settings = await getSettings();

      expect(settings.connectionRequestsPerDay).toBe(50);
      expect(settings.delayBetweenRequests).toBe(5000);
    });

    test('should return defaults on error', async () => {
      chrome.storage.local.get.mockRejectedValue(new Error('Storage error'));

      const settings = await getSettings();

      expect(settings).toHaveProperty('connectionRequestsPerDay', 20);
    });

    test('should include working hours settings', async () => {
      chrome.storage.local.get.mockResolvedValue({});

      const settings = await getSettings();

      expect(settings.workingHours).toBeDefined();
      expect(settings.workingHours.start).toBe('09:00');
      expect(settings.workingHours.end).toBe('17:00');
    });
  });

  describe('updateSettings', () => {
    test('should update settings with new values', async () => {
      chrome.storage.local.get.mockResolvedValue({ settings: { connectionRequestsPerDay: 20 } });
      chrome.storage.local.set.mockResolvedValue();

      await updateSettings({ connectionRequestsPerDay: 30 });

      expect(chrome.storage.local.set).toHaveBeenCalled();
      const savedData = chrome.storage.local.set.mock.calls[0][0];
      expect(savedData.settings.connectionRequestsPerDay).toBe(30);
    });

    test('should preserve existing settings when updating', async () => {
      chrome.storage.local.get.mockResolvedValue({
        settings: { connectionRequestsPerDay: 20, delayBetweenRequests: 5000 }
      });
      chrome.storage.local.set.mockResolvedValue();

      await updateSettings({ connectionRequestsPerDay: 30 });

      const savedData = chrome.storage.local.set.mock.calls[0][0];
      expect(savedData.settings.delayBetweenRequests).toBe(5000);
    });

    test('should throw error on update failure', async () => {
      chrome.storage.local.get.mockResolvedValue({});
      chrome.storage.local.set.mockRejectedValue(new Error('Update failed'));

      await expect(updateSettings({ test: true })).rejects.toThrow('Update failed');
    });
  });

  describe('getAnalytics', () => {
    test('should return empty array when no analytics', async () => {
      chrome.storage.local.get.mockResolvedValue({});

      const analytics = await getAnalytics();

      expect(analytics).toEqual([]);
    });

    test('should return all analytics data', async () => {
      const mockAnalytics = [
        { type: 'connection_sent', timestamp: Date.now() },
        { type: 'connection_accepted', timestamp: Date.now() }
      ];
      chrome.storage.local.get.mockResolvedValue({ analytics: mockAnalytics });

      const analytics = await getAnalytics();

      expect(analytics).toEqual(mockAnalytics);
    });

    test('should filter analytics by days', async () => {
      const now = Date.now();
      const mockAnalytics = [
        { type: 'connection_sent', timestamp: now },
        { type: 'connection_sent', timestamp: now - 10 * 24 * 60 * 60 * 1000 } // 10 days ago
      ];
      chrome.storage.local.get.mockResolvedValue({ analytics: mockAnalytics });

      const analytics = await getAnalytics(7);

      expect(analytics.length).toBe(1);
    });

    test('should return empty array on error', async () => {
      chrome.storage.local.get.mockRejectedValue(new Error('Storage error'));

      const analytics = await getAnalytics();

      expect(analytics).toEqual([]);
    });
  });

  describe('logAnalytics', () => {
    test('should add new analytics entry', async () => {
      chrome.storage.local.get.mockResolvedValue({ analytics: [] });
      chrome.storage.local.set.mockResolvedValue();

      await logAnalytics({ type: 'connection_sent', profileId: '123' });

      expect(chrome.storage.local.set).toHaveBeenCalled();
      const savedData = chrome.storage.local.set.mock.calls[0][0];
      expect(savedData.analytics.length).toBe(1);
      expect(savedData.analytics[0].type).toBe('connection_sent');
      expect(savedData.analytics[0].timestamp).toBeDefined();
      expect(savedData.analytics[0].id).toBeDefined();
    });

    test('should limit analytics to 1000 entries', async () => {
      const existingAnalytics = Array.from({ length: 1000 }, (_, i) => ({
        type: 'test',
        timestamp: Date.now() - i * 1000,
        id: String(i)
      }));
      chrome.storage.local.get.mockResolvedValue({ analytics: existingAnalytics });
      chrome.storage.local.set.mockResolvedValue();

      await logAnalytics({ type: 'new_entry' });

      const savedData = chrome.storage.local.set.mock.calls[0][0];
      expect(savedData.analytics.length).toBe(1000);
    });

    test('should throw error on logging failure', async () => {
      chrome.storage.local.get.mockResolvedValue({ analytics: [] });
      chrome.storage.local.set.mockRejectedValue(new Error('Log failed'));

      await expect(logAnalytics({ type: 'test' })).rejects.toThrow('Log failed');
    });
  });

  describe('validateStorageData', () => {
    test('should validate settings data structure', () => {
      const validSettings = {
        connectionRequestsPerDay: 20,
        delayBetweenRequests: 5000,
        personalizedMessages: true
      };

      const result = validateStorageData(STORAGE_KEYS.SETTINGS, validSettings);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid settings values', () => {
      const invalidSettings = {
        connectionRequestsPerDay: 'not a number'
      };

      const result = validateStorageData(STORAGE_KEYS.SETTINGS, invalidSettings);

      expect(result.valid).toBe(false);
    });

    test('should validate analytics array structure', () => {
      const validAnalytics = [
        { type: 'connection_sent', timestamp: Date.now() }
      ];

      const result = validateStorageData(STORAGE_KEYS.ANALYTICS, validAnalytics);

      expect(result.valid).toBe(true);
    });

    test('should return valid for unknown keys', () => {
      const result = validateStorageData('unknown_key', { any: 'data' });

      expect(result.valid).toBe(true);
    });

    test('should handle null data', () => {
      const result = validateStorageData(STORAGE_KEYS.SETTINGS, null);

      expect(result.valid).toBe(true);
    });

    test('should validate number ranges', () => {
      const outOfRangeSettings = {
        connectionRequestsPerDay: 200 // Max is 100
      };

      const result = validateStorageData(STORAGE_KEYS.SETTINGS, outOfRangeSettings);

      expect(result.valid).toBe(false);
    });
  });

  describe('sanitizeStorageData', () => {
    test('should remove script tags from strings', () => {
      const malicious = '<script>alert("xss")</script>Hello World';
      const sanitized = sanitizeStorageData(malicious);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('Hello World');
    });

    test('should remove javascript: URLs', () => {
      const malicious = 'javascript:alert("xss")';
      const sanitized = sanitizeStorageData(malicious);

      expect(sanitized).not.toContain('javascript:');
    });

    test('should remove event handlers', () => {
      const malicious = '<div onclick="alert(1)">Test</div>';
      const sanitized = sanitizeStorageData(malicious);

      expect(sanitized).not.toMatch(/onclick\s*=/i);
    });

    test('should sanitize nested objects', () => {
      const malicious = {
        user: {
          name: '<script>alert("xss")</script>John'
        }
      };
      const sanitized = sanitizeStorageData(malicious);

      expect(sanitized.user.name).not.toContain('<script>');
    });

    test('should sanitize arrays', () => {
      const malicious = ['<script>evil()</script>test', 'safe'];
      const sanitized = sanitizeStorageData(malicious);

      expect(sanitized[0]).not.toContain('<script>');
      expect(sanitized[1]).toBe('safe');
    });

    test('should handle null and undefined', () => {
      expect(sanitizeStorageData(null)).toBeNull();
      expect(sanitizeStorageData(undefined)).toBeUndefined();
    });

    test('should preserve numbers and booleans', () => {
      expect(sanitizeStorageData(42)).toBe(42);
      expect(sanitizeStorageData(true)).toBe(true);
    });

    test('should sanitize object keys', () => {
      const malicious = { '<script>': 'value' };
      const sanitized = sanitizeStorageData(malicious);

      expect(Object.keys(sanitized)[0]).not.toContain('<');
      expect(Object.keys(sanitized)[0]).not.toContain('>');
    });
  });
});
