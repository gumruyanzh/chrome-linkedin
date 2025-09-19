// Performance Budget Enforcement and Monitoring System - Task 6.7
// Real-time performance budget monitoring with automated enforcement and alerting

import { getStorageData, setStorageData, STORAGE_KEYS } from './storage.js';
import { createPerformanceOptimizationSystem } from './performance-optimization.js';
import { reportError } from './error-reporting.js';

/**
 * Performance budget categories
 */
export const BUDGET_CATEGORIES = {
  LOAD_TIME: 'load_time',
  MEMORY_USAGE: 'memory_usage',
  BUNDLE_SIZE: 'bundle_size',
  NETWORK_REQUESTS: 'network_requests',
  ERROR_RATE: 'error_rate',
  CACHE_PERFORMANCE: 'cache_performance',
  CPU_USAGE: 'cpu_usage',
  FIRST_CONTENTFUL_PAINT: 'first_contentful_paint',
  LARGEST_CONTENTFUL_PAINT: 'largest_contentful_paint',
  CUMULATIVE_LAYOUT_SHIFT: 'cumulative_layout_shift'
};

/**
 * Budget violation severity levels
 */
export const VIOLATION_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Budget enforcement actions
 */
export const ENFORCEMENT_ACTIONS = {
  WARN: 'warn',
  OPTIMIZE: 'optimize',
  THROTTLE: 'throttle',
  BLOCK: 'block',
  ALERT: 'alert'
};

/**
 * Default performance budgets
 */
export const DEFAULT_BUDGETS = {
  [BUDGET_CATEGORIES.LOAD_TIME]: {
    limit: 3000, // 3 seconds
    warningThreshold: 2500, // 2.5 seconds
    unit: 'ms',
    priority: 'high',
    enforcementAction: ENFORCEMENT_ACTIONS.OPTIMIZE
  },
  [BUDGET_CATEGORIES.MEMORY_USAGE]: {
    limit: 50 * 1024 * 1024, // 50MB
    warningThreshold: 40 * 1024 * 1024, // 40MB
    unit: 'bytes',
    priority: 'high',
    enforcementAction: ENFORCEMENT_ACTIONS.OPTIMIZE
  },
  [BUDGET_CATEGORIES.BUNDLE_SIZE]: {
    limit: 512 * 1024, // 512KB
    warningThreshold: 400 * 1024, // 400KB
    unit: 'bytes',
    priority: 'medium',
    enforcementAction: ENFORCEMENT_ACTIONS.WARN
  },
  [BUDGET_CATEGORIES.NETWORK_REQUESTS]: {
    limit: 50,
    warningThreshold: 40,
    unit: 'count',
    priority: 'medium',
    enforcementAction: ENFORCEMENT_ACTIONS.THROTTLE
  },
  [BUDGET_CATEGORIES.ERROR_RATE]: {
    limit: 0.05, // 5%
    warningThreshold: 0.03, // 3%
    unit: 'percentage',
    priority: 'critical',
    enforcementAction: ENFORCEMENT_ACTIONS.ALERT
  },
  [BUDGET_CATEGORIES.CACHE_PERFORMANCE]: {
    limit: 0.8, // 80% hit ratio
    warningThreshold: 0.9, // 90% hit ratio
    unit: 'ratio',
    priority: 'medium',
    enforcementAction: ENFORCEMENT_ACTIONS.OPTIMIZE,
    inverted: true // Lower values are worse
  },
  [BUDGET_CATEGORIES.FIRST_CONTENTFUL_PAINT]: {
    limit: 1800, // 1.8 seconds
    warningThreshold: 1500, // 1.5 seconds
    unit: 'ms',
    priority: 'high',
    enforcementAction: ENFORCEMENT_ACTIONS.OPTIMIZE
  },
  [BUDGET_CATEGORIES.LARGEST_CONTENTFUL_PAINT]: {
    limit: 2500, // 2.5 seconds
    warningThreshold: 2000, // 2 seconds
    unit: 'ms',
    priority: 'high',
    enforcementAction: ENFORCEMENT_ACTIONS.OPTIMIZE
  },
  [BUDGET_CATEGORIES.CUMULATIVE_LAYOUT_SHIFT]: {
    limit: 0.1,
    warningThreshold: 0.05,
    unit: 'score',
    priority: 'medium',
    enforcementAction: ENFORCEMENT_ACTIONS.WARN
  }
};

/**
 * Performance Budget Monitor with real-time enforcement
 */
