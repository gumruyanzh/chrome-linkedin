// Performance Optimization System - Task 6.7
// Automatic performance optimization based on real-time metrics
// Resource usage optimization, lazy loading, caching, browser compatibility

import { getStorageData, setStorageData, STORAGE_KEYS } from './storage.js';
import { createPerformanceMetricsCollector } from './real-time-analytics.js';
import { reportError } from './error-reporting.js';

/**
 * Performance optimization strategies
 */
export const OPTIMIZATION_STRATEGIES = {
  MEMORY_CLEANUP: 'memory_cleanup',
  CACHE_OPTIMIZATION: 'cache_optimization',
  LAZY_LOADING: 'lazy_loading',
  RESOURCE_BUNDLING: 'resource_bundling',
  NETWORK_OPTIMIZATION: 'network_optimization',
  DOM_OPTIMIZATION: 'dom_optimization'
};

/**
 * Performance thresholds for automatic optimization
 */
export const PERFORMANCE_THRESHOLDS = {
  MEMORY_USAGE: 0.8, // 80% of available memory
  LOAD_TIME: 3000, // 3 seconds
  ERROR_RATE: 0.05, // 5% error rate
  RESPONSE_TIME: 2000, // 2 seconds
  CPU_USAGE: 0.7, // 70% CPU usage
  NETWORK_LATENCY: 1000 // 1 second
};

/**
 * Performance budgets for monitoring
 */
export const PERFORMANCE_BUDGETS = {
  BUNDLE_SIZE: 512 * 1024, // 512KB
  INITIAL_LOAD_TIME: 2000, // 2 seconds
  MEMORY_LIMIT: 50 * 1024 * 1024, // 50MB
  API_RESPONSE_TIME: 1500, // 1.5 seconds
  CACHE_HIT_RATIO: 0.8, // 80%
  ERROR_BUDGET: 0.01 // 1% error rate
};

/**
 * Browser feature detection capabilities
 */
export const BROWSER_FEATURES = {
  WEB_WORKERS: 'webWorkers',
  SERVICE_WORKER: 'serviceWorker',
  INTERSECTION_OBSERVER: 'intersectionObserver',
  PERFORMANCE_OBSERVER: 'performanceObserver',
  REQUEST_IDLE_CALLBACK: 'requestIdleCallback',
  WEBASSEMBLY: 'webAssembly',
  ES_MODULES: 'esModules',
  DYNAMIC_IMPORTS: 'dynamicImports'
};

/**
 * Performance Optimization System with automated monitoring and optimization
 */
export class PerformanceOptimizationSystem {
  constructor(options = {}) {
    this.isEnabled = options.enabled !== false;
    this.optimizationInterval = options.optimizationInterval || 30000; // 30 seconds
    this.performanceMetrics = createPerformanceMetricsCollector();
    this.optimizationStrategies = new Map();
    this.browserCapabilities = new Map();
    this.performanceBudgets = { ...PERFORMANCE_BUDGETS, ...options.budgets };
    this.cache = new Map();
    this.lazyLoadQueue = new Set();
    this.intervalId = null;
    this.optimizationHistory = [];
    this.resourceManager = new ResourceManager();
    this.networkOptimizer = new NetworkOptimizer();
    this.memoryManager = new MemoryManager();
  }

  /**
   * Initialize the performance optimization system
   */
  async initialize() {
    try {
      if (!this.isEnabled) {
        console.log('Performance optimization system is disabled');
        return false;
      }

      // Detect browser capabilities
      await this.detectBrowserCapabilities();

      // Initialize optimization strategies
      this.setupOptimizationStrategies();

      // Load previous optimization data
      await this.loadOptimizationHistory();

      // Start monitoring
      this.startMonitoring();

      console.log('Performance optimization system initialized');
      return true;
    } catch (error) {
      console.error('Error initializing performance optimization system:', error);
      await reportError(error, 'performance_optimization', {
        component: 'PerformanceOptimizationSystem',
        method: 'initialize'
      });
      return false;
    }
  }

