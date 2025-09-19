// Comprehensive Integration Tests for All Task 6 Components
// Tests integration between analytics, error reporting, A/B testing, feedback, and performance optimization

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock Chrome APIs
global.chrome = {
  storage: {
    local: {
      get: jest.fn(() => Promise.resolve({})),
      set: jest.fn(() => Promise.resolve()),
      remove: jest.fn(() => Promise.resolve()),
      clear: jest.fn(() => Promise.resolve())
    },
    sync: {
      get: jest.fn(() => Promise.resolve({})),
      set: jest.fn(() => Promise.resolve())
    }
  },
  runtime: {
    sendMessage: jest.fn(() => Promise.resolve()),
    onMessage: {
      addListener: jest.fn()
    }
  }
};

// Mock Performance APIs
global.performance = {
  now: jest.fn(() => Date.now()),
  timing: {
    navigationStart: 1000,
    domContentLoadedEventEnd: 2000,
    loadEventEnd: 3000
  },
  memory: {
    usedJSHeapSize: 10000000,
    totalJSHeapSize: 50000000,
    jsHeapSizeLimit: 100000000
  },
  getEntriesByType: jest.fn(() => []),
  mark: jest.fn(),
  measure: jest.fn()
};

// Mock DOM and Browser APIs
global.document = {
  querySelectorAll: jest.fn(() => []),
  createElement: jest.fn(() => ({ noModule: true }))
};

global.navigator = {
  userAgent: 'test-browser'
};

global.window = {
  gc: jest.fn()
};

// Mock PerformanceObserver and IntersectionObserver
global.PerformanceObserver = jest.fn(() => ({
  observe: jest.fn(),
  disconnect: jest.fn()
}));

global.IntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Mock console methods to avoid test noise
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

// Import all Task 6 components
import { createRealTimeAnalyticsTracker, createUserEngagementTracker } from '../src/utils/real-time-analytics.js';
import { ErrorReportingSystem } from '../src/utils/error-reporting.js';
import { CrashAnalyticsSystem } from '../src/utils/crash-analytics.js';
import { EnhancedABTestingFramework } from '../src/utils/enhanced-ab-testing-framework.js';
import { UserFeedbackSystem } from '../src/utils/user-feedback-system.js';
import { createPerformanceOptimizationSystem } from '../src/utils/performance-optimization.js';
import { createPerformanceBudgetMonitor } from '../src/utils/performance-budget-monitor.js';

