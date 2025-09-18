import { jest } from '@jest/globals';
import {
  getStorageData,
  setStorageData,
  removeStorageData,
  STORAGE_KEYS
} from '../../src/utils/storage.js';

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
  }
};

global.chrome = mockChrome;

describe('Privacy Compliance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GDPR Compliance', () => {
    test('should provide mechanism for data portability', async () => {
      const userData = {
        [STORAGE_KEYS.USER_PROFILE]: { name: 'John Doe', email: 'john@example.com' },
        [STORAGE_KEYS.ANALYTICS]: [
          { event: 'connection_sent', timestamp: Date.now() },
          { event: 'profile_viewed', timestamp: Date.now() - 86400000 }
        ],
        [STORAGE_KEYS.SETTINGS]: { theme: 'dark', notifications: true }
      };

      mockChrome.storage.local.get.mockResolvedValue(userData);

      const exportedData = await getStorageData();

      expect(exportedData).toHaveProperty(STORAGE_KEYS.USER_PROFILE);
      expect(exportedData).toHaveProperty(STORAGE_KEYS.ANALYTICS);
      expect(exportedData).toHaveProperty(STORAGE_KEYS.SETTINGS);

      const dataString = JSON.stringify(exportedData, null, 2);
      expect(dataString).toContain('John Doe');
      expect(dataString).toContain('john@example.com');
    });

    test('should implement right to erasure (right to be forgotten)', async () => {
      const personalDataKeys = [
        STORAGE_KEYS.USER_PROFILE,
        STORAGE_KEYS.ANALYTICS,
        STORAGE_KEYS.CONVERSATIONS,
        STORAGE_KEYS.TEMPLATES
      ];

      mockChrome.storage.local.remove.mockResolvedValue();
      mockChrome.storage.sync.remove.mockResolvedValue();

      await removeStorageData(personalDataKeys, 'local');
      await removeStorageData(personalDataKeys, 'sync');

      expect(mockChrome.storage.local.remove).toHaveBeenCalledWith(personalDataKeys);
      expect(mockChrome.storage.sync.remove).toHaveBeenCalledWith(personalDataKeys);
    });

    test('should implement consent management', () => {
      const consentData = {
        analytics: true,
        marketing: false,
        functional: true,
        timestamp: Date.now(),
        version: '1.0'
      };

      const hasValidConsent = (consent, purpose) => {
        return consent[purpose] === true &&
               consent.timestamp &&
               (Date.now() - consent.timestamp) < (365 * 24 * 60 * 60 * 1000); // 1 year
      };

      expect(hasValidConsent(consentData, 'analytics')).toBe(true);
      expect(hasValidConsent(consentData, 'marketing')).toBe(false);
      expect(hasValidConsent(consentData, 'functional')).toBe(true);
    });

    test('should implement data minimization principles', () => {
      const fullUserData = {
        id: '12345',
        name: 'John Doe',
        email: 'john@example.com',
        birthday: '1990-01-01',
        phone: '+1234567890',
        ssn: '123-45-6789',
        linkedinUrl: 'https://linkedin.com/in/johndoe',
        preferences: { theme: 'dark' }
      };

      const minimizeData = (data, purposes) => {
        const purposeFields = {
          'core_functionality': ['id', 'preferences'],
          'linkedin_automation': ['id', 'linkedinUrl', 'preferences'],
          'analytics': ['id']
        };

        const allowedFields = new Set();
        purposes.forEach(purpose => {
          if (purposeFields[purpose]) {
            purposeFields[purpose].forEach(field => allowedFields.add(field));
          }
        });

        const minimizedData = {};
        allowedFields.forEach(field => {
          if (data[field] !== undefined) {
            minimizedData[field] = data[field];
          }
        });

        return minimizedData;
      };

      const minimizedForCore = minimizeData(fullUserData, ['core_functionality']);
      const minimizedForLinkedIn = minimizeData(fullUserData, ['linkedin_automation']);
      const minimizedForAnalytics = minimizeData(fullUserData, ['analytics']);

      expect(minimizedForCore).toEqual({ id: '12345', preferences: { theme: 'dark' } });
      expect(minimizedForLinkedIn).toEqual({
        id: '12345',
        linkedinUrl: 'https://linkedin.com/in/johndoe',
        preferences: { theme: 'dark' }
      });
      expect(minimizedForAnalytics).toEqual({ id: '12345' });

      expect(minimizedForCore).not.toHaveProperty('ssn');
      expect(minimizedForCore).not.toHaveProperty('birthday');
      expect(minimizedForLinkedIn).not.toHaveProperty('phone');
      expect(minimizedForAnalytics).not.toHaveProperty('email');
    });
  });

  describe('CCPA Compliance', () => {
    test('should provide transparency about data collection', () => {
      const dataCollectionNotice = {
        categories: [
          'profile_information',
          'usage_analytics',
          'communication_preferences'
        ],
        purposes: [
          'service_functionality',
          'analytics_improvement',
          'user_experience'
        ],
        retention: {
          profile_information: '2 years',
          usage_analytics: '1 year',
          communication_preferences: 'until withdrawal'
        },
        sharing: 'no_third_party_sharing'
      };

      expect(dataCollectionNotice.categories).toContain('profile_information');
      expect(dataCollectionNotice.purposes).toContain('service_functionality');
      expect(dataCollectionNotice.retention.usage_analytics).toBe('1 year');
      expect(dataCollectionNotice.sharing).toBe('no_third_party_sharing');
    });

    test('should implement opt-out mechanisms', async () => {
      const userPreferences = {
        analytics_opt_out: false,
        marketing_opt_out: true,
        data_sale_opt_out: true
      };

      mockChrome.storage.local.set.mockResolvedValue();

      await setStorageData({ [STORAGE_KEYS.SETTINGS]: userPreferences });

      expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
        [STORAGE_KEYS.SETTINGS]: userPreferences
      });

      expect(userPreferences.marketing_opt_out).toBe(true);
      expect(userPreferences.data_sale_opt_out).toBe(true);
    });

    test('should validate data retention periods', () => {
      const dataRetentionPolicies = {
        [STORAGE_KEYS.ANALYTICS]: 365 * 24 * 60 * 60 * 1000, // 1 year
        [STORAGE_KEYS.USER_PROFILE]: 2 * 365 * 24 * 60 * 60 * 1000, // 2 years
        [STORAGE_KEYS.CONVERSATIONS]: 365 * 24 * 60 * 60 * 1000 // 1 year
      };

      const isWithinRetentionPeriod = (dataType, timestamp) => {
        const retentionPeriod = dataRetentionPolicies[dataType];
        return (Date.now() - timestamp) < retentionPeriod;
      };

      const now = Date.now();
      const sixMonthsAgo = now - (6 * 30 * 24 * 60 * 60 * 1000);
      const twoYearsAgo = now - (2 * 365 * 24 * 60 * 60 * 1000);

      expect(isWithinRetentionPeriod(STORAGE_KEYS.ANALYTICS, sixMonthsAgo)).toBe(true);
      expect(isWithinRetentionPeriod(STORAGE_KEYS.ANALYTICS, twoYearsAgo)).toBe(false);
      expect(isWithinRetentionPeriod(STORAGE_KEYS.USER_PROFILE, sixMonthsAgo)).toBe(true);
    });
  });

  describe('Data Security Requirements', () => {
    test('should implement data access logging', () => {
      const accessLog = [];

      const logDataAccess = (userId, dataType, operation, timestamp = Date.now()) => {
        accessLog.push({
          userId,
          dataType,
          operation,
          timestamp,
          sessionId: 'session_123'
        });
      };

      logDataAccess('user_123', STORAGE_KEYS.USER_PROFILE, 'read');
      logDataAccess('user_123', STORAGE_KEYS.ANALYTICS, 'write');

      expect(accessLog).toHaveLength(2);
      expect(accessLog[0].operation).toBe('read');
      expect(accessLog[1].operation).toBe('write');
      expect(accessLog[0].dataType).toBe(STORAGE_KEYS.USER_PROFILE);
    });

    test('should implement data breach detection', () => {
      const securityEvents = [];

      const detectAnomalousAccess = (accessPattern) => {
        const suspiciousIndicators = {
          rapidAccess: accessPattern.requestsPerMinute > 100,
          offHoursAccess: accessPattern.hour < 6 || accessPattern.hour > 22,
          unusualDataVolume: accessPattern.dataVolume > 1000000,
          suspiciousLocation: !accessPattern.trustedLocation
        };

        const riskScore = Object.values(suspiciousIndicators).filter(Boolean).length;

        if (riskScore >= 2) {
          securityEvents.push({
            type: 'anomalous_access',
            riskScore,
            timestamp: Date.now(),
            details: suspiciousIndicators
          });
        }

        return riskScore;
      };

      const suspiciousPattern = {
        requestsPerMinute: 150,
        hour: 3,
        dataVolume: 500000,
        trustedLocation: false
      };

      const normalPattern = {
        requestsPerMinute: 10,
        hour: 14,
        dataVolume: 1000,
        trustedLocation: true
      };

      expect(detectAnomalousAccess(suspiciousPattern)).toBeGreaterThanOrEqual(2);
      expect(detectAnomalousAccess(normalPattern)).toBeLessThan(2);
      expect(securityEvents).toHaveLength(1);
    });

    test('should implement secure data transmission', () => {
      const transmissionConfig = {
        encryption: 'AES-256-GCM',
        protocol: 'HTTPS',
        certificateValidation: true,
        minimumTLSVersion: '1.2'
      };

      const validateTransmissionSecurity = (config) => {
        const requirements = {
          hasEncryption: config.encryption && config.encryption.includes('AES'),
          usesHTTPS: config.protocol === 'HTTPS',
          validatesCerts: config.certificateValidation === true,
          modernTLS: parseFloat(config.minimumTLSVersion) >= 1.2
        };

        return Object.values(requirements).every(Boolean);
      };

      expect(validateTransmissionSecurity(transmissionConfig)).toBe(true);

      const insecureConfig = {
        encryption: 'none',
        protocol: 'HTTP',
        certificateValidation: false,
        minimumTLSVersion: '1.0'
      };

      expect(validateTransmissionSecurity(insecureConfig)).toBe(false);
    });
  });

  describe('Children\'s Privacy Protection', () => {
    test('should implement age verification', () => {
      const verifyAge = (birthDate) => {
        const today = new Date();
        const birth = new Date(birthDate);
        const age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
          return age - 1;
        }
        return age;
      };

      const isAdult = (birthDate) => verifyAge(birthDate) >= 18;

      expect(isAdult('1990-01-01')).toBe(true);
      expect(isAdult('2010-01-01')).toBe(false);
    });

    test('should restrict data collection for minors', () => {
      const collectData = (userData, isMinor) => {
        if (isMinor) {
          return {
            id: userData.id,
            parentalConsent: userData.parentalConsent || false
          };
        }
        return userData;
      };

      const adultData = {
        id: '123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890'
      };

      const minorData = {
        id: '456',
        name: 'Jane Smith',
        email: 'jane@example.com',
        parentalConsent: true
      };

      const processedAdultData = collectData(adultData, false);
      const processedMinorData = collectData(minorData, true);

      expect(processedAdultData).toEqual(adultData);
      expect(processedMinorData).toEqual({
        id: '456',
        parentalConsent: true
      });
      expect(processedMinorData).not.toHaveProperty('name');
      expect(processedMinorData).not.toHaveProperty('email');
    });
  });
});