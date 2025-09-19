// Real-time Analytics Tracking System Tests
// Tests for comprehensive analytics tracking with real-time capabilities

import { jest } from '@jest/globals';

// Mock modules before importing
jest.mock('../utils/storage.js');
jest.mock('../utils/encryption.js');

import {
  RealTimeAnalyticsTracker,
  AnalyticsEventBatcher,
  PerformanceMetricsCollector,
  UserEngagementTracker,
  PrivacyCompliantDataHandler,
  AnalyticsDataValidator,
  ANALYTICS_EVENT_TYPES,
  PERFORMANCE_METRICS,
  ENGAGEMENT_EVENTS,
  PRIVACY_SETTINGS
} from '../utils/real-time-analytics.js';

import { getStorageData, setStorageData } from '../utils/storage.js';
import { encryptData, decryptData } from '../utils/encryption.js';

describe('Real-time Analytics Tracking System', () => {
  let analyticsTracker;
  let eventBatcher;
  let performanceCollector;
  let engagementTracker;
  let privacyHandler;
  let dataValidator;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock storage responses
    getStorageData.mockResolvedValue({ analytics: [] });
    setStorageData.mockResolvedValue(true);

    // Mock encryption
    encryptData.mockImplementation(data => `encrypted_${JSON.stringify(data)}`);
    decryptData.mockImplementation(data => JSON.parse(data.replace('encrypted_', '')));

    // Initialize components
    analyticsTracker = new RealTimeAnalyticsTracker();
    eventBatcher = new AnalyticsEventBatcher();
    performanceCollector = new PerformanceMetricsCollector();
    engagementTracker = new UserEngagementTracker();
    privacyHandler = new PrivacyCompliantDataHandler();
    dataValidator = new AnalyticsDataValidator();
  });

  describe('RealTimeAnalyticsTracker', () => {
    describe('Real-time Event Tracking', () => {
      test('should track events in real-time', async () => {
        const event = {
          type: ANALYTICS_EVENT_TYPES.CONNECTION_SENT,
          profileId: 'test-profile-123',
          metadata: { source: 'automation' }
        };

        await analyticsTracker.trackEvent(event);

        expect(analyticsTracker.getEventQueue()).toHaveLength(1);
        expect(analyticsTracker.getEventQueue()[0]).toMatchObject({
          type: ANALYTICS_EVENT_TYPES.CONNECTION_SENT,
          profileId: 'test-profile-123',
          timestamp: expect.any(Number),
          sessionId: expect.any(String),
          eventId: expect.any(String)
        });
      });

      test('should handle high-frequency event tracking', async () => {
        const events = Array.from({ length: 100 }, (_, i) => ({
          type: ANALYTICS_EVENT_TYPES.PROFILE_VIEWED,
          profileId: `profile-${i}`,
          timestamp: Date.now() + i
        }));

        const startTime = performance.now();

        await Promise.all(events.map(event => analyticsTracker.trackEvent(event)));

        const endTime = performance.now();
        const duration = endTime - startTime;

        // Should handle 100 events in less than 100ms
        expect(duration).toBeLessThan(100);
        expect(analyticsTracker.getEventQueue()).toHaveLength(100);
      });

      test('should maintain event order in real-time tracking', async () => {
        const events = [
          { type: ANALYTICS_EVENT_TYPES.CONNECTION_SENT, timestamp: 1000 },
          { type: ANALYTICS_EVENT_TYPES.PROFILE_VIEWED, timestamp: 2000 },
          { type: ANALYTICS_EVENT_TYPES.MESSAGE_SENT, timestamp: 3000 }
        ];

        for (const event of events) {
          await analyticsTracker.trackEvent(event);
        }

        const queue = analyticsTracker.getEventQueue();
        expect(queue[0].timestamp).toBeLessThan(queue[1].timestamp);
        expect(queue[1].timestamp).toBeLessThan(queue[2].timestamp);
      });

      test('should handle concurrent event tracking', async () => {
        const concurrentEvents = Array.from({ length: 50 }, (_, i) => ({
          type: ANALYTICS_EVENT_TYPES.CONNECTION_SENT,
          profileId: `profile-${i}`
        }));

        await Promise.all(concurrentEvents.map(event => analyticsTracker.trackEvent(event)));

        expect(analyticsTracker.getEventQueue()).toHaveLength(50);

        // All events should have unique IDs
        const eventIds = analyticsTracker.getEventQueue().map(e => e.eventId);
        const uniqueIds = new Set(eventIds);
        expect(uniqueIds.size).toBe(50);
      });
    });

    describe('Session Management', () => {
      test('should generate unique session IDs', () => {
        const sessionId1 = analyticsTracker.getSessionId();

        // Create new tracker instance
        const newTracker = new RealTimeAnalyticsTracker();
        const sessionId2 = newTracker.getSessionId();

        expect(sessionId1).not.toBe(sessionId2);
        expect(sessionId1).toMatch(/^session_\d+_[a-z0-9]+$/);
      });

      test('should maintain session consistency across events', async () => {
        const events = [
          { type: ANALYTICS_EVENT_TYPES.CONNECTION_SENT },
          { type: ANALYTICS_EVENT_TYPES.PROFILE_VIEWED },
          { type: ANALYTICS_EVENT_TYPES.MESSAGE_SENT }
        ];

        for (const event of events) {
          await analyticsTracker.trackEvent(event);
        }

        const queue = analyticsTracker.getEventQueue();
        const sessionIds = queue.map(e => e.sessionId);

        // All events should have the same session ID
        expect(new Set(sessionIds).size).toBe(1);
      });

      test('should track session duration and activity', async () => {
        await analyticsTracker.startSession();

        // Simulate some activity
        await analyticsTracker.trackEvent({ type: ANALYTICS_EVENT_TYPES.CONNECTION_SENT });
        await new Promise(resolve => setTimeout(resolve, 10));
        await analyticsTracker.trackEvent({ type: ANALYTICS_EVENT_TYPES.PROFILE_VIEWED });

        const sessionInfo = analyticsTracker.getSessionInfo();

        expect(sessionInfo).toMatchObject({
          sessionId: expect.any(String),
          startTime: expect.any(Number),
          duration: expect.any(Number),
          eventCount: 2,
          isActive: true
        });
        expect(sessionInfo.duration).toBeGreaterThan(0);
      });
    });

    describe('Error Handling and Resilience', () => {
      test('should handle storage failures gracefully', async () => {
        setStorageData.mockRejectedValueOnce(new Error('Storage full'));

        const event = { type: ANALYTICS_EVENT_TYPES.CONNECTION_SENT };

        await expect(analyticsTracker.trackEvent(event)).resolves.not.toThrow();

        // Event should still be in memory queue
        expect(analyticsTracker.getEventQueue()).toHaveLength(1);
      });

      test('should recover from corrupted data', async () => {
        getStorageData.mockResolvedValueOnce({ analytics: 'corrupted-data' });

        await expect(analyticsTracker.initialize()).resolves.not.toThrow();
        expect(analyticsTracker.getEventQueue()).toHaveLength(0);
      });

      test('should handle memory limits', async () => {
        // Set low memory limit for testing
        analyticsTracker.setMemoryLimit(10);

        // Add more events than the limit
        for (let i = 0; i < 15; i++) {
          await analyticsTracker.trackEvent({
            type: ANALYTICS_EVENT_TYPES.PROFILE_VIEWED,
            profileId: `profile-${i}`
          });
        }

        // Should not exceed memory limit
        expect(analyticsTracker.getEventQueue()).toHaveLength(10);

        // Should keep the most recent events
        const queue = analyticsTracker.getEventQueue();
        expect(queue[0].profileId).toBe('profile-5');
        expect(queue[9].profileId).toBe('profile-14');
      });
    });
  });

  describe('AnalyticsEventBatcher', () => {
    describe('Event Batching Logic', () => {
      test('should batch events by size threshold', async () => {
        eventBatcher.setBatchSize(3);

        const batchPromise = new Promise(resolve => {
          eventBatcher.onBatch(resolve);
        });

        // Add events one by one
        eventBatcher.addEvent({ type: ANALYTICS_EVENT_TYPES.CONNECTION_SENT });
        eventBatcher.addEvent({ type: ANALYTICS_EVENT_TYPES.PROFILE_VIEWED });
        eventBatcher.addEvent({ type: ANALYTICS_EVENT_TYPES.MESSAGE_SENT });

        const batch = await batchPromise;
        expect(batch).toHaveLength(3);
      });

      test('should batch events by time threshold', async () => {
        eventBatcher.setBatchTimeout(50); // 50ms

        const batchPromise = new Promise(resolve => {
          eventBatcher.onBatch(resolve);
        });

        eventBatcher.addEvent({ type: ANALYTICS_EVENT_TYPES.CONNECTION_SENT });
        eventBatcher.addEvent({ type: ANALYTICS_EVENT_TYPES.PROFILE_VIEWED });

        const batch = await batchPromise;
        expect(batch).toHaveLength(2);
      });

      test('should handle mixed batching triggers', async () => {
        eventBatcher.setBatchSize(5);
        eventBatcher.setBatchTimeout(100);

        const batches = [];
        eventBatcher.onBatch(batch => batches.push(batch));

        // Add 3 events (below size threshold)
        eventBatcher.addEvent({ type: ANALYTICS_EVENT_TYPES.CONNECTION_SENT });
        eventBatcher.addEvent({ type: ANALYTICS_EVENT_TYPES.PROFILE_VIEWED });
        eventBatcher.addEvent({ type: ANALYTICS_EVENT_TYPES.MESSAGE_SENT });

        // Wait for time threshold
        await new Promise(resolve => setTimeout(resolve, 150));

        // Add 5 more events (hit size threshold)
        for (let i = 0; i < 5; i++) {
          eventBatcher.addEvent({ type: ANALYTICS_EVENT_TYPES.PROFILE_VIEWED });
        }

        await new Promise(resolve => setTimeout(resolve, 10));

        expect(batches).toHaveLength(2);
        expect(batches[0]).toHaveLength(3); // Time-triggered batch
        expect(batches[1]).toHaveLength(5); // Size-triggered batch
      });

      test('should compress batches when enabled', async () => {
        eventBatcher.enableCompression(true);

        const largeEvent = {
          type: ANALYTICS_EVENT_TYPES.CONNECTION_SENT,
          metadata: { largeData: 'x'.repeat(1000) }
        };

        eventBatcher.addEvent(largeEvent);
        eventBatcher.addEvent(largeEvent);
        eventBatcher.addEvent(largeEvent);

        const batch = await new Promise(resolve => {
          eventBatcher.onBatch(resolve);
          eventBatcher.flush();
        });

        // Batch should be compressed (test implementation would verify compression)
        expect(batch.compressed).toBe(true);
        expect(batch.originalSize).toBeGreaterThan(batch.compressedSize);
      });
    });

    describe('Batch Optimization', () => {
      test('should deduplicate similar events', async () => {
        eventBatcher.enableDeduplication(true);

        const duplicateEvent = {
          type: ANALYTICS_EVENT_TYPES.PROFILE_VIEWED,
          profileId: 'same-profile',
          metadata: { source: 'automation' }
        };

        // Add same event multiple times within deduplication window
        eventBatcher.addEvent(duplicateEvent);
        eventBatcher.addEvent(duplicateEvent);
        eventBatcher.addEvent(duplicateEvent);

        const batch = await new Promise(resolve => {
          eventBatcher.onBatch(resolve);
          eventBatcher.flush();
        });

        // Should deduplicate to single event with count
        expect(batch).toHaveLength(1);
        expect(batch[0].count).toBe(3);
      });

      test('should prioritize critical events', async () => {
        const criticalEvent = {
          type: ANALYTICS_EVENT_TYPES.CONNECTION_FAILED,
          priority: 'critical'
        };

        const normalEvent = {
          type: ANALYTICS_EVENT_TYPES.PROFILE_VIEWED,
          priority: 'normal'
        };

        eventBatcher.addEvent(normalEvent);
        eventBatcher.addEvent(criticalEvent);
        eventBatcher.addEvent(normalEvent);

        const batch = await new Promise(resolve => {
          eventBatcher.onBatch(resolve);
          eventBatcher.flush();
        });

        // Critical events should be first
        expect(batch[0].priority).toBe('critical');
      });

      test('should handle batch size limits', async () => {
        eventBatcher.setMaxBatchSize(1024); // 1KB limit

        const largeEvents = Array.from({ length: 100 }, (_, i) => ({
          type: ANALYTICS_EVENT_TYPES.CONNECTION_SENT,
          metadata: { data: 'x'.repeat(50) } // ~50 bytes each
        }));

        largeEvents.forEach(event => eventBatcher.addEvent(event));

        const batches = [];
        eventBatcher.onBatch(batch => batches.push(batch));
        eventBatcher.flush();

        await new Promise(resolve => setTimeout(resolve, 10));

        // Should create multiple batches to stay under size limit
        expect(batches.length).toBeGreaterThan(1);

        // Each batch should be under the size limit
        batches.forEach(batch => {
          const batchSize = JSON.stringify(batch).length;
          expect(batchSize).toBeLessThanOrEqual(1024);
        });
      });
    });
  });

  describe('UserEngagementTracker', () => {
    describe('Connection Attempt Tracking', () => {
      test('should track connection attempts with success rates', async () => {
        await engagementTracker.trackConnectionAttempt('profile-1', 'sent');
        await engagementTracker.trackConnectionAttempt('profile-2', 'sent');
        await engagementTracker.trackConnectionAttempt('profile-1', 'accepted');
        await engagementTracker.trackConnectionAttempt('profile-3', 'declined');

        const metrics = await engagementTracker.getConnectionMetrics();

        expect(metrics).toMatchObject({
          totalAttempts: 3,
          successful: 1,
          declined: 1,
          pending: 1,
          successRate: 33.33
        });
      });

      test('should track connection attempt timing', async () => {
        const startTime = Date.now();

        await engagementTracker.trackConnectionAttempt('profile-1', 'sent');

        // Simulate response after some time
        await new Promise(resolve => setTimeout(resolve, 100));
        await engagementTracker.trackConnectionAttempt('profile-1', 'accepted');

        const metrics = await engagementTracker.getConnectionMetrics();

        expect(metrics.averageResponseTime).toBeGreaterThan(90);
        expect(metrics.averageResponseTime).toBeLessThan(200);
      });

      test('should track connection attempts by profile characteristics', async () => {
        await engagementTracker.trackConnectionAttempt('profile-1', 'sent', {
          industry: 'Technology',
          location: 'San Francisco',
          connections: 500
        });

        await engagementTracker.trackConnectionAttempt('profile-2', 'sent', {
          industry: 'Marketing',
          location: 'New York',
          connections: 200
        });

        const insights = await engagementTracker.getConnectionInsights();

        expect(insights.byIndustry).toHaveProperty('Technology');
        expect(insights.byIndustry).toHaveProperty('Marketing');
        expect(insights.byLocation).toHaveProperty('San Francisco');
        expect(insights.byLocation).toHaveProperty('New York');
      });
    });

    describe('Time Spent Tracking', () => {
      test('should track time spent on different activities', async () => {
        await engagementTracker.startActivity('profile_browsing');
        await new Promise(resolve => setTimeout(resolve, 100));
        await engagementTracker.endActivity('profile_browsing');

        await engagementTracker.startActivity('message_writing');
        await new Promise(resolve => setTimeout(resolve, 50));
        await engagementTracker.endActivity('message_writing');

        const timeMetrics = await engagementTracker.getTimeMetrics();

        expect(timeMetrics.profile_browsing).toBeGreaterThan(90);
        expect(timeMetrics.message_writing).toBeGreaterThan(40);
        expect(timeMetrics.total).toBeGreaterThan(140);
      });

      test('should handle overlapping activities', async () => {
        await engagementTracker.startActivity('browsing');
        await new Promise(resolve => setTimeout(resolve, 50));

        await engagementTracker.startActivity('searching');
        await new Promise(resolve => setTimeout(resolve, 30));

        await engagementTracker.endActivity('browsing');
        await engagementTracker.endActivity('searching');

        const timeMetrics = await engagementTracker.getTimeMetrics();

        expect(timeMetrics.browsing).toBeGreaterThan(75);
        expect(timeMetrics.searching).toBeGreaterThan(25);
      });

      test('should track idle time detection', async () => {
        await engagementTracker.enableIdleDetection(true);

        // Simulate user activity
        await engagementTracker.recordUserActivity();
        await new Promise(resolve => setTimeout(resolve, 100));

        // Simulate idle period (no activity)
        await new Promise(resolve => setTimeout(resolve, 50));

        const idleMetrics = await engagementTracker.getIdleMetrics();

        expect(idleMetrics.activeTime).toBeGreaterThan(90);
        expect(idleMetrics.idleTime).toBeGreaterThan(40);
        expect(idleMetrics.totalTime).toBeGreaterThan(140);
      });
    });

    describe('Engagement Patterns', () => {
      test('should identify engagement patterns by time of day', async () => {
        const morningTime = new Date();
        morningTime.setHours(9, 0, 0, 0);

        const eveningTime = new Date();
        eveningTime.setHours(18, 0, 0, 0);

        // Track morning activities
        await engagementTracker.trackEngagementEvent({
          type: ENGAGEMENT_EVENTS.CONNECTION_SENT,
          timestamp: morningTime.getTime()
        });

        // Track evening activities
        await engagementTracker.trackEngagementEvent({
          type: ENGAGEMENT_EVENTS.PROFILE_VIEWED,
          timestamp: eveningTime.getTime()
        });

        const patterns = await engagementTracker.getEngagementPatterns();

        expect(patterns.byHour[9]).toBeGreaterThan(0);
        expect(patterns.byHour[18]).toBeGreaterThan(0);
        expect(patterns.peakHours).toContain(9);
      });

      test('should calculate engagement score based on multiple factors', async () => {
        // Track various engagement activities
        await engagementTracker.trackConnectionAttempt('profile-1', 'sent');
        await engagementTracker.trackConnectionAttempt('profile-1', 'accepted');
        await engagementTracker.recordUserActivity();
        await engagementTracker.startActivity('profile_browsing');
        await new Promise(resolve => setTimeout(resolve, 100));
        await engagementTracker.endActivity('profile_browsing');

        const score = await engagementTracker.calculateEngagementScore();

        expect(score).toBeGreaterThan(0);
        expect(score).toBeLessThanOrEqual(100);
        expect(typeof score).toBe('number');
      });
    });
  });

  describe('PerformanceMetricsCollector', () => {
    describe('Load Time Tracking', () => {
      test('should measure page load times', async () => {
        // Mock performance timing
        global.performance = {
          timing: {
            navigationStart: 1000,
            loadEventEnd: 2500
          },
          now: () => 1500
        };

        await performanceCollector.measurePageLoad('linkedin.com/search');
        const metrics = await performanceCollector.getLoadTimeMetrics();

        expect(metrics.averageLoadTime).toBe(1500);
        expect(metrics.loadTimes).toHaveLength(1);
        expect(metrics.loadTimes[0]).toMatchObject({
          url: 'linkedin.com/search',
          loadTime: 1500,
          timestamp: expect.any(Number)
        });
      });

      test('should track resource loading performance', async () => {
        const mockResources = [
          {
            name: 'https://cdn.linkedin.com/script.js',
            duration: 200,
            transferSize: 50000
          },
          {
            name: 'https://cdn.linkedin.com/style.css',
            duration: 150,
            transferSize: 25000
          }
        ];

        global.performance.getEntriesByType = jest.fn().mockReturnValue(mockResources);

        await performanceCollector.measureResourceLoading();
        const metrics = await performanceCollector.getResourceMetrics();

        expect(metrics.totalResources).toBe(2);
        expect(metrics.averageDuration).toBe(175);
        expect(metrics.totalTransferSize).toBe(75000);
      });

      test('should identify performance bottlenecks', async () => {
        const slowResources = [
          { name: 'slow-script.js', duration: 2000 },
          { name: 'normal-script.js', duration: 100 },
          { name: 'another-slow.js', duration: 1500 }
        ];

        global.performance.getEntriesByType = jest.fn().mockReturnValue(slowResources);

        await performanceCollector.measureResourceLoading();
        const bottlenecks = await performanceCollector.identifyBottlenecks();

        expect(bottlenecks.slowResources).toHaveLength(2);
        expect(bottlenecks.slowResources[0].name).toBe('slow-script.js');
        expect(bottlenecks.slowResources[1].name).toBe('another-slow.js');
      });
    });

    describe('Memory Usage Tracking', () => {
      test('should track memory usage patterns', async () => {
        // Mock memory API
        global.performance.memory = {
          usedJSHeapSize: 10000000,
          totalJSHeapSize: 15000000,
          jsHeapSizeLimit: 100000000
        };

        await performanceCollector.measureMemoryUsage();
        const metrics = await performanceCollector.getMemoryMetrics();

        expect(metrics.currentUsage).toBe(10000000);
        expect(metrics.memoryUtilization).toBe(66.67);
        expect(metrics.maxUsage).toBe(10000000);
      });

      test('should detect memory leaks', async () => {
        // Simulate increasing memory usage
        const memoryReadings = [
          { usedJSHeapSize: 10000000, timestamp: 1000 },
          { usedJSHeapSize: 12000000, timestamp: 2000 },
          { usedJSHeapSize: 15000000, timestamp: 3000 },
          { usedJSHeapSize: 20000000, timestamp: 4000 }
        ];

        for (const reading of memoryReadings) {
          global.performance.memory = reading;
          await performanceCollector.measureMemoryUsage();
        }

        const leakDetection = await performanceCollector.detectMemoryLeaks();

        expect(leakDetection.suspectedLeak).toBe(true);
        expect(leakDetection.growthRate).toBeGreaterThan(0);
        expect(leakDetection.recommendations).toContain('Monitor memory usage');
      });

      test('should track garbage collection performance', async () => {
        // Mock performance observer for GC events
        const gcEvents = [
          { duration: 5, startTime: 1000 },
          { duration: 8, startTime: 2000 },
          { duration: 12, startTime: 3000 }
        ];

        performanceCollector.mockGCEvents(gcEvents);
        await performanceCollector.measureGarbageCollection();

        const gcMetrics = await performanceCollector.getGCMetrics();

        expect(gcMetrics.totalGCTime).toBe(25);
        expect(gcMetrics.averageGCDuration).toBe(8.33);
        expect(gcMetrics.gcFrequency).toBeGreaterThan(0);
      });
    });

    describe('Error Rate Tracking', () => {
      test('should track JavaScript errors', async () => {
        const error1 = new Error('Connection failed');
        const error2 = new Error('Profile not found');

        await performanceCollector.trackError(error1, 'connection');
        await performanceCollector.trackError(error2, 'profile-loading');

        const errorMetrics = await performanceCollector.getErrorMetrics();

        expect(errorMetrics.totalErrors).toBe(2);
        expect(errorMetrics.errorsByCategory.connection).toBe(1);
        expect(errorMetrics.errorsByCategory['profile-loading']).toBe(1);
        expect(errorMetrics.errorRate).toBeGreaterThan(0);
      });

      test('should categorize errors by severity', async () => {
        await performanceCollector.trackError(new Error('Minor issue'), 'warning');
        await performanceCollector.trackError(new Error('Major failure'), 'critical');
        await performanceCollector.trackError(new Error('Info message'), 'info');

        const errorMetrics = await performanceCollector.getErrorMetrics();

        expect(errorMetrics.bySeverity.warning).toBe(1);
        expect(errorMetrics.bySeverity.critical).toBe(1);
        expect(errorMetrics.bySeverity.info).toBe(1);
      });

      test('should track error trends over time', async () => {
        const baseTime = Date.now();

        await performanceCollector.trackError(new Error('Error 1'), 'test', baseTime);
        await performanceCollector.trackError(new Error('Error 2'), 'test', baseTime + 1000);
        await performanceCollector.trackError(new Error('Error 3'), 'test', baseTime + 2000);

        const trends = await performanceCollector.getErrorTrends();

        expect(trends.hourlyTrends).toBeDefined();
        expect(trends.errorGrowthRate).toBeDefined();
        expect(trends.mostCommonErrors).toBeDefined();
      });
    });
  });

  describe('PrivacyCompliantDataHandler', () => {
    describe('Data Privacy Controls', () => {
      test('should respect user privacy settings', async () => {
        const privacySettings = {
          collectPersonalData: false,
          collectBehaviorData: true,
          dataRetentionDays: 30
        };

        await privacyHandler.setPrivacySettings(privacySettings);

        const event = {
          type: ANALYTICS_EVENT_TYPES.CONNECTION_SENT,
          profileId: 'user-123',
          personalInfo: { name: 'John Doe', email: 'john@example.com' },
          behaviorData: { clickCount: 5, timeSpent: 120 }
        };

        const sanitizedEvent = await privacyHandler.sanitizeEvent(event);

        expect(sanitizedEvent.personalInfo).toBeUndefined();
        expect(sanitizedEvent.behaviorData).toBeDefined();
        expect(sanitizedEvent.profileId).toBe('[REDACTED]');
      });

      test('should anonymize sensitive data', async () => {
        const sensitiveEvent = {
          type: ANALYTICS_EVENT_TYPES.MESSAGE_SENT,
          profileId: 'sensitive-profile-123',
          messageContent: 'Hi John, I saw your profile...',
          profileUrl: 'https://linkedin.com/in/john-doe',
          userAgent: 'Mozilla/5.0...'
        };

        const anonymizedEvent = await privacyHandler.anonymizeEvent(sensitiveEvent);

        expect(anonymizedEvent.profileId).toMatch(/^anon_[a-f0-9]+$/);
        expect(anonymizedEvent.messageContent).toBeUndefined();
        expect(anonymizedEvent.profileUrl).toBeUndefined();
        expect(anonymizedEvent.userAgent).toBeUndefined();
      });

      test('should implement data retention policies', async () => {
        await privacyHandler.setRetentionPolicy(7); // 7 days

        const oldEvent = {
          timestamp: Date.now() - 10 * 24 * 60 * 60 * 1000, // 10 days ago
          type: ANALYTICS_EVENT_TYPES.CONNECTION_SENT
        };

        const recentEvent = {
          timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
          type: ANALYTICS_EVENT_TYPES.CONNECTION_SENT
        };

        await privacyHandler.storeEvent(oldEvent);
        await privacyHandler.storeEvent(recentEvent);
        await privacyHandler.enforceRetentionPolicy();

        const storedEvents = await privacyHandler.getStoredEvents();

        expect(storedEvents).toHaveLength(1);
        expect(storedEvents[0].timestamp).toBe(recentEvent.timestamp);
      });

      test('should handle GDPR compliance requirements', async () => {
        const userData = {
          profileId: 'user-123',
          personalData: { name: 'John Doe', location: 'EU' }
        };

        // User requests data export
        const exportedData = await privacyHandler.exportUserData('user-123');
        expect(exportedData).toBeDefined();
        expect(exportedData.events).toBeDefined();
        expect(exportedData.metadata.exportDate).toBeDefined();

        // User requests data deletion
        await privacyHandler.deleteUserData('user-123');

        const remainingData = await privacyHandler.exportUserData('user-123');
        expect(remainingData.events).toHaveLength(0);
      });
    });

    describe('Data Encryption and Security', () => {
      test('should encrypt sensitive data at rest', async () => {
        const sensitiveEvent = {
          type: ANALYTICS_EVENT_TYPES.CONNECTION_SENT,
          profileId: 'profile-123',
          metadata: { sensitiveInfo: 'confidential data' }
        };

        await privacyHandler.storeSecureEvent(sensitiveEvent);

        expect(encryptData).toHaveBeenCalledWith(
          expect.objectContaining({
            type: ANALYTICS_EVENT_TYPES.CONNECTION_SENT,
            profileId: 'profile-123'
          })
        );
      });

      test('should implement field-level encryption', async () => {
        const event = {
          type: ANALYTICS_EVENT_TYPES.MESSAGE_SENT,
          profileId: 'profile-123', // Should be encrypted
          timestamp: Date.now(), // Should not be encrypted
          messageLength: 150 // Should not be encrypted
        };

        const encryptedEvent = await privacyHandler.encryptSensitiveFields(event);

        expect(encryptedEvent.profileId).toMatch(/^encrypted_/);
        expect(encryptedEvent.timestamp).toBe(event.timestamp);
        expect(encryptedEvent.messageLength).toBe(event.messageLength);
      });

      test('should validate data integrity', async () => {
        const event = {
          type: ANALYTICS_EVENT_TYPES.CONNECTION_SENT,
          profileId: 'profile-123',
          timestamp: Date.now()
        };

        const eventWithChecksum = await privacyHandler.addIntegrityCheck(event);

        expect(eventWithChecksum.checksum).toBeDefined();
        expect(eventWithChecksum.checksum).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hash

        // Verify integrity
        const isValid = await privacyHandler.verifyIntegrity(eventWithChecksum);
        expect(isValid).toBe(true);

        // Test with tampered data
        eventWithChecksum.profileId = 'tampered-profile';
        const isValidAfterTampering = await privacyHandler.verifyIntegrity(eventWithChecksum);
        expect(isValidAfterTampering).toBe(false);
      });
    });
  });

  describe('AnalyticsDataValidator', () => {
    describe('Data Validation Rules', () => {
      test('should validate event structure', () => {
        const validEvent = {
          type: ANALYTICS_EVENT_TYPES.CONNECTION_SENT,
          timestamp: Date.now(),
          sessionId: 'session-123',
          eventId: 'event-456'
        };

        const invalidEvent = {
          type: 'invalid-type',
          timestamp: 'invalid-timestamp'
        };

        expect(dataValidator.validateEvent(validEvent)).toBe(true);
        expect(dataValidator.validateEvent(invalidEvent)).toBe(false);
      });

      test('should validate required fields', () => {
        const eventMissingRequired = {
          type: ANALYTICS_EVENT_TYPES.CONNECTION_SENT
          // Missing timestamp, sessionId, eventId
        };

        const validation = dataValidator.validateEvent(eventMissingRequired, { detailed: true });

        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Missing required field: timestamp');
        expect(validation.errors).toContain('Missing required field: sessionId');
        expect(validation.errors).toContain('Missing required field: eventId');
      });

      test('should validate data types', () => {
        const eventWithWrongTypes = {
          type: ANALYTICS_EVENT_TYPES.CONNECTION_SENT,
          timestamp: 'not-a-number',
          sessionId: 123, // Should be string
          eventId: null,
          metadata: 'should-be-object'
        };

        const validation = dataValidator.validateEvent(eventWithWrongTypes, { detailed: true });

        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('timestamp must be a number');
        expect(validation.errors).toContain('sessionId must be a string');
        expect(validation.errors).toContain('eventId cannot be null');
        expect(validation.errors).toContain('metadata must be an object');
      });

      test('should validate value ranges', () => {
        const eventWithInvalidRanges = {
          type: ANALYTICS_EVENT_TYPES.CONNECTION_SENT,
          timestamp: -1, // Invalid timestamp
          sessionId: 'session-123',
          eventId: 'event-456',
          metadata: {
            duration: -100, // Negative duration
            retryCount: 1000 // Too many retries
          }
        };

        const validation = dataValidator.validateEvent(eventWithInvalidRanges, { detailed: true });

        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('timestamp must be positive');
        expect(validation.errors).toContain('duration cannot be negative');
        expect(validation.errors).toContain('retryCount exceeds maximum allowed value');
      });
    });

    describe('Data Consistency Checks', () => {
      test('should detect duplicate events', () => {
        const event1 = {
          type: ANALYTICS_EVENT_TYPES.CONNECTION_SENT,
          timestamp: 1000,
          sessionId: 'session-123',
          eventId: 'event-456',
          profileId: 'profile-789'
        };

        const event2 = { ...event1 }; // Exact duplicate

        dataValidator.addEvent(event1);
        const isDuplicate = dataValidator.isDuplicate(event2);

        expect(isDuplicate).toBe(true);
      });

      test('should validate event sequence logic', () => {
        const events = [
          {
            type: ANALYTICS_EVENT_TYPES.CONNECTION_SENT,
            timestamp: 1000,
            profileId: 'profile-123'
          },
          {
            type: ANALYTICS_EVENT_TYPES.CONNECTION_ACCEPTED,
            timestamp: 500, // Before connection sent
            profileId: 'profile-123'
          }
        ];

        const validation = dataValidator.validateEventSequence(events);

        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Connection accepted before connection sent');
      });

      test('should validate cross-event relationships', () => {
        const events = [
          {
            type: ANALYTICS_EVENT_TYPES.MESSAGE_SENT,
            timestamp: 1000,
            profileId: 'profile-123'
          },
          {
            type: ANALYTICS_EVENT_TYPES.MESSAGE_RECEIVED,
            timestamp: 2000,
            profileId: 'profile-456' // Different profile
          }
        ];

        const validation = dataValidator.validateRelationships(events);

        expect(validation.warnings).toContain('Message response from different profile');
      });
    });

    describe('Data Quality Metrics', () => {
      test('should calculate data completeness score', () => {
        const events = [
          {
            type: ANALYTICS_EVENT_TYPES.CONNECTION_SENT,
            timestamp: 1000,
            sessionId: 'session-123',
            eventId: 'event-1',
            profileId: 'profile-123'
            // All required fields present - 100% complete
          },
          {
            type: ANALYTICS_EVENT_TYPES.CONNECTION_SENT,
            timestamp: 2000,
            sessionId: 'session-123',
            eventId: 'event-2'
            // Missing profileId - 80% complete
          }
        ];

        const qualityScore = dataValidator.calculateCompletenessScore(events);

        expect(qualityScore).toBe(90); // Average of 100% and 80%
      });

      test('should identify data quality issues', () => {
        const events = [
          {
            type: ANALYTICS_EVENT_TYPES.CONNECTION_SENT,
            timestamp: Date.now() + 10000, // Future timestamp
            sessionId: 'session-123',
            eventId: 'event-1'
          },
          {
            type: ANALYTICS_EVENT_TYPES.CONNECTION_SENT,
            timestamp: 'invalid',
            sessionId: 'session-123',
            eventId: 'event-1' // Duplicate event ID
          }
        ];

        const qualityReport = dataValidator.generateQualityReport(events);

        expect(qualityReport.issues).toHaveLength(3);
        expect(qualityReport.issues).toContainEqual({
          type: 'future_timestamp',
          severity: 'warning',
          eventId: 'event-1'
        });
        expect(qualityReport.issues).toContainEqual({
          type: 'invalid_timestamp',
          severity: 'error',
          eventId: 'event-1'
        });
        expect(qualityReport.issues).toContainEqual({
          type: 'duplicate_event_id',
          severity: 'error',
          eventId: 'event-1'
        });
      });

      test('should track data quality trends', () => {
        // Add events over time with varying quality
        const timeWindows = [
          {
            time: 1000,
            events: [
              /* high quality events */
            ]
          },
          {
            time: 2000,
            events: [
              /* medium quality events */
            ]
          },
          {
            time: 3000,
            events: [
              /* low quality events */
            ]
          }
        ];

        timeWindows.forEach(window => {
          window.events.forEach(event =>
            dataValidator.addEvent({ ...event, timestamp: window.time })
          );
        });

        const qualityTrends = dataValidator.getQualityTrends();

        expect(qualityTrends.timeline).toHaveLength(3);
        expect(qualityTrends.overallTrend).toBeDefined();
        expect(qualityTrends.recommendations).toBeDefined();
      });
    });
  });

  describe('Integration Tests', () => {
    test('should handle end-to-end analytics tracking flow', async () => {
      // Initialize all components
      await analyticsTracker.initialize();

      // Track a connection attempt
      const connectionEvent = {
        type: ANALYTICS_EVENT_TYPES.CONNECTION_SENT,
        profileId: 'profile-123',
        metadata: {
          templateId: 'template-1',
          source: 'automation'
        }
      };

      await analyticsTracker.trackEvent(connectionEvent);

      // Validate the event
      const events = analyticsTracker.getEventQueue();
      expect(dataValidator.validateEvent(events[0])).toBe(true);

      // Check privacy compliance
      const sanitizedEvent = await privacyHandler.sanitizeEvent(events[0]);
      expect(sanitizedEvent).toBeDefined();

      // Batch and process
      eventBatcher.addEvent(sanitizedEvent);
      await eventBatcher.flush();

      // Collect performance metrics
      await performanceCollector.measureMemoryUsage();
      const performanceMetrics = await performanceCollector.getMemoryMetrics();
      expect(performanceMetrics).toBeDefined();

      // Track engagement
      await engagementTracker.trackConnectionAttempt('profile-123', 'sent');
      const engagementMetrics = await engagementTracker.getConnectionMetrics();
      expect(engagementMetrics.totalAttempts).toBe(1);
    });

    test('should handle system under stress', async () => {
      // Simulate high load
      const events = Array.from({ length: 1000 }, (_, i) => ({
        type: ANALYTICS_EVENT_TYPES.PROFILE_VIEWED,
        profileId: `profile-${i}`,
        timestamp: Date.now() + i
      }));

      const startTime = performance.now();

      await Promise.all(events.map(event => analyticsTracker.trackEvent(event)));

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should handle 1000 events efficiently
      expect(duration).toBeLessThan(1000); // Less than 1 second
      expect(analyticsTracker.getEventQueue().length).toBeLessThanOrEqual(1000);
    });

    test('should maintain data integrity across components', async () => {
      const originalEvent = {
        type: ANALYTICS_EVENT_TYPES.CONNECTION_SENT,
        profileId: 'profile-123',
        timestamp: Date.now()
      };

      // Track event
      await analyticsTracker.trackEvent(originalEvent);

      // Get from queue
      const queuedEvent = analyticsTracker.getEventQueue()[0];

      // Validate
      expect(dataValidator.validateEvent(queuedEvent)).toBe(true);

      // Sanitize for privacy
      const sanitizedEvent = await privacyHandler.sanitizeEvent(queuedEvent);

      // Validate again after sanitization
      expect(dataValidator.validateEvent(sanitizedEvent)).toBe(true);

      // Ensure core data is preserved
      expect(sanitizedEvent.type).toBe(originalEvent.type);
      expect(sanitizedEvent.timestamp).toBe(queuedEvent.timestamp);
      expect(sanitizedEvent.sessionId).toBe(queuedEvent.sessionId);
    });
  });
});