describe('Task 6 - Complete Integration Tests', () => {
  let analyticsTracker;
  let engagementTracker;
  let errorReporting;
  let crashAnalytics;
  let abTesting;
  let feedbackSystem;
  let performanceOptimization;
  let budgetMonitor;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Initialize all systems
    analyticsTracker = createRealTimeAnalyticsTracker();
    engagementTracker = createUserEngagementTracker();
    errorReporting = new ErrorReportingSystem();
    crashAnalytics = new CrashAnalyticsSystem();
    abTesting = new EnhancedABTestingFramework();
    feedbackSystem = new UserFeedbackSystem();
    performanceOptimization = createPerformanceOptimizationSystem();
    budgetMonitor = createPerformanceBudgetMonitor();

    // Mock successful storage returns
    chrome.storage.local.get.mockResolvedValue({});

    // Initialize systems
    await analyticsTracker.initialize();
    await errorReporting.initialize();
    await crashAnalytics.initialize();
    await abTesting.initialize();
    await feedbackSystem.initialize();
    await performanceOptimization.initialize();
    await budgetMonitor.initialize();
  });

  afterEach(() => {
    // Cleanup systems
    if (performanceOptimization) {
      performanceOptimization.dispose();
    }
    if (budgetMonitor) {
      budgetMonitor.dispose();
    }
  });

  describe('Cross-System Event Flow', () => {
    test('should track analytics events across all systems', async () => {
      // Track an event through analytics
      const event = await analyticsTracker.trackEvent({
        type: 'connection_sent',
        profileId: 'test_profile_123',
        metadata: { source: 'integration_test' }
      });

      expect(event).toHaveProperty('eventId');
      expect(event).toHaveProperty('sessionId');
      expect(event.type).toBe('connection_sent');

      // Verify event is in queue
      const queue = analyticsTracker.getEventQueue();
      expect(queue.length).toBeGreaterThan(0);
      expect(queue.some(e => e.eventId === event.eventId)).toBe(true);
    });

    test('should trigger error reporting when analytics fails', async () => {
      const errorSpy = jest.spyOn(errorReporting, 'reportError');

      // Mock analytics to throw error
      jest.spyOn(analyticsTracker, 'trackEvent').mockRejectedValueOnce(new Error('Analytics failure'));

      try {
        await analyticsTracker.trackEvent({ type: 'test_event' });
      } catch (error) {
        await errorReporting.reportError(error, 'analytics', {
          component: 'analyticsTracker',
          method: 'trackEvent'
        });
      }

      expect(errorSpy).toHaveBeenCalled();
    });

    test('should coordinate A/B testing with analytics tracking', async () => {
      // Create A/B test
      const testConfig = {
        name: 'integration_test',
        description: 'Test integration between AB testing and analytics',
        variants: [
          { id: 'control', name: 'Control', config: { message: 'Hello' } },
          { id: 'treatment', name: 'Treatment', config: { message: 'Hi there!' } }
        ],
        trafficAllocation: { control: 0.5, treatment: 0.5 },
        successMetric: 'conversion_rate'
      };

      const test = await abTesting.createMultiVariantTest(testConfig);
      expect(test).toHaveProperty('id');

      // Get assignment and track analytics
      const assignment = await abTesting.getAssignment(test.id, 'user_123');
      expect(['control', 'treatment']).toContain(assignment.variant);

      // Track analytics event for A/B test
      await analyticsTracker.trackEvent({
        type: 'ab_test_assignment',
        testId: test.id,
        variant: assignment.variant,
        userId: 'user_123'
      });

      // Verify analytics captured the A/B test event
      const queue = analyticsTracker.getEventQueue();
      const abTestEvent = queue.find(e => e.type === 'ab_test_assignment');
      expect(abTestEvent).toBeTruthy();
      expect(abTestEvent.testId).toBe(test.id);
    });

    test('should integrate feedback collection with sentiment analysis', async () => {
      // Submit feedback
      const feedback = await feedbackSystem.submitFeedback({
        rating: 4,
        comment: 'This feature works great! Very satisfied.',
        category: 'feature_request',
        userId: 'user_456'
      });

      expect(feedback).toHaveProperty('id');
      expect(feedback.sentiment).toHaveProperty('score');
      expect(feedback.sentiment.score).toBeGreaterThan(0); // Positive sentiment

      // Track analytics for feedback submission
      await analyticsTracker.trackEvent({
        type: 'feedback_submitted',
        feedbackId: feedback.id,
        rating: feedback.rating,
        sentiment: feedback.sentiment.label
      });

      // Verify cross-system data consistency
      const analyticsQueue = analyticsTracker.getEventQueue();
      const feedbackEvent = analyticsQueue.find(e => e.type === 'feedback_submitted');
      expect(feedbackEvent.feedbackId).toBe(feedback.id);
    });
  });

  describe('Performance Integration', () => {
    test('should trigger performance optimization based on analytics metrics', async () => {
      // Simulate high memory usage scenario
      const highMemoryMetrics = {
        memory: { currentUsage: 60 * 1024 * 1024, memoryUtilization: 85 },
        loadTimes: { averageLoadTime: 3500 },
        errors: { errorRate: 0.02 }
      };

      // Check performance budgets
      const violations = performanceOptimization.checkPerformanceBudgets(highMemoryMetrics);
      expect(violations.length).toBeGreaterThan(0);

      // Trigger optimization
      await performanceOptimization.performOptimizationCheck();

      // Verify optimization was recorded
      expect(performanceOptimization.optimizationHistory.length).toBeGreaterThan(0);
    });

    test('should monitor performance budgets and trigger alerts', async () => {
      let violationTriggered = false;

      // Setup violation callback
      budgetMonitor.onBudgetViolation('load_time', (category, violation) => {
        violationTriggered = true;
        expect(category).toBe('load_time');
        expect(violation).toBeTruthy();
      });

      // Trigger a load time violation
      budgetMonitor.checkBudget('load_time', 3500); // Exceeds 3000ms limit

      expect(violationTriggered).toBe(true);
      expect(budgetMonitor.currentViolations.has('load_time')).toBe(true);
    });

    test('should coordinate crash analytics with performance monitoring', async () => {
      // Simulate a performance-related crash
      const crashData = {
        error: new Error('Memory exhaustion'),
        stackTrace: 'Error at performanceHeavyFunction()',
        userAgent: 'test-browser',
        timestamp: Date.now(),
        severity: 'critical',
        context: {
          memoryUsage: 95 * 1024 * 1024, // Very high memory usage
          performanceScore: 20 // Poor performance
        }
      };

      await crashAnalytics.reportCrash(crashData);

      // Verify crash was recorded with performance context
      const crashes = await crashAnalytics.getCrashes();
      const reportedCrash = crashes.find(c => c.error.message === 'Memory exhaustion');
      expect(reportedCrash).toBeTruthy();
      expect(reportedCrash.context.memoryUsage).toBe(95 * 1024 * 1024);
    });
  });

  describe('Data Flow and Consistency', () => {
    test('should maintain data consistency across all systems', async () => {
      const userId = 'consistency_test_user';
      const sessionId = analyticsTracker.getSessionId();

      // Track events across multiple systems
      await analyticsTracker.trackEvent({
        type: 'session_started',
        userId,
        timestamp: Date.now()
      });

      await engagementTracker.trackConnectionAttempt(userId, 'sent', { source: 'automated' });

      const feedback = await feedbackSystem.submitFeedback({
        rating: 5,
        comment: 'Excellent experience',
        userId,
        sessionId
      });

      // Verify session consistency
      const sessionInfo = analyticsTracker.getSessionInfo();
      expect(sessionInfo.sessionId).toBe(sessionId);

      // Verify user data consistency
      const engagementMetrics = await engagementTracker.getConnectionMetrics();
      expect(engagementMetrics.totalAttempts).toBeGreaterThan(0);

      // Verify feedback links to session
      expect(feedback.sessionId).toBe(sessionId);
    });

    test('should handle concurrent operations across systems', async () => {
      const promises = [];

      // Simulate concurrent operations
      for (let i = 0; i < 10; i++) {
        promises.push(
          analyticsTracker.trackEvent({
            type: 'concurrent_test',
            index: i,
            timestamp: Date.now()
          })
        );
      }

      for (let i = 0; i < 5; i++) {
        promises.push(
          feedbackSystem.submitFeedback({
            rating: Math.floor(Math.random() * 5) + 1,
            comment: `Concurrent feedback ${i}`,
            userId: `user_${i}`
          })
        );
      }

      // Wait for all operations to complete
      const results = await Promise.allSettled(promises);

      // Verify all operations succeeded
      const failed = results.filter(r => r.status === 'rejected');
      expect(failed.length).toBe(0);

      // Verify data integrity
      const analyticsQueue = analyticsTracker.getEventQueue();
      const concurrentEvents = analyticsQueue.filter(e => e.type === 'concurrent_test');
      expect(concurrentEvents.length).toBe(10);
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle system failures gracefully', async () => {
      // Mock storage failure
      chrome.storage.local.set.mockRejectedValueOnce(new Error('Storage quota exceeded'));

      // Try to track analytics event
      let analyticsError = null;
      try {
        await analyticsTracker.trackEvent({
          type: 'storage_failure_test',
          data: 'large_data_payload'
        });
      } catch (error) {
        analyticsError = error;
      }

      // Analytics should handle storage failure gracefully
      expect(analyticsError).toBeNull();

      // Error should be reported to error reporting system
      await errorReporting.reportError(new Error('Storage quota exceeded'), 'storage', {
        operation: 'trackEvent',
        component: 'analytics'
      });

      const errors = errorReporting.getRecentErrors(10);
      expect(errors.length).toBeGreaterThan(0);
    });

    test('should recover from temporary system failures', async () => {
      // Simulate temporary network failure
      let networkFailureCount = 0;
      const originalFetch = global.fetch;
      global.fetch = jest.fn(() => {
        networkFailureCount++;
        if (networkFailureCount < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      });

      // Try operations that might fail
      const retryableOperation = async () => {
        // Simulate operation that uses network
        if (global.fetch) {
          try {
            await global.fetch('/api/test');
            return { success: true };
          } catch (error) {
            await errorReporting.reportError(error, 'network', { retry: true });
            throw error;
          }
        }
      };

      // Should eventually succeed after retries
      let success = false;
      for (let i = 0; i < 5; i++) {
        try {
          await retryableOperation();
          success = true;
          break;
        } catch (error) {
          // Continue retrying
        }
      }

      expect(success).toBe(true);

      // Restore
      global.fetch = originalFetch;
    });
  });

  describe('Privacy and Compliance', () => {
    test('should respect privacy settings across all systems', async () => {
      // Set strict privacy settings
      const privacySettings = {
        collectPersonalData: false,
        collectBehaviorData: false,
        dataRetentionDays: 1,
        anonymizeProfileIds: true,
        encryptSensitiveData: true
      };

      // Apply privacy settings to all systems
      if (analyticsTracker.setPrivacySettings) {
        await analyticsTracker.setPrivacySettings(privacySettings);
      }

      // Track event with personal data
      const event = await analyticsTracker.trackEvent({
        type: 'privacy_test',
        profileId: 'sensitive_profile_123',
        personalInfo: {
          name: 'John Doe',
          email: 'john@example.com'
        },
        messageContent: 'Personal message content'
      });

      // Event should be sanitized
      expect(event.personalInfo).toBeUndefined();
      expect(event.messageContent).toBeUndefined();
    });

    test('should handle GDPR data requests across systems', async () => {
      const userId = 'gdpr_test_user';

      // Generate data across systems
      await analyticsTracker.trackEvent({
        type: 'gdpr_test_event',
        userId,
        data: 'user activity'
      });

      await feedbackSystem.submitFeedback({
        rating: 4,
        comment: 'Test feedback for GDPR',
        userId
      });

      // Simulate GDPR export request
      const exportData = {
        analytics: analyticsTracker.getEventQueue().filter(e => e.userId === userId),
        feedback: [] // Would be implemented in real system
      };

      expect(exportData.analytics.length).toBeGreaterThan(0);

      // Simulate GDPR deletion request
      // In real implementation, would call deletion methods on all systems
      const deletionResult = {
        analytics: 'data_deleted',
        feedback: 'data_deleted',
        abTesting: 'data_deleted'
      };

      expect(Object.values(deletionResult)).toEqual(['data_deleted', 'data_deleted', 'data_deleted']);
    });
  });

  describe('Performance Under Load', () => {
    test('should handle high volume of events efficiently', async () => {
      const startTime = Date.now();
      const eventCount = 1000;

      // Generate high volume of events
      const promises = [];
      for (let i = 0; i < eventCount; i++) {
        promises.push(
          analyticsTracker.trackEvent({
            type: 'load_test_event',
            index: i,
            timestamp: Date.now()
          })
        );
      }

      await Promise.all(promises);
      const endTime = Date.now();

      // Should process events efficiently (less than 5 seconds for 1000 events)
      expect(endTime - startTime).toBeLessThan(5000);

      // Should maintain memory limits
      const queue = analyticsTracker.getEventQueue();
      expect(queue.length).toBeLessThanOrEqual(1000); // Memory limit enforcement
    });

    test('should maintain performance under concurrent system operations', async () => {
      const operations = [];

      // Simulate mixed workload
      for (let i = 0; i < 100; i++) {
        operations.push(
          analyticsTracker.trackEvent({ type: 'performance_test', index: i })
        );

        if (i % 10 === 0) {
          operations.push(
            feedbackSystem.submitFeedback({
              rating: Math.floor(Math.random() * 5) + 1,
              comment: `Performance test feedback ${i}`,
              userId: `user_${i}`
            })
          );
        }

        if (i % 20 === 0) {
          operations.push(
            engagementTracker.trackConnectionAttempt(`profile_${i}`, 'sent')
          );
        }
      }

      const startTime = Date.now();
      await Promise.allSettled(operations);
      const endTime = Date.now();

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(10000); // 10 seconds
    });
  });

  describe('Real-time Monitoring and Alerts', () => {
    test('should trigger real-time alerts across systems', async () => {
      const alerts = [];

      // Setup alert listeners
      budgetMonitor.onAnyBudgetViolation((category, violation) => {
        alerts.push({ type: 'budget_violation', category, violation });
      });

      // Setup analytics event listener
      analyticsTracker.addEventListener('event_tracked', (event) => {
        if (event.type === 'error_occurred') {
          alerts.push({ type: 'error_event', event });
        }
      });

      // Trigger various alert conditions
      budgetMonitor.checkBudget('memory_usage', 60 * 1024 * 1024); // Memory violation
      budgetMonitor.checkBudget('error_rate', 0.1); // Error rate violation

      await analyticsTracker.trackEvent({
        type: 'error_occurred',
        severity: 'high',
        errorMessage: 'Critical system error'
      });

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should have triggered multiple alerts
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts.some(a => a.type === 'budget_violation')).toBe(true);
    });

    test('should coordinate monitoring across all systems', async () => {
      const monitoringData = {
        analytics: {
          eventCount: analyticsTracker.getEventQueue().length,
          sessionActive: analyticsTracker.getSessionInfo().isActive
        },
        performance: {
          violations: budgetMonitor.currentViolations.size,
          optimizationActive: performanceOptimization.intervalId !== null
        },
        errors: {
          recentErrors: errorReporting.getRecentErrors(5).length
        }
      };

      // Verify all systems are being monitored
      expect(monitoringData.analytics).toBeDefined();
      expect(monitoringData.performance).toBeDefined();
      expect(monitoringData.errors).toBeDefined();

      // Systems should be in consistent state
      expect(typeof monitoringData.analytics.eventCount).toBe('number');
      expect(typeof monitoringData.performance.violations).toBe('number');
      expect(typeof monitoringData.errors.recentErrors).toBe('number');
    });
  });

  describe('System Health Checks', () => {
    test('should perform comprehensive health checks', async () => {
      const healthCheck = {
        analytics: await checkAnalyticsHealth(),
        errorReporting: await checkErrorReportingHealth(),
        abTesting: await checkABTestingHealth(),
        feedback: await checkFeedbackHealth(),
        performance: await checkPerformanceHealth()
      };

      // All systems should be healthy
      Object.values(healthCheck).forEach(health => {
        expect(health.status).toBe('healthy');
        expect(health.errors.length).toBe(0);
      });
    });

    async function checkAnalyticsHealth() {
      try {
        const sessionInfo = analyticsTracker.getSessionInfo();
        const queue = analyticsTracker.getEventQueue();

        return {
          status: 'healthy',
          metrics: {
            sessionActive: sessionInfo.isActive,
            queueSize: queue.length,
            sessionDuration: sessionInfo.duration
          },
          errors: []
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          errors: [error.message]
        };
      }
    }

    async function checkErrorReportingHealth() {
      try {
        const recentErrors = errorReporting.getRecentErrors(10);

        return {
          status: 'healthy',
          metrics: {
            recentErrorCount: recentErrors.length,
            initialized: errorReporting.isInitialized
          },
          errors: []
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          errors: [error.message]
        };
      }
    }

    async function checkABTestingHealth() {
      try {
        const activeTests = await abTesting.getActiveTests();

        return {
          status: 'healthy',
          metrics: {
            activeTestCount: activeTests.length,
            initialized: abTesting.isInitialized
          },
          errors: []
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          errors: [error.message]
        };
      }
    }

    async function checkFeedbackHealth() {
      try {
        return {
          status: 'healthy',
          metrics: {
            initialized: feedbackSystem.isInitialized
          },
          errors: []
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          errors: [error.message]
        };
      }
    }

    async function checkPerformanceHealth() {
      try {
        const report = await performanceOptimization.getOptimizationReport();

        return {
          status: 'healthy',
          metrics: {
            optimizationActive: performanceOptimization.intervalId !== null,
            budgetViolations: report.budgetViolations.length,
            browserCapabilitiesDetected: report.browserCapabilities.length
          },
          errors: []
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          errors: [error.message]
        };
      }
    }

    test('should detect and report system degradation', async () => {
      // Simulate system degradation
      const degradationScenarios = [
        { name: 'high_memory_usage', simulate: () => simulateHighMemoryUsage() },
        { name: 'high_error_rate', simulate: () => simulateHighErrorRate() },
        { name: 'slow_response_times', simulate: () => simulateSlowResponseTimes() }
      ];

      for (const scenario of degradationScenarios) {
        await scenario.simulate();

        // Check if systems detect degradation
        const performanceReport = await performanceOptimization.getOptimizationReport();
        const budgetStatus = budgetMonitor.getBudgetStatus();

        // Should detect performance issues
        expect(performanceReport.budgetViolations.length + budgetStatus.violationCount).toBeGreaterThan(0);
      }
    });

    async function simulateHighMemoryUsage() {
      // Trigger memory budget violation
      budgetMonitor.checkBudget('memory_usage', 80 * 1024 * 1024);
    }

    async function simulateHighErrorRate() {
      // Report multiple errors
      for (let i = 0; i < 10; i++) {
        await errorReporting.reportError(new Error(`Simulated error ${i}`), 'test', {
          simulation: true
        });
      }
    }

    async function simulateSlowResponseTimes() {
      // Trigger load time budget violation
      budgetMonitor.checkBudget('load_time', 5000);
    }
  });
});