export class PerformanceBudgetMonitor {
  constructor(options = {}) {
    this.budgets = { ...DEFAULT_BUDGETS, ...options.budgets };
    this.isEnabled = options.enabled !== false;
    this.monitoringInterval = options.monitoringInterval || 10000; // 10 seconds
    this.alertCallbacks = new Map();
    this.violationHistory = [];
    this.currentViolations = new Map();
    this.monitoringActive = false;
    this.intervalId = null;
    this.optimizationSystem = null;
    this.performanceObserver = null;
    this.metricsCollector = new BudgetMetricsCollector();
    this.enforcementEngine = new BudgetEnforcementEngine(this);
  }

  /**
   * Initialize the budget monitor
   */
  async initialize() {
    try {
      if (!this.isEnabled) {
        console.log('Performance budget monitoring is disabled');
        return false;
      }

      // Load saved budgets and history
      await this.loadBudgetConfiguration();
      await this.loadViolationHistory();

      // Initialize optimization system
      this.optimizationSystem = createPerformanceOptimizationSystem({
        budgets: this.budgets
      });

      // Setup performance observers
      this.setupPerformanceObservers();

      // Start monitoring
      this.startMonitoring();

      console.log('Performance budget monitor initialized');
      return true;
    } catch (error) {
      console.error('Error initializing performance budget monitor:', error);
      await reportError(error, 'performance_budget', {
        component: 'PerformanceBudgetMonitor',
        method: 'initialize'
      });
      return false;
    }
  }