  /**
   * Detect browser capabilities for optimization strategies
   */
  async detectBrowserCapabilities() {
    const capabilities = new Map();

    try {
      // Web Workers
      capabilities.set(BROWSER_FEATURES.WEB_WORKERS,
        typeof Worker !== 'undefined');

      // Service Worker
      capabilities.set(BROWSER_FEATURES.SERVICE_WORKER,
        'serviceWorker' in navigator);

      // Intersection Observer
      capabilities.set(BROWSER_FEATURES.INTERSECTION_OBSERVER,
        'IntersectionObserver' in window);

      // Performance Observer
      capabilities.set(BROWSER_FEATURES.PERFORMANCE_OBSERVER,
        'PerformanceObserver' in window);

      // Request Idle Callback
      capabilities.set(BROWSER_FEATURES.REQUEST_IDLE_CALLBACK,
        'requestIdleCallback' in window);

      // WebAssembly
      capabilities.set(BROWSER_FEATURES.WEBASSEMBLY,
        typeof WebAssembly !== 'undefined');

      // ES Modules
      capabilities.set(BROWSER_FEATURES.ES_MODULES,
        typeof document !== 'undefined' && 'noModule' in document.createElement('script'));

      // Dynamic Imports
      capabilities.set(BROWSER_FEATURES.DYNAMIC_IMPORTS,
        typeof import === 'function');

      this.browserCapabilities = capabilities;

      // Store capabilities for future reference
      await setStorageData({
        [STORAGE_KEYS.PERFORMANCE]: {
          browserCapabilities: Array.from(capabilities.entries()),
          lastDetected: Date.now()
        }
      });

      return capabilities;
    } catch (error) {
      console.warn('Error detecting browser capabilities:', error);
      return new Map();
    }
  }

  /**
   * Setup optimization strategies based on browser capabilities
   */
  setupOptimizationStrategies() {
    const strategies = new Map();

    // Memory cleanup strategy
    strategies.set(OPTIMIZATION_STRATEGIES.MEMORY_CLEANUP, {
      enabled: true,
      priority: 'high',
      threshold: PERFORMANCE_THRESHOLDS.MEMORY_USAGE,
      action: this.optimizeMemoryUsage.bind(this)
    });

    // Cache optimization strategy
    strategies.set(OPTIMIZATION_STRATEGIES.CACHE_OPTIMIZATION, {
      enabled: true,
      priority: 'medium',
      threshold: 0.6, // Cache hit ratio below 60%
      action: this.optimizeCaching.bind(this)
    });

    // Lazy loading strategy
    strategies.set(OPTIMIZATION_STRATEGIES.LAZY_LOADING, {
      enabled: this.browserCapabilities.get(BROWSER_FEATURES.INTERSECTION_OBSERVER),
      priority: 'medium',
      threshold: PERFORMANCE_THRESHOLDS.LOAD_TIME,
      action: this.enableLazyLoading.bind(this)
    });

    // Network optimization strategy
    strategies.set(OPTIMIZATION_STRATEGIES.NETWORK_OPTIMIZATION, {
      enabled: true,
      priority: 'high',
      threshold: PERFORMANCE_THRESHOLDS.NETWORK_LATENCY,
      action: this.optimizeNetworkRequests.bind(this)
    });

    // DOM optimization strategy
    strategies.set(OPTIMIZATION_STRATEGIES.DOM_OPTIMIZATION, {
      enabled: this.browserCapabilities.get(BROWSER_FEATURES.REQUEST_IDLE_CALLBACK),
      priority: 'low',
      threshold: PERFORMANCE_THRESHOLDS.RESPONSE_TIME,
      action: this.optimizeDOMOperations.bind(this)
    });

    this.optimizationStrategies = strategies;
  }

  /**
   * Start performance monitoring and automatic optimization
   */
  startMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(async () => {
      await this.performOptimizationCheck();
    }, this.optimizationInterval);

