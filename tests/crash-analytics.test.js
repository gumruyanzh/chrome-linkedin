// Task 6.4: Crash Analytics and Automated Monitoring Tests
// Comprehensive tests for extension crash detection, performance monitoring, and automated recovery

import { jest } from '@jest/globals';

// Mock dependencies
jest.mock('../src/utils/storage.js');
jest.mock('../src/utils/encryption.js');
jest.mock('../src/utils/real-time-analytics.js');
jest.mock('../src/utils/error-reporting.js');

describe('Crash Analytics and Automated Monitoring (Task 6.4)', () => {
  let crashDetector;
  let performanceMonitor;
  let memoryLeakDetector;
  let healthChecker;
  let recoveryManager;
  let alertSystem;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock browser APIs
    global.chrome = {
      runtime: {
        onSuspend: { addListener: jest.fn() },
        onSuspendCanceled: { addListener: jest.fn() },
        onStartup: { addListener: jest.fn() },
        onInstalled: { addListener: jest.fn() },
        getManifest: jest.fn(() => ({ version: '1.0.0' })),
        reload: jest.fn(),
        id: 'test-extension-id'
      },
      tabs: {
        query: jest.fn(),
        reload: jest.fn(),
        create: jest.fn()
      },
      storage: {
        local: {
          get: jest.fn(),
          set: jest.fn(),
          clear: jest.fn()
        }
      },
      alarms: {
        create: jest.fn(),
        clear: jest.fn(),
        onAlarm: { addListener: jest.fn() }
      }
    };

    // Mock performance APIs
    global.performance = {
      now: jest.fn(() => Date.now()),
      memory: {
        usedJSHeapSize: 10000000,
        totalJSHeapSize: 15000000,
        jsHeapSizeLimit: 100000000
      },
      mark: jest.fn(),
      measure: jest.fn(),
      getEntriesByType: jest.fn(() => [])
    };

    // Mock PerformanceObserver
    global.PerformanceObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      disconnect: jest.fn(),
      takeRecords: jest.fn(() => [])
    }));

    // Initialize components (will be implemented)
    const {
      ExtensionCrashDetector,
      PerformanceDegradationMonitor,
      MemoryLeakDetector,
      AutomatedHealthChecker,
      RecoveryManager,
      AlertSystem
    } = require('../src/utils/crash-analytics.js');

    crashDetector = new ExtensionCrashDetector();
    performanceMonitor = new PerformanceDegradationMonitor();
    memoryLeakDetector = new MemoryLeakDetector();
    healthChecker = new AutomatedHealthChecker();
    recoveryManager = new RecoveryManager();
    alertSystem = new AlertSystem();
  });

  describe('Extension Crash Detection and Recovery', () => {
    test('should detect extension context invalidation', async () => {
      await crashDetector.initialize();

      // Simulate extension context invalidation
      chrome.runtime.lastError = { message: 'Extension context invalidated' };

      const crashEvent = await crashDetector.detectContextInvalidation();

      expect(crashEvent).toMatchObject({
        type: 'context_invalidation',
        timestamp: expect.any(Number),
        cause: 'extension_context_invalidated',
        severity: 'critical',
        recoverable: true,
        metadata: expect.objectContaining({
          extensionId: 'test-extension-id',
          version: '1.0.0'
        })
      });
    });

    test('should detect service worker crashes', async () => {
      await crashDetector.initialize();

      // Mock service worker crash
      const serviceWorkerCrash = {
        type: 'service_worker_crash',
        timestamp: Date.now(),
        reason: 'memory_limit_exceeded',
        lastActiveTime: Date.now() - 30000
      };

      await crashDetector.handleServiceWorkerCrash(serviceWorkerCrash);

      const crashes = crashDetector.getDetectedCrashes();
      expect(crashes).toHaveLength(1);
      expect(crashes[0]).toMatchObject({
        type: 'service_worker_crash',
        reason: 'memory_limit_exceeded',
        downtime: expect.any(Number),
        impactAssessment: expect.objectContaining({
          affectedFeatures: expect.any(Array),
          userImpact: expect.any(String)
        })
      });
    });

    test('should detect content script failures', async () => {
      await crashDetector.initialize();

      const contentScriptFailure = {
        tabId: 123,
        url: 'https://www.linkedin.com/feed',
        error: 'Script injection failed',
        timestamp: Date.now(),
        retryCount: 0
      };

      await crashDetector.handleContentScriptFailure(contentScriptFailure);

      const failures = crashDetector.getContentScriptFailures();
      expect(failures).toHaveLength(1);
      expect(failures[0]).toMatchObject({
        tabId: 123,
        url: 'https://www.linkedin.com/feed',
        error: 'Script injection failed',
        status: 'failed',
        recoveryAttempts: 0
      });
    });

    test('should detect popup/UI crashes', async () => {
      await crashDetector.initialize();

      // Simulate popup crash
      const popupCrash = {
        component: 'popup',
        error: 'Uncaught TypeError: Cannot read property',
        stack: 'at popup.js:45:12',
        timestamp: Date.now(),
        userAction: 'button_click'
      };

      await crashDetector.handleUIComponentCrash(popupCrash);

      const uiCrashes = crashDetector.getUICrashes();
      expect(uiCrashes).toHaveLength(1);
      expect(uiCrashes[0]).toMatchObject({
        component: 'popup',
        error: 'Uncaught TypeError: Cannot read property',
        userAction: 'button_click',
        frequency: 1,
        lastOccurrence: expect.any(Number)
      });
    });

    test('should implement automatic crash recovery', async () => {
      await crashDetector.initialize();
      crashDetector.enableAutoRecovery(true);

      const recoverableCrash = {
        type: 'content_script_failure',
        tabId: 123,
        url: 'https://www.linkedin.com/search',
        recoverable: true
      };

      const recovery = await crashDetector.attemptRecovery(recoverableCrash);

      expect(recovery).toMatchObject({
        attempted: true,
        strategy: expect.stringMatching(/^(reload_tab|restart_service_worker|reinject_scripts)$/),
        success: expect.any(Boolean),
        recoveryTime: expect.any(Number),
        fallbacksUsed: expect.any(Array)
      });

      expect(chrome.tabs.reload).toHaveBeenCalledWith(123);
    });

    test('should track crash patterns and frequencies', async () => {
      await crashDetector.initialize();

      // Generate crash pattern data
      const crashPattern = [
        { type: 'service_worker_crash', timestamp: Date.now() - 3600000 }, // 1 hour ago
        { type: 'service_worker_crash', timestamp: Date.now() - 1800000 }, // 30 min ago
        { type: 'content_script_failure', timestamp: Date.now() - 900000 }, // 15 min ago
        { type: 'service_worker_crash', timestamp: Date.now() - 300000 }, // 5 min ago
      ];

      for (const crash of crashPattern) {
        await crashDetector.recordCrash(crash);
      }

      const analysis = crashDetector.analyzeCrashPatterns();

      expect(analysis).toMatchObject({
        totalCrashes: 4,
        crashesByType: {
          service_worker_crash: 3,
          content_script_failure: 1
        },
        frequency: expect.objectContaining({
          crashesPerHour: expect.any(Number),
          trend: expect.stringMatching(/^(increasing|stable|decreasing)$/)
        }),
        criticalityScore: expect.any(Number),
        recommendations: expect.any(Array)
      });
    });

    test('should maintain crash detection performance', async () => {
      await crashDetector.initialize();

      const startTime = performance.now();

      // Simulate monitoring many tabs simultaneously
      const tabMonitoring = Array.from({ length: 100 }, (_, i) => {
        return crashDetector.monitorTab({
          tabId: i,
          url: `https://linkedin.com/page-${i}`
        });
      });

      await Promise.all(tabMonitoring);

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should handle monitoring 100 tabs efficiently
      expect(duration).toBeLessThan(200); // Less than 200ms
      expect(crashDetector.getMonitoredTabs()).toHaveLength(100);
    });
  });

  describe('Performance Degradation Monitoring', () => {
    test('should monitor real-time performance metrics', async () => {
      await performanceMonitor.initialize();

      // Simulate performance metrics collection
      const metrics = {
        memoryUsage: 50000000, // 50MB
        cpuUsage: 15.5, // 15.5%
        responseTime: 250, // 250ms
        renderTime: 16.7, // 16.7ms (60fps)
        networkLatency: 100 // 100ms
      };

      await performanceMonitor.recordMetrics(metrics);

      const currentMetrics = performanceMonitor.getCurrentMetrics();
      expect(currentMetrics).toMatchObject({
        memory: expect.objectContaining({
          current: 50000000,
          trend: expect.any(String),
          threshold: expect.any(Number)
        }),
        cpu: expect.objectContaining({
          current: 15.5,
          average: expect.any(Number),
          peak: expect.any(Number)
        }),
        performance: expect.objectContaining({
          responseTime: 250,
          renderTime: 16.7,
          score: expect.any(Number)
        })
      });
    });

    test('should detect performance degradation patterns', async () => {
      await performanceMonitor.initialize();
      performanceMonitor.setThresholds({
        memoryWarning: 100000000, // 100MB
        memoryCritical: 200000000, // 200MB
        responseTimeWarning: 500, // 500ms
        responseTimeCritical: 1000, // 1s
        cpuWarning: 50, // 50%
        cpuCritical: 80 // 80%
      });

      // Simulate degrading performance over time
      const degradationPattern = [
        { memory: 80000000, responseTime: 200, cpu: 20 }, // Good
        { memory: 120000000, responseTime: 400, cpu: 35 }, // Warning
        { memory: 150000000, responseTime: 600, cpu: 45 }, // Warning+
        { memory: 220000000, responseTime: 1200, cpu: 85 }, // Critical
      ];

      for (const [index, metrics] of degradationPattern.entries()) {
        await performanceMonitor.recordMetrics({
          ...metrics,
          timestamp: Date.now() + (index * 30000) // 30 seconds apart
        });
      }

      const degradationAnalysis = performanceMonitor.analyzeDegradation();

      expect(degradationAnalysis).toMatchObject({
        detected: true,
        severity: 'critical',
        degradationRate: expect.any(Number),
        affectedMetrics: expect.arrayContaining(['memory', 'responseTime', 'cpu']),
        trend: 'worsening',
        prediction: expect.objectContaining({
          timeToFailure: expect.any(Number),
          confidence: expect.any(Number)
        }),
        recommendations: expect.arrayContaining([
          expect.stringContaining('memory'),
          expect.stringContaining('cpu')
        ])
      });
    });

    test('should monitor LinkedIn-specific performance', async () => {
      await performanceMonitor.initialize();

      const linkedinMetrics = {
        pageLoadTime: 3500, // 3.5 seconds
        searchResponseTime: 800, // 800ms
        profileLoadTime: 1200, // 1.2 seconds
        connectionRequestTime: 400, // 400ms
        automationSpeed: 15, // 15 actions per minute
        networkRequests: 45, // 45 requests per page
        domComplexity: 1500 // 1500 DOM nodes
      };

      await performanceMonitor.recordLinkedInMetrics(linkedinMetrics);

      const linkedinAnalysis = performanceMonitor.getLinkedInPerformanceAnalysis();

      expect(linkedinAnalysis).toMatchObject({
        overallScore: expect.any(Number),
        pagePerformance: expect.objectContaining({
          loadTime: 3500,
          grade: expect.stringMatching(/^[A-F]$/),
          optimizable: expect.any(Boolean)
        }),
        automationEfficiency: expect.objectContaining({
          speed: 15,
          bottlenecks: expect.any(Array),
          optimizationSuggestions: expect.any(Array)
        }),
        networkEfficiency: expect.objectContaining({
          requestCount: 45,
          cacheHitRate: expect.any(Number),
          redundantRequests: expect.any(Number)
        })
      });
    });

    test('should implement adaptive performance thresholds', async () => {
      await performanceMonitor.initialize();
      performanceMonitor.enableAdaptiveThresholds(true);

      // Generate baseline performance data
      const baselineData = Array.from({ length: 100 }, (_, i) => ({
        memory: 45000000 + Math.random() * 10000000, // 45-55MB
        responseTime: 150 + Math.random() * 100, // 150-250ms
        cpu: 10 + Math.random() * 15, // 10-25%
        timestamp: Date.now() + (i * 60000) // 1 minute intervals
      }));

      for (const data of baselineData) {
        await performanceMonitor.recordMetrics(data);
      }

      await performanceMonitor.calculateAdaptiveThresholds();

      const thresholds = performanceMonitor.getThresholds();

      expect(thresholds).toMatchObject({
        memory: expect.objectContaining({
          warning: expect.any(Number),
          critical: expect.any(Number),
          adaptive: true,
          confidence: expect.any(Number)
        }),
        responseTime: expect.objectContaining({
          warning: expect.any(Number),
          critical: expect.any(Number),
          adaptive: true
        }),
        cpu: expect.objectContaining({
          warning: expect.any(Number),
          critical: expect.any(Number),
          adaptive: true
        })
      });

      // Thresholds should be based on baseline data
      expect(thresholds.memory.warning).toBeGreaterThan(55000000); // Above baseline
      expect(thresholds.responseTime.warning).toBeGreaterThan(250); // Above baseline
    });

    test('should correlate performance with user actions', async () => {
      await performanceMonitor.initialize();

      const userActionMetrics = [
        {
          action: 'search_execution',
          duration: 2500,
          memoryDelta: 15000000,
          cpuPeak: 45,
          success: true
        },
        {
          action: 'profile_automation',
          duration: 1800,
          memoryDelta: 8000000,
          cpuPeak: 30,
          success: true
        },
        {
          action: 'bulk_connection',
          duration: 45000,
          memoryDelta: 120000000,
          cpuPeak: 85,
          success: false
        }
      ];

      for (const metric of userActionMetrics) {
        await performanceMonitor.recordUserActionMetrics(metric);
      }

      const correlation = performanceMonitor.analyzeActionPerformanceCorrelation();

      expect(correlation).toMatchObject({
        actionImpacts: expect.objectContaining({
          search_execution: expect.objectContaining({
            averageDuration: expect.any(Number),
            memoryImpact: expect.any(Number),
            successRate: expect.any(Number)
          }),
          bulk_connection: expect.objectContaining({
            averageDuration: expect.any(Number),
            memoryImpact: expect.any(Number),
            successRate: expect.any(Number),
            riskLevel: 'high'
          })
        }),
        performanceBottlenecks: expect.any(Array),
        optimizationOpportunities: expect.any(Array)
      });
    });
  });

  describe('Memory Leak Detection and Alerts', () => {
    test('should detect memory leaks over time', async () => {
      await memoryLeakDetector.initialize();

      // Simulate memory leak pattern
      const memoryReadings = [];
      let baseMemory = 30000000; // 30MB base

      for (let i = 0; i < 20; i++) {
        baseMemory += 2000000 + Math.random() * 1000000; // Steadily increasing
        memoryReadings.push({
          timestamp: Date.now() + (i * 300000), // 5-minute intervals
          usedMemory: baseMemory,
          totalMemory: baseMemory + 10000000,
          heapSize: baseMemory * 0.8
        });
      }

      for (const reading of memoryReadings) {
        await memoryLeakDetector.recordMemoryReading(reading);
      }

      const leakAnalysis = await memoryLeakDetector.detectMemoryLeak();

      expect(leakAnalysis).toMatchObject({
        detected: true,
        severity: expect.stringMatching(/^(warning|critical)$/),
        growthRate: expect.any(Number),
        projectedFailure: expect.any(Number),
        confidence: expect.any(Number),
        suspectedSources: expect.any(Array),
        recommendations: expect.arrayContaining([
          expect.stringContaining('garbage collection')
        ])
      });

      expect(leakAnalysis.growthRate).toBeGreaterThan(0);
      expect(leakAnalysis.confidence).toBeGreaterThan(0.7);
    });

    test('should identify memory leak sources', async () => {
      await memoryLeakDetector.initialize();
      memoryLeakDetector.enableSourceTracking(true);

      // Simulate different types of memory leaks
      const leakSources = [
        {
          type: 'dom_nodes',
          source: 'linkedin-automation.js',
          description: 'Detached DOM nodes accumulating',
          estimatedSize: 15000000
        },
        {
          type: 'event_listeners',
          source: 'content-script.js',
          description: 'Event listeners not being removed',
          estimatedSize: 2000000
        },
        {
          type: 'closures',
          source: 'analytics-engine.js',
          description: 'Closure references preventing GC',
          estimatedSize: 8000000
        }
      ];

      for (const leak of leakSources) {
        await memoryLeakDetector.recordPotentialLeak(leak);
      }

      const sourceAnalysis = memoryLeakDetector.analyzeLeakSources();

      expect(sourceAnalysis).toMatchObject({
        totalLeakage: 25000000,
        sources: expect.arrayContaining([
          expect.objectContaining({
            type: 'dom_nodes',
            severity: 'high',
            priority: 1
          }),
          expect.objectContaining({
            type: 'closures',
            severity: 'medium',
            priority: 2
          })
        ]),
        mitigationStrategies: expect.arrayContaining([
          expect.stringContaining('DOM cleanup'),
          expect.stringContaining('event listener removal')
        ])
      });
    });

    test('should trigger memory cleanup when thresholds are exceeded', async () => {
      await memoryLeakDetector.initialize();
      memoryLeakDetector.setCleanupThreshold(100000000); // 100MB

      // Simulate memory usage exceeding threshold
      await memoryLeakDetector.recordMemoryReading({
        timestamp: Date.now(),
        usedMemory: 120000000, // 120MB - exceeds threshold
        totalMemory: 150000000,
        heapSize: 100000000
      });

      const cleanup = await memoryLeakDetector.triggerCleanup();

      expect(cleanup).toMatchObject({
        triggered: true,
        strategies: expect.arrayContaining([
          'force_garbage_collection',
          'clear_caches',
          'cleanup_dom_references'
        ]),
        memoryFreed: expect.any(Number),
        success: expect.any(Boolean),
        duration: expect.any(Number)
      });
    });

    test('should monitor memory patterns across different LinkedIn pages', async () => {
      await memoryLeakDetector.initialize();

      const pageTypes = [
        { type: 'feed', baseMemory: 45000000 },
        { type: 'search', baseMemory: 55000000 },
        { type: 'profile', baseMemory: 35000000 },
        { type: 'messaging', baseMemory: 40000000 }
      ];

      for (const page of pageTypes) {
        // Simulate memory usage on different page types
        for (let i = 0; i < 10; i++) {
          await memoryLeakDetector.recordPageMemoryUsage({
            pageType: page.type,
            memoryUsage: page.baseMemory + (i * 2000000), // Increasing usage
            timestamp: Date.now() + (i * 60000),
            url: `https://linkedin.com/${page.type}`
          });
        }
      }

      const pageAnalysis = memoryLeakDetector.analyzePageMemoryPatterns();

      expect(pageAnalysis).toMatchObject({
        pageTypes: expect.objectContaining({
          search: expect.objectContaining({
            averageMemory: expect.any(Number),
            memoryGrowth: expect.any(Number),
            riskLevel: expect.any(String)
          }),
          feed: expect.objectContaining({
            averageMemory: expect.any(Number),
            memoryGrowth: expect.any(Number),
            riskLevel: expect.any(String)
          })
        }),
        riskiestPages: expect.any(Array),
        optimizationTargets: expect.any(Array)
      });
    });

    test('should implement proactive memory leak prevention', async () => {
      await memoryLeakDetector.initialize();
      memoryLeakDetector.enableProactivePrevention(true);

      // Simulate conditions that could lead to memory leaks
      const riskFactors = [
        {
          type: 'high_dom_complexity',
          value: 2500, // High number of DOM nodes
          threshold: 1000
        },
        {
          type: 'many_event_listeners',
          value: 150, // Many event listeners
          threshold: 50
        },
        {
          type: 'long_running_automation',
          value: 3600000, // 1 hour automation
          threshold: 1800000 // 30 minutes
        }
      ];

      for (const risk of riskFactors) {
        await memoryLeakDetector.assessRiskFactor(risk);
      }

      const prevention = await memoryLeakDetector.executePreventiveMeasures();

      expect(prevention).toMatchObject({
        measuresExecuted: expect.arrayContaining([
          'dom_cleanup_scheduled',
          'event_listener_audit',
          'automation_timeout_set'
        ]),
        riskReduction: expect.any(Number),
        scheduledCleanups: expect.any(Number),
        monitoringIntensified: true
      });
    });
  });

  describe('Automated Health Checks', () => {
    test('should perform comprehensive extension health checks', async () => {
      await healthChecker.initialize();

      const healthCheck = await healthChecker.performHealthCheck();

      expect(healthCheck).toMatchObject({
        timestamp: expect.any(Number),
        overallHealth: expect.stringMatching(/^(healthy|warning|critical)$/),
        score: expect.any(Number),
        components: expect.objectContaining({
          serviceWorker: expect.objectContaining({
            status: expect.stringMatching(/^(active|inactive|crashed)$/),
            lastResponse: expect.any(Number),
            memoryUsage: expect.any(Number)
          }),
          contentScripts: expect.objectContaining({
            injected: expect.any(Number),
            failed: expect.any(Number),
            responsive: expect.any(Number)
          }),
          storage: expect.objectContaining({
            accessible: expect.any(Boolean),
            usage: expect.any(Number),
            quota: expect.any(Number)
          }),
          permissions: expect.objectContaining({
            valid: expect.any(Boolean),
            missing: expect.any(Array)
          })
        }),
        issues: expect.any(Array),
        recommendations: expect.any(Array)
      });
    });

    test('should monitor LinkedIn integration health', async () => {
      await healthChecker.initialize();

      // Mock LinkedIn page state
      global.document = {
        URL: 'https://www.linkedin.com/feed',
        readyState: 'complete',
        querySelector: jest.fn(),
        querySelectorAll: jest.fn()
      };

      const linkedinHealth = await healthChecker.checkLinkedInIntegration();

      expect(linkedinHealth).toMatchObject({
        pageAccessible: expect.any(Boolean),
        elementsDetected: expect.objectContaining({
          feed: expect.any(Boolean),
          searchBar: expect.any(Boolean),
          profileElements: expect.any(Boolean),
          messageElements: expect.any(Boolean)
        }),
        automationCapability: expect.objectContaining({
          canConnect: expect.any(Boolean),
          canMessage: expect.any(Boolean),
          canSearch: expect.any(Boolean),
          canNavigate: expect.any(Boolean)
        }),
        apiResponsiveness: expect.objectContaining({
          searchAPI: expect.any(Number),
          profileAPI: expect.any(Number),
          messagingAPI: expect.any(Number)
        }),
        riskFactors: expect.any(Array)
      });
    });

    test('should schedule periodic health checks', async () => {
      await healthChecker.initialize();
      healthChecker.schedulePeriodicChecks({
        interval: 300000, // 5 minutes
        types: ['basic', 'linkedin', 'performance']
      });

      expect(chrome.alarms.create).toHaveBeenCalledWith('health_check', {
        delayInMinutes: 5,
        periodInMinutes: 5
      });

      // Simulate alarm trigger
      const alarmCallback = chrome.alarms.onAlarm.addListener.mock.calls[0][0];
      await alarmCallback({ name: 'health_check' });

      const recentChecks = healthChecker.getRecentChecks();
      expect(recentChecks).toHaveLength(1);
      expect(recentChecks[0]).toMatchObject({
        type: 'scheduled',
        timestamp: expect.any(Number),
        overallHealth: expect.any(String)
      });
    });

    test('should implement health check escalation', async () => {
      await healthChecker.initialize();
      healthChecker.setEscalationThresholds({
        consecutiveFailures: 3,
        criticalIssues: 1,
        performanceDegradation: 50
      });

      // Simulate consecutive failed health checks
      const failedChecks = [
        { overallHealth: 'critical', score: 25, issues: ['service_worker_crash'] },
        { overallHealth: 'critical', score: 20, issues: ['memory_leak', 'slow_response'] },
        { overallHealth: 'critical', score: 15, issues: ['extension_unresponsive'] }
      ];

      for (const check of failedChecks) {
        await healthChecker.recordHealthCheck(check);
      }

      const escalation = await healthChecker.checkEscalation();

      expect(escalation).toMatchObject({
        triggered: true,
        level: expect.stringMatching(/^(warning|critical|emergency)$/),
        reason: 'consecutive_failures',
        actions: expect.arrayContaining([
          'notify_user',
          'attempt_recovery',
          'collect_diagnostics'
        ]),
        escalationId: expect.any(String)
      });
    });

    test('should generate health trends and predictions', async () => {
      await healthChecker.initialize();

      // Generate health check history
      const healthHistory = Array.from({ length: 50 }, (_, i) => {
        const decline = Math.max(0, 100 - (i * 1.5)); // Gradual decline
        return {
          timestamp: Date.now() + (i * 3600000), // Hourly checks
          score: decline + Math.random() * 10 - 5, // Add some noise
          overallHealth: decline > 70 ? 'healthy' : decline > 40 ? 'warning' : 'critical'
        };
      });

      for (const check of healthHistory) {
        await healthChecker.recordHealthCheck(check);
      }

      const trends = await healthChecker.analyzeHealthTrends();

      expect(trends).toMatchObject({
        direction: 'declining',
        rate: expect.any(Number),
        confidence: expect.any(Number),
        prediction: expect.objectContaining({
          timeToWarning: expect.any(Number),
          timeToCritical: expect.any(Number),
          confidenceInterval: expect.any(Array)
        }),
        contributingFactors: expect.any(Array),
        recommendations: expect.any(Array)
      });
    });
  });

  describe('Recovery Strategies and Fallback Mechanisms', () => {
    test('should implement tiered recovery strategies', async () => {
      await recoveryManager.initialize();

      const failures = [
        {
          type: 'content_script_failure',
          severity: 'medium',
          context: { tabId: 123, url: 'https://linkedin.com/feed' }
        },
        {
          type: 'service_worker_crash',
          severity: 'critical',
          context: { lastActive: Date.now() - 30000 }
        },
        {
          type: 'memory_exhaustion',
          severity: 'critical',
          context: { memoryUsage: 200000000 }
        }
      ];

      for (const failure of failures) {
        const recovery = await recoveryManager.executeRecoveryStrategy(failure);

        expect(recovery).toMatchObject({
          strategy: expect.any(String),
          tier: expect.any(Number),
          actions: expect.any(Array),
          success: expect.any(Boolean),
          fallbacksAvailable: expect.any(Boolean),
          recoveryTime: expect.any(Number)
        });
      }

      // Verify different strategies for different failure types
      const recoveryHistory = recoveryManager.getRecoveryHistory();
      const strategies = recoveryHistory.map(r => r.strategy);
      expect(strategies).toContain('reinject_content_script');
      expect(strategies).toContain('restart_service_worker');
      expect(strategies).toContain('force_memory_cleanup');
    });

    test('should implement graceful degradation', async () => {
      await recoveryManager.initialize();

      const systemFailure = {
        type: 'widespread_failure',
        affectedComponents: ['service_worker', 'content_scripts', 'storage'],
        severity: 'critical',
        userImpact: 'high'
      };

      const degradation = await recoveryManager.implementGracefulDegradation(systemFailure);

      expect(degradation).toMatchObject({
        mode: 'degraded_operation',
        disabledFeatures: expect.any(Array),
        essentialFeatures: expect.any(Array),
        userNotification: expect.objectContaining({
          displayed: true,
          message: expect.stringContaining('limited functionality'),
          actions: expect.any(Array)
        }),
        fallbackMechanisms: expect.any(Array)
      });

      // Should disable non-essential features
      expect(degradation.disabledFeatures).toContain('bulk_automation');
      expect(degradation.disabledFeatures).toContain('advanced_analytics');

      // Should preserve essential features
      expect(degradation.essentialFeatures).toContain('basic_connection');
      expect(degradation.essentialFeatures).toContain('manual_messaging');
    });

    test('should implement automatic rollback for failed recoveries', async () => {
      await recoveryManager.initialize();

      const failure = {
        type: 'automation_error',
        severity: 'medium',
        context: { profileId: 'test-profile' }
      };

      // Simulate failed recovery attempt
      recoveryManager.mockRecoveryFailure(true);

      const recovery = await recoveryManager.executeRecoveryStrategy(failure);

      expect(recovery).toMatchObject({
        strategy: expect.any(String),
        success: false,
        rollbackExecuted: true,
        rollbackSuccess: true,
        finalState: 'reverted_to_safe_state',
        retryScheduled: true
      });

      const safeModeStatus = recoveryManager.getSafeModeStatus();
      expect(safeModeStatus.active).toBe(true);
      expect(safeModeStatus.reason).toBe('recovery_failure');
    });

    test('should coordinate recovery across multiple components', async () => {
      await recoveryManager.initialize();

      const cascadingFailure = {
        primary: {
          type: 'service_worker_crash',
          timestamp: Date.now()
        },
        secondary: [
          { type: 'content_script_disconnection', caused_by: 'service_worker_crash' },
          { type: 'storage_access_error', caused_by: 'service_worker_crash' },
          { type: 'ui_component_freeze', caused_by: 'service_worker_crash' }
        ]
      };

      const coordinatedRecovery = await recoveryManager.executeCoordinatedRecovery(cascadingFailure);

      expect(coordinatedRecovery).toMatchObject({
        orchestrated: true,
        recoveryPlan: expect.objectContaining({
          phases: expect.arrayContaining([
            expect.objectContaining({
              phase: 'restore_core_services',
              actions: expect.any(Array),
              order: 1
            }),
            expect.objectContaining({
              phase: 'restore_dependent_components',
              actions: expect.any(Array),
              order: 2
            })
          ])
        }),
        execution: expect.objectContaining({
          phasesCompleted: expect.any(Number),
          totalSuccess: expect.any(Boolean),
          recoveryTime: expect.any(Number)
        })
      });
    });

    test('should maintain recovery state persistence', async () => {
      await recoveryManager.initialize();

      const recoveryState = {
        activeRecoveries: [
          { id: 'recovery-1', type: 'memory_cleanup', progress: 75 },
          { id: 'recovery-2', type: 'script_reinject', progress: 100 }
        ],
        safeModeActive: false,
        lastRecoveryTime: Date.now() - 300000,
        recoveryHistory: []
      };

      await recoveryManager.persistRecoveryState(recoveryState);

      // Simulate extension restart
      const newRecoveryManager = new recoveryManager.constructor();
      await newRecoveryManager.initialize();

      const restoredState = await newRecoveryManager.getRecoveryState();

      expect(restoredState).toMatchObject({
        activeRecoveries: expect.arrayContaining([
          expect.objectContaining({
            id: 'recovery-1',
            type: 'memory_cleanup',
            resumed: true
          })
        ]),
        safeModeActive: false,
        lastRecoveryTime: expect.any(Number)
      });

      // Should resume incomplete recoveries
      expect(chrome.storage.local.get).toHaveBeenCalledWith(['recovery_state']);
    });

    test('should implement user-guided recovery options', async () => {
      await recoveryManager.initialize();

      const userInteractiveFailure = {
        type: 'linkedin_access_blocked',
        severity: 'high',
        userActionRequired: true,
        possibleCauses: ['cookies_blocked', 'security_software', 'network_restrictions']
      };

      const userGuidedRecovery = await recoveryManager.startUserGuidedRecovery(userInteractiveFailure);

      expect(userGuidedRecovery).toMatchObject({
        guidanceProvided: true,
        steps: expect.arrayContaining([
          expect.objectContaining({
            step: 1,
            description: expect.stringContaining('check cookies'),
            userAction: 'verify_settings',
            verifiable: true
          }),
          expect.objectContaining({
            step: 2,
            description: expect.stringContaining('disable security software'),
            userAction: 'modify_settings',
            verifiable: true
          })
        ]),
        diagnostics: expect.objectContaining({
          automated: expect.any(Array),
          userVerified: expect.any(Array)
        }),
        completionTracking: expect.objectContaining({
          stepsCompleted: 0,
          stepsTotal: expect.any(Number),
          canProceed: false
        })
      });
    });
  });

  describe('Integration and End-to-End Monitoring', () => {
    test('should integrate crash analytics with error reporting', async () => {
      const { GlobalErrorCapture } = require('../src/utils/error-reporting.js');
      const errorReporter = new GlobalErrorCapture();

      await Promise.all([
        crashDetector.initialize(),
        errorReporter.initialize()
      ]);

      crashDetector.setErrorReporter(errorReporter);

      const crash = {
        type: 'service_worker_crash',
        error: new Error('Service worker memory limit exceeded'),
        timestamp: Date.now(),
        context: { memoryUsage: 200000000 }
      };

      await crashDetector.handleCrash(crash);

      // Verify error was reported to error reporting system
      const reportedErrors = errorReporter.getCapturedErrors();
      expect(reportedErrors).toHaveLength(1);
      expect(reportedErrors[0]).toMatchObject({
        type: 'crash_event',
        crashType: 'service_worker_crash',
        severity: 'critical',
        errorSource: 'crash_analytics'
      });
    });

    test('should provide comprehensive monitoring dashboard data', async () => {
      await Promise.all([
        crashDetector.initialize(),
        performanceMonitor.initialize(),
        memoryLeakDetector.initialize(),
        healthChecker.initialize()
      ]);

      // Generate some monitoring data
      await crashDetector.recordCrash({ type: 'content_script_failure', timestamp: Date.now() });
      await performanceMonitor.recordMetrics({ memory: 80000000, responseTime: 500, cpu: 40 });
      await memoryLeakDetector.recordMemoryReading({ usedMemory: 90000000, timestamp: Date.now() });
      await healthChecker.recordHealthCheck({ overallHealth: 'warning', score: 65 });

      const monitoringSystem = {
        crashDetector,
        performanceMonitor,
        memoryLeakDetector,
        healthChecker
      };

      const dashboardData = await generateMonitoringDashboardData(monitoringSystem);

      expect(dashboardData).toMatchObject({
        summary: expect.objectContaining({
          overallStatus: expect.stringMatching(/^(healthy|warning|critical)$/),
          activeIssues: expect.any(Number),
          systemScore: expect.any(Number),
          lastUpdated: expect.any(Number)
        }),
        crashes: expect.objectContaining({
          total: expect.any(Number),
          recent: expect.any(Number),
          byType: expect.any(Object),
          trend: expect.any(String)
        }),
        performance: expect.objectContaining({
          current: expect.any(Object),
          degradation: expect.any(Boolean),
          score: expect.any(Number)
        }),
        memory: expect.objectContaining({
          usage: expect.any(Number),
          leakDetected: expect.any(Boolean),
          trend: expect.any(String)
        }),
        health: expect.objectContaining({
          score: expect.any(Number),
          status: expect.any(String),
          issues: expect.any(Array)
        }),
        alerts: expect.any(Array),
        recommendations: expect.any(Array)
      });
    });

    test('should handle monitoring system under extreme load', async () => {
      await Promise.all([
        crashDetector.initialize(),
        performanceMonitor.initialize(),
        memoryLeakDetector.initialize(),
        healthChecker.initialize()
      ]);

      const startTime = performance.now();

      // Simulate extreme load scenario
      const loadTasks = [
        // 100 simultaneous crashes
        ...Array.from({ length: 100 }, (_, i) =>
          crashDetector.recordCrash({
            type: 'content_script_failure',
            tabId: i,
            timestamp: Date.now() + i
          })
        ),
        // 200 performance metrics
        ...Array.from({ length: 200 }, (_, i) =>
          performanceMonitor.recordMetrics({
            memory: 50000000 + (i * 100000),
            responseTime: 200 + (i * 5),
            cpu: 20 + (i * 0.1),
            timestamp: Date.now() + i
          })
        ),
        // 50 memory readings
        ...Array.from({ length: 50 }, (_, i) =>
          memoryLeakDetector.recordMemoryReading({
            usedMemory: 40000000 + (i * 2000000),
            timestamp: Date.now() + i
          })
        ),
        // 20 health checks
        ...Array.from({ length: 20 }, (_, i) =>
          healthChecker.recordHealthCheck({
            overallHealth: i % 3 === 0 ? 'warning' : 'healthy',
            score: 80 - (i * 2),
            timestamp: Date.now() + i
          })
        )
      ];

      await Promise.all(loadTasks);

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should handle extreme load efficiently
      expect(duration).toBeLessThan(1000); // Less than 1 second

      // Verify all data was recorded
      expect(crashDetector.getDetectedCrashes()).toHaveLength(100);
      expect(performanceMonitor.getMetricsHistory().length).toBeGreaterThanOrEqual(200);
      expect(memoryLeakDetector.getMemoryReadings().length).toBeGreaterThanOrEqual(50);
      expect(healthChecker.getRecentChecks().length).toBeGreaterThanOrEqual(20);
    });
  });
});

