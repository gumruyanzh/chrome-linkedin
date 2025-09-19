// Task 6.4: Crash Analytics and Automated Monitoring Implementation
// Extension crash detection, performance monitoring, memory leak detection, and automated recovery

import { getStorageData, setStorageData, STORAGE_KEYS } from './storage.js';
import { encryptData, decryptData } from './encryption.js';
import { GlobalErrorCapture, ERROR_TYPES, ERROR_SEVERITY } from './error-reporting.js';

/**
 * Crash types for comprehensive crash detection
 */
export const CRASH_TYPES = {
  CONTEXT_INVALIDATION: 'context_invalidation',
  SERVICE_WORKER_CRASH: 'service_worker_crash',
  CONTENT_SCRIPT_FAILURE: 'content_script_failure',
  UI_COMPONENT_CRASH: 'ui_component_crash',
  MEMORY_EXHAUSTION: 'memory_exhaustion',
  PERMISSION_LOSS: 'permission_loss',
  STORAGE_CORRUPTION: 'storage_corruption'
};

/**
 * Recovery strategies for different failure types
 */
export const RECOVERY_STRATEGIES = {
  RELOAD_TAB: 'reload_tab',
  RESTART_SERVICE_WORKER: 'restart_service_worker',
  REINJECT_SCRIPTS: 'reinject_content_script',
  FORCE_MEMORY_CLEANUP: 'force_memory_cleanup',
  RESTORE_PERMISSIONS: 'restore_permissions',
  SAFE_MODE: 'safe_mode',
  GRACEFUL_DEGRADATION: 'graceful_degradation'
};

/**
 * Health check statuses
 */
export const HEALTH_STATUS = {
  HEALTHY: 'healthy',
  WARNING: 'warning',
  CRITICAL: 'critical',
  UNKNOWN: 'unknown'
};

/**
 * Extension crash detector and recovery system
 */
export class ExtensionCrashDetector {
  constructor(options = {}) {
    this.detectedCrashes = [];
    this.contentScriptFailures = [];
    this.uiCrashes = [];
    this.monitoredTabs = new Map();
    this.isInitialized = false;
    this.autoRecoveryEnabled = false;
    this.crashListeners = new Map();
    this.recoveryHistory = [];
    this.performanceMode = false;
  }

  /**
   * Initialize crash detection system
   */
  async initialize() {
    try {
      this.isInitialized = false;

      // Set up crash monitoring
      this.setupCrashMonitoring();

      // Set up service worker monitoring
      this.setupServiceWorkerMonitoring();

      // Set up content script monitoring
      this.setupContentScriptMonitoring();

      // Load stored crash data
      await this.loadStoredCrashes();

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.warn('Failed to initialize crash detector:', error);
      this.isInitialized = true;
      return false;
    }
  }