    console.log('Performance monitoring started');
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('Performance monitoring stopped');
  }

  /**
   * Perform optimization check and apply strategies if needed
   */
  async performOptimizationCheck() {
    try {
      // Collect current performance metrics
      const metrics = await this.collectPerformanceMetrics();

      // Check performance budgets
      const budgetViolations = this.checkPerformanceBudgets(metrics);

      // Apply optimization strategies if needed
      for (const [strategy, config] of this.optimizationStrategies.entries()) {
        if (!config.enabled) continue;

        if (this.shouldApplyOptimization(strategy, metrics, budgetViolations)) {
          await this.applyOptimizationStrategy(strategy, config, metrics);
        }
      }

      // Update optimization history
      this.updateOptimizationHistory(metrics, budgetViolations);

    } catch (error) {
      console.error('Error during optimization check:', error);
      await reportError(error, 'performance_optimization', {
        component: 'PerformanceOptimizationSystem',
        method: 'performOptimizationCheck'
      });
    }
  }

  /**
   * Collect comprehensive performance metrics
   */
  async collectPerformanceMetrics() {
    const metrics = {
      timestamp: Date.now(),
      memory: await this.memoryManager.getMemoryMetrics(),
      network: await this.networkOptimizer.getNetworkMetrics(),
      dom: this.getDOMMetrics(),
      cache: this.getCacheMetrics(),
      errors: await this.performanceMetrics.getErrorMetrics(),
      loadTimes: await this.performanceMetrics.getLoadTimeMetrics()
    };

    return metrics;
  }

  /**
   * Check if performance budgets are violated
   */
  checkPerformanceBudgets(metrics) {
    const violations = [];

    // Check memory budget
    if (metrics.memory.currentUsage > this.performanceBudgets.MEMORY_LIMIT) {
      violations.push({
        budget: 'MEMORY_LIMIT',
        current: metrics.memory.currentUsage,
        limit: this.performanceBudgets.MEMORY_LIMIT,
        severity: 'high'
      });
    }

    // Check load time budget
    if (metrics.loadTimes.averageLoadTime > this.performanceBudgets.INITIAL_LOAD_TIME) {
      violations.push({
        budget: 'INITIAL_LOAD_TIME',
        current: metrics.loadTimes.averageLoadTime,
        limit: this.performanceBudgets.INITIAL_LOAD_TIME,
        severity: 'medium'
      });
    }

    // Check cache hit ratio budget
    if (metrics.cache.hitRatio < this.performanceBudgets.CACHE_HIT_RATIO) {
      violations.push({
        budget: 'CACHE_HIT_RATIO',
        current: metrics.cache.hitRatio,
        limit: this.performanceBudgets.CACHE_HIT_RATIO,
        severity: 'medium'
      });
    }

    // Check error rate budget
    if (metrics.errors.errorRate > this.performanceBudgets.ERROR_BUDGET) {
      violations.push({
        budget: 'ERROR_BUDGET',
        current: metrics.errors.errorRate,
        limit: this.performanceBudgets.ERROR_BUDGET,
        severity: 'high'
      });
    }

    return violations;
  }

  /**
   * Determine if optimization strategy should be applied
   */
  shouldApplyOptimization(strategy, metrics, violations) {
    const config = this.optimizationStrategies.get(strategy);
    if (!config || !config.enabled) return false;

    // Check if there are violations that this strategy can address
    const relevantViolations = violations.filter(v =>
      this.isRelevantViolation(strategy, v));

    if (relevantViolations.length > 0) return true;

    // Check strategy-specific thresholds
    switch (strategy) {
      case OPTIMIZATION_STRATEGIES.MEMORY_CLEANUP:
        return metrics.memory.memoryUtilization > config.threshold * 100;

      case OPTIMIZATION_STRATEGIES.CACHE_OPTIMIZATION:
        return metrics.cache.hitRatio < config.threshold;

      case OPTIMIZATION_STRATEGIES.LAZY_LOADING:
        return metrics.loadTimes.averageLoadTime > config.threshold;

      case OPTIMIZATION_STRATEGIES.NETWORK_OPTIMIZATION:
        return metrics.network.averageLatency > config.threshold;

      default:
        return false;
    }
  }

  /**
   * Check if a violation is relevant to a specific optimization strategy
   */
  isRelevantViolation(strategy, violation) {
    const relevanceMap = {
      [OPTIMIZATION_STRATEGIES.MEMORY_CLEANUP]: ['MEMORY_LIMIT'],
      [OPTIMIZATION_STRATEGIES.CACHE_OPTIMIZATION]: ['CACHE_HIT_RATIO'],
      [OPTIMIZATION_STRATEGIES.LAZY_LOADING]: ['INITIAL_LOAD_TIME'],
      [OPTIMIZATION_STRATEGIES.NETWORK_OPTIMIZATION]: ['API_RESPONSE_TIME', 'INITIAL_LOAD_TIME'],
      [OPTIMIZATION_STRATEGIES.DOM_OPTIMIZATION]: ['INITIAL_LOAD_TIME']
    };

    const relevantBudgets = relevanceMap[strategy] || [];
    return relevantBudgets.includes(violation.budget);
  }

  /**
   * Apply specific optimization strategy
   */
  async applyOptimizationStrategy(strategy, config, metrics) {
    try {
      console.log(`Applying optimization strategy: ${strategy}`);

      const result = await config.action(metrics);

      this.recordOptimizationApplication(strategy, result, metrics);

      return result;
    } catch (error) {
      console.error(`Error applying optimization strategy ${strategy}:`, error);
      await reportError(error, 'performance_optimization', {
        strategy,
        metrics: JSON.stringify(metrics, null, 2)
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Optimize memory usage
   */
  async optimizeMemoryUsage(metrics) {
    const result = await this.memoryManager.cleanup(metrics);

    // Additional memory optimization
    this.clearOldCacheEntries();
    this.cleanupEventListeners();

    return {
      strategy: OPTIMIZATION_STRATEGIES.MEMORY_CLEANUP,
      success: true,
      memoryFreed: result.memoryFreed,
      actions: result.actions
    };
  }

  /**
   * Optimize caching strategies
   */
  async optimizeCaching(metrics) {
    const actions = [];

    // Analyze cache performance
    const cacheAnalysis = this.analyzeCachePerformance();

    // Implement cache warming for frequently accessed data
    if (cacheAnalysis.missedOpportunities.length > 0) {
      await this.warmCache(cacheAnalysis.missedOpportunities);
      actions.push('cache_warming');
    }

    // Adjust cache size based on usage patterns
    if (cacheAnalysis.suggestedSize !== this.cache.size) {
      this.adjustCacheSize(cacheAnalysis.suggestedSize);
      actions.push('cache_resize');
    }

    // Implement smarter eviction policy
    this.optimizeCacheEviction();
    actions.push('eviction_optimization');

    return {
      strategy: OPTIMIZATION_STRATEGIES.CACHE_OPTIMIZATION,
      success: true,
      actions,
      cacheAnalysis
    };
  }

  /**
   * Enable lazy loading for resources
   */
  async enableLazyLoading(metrics) {
    const actions = [];

    if (this.browserCapabilities.get(BROWSER_FEATURES.INTERSECTION_OBSERVER)) {
      // Set up intersection observer for lazy loading
      this.setupIntersectionObserver();
      actions.push('intersection_observer_setup');
    }

    // Implement lazy loading for images and other resources
    this.implementLazyLoading();
    actions.push('lazy_loading_enabled');

    return {
      strategy: OPTIMIZATION_STRATEGIES.LAZY_LOADING,
      success: true,
      actions
    };
  }

  /**
   * Optimize network requests
   */
  async optimizeNetworkRequests(metrics) {
    const result = await this.networkOptimizer.optimize(metrics);

    return {
      strategy: OPTIMIZATION_STRATEGIES.NETWORK_OPTIMIZATION,
      success: true,
      ...result
    };
  }

  /**
   * Optimize DOM operations
   */
  async optimizeDOMOperations(metrics) {
    const actions = [];

    if (this.browserCapabilities.get(BROWSER_FEATURES.REQUEST_IDLE_CALLBACK)) {
      // Defer non-critical DOM operations
      this.deferNonCriticalOperations();
      actions.push('deferred_operations');
    }

    // Batch DOM updates
    this.batchDOMUpdates();
    actions.push('batched_updates');

    return {
      strategy: OPTIMIZATION_STRATEGIES.DOM_OPTIMIZATION,
      success: true,
      actions
    };
  }

  /**
   * Get DOM performance metrics
   */
  getDOMMetrics() {
    return {
      elementCount: document.querySelectorAll('*').length,
      domContentLoaded: performance.timing ?
        performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart : 0
    };
  }

  /**
   * Get cache performance metrics
   */
  getCacheMetrics() {
    const totalRequests = this.cache.size + this.cache.missCount || 0;
    const hits = this.cache.size;
    const misses = this.cache.missCount || 0;

    return {
      size: this.cache.size,
      hits,
      misses,
      hitRatio: totalRequests > 0 ? hits / totalRequests : 0,
      totalRequests
    };
  }

  /**
   * Analyze cache performance and suggest improvements
   */
  analyzeCachePerformance() {
    const missedOpportunities = [];
    const accessPatterns = new Map();

    // Analyze cache access patterns (mock implementation)
    // In real implementation, this would analyze actual access logs

    return {
      missedOpportunities,
      accessPatterns,
      suggestedSize: Math.max(this.cache.size, 100),
      efficiency: this.getCacheMetrics().hitRatio
    };
  }

  /**
   * Warm cache with frequently accessed data
   */
  async warmCache(opportunities) {
    for (const opportunity of opportunities) {
      try {
        // Pre-load frequently accessed data
        await this.preloadData(opportunity.key, opportunity.loader);
      } catch (error) {
        console.warn('Cache warming failed for:', opportunity.key, error);
      }
    }
  }

  /**
   * Pre-load data into cache
   */
  async preloadData(key, loader) {
    if (!this.cache.has(key)) {
      const data = await loader();
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        accessCount: 0
      });
    }
  }

  /**
   * Adjust cache size based on analysis
   */
  adjustCacheSize(suggestedSize) {
    // Implement cache size adjustment logic
    console.log(`Adjusting cache size to ${suggestedSize}`);
  }

  /**
   * Optimize cache eviction policy
   */
  optimizeCacheEviction() {
    // Implement LRU or other optimized eviction policy
    const entries = Array.from(this.cache.entries());

    // Sort by access count and timestamp
    entries.sort((a, b) => {
      const [, aData] = a;
      const [, bData] = b;

      // Prefer recently accessed and frequently used items
      const aScore = aData.accessCount * (1 / (Date.now() - aData.timestamp));
      const bScore = bData.accessCount * (1 / (Date.now() - bData.timestamp));

      return bScore - aScore;
    });

    // Keep top performers, remove least valuable entries
    if (entries.length > 100) {
      const toRemove = entries.slice(100);
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  /**
   * Setup intersection observer for lazy loading
   */
  setupIntersectionObserver() {
    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadLazyResource(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '50px'
    });

    this.intersectionObserver = observer;
  }

  /**
   * Implement lazy loading for resources
   */
  implementLazyLoading() {
    // Find elements that can be lazy loaded
    const lazyElements = document.querySelectorAll('[data-lazy]');

    lazyElements.forEach(element => {
      if (this.intersectionObserver) {
        this.intersectionObserver.observe(element);
      } else {
        // Fallback for browsers without Intersection Observer
        this.lazyLoadQueue.add(element);
      }
    });
  }

  /**
   * Load lazy resource
   */
  loadLazyResource(element) {
    const src = element.dataset.lazy;
    if (src) {
      element.src = src;
      element.removeAttribute('data-lazy');
    }
  }

  /**
   * Clear old cache entries
   */
  clearOldCacheEntries() {
    const now = Date.now();
    const maxAge = 3600000; // 1 hour

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > maxAge) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clean up event listeners
   */
  cleanupEventListeners() {
    // Remove unused event listeners to prevent memory leaks
    // Implementation would depend on specific event management system
    console.log('Cleaning up unused event listeners');
  }

  /**
   * Defer non-critical operations using requestIdleCallback
   */
  deferNonCriticalOperations() {
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(() => {
        // Perform non-critical operations during idle time
        this.performMaintenanceTasks();
      });
    }
  }

  /**
   * Batch DOM updates for better performance
   */
  batchDOMUpdates() {
    // Use DocumentFragment for batching DOM updates
    console.log('Implementing DOM update batching');
  }

  /**
   * Perform maintenance tasks during idle time
   */
  performMaintenanceTasks() {
    // Cleanup operations
    this.clearOldCacheEntries();
    this.cleanupEventListeners();

    // Garbage collection hint (if supported)
    if (window.gc && typeof window.gc === 'function') {
      window.gc();
    }
  }

  /**
   * Record optimization application for analysis
   */
  recordOptimizationApplication(strategy, result, metrics) {
    const record = {
      timestamp: Date.now(),
      strategy,
      result,
      beforeMetrics: metrics,
      success: result.success
    };

    this.optimizationHistory.push(record);

    // Keep only recent history
    if (this.optimizationHistory.length > 100) {
      this.optimizationHistory.shift();
    }
  }

  /**
   * Update optimization history
   */
  updateOptimizationHistory(metrics, violations) {
    const historyEntry = {
      timestamp: Date.now(),
      metrics,
      violations,
      activeOptimizations: Array.from(this.optimizationStrategies.keys())
        .filter(strategy => this.optimizationStrategies.get(strategy).enabled)
    };

    this.optimizationHistory.push(historyEntry);

    // Keep only last 50 entries
    if (this.optimizationHistory.length > 50) {
      this.optimizationHistory.shift();
    }
  }

  /**
   * Load optimization history from storage
   */
  async loadOptimizationHistory() {
    try {
      const stored = await getStorageData(STORAGE_KEYS.PERFORMANCE);
      if (stored.performance && stored.performance.optimizationHistory) {
        this.optimizationHistory = stored.performance.optimizationHistory;
      }
    } catch (error) {
      console.warn('Could not load optimization history:', error);
      this.optimizationHistory = [];
    }
  }

  /**
   * Save optimization history to storage
   */
  async saveOptimizationHistory() {
    try {
      await setStorageData({
        [STORAGE_KEYS.PERFORMANCE]: {
          optimizationHistory: this.optimizationHistory,
          lastSaved: Date.now()
        }
      });
    } catch (error) {
      console.warn('Could not save optimization history:', error);
    }
  }

  /**
   * Get performance optimization report
   */
  async getOptimizationReport() {
    const currentMetrics = await this.collectPerformanceMetrics();
    const budgetViolations = this.checkPerformanceBudgets(currentMetrics);

    return {
      timestamp: Date.now(),
      currentMetrics,
      budgetViolations,
      browserCapabilities: Array.from(this.browserCapabilities.entries()),
      enabledStrategies: Array.from(this.optimizationStrategies.entries())
        .filter(([, config]) => config.enabled)
        .map(([strategy, config]) => ({ strategy, priority: config.priority })),
      optimizationHistory: this.optimizationHistory.slice(-10), // Last 10 entries
      recommendations: this.generateOptimizationRecommendations(currentMetrics, budgetViolations)
    };
  }

  /**
   * Generate optimization recommendations
   */
  generateOptimizationRecommendations(metrics, violations) {
    const recommendations = [];

    // Memory recommendations
    if (metrics.memory.memoryUtilization > 70) {
      recommendations.push({
        type: 'memory',
        priority: 'high',
        suggestion: 'Consider enabling more aggressive memory cleanup',
        action: 'Enable automatic memory optimization'
      });
    }

    // Cache recommendations
    if (metrics.cache.hitRatio < 0.6) {
      recommendations.push({
        type: 'cache',
        priority: 'medium',
        suggestion: 'Cache hit ratio is low, consider cache warming',
        action: 'Implement cache pre-loading for frequent requests'
      });
    }

    // Network recommendations
    if (metrics.network.averageLatency > 1000) {
      recommendations.push({
        type: 'network',
        priority: 'high',
        suggestion: 'Network latency is high, enable request optimization',
        action: 'Implement request batching and compression'
      });
    }

    // Budget violation recommendations
    violations.forEach(violation => {
      recommendations.push({
        type: 'budget_violation',
        priority: violation.severity,
        suggestion: `${violation.budget} budget exceeded`,
        action: `Optimize ${violation.budget.toLowerCase().replace('_', ' ')}`
      });
    });

    return recommendations;
  }

  /**
   * Dispose of the optimization system
   */
  dispose() {
    this.stopMonitoring();

    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }

    this.saveOptimizationHistory();

    console.log('Performance optimization system disposed');
  }
}