  /**
   * Setup performance observers for real-time monitoring
   */
  setupPerformanceObservers() {
    if (typeof PerformanceObserver === 'undefined') {
      console.warn('PerformanceObserver not supported, using fallback monitoring');
      return;
    }

    try {
      // Observe paint timings
      this.performanceObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.handlePerformanceEntry(entry);
        });
      });

      // Observe different types of performance entries
      const entryTypes = ['paint', 'largest-contentful-paint', 'layout-shift', 'navigation'];
      entryTypes.forEach(type => {
        try {
          this.performanceObserver.observe({ entryTypes: [type] });
        } catch (error) {
          console.warn(`Cannot observe ${type} entries:`, error);
        }
      });
    } catch (error) {
      console.warn('Error setting up performance observers:', error);
    }
  }

  /**
   * Handle performance entry from observer
   */
  handlePerformanceEntry(entry) {
    switch (entry.entryType) {
      case 'paint':
        if (entry.name === 'first-contentful-paint') {
          this.checkBudget(BUDGET_CATEGORIES.FIRST_CONTENTFUL_PAINT, entry.startTime);
        }
        break;

      case 'largest-contentful-paint':
        this.checkBudget(BUDGET_CATEGORIES.LARGEST_CONTENTFUL_PAINT, entry.startTime);
        break;

      case 'layout-shift':
        if (!entry.hadRecentInput) {
          this.checkBudget(BUDGET_CATEGORIES.CUMULATIVE_LAYOUT_SHIFT, entry.value);
        }
        break;

      case 'navigation':
        this.checkBudget(BUDGET_CATEGORIES.LOAD_TIME, entry.loadEventEnd - entry.fetchStart);
        break;
    }
  }

  /**
   * Start monitoring performance budgets
   */
  startMonitoring() {
    if (this.monitoringActive) {
      return;
    }

    this.monitoringActive = true;

    this.intervalId = setInterval(async () => {
      await this.performBudgetCheck();
    }, this.monitoringInterval);

    console.log('Performance budget monitoring started');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    this.monitoringActive = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }

    console.log('Performance budget monitoring stopped');
  }

  /**
   * Perform comprehensive budget check
   */
  async performBudgetCheck() {
    try {
      // Collect current metrics
      const metrics = await this.metricsCollector.collectAllMetrics();

      // Check each budget category
      for (const [category, budget] of Object.entries(this.budgets)) {
        if (metrics[category] !== undefined) {
          this.checkBudget(category, metrics[category]);
        }
      }

      // Update violation tracking
      this.updateViolationTracking();

      // Save state
      await this.saveMonitoringState();
    } catch (error) {
      console.error('Error during budget check:', error);
      await reportError(error, 'performance_budget', {
        component: 'PerformanceBudgetMonitor',
        method: 'performBudgetCheck'
      });
    }
  }

  /**
   * Check specific budget category
   */
  checkBudget(category, currentValue) {
    const budget = this.budgets[category];
    if (!budget) {
      return;
    }

    const violation = this.evaluateBudgetViolation(category, currentValue, budget);

    if (violation) {
      this.handleBudgetViolation(category, violation);
    } else {
      // Clear any existing violation for this category
      if (this.currentViolations.has(category)) {
        this.clearViolation(category);
      }
    }
  }

  /**
   * Evaluate if current value violates budget
   */
  evaluateBudgetViolation(category, currentValue, budget) {
    const isInverted = budget.inverted === true;
    const exceedsLimit = isInverted ? currentValue < budget.limit : currentValue > budget.limit;
    const exceedsWarning = isInverted
      ? currentValue < budget.warningThreshold
      : currentValue > budget.warningThreshold;

    if (exceedsLimit) {
      return {
        category,
        currentValue,
        limit: budget.limit,
        severity: this.determineSeverity(budget.priority, 'violation'),
        violationType: 'limit',
        timestamp: Date.now(),
        unit: budget.unit,
        enforcementAction: budget.enforcementAction
      };
    } else if (exceedsWarning) {
      return {
        category,
        currentValue,
        limit: budget.warningThreshold,
        severity: this.determineSeverity(budget.priority, 'warning'),
        violationType: 'warning',
        timestamp: Date.now(),
        unit: budget.unit,
        enforcementAction: ENFORCEMENT_ACTIONS.WARN
      };
    }

    return null;
  }

  /**
   * Determine violation severity based on priority
   */
  determineSeverity(priority, violationType) {
    if (violationType === 'warning') {
      return VIOLATION_SEVERITY.LOW;
    }

    const severityMap = {
      critical: VIOLATION_SEVERITY.CRITICAL,
      high: VIOLATION_SEVERITY.HIGH,
      medium: VIOLATION_SEVERITY.MEDIUM,
      low: VIOLATION_SEVERITY.LOW
    };

    return severityMap[priority] || VIOLATION_SEVERITY.MEDIUM;
  }

  /**
   * Handle budget violation
   */
  async handleBudgetViolation(category, violation) {
    // Record violation
    this.currentViolations.set(category, violation);
    this.violationHistory.push(violation);

    // Trigger enforcement action
    await this.enforcementEngine.enforceViolation(violation);

    // Notify alert callbacks
    this.notifyAlertCallbacks(category, violation);

    console.warn(`Performance budget violation: ${category}`, violation);
  }

  /**
   * Clear violation for category
   */
  clearViolation(category) {
    this.currentViolations.delete(category);
    this.notifyAlertCallbacks(category, null); // null indicates cleared violation
  }

  /**
   * Notify alert callbacks
   */
  notifyAlertCallbacks(category, violation) {
    const callbacks = this.alertCallbacks.get(category) || [];
    const globalCallbacks = this.alertCallbacks.get('*') || [];

    [...callbacks, ...globalCallbacks].forEach(callback => {
      try {
        callback(category, violation);
      } catch (error) {
        console.error('Error in alert callback:', error);
      }
    });
  }

  /**
   * Add alert callback for budget violations
   */
  onBudgetViolation(category, callback) {
    if (!this.alertCallbacks.has(category)) {
      this.alertCallbacks.set(category, []);
    }
    this.alertCallbacks.get(category).push(callback);
  }

  /**
   * Add global alert callback
   */
  onAnyBudgetViolation(callback) {
    this.onBudgetViolation('*', callback);
  }

  /**
   * Update budget configuration
   */
  async updateBudget(category, budgetConfig) {
    this.budgets[category] = { ...this.budgets[category], ...budgetConfig };
    await this.saveBudgetConfiguration();
  }

  /**
   * Update multiple budgets
   */
  async updateBudgets(budgetUpdates) {
    Object.assign(this.budgets, budgetUpdates);
    await this.saveBudgetConfiguration();
  }

  /**
   * Get current budget status
   */
  getBudgetStatus() {
    return {
      timestamp: Date.now(),
      budgets: this.budgets,
      currentViolations: Array.from(this.currentViolations.values()),
      violationCount: this.currentViolations.size,
      monitoringActive: this.monitoringActive,
      recentViolations: this.violationHistory.slice(-10)
    };
  }

  /**
   * Get budget performance report
   */
  getBudgetReport() {
    const violationsByCategory = this.groupViolationsByCategory();
    const violationTrends = this.calculateViolationTrends();

    return {
      timestamp: Date.now(),
      summary: {
        totalBudgets: Object.keys(this.budgets).length,
        currentViolations: this.currentViolations.size,
        totalViolationsToday: this.getViolationsCount(Date.now() - 24 * 60 * 60 * 1000),
        worstPerformingCategory: this.getWorstPerformingCategory()
      },
      budgets: this.budgets,
      violationsByCategory,
      violationTrends,
      recommendations: this.generateBudgetRecommendations(violationsByCategory)
    };
  }

  /**
   * Group violations by category for analysis
   */
  groupViolationsByCategory() {
    const grouped = {};

    this.violationHistory.forEach(violation => {
      if (!grouped[violation.category]) {
        grouped[violation.category] = {
          count: 0,
          violations: [],
          averageExcess: 0
        };
      }

      grouped[violation.category].count++;
      grouped[violation.category].violations.push(violation);
    });

    // Calculate average excess for each category
    Object.values(grouped).forEach(categoryData => {
      const excesses = categoryData.violations.map(v => Math.abs(v.currentValue - v.limit));
      categoryData.averageExcess =
        excesses.length > 0
          ? excesses.reduce((sum, excess) => sum + excess, 0) / excesses.length
          : 0;
    });

    return grouped;
  }

  /**
   * Calculate violation trends
   */
  calculateViolationTrends() {
    const timeWindows = [
      { name: '1h', duration: 60 * 60 * 1000 },
      { name: '24h', duration: 24 * 60 * 60 * 1000 },
      { name: '7d', duration: 7 * 24 * 60 * 60 * 1000 }
    ];

    const trends = {};
    const now = Date.now();

    timeWindows.forEach(window => {
      const windowStart = now - window.duration;
      const violationsInWindow = this.violationHistory.filter(v => v.timestamp >= windowStart);

      trends[window.name] = {
        count: violationsInWindow.length,
        rate: violationsInWindow.length / (window.duration / (60 * 60 * 1000)), // per hour
        severity: this.calculateAverageSeverity(violationsInWindow)
      };
    });

    return trends;
  }

  /**
   * Calculate average severity of violations
   */
  calculateAverageSeverity(violations) {
    if (violations.length === 0) {
      return 0;
    }

    const severityScores = {
      [VIOLATION_SEVERITY.LOW]: 1,
      [VIOLATION_SEVERITY.MEDIUM]: 2,
      [VIOLATION_SEVERITY.HIGH]: 3,
      [VIOLATION_SEVERITY.CRITICAL]: 4
    };

    const totalScore = violations.reduce(
      (sum, violation) => sum + (severityScores[violation.severity] || 0),
      0
    );

    return totalScore / violations.length;
  }

  /**
   * Get worst performing category
   */
  getWorstPerformingCategory() {
    const violationsByCategory = this.groupViolationsByCategory();
    let worstCategory = null;
    let maxViolations = 0;

    Object.entries(violationsByCategory).forEach(([category, data]) => {
      if (data.count > maxViolations) {
        maxViolations = data.count;
        worstCategory = category;
      }
    });

    return worstCategory;
  }

  /**
   * Get violations count in time period
   */
  getViolationsCount(since) {
    return this.violationHistory.filter(v => v.timestamp >= since).length;
  }

  /**
   * Generate budget recommendations
   */
  generateBudgetRecommendations(violationsByCategory) {
    const recommendations = [];

    Object.entries(violationsByCategory).forEach(([category, data]) => {
      if (data.count > 5) {
        // Frequent violations
        recommendations.push({
          category,
          type: 'frequent_violations',
          severity: 'high',
          suggestion: `Consider relaxing budget or optimizing ${category}`,
          violationCount: data.count
        });
      }

      if (data.averageExcess > this.budgets[category]?.limit * 0.5) {
        // Large excesses
        recommendations.push({
          category,
          type: 'large_excess',
          severity: 'medium',
          suggestion: `Large budget excesses detected for ${category}`,
          averageExcess: data.averageExcess
        });
      }
    });

    return recommendations;
  }

  /**
   * Update violation tracking
   */
  updateViolationTracking() {
    // Remove old violations (older than 7 days)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    this.violationHistory = this.violationHistory.filter(v => v.timestamp >= sevenDaysAgo);
  }

  /**
   * Load budget configuration from storage
   */
  async loadBudgetConfiguration() {
    try {
      const stored = await getStorageData(STORAGE_KEYS.PERFORMANCE_BUDGETS);
      if (stored.performance_budgets) {
        this.budgets = { ...this.budgets, ...stored.performance_budgets };
      }
    } catch (error) {
      console.warn('Could not load budget configuration:', error);
    }
  }

  /**
   * Save budget configuration to storage
   */
  async saveBudgetConfiguration() {
    try {
      await setStorageData({
        [STORAGE_KEYS.PERFORMANCE_BUDGETS]: this.budgets
      });
    } catch (error) {
      console.warn('Could not save budget configuration:', error);
    }
  }

  /**
   * Load violation history from storage
   */
  async loadViolationHistory() {
    try {
      const stored = await getStorageData(STORAGE_KEYS.PERFORMANCE_OPTIMIZATION);
      if (stored.performance_optimization?.violationHistory) {
        this.violationHistory = stored.performance_optimization.violationHistory;
      }
    } catch (error) {
      console.warn('Could not load violation history:', error);
    }
  }

  /**
   * Save monitoring state to storage
   */
  async saveMonitoringState() {
    try {
      await setStorageData({
        [STORAGE_KEYS.PERFORMANCE_OPTIMIZATION]: {
          violationHistory: this.violationHistory.slice(-1000), // Keep last 1000
          lastUpdated: Date.now()
        }
      });
    } catch (error) {
      console.warn('Could not save monitoring state:', error);
    }
  }

  /**
   * Dispose of the monitor
   */
  dispose() {
    this.stopMonitoring();
    this.saveMonitoringState();
    this.saveBudgetConfiguration();

    if (this.optimizationSystem) {
      this.optimizationSystem.dispose();
    }

    console.log('Performance budget monitor disposed');
  }
}

