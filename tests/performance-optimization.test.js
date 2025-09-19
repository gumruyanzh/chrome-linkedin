// Comprehensive Test Suite for Task 6.7 Performance Optimization Systems
// Tests for automatic performance optimization, resource management, and budget enforcement

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock Chrome APIs
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

// Mock PerformanceObserver
global.PerformanceObserver = jest.fn(() => ({
  observe: jest.fn(),
  disconnect: jest.fn()
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Mock requestIdleCallback
global.requestIdleCallback = jest.fn(callback => setTimeout(callback, 1));

// Mock document
global.document = {
  querySelectorAll: jest.fn(() => []),
  createElement: jest.fn(() => ({ noModule: true }))
};

// Mock navigator
global.navigator = {
  userAgent: 'test-browser'
};

// Mock window
global.window = {
  gc: jest.fn()
};

// Mock WebAssembly
global.WebAssembly = {};

// Mock Worker
global.Worker = jest.fn();

// Import modules to test
import {
  PerformanceOptimizationSystem,
  ResourceManager,
  NetworkOptimizer,
  MemoryManager,
  OPTIMIZATION_STRATEGIES,
  PERFORMANCE_THRESHOLDS,
  PERFORMANCE_BUDGETS,
  BROWSER_FEATURES,
  createPerformanceOptimizationSystem
} from '../src/utils/performance-optimization.js';

import {
  PerformanceBudgetMonitor,
  BudgetMetricsCollector,
  BudgetEnforcementEngine,
  BUDGET_CATEGORIES,
  VIOLATION_SEVERITY,
  ENFORCEMENT_ACTIONS,
  DEFAULT_BUDGETS,
  createPerformanceBudgetMonitor
} from '../src/utils/performance-budget-monitor.js';

describe('Performance Optimization System - Task 6.7', () => {
  let optimizationSystem;
  let budgetMonitor;

  beforeEach(() => {
    jest.clearAllMocks();
    optimizationSystem = new PerformanceOptimizationSystem();
    budgetMonitor = new PerformanceBudgetMonitor();

    // Mock storage returns
    chrome.storage.local.get.mockResolvedValue({});
  });

  afterEach(() => {
    if (optimizationSystem) {
      optimizationSystem.stopMonitoring();
    }
    if (budgetMonitor) {
      budgetMonitor.stopMonitoring();
    }
  });

  describe('PerformanceOptimizationSystem', () => {
    test('should initialize with default configuration', async () => {
      const result = await optimizationSystem.initialize();

      expect(result).toBe(true);
      expect(optimizationSystem.isEnabled).toBe(true);
      expect(optimizationSystem.optimizationStrategies.size).toBeGreaterThan(0);
      expect(optimizationSystem.browserCapabilities.size).toBeGreaterThan(0);
    });

    test('should detect browser capabilities correctly', async () => {
      await optimizationSystem.detectBrowserCapabilities();

      expect(optimizationSystem.browserCapabilities.has(BROWSER_FEATURES.WEB_WORKERS)).toBe(true);
      expect(optimizationSystem.browserCapabilities.has(BROWSER_FEATURES.WEBASSEMBLY)).toBe(true);
      expect(optimizationSystem.browserCapabilities.has(BROWSER_FEATURES.INTERSECTION_OBSERVER)).toBe(true);
      expect(optimizationSystem.browserCapabilities.has(BROWSER_FEATURES.REQUEST_IDLE_CALLBACK)).toBe(true);
    });

    test('should setup optimization strategies based on capabilities', () => {
      optimizationSystem.setupOptimizationStrategies();

      const strategies = optimizationSystem.optimizationStrategies;
      expect(strategies.has(OPTIMIZATION_STRATEGIES.MEMORY_CLEANUP)).toBe(true);
      expect(strategies.has(OPTIMIZATION_STRATEGIES.CACHE_OPTIMIZATION)).toBe(true);
      expect(strategies.has(OPTIMIZATION_STRATEGIES.NETWORK_OPTIMIZATION)).toBe(true);

      // Check strategy configuration
      const memoryStrategy = strategies.get(OPTIMIZATION_STRATEGIES.MEMORY_CLEANUP);
      expect(memoryStrategy.enabled).toBe(true);
      expect(memoryStrategy.priority).toBe('high');
      expect(memoryStrategy.threshold).toBe(PERFORMANCE_THRESHOLDS.MEMORY_USAGE);
    });

    test('should start and stop monitoring correctly', () => {
      optimizationSystem.startMonitoring();
      expect(optimizationSystem.intervalId).not.toBeNull();

      optimizationSystem.stopMonitoring();
      expect(optimizationSystem.intervalId).toBeNull();
    });

    test('should collect performance metrics', async () => {
      await optimizationSystem.initialize();
      const metrics = await optimizationSystem.collectPerformanceMetrics();

      expect(metrics).toHaveProperty('timestamp');
      expect(metrics).toHaveProperty('memory');
      expect(metrics).toHaveProperty('network');
      expect(metrics).toHaveProperty('dom');
      expect(metrics).toHaveProperty('cache');
      expect(metrics.memory).toHaveProperty('currentUsage');
      expect(metrics.network).toHaveProperty('averageLatency');
    });

    test('should check performance budgets and detect violations', () => {
      const metrics = {
        memory: { currentUsage: 60 * 1024 * 1024 }, // 60MB - exceeds 50MB limit
        cache: { hitRatio: 0.5 }, // 50% - below 80% target
        loadTimes: { averageLoadTime: 4000 } // 4s - exceeds 3s limit
      };

      const violations = optimizationSystem.checkPerformanceBudgets(metrics);

      expect(violations.length).toBeGreaterThan(0);
      expect(violations.some(v => v.budget === 'MEMORY_LIMIT')).toBe(true);
      expect(violations.some(v => v.budget === 'CACHE_HIT_RATIO')).toBe(true);
      expect(violations.some(v => v.budget === 'INITIAL_LOAD_TIME')).toBe(true);
    });

    test('should apply optimization strategies when thresholds exceeded', async () => {
      const strategy = OPTIMIZATION_STRATEGIES.MEMORY_CLEANUP;
      const config = optimizationSystem.optimizationStrategies.get(strategy);
      const metrics = {
        memory: { memoryUtilization: 90 } // 90% - exceeds 80% threshold
      };

      const shouldOptimize = optimizationSystem.shouldApplyOptimization(strategy, metrics, []);
      expect(shouldOptimize).toBe(true);

      const result = await optimizationSystem.applyOptimizationStrategy(strategy, config, metrics);
      expect(result.strategy).toBe(OPTIMIZATION_STRATEGIES.MEMORY_CLEANUP);
      expect(result.success).toBe(true);
    });

    test('should optimize memory usage effectively', async () => {
      // Add some cache entries to clear
      optimizationSystem.cache.set('old_entry', { timestamp: Date.now() - 3700000 }); // Old entry

      const metrics = { memory: { memoryUtilization: 85 } };
      const result = await optimizationSystem.optimizeMemoryUsage(metrics);

      expect(result.strategy).toBe(OPTIMIZATION_STRATEGIES.MEMORY_CLEANUP);
      expect(result.success).toBe(true);
      expect(result.actions).toContain('memory_cleanup');
    });

    test('should optimize caching strategies', async () => {
      const metrics = { cache: { hitRatio: 0.5 } };
      const result = await optimizationSystem.optimizeCaching(metrics);

      expect(result.strategy).toBe(OPTIMIZATION_STRATEGIES.CACHE_OPTIMIZATION);
      expect(result.success).toBe(true);
      expect(result.actions.length).toBeGreaterThan(0);
    });

    test('should enable lazy loading when supported', async () => {
      // Mock DOM elements for lazy loading
      document.querySelectorAll.mockReturnValue([
        { dataset: { lazy: 'image1.jpg' } },
        { dataset: { lazy: 'image2.jpg' } }
      ]);

      const metrics = { loadTimes: { averageLoadTime: 3500 } };
      const result = await optimizationSystem.enableLazyLoading(metrics);

      expect(result.strategy).toBe(OPTIMIZATION_STRATEGIES.LAZY_LOADING);
      expect(result.success).toBe(true);
      expect(IntersectionObserver).toHaveBeenCalled();
    });

    test('should optimize network requests', async () => {
      const metrics = { network: { averageLatency: 1500 } };
      const result = await optimizationSystem.optimizeNetworkRequests(metrics);

      expect(result.strategy).toBe(OPTIMIZATION_STRATEGIES.NETWORK_OPTIMIZATION);
      expect(result.success).toBe(true);
    });

    test('should generate optimization report', async () => {
      await optimizationSystem.initialize();
      const report = await optimizationSystem.getOptimizationReport();

      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('currentMetrics');
      expect(report).toHaveProperty('budgetViolations');
      expect(report).toHaveProperty('browserCapabilities');
      expect(report).toHaveProperty('enabledStrategies');
      expect(report).toHaveProperty('recommendations');
    });

    test('should create factory function correctly', () => {
      const system = createPerformanceOptimizationSystem({ enabled: true });
      expect(system).toBeInstanceOf(PerformanceOptimizationSystem);
      expect(system.isEnabled).toBe(true);
    });
  });

  describe('ResourceManager', () => {
    let resourceManager;

    beforeEach(() => {
      resourceManager = new ResourceManager();
    });

    test('should get memory metrics', async () => {
      const metrics = await resourceManager.getMemoryMetrics();

      expect(metrics).toHaveProperty('usedJSHeapSize');
      expect(metrics).toHaveProperty('totalJSHeapSize');
      expect(metrics).toHaveProperty('memoryUtilization');
      expect(metrics).toHaveProperty('currentUsage');
      expect(typeof metrics.memoryUtilization).toBe('number');
    });

    test('should cleanup resources and return stats', async () => {
      // Add some mock resources
      resourceManager.resourceCache.set('old_resource', {
        timestamp: Date.now() - 2000000,
        lastAccessed: Date.now() - 1000000
      });

      const metrics = { memory: { memoryUtilization: 85 } };
      const result = await resourceManager.cleanup(metrics);

      expect(result).toHaveProperty('memoryFreed');
      expect(result).toHaveProperty('actions');
      expect(result.actions.length).toBeGreaterThan(0);
    });

    test('should clear old resources from cache', () => {
      const oldTimestamp = Date.now() - 2000000; // 2 hours ago
      resourceManager.resourceCache.set('old', { timestamp: oldTimestamp });
      resourceManager.resourceCache.set('new', { timestamp: Date.now() });

      resourceManager.clearOldResources();

      expect(resourceManager.resourceCache.has('old')).toBe(false);
      expect(resourceManager.resourceCache.has('new')).toBe(true);
    });
  });

  describe('NetworkOptimizer', () => {
    let networkOptimizer;

    beforeEach(() => {
      networkOptimizer = new NetworkOptimizer();
    });

    test('should get network metrics', async () => {
      // Add some mock request stats
      networkOptimizer.requestStats.set('req1', { latency: 200, success: true });
      networkOptimizer.requestStats.set('req2', { latency: 300, success: true });

      const metrics = await networkOptimizer.getNetworkMetrics();

      expect(metrics).toHaveProperty('totalRequests');
      expect(metrics).toHaveProperty('averageLatency');
      expect(metrics).toHaveProperty('successRate');
      expect(metrics.averageLatency).toBe(250); // (200 + 300) / 2
      expect(metrics.successRate).toBe(1); // 100% success
    });

    test('should optimize network requests', async () => {
      // Add requests to queue
      for (let i = 0; i < 15; i++) {
        networkOptimizer.requestQueue.push({ id: i, priority: 'normal' });
      }

      const metrics = { network: { averageLatency: 1200 } };
      const result = await networkOptimizer.optimize(metrics);

      expect(result).toHaveProperty('actions');
      expect(result).toHaveProperty('requestsOptimized');
      expect(result.actions).toContain('request_batching');
      expect(result.requestsOptimized).toBe(15);
    });
  });

  describe('MemoryManager', () => {
    let memoryManager;

    beforeEach(() => {
      memoryManager = new MemoryManager();
    });

    test('should get memory metrics with pressure calculation', async () => {
      const metrics = await memoryManager.getMemoryMetrics();

      expect(metrics).toHaveProperty('usedJSHeapSize');
      expect(metrics).toHaveProperty('memoryUtilization');
      expect(metrics).toHaveProperty('memoryPressure');
      expect(['low', 'medium', 'high', 'critical']).toContain(metrics.memoryPressure);
    });

    test('should calculate memory pressure correctly', () => {
      const lowPressure = memoryManager.calculateMemoryPressure({
        usedJSHeapSize: 10000000,
        totalJSHeapSize: 50000000
      });
      expect(lowPressure).toBe('low');

      const highPressure = memoryManager.calculateMemoryPressure({
        usedJSHeapSize: 45000000,
        totalJSHeapSize: 50000000
      });
      expect(highPressure).toBe('critical');
    });

    test('should cleanup memory using multiple strategies', async () => {
      const metrics = { memory: { memoryUtilization: 85 } };
      const result = await memoryManager.cleanup(metrics);

      expect(result).toHaveProperty('memoryFreed');
      expect(result).toHaveProperty('actions');
      expect(result.actions.length).toBe(4); // All 4 cleanup strategies
      expect(result.memoryFreed).toBeGreaterThan(0);
    });
  });

  describe('PerformanceBudgetMonitor', () => {
    test('should initialize with default budgets', async () => {
      const result = await budgetMonitor.initialize();

      expect(result).toBe(true);
      expect(budgetMonitor.budgets).toHaveProperty(BUDGET_CATEGORIES.LOAD_TIME);
      expect(budgetMonitor.budgets).toHaveProperty(BUDGET_CATEGORIES.MEMORY_USAGE);
      expect(budgetMonitor.budgets).toHaveProperty(BUDGET_CATEGORIES.ERROR_RATE);
    });

    test('should setup performance observers when supported', () => {
      budgetMonitor.setupPerformanceObservers();
      expect(PerformanceObserver).toHaveBeenCalled();
    });

    test('should start and stop monitoring', () => {
      budgetMonitor.startMonitoring();
      expect(budgetMonitor.monitoringActive).toBe(true);
      expect(budgetMonitor.intervalId).not.toBeNull();

      budgetMonitor.stopMonitoring();
      expect(budgetMonitor.monitoringActive).toBe(false);
      expect(budgetMonitor.intervalId).toBeNull();
    });

    test('should evaluate budget violations correctly', () => {
      const budget = DEFAULT_BUDGETS[BUDGET_CATEGORIES.LOAD_TIME];

      // Test violation
      const violation = budgetMonitor.evaluateBudgetViolation(
        BUDGET_CATEGORIES.LOAD_TIME,
        3500, // 3.5 seconds - exceeds 3 second limit
        budget
      );

      expect(violation).not.toBeNull();
      expect(violation.category).toBe(BUDGET_CATEGORIES.LOAD_TIME);
      expect(violation.violationType).toBe('limit');
      expect(violation.severity).toBe(VIOLATION_SEVERITY.HIGH);

      // Test warning
      const warning = budgetMonitor.evaluateBudgetViolation(
        BUDGET_CATEGORIES.LOAD_TIME,
        2700, // 2.7 seconds - exceeds warning threshold
        budget
      );

      expect(warning).not.toBeNull();
      expect(warning.violationType).toBe('warning');
      expect(warning.severity).toBe(VIOLATION_SEVERITY.LOW);

      // Test no violation
      const noViolation = budgetMonitor.evaluateBudgetViolation(
        BUDGET_CATEGORIES.LOAD_TIME,
        2000, // 2 seconds - within limits
        budget
      );

      expect(noViolation).toBeNull();
    });

    test('should handle inverted budgets (cache performance)', () => {
      const budget = DEFAULT_BUDGETS[BUDGET_CATEGORIES.CACHE_PERFORMANCE];

      // Low cache hit ratio should trigger violation
      const violation = budgetMonitor.evaluateBudgetViolation(
        BUDGET_CATEGORIES.CACHE_PERFORMANCE,
        0.7, // 70% - below 80% limit
        budget
      );

      expect(violation).not.toBeNull();
      expect(violation.violationType).toBe('limit');
    });

    test('should check budget and trigger violations', () => {
      const mockCallback = jest.fn();
      budgetMonitor.onBudgetViolation(BUDGET_CATEGORIES.LOAD_TIME, mockCallback);

      budgetMonitor.checkBudget(BUDGET_CATEGORIES.LOAD_TIME, 3500);

      expect(budgetMonitor.currentViolations.has(BUDGET_CATEGORIES.LOAD_TIME)).toBe(true);
      expect(mockCallback).toHaveBeenCalled();
    });

    test('should clear violations when values return to normal', () => {
      // First trigger a violation
      budgetMonitor.checkBudget(BUDGET_CATEGORIES.LOAD_TIME, 3500);
      expect(budgetMonitor.currentViolations.has(BUDGET_CATEGORIES.LOAD_TIME)).toBe(true);

      // Then return to normal
      budgetMonitor.checkBudget(BUDGET_CATEGORIES.LOAD_TIME, 2000);
      expect(budgetMonitor.currentViolations.has(BUDGET_CATEGORIES.LOAD_TIME)).toBe(false);
    });

    test('should update and persist budget configuration', async () => {
      await budgetMonitor.updateBudget(BUDGET_CATEGORIES.LOAD_TIME, {
        limit: 4000,
        warningThreshold: 3500
      });

      const loadTimeBudget = budgetMonitor.budgets[BUDGET_CATEGORIES.LOAD_TIME];
      expect(loadTimeBudget.limit).toBe(4000);
      expect(loadTimeBudget.warningThreshold).toBe(3500);
      expect(chrome.storage.local.set).toHaveBeenCalled();
    });

    test('should generate comprehensive budget report', () => {
      // Add some violation history
      budgetMonitor.violationHistory.push({
        category: BUDGET_CATEGORIES.LOAD_TIME,
        timestamp: Date.now(),
        severity: VIOLATION_SEVERITY.HIGH
      });

      const report = budgetMonitor.getBudgetReport();

      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('budgets');
      expect(report).toHaveProperty('violationsByCategory');
      expect(report).toHaveProperty('violationTrends');
      expect(report).toHaveProperty('recommendations');
    });

    test('should create factory function correctly', () => {
      const monitor = createPerformanceBudgetMonitor({ enabled: true });
      expect(monitor).toBeInstanceOf(PerformanceBudgetMonitor);
      expect(monitor.isEnabled).toBe(true);
    });
  });

  describe('BudgetMetricsCollector', () => {
    let metricsCollector;

    beforeEach(() => {
      metricsCollector = new BudgetMetricsCollector();
    });

    test('should collect all performance metrics', async () => {
      const metrics = await metricsCollector.collectAllMetrics();

      expect(metrics).toHaveProperty(BUDGET_CATEGORIES.LOAD_TIME);
      expect(metrics).toHaveProperty(BUDGET_CATEGORIES.MEMORY_USAGE);
      expect(metrics).toHaveProperty(BUDGET_CATEGORIES.NETWORK_REQUESTS);
      expect(metrics).toHaveProperty(BUDGET_CATEGORIES.ERROR_RATE);
      expect(metrics).toHaveProperty(BUDGET_CATEGORIES.CACHE_PERFORMANCE);
    });

    test('should collect load time from performance timing', async () => {
      const loadTime = await metricsCollector.collectLoadTime();
      expect(loadTime).toBe(2000); // loadEventEnd - navigationStart
    });

    test('should collect memory usage', async () => {
      const memoryUsage = await metricsCollector.collectMemoryUsage();
      expect(memoryUsage).toBe(10000000); // usedJSHeapSize
    });

    test('should handle missing performance APIs gracefully', async () => {
      // Temporarily remove performance.memory
      const originalMemory = performance.memory;
      delete performance.memory;

      const memoryUsage = await metricsCollector.collectMemoryUsage();
      expect(memoryUsage).toBe(0);

      // Restore
      performance.memory = originalMemory;
    });
  });

  describe('BudgetEnforcementEngine', () => {
    let enforcementEngine;

    beforeEach(() => {
      enforcementEngine = new BudgetEnforcementEngine(budgetMonitor);
    });

    test('should enforce different violation actions', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();

      const violation = {
        category: BUDGET_CATEGORIES.LOAD_TIME,
        currentValue: 3500,
        limit: 3000,
        enforcementAction: ENFORCEMENT_ACTIONS.WARN
      };

      await enforcementEngine.enforceViolation(violation);

      expect(consoleSpy).toHaveBeenCalled();
      expect(enforcementEngine.enforcementHistory.length).toBe(1);

      consoleSpy.mockRestore();
      errorSpy.mockRestore();
    });

    test('should throttle when enforcement action is throttle', async () => {
      const violation = {
        category: BUDGET_CATEGORIES.NETWORK_REQUESTS,
        enforcementAction: ENFORCEMENT_ACTIONS.THROTTLE
      };

      await enforcementEngine.executeThrottleAction(violation);

      expect(enforcementEngine.isThrottled(BUDGET_CATEGORIES.NETWORK_REQUESTS)).toBe(true);
    });

    test('should track enforcement statistics', () => {
      // Add some enforcement history
      enforcementEngine.recordEnforcementAction(
        { category: 'test' },
        ENFORCEMENT_ACTIONS.WARN
      );

      const stats = enforcementEngine.getEnforcementStats();

      expect(stats).toHaveProperty('totalEnforcements');
      expect(stats).toHaveProperty('actionCounts');
      expect(stats).toHaveProperty('activeThrottles');
      expect(stats.totalEnforcements).toBe(1);
      expect(stats.actionCounts[ENFORCEMENT_ACTIONS.WARN]).toBe(1);
    });
  });

  describe('Integration Tests', () => {
    test('should integrate optimization system with budget monitor', async () => {
      // Initialize both systems
      await optimizationSystem.initialize();
      await budgetMonitor.initialize();

      // Connect them
      budgetMonitor.optimizationSystem = optimizationSystem;

      // Trigger a budget violation that should trigger optimization
      budgetMonitor.checkBudget(BUDGET_CATEGORIES.MEMORY_USAGE, 60 * 1024 * 1024);

      expect(budgetMonitor.currentViolations.size).toBeGreaterThan(0);
    });

    test('should handle performance optimization workflow end-to-end', async () => {
      await optimizationSystem.initialize();

      // Simulate performance check
      await optimizationSystem.performOptimizationCheck();

      // Verify optimization was attempted
      expect(optimizationSystem.optimizationHistory.length).toBeGreaterThan(0);
    });

    test('should persist and restore optimization state', async () => {
      await optimizationSystem.initialize();

      // Add some optimization history
      optimizationSystem.optimizationHistory.push({
        timestamp: Date.now(),
        strategy: OPTIMIZATION_STRATEGIES.MEMORY_CLEANUP,
        success: true
      });

      await optimizationSystem.saveOptimizationHistory();
      expect(chrome.storage.local.set).toHaveBeenCalled();

      // Test loading
      chrome.storage.local.get.mockResolvedValueOnce({
        performance: {
          optimizationHistory: [{ test: 'data' }]
        }
      });

      await optimizationSystem.loadOptimizationHistory();
      expect(optimizationSystem.optimizationHistory).toContainEqual({ test: 'data' });
    });
  });

  describe('Error Handling', () => {
    test('should handle initialization errors gracefully', async () => {
      const faultySystem = new PerformanceOptimizationSystem();

      // Mock an error in detectBrowserCapabilities
      jest.spyOn(faultySystem, 'detectBrowserCapabilities').mockRejectedValue(new Error('Test error'));

      const result = await faultySystem.initialize();
      expect(result).toBe(false);
    });

    test('should handle optimization strategy errors', async () => {
      await optimizationSystem.initialize();

      // Mock strategy to throw error
      const strategy = OPTIMIZATION_STRATEGIES.MEMORY_CLEANUP;
      const config = optimizationSystem.optimizationStrategies.get(strategy);
      jest.spyOn(optimizationSystem, 'optimizeMemoryUsage').mockRejectedValue(new Error('Optimization failed'));

      const result = await optimizationSystem.applyOptimizationStrategy(strategy, config, {});
      expect(result.success).toBe(false);
      expect(result.error).toBe('Optimization failed');
    });

    test('should handle budget monitor errors during enforcement', async () => {
      const enforcementEngine = new BudgetEnforcementEngine(budgetMonitor);

      const violation = {
        category: BUDGET_CATEGORIES.LOAD_TIME,
        enforcementAction: 'invalid_action'
      };

      // Should not throw, but handle gracefully
      await expect(enforcementEngine.enforceViolation(violation)).resolves.not.toThrow();
    });
  });

  describe('Performance and Memory Tests', () => {
    test('should not leak memory during continuous monitoring', async () => {
      await optimizationSystem.initialize();

      const initialHistoryLength = optimizationSystem.optimizationHistory.length;

      // Simulate many optimization cycles
      for (let i = 0; i < 200; i++) {
        optimizationSystem.updateOptimizationHistory({}, []);
      }

      // Should maintain bounded history
      expect(optimizationSystem.optimizationHistory.length).toBeLessThanOrEqual(50);
    });

    test('should handle large numbers of budget violations efficiently', () => {
      // Add many violations
      for (let i = 0; i < 2000; i++) {
        budgetMonitor.violationHistory.push({
          timestamp: Date.now() - i * 1000,
          category: BUDGET_CATEGORIES.LOAD_TIME
        });
      }

      budgetMonitor.updateViolationTracking();

      // Should clean up old violations
      const oldViolations = budgetMonitor.violationHistory.filter(v =>
        v.timestamp < Date.now() - 7 * 24 * 60 * 60 * 1000);
      expect(oldViolations.length).toBe(0);
    });

    test('should optimize cache operations under load', () => {
      // Fill cache with many entries
      for (let i = 0; i < 500; i++) {
        optimizationSystem.cache.set(`item_${i}`, {
          data: `data_${i}`,
          timestamp: Date.now() - (i * 1000),
          accessCount: Math.floor(Math.random() * 10)
        });
      }

      optimizationSystem.optimizeCacheEviction();

      // Should maintain reasonable cache size
      expect(optimizationSystem.cache.size).toBeLessThanOrEqual(100);
    });
  });

  describe('Browser Compatibility', () => {
    test('should work without modern APIs', async () => {
      // Remove modern APIs
      delete global.PerformanceObserver;
      delete global.IntersectionObserver;
      delete global.requestIdleCallback;

      const compatSystem = new PerformanceOptimizationSystem();
      const result = await compatSystem.initialize();

      expect(result).toBe(true);
      expect(compatSystem.browserCapabilities.get(BROWSER_FEATURES.PERFORMANCE_OBSERVER)).toBe(false);
      expect(compatSystem.browserCapabilities.get(BROWSER_FEATURES.INTERSECTION_OBSERVER)).toBe(false);
    });

    test('should adapt optimization strategies based on capabilities', () => {
      optimizationSystem.browserCapabilities.set(BROWSER_FEATURES.INTERSECTION_OBSERVER, false);
      optimizationSystem.setupOptimizationStrategies();

      const lazyLoadStrategy = optimizationSystem.optimizationStrategies.get(
        OPTIMIZATION_STRATEGIES.LAZY_LOADING
      );
      expect(lazyLoadStrategy.enabled).toBe(false);
    });
  });
});

// Additional test utilities
export function createMockPerformanceEntry(type, name, startTime) {
  return {
    entryType: type,
    name,
    startTime,
    duration: 100
  };
}

export function createMockViolation(category, currentValue, limit) {
  return {
    category,
    currentValue,
    limit,
    severity: VIOLATION_SEVERITY.HIGH,
    violationType: 'limit',
    timestamp: Date.now(),
    unit: 'ms',
    enforcementAction: ENFORCEMENT_ACTIONS.OPTIMIZE
  };
}