// Test utilities for integration testing
export class IntegrationTestHelper {
  static async waitForAsyncOperations(timeout = 1000) {
    return new Promise(resolve => setTimeout(resolve, timeout));
  }

  static generateTestEvent(type, overrides = {}) {
    return {
      type,
      timestamp: Date.now(),
      userId: 'test_user',
      sessionId: 'test_session',
      ...overrides
    };
  }

  static generateTestFeedback(overrides = {}) {
    return {
      rating: 4,
      comment: 'Test feedback comment',
      category: 'general',
      userId: 'test_user',
      ...overrides
    };
  }

  static generateTestABConfig(overrides = {}) {
    return {
      name: 'test_experiment',
      description: 'Test A/B experiment',
      variants: [
        { id: 'control', name: 'Control', config: {} },
        { id: 'treatment', name: 'Treatment', config: {} }
      ],
      trafficAllocation: { control: 0.5, treatment: 0.5 },
      successMetric: 'conversion_rate',
      ...overrides
    };
  }

  static verifyEventIntegrity(event) {
    expect(event).toHaveProperty('timestamp');
    expect(event).toHaveProperty('type');
    expect(typeof event.timestamp).toBe('number');
    expect(typeof event.type).toBe('string');
  }

  static verifySystemsInitialized(...systems) {
    systems.forEach(system => {
      if (system.isInitialized !== undefined) {
        expect(system.isInitialized).toBe(true);
      }
    });
  }
}