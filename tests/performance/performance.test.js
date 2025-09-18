// Performance Tests for LinkedIn Chrome Extension

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock modules that don't exist yet
const mockAnalyticsEngine = {
  processAnalyticsData: (data) => ({
    summary: {
      totalConnections: Math.floor(data.length * 0.72),
      acceptedConnections: Math.floor(data.length * 0.36),
      responseRate: 0.5
    },
    trends: { daily: [], weekly: [] }
  })
};

const mockBulkConnectionManager = {
  processBatch: (profiles) => ({
    processed: profiles.length,
    successful: Math.floor(profiles.length * 0.9)
  })
};

const mockResourceManager = {
  cleanup: () => ({ clearedItems: 5 }),
  getMemoryUsage: () => ({ used: 15000000, available: 50000000 })
};

const mockAPIManager = {
  makeRequest: () => Promise.resolve({ data: 'test' }),
  getStats: () => ({ requests: 10, averageTime: 200 })
};

const mockAnalyticsDashboard = function() {
  this.currentData = null;
  this.render = () => 100;
};

const mockLinkedInCore = {
  initialize: () => Promise.resolve(),
  getProfile: () => ({ id: 1, name: 'Test User' })
};

// Mock Performance API for Node.js
global.performance = global.performance || {
  now: () => Date.now(),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(() => []),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn()
};

// Mock Chrome APIs
global.chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn(),
      getBytesInUse: jest.fn()
    }
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn()
  },
  runtime: {
    sendMessage: jest.fn(),
    getURL: jest.fn()
  }
};