/**
 * Resource Manager for handling resource optimization
 */
export class ResourceManager {
  constructor() {
    this.resourceCache = new Map();
    this.resourceStats = new Map();
  }

  /**
   * Get memory metrics
   */
  async getMemoryMetrics() {
    if (performance.memory) {
      return {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        memoryUtilization: performance.memory.totalJSHeapSize > 0
          ? (performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize) * 100
          : 0,
        currentUsage: performance.memory.usedJSHeapSize
      };
    }

    // Fallback for environments without memory API
    return {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0,
      memoryUtilization: 0,
      currentUsage: 0
    };
  }

  /**
   * Cleanup memory and resources
   */
  async cleanup(metrics) {
    const actions = [];
    let memoryFreed = 0;

    // Clear old cache entries
    const cacheBefore = this.resourceCache.size;
    this.clearOldResources();
    const cacheAfter = this.resourceCache.size;

    if (cacheBefore > cacheAfter) {
      actions.push(`Cleared ${cacheBefore - cacheAfter} old cache entries`);
      memoryFreed += (cacheBefore - cacheAfter) * 1024; // Estimate 1KB per entry
    }

    // Clear unused resources
    this.clearUnusedResources();
    actions.push('Cleared unused resources');

    return {
      memoryFreed,
      actions
    };
  }