// Helper function for dashboard data generation
async function generateMonitoringDashboardData(monitoringSystem) {
  const {
    crashDetector,
    performanceMonitor,
    memoryLeakDetector,
    healthChecker
  } = monitoringSystem;

  const crashes = crashDetector.getDetectedCrashes();
  const performance = performanceMonitor.getCurrentMetrics();
  const memoryData = memoryLeakDetector.getMemoryReadings();
  const healthData = healthChecker.getRecentChecks();

  return {
    summary: {
      overallStatus: healthData.length > 0 ? healthData[healthData.length - 1].overallHealth : 'unknown',
      activeIssues: crashes.length + (performance.degradationDetected ? 1 : 0),
      systemScore: healthData.length > 0 ? healthData[healthData.length - 1].score : 0,
      lastUpdated: Date.now()
    },
    crashes: {
      total: crashes.length,
      recent: crashes.filter(c => c.timestamp > Date.now() - 3600000).length,
      byType: crashes.reduce((acc, crash) => {
        acc[crash.type] = (acc[crash.type] || 0) + 1;
        return acc;
      }, {}),
      trend: crashes.length > 5 ? 'increasing' : 'stable'
    },
    performance: {
      current: performance,
      degradation: performance.degradationDetected || false,
      score: performance.score || 85
    },
    memory: {
      usage: memoryData.length > 0 ? memoryData[memoryData.length - 1].usedMemory : 0,
      leakDetected: memoryData.length > 10,
      trend: memoryData.length > 5 ? 'increasing' : 'stable'
    },
    health: {
      score: healthData.length > 0 ? healthData[healthData.length - 1].score : 100,
      status: healthData.length > 0 ? healthData[healthData.length - 1].overallHealth : 'healthy',
      issues: []
    },
    alerts: [],
    recommendations: []
  };
}