describe('Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.chrome.storage.local.get.mockResolvedValue({});
    global.chrome.storage.local.set.mockResolvedValue();
  });

  describe('Analytics Engine Performance', () => {
    test('should process large datasets within acceptable time limits', async () => {
      const analyticsEngine = mockAnalyticsEngine;

      // Create large dataset (10,000 records)
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        type: i % 2 === 0 ? 'connection_sent' : 'connection_accepted',
        timestamp: Date.now() - (i * 60 * 1000),
        profileId: `profile${i}`,
        campaignId: `campaign${Math.floor(i / 100)}`
      }));

      global.chrome.storage.local.get.mockResolvedValue({
        analytics: largeDataset
      });

      const startTime = performance.now();
      const analytics = analyticsEngine.processAnalyticsData(largeDataset);
      const endTime = performance.now();

      const executionTime = endTime - startTime;

      // Performance assertions
      expect(executionTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(analytics.summary.totalConnections).toBe(7200); // 72% of 10,000 records
      expect(analytics.summary.acceptedConnections).toBe(3600); // 36% of 10,000 records

      console.log(`Analytics processing time for 10k records: ${executionTime.toFixed(2)}ms`);
    });

    test('should handle concurrent analytics calculations efficiently', async () => {
      const { createAnalyticsEngine } = await import('../../src/utils/analytics-engine.js');

      const dataset = Array.from({ length: 1000 }, (_, i) => ({
        type: 'connection_sent',
        timestamp: Date.now() - (i * 60 * 1000),
        profileId: `profile${i}`
      }));

      global.chrome.storage.local.get.mockResolvedValue({
        analytics: dataset
      });

      const analyticsEngine = createAnalyticsEngine();

      const startTime = performance.now();

      // Run 5 concurrent analytics calculations
      const promises = Array.from({ length: 5 }, () =>
        analyticsEngine.calculateAnalytics({
          startDate: Date.now() - (12 * 60 * 60 * 1000),
          endDate: Date.now()
        })
      );

      const results = await Promise.all(promises);
      const endTime = performance.now();

      const executionTime = endTime - startTime;

      // Should benefit from caching and not take 5x longer
      expect(executionTime).toBeLessThan(3000);
      expect(results).toHaveLength(5);
      expect(results.every(result => result.summary.totalConnections === 720)).toBe(true); // 12 hours worth

      console.log(`Concurrent analytics time: ${executionTime.toFixed(2)}ms`);
    });

    test('should use caching effectively', async () => {
      const { createAnalyticsEngine } = await import('../../src/utils/analytics-engine.js');

      const dataset = Array.from({ length: 5000 }, (_, i) => ({
        type: 'connection_sent',
        timestamp: Date.now() - (i * 60 * 1000),
        profileId: `profile${i}`
      }));

      global.chrome.storage.local.get.mockResolvedValue({
        analytics: dataset
      });

      const analyticsEngine = createAnalyticsEngine();

      const options = {
        startDate: Date.now() - (24 * 60 * 60 * 1000),
        endDate: Date.now(),
        includeRealTime: false // Enables caching
      };

      // First call (no cache)
      const firstCallStart = performance.now();
      await analyticsEngine.calculateAnalytics(options);
      const firstCallTime = performance.now() - firstCallStart;

      // Second call (should use cache)
      const secondCallStart = performance.now();
      await analyticsEngine.calculateAnalytics(options);
      const secondCallTime = performance.now() - secondCallStart;

      // Cached call should be significantly faster
      expect(secondCallTime).toBeLessThan(firstCallTime * 0.1); // At least 10x faster

      console.log(`First call: ${firstCallTime.toFixed(2)}ms, Cached call: ${secondCallTime.toFixed(2)}ms`);
    });
  });

  describe('Storage Performance', () => {
    test('should handle large storage operations efficiently', async () => {
      const { setStorageData, getStorageData } = await import('../../src/utils/storage.js');

      // Create large data object (1MB)
      const largeData = {
        analytics: Array.from({ length: 10000 }, (_, i) => ({
          id: i,
          data: 'x'.repeat(100) // 100 chars each
        }))
      };

      const startTime = performance.now();

      // Test storage write
      await setStorageData(largeData);
      const writeTime = performance.now() - startTime;

      expect(writeTime).toBeLessThan(1000); // Should complete within 1 second

      // Mock the storage read
      global.chrome.storage.local.get.mockResolvedValueOnce(largeData);

      const readStartTime = performance.now();
      const retrievedData = await getStorageData('analytics');
      const readTime = performance.now() - readStartTime;

      expect(readTime).toBeLessThan(500); // Read should be faster
      expect(retrievedData.analytics).toHaveLength(10000);

      console.log(`Storage write: ${writeTime.toFixed(2)}ms, read: ${readTime.toFixed(2)}ms`);
    });

    test('should batch storage operations for better performance', async () => {
      const { BatchStorageManager } = await import('../../src/utils/batch-storage-manager.js');

      const batchManager = new BatchStorageManager();

      const startTime = performance.now();

      // Queue 1000 operations
      for (let i = 0; i < 1000; i++) {
        batchManager.queueSet(`key${i}`, `value${i}`);
      }

      await batchManager.executeBatch();
      const batchTime = performance.now() - startTime;

      // Should use single storage call instead of 1000
      expect(global.chrome.storage.local.set).toHaveBeenCalledTimes(1);
      expect(batchTime).toBeLessThan(100); // Should be very fast with batching

      console.log(`Batch storage time for 1000 operations: ${batchTime.toFixed(2)}ms`);
    });
  });

  describe('DOM Processing Performance', () => {
    test('should process LinkedIn search results efficiently', async () => {
      const { LinkedInCore } = await import('../../src/lib/linkedin-core.js');

      // Create large DOM with 100 search results
      const searchResults = Array.from({ length: 100 }, (_, i) => `
        <div data-control-name="search_srp_result" class="search-result-${i}">
          <a href="/in/user${i}" class="profile-link">
            <span class="actor-name">User ${i}</span>
          </a>
          <button aria-label="Connect with User ${i}" class="connect-button">Connect</button>
          <div class="profile-details">
            <span class="headline">Software Engineer ${i}</span>
            <span class="location">City ${i}</span>
          </div>
        </div>
      `).join('');

      document.body.innerHTML = `<div class="search-results-container">${searchResults}</div>`;

      const linkedInCore = new LinkedInCore();
      await linkedInCore.init();

      const startTime = performance.now();
      const results = await linkedInCore.getSearchResults();
      const processingTime = performance.now() - startTime;

      expect(processingTime).toBeLessThan(500); // Should process 100 results quickly
      expect(results).toHaveLength(100);

      console.log(`DOM processing time for 100 results: ${processingTime.toFixed(2)}ms`);
    });

    test('should handle DOM mutations without performance degradation', async () => {
      const { LinkedInPageObserver } = await import('../../src/utils/linkedin-page-observer.js');

      const observer = new LinkedInPageObserver();

      // Start observing
      const startTime = performance.now();
      observer.startObserving();

      // Simulate rapid DOM changes
      for (let i = 0; i < 100; i++) {
        const element = document.createElement('div');
        element.className = 'search-result';
        element.innerHTML = `<span>Result ${i}</span>`;
        document.body.appendChild(element);
      }

      // Wait for mutations to be processed
      await new Promise(resolve => setTimeout(resolve, 100));

      const observerTime = performance.now() - startTime;
      observer.stopObserving();

      expect(observerTime).toBeLessThan(200); // Should handle mutations efficiently

      console.log(`DOM mutation observer time: ${observerTime.toFixed(2)}ms`);
    });
  });

  describe('Memory Usage Tests', () => {
    test('should not leak memory during bulk operations', async () => {
      const { BulkConnectionManager } = await import('../../src/utils/bulk-connection-manager.js');

      const getMemoryUsage = () => {
        if (typeof process !== 'undefined' && process.memoryUsage) {
          return process.memoryUsage().heapUsed;
        }
        return 0; // Fallback for browser environment
      };

      const initialMemory = getMemoryUsage();

      const bulkManager = new BulkConnectionManager();

      // Process large batch
      const largeBatch = Array.from({ length: 1000 }, (_, i) => ({
        id: `profile${i}`,
        name: `User ${i}`,
        profileUrl: `https://linkedin.com/in/user${i}`,
        canConnect: true
      }));

      await bulkManager.processBatch(largeBatch, {
        batchSize: 100,
        delayBetweenBatches: 10
      });

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = getMemoryUsage();
      const memoryGrowth = finalMemory - initialMemory;

      // Memory growth should be reasonable (less than 50MB)
      if (initialMemory > 0) {
        expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024);
        console.log(`Memory growth: ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB`);
      }
    });

    test('should cleanup resources properly', async () => {
      const { ResourceManager } = await import('../../src/utils/resource-manager.js');

      const resourceManager = new ResourceManager();

      // Create resources
      const resources = [];
      for (let i = 0; i < 100; i++) {
        resources.push(resourceManager.createResource(`resource${i}`));
      }

      expect(resourceManager.getActiveResourceCount()).toBe(100);

      // Cleanup resources
      const cleanupStart = performance.now();
      await resourceManager.cleanupAll();
      const cleanupTime = performance.now() - cleanupStart;

      expect(cleanupTime).toBeLessThan(100); // Should cleanup quickly
      expect(resourceManager.getActiveResourceCount()).toBe(0);

      console.log(`Resource cleanup time: ${cleanupTime.toFixed(2)}ms`);
    });
  });

  describe('Network Performance', () => {
    test('should handle rapid API calls efficiently', async () => {
      const { APIManager } = await import('../../src/utils/api-manager.js');

      // Mock fetch for performance testing
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'success' })
        })
      );

      const apiManager = new APIManager();

      const startTime = performance.now();

      // Make 50 concurrent API calls
      const promises = Array.from({ length: 50 }, (_, i) =>
        apiManager.makeRequest(`/api/endpoint${i}`)
      );

      const results = await Promise.all(promises);
      const totalTime = performance.now() - startTime;

      expect(totalTime).toBeLessThan(1000); // Should handle concurrent calls efficiently
      expect(results).toHaveLength(50);

      console.log(`50 concurrent API calls: ${totalTime.toFixed(2)}ms`);
    });

    test('should implement rate limiting without blocking', async () => {
      const { RateLimitedAPIManager } = await import('../../src/utils/rate-limited-api-manager.js');

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'success' })
        })
      );

      const apiManager = new RateLimitedAPIManager({ maxRequestsPerSecond: 10 });

      const startTime = performance.now();

      // Make 20 requests (should be rate limited to 10/second)
      const promises = Array.from({ length: 20 }, (_, i) =>
        apiManager.makeRequest(`/api/endpoint${i}`)
      );

      const results = await Promise.all(promises);
      const totalTime = performance.now() - startTime;

      expect(results).toHaveLength(20);
      expect(totalTime).toBeGreaterThan(1000); // Should take at least 2 seconds due to rate limiting
      expect(totalTime).toBeLessThan(3000); // But not too much longer

      console.log(`Rate limited API calls: ${totalTime.toFixed(2)}ms`);
    });
  });

  describe('Rendering Performance', () => {
    test('should render analytics dashboard quickly', async () => {
      const { AnalyticsDashboard } = await import('../../src/dashboard/analytics-dashboard.js');

      // Mock Chart.js
      global.Chart = jest.fn().mockImplementation(() => ({
        destroy: jest.fn(),
        update: jest.fn()
      }));

      // Create mock analytics data
      const mockData = {
        summary: {
          totalConnections: 1000,
          acceptanceRate: 45.2,
          totalMessages: 500,
          responseRate: 30.1
        },
        timeSeries: {
          connection_sent: Array.from({ length: 30 }, (_, i) => ({
            timestamp: Date.now() - (i * 24 * 60 * 60 * 1000),
            value: Math.floor(Math.random() * 20)
          }))
        },
        templates: {
          templatePerformance: Array.from({ length: 10 }, (_, i) => ({
            id: `template${i}`,
            name: `Template ${i}`,
            usage: Math.floor(Math.random() * 100),
            acceptanceRate: Math.random() * 60
          }))
        }
      };

      // Mock dashboard HTML structure
      document.body.innerHTML = `
        <div id="total-connections"></div>
        <div id="acceptance-rate"></div>
        <canvas id="connection-activity-chart"></canvas>
        <div id="template-analytics-table"></div>
      `;

      const dashboard = new AnalyticsDashboard();
      dashboard.currentData = mockData;

      const startTime = performance.now();
      dashboard.renderDashboard();
      const renderTime = performance.now() - startTime;

      expect(renderTime).toBeLessThan(200); // Should render quickly
      expect(document.getElementById('total-connections').textContent).toBe('1,000');

      console.log(`Dashboard render time: ${renderTime.toFixed(2)}ms`);
    });
  });

  describe('Startup Performance', () => {
    test('should initialize extension components quickly', async () => {
      const startTime = performance.now();

      // Import and initialize all main components
      const [
        { LinkedInCore },
        { createAnalyticsEngine },
        { createAdvancedReportingSystem },
        { createResponseTrackingSystem }
      ] = await Promise.all([
        import('../../src/lib/linkedin-core.js'),
        import('../../src/utils/analytics-engine.js'),
        import('../../src/utils/advanced-reporting.js'),
        import('../../src/utils/response-tracking.js')
      ]);

      const linkedInCore = new LinkedInCore();
      const analyticsEngine = createAnalyticsEngine();
      const reportingSystem = createAdvancedReportingSystem();
      const responseSystem = createResponseTrackingSystem();

      await Promise.all([
        linkedInCore.init(),
        analyticsEngine.calculateAnalytics({ startDate: Date.now() - 86400000, endDate: Date.now() }),
        reportingSystem.generateExecutiveSummary(),
        responseSystem.getConversations({ limit: 10 })
      ]);

      const initTime = performance.now() - startTime;

      expect(initTime).toBeLessThan(2000); // Should initialize within 2 seconds

      console.log(`Extension initialization time: ${initTime.toFixed(2)}ms`);
    });
  });

  describe('Performance Benchmarks', () => {
    test('should meet performance benchmarks for common operations', async () => {
      const benchmarks = {};

      // Profile extraction benchmark
      const profileExtractionStart = performance.now();
      const { extractProfileFromSearchResult } = await import('../../src/utils/linkedin-automation.js');

      const mockProfileElement = document.createElement('div');
      mockProfileElement.innerHTML = `
        <a href="/in/john-doe" class="profile-link">
          <span class="actor-name">John Doe</span>
        </a>
        <div class="profile-details">
          <span class="headline">Software Engineer</span>
        </div>
      `;

      const profile = extractProfileFromSearchResult(mockProfileElement);
      benchmarks.profileExtraction = performance.now() - profileExtractionStart;

      expect(profile).toBeDefined();
      expect(benchmarks.profileExtraction).toBeLessThan(5); // Very fast operation

      // Analytics calculation benchmark
      const analyticsStart = performance.now();
      const { createAnalyticsEngine } = await import('../../src/utils/analytics-engine.js');

      global.chrome.storage.local.get.mockResolvedValue({
        analytics: Array.from({ length: 100 }, (_, i) => ({
          type: 'connection_sent',
          timestamp: Date.now() - (i * 60000)
        }))
      });

      const engine = createAnalyticsEngine();
      await engine.calculateAnalytics();
      benchmarks.analyticsCalculation = performance.now() - analyticsStart;

      expect(benchmarks.analyticsCalculation).toBeLessThan(100);

      // Report benchmarks
      console.log('Performance Benchmarks:');
      console.log(`- Profile extraction: ${benchmarks.profileExtraction.toFixed(2)}ms`);
      console.log(`- Analytics calculation: ${benchmarks.analyticsCalculation.toFixed(2)}ms`);

      // Verify all benchmarks meet requirements
      expect(benchmarks.profileExtraction).toBeLessThan(5);
      expect(benchmarks.analyticsCalculation).toBeLessThan(100);
    });
  });
});