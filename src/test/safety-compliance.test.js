// Comprehensive Safety and Compliance Tests
import {
  getSafetySettings,
  updateSafetySettings,
  performSafetyCheck,
  createRateLimitTracker,
  emergencyStopAutomation
} from '../utils/safety-compliance.js';

describe('Safety and Compliance Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-06-15T12:00:00Z')); // Saturday noon UTC

    // Setup Chrome storage mock
    global.chrome = {
      storage: {
        local: {
          get: jest.fn(),
          set: jest.fn()
        },
        sync: {
          get: jest.fn(),
          set: jest.fn()
        }
      }
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getSafetySettings', () => {
    test('should return default settings when no saved settings', async () => {
      chrome.storage.local.get.mockResolvedValue({});

      const settings = await getSafetySettings();

      expect(settings.dailyConnectionLimit).toBe(20);
      expect(settings.hourlyConnectionLimit).toBe(5);
      expect(settings.safeModeEnabled).toBe(true);
      expect(settings.humanLikePatterns).toBe(true);
    });

    test('should merge saved safety settings with defaults', async () => {
      chrome.storage.local.get.mockResolvedValue({
        settings: {
          safety: {
            dailyConnectionLimit: 30,
            hourlyConnectionLimit: 10
          }
        }
      });

      const settings = await getSafetySettings();

      expect(settings.dailyConnectionLimit).toBe(30);
      expect(settings.hourlyConnectionLimit).toBe(10);
      expect(settings.safeModeEnabled).toBe(true); // Default preserved
    });

    test('should return defaults on storage error', async () => {
      chrome.storage.local.get.mockRejectedValue(new Error('Storage error'));

      const settings = await getSafetySettings();

      expect(settings.dailyConnectionLimit).toBe(20);
    });

    test('should have delay configuration', async () => {
      chrome.storage.local.get.mockResolvedValue({});

      const settings = await getSafetySettings();

      expect(settings.delayBetweenRequests).toBeDefined();
      expect(settings.delayBetweenRequests.min).toBeGreaterThan(0);
      expect(settings.delayBetweenRequests.max).toBeGreaterThan(settings.delayBetweenRequests.min);
    });
  });

  describe('updateSafetySettings', () => {
    test('should update safety settings', async () => {
      chrome.storage.local.get.mockResolvedValue({ settings: {} });
      chrome.storage.local.set.mockResolvedValue();

      await updateSafetySettings({ dailyConnectionLimit: 25 });

      expect(chrome.storage.local.set).toHaveBeenCalled();
      const savedData = chrome.storage.local.set.mock.calls[0][0];
      expect(savedData.settings.safety.dailyConnectionLimit).toBe(25);
    });

    test('should preserve existing settings when updating', async () => {
      chrome.storage.local.get.mockResolvedValue({
        settings: {
          safety: { dailyConnectionLimit: 20, hourlyConnectionLimit: 5 }
        }
      });
      chrome.storage.local.set.mockResolvedValue();

      await updateSafetySettings({ dailyConnectionLimit: 30 });

      const savedData = chrome.storage.local.set.mock.calls[0][0];
      expect(savedData.settings.safety.hourlyConnectionLimit).toBe(5);
    });

    test('should throw error on update failure', async () => {
      chrome.storage.local.get.mockResolvedValue({});
      chrome.storage.local.set.mockRejectedValue(new Error('Update failed'));

      await expect(updateSafetySettings({ dailyConnectionLimit: 25 }))
        .rejects.toThrow('Update failed');
    });
  });

  describe('RateLimitTracker', () => {
    let tracker;

    beforeEach(() => {
      tracker = createRateLimitTracker();
    });

    describe('checkRateLimit', () => {
      test('should allow request when under limits', async () => {
        chrome.storage.local.get.mockResolvedValue({
          settings: {},
          analytics: []
        });

        const result = await tracker.checkRateLimit();

        expect(result.allowed).toBe(true);
        expect(result.remainingDaily).toBeDefined();
        expect(result.remainingHourly).toBeDefined();
      });

      test('should deny request when daily limit exceeded', async () => {
        const todayConnections = Array.from({ length: 25 }, () => ({
          type: 'connection_sent',
          timestamp: Date.now() - 1000
        }));

        chrome.storage.local.get.mockResolvedValue({
          settings: {},
          analytics: todayConnections
        });

        const result = await tracker.checkRateLimit();

        expect(result.allowed).toBe(false);
        expect(result.reason).toBe('DAILY_LIMIT_EXCEEDED');
      });

      test('should deny request when hourly limit exceeded', async () => {
        const hourlyConnections = Array.from({ length: 10 }, () => ({
          type: 'connection_sent',
          timestamp: Date.now() - 1000
        }));

        chrome.storage.local.get.mockResolvedValue({
          settings: {},
          analytics: hourlyConnections
        });

        const result = await tracker.checkRateLimit();

        expect(result.allowed).toBe(false);
        expect(result.reason).toBe('HOURLY_LIMIT_EXCEEDED');
      });

      test('should return error result on storage failure', async () => {
        chrome.storage.local.get.mockRejectedValue(new Error('Storage error'));

        const result = await tracker.checkRateLimit();

        expect(result.allowed).toBe(false);
        expect(result.reason).toBe('ERROR');
      });
    });

    describe('generateHumanDelay', () => {
      test('should return delay within configured range', async () => {
        chrome.storage.local.get.mockResolvedValue({
          settings: {
            safety: {
              delayBetweenRequests: { min: 3000, max: 8000 },
              humanLikePatterns: true
            }
          }
        });

        const delay = await tracker.generateHumanDelay();

        expect(delay).toBeGreaterThanOrEqual(3000);
        // Allow for additional delay factors
        expect(delay).toBeLessThan(20000);
      });

      test('should return minimum delay when human patterns disabled', async () => {
        chrome.storage.local.get.mockResolvedValue({
          settings: {
            safety: {
              delayBetweenRequests: { min: 3000, max: 8000 },
              humanLikePatterns: false
            }
          }
        });

        const delay = await tracker.generateHumanDelay();

        expect(delay).toBe(3000);
      });

      test('should return default delay on error', async () => {
        chrome.storage.local.get.mockRejectedValue(new Error('Storage error'));

        const delay = await tracker.generateHumanDelay();

        expect(delay).toBe(3000); // Default minimum
      });
    });

    describe('recordAttempt', () => {
      test('should track connection attempts', () => {
        tracker.recordAttempt(true);
        tracker.recordAttempt(false);

        // Internal state is tracked - verify by checking behavior
        expect(tracker.connectionAttempts.length).toBe(2);
      });

      test('should update last activity time', () => {
        const beforeTime = Date.now();
        tracker.recordAttempt(true);

        expect(tracker.lastActivityTime).toBeGreaterThanOrEqual(beforeTime);
      });

      test('should clean up old attempts (older than 24 hours)', () => {
        // Add old attempt
        tracker.connectionAttempts = [Date.now() - 25 * 60 * 60 * 1000]; // 25 hours ago
        tracker.recordAttempt(true);

        expect(tracker.connectionAttempts.length).toBe(1);
      });
    });
  });

  describe('performSafetyCheck', () => {
    test('should return safe when all checks pass', async () => {
      // Set to weekday
      jest.setSystemTime(new Date('2024-06-17T12:00:00Z')); // Monday

      chrome.storage.local.get.mockResolvedValue({
        settings: {
          safety: {
            safeModeEnabled: true,
            weekendMode: true,
            respectLinkedInLimits: true,
            workingHours: {
              enabled: false
            }
          }
        },
        analytics: []
      });

      const result = await performSafetyCheck();

      expect(result.safe).toBe(true);
    });

    test('should return safe when safe mode is disabled', async () => {
      chrome.storage.local.get.mockResolvedValue({
        settings: {
          safety: {
            safeModeEnabled: false
          }
        }
      });

      const result = await performSafetyCheck();

      expect(result.safe).toBe(true);
      expect(result.message).toBe('Safe mode disabled');
    });

    test('should detect suspicious activity - too many attempts', async () => {
      jest.setSystemTime(new Date('2024-06-17T12:00:00Z')); // Monday

      const recentAttempts = Array.from({ length: 15 }, (_, i) => ({
        type: 'connection_sent',
        timestamp: Date.now() - i * 1000
      }));

      chrome.storage.local.get.mockResolvedValue({
        settings: {
          safety: {
            safeModeEnabled: true,
            workingHours: { enabled: false },
            weekendMode: true,
            respectLinkedInLimits: true
          }
        },
        analytics: recentAttempts
      });

      const result = await performSafetyCheck();

      expect(result.safe).toBe(false);
      expect(result.reason).toBe('SUSPICIOUS_ACTIVITY');
    });

    test('should detect high failure rate', async () => {
      jest.setSystemTime(new Date('2024-06-17T12:00:00Z')); // Monday

      const failures = Array.from({ length: 8 }, (_, i) => ({
        type: 'connection_failed',
        timestamp: Date.now() - i * 1000
      }));

      chrome.storage.local.get.mockResolvedValue({
        settings: {
          safety: {
            safeModeEnabled: true,
            workingHours: { enabled: false },
            weekendMode: true,
            respectLinkedInLimits: true
          }
        },
        analytics: failures
      });

      const result = await performSafetyCheck();

      expect(result.safe).toBe(false);
      expect(result.reason).toBe('SUSPICIOUS_ACTIVITY');
    });

    test('should enforce weekend restrictions', async () => {
      jest.setSystemTime(new Date('2024-06-15T12:00:00Z')); // Saturday

      chrome.storage.local.get.mockResolvedValue({
        settings: {
          safety: {
            safeModeEnabled: true,
            weekendMode: false,
            workingHours: { enabled: false },
            respectLinkedInLimits: true
          }
        },
        analytics: []
      });

      const result = await performSafetyCheck();

      expect(result.safe).toBe(false);
      expect(result.reason).toBe('WEEKEND_MODE_DISABLED');
    });

    test('should return error result on check failure', async () => {
      chrome.storage.local.get.mockRejectedValue(new Error('Check failed'));

      const result = await performSafetyCheck();

      expect(result.safe).toBe(false);
      expect(result.reason).toBe('ERROR');
    });
  });

  describe('emergencyStopAutomation', () => {
    test('should enable emergency stop with reason', async () => {
      chrome.storage.local.get.mockResolvedValue({
        settings: {},
        analytics: []
      });
      chrome.storage.local.set.mockResolvedValue();

      await emergencyStopAutomation('User requested stop');

      expect(chrome.storage.local.set).toHaveBeenCalled();
    });

    test('should log emergency stop event', async () => {
      chrome.storage.local.get.mockResolvedValue({
        settings: {},
        analytics: []
      });
      chrome.storage.local.set.mockResolvedValue();

      await emergencyStopAutomation('Rate limit exceeded');

      // Check that analytics was updated
      const analyticsCalls = chrome.storage.local.set.mock.calls.filter(
        call => call[0].analytics
      );
      expect(analyticsCalls.length).toBeGreaterThan(0);
    });

    test('should handle storage errors gracefully', async () => {
      chrome.storage.local.get.mockRejectedValue(new Error('Storage error'));

      // Should not throw
      await expect(emergencyStopAutomation('Test')).resolves.toBeUndefined();
    });
  });

  describe('Working Hours', () => {
    test('should block outside working hours', async () => {
      jest.setSystemTime(new Date('2024-06-17T06:00:00Z')); // 6 AM Monday

      chrome.storage.local.get.mockResolvedValue({
        settings: {
          safety: {
            safeModeEnabled: true,
            weekendMode: true,
            respectLinkedInLimits: true,
            workingHours: {
              enabled: true,
              start: '09:00',
              end: '17:00'
            }
          }
        },
        analytics: []
      });

      const result = await performSafetyCheck();

      expect(result.safe).toBe(false);
      expect(result.reason).toBe('OUTSIDE_WORKING_HOURS');
    });

    test('should allow during working hours', async () => {
      jest.setSystemTime(new Date('2024-06-17T14:00:00Z')); // 2 PM Monday UTC

      chrome.storage.local.get.mockResolvedValue({
        settings: {
          safety: {
            safeModeEnabled: true,
            weekendMode: true,
            respectLinkedInLimits: true,
            workingHours: {
              enabled: true,
              start: '09:00',
              end: '17:00'
            }
          }
        },
        analytics: []
      });

      const result = await performSafetyCheck();

      expect(result.safe).toBe(true);
    });
  });

  describe('LinkedIn Compliance', () => {
    test('should warn when approaching weekly limits', async () => {
      jest.setSystemTime(new Date('2024-06-17T12:00:00Z')); // Monday

      const weeklyConnections = Array.from({ length: 105 }, (_, i) => ({
        type: 'connection_sent',
        timestamp: Date.now() - i * 60 * 60 * 1000 // Spread over the week
      }));

      chrome.storage.local.get.mockResolvedValue({
        settings: {
          safety: {
            safeModeEnabled: true,
            weekendMode: true,
            respectLinkedInLimits: true,
            workingHours: { enabled: false }
          }
        },
        analytics: weeklyConnections
      });

      const result = await performSafetyCheck();

      expect(result.safe).toBe(false);
      expect(result.reason).toBe('COMPLIANCE_VIOLATION');
    });
  });
});