/**
 * Budget Metrics Collector for gathering performance data
 */
export class BudgetMetricsCollector {
  constructor() {
    this.resourceMetrics = new Map();
    this.networkMetrics = new Map();
  }

  /**
   * Collect all performance metrics
   */
  async collectAllMetrics() {
    const metrics = {};

    try {
      // Load time metrics
      metrics[BUDGET_CATEGORIES.LOAD_TIME] = await this.collectLoadTime();

      // Memory usage metrics
      metrics[BUDGET_CATEGORIES.MEMORY_USAGE] = await this.collectMemoryUsage();

      // Network request metrics
      metrics[BUDGET_CATEGORIES.NETWORK_REQUESTS] = await this.collectNetworkRequests();

      // Error rate metrics
      metrics[BUDGET_CATEGORIES.ERROR_RATE] = await this.collectErrorRate();

      // Cache performance metrics
      metrics[BUDGET_CATEGORIES.CACHE_PERFORMANCE] = await this.collectCachePerformance();

      // Core Web Vitals
      metrics[BUDGET_CATEGORIES.FIRST_CONTENTFUL_PAINT] = await this.collectFCP();
      metrics[BUDGET_CATEGORIES.LARGEST_CONTENTFUL_PAINT] = await this.collectLCP();
      metrics[BUDGET_CATEGORIES.CUMULATIVE_LAYOUT_SHIFT] = await this.collectCLS();

      return metrics;
    } catch (error) {
      console.error('Error collecting metrics:', error);
      return {};
    }
  }