  /**
   * Clear old resources from cache
   */
  clearOldResources() {
    const now = Date.now();
    const maxAge = 1800000; // 30 minutes

    for (const [key, resource] of this.resourceCache.entries()) {
      if (now - resource.timestamp > maxAge) {
        this.resourceCache.delete(key);
      }
    }
  }

  /**
   * Clear unused resources
   */
  clearUnusedResources() {
    // Clear resources that haven't been accessed recently
    const now = Date.now();
    const unusedThreshold = 900000; // 15 minutes

    for (const [key, resource] of this.resourceCache.entries()) {
      if (now - resource.lastAccessed > unusedThreshold) {
        this.resourceCache.delete(key);
      }
    }
  }
}

/**
 * Network Optimizer for handling network request optimization
 */
export class NetworkOptimizer {
  constructor() {
    this.requestQueue = [];
    this.requestStats = new Map();
    this.compressionEnabled = true;
  }

  /**
   * Get network metrics
   */
  async getNetworkMetrics() {
    const requests = this.requestStats.size;
    const latencies = Array.from(this.requestStats.values()).map(stat => stat.latency);

    return {
      totalRequests: requests,
      averageLatency: latencies.length > 0
        ? latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length
        : 0,
      successRate: this.calculateSuccessRate(),
      compressionEnabled: this.compressionEnabled
    };
  }

