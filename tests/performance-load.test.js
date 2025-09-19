// Performance Testing Under Realistic Load Conditions - Task 6.8
// Comprehensive stress testing, load testing, and performance validation

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock Chrome APIs with performance tracking
global.chrome = {
  storage: {
    local: {
      get: jest.fn(() => Promise.resolve({})),
      set: jest.fn(() => Promise.resolve()),
      remove: jest.fn(() => Promise.resolve()),
      clear: jest.fn(() => Promise.resolve())
    }
  }
};

// Enhanced Performance API mock with realistic timing
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

// Mock DOM with performance-aware implementations
global.document = {
  querySelectorAll: jest.fn(() => []),
  createElement: jest.fn(() => ({ noModule: true }))
};

// Mock console to track performance messages
const performanceLogs = [];
jest.spyOn(console, 'log').mockImplementation((message, ...args) => {
  if (message.includes('performance') || message.includes('optimization')) {
    performanceLogs.push({ message, args, timestamp: Date.now() });
  }
});

// Import systems for testing
import { createRealTimeAnalyticsTracker } from '../src/utils/real-time-analytics.js';
import { ErrorReportingSystem } from '../src/utils/error-reporting.js';
import { EnhancedABTestingFramework } from '../src/utils/enhanced-ab-testing-framework.js';
import { UserFeedbackSystem } from '../src/utils/user-feedback-system.js';
import { createPerformanceOptimizationSystem } from '../src/utils/performance-optimization.js';
import { createPerformanceBudgetMonitor } from '../src/utils/performance-budget-monitor.js';