  /**
   * Collect load time metrics
   */
  async collectLoadTime() {
    if (performance.timing) {
      return performance.timing.loadEventEnd - performance.timing.navigationStart;
    }
    return 0;
  }

  /**
   * Collect memory usage metrics
   */
  async collectMemoryUsage() {
    if (performance.memory) {
      return performance.memory.usedJSHeapSize;
    }
    return 0;
  }

  /**
   * Collect network request count
   */
  async collectNetworkRequests() {
    if (performance.getEntriesByType) {
      const resources = performance.getEntriesByType('resource');
      return resources.length;
    }
    return 0;
  }

  /**
   * Collect error rate (mock implementation)
   */
  async collectErrorRate() {
    // In real implementation, this would calculate actual error rate
    return 0.01; // 1% mock error rate
  }

  /**
   * Collect cache performance metrics
   */
  async collectCachePerformance() {
    // Mock cache hit ratio
    return 0.85; // 85% hit ratio
  }

  /**
   * Collect First Contentful Paint
   */
  async collectFCP() {
    const paintEntries = performance.getEntriesByType('paint');
    const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return fcpEntry ? fcpEntry.startTime : 0;
  }

  /**
   * Collect Largest Contentful Paint
   */
  async collectLCP() {
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    const latestLCP = lcpEntries[lcpEntries.length - 1];
    return latestLCP ? latestLCP.startTime : 0;
  }