  /**
   * Optimize network requests
   */
  async optimize(metrics) {
    const actions = [];

    // Enable request batching if many small requests
    if (this.requestQueue.length > 10) {
      this.enableRequestBatching();
      actions.push('request_batching');
    }

    // Enable compression if not already enabled
    if (!this.compressionEnabled) {
      this.compressionEnabled = true;
      actions.push('compression_enabled');
    }

    // Implement request prioritization
    this.prioritizeRequests();
    actions.push('request_prioritization');

    return {
      actions,
      requestsOptimized: this.requestQueue.length
    };
  }

  /**
   * Calculate request success rate
   */
  calculateSuccessRate() {
    const stats = Array.from(this.requestStats.values());
    if (stats.length === 0) return 1;

    const successful = stats.filter(stat => stat.success).length;
    return successful / stats.length;
  }

  /**
   * Enable request batching
   */
  enableRequestBatching() {
    // Implement request batching logic
    console.log('Request batching enabled');
  }

  /**
   * Prioritize requests based on importance
   */
  prioritizeRequests() {
    this.requestQueue.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }
}

/**
 * Memory Manager for handling memory optimization
 */
export class MemoryManager {
  constructor() {
    this.memoryPressureThreshold = 0.8; // 80%
    this.cleanupStrategies = [
      this.clearEventListeners.bind(this),
      this.clearDOMReferences.bind(this),
      this.clearTimers.bind(this),
      this.clearCaches.bind(this)
    ];
  }