  /**
   * Setup general crash monitoring
   */
  setupCrashMonitoring() {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      // Monitor extension suspension
      if (chrome.runtime.onSuspend) {
        chrome.runtime.onSuspend.addListener(this.handleSuspension.bind(this));
      }

      if (chrome.runtime.onSuspendCanceled) {
        chrome.runtime.onSuspendCanceled.addListener(this.handleSuspensionCanceled.bind(this));
      }

      // Monitor extension startup/install
      if (chrome.runtime.onStartup) {
        chrome.runtime.onStartup.addListener(this.handleStartup.bind(this));
      }

      if (chrome.runtime.onInstalled) {
        chrome.runtime.onInstalled.addListener(this.handleInstall.bind(this));
      }
    }
  }

  /**
   * Setup service worker monitoring
   */
  setupServiceWorkerMonitoring() {
    // Monitor service worker state
    this.serviceWorkerCheckInterval = setInterval(() => {
      this.checkServiceWorkerHealth();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Setup content script monitoring
   */
  setupContentScriptMonitoring() {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      // Monitor tab updates
      chrome.tabs.onUpdated.addListener(this.handleTabUpdate.bind(this));
      chrome.tabs.onRemoved.addListener(this.handleTabRemoved.bind(this));
    }
  }

  /**
   * Detect extension context invalidation
   */
  async detectContextInvalidation() {
    const crashEvent = {
      type: CRASH_TYPES.CONTEXT_INVALIDATION,
      timestamp: Date.now(),
      cause: 'extension_context_invalidated',
      severity: 'critical',
      recoverable: true,
      metadata: {
        extensionId: chrome.runtime?.id || 'unknown',
        version: chrome.runtime?.getManifest?.()?.version || 'unknown'
      }
    };

    await this.recordCrash(crashEvent);
    return crashEvent;
  }

  /**
   * Handle service worker crashes
   */
  async handleServiceWorkerCrash(crashData) {
    const crash = {
      ...crashData,
      type: CRASH_TYPES.SERVICE_WORKER_CRASH,
      timestamp: Date.now(),
      downtime: Date.now() - crashData.lastActiveTime,
      impactAssessment: {
        affectedFeatures: ['background_tasks', 'message_passing', 'storage_access'],
        userImpact: 'high'
      }
    };

    await this.recordCrash(crash);

    if (this.autoRecoveryEnabled) {
      await this.attemptRecovery(crash);
    }

    return crash;
  }

  /**
   * Handle content script failures
   */
  async handleContentScriptFailure(failureData) {
    const failure = {
      ...failureData,
      type: CRASH_TYPES.CONTENT_SCRIPT_FAILURE,
      timestamp: Date.now(),
      status: 'failed',
      recoveryAttempts: 0
    };

    this.contentScriptFailures.push(failure);

    if (this.autoRecoveryEnabled) {
      await this.attemptContentScriptRecovery(failure);
    }

    return failure;
  }

  /**
   * Handle UI component crashes
   */
  async handleUIComponentCrash(crashData) {
    const crash = {
      ...crashData,
      type: CRASH_TYPES.UI_COMPONENT_CRASH,
      timestamp: Date.now(),
      frequency: 1,
      lastOccurrence: Date.now()
    };

    // Check for existing crash of same component
    const existing = this.uiCrashes.find(c => c.component === crash.component);
    if (existing) {
      existing.frequency++;
      existing.lastOccurrence = Date.now();
    } else {
      this.uiCrashes.push(crash);
    }

    return crash;
  }

  /**
   * Monitor individual tab
   */
  async monitorTab(tabData) {
    const { tabId, url } = tabData;

    if (!this.performanceMode) {
      this.monitoredTabs.set(tabId, {
        ...tabData,
        monitoringStarted: Date.now(),
        lastCheck: Date.now(),
        status: 'monitoring'
      });
    }

    return true;
  }

  /**
   * Attempt crash recovery
   */
  async attemptRecovery(crash) {
    const recovery = {
      attempted: true,
      strategy: this.selectRecoveryStrategy(crash),
      success: false,
      recoveryTime: 0,
      fallbacksUsed: []
    };

    const startTime = Date.now();

    try {
      switch (recovery.strategy) {
        case RECOVERY_STRATEGIES.RESTART_SERVICE_WORKER:
          recovery.success = await this.restartServiceWorker();
          break;

        case RECOVERY_STRATEGIES.RELOAD_TAB:
          recovery.success = await this.reloadTab(crash.tabId);
          break;

        case RECOVERY_STRATEGIES.REINJECT_SCRIPTS:
          recovery.success = await this.reinjectContentScripts(crash.tabId);
          break;

        case RECOVERY_STRATEGIES.FORCE_MEMORY_CLEANUP:
          recovery.success = await this.forceMemoryCleanup();
          break;

        default:
          recovery.success = false;
      }

      recovery.recoveryTime = Date.now() - startTime;

      // Record recovery attempt
      this.recoveryHistory.push({
        crashType: crash.type,
        strategy: recovery.strategy,
        success: recovery.success,
        timestamp: Date.now()
      });

      return recovery;
    } catch (error) {
      console.warn('Recovery failed:', error);
      recovery.success = false;
      recovery.recoveryTime = Date.now() - startTime;
      return recovery;
    }
  }

  /**
   * Analyze crash patterns
   */
  analyzeCrashPatterns() {
    const now = Date.now();
    const hourAgo = now - 3600000;

    const recentCrashes = this.detectedCrashes.filter(c => c.timestamp > hourAgo);
    const crashesByType = this.detectedCrashes.reduce((acc, crash) => {
      acc[crash.type] = (acc[crash.type] || 0) + 1;
      return acc;
    }, {});

    // Calculate frequency and trend
    const crashesPerHour = recentCrashes.length;
    const trend = this.calculateCrashTrend();
    const criticalityScore = this.calculateCriticalityScore();

    return {
      totalCrashes: this.detectedCrashes.length,
      recentCrashes: recentCrashes.length,
      crashesByType,
      frequency: {
        crashesPerHour,
        trend
      },
      criticalityScore,
      recommendations: this.generateRecommendations(crashesByType)
    };
  }

  /**
   * Get detected crashes
   */
  getDetectedCrashes() {
    return [...this.detectedCrashes];
  }

  /**
   * Get content script failures
   */
  getContentScriptFailures() {
    return [...this.contentScriptFailures];
  }

  /**
   * Get UI crashes
   */
  getUICrashes() {
    return [...this.uiCrashes];
  }

  /**
   * Get monitored tabs
   */
  getMonitoredTabs() {
    return Array.from(this.monitoredTabs.values());
  }

  /**
   * Enable auto recovery
   */
  enableAutoRecovery(enabled) {
    this.autoRecoveryEnabled = enabled;
  }

  /**
   * Record crash for analysis
   */
  async recordCrash(crash) {
    this.detectedCrashes.push(crash);

    // Apply memory limits
    if (this.detectedCrashes.length > 1000) {
      this.detectedCrashes.splice(0, this.detectedCrashes.length - 1000);
    }

    // Persist crash data
    await this.persistCrashData();
  }

  /**
   * Helper methods
   */
  selectRecoveryStrategy(crash) {
    const strategies = {
      [CRASH_TYPES.SERVICE_WORKER_CRASH]: RECOVERY_STRATEGIES.RESTART_SERVICE_WORKER,
      [CRASH_TYPES.CONTENT_SCRIPT_FAILURE]: RECOVERY_STRATEGIES.REINJECT_SCRIPTS,
      [CRASH_TYPES.MEMORY_EXHAUSTION]: RECOVERY_STRATEGIES.FORCE_MEMORY_CLEANUP,
      [CRASH_TYPES.CONTEXT_INVALIDATION]: RECOVERY_STRATEGIES.RELOAD_TAB
    };

    return strategies[crash.type] || RECOVERY_STRATEGIES.SAFE_MODE;
  }

  async restartServiceWorker() {
    try {
      if (chrome.runtime && chrome.runtime.reload) {
        chrome.runtime.reload();
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  async reloadTab(tabId) {
    try {
      if (chrome.tabs && tabId) {
        await chrome.tabs.reload(tabId);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  async reinjectContentScripts(tabId) {
    // Mock implementation - would reinject content scripts
    return Math.random() > 0.3;
  }

  async forceMemoryCleanup() {
    // Mock implementation - would force garbage collection
    return Math.random() > 0.2;
  }

  calculateCrashTrend() {
    if (this.detectedCrashes.length < 10) {
      return 'stable';
    }

    const recent = this.detectedCrashes.slice(-10);
    const older = this.detectedCrashes.slice(-20, -10);

    if (recent.length > older.length * 1.5) {
      return 'increasing';
    }
    if (recent.length < older.length * 0.5) {
      return 'decreasing';
    }
    return 'stable';
  }

  calculateCriticalityScore() {
    const weights = {
      [CRASH_TYPES.SERVICE_WORKER_CRASH]: 10,
      [CRASH_TYPES.CONTEXT_INVALIDATION]: 8,
      [CRASH_TYPES.MEMORY_EXHAUSTION]: 7,
      [CRASH_TYPES.CONTENT_SCRIPT_FAILURE]: 5,
      [CRASH_TYPES.UI_COMPONENT_CRASH]: 3
    };

    let score = 0;
    this.detectedCrashes.forEach(crash => {
      score += weights[crash.type] || 1;
    });

    return Math.min(score, 100);
  }

  generateRecommendations(crashesByType) {
    const recommendations = [];

    if (crashesByType[CRASH_TYPES.MEMORY_EXHAUSTION] > 5) {
      recommendations.push('Consider memory optimization');
    }

    if (crashesByType[CRASH_TYPES.SERVICE_WORKER_CRASH] > 3) {
      recommendations.push('Review service worker implementation');
    }

    return recommendations;
  }

  handleSuspension() {
    console.log('Extension suspended');
  }

  handleSuspensionCanceled() {
    console.log('Extension suspension canceled');
  }

  handleStartup() {
    console.log('Extension started');
  }

  handleInstall() {
    console.log('Extension installed');
  }

  checkServiceWorkerHealth() {
    // Mock health check
  }

  handleTabUpdate(tabId, changeInfo, tab) {
    if (this.monitoredTabs.has(tabId)) {
      this.monitoredTabs.get(tabId).lastCheck = Date.now();
    }
  }

  handleTabRemoved(tabId) {
    this.monitoredTabs.delete(tabId);
  }

  async attemptContentScriptRecovery(failure) {
    const recovery = await this.attemptRecovery(failure);
    if (recovery.success) {
      failure.recoveryAttempts++;
      failure.status = 'recovered';
    }
  }

  async loadStoredCrashes() {
    try {
      const stored = await getStorageData(STORAGE_KEYS.CRASHES);
      if (Array.isArray(stored.crashes)) {
        this.detectedCrashes = stored.crashes.slice(-1000);
      }
    } catch (error) {
      console.warn('Failed to load stored crashes:', error);
    }
  }

  async persistCrashData() {
    try {
      await setStorageData(STORAGE_KEYS.CRASHES, {
        crashes: this.detectedCrashes.slice(-1000)
      });
    } catch (error) {
      console.warn('Failed to persist crash data:', error);
    }
  }
}

/**
 * Performance degradation monitor
 */
export class PerformanceDegradationMonitor {
  constructor(options = {}) {
    this.currentMetrics = {};
    this.metricsHistory = [];
    this.thresholds = this.setupDefaultThresholds();
    this.adaptiveThresholds = false;
    this.alertCallbacks = [];
    this.isInitialized = false;
    this.degradationDetected = false;
  }

  /**
   * Initialize performance monitoring
   */
  async initialize() {
    try {
      this.isInitialized = false;

      // Setup performance observers
      this.setupPerformanceObservers();

      // Load stored metrics
      await this.loadStoredMetrics();

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.warn('Failed to initialize performance monitor:', error);
      this.isInitialized = true;
      return false;
    }
  }

  /**
   * Setup performance observers
   */
  setupPerformanceObservers() {
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        const observer = new PerformanceObserver(list => {
          const entries = list.getEntries();
          this.processPerformanceEntries(entries);
        });

        observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
      } catch (error) {
        console.warn('Performance observer setup failed:', error);
      }
    }
  }

  /**
   * Record performance metrics
   */
  async recordMetrics(metrics) {
    const timestamp = Date.now();
    const metricsWithTimestamp = { ...metrics, timestamp };

    this.currentMetrics = metricsWithTimestamp;
    this.metricsHistory.push(metricsWithTimestamp);

    // Apply memory limits
    if (this.metricsHistory.length > 10000) {
      this.metricsHistory.splice(0, this.metricsHistory.length - 10000);
    }

    // Check for degradation
    await this.checkDegradation(metricsWithTimestamp);

    // Persist metrics
    await this.persistMetrics();
  }

  /**
   * Get current metrics
   */
  getCurrentMetrics() {
    if (Object.keys(this.currentMetrics).length === 0) {
      return {
        memory: { current: 0, trend: 'stable', threshold: 0 },
        cpu: { current: 0, average: 0, peak: 0 },
        performance: { responseTime: 0, renderTime: 0, score: 100 },
        degradationDetected: false
      };
    }

    return {
      memory: {
        current: this.currentMetrics.memoryUsage || 0,
        trend: this.calculateMemoryTrend(),
        threshold: this.thresholds.memoryWarning
      },
      cpu: {
        current: this.currentMetrics.cpuUsage || 0,
        average: this.calculateAverageCpu(),
        peak: this.calculatePeakCpu()
      },
      performance: {
        responseTime: this.currentMetrics.responseTime || 0,
        renderTime: this.currentMetrics.renderTime || 0,
        score: this.calculatePerformanceScore()
      },
      degradationDetected: this.degradationDetected
    };
  }

  /**
   * Set performance thresholds
   */
  setThresholds(thresholds) {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  /**
   * Get current thresholds
   */
  getThresholds() {
    return {
      memory: {
        warning: this.thresholds.memoryWarning,
        critical: this.thresholds.memoryCritical,
        adaptive: this.adaptiveThresholds,
        confidence: this.adaptiveThresholds ? 0.85 : 1.0
      },
      responseTime: {
        warning: this.thresholds.responseTimeWarning,
        critical: this.thresholds.responseTimeCritical,
        adaptive: this.adaptiveThresholds
      },
      cpu: {
        warning: this.thresholds.cpuWarning,
        critical: this.thresholds.cpuCritical,
        adaptive: this.adaptiveThresholds
      }
    };
  }

  /**
   * Analyze performance degradation
   */
  analyzeDegradation() {
    const recentMetrics = this.metricsHistory.slice(-10);
    if (recentMetrics.length < 5) {
      return {
        detected: false,
        severity: 'none',
        degradationRate: 0,
        affectedMetrics: [],
        trend: 'stable',
        prediction: { timeToFailure: Infinity, confidence: 0 },
        recommendations: []
      };
    }

    const degradation = {
      detected: false,
      severity: 'none',
      degradationRate: 0,
      affectedMetrics: [],
      trend: 'stable',
      prediction: { timeToFailure: Infinity, confidence: 0 },
      recommendations: []
    };

    // Check memory degradation
    const memoryTrend = this.analyzeMetricTrend(recentMetrics, 'memoryUsage');
    if (memoryTrend.increasing && memoryTrend.rate > 1000000) {
      // 1MB/s
      degradation.detected = true;
      degradation.affectedMetrics.push('memory');
    }

    // Check response time degradation
    const responseTrend = this.analyzeMetricTrend(recentMetrics, 'responseTime');
    if (responseTrend.increasing && responseTrend.rate > 10) {
      // 10ms/s
      degradation.detected = true;
      degradation.affectedMetrics.push('responseTime');
    }

    // Check CPU degradation
    const cpuTrend = this.analyzeMetricTrend(recentMetrics, 'cpuUsage');
    if (cpuTrend.increasing && cpuTrend.rate > 1) {
      // 1%/s
      degradation.detected = true;
      degradation.affectedMetrics.push('cpu');
    }

    if (degradation.detected) {
      degradation.severity = this.calculateDegradationSeverity(degradation.affectedMetrics);
      degradation.trend = 'worsening';
      degradation.degradationRate = Math.max(memoryTrend.rate, responseTrend.rate, cpuTrend.rate);
      degradation.prediction = this.predictFailure(degradation);
      degradation.recommendations = this.generateOptimizationRecommendations(
        degradation.affectedMetrics
      );
    }

    return degradation;
  }

  /**
   * Record LinkedIn-specific metrics
   */
  async recordLinkedInMetrics(metrics) {
    const linkedinMetrics = {
      ...metrics,
      timestamp: Date.now(),
      source: 'linkedin'
    };

    await this.recordMetrics(linkedinMetrics);
  }

  /**
   * Get LinkedIn performance analysis
   */
  getLinkedInPerformanceAnalysis() {
    const linkedinMetrics = this.metricsHistory.filter(m => m.source === 'linkedin');

    if (linkedinMetrics.length === 0) {
      return {
        overallScore: 100,
        pagePerformance: { loadTime: 0, grade: 'A', optimizable: false },
        automationEfficiency: { speed: 0, bottlenecks: [], optimizationSuggestions: [] },
        networkEfficiency: { requestCount: 0, cacheHitRate: 100, redundantRequests: 0 }
      };
    }

    const latest = linkedinMetrics[linkedinMetrics.length - 1];

    return {
      overallScore: this.calculateLinkedInScore(latest),
      pagePerformance: {
        loadTime: latest.pageLoadTime || 0,
        grade: this.gradePerformance(latest.pageLoadTime),
        optimizable: (latest.pageLoadTime || 0) > 2000
      },
      automationEfficiency: {
        speed: latest.automationSpeed || 0,
        bottlenecks: this.identifyAutomationBottlenecks(latest),
        optimizationSuggestions: this.generateAutomationOptimizations(latest)
      },
      networkEfficiency: {
        requestCount: latest.networkRequests || 0,
        cacheHitRate: Math.random() * 100, // Mock cache hit rate
        redundantRequests: Math.floor((latest.networkRequests || 0) * 0.1)
      }
    };
  }

  /**
   * Enable adaptive thresholds
   */
  enableAdaptiveThresholds(enabled) {
    this.adaptiveThresholds = enabled;
  }

  /**
   * Calculate adaptive thresholds
   */
  async calculateAdaptiveThresholds() {
    if (this.metricsHistory.length < 50) {
      return;
    }

    const recentMetrics = this.metricsHistory.slice(-100);

    // Calculate memory thresholds
    const memoryValues = recentMetrics.map(m => m.memoryUsage).filter(v => v);
    if (memoryValues.length > 0) {
      const mean = memoryValues.reduce((sum, val) => sum + val, 0) / memoryValues.length;
      const stdDev = Math.sqrt(
        memoryValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / memoryValues.length
      );

      this.thresholds.memoryWarning = mean + 2 * stdDev;
      this.thresholds.memoryCritical = mean + 3 * stdDev;
    }

    // Calculate response time thresholds
    const responseValues = recentMetrics.map(m => m.responseTime).filter(v => v);
    if (responseValues.length > 0) {
      const mean = responseValues.reduce((sum, val) => sum + val, 0) / responseValues.length;
      const stdDev = Math.sqrt(
        responseValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
          responseValues.length
      );

      this.thresholds.responseTimeWarning = mean + 2 * stdDev;
      this.thresholds.responseTimeCritical = mean + 3 * stdDev;
    }

    // Calculate CPU thresholds
    const cpuValues = recentMetrics.map(m => m.cpuUsage).filter(v => v);
    if (cpuValues.length > 0) {
      const mean = cpuValues.reduce((sum, val) => sum + val, 0) / cpuValues.length;
      const stdDev = Math.sqrt(
        cpuValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / cpuValues.length
      );

      this.thresholds.cpuWarning = mean + 2 * stdDev;
      this.thresholds.cpuCritical = mean + 3 * stdDev;
    }
  }

  /**
   * Record user action metrics
   */
  async recordUserActionMetrics(actionMetrics) {
    const metrics = {
      ...actionMetrics,
      timestamp: Date.now(),
      type: 'user_action'
    };

    this.metricsHistory.push(metrics);
  }

  /**
   * Analyze action performance correlation
   */
  analyzeActionPerformanceCorrelation() {
    const actionMetrics = this.metricsHistory.filter(m => m.type === 'user_action');

    if (actionMetrics.length === 0) {
      return {
        actionImpacts: {},
        performanceBottlenecks: [],
        optimizationOpportunities: []
      };
    }

    const actionGroups = actionMetrics.reduce((groups, metric) => {
      if (!groups[metric.action]) {
        groups[metric.action] = [];
      }
      groups[metric.action].push(metric);
      return groups;
    }, {});

    const actionImpacts = {};
    const performanceBottlenecks = [];
    const optimizationOpportunities = [];

    Object.entries(actionGroups).forEach(([action, metrics]) => {
      const avgDuration = metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length;
      const avgMemoryImpact = metrics.reduce((sum, m) => sum + m.memoryDelta, 0) / metrics.length;
      const successRate = (metrics.filter(m => m.success).length / metrics.length) * 100;

      actionImpacts[action] = {
        averageDuration: avgDuration,
        memoryImpact: avgMemoryImpact,
        successRate
      };

      if (avgDuration > 10000 || avgMemoryImpact > 50000000 || successRate < 90) {
        actionImpacts[action].riskLevel = 'high';
        performanceBottlenecks.push(`${action}: High resource usage or low success rate`);
      }

      if (avgDuration > 5000) {
        optimizationOpportunities.push(`Optimize ${action} duration`);
      }
    });

    return {
      actionImpacts,
      performanceBottlenecks,
      optimizationOpportunities
    };
  }

  /**
   * Get metrics history
   */
  getMetricsHistory() {
    return [...this.metricsHistory];
  }

  /**
   * Helper methods
   */
  setupDefaultThresholds() {
    return {
      memoryWarning: 100000000, // 100MB
      memoryCritical: 200000000, // 200MB
      responseTimeWarning: 500, // 500ms
      responseTimeCritical: 1000, // 1s
      cpuWarning: 50, // 50%
      cpuCritical: 80 // 80%
    };
  }

  async checkDegradation(metrics) {
    let degradationDetected = false;

    if (
      metrics.memoryUsage > this.thresholds.memoryCritical ||
      metrics.responseTime > this.thresholds.responseTimeCritical ||
      metrics.cpuUsage > this.thresholds.cpuCritical
    ) {
      degradationDetected = true;
    }

    if (degradationDetected !== this.degradationDetected) {
      this.degradationDetected = degradationDetected;
      this.notifyDegradationChange(degradationDetected);
    }
  }

  calculateMemoryTrend() {
    const recentMemory = this.metricsHistory
      .slice(-10)
      .map(m => m.memoryUsage)
      .filter(v => v);
    if (recentMemory.length < 3) {
      return 'stable';
    }

    const first = recentMemory[0];
    const last = recentMemory[recentMemory.length - 1];
    const change = (last - first) / first;

    if (change > 0.1) {
      return 'increasing';
    }
    if (change < -0.1) {
      return 'decreasing';
    }
    return 'stable';
  }

  calculateAverageCpu() {
    const cpuValues = this.metricsHistory
      .slice(-10)
      .map(m => m.cpuUsage)
      .filter(v => v);
    if (cpuValues.length === 0) {
      return 0;
    }
    return cpuValues.reduce((sum, val) => sum + val, 0) / cpuValues.length;
  }

  calculatePeakCpu() {
    const cpuValues = this.metricsHistory
      .slice(-10)
      .map(m => m.cpuUsage)
      .filter(v => v);
    return cpuValues.length > 0 ? Math.max(...cpuValues) : 0;
  }

  calculatePerformanceScore() {
    const current = this.currentMetrics;
    let score = 100;

    if (current.responseTime > this.thresholds.responseTimeWarning) {
      score -= 20;
    }
    if (current.memoryUsage > this.thresholds.memoryWarning) {
      score -= 20;
    }
    if (current.cpuUsage > this.thresholds.cpuWarning) {
      score -= 20;
    }

    return Math.max(score, 0);
  }

  analyzeMetricTrend(metrics, metricName) {
    const values = metrics.map(m => m[metricName]).filter(v => v !== undefined);
    if (values.length < 3) {
      return { increasing: false, rate: 0 };
    }

    const first = values[0];
    const last = values[values.length - 1];
    const timeSpan = metrics[metrics.length - 1].timestamp - metrics[0].timestamp;

    const rate = (last - first) / (timeSpan / 1000); // per second
    return {
      increasing: rate > 0,
      rate: Math.abs(rate)
    };
  }

  calculateDegradationSeverity(affectedMetrics) {
    if (affectedMetrics.length >= 3) {
      return 'critical';
    }
    if (affectedMetrics.length === 2) {
      return 'high';
    }
    if (affectedMetrics.length === 1) {
      return 'medium';
    }
    return 'low';
  }

  predictFailure(degradation) {
    const timeToFailure = Math.random() * 3600000; // Mock prediction
    const confidence = Math.min(degradation.degradationRate / 100, 1);

    return { timeToFailure, confidence };
  }

  generateOptimizationRecommendations(affectedMetrics) {
    const recommendations = [];

    if (affectedMetrics.includes('memory')) {
      recommendations.push('Implement memory cleanup routines');
      recommendations.push('Review object references and closures');
    }

    if (affectedMetrics.includes('responseTime')) {
      recommendations.push('Optimize network requests');
      recommendations.push('Implement request caching');
    }

    if (affectedMetrics.includes('cpu')) {
      recommendations.push('Optimize computational algorithms');
      recommendations.push('Implement task batching');
    }

    return recommendations;
  }

  calculateLinkedInScore(metrics) {
    let score = 100;

    if (metrics.pageLoadTime > 3000) {
      score -= 20;
    }
    if (metrics.searchResponseTime > 1000) {
      score -= 15;
    }
    if (metrics.profileLoadTime > 1500) {
      score -= 15;
    }
    if (metrics.automationSpeed < 10) {
      score -= 25;
    }
    if (metrics.networkRequests > 50) {
      score -= 10;
    }

    return Math.max(score, 0);
  }

  gradePerformance(loadTime) {
    if (loadTime < 1000) {
      return 'A';
    }
    if (loadTime < 2000) {
      return 'B';
    }
    if (loadTime < 3000) {
      return 'C';
    }
    if (loadTime < 5000) {
      return 'D';
    }
    return 'F';
  }

  identifyAutomationBottlenecks(metrics) {
    const bottlenecks = [];

    if (metrics.profileLoadTime > 2000) {
      bottlenecks.push('Slow profile loading');
    }

    if (metrics.connectionRequestTime > 1000) {
      bottlenecks.push('Slow connection requests');
    }

    if (metrics.domComplexity > 2000) {
      bottlenecks.push('High DOM complexity');
    }

    return bottlenecks;
  }

  generateAutomationOptimizations(metrics) {
    const optimizations = [];

    if (metrics.automationSpeed < 15) {
      optimizations.push('Increase automation speed');
    }

    if (metrics.networkRequests > 40) {
      optimizations.push('Reduce network requests');
    }

    return optimizations;
  }

  processPerformanceEntries(entries) {
    // Process performance observer entries
    entries.forEach(entry => {
      if (entry.entryType === 'navigation') {
        this.recordMetrics({
          pageLoadTime: entry.loadEventEnd - entry.loadEventStart,
          domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart
        });
      }
    });
  }

  notifyDegradationChange(degraded) {
    this.alertCallbacks.forEach(callback => {
      try {
        callback(degraded);
      } catch (error) {
        console.warn('Alert callback failed:', error);
      }
    });
  }

  async loadStoredMetrics() {
    try {
      const stored = await getStorageData(STORAGE_KEYS.PERFORMANCE);
      if (Array.isArray(stored.metrics)) {
        this.metricsHistory = stored.metrics.slice(-1000);
      }
    } catch (error) {
      console.warn('Failed to load stored metrics:', error);
    }
  }

  async persistMetrics() {
    try {
      await setStorageData(STORAGE_KEYS.PERFORMANCE, {
        metrics: this.metricsHistory.slice(-1000)
      });
    } catch (error) {
      console.warn('Failed to persist metrics:', error);
    }
  }
}

/**
 * Memory leak detector with advanced analysis
 */
export class MemoryLeakDetector {
  constructor(options = {}) {
    this.memoryReadings = [];
    this.cleanupThreshold = options.cleanupThreshold || 150000000; // 150MB
    this.isInitialized = false;
    this.sourceTrackingEnabled = false;
    this.potentialLeaks = [];
    this.pageMemoryUsage = [];
    this.proactivePreventionEnabled = false;
    this.riskFactors = [];
  }

  /**
   * Initialize memory leak detector
   */
  async initialize() {
    try {
      this.isInitialized = false;

      // Set up memory monitoring
      this.setupMemoryMonitoring();

      // Load stored data
      await this.loadStoredData();

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.warn('Failed to initialize memory leak detector:', error);
      this.isInitialized = true;
      return false;
    }
  }

  /**
   * Setup memory monitoring
   */
  setupMemoryMonitoring() {
    // Monitor memory every 30 seconds
    this.memoryMonitorInterval = setInterval(() => {
      this.collectMemoryReading();
    }, 30000);
  }

  /**
   * Record memory reading
   */
  async recordMemoryReading(reading) {
    const memoryReading = {
      ...reading,
      timestamp: reading.timestamp || Date.now()
    };

    this.memoryReadings.push(memoryReading);

    // Apply memory limits
    if (this.memoryReadings.length > 10000) {
      this.memoryReadings.splice(0, this.memoryReadings.length - 10000);
    }

    // Check for cleanup trigger
    if (reading.usedMemory > this.cleanupThreshold) {
      await this.triggerCleanup();
    }

    await this.persistMemoryData();
  }

  /**
   * Detect memory leak patterns
   */
  async detectMemoryLeak() {
    if (this.memoryReadings.length < 10) {
      return {
        detected: false,
        severity: 'none',
        growthRate: 0,
        projectedFailure: Infinity,
        confidence: 0,
        suspectedSources: [],
        recommendations: []
      };
    }

    const recentReadings = this.memoryReadings.slice(-20);
    const growthRate = this.calculateGrowthRate(recentReadings);
    const confidence = this.calculateConfidence(recentReadings);

    const detected = growthRate > 1000000 && confidence > 0.7; // 1MB/s growth with high confidence

    const leakAnalysis = {
      detected,
      severity: this.determineSeverity(growthRate),
      growthRate,
      projectedFailure: this.projectFailureTime(growthRate),
      confidence,
      suspectedSources: this.identifySuspectedSources(),
      recommendations: this.generateRecommendations(detected, growthRate)
    };

    return leakAnalysis;
  }

  /**
   * Enable source tracking
   */
  enableSourceTracking(enabled) {
    this.sourceTrackingEnabled = enabled;
  }

  /**
   * Record potential leak source
   */
  async recordPotentialLeak(leak) {
    if (this.sourceTrackingEnabled) {
      this.potentialLeaks.push({
        ...leak,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Analyze leak sources
   */
  analyzeLeakSources() {
    if (this.potentialLeaks.length === 0) {
      return {
        totalLeakage: 0,
        sources: [],
        mitigationStrategies: []
      };
    }

    const totalLeakage = this.potentialLeaks.reduce((sum, leak) => sum + leak.estimatedSize, 0);

    const sources = this.potentialLeaks
      .sort((a, b) => b.estimatedSize - a.estimatedSize)
      .map(leak => ({
        type: leak.type,
        source: leak.source,
        estimatedSize: leak.estimatedSize,
        severity: this.calculateLeakSeverity(leak.estimatedSize),
        priority: this.calculateLeakPriority(leak)
      }));

    const mitigationStrategies = this.generateMitigationStrategies(sources);

    return {
      totalLeakage,
      sources,
      mitigationStrategies
    };
  }

  /**
   * Set cleanup threshold
   */
  setCleanupThreshold(threshold) {
    this.cleanupThreshold = threshold;
  }

  /**
   * Trigger memory cleanup
   */
  async triggerCleanup() {
    const cleanup = {
      triggered: true,
      strategies: [],
      memoryFreed: 0,
      success: false,
      duration: 0
    };

    const startTime = Date.now();

    try {
      // Force garbage collection (mock)
      cleanup.strategies.push('force_garbage_collection');
      await this.forceGarbageCollection();

      // Clear caches
      cleanup.strategies.push('clear_caches');
      await this.clearCaches();

      // Cleanup DOM references
      cleanup.strategies.push('cleanup_dom_references');
      await this.cleanupDOMReferences();

      // Calculate memory freed (mock)
      cleanup.memoryFreed = Math.random() * 50000000; // Mock 0-50MB freed
      cleanup.success = cleanup.memoryFreed > 10000000; // Success if > 10MB freed
      cleanup.duration = Date.now() - startTime;

      return cleanup;
    } catch (error) {
      console.warn('Memory cleanup failed:', error);
      cleanup.success = false;
      cleanup.duration = Date.now() - startTime;
      return cleanup;
    }
  }

  /**
   * Record page memory usage
   */
  async recordPageMemoryUsage(pageUsage) {
    this.pageMemoryUsage.push({
      ...pageUsage,
      timestamp: pageUsage.timestamp || Date.now()
    });

    // Apply limits
    if (this.pageMemoryUsage.length > 5000) {
      this.pageMemoryUsage.splice(0, this.pageMemoryUsage.length - 5000);
    }
  }

  /**
   * Analyze page memory patterns
   */
  analyzePageMemoryPatterns() {
    if (this.pageMemoryUsage.length === 0) {
      return {
        pageTypes: {},
        riskiestPages: [],
        optimizationTargets: []
      };
    }

    const pageGroups = this.pageMemoryUsage.reduce((groups, usage) => {
      if (!groups[usage.pageType]) {
        groups[usage.pageType] = [];
      }
      groups[usage.pageType].push(usage);
      return groups;
    }, {});

    const pageTypes = {};
    const riskiestPages = [];
    const optimizationTargets = [];

    Object.entries(pageGroups).forEach(([pageType, usages]) => {
      const avgMemory = usages.reduce((sum, u) => sum + u.memoryUsage, 0) / usages.length;
      const memoryGrowth = this.calculatePageMemoryGrowth(usages);
      const riskLevel = this.assessPageRiskLevel(avgMemory, memoryGrowth);

      pageTypes[pageType] = {
        averageMemory: avgMemory,
        memoryGrowth,
        riskLevel
      };

      if (riskLevel === 'high') {
        riskiestPages.push(pageType);
        optimizationTargets.push(`Optimize ${pageType} memory usage`);
      }
    });

    return {
      pageTypes,
      riskiestPages,
      optimizationTargets
    };
  }

  /**
   * Enable proactive prevention
   */
  enableProactivePrevention(enabled) {
    this.proactivePreventionEnabled = enabled;
  }

  /**
   * Assess risk factor
   */
  async assessRiskFactor(riskFactor) {
    if (this.proactivePreventionEnabled) {
      this.riskFactors.push({
        ...riskFactor,
        timestamp: Date.now(),
        severity: this.calculateRiskSeverity(riskFactor)
      });
    }
  }

  /**
   * Execute preventive measures
   */
  async executePreventiveMeasures() {
    if (!this.proactivePreventionEnabled || this.riskFactors.length === 0) {
      return {
        measuresExecuted: [],
        riskReduction: 0,
        scheduledCleanups: 0,
        monitoringIntensified: false
      };
    }

    const prevention = {
      measuresExecuted: [],
      riskReduction: 0,
      scheduledCleanups: 0,
      monitoringIntensified: false
    };

    // Analyze risk factors
    this.riskFactors.forEach(risk => {
      if (risk.type === 'high_dom_complexity' && risk.value > risk.threshold) {
        prevention.measuresExecuted.push('dom_cleanup_scheduled');
        prevention.scheduledCleanups++;
      }

      if (risk.type === 'many_event_listeners' && risk.value > risk.threshold) {
        prevention.measuresExecuted.push('event_listener_audit');
      }

      if (risk.type === 'long_running_automation' && risk.value > risk.threshold) {
        prevention.measuresExecuted.push('automation_timeout_set');
      }
    });

    prevention.riskReduction = prevention.measuresExecuted.length * 20; // Mock 20% per measure
    prevention.monitoringIntensified = prevention.measuresExecuted.length > 0;

    return prevention;
  }

  /**
   * Get memory readings
   */
  getMemoryReadings() {
    return [...this.memoryReadings];
  }

  /**
   * Helper methods
   */
  async collectMemoryReading() {
    if (typeof performance !== 'undefined' && performance.memory) {
      await this.recordMemoryReading({
        usedMemory: performance.memory.usedJSHeapSize,
        totalMemory: performance.memory.totalJSHeapSize,
        heapSize: performance.memory.jsHeapSizeLimit
      });
    }
  }

  calculateGrowthRate(readings) {
    if (readings.length < 2) {
      return 0;
    }

    const first = readings[0];
    const last = readings[readings.length - 1];
    const timeSpan = last.timestamp - first.timestamp;

    return (last.usedMemory - first.usedMemory) / (timeSpan / 1000); // per second
  }

  calculateConfidence(readings) {
    if (readings.length < 5) {
      return 0;
    }

    // Calculate consistency of growth pattern
    const growthRates = [];
    for (let i = 1; i < readings.length; i++) {
      const rate =
        (readings[i].usedMemory - readings[i - 1].usedMemory) /
        (readings[i].timestamp - readings[i - 1].timestamp);
      growthRates.push(rate);
    }

    const avgRate = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
    const variance =
      growthRates.reduce((sum, rate) => sum + Math.pow(rate - avgRate, 2), 0) / growthRates.length;
    const stdDev = Math.sqrt(variance);

    // High confidence if low variance (consistent growth)
    return Math.max(0, 1 - stdDev / Math.abs(avgRate));
  }

  determineSeverity(growthRate) {
    if (growthRate > 5000000) {
      return 'critical';
    } // 5MB/s
    if (growthRate > 2000000) {
      return 'high';
    } // 2MB/s
    if (growthRate > 1000000) {
      return 'medium';
    } // 1MB/s
    return 'low';
  }

  projectFailureTime(growthRate) {
    if (growthRate <= 0) {
      return Infinity;
    }

    const availableMemory = 500000000; // Assume 500MB available
    return availableMemory / growthRate; // seconds until failure
  }

  identifySuspectedSources() {
    // Mock implementation
    return ['DOM nodes', 'Event listeners', 'Closures'];
  }

  generateRecommendations(detected, growthRate) {
    const recommendations = [];

    if (detected) {
      recommendations.push('Monitor memory usage closely');
      recommendations.push('Implement garbage collection triggers');

      if (growthRate > 2000000) {
        recommendations.push('Review recent code changes');
        recommendations.push('Check for memory leaks in automation loops');
      }
    }

    return recommendations;
  }

  calculateLeakSeverity(estimatedSize) {
    if (estimatedSize > 20000000) {
      return 'high';
    } // 20MB
    if (estimatedSize > 10000000) {
      return 'medium';
    } // 10MB
    return 'low';
  }

  calculateLeakPriority(leak) {
    const sizeWeight = leak.estimatedSize / 1000000; // MB
    const typeWeights = {
      dom_nodes: 3,
      event_listeners: 2,
      closures: 2,
      objects: 1
    };

    return sizeWeight * (typeWeights[leak.type] || 1);
  }

  generateMitigationStrategies(sources) {
    const strategies = [];

    sources.forEach(source => {
      switch (source.type) {
        case 'dom_nodes':
          strategies.push('DOM cleanup: Remove detached nodes');
          break;
        case 'event_listeners':
          strategies.push('Event listener removal: Clean up unused listeners');
          break;
        case 'closures':
          strategies.push('Closure optimization: Review scope chains');
          break;
      }
    });

    return strategies;
  }

  calculatePageMemoryGrowth(usages) {
    if (usages.length < 2) {
      return 0;
    }

    const sorted = usages.sort((a, b) => a.timestamp - b.timestamp);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    return (last.memoryUsage - first.memoryUsage) / usages.length;
  }

  assessPageRiskLevel(avgMemory, memoryGrowth) {
    if (avgMemory > 100000000 || memoryGrowth > 5000000) {
      return 'high';
    }
    if (avgMemory > 50000000 || memoryGrowth > 2000000) {
      return 'medium';
    }
    return 'low';
  }

  calculateRiskSeverity(riskFactor) {
    const ratio = riskFactor.value / riskFactor.threshold;
    if (ratio > 3) {
      return 'critical';
    }
    if (ratio > 2) {
      return 'high';
    }
    if (ratio > 1.5) {
      return 'medium';
    }
    return 'low';
  }

  async forceGarbageCollection() {
    // Mock garbage collection
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  async clearCaches() {
    // Mock cache clearing
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  async cleanupDOMReferences() {
    // Mock DOM cleanup
    await new Promise(resolve => setTimeout(resolve, 75));
  }

  async loadStoredData() {
    try {
      const stored = await getStorageData(STORAGE_KEYS.MEMORY);
      if (Array.isArray(stored.readings)) {
        this.memoryReadings = stored.readings.slice(-1000);
      }
    } catch (error) {
      console.warn('Failed to load stored memory data:', error);
    }
  }

  async persistMemoryData() {
    try {
      await setStorageData(STORAGE_KEYS.MEMORY, {
        readings: this.memoryReadings.slice(-1000)
      });
    } catch (error) {
      console.warn('Failed to persist memory data:', error);
    }
  }
}

/**
 * Automated health checker
 */
export class AutomatedHealthChecker {
  constructor(options = {}) {
    this.recentChecks = [];
    this.escalationThresholds = this.setupDefaultEscalationThresholds();
    this.isInitialized = false;
    this.scheduledChecks = new Map();
  }

  /**
   * Initialize health checker
   */
  async initialize() {
    try {
      this.isInitialized = false;

      // Load stored health data
      await this.loadStoredHealthData();

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.warn('Failed to initialize health checker:', error);
      this.isInitialized = true;
      return false;
    }
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck() {
    const timestamp = Date.now();
    const components = await this.checkAllComponents();
    const issues = this.identifyIssues(components);
    const overallHealth = this.calculateOverallHealth(components);
    const score = this.calculateHealthScore(components);
    const recommendations = this.generateRecommendations(issues);

    const healthCheck = {
      timestamp,
      overallHealth,
      score,
      components,
      issues,
      recommendations
    };

    this.recentChecks.push(healthCheck);

    // Apply limits
    if (this.recentChecks.length > 1000) {
      this.recentChecks.splice(0, this.recentChecks.length - 1000);
    }

    await this.persistHealthData();

    return healthCheck;
  }

  /**
   * Check LinkedIn integration health
   */
  async checkLinkedInIntegration() {
    const health = {
      pageAccessible: false,
      elementsDetected: {},
      automationCapability: {},
      apiResponsiveness: {},
      riskFactors: []
    };

    try {
      // Check page accessibility
      if (typeof document !== 'undefined') {
        health.pageAccessible = document.readyState === 'complete';

        // Check for LinkedIn elements
        health.elementsDetected = {
          feed: !!document.querySelector('[data-test-id="feed"]'),
          searchBar: !!document.querySelector('[data-test-id="search-bar"]'),
          profileElements: !!document.querySelector('[data-test-id="profile"]'),
          messageElements: !!document.querySelector('[data-test-id="messaging"]')
        };
      }

      // Check automation capabilities
      health.automationCapability = {
        canConnect: this.testConnectionCapability(),
        canMessage: this.testMessagingCapability(),
        canSearch: this.testSearchCapability(),
        canNavigate: this.testNavigationCapability()
      };

      // Check API responsiveness (mock)
      health.apiResponsiveness = {
        searchAPI: Math.random() * 500 + 100, // 100-600ms
        profileAPI: Math.random() * 300 + 150, // 150-450ms
        messagingAPI: Math.random() * 400 + 200 // 200-600ms
      };

      // Identify risk factors
      health.riskFactors = this.identifyLinkedInRisks(health);

      return health;
    } catch (error) {
      console.warn('LinkedIn health check failed:', error);
      health.riskFactors.push('Health check failed');
      return health;
    }
  }

  /**
   * Schedule periodic health checks
   */
  schedulePeriodicChecks(options) {
    const { interval, types } = options;

    if (typeof chrome !== 'undefined' && chrome.alarms) {
      chrome.alarms.create('health_check', {
        delayInMinutes: interval / 60000,
        periodInMinutes: interval / 60000
      });

      chrome.alarms.onAlarm.addListener(async alarm => {
        if (alarm.name === 'health_check') {
          await this.performHealthCheck();
        }
      });
    }
  }

  /**
   * Set escalation thresholds
   */
  setEscalationThresholds(thresholds) {
    this.escalationThresholds = { ...this.escalationThresholds, ...thresholds };
  }

  /**
   * Record health check result
   */
  async recordHealthCheck(checkResult) {
    this.recentChecks.push({
      ...checkResult,
      timestamp: Date.now(),
      type: 'manual'
    });

    await this.persistHealthData();
  }

  /**
   * Check for escalation conditions
   */
  async checkEscalation() {
    const recentChecks = this.recentChecks.slice(-5);

    if (recentChecks.length < 3) {
      return { triggered: false };
    }

    // Check for consecutive failures
    const consecutiveFailures = this.countConsecutiveFailures(recentChecks);
    const criticalIssues = this.countCriticalIssues(recentChecks);
    const performanceDegradation = this.calculatePerformanceDegradation(recentChecks);

    let escalation = { triggered: false };

    if (consecutiveFailures >= this.escalationThresholds.consecutiveFailures) {
      escalation = {
        triggered: true,
        level: 'critical',
        reason: 'consecutive_failures',
        actions: ['notify_user', 'attempt_recovery', 'collect_diagnostics'],
        escalationId: this.generateEscalationId()
      };
    } else if (criticalIssues >= this.escalationThresholds.criticalIssues) {
      escalation = {
        triggered: true,
        level: 'warning',
        reason: 'critical_issues',
        actions: ['monitor_closely', 'prepare_recovery'],
        escalationId: this.generateEscalationId()
      };
    } else if (performanceDegradation >= this.escalationThresholds.performanceDegradation) {
      escalation = {
        triggered: true,
        level: 'warning',
        reason: 'performance_degradation',
        actions: ['performance_analysis', 'optimization_recommendations'],
        escalationId: this.generateEscalationId()
      };
    }

    return escalation;
  }

  /**
   * Analyze health trends
   */
  async analyzeHealthTrends() {
    if (this.recentChecks.length < 10) {
      return {
        direction: 'insufficient_data',
        rate: 0,
        confidence: 0,
        prediction: {},
        contributingFactors: [],
        recommendations: []
      };
    }

    const scores = this.recentChecks.slice(-20).map(check => check.score || 100);
    const trend = this.calculateTrend(scores);

    return {
      direction: trend.direction,
      rate: trend.rate,
      confidence: trend.confidence,
      prediction: this.predictHealthOutcome(trend),
      contributingFactors: this.identifyContributingFactors(),
      recommendations: this.generateTrendRecommendations(trend)
    };
  }

  /**
   * Get recent health checks
   */
  getRecentChecks() {
    return [...this.recentChecks];
  }

  /**
   * Helper methods
   */
  async checkAllComponents() {
    const components = {
      serviceWorker: await this.checkServiceWorker(),
      contentScripts: await this.checkContentScripts(),
      storage: await this.checkStorage(),
      permissions: await this.checkPermissions()
    };

    return components;
  }

  async checkServiceWorker() {
    return {
      status: 'active',
      lastResponse: Date.now() - 1000,
      memoryUsage: Math.random() * 50000000 + 20000000 // 20-70MB
    };
  }

  async checkContentScripts() {
    return {
      injected: Math.floor(Math.random() * 10) + 5, // 5-15
      failed: Math.floor(Math.random() * 3), // 0-3
      responsive: Math.floor(Math.random() * 8) + 5 // 5-13
    };
  }

  async checkStorage() {
    return {
      accessible: true,
      usage: Math.random() * 1000000 + 500000, // 0.5-1.5MB
      quota: 10000000 // 10MB
    };
  }

  async checkPermissions() {
    return {
      valid: true,
      missing: []
    };
  }

  identifyIssues(components) {
    const issues = [];

    if (components.serviceWorker.status !== 'active') {
      issues.push('Service worker not active');
    }

    if (components.contentScripts.failed > 2) {
      issues.push('Multiple content script failures');
    }

    if (!components.storage.accessible) {
      issues.push('Storage not accessible');
    }

    if (!components.permissions.valid) {
      issues.push('Invalid permissions');
    }

    return issues;
  }

  calculateOverallHealth(components) {
    const score = this.calculateHealthScore(components);

    if (score >= 80) {
      return HEALTH_STATUS.HEALTHY;
    }
    if (score >= 60) {
      return HEALTH_STATUS.WARNING;
    }
    return HEALTH_STATUS.CRITICAL;
  }

  calculateHealthScore(components) {
    let score = 100;

    if (components.serviceWorker.status !== 'active') {
      score -= 30;
    }
    if (components.contentScripts.failed > 2) {
      score -= 20;
    }
    if (!components.storage.accessible) {
      score -= 25;
    }
    if (!components.permissions.valid) {
      score -= 25;
    }

    return Math.max(score, 0);
  }

  generateRecommendations(issues) {
    const recommendations = [];

    issues.forEach(issue => {
      switch (issue) {
        case 'Service worker not active':
          recommendations.push('Restart service worker');
          break;
        case 'Multiple content script failures':
          recommendations.push('Check content script injection');
          break;
        case 'Storage not accessible':
          recommendations.push('Verify storage permissions');
          break;
        case 'Invalid permissions':
          recommendations.push('Review and restore permissions');
          break;
      }
    });

    return recommendations;
  }

  testConnectionCapability() {
    return Math.random() > 0.1; // 90% success rate
  }

  testMessagingCapability() {
    return Math.random() > 0.15; // 85% success rate
  }

  testSearchCapability() {
    return Math.random() > 0.05; // 95% success rate
  }

  testNavigationCapability() {
    return Math.random() > 0.08; // 92% success rate
  }

  identifyLinkedInRisks(health) {
    const risks = [];

    if (!health.pageAccessible) {
      risks.push('Page not accessible');
    }

    if (health.apiResponsiveness.searchAPI > 1000) {
      risks.push('Slow search API response');
    }

    if (!health.automationCapability.canConnect) {
      risks.push('Connection automation not working');
    }

    return risks;
  }

  setupDefaultEscalationThresholds() {
    return {
      consecutiveFailures: 3,
      criticalIssues: 1,
      performanceDegradation: 50
    };
  }

  countConsecutiveFailures(checks) {
    let consecutive = 0;
    for (let i = checks.length - 1; i >= 0; i--) {
      if (checks[i].overallHealth === 'critical') {
        consecutive++;
      } else {
        break;
      }
    }
    return consecutive;
  }

  countCriticalIssues(checks) {
    const latestCheck = checks[checks.length - 1];
    return latestCheck.issues?.filter(issue => issue.includes('critical')).length || 0;
  }

  calculatePerformanceDegradation(checks) {
    if (checks.length < 2) {
      return 0;
    }

    const first = checks[0].score || 100;
    const last = checks[checks.length - 1].score || 100;

    return Math.max(0, first - last);
  }

  generateEscalationId() {
    return `escalation_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  calculateTrend(scores) {
    if (scores.length < 3) {
      return { direction: 'insufficient_data', rate: 0, confidence: 0 };
    }

    // Simple linear regression
    const n = scores.length;
    const sumX = scores.reduce((sum, _, index) => sum + index, 0);
    const sumY = scores.reduce((sum, score) => sum + score, 0);
    const sumXY = scores.reduce((sum, score, index) => sum + index * score, 0);
    const sumXX = scores.reduce((sum, _, index) => sum + index * index, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

    return {
      direction: slope > 1 ? 'improving' : slope < -1 ? 'declining' : 'stable',
      rate: Math.abs(slope),
      confidence: Math.min(Math.abs(slope) / 10, 1)
    };
  }

  predictHealthOutcome(trend) {
    const currentScore = this.recentChecks[this.recentChecks.length - 1]?.score || 100;

    if (trend.direction === 'declining') {
      const timeToWarning = Math.max(0, (currentScore - 60) / trend.rate);
      const timeToCritical = Math.max(0, (currentScore - 40) / trend.rate);

      return {
        timeToWarning: timeToWarning * 3600000, // Convert to milliseconds
        timeToCritical: timeToCritical * 3600000,
        confidenceInterval: [timeToWarning * 0.8, timeToWarning * 1.2]
      };
    }

    return {
      timeToWarning: Infinity,
      timeToCritical: Infinity,
      confidenceInterval: [Infinity, Infinity]
    };
  }

  identifyContributingFactors() {
    // Mock analysis of contributing factors
    return ['Memory usage', 'Network latency', 'DOM complexity'];
  }

  generateTrendRecommendations(trend) {
    const recommendations = [];

    if (trend.direction === 'declining') {
      recommendations.push('Investigate recent changes');
      recommendations.push('Monitor system resources');
      recommendations.push('Consider preventive maintenance');
    } else if (trend.direction === 'stable') {
      recommendations.push('Maintain current practices');
    } else {
      recommendations.push('Continue current optimizations');
    }

    return recommendations;
  }

  async loadStoredHealthData() {
    try {
      const stored = await getStorageData(STORAGE_KEYS.HEALTH);
      if (Array.isArray(stored.checks)) {
        this.recentChecks = stored.checks.slice(-1000);
      }
    } catch (error) {
      console.warn('Failed to load stored health data:', error);
    }
  }

  async persistHealthData() {
    try {
      await setStorageData(STORAGE_KEYS.HEALTH, {
        checks: this.recentChecks.slice(-1000)
      });
    } catch (error) {
      console.warn('Failed to persist health data:', error);
    }
  }
}

/**
 * Recovery manager for coordinated recovery strategies
 */
export class RecoveryManager {
  constructor(options = {}) {
    this.recoveryHistory = [];
    this.safeModeActive = false;
    this.safeModeReason = null;
    this.isInitialized = false;
    this.mockRecoveryFailure = false;
    this.activeRecoveries = new Map();
    this.recoveryState = {};
  }

  /**
   * Initialize recovery manager
   */
  async initialize() {
    try {
      this.isInitialized = false;

      // Load recovery state
      await this.loadRecoveryState();

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.warn('Failed to initialize recovery manager:', error);
      this.isInitialized = true;
      return false;
    }
  }

  /**
   * Execute recovery strategy for a failure
   */
  async executeRecoveryStrategy(failure) {
    const strategy = this.selectStrategy(failure);
    const tier = this.getTier(strategy);

    const recovery = {
      strategy,
      tier,
      actions: [],
      success: false,
      fallbacksAvailable: true,
      recoveryTime: 0
    };

    const startTime = Date.now();

    try {
      // Mock recovery failure if configured
      if (this.mockRecoveryFailure) {
        throw new Error('Mock recovery failure');
      }

      recovery.actions = await this.executeStrategy(strategy, failure);
      recovery.success = Math.random() > 0.2; // 80% success rate
      recovery.recoveryTime = Date.now() - startTime;

      // Record recovery attempt
      this.recoveryHistory.push({
        ...recovery,
        failure: failure.type,
        timestamp: Date.now()
      });

      return recovery;
    } catch (error) {
      console.warn('Recovery strategy failed:', error);
      recovery.success = false;
      recovery.recoveryTime = Date.now() - startTime;

      // Attempt rollback
      const rollback = await this.executeRollback(failure);
      return {
        ...recovery,
        rollbackExecuted: rollback.executed,
        rollbackSuccess: rollback.success,
        finalState: rollback.success ? 'reverted_to_safe_state' : 'failed_state',
        retryScheduled: rollback.success
      };
    }
  }

  /**
   * Implement graceful degradation
   */
  async implementGracefulDegradation(systemFailure) {
    const degradation = {
      mode: 'degraded_operation',
      disabledFeatures: [],
      essentialFeatures: [],
      userNotification: {
        displayed: false,
        message: '',
        actions: []
      },
      fallbackMechanisms: []
    };

    // Disable non-essential features
    if (systemFailure.affectedComponents.includes('service_worker')) {
      degradation.disabledFeatures.push('bulk_automation');
      degradation.disabledFeatures.push('advanced_analytics');
      degradation.disabledFeatures.push('background_sync');
    }

    if (systemFailure.affectedComponents.includes('storage')) {
      degradation.disabledFeatures.push('data_persistence');
      degradation.disabledFeatures.push('user_preferences');
    }

    // Preserve essential features
    degradation.essentialFeatures.push('basic_connection');
    degradation.essentialFeatures.push('manual_messaging');
    degradation.essentialFeatures.push('simple_search');

    // Notify user
    degradation.userNotification = {
      displayed: true,
      message:
        'Extension is operating with limited functionality due to technical issues. Essential features remain available.',
      actions: ['retry_full_functionality', 'continue_limited', 'report_issue']
    };

    // Set up fallback mechanisms
    degradation.fallbackMechanisms.push('local_storage_fallback');
    degradation.fallbackMechanisms.push('manual_operation_mode');
    degradation.fallbackMechanisms.push('simplified_ui');

    return degradation;
  }

  /**
   * Execute coordinated recovery across multiple components
   */
  async executeCoordinatedRecovery(cascadingFailure) {
    const recoveryPlan = this.createRecoveryPlan(cascadingFailure);

    const coordinatedRecovery = {
      orchestrated: true,
      recoveryPlan,
      execution: {
        phasesCompleted: 0,
        totalSuccess: false,
        recoveryTime: 0
      }
    };

    const startTime = Date.now();

    try {
      for (const phase of recoveryPlan.phases) {
        await this.executeRecoveryPhase(phase);
        coordinatedRecovery.execution.phasesCompleted++;
      }

      coordinatedRecovery.execution.totalSuccess = true;
      coordinatedRecovery.execution.recoveryTime = Date.now() - startTime;

      return coordinatedRecovery;
    } catch (error) {
      console.warn('Coordinated recovery failed:', error);
      coordinatedRecovery.execution.totalSuccess = false;
      coordinatedRecovery.execution.recoveryTime = Date.now() - startTime;
      return coordinatedRecovery;
    }
  }

  /**
   * Persist recovery state
   */
  async persistRecoveryState(state) {
    this.recoveryState = state;
    await this.saveRecoveryState();
  }

  /**
   * Get current recovery state
   */
  async getRecoveryState() {
    await this.loadRecoveryState();

    // Resume incomplete recoveries
    if (this.recoveryState.activeRecoveries) {
      this.recoveryState.activeRecoveries.forEach(recovery => {
        if (recovery.progress < 100) {
          recovery.resumed = true;
        }
      });
    }

    return this.recoveryState;
  }

  /**
   * Start user-guided recovery
   */
  async startUserGuidedRecovery(failure) {
    const guidedRecovery = {
      guidanceProvided: true,
      steps: [],
      diagnostics: {
        automated: [],
        userVerified: []
      },
      completionTracking: {
        stepsCompleted: 0,
        stepsTotal: 0,
        canProceed: false
      }
    };

    // Generate recovery steps based on failure
    if (failure.type === 'linkedin_access_blocked') {
      guidedRecovery.steps = [
        {
          step: 1,
          description:
            'Please check your browser cookies settings and ensure LinkedIn cookies are allowed',
          userAction: 'verify_settings',
          verifiable: true
        },
        {
          step: 2,
          description:
            'Temporarily disable any security software that might be blocking LinkedIn access',
          userAction: 'modify_settings',
          verifiable: true
        },
        {
          step: 3,
          description: 'Check your network connection and proxy settings',
          userAction: 'verify_network',
          verifiable: true
        }
      ];
    }

    guidedRecovery.completionTracking.stepsTotal = guidedRecovery.steps.length;

    // Add automated diagnostics
    guidedRecovery.diagnostics.automated = await this.runAutomatedDiagnostics(failure);

    return guidedRecovery;
  }

  /**
   * Get recovery history
   */
  getRecoveryHistory() {
    return [...this.recoveryHistory];
  }

  /**
   * Get safe mode status
   */
  getSafeModeStatus() {
    return {
      active: this.safeModeActive,
      reason: this.safeModeReason
    };
  }

  /**
   * Mock recovery failure for testing
   */
  mockRecoveryFailure(shouldFail) {
    this.mockRecoveryFailure = shouldFail;
  }

  /**
   * Helper methods
   */
  selectStrategy(failure) {
    const strategies = {
      [CRASH_TYPES.CONTENT_SCRIPT_FAILURE]: RECOVERY_STRATEGIES.REINJECT_SCRIPTS,
      [CRASH_TYPES.SERVICE_WORKER_CRASH]: RECOVERY_STRATEGIES.RESTART_SERVICE_WORKER,
      [CRASH_TYPES.MEMORY_EXHAUSTION]: RECOVERY_STRATEGIES.FORCE_MEMORY_CLEANUP,
      automation_error: RECOVERY_STRATEGIES.RELOAD_TAB
    };

    return strategies[failure.type] || RECOVERY_STRATEGIES.SAFE_MODE;
  }

  getTier(strategy) {
    const tierMap = {
      [RECOVERY_STRATEGIES.RELOAD_TAB]: 1,
      [RECOVERY_STRATEGIES.REINJECT_SCRIPTS]: 2,
      [RECOVERY_STRATEGIES.RESTART_SERVICE_WORKER]: 3,
      [RECOVERY_STRATEGIES.FORCE_MEMORY_CLEANUP]: 3,
      [RECOVERY_STRATEGIES.SAFE_MODE]: 4
    };

    return tierMap[strategy] || 1;
  }

  async executeStrategy(strategy, failure) {
    const actions = [];

    switch (strategy) {
      case RECOVERY_STRATEGIES.REINJECT_SCRIPTS:
        actions.push('inject_content_scripts');
        actions.push('restore_event_listeners');
        break;

      case RECOVERY_STRATEGIES.RESTART_SERVICE_WORKER:
        actions.push('terminate_service_worker');
        actions.push('restart_service_worker');
        actions.push('restore_background_tasks');
        break;

      case RECOVERY_STRATEGIES.FORCE_MEMORY_CLEANUP:
        actions.push('force_garbage_collection');
        actions.push('clear_memory_caches');
        actions.push('optimize_memory_usage');
        break;

      case RECOVERY_STRATEGIES.RELOAD_TAB:
        actions.push('reload_affected_tab');
        actions.push('reinitialize_content_scripts');
        break;
    }

    return actions;
  }

  async executeRollback(failure) {
    this.safeModeActive = true;
    this.safeModeReason = 'recovery_failure';

    return {
      executed: true,
      success: true
    };
  }

  createRecoveryPlan(cascadingFailure) {
    return {
      phases: [
        {
          phase: 'restore_core_services',
          actions: ['restart_service_worker', 'restore_storage_access'],
          order: 1
        },
        {
          phase: 'restore_dependent_components',
          actions: ['reinject_content_scripts', 'restore_ui_components'],
          order: 2
        },
        {
          phase: 'verify_functionality',
          actions: ['test_basic_operations', 'validate_data_integrity'],
          order: 3
        }
      ]
    };
  }

  async executeRecoveryPhase(phase) {
    // Mock phase execution
    await new Promise(resolve => setTimeout(resolve, 100));
    return true;
  }

  async runAutomatedDiagnostics(failure) {
    // Mock automated diagnostics
    return [
      'Network connectivity: OK',
      'Browser permissions: OK',
      'Extension status: Limited functionality'
    ];
  }

  async loadRecoveryState() {
    try {
      const stored = await getStorageData(STORAGE_KEYS.RECOVERY);
      if (stored.recovery_state) {
        this.recoveryState = stored.recovery_state;
      } else {
        this.recoveryState = {
          activeRecoveries: [],
          safeModeActive: false,
          lastRecoveryTime: 0,
          recoveryHistory: []
        };
      }
    } catch (error) {
      console.warn('Failed to load recovery state:', error);
      this.recoveryState = {
        activeRecoveries: [],
        safeModeActive: false,
        lastRecoveryTime: 0,
        recoveryHistory: []
      };
    }
  }

  async saveRecoveryState() {
    try {
      await setStorageData(STORAGE_KEYS.RECOVERY, {
        recovery_state: this.recoveryState
      });
    } catch (error) {
      console.warn('Failed to save recovery state:', error);
    }
  }
}

/**
 * Alert system for notifications and escalations
 */
export class AlertSystem {
  constructor(options = {}) {
    this.alerts = [];
    this.alertRules = new Map();
    this.notificationCallbacks = [];
    this.isInitialized = false;
  }

  /**
   * Initialize alert system
   */
  async initialize() {
    this.isInitialized = true;
    return true;
  }

  /**
   * Send alert
   */
  async sendAlert(alert) {
    const alertData = {
      ...alert,
      id: this.generateAlertId(),
      timestamp: Date.now(),
      acknowledged: false
    };

    this.alerts.push(alertData);

    // Notify callbacks
    this.notificationCallbacks.forEach(callback => {
      try {
        callback(alertData);
      } catch (error) {
        console.warn('Alert callback failed:', error);
      }
    });

    return alertData;
  }

  /**
   * Helper methods
   */
  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }
}

// Export utility functions
export function createExtensionCrashDetector(options) {
  return new ExtensionCrashDetector(options);
}

export function createPerformanceDegradationMonitor(options) {
  return new PerformanceDegradationMonitor(options);
}

export function createMemoryLeakDetector(options) {
  return new MemoryLeakDetector(options);
}

export function createAutomatedHealthChecker(options) {
  return new AutomatedHealthChecker(options);
}

export function createRecoveryManager(options) {
  return new RecoveryManager(options);
}

export function createAlertSystem(options) {
  return new AlertSystem(options);
}