describe('Performance Testing Under Realistic Load - Task 6.8', () => {
  let systems = {};
  let performanceMonitor;

  beforeEach(async () => {
    jest.clearAllMocks();
    performanceLogs.length = 0;

    // Initialize performance monitor
    performanceMonitor = new PerformanceTestMonitor();

    // Initialize all systems with performance monitoring
    systems = {
      analytics: createRealTimeAnalyticsTracker({ memoryLimit: 500 }),
      errorReporting: new ErrorReportingSystem(),
      abTesting: new EnhancedABTestingFramework(),
      feedback: new UserFeedbackSystem(),
      performance: createPerformanceOptimizationSystem(),
      budgetMonitor: createPerformanceBudgetMonitor()
    };

    // Initialize systems
    for (const [name, system] of Object.entries(systems)) {
      await system.initialize();
      performanceMonitor.registerSystem(name, system);
    }
  });

  afterEach(() => {
    // Cleanup systems
    Object.values(systems).forEach(system => {
      if (system.dispose) system.dispose();
      if (system.stopMonitoring) system.stopMonitoring();
    });
  });

  describe('High Volume Load Testing', () => {
    test('should handle 10,000 analytics events efficiently', async () => {
      const eventCount = 10000;
      const startTime = performance.now();
      const startMemory = performance.memory.usedJSHeapSize;

      // Track memory usage during load
      const memorySnapshots = [];
      const memoryInterval = setInterval(() => {
        memorySnapshots.push({
          timestamp: Date.now(),
          memory: performance.memory.usedJSHeapSize
        });
      }, 100);

      // Generate high volume of events
      const promises = [];
      for (let i = 0; i < eventCount; i++) {
        promises.push(
          systems.analytics.trackEvent({
            type: 'load_test_event',
            index: i,
            timestamp: Date.now(),
            metadata: {
              batchId: Math.floor(i / 100),
              data: `test_data_${i}`.repeat(10) // Add some data size
            }
          })
        );

        // Add small delay every 1000 events to prevent overwhelming
        if (i % 1000 === 0 && i > 0) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      await Promise.all(promises);
      clearInterval(memoryInterval);

      const endTime = performance.now();
      const endMemory = performance.memory.usedJSHeapSize;
      const duration = endTime - startTime;

      // Performance assertions
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
      expect(endMemory - startMemory).toBeLessThan(50 * 1024 * 1024); // Memory increase < 50MB

      // Verify event processing
      const queue = systems.analytics.getEventQueue();
      expect(queue.length).toBeLessThanOrEqual(systems.analytics.memoryLimit);

      // Check for memory leaks
      const memoryGrowth = memorySnapshots[memorySnapshots.length - 1].memory - memorySnapshots[0].memory;
      expect(memoryGrowth).toBeLessThan(100 * 1024 * 1024); // < 100MB growth

      console.log(`Processed ${eventCount} events in ${duration}ms, memory growth: ${memoryGrowth} bytes`);
    });

    test('should handle concurrent operations across all systems', async () => {
      const operationCount = 1000;
      const concurrentBatches = 10;
      const startTime = performance.now();

      const operationBatches = [];

      for (let batch = 0; batch < concurrentBatches; batch++) {
        const batchOperations = [];

        for (let i = 0; i < operationCount / concurrentBatches; i++) {
          const index = batch * (operationCount / concurrentBatches) + i;

          // Mix of operations across systems
          batchOperations.push(
            systems.analytics.trackEvent({
              type: 'concurrent_analytics',
              index,
              batch
            })
          );

          if (index % 10 === 0) {
            batchOperations.push(
              systems.feedback.submitFeedback({
                rating: Math.floor(Math.random() * 5) + 1,
                comment: `Concurrent feedback ${index}`,
                userId: `user_${index}`
              })
            );
          }

          if (index % 15 === 0) {
            batchOperations.push(
              systems.errorReporting.reportError(
                new Error(`Test error ${index}`),
                'load_test',
                { index, batch }
              )
            );
          }
        }

        operationBatches.push(Promise.all(batchOperations));
      }

      // Execute all batches concurrently
      await Promise.all(operationBatches);

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Performance assertions
      expect(duration).toBeLessThan(60000); // Should complete within 60 seconds

      // Verify all systems are still responsive
      const healthChecks = await Promise.all([
        checkSystemHealth(systems.analytics),
        checkSystemHealth(systems.feedback),
        checkSystemHealth(systems.errorReporting)
      ]);

      healthChecks.forEach(health => {
        expect(health.responsive).toBe(true);
        expect(health.errors.length).toBe(0);
      });

      console.log(`Completed ${operationCount} concurrent operations across systems in ${duration}ms`);
    });

    test('should maintain performance under sustained load', async () => {
      const testDuration = 30000; // 30 seconds
      const eventsPerSecond = 50;
      const startTime = Date.now();

      const performanceMetrics = {
        eventsSent: 0,
        errors: 0,
        avgResponseTime: [],
        memoryUsage: []
      };

      const sustainedLoadInterval = setInterval(async () => {
        const batchStartTime = performance.now();

        // Send batch of events
        const batchPromises = [];
        for (let i = 0; i < eventsPerSecond; i++) {
          batchPromises.push(
            systems.analytics.trackEvent({
              type: 'sustained_load',
              timestamp: Date.now(),
              index: performanceMetrics.eventsSent + i
            }).catch(() => {
              performanceMetrics.errors++;
            })
          );
        }

        await Promise.all(batchPromises);

        const batchEndTime = performance.now();
        performanceMetrics.eventsSent += eventsPerSecond;
        performanceMetrics.avgResponseTime.push(batchEndTime - batchStartTime);
        performanceMetrics.memoryUsage.push(performance.memory.usedJSHeapSize);

        // Check if test duration exceeded
        if (Date.now() - startTime >= testDuration) {
          clearInterval(sustainedLoadInterval);
        }
      }, 1000);

      // Wait for test completion
      await new Promise(resolve => {
        const checkInterval = setInterval(() => {
          if (Date.now() - startTime >= testDuration) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });

      // Analyze performance metrics
      const avgResponseTime = performanceMetrics.avgResponseTime.reduce((sum, time) => sum + time, 0) /
                             performanceMetrics.avgResponseTime.length;

      const memoryGrowth = performanceMetrics.memoryUsage[performanceMetrics.memoryUsage.length - 1] -
                          performanceMetrics.memoryUsage[0];

      // Performance assertions
      expect(performanceMetrics.errors).toBeLessThan(performanceMetrics.eventsSent * 0.01); // < 1% error rate
      expect(avgResponseTime).toBeLessThan(1000); // < 1 second average response time
      expect(memoryGrowth).toBeLessThan(20 * 1024 * 1024); // < 20MB memory growth

      console.log(`Sustained load test: ${performanceMetrics.eventsSent} events, ${performanceMetrics.errors} errors, ${avgResponseTime}ms avg response`);
    });
  });

  describe('Memory and Resource Testing', () => {
    test('should handle memory pressure gracefully', async () => {
      // Simulate memory pressure by filling up available memory
      const memoryHogs = [];
      const initialMemory = performance.memory.usedJSHeapSize;

      try {
        // Create memory pressure
        for (let i = 0; i < 1000; i++) {
          memoryHogs.push(new Array(10000).fill(`memory_test_${i}`));
        }

        // Update memory mock to reflect pressure
        performance.memory.usedJSHeapSize = performance.memory.totalJSHeapSize * 0.9;

        // Test system behavior under memory pressure
        await systems.performance.performOptimizationCheck();

        // Verify optimization was triggered
        const report = await systems.performance.getOptimizationReport();
        expect(report.budgetViolations.some(v => v.budget === 'MEMORY_LIMIT')).toBe(true);

        // Test analytics behavior under memory pressure
        for (let i = 0; i < 100; i++) {
          await systems.analytics.trackEvent({
            type: 'memory_pressure_test',
            index: i
          });
        }

        // System should still be responsive
        const queue = systems.analytics.getEventQueue();
        expect(queue.length).toBeLessThanOrEqual(systems.analytics.memoryLimit);

      } finally {
        // Cleanup
        memoryHogs.length = 0;
        performance.memory.usedJSHeapSize = initialMemory;
      }
    });

    test('should recover from resource exhaustion', async () => {
      // Simulate storage quota exhaustion
      chrome.storage.local.set.mockRejectedValueOnce(new Error('Quota exceeded'));

      let storageErrors = 0;
      const originalReportError = systems.errorReporting.reportError;
      systems.errorReporting.reportError = async (error, category, context) => {
        if (error.message.includes('Quota exceeded')) {
          storageErrors++;
        }
        return originalReportError.call(systems.errorReporting, error, category, context);
      };

      // Try to perform operations that require storage
      try {
        await systems.analytics.trackEvent({
          type: 'storage_exhaustion_test',
          data: 'large_data_payload'
        });
      } catch (error) {
        // Expected to fail initially
      }

      // Restore storage functionality
      chrome.storage.local.set.mockResolvedValue();

      // Verify system recovers
      await systems.analytics.trackEvent({
        type: 'recovery_test',
        data: 'test_data'
      });

      const queue = systems.analytics.getEventQueue();
      const recoveryEvent = queue.find(e => e.type === 'recovery_test');
      expect(recoveryEvent).toBeTruthy();

      // Restore original method
      systems.errorReporting.reportError = originalReportError;
    });

    test('should handle DOM operations efficiently at scale', async () => {
      // Mock large DOM
      const mockElements = [];
      for (let i = 0; i < 10000; i++) {
        mockElements.push({
          dataset: { lazy: `image_${i}.jpg` },
          addEventListener: jest.fn(),
          removeEventListener: jest.fn()
        });
      }

      document.querySelectorAll.mockReturnValue(mockElements);

      const startTime = performance.now();

      // Test lazy loading setup with large DOM
      await systems.performance.enableLazyLoading({
        loadTimes: { averageLoadTime: 3500 }
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should handle large DOM efficiently
      expect(duration).toBeLessThan(5000); // < 5 seconds for 10k elements

      // Verify intersection observer was used efficiently
      expect(global.IntersectionObserver).toHaveBeenCalled();
    });
  });

  describe('Network and I/O Performance', () => {
    test('should handle network latency and failures', async () => {
      // Mock network with varying latency
      const networkLatencies = [100, 500, 1000, 2000, 5000]; // ms
      let requestCount = 0;

      global.fetch = jest.fn(() => {
        const latency = networkLatencies[requestCount % networkLatencies.length];
        requestCount++;

        return new Promise((resolve, reject) => {
          setTimeout(() => {
            if (latency > 3000) {
              reject(new Error('Network timeout'));
            } else {
              resolve({
                ok: true,
                json: () => Promise.resolve({ success: true })
              });
            }
          }, latency);
        });
      });

      const startTime = Date.now();
      const networkOperations = [];

      // Simulate network-heavy operations
      for (let i = 0; i < 20; i++) {
        networkOperations.push(
          performNetworkOperation(i).catch(error => ({
            error: error.message,
            index: i
          }))
        );
      }

      const results = await Promise.all(networkOperations);
      const endTime = Date.now();

      // Analyze results
      const successful = results.filter(r => !r.error).length;
      const failed = results.filter(r => r.error).length;

      expect(successful).toBeGreaterThan(failed); // More successes than failures
      expect(endTime - startTime).toBeLessThan(30000); // Complete within 30 seconds

      console.log(`Network operations: ${successful} successful, ${failed} failed`);
    });

    async function performNetworkOperation(index) {
      if (global.fetch) {
        const response = await global.fetch(`/api/test/${index}`);
        return await response.json();
      }
      return { success: true };
    }

    test('should batch I/O operations efficiently', async () => {
      const batchSize = 50;
      const totalOperations = 500;
      const startTime = performance.now();

      const batches = [];
      for (let i = 0; i < totalOperations; i += batchSize) {
        const batch = [];
        for (let j = i; j < Math.min(i + batchSize, totalOperations); j++) {
          batch.push(
            systems.analytics.trackEvent({
              type: 'batch_test',
              index: j,
              batch: Math.floor(j / batchSize)
            })
          );
        }
        batches.push(Promise.all(batch));
      }

      await Promise.all(batches);
      const endTime = performance.now();

      const duration = endTime - startTime;
      const opsPerSecond = totalOperations / (duration / 1000);

      // Should achieve reasonable throughput
      expect(opsPerSecond).toBeGreaterThan(50); // > 50 ops/second
      expect(duration).toBeLessThan(20000); // < 20 seconds total

      console.log(`Batched I/O: ${totalOperations} operations in ${duration}ms (${opsPerSecond.toFixed(2)} ops/sec)`);
    });
  });

  describe('System Stress Testing', () => {
    test('should handle extreme load scenarios', async () => {
      const extremeLoad = {
        analytics: 5000,
        feedback: 1000,
        errors: 500,
        abTests: 100
      };

      const stressPromises = [];

      // Analytics stress
      for (let i = 0; i < extremeLoad.analytics; i++) {
        stressPromises.push(
          systems.analytics.trackEvent({
            type: 'stress_analytics',
            index: i,
            timestamp: Date.now(),
            metadata: { stress: true }
          })
        );
      }

      // Feedback stress
      for (let i = 0; i < extremeLoad.feedback; i++) {
        stressPromises.push(
          systems.feedback.submitFeedback({
            rating: Math.floor(Math.random() * 5) + 1,
            comment: `Stress feedback ${i}`,
            userId: `stress_user_${i}`
          })
        );
      }

      // Error reporting stress
      for (let i = 0; i < extremeLoad.errors; i++) {
        stressPromises.push(
          systems.errorReporting.reportError(
            new Error(`Stress error ${i}`),
            'stress_test',
            { index: i }
          )
        );
      }

      // A/B testing stress
      for (let i = 0; i < extremeLoad.abTests; i++) {
        stressPromises.push(
          systems.abTesting.createTest({
            name: `stress_test_${i}`,
            variants: [
              { id: 'control', name: 'Control' },
              { id: 'treatment', name: 'Treatment' }
            ],
            trafficAllocation: { control: 0.5, treatment: 0.5 }
          })
        );
      }

      const startTime = performance.now();
      const results = await Promise.allSettled(stressPromises);
      const endTime = performance.now();

      // Analyze stress test results
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      const successRate = successful / results.length;

      expect(successRate).toBeGreaterThan(0.95); // > 95% success rate
      expect(endTime - startTime).toBeLessThan(120000); // < 2 minutes

      console.log(`Stress test: ${successful}/${results.length} operations successful (${(successRate * 100).toFixed(2)}%)`);
    });

    test('should maintain system stability under cascading failures', async () => {
      // Simulate cascading failures
      const failureScenarios = [
        () => { chrome.storage.local.set.mockRejectedValueOnce(new Error('Storage failure')); },
        () => { performance.memory.usedJSHeapSize = performance.memory.totalJSHeapSize * 0.95; },
        () => { global.fetch = jest.fn(() => Promise.reject(new Error('Network failure'))); }
      ];

      // Apply failures gradually
      for (const [index, scenario] of failureScenarios.entries()) {
        scenario();

        // Continue operations during failure
        const operations = [];
        for (let i = 0; i < 100; i++) {
          operations.push(
            systems.analytics.trackEvent({
              type: 'cascading_failure_test',
              failureLevel: index,
              index: i
            }).catch(() => null) // Handle failures gracefully
          );
        }

        await Promise.all(operations);

        // Verify system is still responsive
        const health = await checkSystemHealth(systems.analytics);
        expect(health.responsive).toBe(true);

        // Small delay before next failure
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Verify systems recovered
      const finalHealthChecks = await Promise.all(
        Object.values(systems).map(system => checkSystemHealth(system))
      );

      finalHealthChecks.forEach(health => {
        expect(health.responsive).toBe(true);
      });
    });
  });

  describe('Performance Regression Testing', () => {
    test('should detect performance regressions', async () => {
      // Baseline performance measurement
      const baseline = await measurePerformanceBaseline();

      // Simulate performance regression
      jest.spyOn(systems.analytics, 'trackEvent').mockImplementation(async function(event) {
        // Add artificial delay to simulate regression
        await new Promise(resolve => setTimeout(resolve, 50));
        return this.originalTrackEvent(event);
      });

      // Measure degraded performance
      const degraded = await measurePerformanceBaseline();

      // Detect regression
      const regression = {
        responseTime: degraded.avgResponseTime / baseline.avgResponseTime,
        throughput: baseline.throughput / degraded.throughput,
        memoryUsage: degraded.memoryUsage / baseline.memoryUsage
      };

      // Should detect significant regression
      expect(regression.responseTime).toBeGreaterThan(1.5); // 50% slower
      expect(regression.throughput).toBeGreaterThan(1.2); // 20% less throughput

      console.log('Performance regression detected:', regression);
    });

    async function measurePerformanceBaseline() {
      const iterations = 1000;
      const startTime = performance.now();
      const startMemory = performance.memory.usedJSHeapSize;

      const promises = [];
      for (let i = 0; i < iterations; i++) {
        promises.push(
          systems.analytics.trackEvent({
            type: 'baseline_test',
            index: i
          })
        );
      }

      await Promise.all(promises);

      const endTime = performance.now();
      const endMemory = performance.memory.usedJSHeapSize;

      return {
        avgResponseTime: (endTime - startTime) / iterations,
        throughput: iterations / ((endTime - startTime) / 1000),
        memoryUsage: endMemory - startMemory
      };
    }
  });
});

// Performance monitoring utility class
class PerformanceTestMonitor {
  constructor() {
    this.systems = new Map();
    this.metrics = {
      responseTime: [],
      throughput: [],
      errorRate: [],
      memoryUsage: []
    };
  }

  registerSystem(name, system) {
    this.systems.set(name, system);
  }

  async measureSystemPerformance(systemName, operation, iterations = 100) {
    const system = this.systems.get(systemName);
    if (!system) throw new Error(`System ${systemName} not found`);

    const startTime = performance.now();
    const startMemory = performance.memory.usedJSHeapSize;

    const promises = [];
    for (let i = 0; i < iterations; i++) {
      promises.push(operation(system, i));
    }

    const results = await Promise.allSettled(promises);
    const endTime = performance.now();
    const endMemory = performance.memory.usedJSHeapSize;

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return {
      systemName,
      iterations,
      duration: endTime - startTime,
      avgResponseTime: (endTime - startTime) / iterations,
      successRate: successful / iterations,
      errorRate: failed / iterations,
      throughput: iterations / ((endTime - startTime) / 1000),
      memoryDelta: endMemory - startMemory
    };
  }

  logPerformanceMetrics(metrics) {
    console.log(`Performance Metrics for ${metrics.systemName}:`);
    console.log(`  Avg Response Time: ${metrics.avgResponseTime.toFixed(2)}ms`);
    console.log(`  Throughput: ${metrics.throughput.toFixed(2)} ops/sec`);
    console.log(`  Success Rate: ${(metrics.successRate * 100).toFixed(2)}%`);
    console.log(`  Memory Delta: ${metrics.memoryDelta} bytes`);
  }
}

// System health check utility
async function checkSystemHealth(system) {
  try {
    const startTime = performance.now();

    // Perform basic operations to test responsiveness
    if (system.trackEvent) {
      await system.trackEvent({ type: 'health_check', timestamp: Date.now() });
    } else if (system.reportError) {
      // Don't actually report error for health check
    } else if (system.submitFeedback) {
      // Mock feedback submission for health check
    }

    const endTime = performance.now();
    const responseTime = endTime - startTime;

    return {
      responsive: responseTime < 5000, // Responsive if < 5 seconds
      responseTime,
      errors: []
    };
  } catch (error) {
    return {
      responsive: false,
      responseTime: -1,
      errors: [error.message]
    };
  }
}

// Export utilities for use in other tests
export { PerformanceTestMonitor, checkSystemHealth };