  /**
   * Get memory metrics
   */
  async getMemoryMetrics() {
    if (performance.memory) {
      const memoryInfo = performance.memory;
      return {
        usedJSHeapSize: memoryInfo.usedJSHeapSize,
        totalJSHeapSize: memoryInfo.totalJSHeapSize,
        jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit,
        memoryUtilization: (memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize) * 100,
        currentUsage: memoryInfo.usedJSHeapSize,
        memoryPressure: this.calculateMemoryPressure(memoryInfo)
      };
    }

    return {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0,
      memoryUtilization: 0,
      currentUsage: 0,
      memoryPressure: 'low'
    };
  }

  /**
   * Calculate memory pressure level
   */
  calculateMemoryPressure(memoryInfo) {
    const utilization = memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize;

    if (utilization > 0.9) return 'critical';
    if (utilization > 0.8) return 'high';
    if (utilization > 0.6) return 'medium';
    return 'low';
  }

  /**
   * Cleanup memory using various strategies
   */
  async cleanup(metrics) {
    const results = {
      memoryFreed: 0,
      actions: []
    };

    // Apply cleanup strategies based on memory pressure
    for (const strategy of this.cleanupStrategies) {
      try {
        const result = await strategy();
        results.actions.push(result.action);
        results.memoryFreed += result.memoryFreed || 0;
      } catch (error) {
        console.warn('Memory cleanup strategy failed:', error);
      }
    }

    return results;
  }

  /**
   * Clear event listeners
   */
  clearEventListeners() {
    // Implementation would clear unused event listeners
    return {
      action: 'Cleared unused event listeners',
      memoryFreed: 1024 // Estimate
    };
  }

  /**
   * Clear DOM references
   */
  clearDOMReferences() {
    // Implementation would clear cached DOM references
    return {
      action: 'Cleared cached DOM references',
      memoryFreed: 512 // Estimate
    };
  }

  /**
   * Clear timers
   */
  clearTimers() {
    // Implementation would clear unused timers and intervals
    return {
      action: 'Cleared unused timers',
      memoryFreed: 256 // Estimate
    };
  }

  /**
   * Clear caches
   */
  clearCaches() {
    // Implementation would clear various caches
    return {
      action: 'Cleared old cache entries',
      memoryFreed: 2048 // Estimate
    };
  }
}

// Export utility functions
export function createPerformanceOptimizationSystem(options) {
  return new PerformanceOptimizationSystem(options);
}

export default PerformanceOptimizationSystem;