  /**
   * Collect Cumulative Layout Shift
   */
  async collectCLS() {
    const layoutShiftEntries = performance.getEntriesByType('layout-shift');
    return layoutShiftEntries
      .filter(entry => !entry.hadRecentInput)
      .reduce((sum, entry) => sum + entry.value, 0);
  }
}

/**
 * Budget Enforcement Engine for taking action on violations
 */
export class BudgetEnforcementEngine {
  constructor(monitor) {
    this.monitor = monitor;
    this.enforcementHistory = [];
    this.throttleStates = new Map();
  }

  /**
   * Enforce budget violation
   */
  async enforceViolation(violation) {
    const action = violation.enforcementAction;

    try {
      switch (action) {
        case ENFORCEMENT_ACTIONS.WARN:
          await this.executeWarnAction(violation);
          break;

        case ENFORCEMENT_ACTIONS.OPTIMIZE:
          await this.executeOptimizeAction(violation);
          break;

        case ENFORCEMENT_ACTIONS.THROTTLE:
          await this.executeThrottleAction(violation);
          break;

        case ENFORCEMENT_ACTIONS.BLOCK:
          await this.executeBlockAction(violation);
          break;

        case ENFORCEMENT_ACTIONS.ALERT:
          await this.executeAlertAction(violation);
          break;

        default:
          console.warn('Unknown enforcement action:', action);
      }

      this.recordEnforcementAction(violation, action);
    } catch (error) {
      console.error('Error enforcing budget violation:', error);
      await reportError(error, 'performance_budget', {
        violation: JSON.stringify(violation, null, 2),
        action
      });
    }
  }

  /**
   * Execute warning action
   */
  async executeWarnAction(violation) {
    console.warn(`Performance budget warning: ${violation.category}`, {
      current: violation.currentValue,
      limit: violation.limit,
      unit: violation.unit
    });
  }

  /**
   * Execute optimization action
   */
  async executeOptimizeAction(violation) {
    if (this.monitor.optimizationSystem) {
      console.log(`Triggering optimization for ${violation.category}`);
      await this.monitor.optimizationSystem.performOptimizationCheck();
    }
  }

  /**
   * Execute throttle action
   */
  async executeThrottleAction(violation) {
    const category = violation.category;

    if (!this.throttleStates.has(category)) {
      this.throttleStates.set(category, {
        active: true,
        startTime: Date.now(),
        duration: 30000 // 30 seconds
      });

      console.log(`Throttling ${category} for 30 seconds`);

      // Clear throttle after duration
      setTimeout(() => {
        this.throttleStates.delete(category);
        console.log(`Throttling cleared for ${category}`);
      }, 30000);
    }
  }

  /**
   * Execute block action
   */
  async executeBlockAction(violation) {
    console.error(`Blocking action due to critical violation: ${violation.category}`);
    // Implementation would block specific functionality
  }

  /**
   * Execute alert action
   */
  async executeAlertAction(violation) {
    console.error(`ALERT: Critical performance violation in ${violation.category}`);

    // Send alert to monitoring systems
    await this.sendCriticalAlert(violation);
  }

  /**
   * Send critical alert
   */
  async sendCriticalAlert(violation) {
    // Implementation would send alerts to external monitoring systems
    console.error('CRITICAL PERFORMANCE ALERT:', violation);
  }

  /**
   * Record enforcement action for analysis
   */
  recordEnforcementAction(violation, action) {
    const record = {
      timestamp: Date.now(),
      violation,
      action,
      success: true
    };

    this.enforcementHistory.push(record);

    // Keep only recent history
    if (this.enforcementHistory.length > 100) {
      this.enforcementHistory.shift();
    }
  }

  /**
   * Check if category is currently throttled
   */
  isThrottled(category) {
    const throttleState = this.throttleStates.get(category);
    if (!throttleState) {
      return false;
    }

    const elapsed = Date.now() - throttleState.startTime;
    return elapsed < throttleState.duration;
  }

  /**
   * Get enforcement statistics
   */
  getEnforcementStats() {
    const actionCounts = {};

    this.enforcementHistory.forEach(record => {
      actionCounts[record.action] = (actionCounts[record.action] || 0) + 1;
    });

    return {
      totalEnforcements: this.enforcementHistory.length,
      actionCounts,
      activeThrottles: this.throttleStates.size,
      recentActions: this.enforcementHistory.slice(-10)
    };
  }
}

// Export utility functions
export function createPerformanceBudgetMonitor(options) {
  return new PerformanceBudgetMonitor(options);
}

export default PerformanceBudgetMonitor;
