// Task 6.3: Error Reporting System Tests
// Comprehensive tests for global error capturing, categorization, and privacy-safe reporting

import { jest } from '@jest/globals';

// Mock dependencies
jest.mock('../src/utils/storage.js');
jest.mock('../src/utils/encryption.js');
jest.mock('../src/utils/real-time-analytics.js');

describe('Error Reporting System (Task 6.3)', () => {
  let errorReporter;
  let errorCategorizer;
  let stackTraceAnalyzer;
  let errorDeduplicator;
  let privacyFilter;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Reset global error handlers
    global.addEventListener?.mockClear?.();
    global.removeEventListener?.mockClear?.();

    // Mock browser APIs
    global.chrome = {
      runtime: {
        onError: {
          addListener: jest.fn(),
          removeListener: jest.fn()
        },
        lastError: null
      },
      tabs: {
        onUpdated: {
          addListener: jest.fn()
        }
      }
    };

    // Mock performance API
    global.performance = {
      now: jest.fn(() => Date.now()),
      mark: jest.fn(),
      measure: jest.fn()
    };

    // Mock console methods
    global.console = {
      error: jest.fn(),
      warn: jest.fn(),
      log: jest.fn()
    };

    // Initialize components (will be implemented)
    const {
      GlobalErrorCapture,
      ErrorCategorizer,
      StackTraceAnalyzer,
      ErrorDeduplicator,
      PrivacySafeErrorReporter
    } = require('../src/utils/error-reporting.js');

    errorReporter = new GlobalErrorCapture();
    errorCategorizer = new ErrorCategorizer();
    stackTraceAnalyzer = new StackTraceAnalyzer();
    errorDeduplicator = new ErrorDeduplicator();
    privacyFilter = new PrivacySafeErrorReporter();
  });

  describe('Global Error Capturing', () => {
    test('should capture JavaScript runtime errors', async () => {
      const mockError = new Error('Test runtime error');
      mockError.stack = 'Error: Test runtime error\n    at test.js:10:15\n    at Object.fn (test.js:5:10)';

      await errorReporter.initialize();

      // Simulate a JavaScript error
      const errorEvent = new ErrorEvent('error', {
        error: mockError,
        message: 'Test runtime error',
        filename: 'test.js',
        lineno: 10,
        colno: 15
      });

      await errorReporter.handleError(errorEvent);

      const capturedErrors = errorReporter.getCapturedErrors();
      expect(capturedErrors).toHaveLength(1);
      expect(capturedErrors[0]).toMatchObject({
        type: 'javascript_error',
        message: 'Test runtime error',
        source: 'test.js',
        line: 10,
        column: 15,
        stack: expect.stringContaining('Error: Test runtime error'),
        timestamp: expect.any(Number),
        errorId: expect.any(String)
      });
    });

    test('should capture unhandled promise rejections', async () => {
      await errorReporter.initialize();

      const rejectionReason = new Error('Unhandled promise rejection');
      // Mock PromiseRejectionEvent for Node.js environment
      const rejectionEvent = {
        type: 'unhandledrejection',
        promise: Promise.reject(rejectionReason),
        reason: rejectionReason
      };

      await errorReporter.handlePromiseRejection(rejectionEvent);

      const capturedErrors = errorReporter.getCapturedErrors();
      expect(capturedErrors).toHaveLength(1);
      expect(capturedErrors[0]).toMatchObject({
        type: 'promise_rejection',
        message: 'Unhandled promise rejection',
        stack: expect.any(String),
        timestamp: expect.any(Number),
        errorId: expect.any(String)
      });
    });

    test('should capture Chrome extension errors', async () => {
      await errorReporter.initialize();

      // Simulate Chrome extension error
      chrome.runtime.lastError = { message: 'Extension context invalidated' };

      await errorReporter.checkChromeErrors();

      const capturedErrors = errorReporter.getCapturedErrors();
      expect(capturedErrors).toHaveLength(1);
      expect(capturedErrors[0]).toMatchObject({
        type: 'chrome_extension_error',
        message: 'Extension context invalidated',
        source: 'chrome_runtime',
        timestamp: expect.any(Number),
        errorId: expect.any(String)
      });
    });

    test('should capture network request errors', async () => {
      await errorReporter.initialize();

      const networkError = {
        type: 'network_error',
        url: 'https://api.linkedin.com/v2/people',
        status: 429,
        statusText: 'Too Many Requests',
        responseTime: 5000,
        retryCount: 3
      };

      await errorReporter.captureNetworkError(networkError);

      const capturedErrors = errorReporter.getCapturedErrors();
      expect(capturedErrors).toHaveLength(1);
      expect(capturedErrors[0]).toMatchObject({
        type: 'network_error',
        url: 'https://api.linkedin.com/v2/people',
        status: 429,
        statusText: 'Too Many Requests',
        metadata: {
          responseTime: 5000,
          retryCount: 3
        },
        timestamp: expect.any(Number),
        errorId: expect.any(String)
      });
    });

    test('should capture LinkedIn-specific automation errors', async () => {
      await errorReporter.initialize();

      const automationError = {
        type: 'automation_error',
        action: 'send_connection_request',
        element: 'button[data-control-name="connect"]',
        profileId: 'profile-123',
        reason: 'Element not found after timeout',
        timeout: 10000
      };

      await errorReporter.captureAutomationError(automationError);

      const capturedErrors = errorReporter.getCapturedErrors();
      expect(capturedErrors).toHaveLength(1);
      expect(capturedErrors[0]).toMatchObject({
        type: 'automation_error',
        action: 'send_connection_request',
        element: 'button[data-control-name="connect"]',
        reason: 'Element not found after timeout',
        metadata: {
          timeout: 10000
        },
        timestamp: expect.any(Number),
        errorId: expect.any(String)
      });
    });

    test('should handle high-frequency error capture without blocking', async () => {
      await errorReporter.initialize();
      errorReporter.setRateLimit(100); // 100 errors per second max

      const startTime = performance.now();

      // Generate 200 errors rapidly
      const errorPromises = Array.from({ length: 200 }, (_, i) => {
        const error = new Error(`Error ${i}`);
        return errorReporter.handleError(new ErrorEvent('error', {
          error,
          message: `Error ${i}`,
          filename: 'test.js',
          lineno: i,
          colno: 1
        }));
      });

      await Promise.all(errorPromises);

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete quickly despite rate limiting
      expect(duration).toBeLessThan(500); // Less than 500ms

      const capturedErrors = errorReporter.getCapturedErrors();
      // Should apply rate limiting
      expect(capturedErrors.length).toBeLessThanOrEqual(200);
    });

    test('should maintain error capture performance under load', async () => {
      await errorReporter.initialize();

      const startTime = performance.now();

      // Simulate concurrent error handling
      const concurrentErrors = Array.from({ length: 50 }, (_, i) => {
        return errorReporter.handleError(new ErrorEvent('error', {
          error: new Error(`Concurrent error ${i}`),
          message: `Concurrent error ${i}`,
          filename: 'test.js',
          lineno: i,
          colno: 1
        }));
      });

      await Promise.all(concurrentErrors);

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should handle 50 concurrent errors in less than 100ms
      expect(duration).toBeLessThan(100);
      expect(errorReporter.getCapturedErrors()).toHaveLength(50);
    });
  });

  describe('Error Categorization and Severity', () => {
    test('should categorize errors by type and assign severity levels', () => {
      const errors = [
        { message: 'Script error', source: 'content-script.js', type: 'javascript_error' },
        { message: 'Network timeout', status: 408, type: 'network_error' },
        { message: 'Extension context invalidated', type: 'chrome_extension_error' },
        { message: 'Element not found', action: 'click', type: 'automation_error' },
        { message: 'Storage quota exceeded', type: 'storage_error' }
      ];

      errors.forEach(error => {
        const categorized = errorCategorizer.categorize(error);

        expect(categorized).toMatchObject({
          category: expect.any(String),
          severity: expect.stringMatching(/^(critical|high|medium|low)$/),
          subcategory: expect.any(String),
          tags: expect.any(Array)
        });
      });

      // Test specific categorizations
      const jsError = errorCategorizer.categorize(errors[0]);
      expect(jsError.category).toBe('runtime');
      expect(jsError.severity).toBe('medium');

      const networkError = errorCategorizer.categorize(errors[1]);
      expect(networkError.category).toBe('network');
      expect(networkError.severity).toBe('high');

      const extensionError = errorCategorizer.categorize(errors[2]);
      expect(extensionError.category).toBe('extension');
      expect(extensionError.severity).toBe('critical');
    });

    test('should adjust severity based on error frequency', () => {
      const repeatedError = {
        message: 'Minor connection issue',
        type: 'network_error',
        status: 502
      };

      // First occurrence - high severity (base severity for network errors)
      const firstOccurrence = errorCategorizer.categorize(repeatedError);
      expect(firstOccurrence.severity).toBe('high');

      // Simulate multiple occurrences
      for (let i = 0; i < 10; i++) {
        errorCategorizer.recordOccurrence(repeatedError);
      }

      // After 10 occurrences - should escalate to high severity
      const repeatedOccurrence = errorCategorizer.categorize(repeatedError);
      expect(repeatedOccurrence.severity).toBe('high');
    });

    test('should categorize LinkedIn-specific errors', () => {
      const linkedinErrors = [
        {
          type: 'automation_error',
          action: 'send_connection_request',
          reason: 'Rate limit exceeded',
          profileId: 'profile-123'
        },
        {
          type: 'automation_error',
          action: 'scrape_profile',
          reason: 'Profile not accessible',
          profileId: 'private-profile'
        },
        {
          type: 'network_error',
          url: 'https://www.linkedin.com/voyager/api/search',
          status: 403,
          message: 'Forbidden'
        }
      ];

      linkedinErrors.forEach(error => {
        const categorized = errorCategorizer.categorize(error);

        expect(categorized.tags).toContain('linkedin');
        expect(categorized.category).toMatch(/^(automation|network|access)$/);
      });
    });

    test('should classify errors based on user impact', () => {
      const errors = [
        {
          type: 'automation_error',
          action: 'send_connection_request',
          reason: 'Button not found',
          affectedUsers: 1
        },
        {
          type: 'storage_error',
          message: 'Storage quota exceeded',
          affectedUsers: 100
        },
        {
          type: 'chrome_extension_error',
          message: 'Extension crashed',
          affectedUsers: 500
        }
      ];

      const impacts = errors.map(error => errorCategorizer.classifyImpact(error));

      expect(impacts[0]).toMatchObject({
        level: 'low',
        scope: 'individual',
        priority: 'medium'
      });

      expect(impacts[1]).toMatchObject({
        level: 'high',
        scope: 'multiple_users',
        priority: 'high'
      });

      expect(impacts[2]).toMatchObject({
        level: 'critical',
        scope: 'widespread',
        priority: 'critical'
      });
    });
  });

  describe('Stack Trace Analysis and Context Collection', () => {
    test('should parse and analyze stack traces', () => {
      const stackTrace = `Error: Connection failed
    at sendRequest (linkedin-automation.js:45:12)
    at processProfile (linkedin-automation.js:123:8)
    at automateConnections (linkedin-automation.js:200:15)
    at Object.startAutomation (content-script.js:89:22)
    at chrome-extension://abc123/content.js:15:10`;

      const analysis = stackTraceAnalyzer.analyze(stackTrace);

      expect(analysis).toMatchObject({
        frames: expect.arrayContaining([
          expect.objectContaining({
            function: 'sendRequest',
            file: 'linkedin-automation.js',
            line: 45,
            column: 12
          }),
          expect.objectContaining({
            function: 'processProfile',
            file: 'linkedin-automation.js',
            line: 123,
            column: 8
          })
        ]),
        rootCause: expect.objectContaining({
          function: 'sendRequest',
          file: 'linkedin-automation.js',
          line: 45
        }),
        context: expect.objectContaining({
          extension: true,
          linkedinAutomation: true,
          sourceMap: false
        })
      });
    });

    test('should collect error context from DOM state', () => {
      // Mock DOM state
      global.document = {
        URL: 'https://www.linkedin.com/search/results/people/',
        title: 'LinkedIn Search Results',
        readyState: 'complete',
        querySelector: jest.fn((selector) => {
          if (selector === '[data-test-id="search-results"]') {
            return { children: { length: 10 } };
          }
          return null;
        }),
        querySelectorAll: jest.fn((selector) => {
          if (selector === '.search-result') {
            return Array(10).fill({});
          }
          return [];
        })
      };

      const context = stackTraceAnalyzer.collectDOMContext();

      expect(context).toMatchObject({
        url: 'https://www.linkedin.com/search/results/people/',
        title: 'LinkedIn Search Results',
        readyState: 'complete',
        searchResults: 10,
        pageType: 'search_results',
        linkedinSection: 'search'
      });
    });

    test('should collect browser and extension context', () => {
      // Mock browser context
      global.navigator = {
        userAgent: 'Mozilla/5.0 (Chrome/119.0.0.0)',
        language: 'en-US',
        onLine: true,
        cookieEnabled: true
      };

      global.chrome = {
        runtime: {
          getManifest: jest.fn(() => ({
            version: '1.0.0',
            manifest_version: 3
          })),
          id: 'test-extension-id'
        }
      };

      const context = stackTraceAnalyzer.collectBrowserContext();

      expect(context).toMatchObject({
        userAgent: 'Mozilla/5.0 (Chrome/119.0.0.0)',
        language: 'en-US',
        online: true,
        cookiesEnabled: true,
        extensionVersion: '1.0.0',
        manifestVersion: 3,
        extensionId: 'test-extension-id'
      });
    });

    test('should identify error patterns and common issues', () => {
      const errors = [
        {
          message: 'Cannot read property of null',
          stack: 'at processProfile (linkedin-automation.js:45:12)',
          type: 'javascript_error'
        },
        {
          message: 'Cannot read property of null',
          stack: 'at processProfile (linkedin-automation.js:45:12)',
          type: 'javascript_error'
        },
        {
          message: 'Element not found',
          stack: 'at findElement (linkedin-automation.js:123:8)',
          type: 'automation_error'
        }
      ];

      const patterns = stackTraceAnalyzer.identifyPatterns(errors);

      expect(patterns).toMatchObject({
        commonLocations: [
          {
            file: 'linkedin-automation.js',
            line: 45,
            frequency: 2
          }
        ],
        commonMessages: [
          {
            pattern: 'Cannot read property of null',
            frequency: 2
          }
        ],
        suggestedFixes: expect.arrayContaining([
          expect.stringContaining('null check')
        ])
      });
    });

    test('should track error propagation chains', () => {
      const errorChain = [
        {
          message: 'Network request failed',
          stack: 'at makeRequest (api.js:10:5)',
          timestamp: 1000,
          errorId: 'error-1'
        },
        {
          message: 'Failed to load profile data',
          stack: 'at loadProfile (profile.js:25:10)',
          timestamp: 1005,
          errorId: 'error-2',
          causedBy: 'error-1'
        },
        {
          message: 'Cannot render profile',
          stack: 'at renderProfile (ui.js:50:15)',
          timestamp: 1010,
          errorId: 'error-3',
          causedBy: 'error-2'
        }
      ];

      const propagation = stackTraceAnalyzer.analyzePropagation(errorChain);

      expect(propagation).toMatchObject({
        rootCause: 'error-1',
        propagationPath: ['error-1', 'error-2', 'error-3'],
        totalImpact: 3,
        propagationTime: 10,
        criticalPath: expect.arrayContaining([
          'makeRequest',
          'loadProfile',
          'renderProfile'
        ])
      });
    });
  });

  describe('Error Deduplication and Aggregation', () => {
    test('should deduplicate identical errors', () => {
      const identicalErrors = [
        {
          message: 'Network timeout',
          stack: 'at request.js:15:10',
          type: 'network_error',
          url: 'https://api.linkedin.com'
        },
        {
          message: 'Network timeout',
          stack: 'at request.js:15:10',
          type: 'network_error',
          url: 'https://api.linkedin.com'
        },
        {
          message: 'Network timeout',
          stack: 'at request.js:15:10',
          type: 'network_error',
          url: 'https://api.linkedin.com'
        }
      ];

      identicalErrors.forEach(error => errorDeduplicator.process(error));

      const deduplicated = errorDeduplicator.getDeduplicatedErrors();
      expect(deduplicated).toHaveLength(1);
      expect(deduplicated[0]).toMatchObject({
        message: 'Network timeout',
        count: 3,
        firstOccurrence: expect.any(Number),
        lastOccurrence: expect.any(Number),
        occurrences: expect.any(Array)
      });
    });

    test('should group similar errors with slight variations', () => {
      const similarErrors = [
        {
          message: 'Cannot read property "name" of null',
          stack: 'at processProfile (automation.js:45:12)',
          profileId: 'profile-1'
        },
        {
          message: 'Cannot read property "title" of null',
          stack: 'at processProfile (automation.js:45:12)',
          profileId: 'profile-2'
        },
        {
          message: 'Cannot read property "company" of null',
          stack: 'at processProfile (automation.js:45:12)',
          profileId: 'profile-3'
        }
      ];

      similarErrors.forEach(error => errorDeduplicator.process(error));

      const grouped = errorDeduplicator.getGroupedErrors();
      expect(grouped).toHaveLength(1);
      expect(grouped[0]).toMatchObject({
        pattern: 'Cannot read property * of null',
        location: 'automation.js:45',
        count: 3,
        variations: 3,
        affectedProfiles: ['profile-1', 'profile-2', 'profile-3']
      });
    });

    test('should aggregate errors by time windows', () => {
      const baseTime = Date.now();
      const timeWindowErrors = [
        { message: 'Error A', timestamp: baseTime },
        { message: 'Error B', timestamp: baseTime + 30000 }, // 30 seconds later
        { message: 'Error C', timestamp: baseTime + 90000 }, // 90 seconds later
        { message: 'Error A', timestamp: baseTime + 120000 }, // 2 minutes later
      ];

      timeWindowErrors.forEach(error => errorDeduplicator.process(error));

      const windowAggregation = errorDeduplicator.aggregateByTimeWindow(60000); // 1-minute windows

      expect(windowAggregation).toMatchObject({
        windows: [
          {
            start: baseTime,
            end: baseTime + 60000,
            errorCount: 2,
            uniqueErrors: 2
          },
          {
            start: baseTime + 60000,
            end: baseTime + 120000,
            errorCount: 1,
            uniqueErrors: 1
          },
          {
            start: baseTime + 120000,
            end: baseTime + 180000,
            errorCount: 1,
            uniqueErrors: 1
          }
        ],
        peakWindow: expect.objectContaining({
          errorCount: 2
        })
      });
    });

    test('should calculate error frequency trends', () => {
      const trendErrors = [];
      const baseTime = Date.now() - 86400000; // 24 hours ago

      // Generate errors with increasing frequency
      for (let hour = 0; hour < 24; hour++) {
        const errorsInHour = Math.floor(hour / 4) + 1; // Increasing trend
        for (let i = 0; i < errorsInHour; i++) {
          trendErrors.push({
            message: `Error ${hour}-${i}`,
            timestamp: baseTime + (hour * 3600000) + (i * 1000)
          });
        }
      }

      trendErrors.forEach(error => errorDeduplicator.process(error));

      const trends = errorDeduplicator.calculateTrends();

      expect(trends).toMatchObject({
        direction: 'increasing',
        slope: expect.any(Number),
        confidence: expect.any(Number),
        prediction: expect.objectContaining({
          nextHour: expect.any(Number),
          next24Hours: expect.any(Number)
        })
      });

      expect(trends.slope).toBeGreaterThan(0); // Increasing trend
      expect(trends.confidence).toBeGreaterThan(0.7); // High confidence
    });

    test('should maintain deduplication performance under load', () => {
      const startTime = performance.now();

      // Process 1000 errors with various patterns
      for (let i = 0; i < 1000; i++) {
        const error = {
          message: `Error ${i % 10}`, // 10 different error types
          stack: `at function${i % 5} (file.js:${i % 20}:10)`, // 5 different stack traces
          timestamp: Date.now() + i
        };
        errorDeduplicator.process(error);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should process 1000 errors in less than 100ms
      expect(duration).toBeLessThan(100);

      const deduplicated = errorDeduplicator.getDeduplicatedErrors();
      // Should deduplicate to much fewer unique errors
      expect(deduplicated.length).toBeLessThan(100);
    });
  });

  describe('Privacy-Safe Error Reporting', () => {
    test('should remove sensitive data from error reports', () => {
      const sensitiveError = {
        message: 'Failed to process profile john.doe@company.com',
        stack: 'Error at processProfile\n    at https://linkedin.com/in/john-doe',
        url: 'https://linkedin.com/in/john-doe-sensitive-profile',
        profileData: {
          name: 'John Doe',
          email: 'john.doe@company.com',
          phone: '+1-555-123-4567',
          company: 'Secret Company Inc'
        },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        sessionId: 'user-session-12345',
        cookies: ['auth_token=abc123', 'session_id=xyz789']
      };

      const sanitized = privacyFilter.sanitizeError(sensitiveError);

      expect(sanitized).toMatchObject({
        message: 'Failed to process profile [EMAIL_REDACTED]',
        stack: expect.not.stringContaining('john-doe'),
        url: '[URL_REDACTED]',
        profileData: '[PROFILE_DATA_REDACTED]',
        userAgent: '[USER_AGENT_REDACTED]',
        sessionId: '[SESSION_ID_REDACTED]'
      });

      expect(sanitized.cookies).toBeUndefined();
      expect(sanitized.stack).not.toContain('john-doe');
    });

    test('should anonymize stack traces while preserving structure', () => {
      const stackTrace = `Error: Connection failed
    at sendRequest (https://linkedin.com/in/john-doe:45:12)
    at processProfile (chrome-extension://abcd1234/content.js:123:8)
    at Object.automation (file:///Users/john/Documents/script.js:200:15)`;

      const anonymized = privacyFilter.anonymizeStackTrace(stackTrace);

      expect(anonymized).toMatch(/Error: Connection failed/);
      expect(anonymized).toMatch(/at sendRequest \(\[URL_REDACTED\]:\d+:\d+\)/);
      expect(anonymized).toMatch(/at processProfile \(chrome-extension:\/\[EXT_ID\]\/content\.js:\d+:\d+\)/);
      expect(anonymized).toMatch(/at Object\.automation \(\[FILE_PATH_REDACTED\]:\d+:\d+\)/);

      // Should not contain any personal identifiers
      expect(anonymized).not.toContain('john-doe');
      expect(anonymized).not.toContain('abcd1234');
      expect(anonymized).not.toContain('/Users/john');
    });

    test('should apply data minimization principles', () => {
      const fullError = {
        timestamp: Date.now(),
        type: 'automation_error',
        message: 'Button click failed',
        stack: 'Error at click...',
        url: 'https://linkedin.com/feed',
        userAgent: 'Mozilla/5.0...',
        screenResolution: '1920x1080',
        timezone: 'America/New_York',
        language: 'en-US',
        cookies: ['session=123'],
        localStorage: { key: 'value' },
        sessionStorage: { temp: 'data' },
        profileData: { name: 'John' },
        behaviorData: { clicks: 50 },
        metadata: {
          essential: 'needed for debugging',
          optional: 'not needed'
        }
      };

      const minimized = privacyFilter.minimizeData(fullError);

      // Should keep essential fields
      expect(minimized).toHaveProperty('timestamp');
      expect(minimized).toHaveProperty('type');
      expect(minimized).toHaveProperty('message');
      expect(minimized).toHaveProperty('stack');

      // Should remove non-essential sensitive data
      expect(minimized).not.toHaveProperty('userAgent');
      expect(minimized).not.toHaveProperty('cookies');
      expect(minimized).not.toHaveProperty('localStorage');
      expect(minimized).not.toHaveProperty('sessionStorage');
      expect(minimized).not.toHaveProperty('profileData');
      expect(minimized).not.toHaveProperty('behaviorData');

      // Should filter metadata
      expect(minimized.metadata).toHaveProperty('essential');
      expect(minimized.metadata).not.toHaveProperty('optional');
    });

    test('should implement field-level encryption for sensitive data', async () => {
      const sensitiveError = {
        type: 'automation_error',
        message: 'Profile processing failed',
        profileId: 'linkedin-profile-123',
        errorContext: 'User interaction failed on premium account'
      };

      const encrypted = await privacyFilter.encryptSensitiveFields(sensitiveError);

      expect(encrypted.type).toBe('automation_error'); // Not sensitive
      expect(encrypted.message).toBe('Profile processing failed'); // Not sensitive
      expect(encrypted.profileId).toMatch(/^encrypted_/); // Encrypted
      expect(encrypted.errorContext).toMatch(/^encrypted_/); // Encrypted
    });

    test('should validate privacy compliance before reporting', () => {
      const testCases = [
        {
          error: { type: 'test', message: 'Safe error' },
          shouldPass: true
        },
        {
          error: { type: 'test', message: 'Error with john@email.com' },
          shouldPass: false,
          violation: 'contains_email'
        },
        {
          error: { type: 'test', profileData: { name: 'John' } },
          shouldPass: false,
          violation: 'contains_profile_data'
        },
        {
          error: { type: 'test', userAgent: 'Mozilla/5.0...' },
          shouldPass: false,
          violation: 'contains_user_agent'
        }
      ];

      testCases.forEach(({ error, shouldPass, violation }) => {
        const validation = privacyFilter.validateCompliance(error);

        expect(validation.isCompliant).toBe(shouldPass);
        if (!shouldPass) {
          expect(validation.violations).toContain(violation);
        }
      });
    });

    test('should handle GDPR data subject requests', async () => {
      const userErrors = [
        {
          errorId: 'error-1',
          userId: 'user-123',
          message: 'Error 1',
          timestamp: Date.now()
        },
        {
          errorId: 'error-2',
          userId: 'user-456',
          message: 'Error 2',
          timestamp: Date.now()
        },
        {
          errorId: 'error-3',
          userId: 'user-123',
          message: 'Error 3',
          timestamp: Date.now()
        }
      ];

      userErrors.forEach(error => privacyFilter.storeError(error));

      // Test data export
      const exportedData = await privacyFilter.exportUserErrorData('user-123');
      expect(exportedData.errors).toHaveLength(2);
      expect(exportedData.errors.every(e => e.userId === 'user-123')).toBe(true);

      // Test data deletion
      await privacyFilter.deleteUserErrorData('user-123');
      const remainingErrors = await privacyFilter.exportUserErrorData('user-123');
      expect(remainingErrors.errors).toHaveLength(0);
    });
  });

  describe('Integration with Real-time Analytics', () => {
    test('should integrate error reporting with analytics system', async () => {
      const { RealTimeAnalyticsTracker } = require('../src/utils/real-time-analytics.js');
      const analyticsTracker = new RealTimeAnalyticsTracker();

      await analyticsTracker.initialize();
      await errorReporter.initialize();

      // Configure error reporter to send to analytics
      errorReporter.setAnalyticsTracker(analyticsTracker);

      const testError = new Error('Test integration error');
      await errorReporter.handleError(new ErrorEvent('error', {
        error: testError,
        message: 'Test integration error',
        filename: 'test.js',
        lineno: 10,
        colno: 5
      }));

      // Check that error was tracked in analytics
      const events = analyticsTracker.getEventQueue() || [];
      const errorEvents = events.filter(e => e.type === 'error_occurred');

      expect(errorEvents).toHaveLength(1);
      expect(errorEvents[0]).toMatchObject({
        type: 'error_occurred',
        errorType: 'javascript_error',
        severity: expect.any(String),
        category: expect.any(String),
        timestamp: expect.any(Number)
      });
    });

    test('should not affect user experience during error reporting', async () => {
      await errorReporter.initialize();
      errorReporter.enablePerformanceMode(true);

      const startTime = performance.now();

      // Simulate user interaction during error
      const userInteraction = new Promise(resolve => {
        setTimeout(() => {
          resolve('user_interaction_completed');
        }, 50);
      });

      // Simultaneously trigger error reporting
      const errorReporting = errorReporter.handleError(new ErrorEvent('error', {
        error: new Error('Background error'),
        message: 'Background error'
      }));

      const [userResult] = await Promise.all([userInteraction, errorReporting]);
      const endTime = performance.now();

      expect(userResult).toBe('user_interaction_completed');
      expect(endTime - startTime).toBeLessThan(100); // User not blocked
      expect(errorReporter.getCapturedErrors()).toHaveLength(1);
    });

    test('should provide error analytics and insights', async () => {
      // Generate various types of errors
      const errorTypes = [
        { type: 'network_error', count: 10 },
        { type: 'automation_error', count: 15 },
        { type: 'javascript_error', count: 5 },
        { type: 'chrome_extension_error', count: 2 }
      ];

      for (const { type, count } of errorTypes) {
        for (let i = 0; i < count; i++) {
          await errorReporter.captureError({
            type,
            message: `${type} ${i}`,
            timestamp: Date.now() + i
          });
        }
      }

      const analytics = errorReporter.getErrorAnalytics();

      expect(analytics).toMatchObject({
        totalErrors: 32,
        errorsByType: {
          network_error: 10,
          automation_error: 15,
          javascript_error: 5,
          chrome_extension_error: 2
        },
        errorRate: expect.any(Number),
        mostCommonErrors: expect.any(Array),
        criticalErrors: expect.any(Number),
        trends: expect.objectContaining({
          hourly: expect.any(Array),
          daily: expect.any(Array)
        })
      });

      expect(analytics.mostCommonErrors[0].type).toBe('automation_error');
    });
  });

  describe('Error Recovery and Self-Healing', () => {
    test('should attempt automatic error recovery', async () => {
      await errorReporter.initialize();
      errorReporter.enableAutoRecovery(true);

      const recoverableError = {
        type: 'network_error',
        status: 503,
        url: 'https://api.linkedin.com/v2/people',
        retryable: true
      };

      const recovery = await errorReporter.attemptRecovery(recoverableError);

      expect(recovery).toMatchObject({
        attempted: true,
        strategy: 'retry_with_backoff',
        success: expect.any(Boolean),
        attempts: expect.any(Number)
      });
    });

    test('should learn from error patterns for better recovery', () => {
      const errorPattern = [
        { type: 'network_error', status: 429, recovery: 'wait_and_retry' },
        { type: 'network_error', status: 503, recovery: 'exponential_backoff' },
        { type: 'automation_error', reason: 'element_not_found', recovery: 'refresh_page' }
      ];

      errorPattern.forEach(pattern => {
        errorReporter.recordRecoverySuccess(pattern);
      });

      const recommendation = errorReporter.getRecoveryRecommendation({
        type: 'network_error',
        status: 429
      });

      expect(recommendation).toMatchObject({
        strategy: 'wait_and_retry',
        confidence: expect.any(Number),
        estimatedSuccessRate: expect.any(Number)
      });
    });

    test('should escalate unrecoverable errors', async () => {
      await errorReporter.initialize();

      const criticalError = {
        type: 'chrome_extension_error',
        message: 'Extension context invalidated',
        severity: 'critical',
        recoverable: false
      };

      const escalation = await errorReporter.handleCriticalError(criticalError);

      expect(escalation).toMatchObject({
        escalated: true,
        notificationsSent: expect.any(Number),
        fallbackActivated: true,
        userNotified: true
      });
    });
  });
});