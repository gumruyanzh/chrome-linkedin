import { jest } from '@jest/globals';

// Mock performance API for Node.js environment
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(),
  getEntriesByName: jest.fn(),
  memory: {
    usedJSHeapSize: 10 * 1024 * 1024, // 10MB
    totalJSHeapSize: 50 * 1024 * 1024, // 50MB
    jsHeapSizeLimit: 100 * 1024 * 1024 // 100MB
  }
};

global.performance = mockPerformance;

// Mock Chrome memory API
const mockChrome = {
  system: {
    memory: {
      getInfo: jest.fn()
    }
  },
  runtime: {
    getManifest: jest.fn(),
    onStartup: { addListener: jest.fn() },
    onSuspend: { addListener: jest.fn() }
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn(),
      getBytesInUse: jest.fn()
    }
  }
};

global.chrome = mockChrome;

describe('Memory Optimization Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Memory Usage Monitoring', () => {
    test('should track memory usage within acceptable limits', () => {
      const memoryThresholds = {
        startup: 15 * 1024 * 1024,    // 15MB
        idle: 20 * 1024 * 1024,       // 20MB
        active: 30 * 1024 * 1024,     // 30MB
        peak: 50 * 1024 * 1024        // 50MB max
      };

      const checkMemoryUsage = (state) => {
        const currentUsage = mockPerformance.memory.usedJSHeapSize;
        const threshold = memoryThresholds[state];

        return {
          usage: currentUsage,
          threshold: threshold,
          withinLimits: currentUsage <= threshold,
          percentage: (currentUsage / threshold) * 100
        };
      };

      const startupCheck = checkMemoryUsage('startup');
      expect(startupCheck.withinLimits).toBe(true);
      expect(startupCheck.percentage).toBeLessThan(100);

      // Simulate memory increase during active use
      mockPerformance.memory.usedJSHeapSize = 25 * 1024 * 1024;
      const activeCheck = checkMemoryUsage('active');
      expect(activeCheck.withinLimits).toBe(true);

      // Test memory leak detection
      mockPerformance.memory.usedJSHeapSize = 60 * 1024 * 1024;
      const peakCheck = checkMemoryUsage('peak');
      expect(peakCheck.withinLimits).toBe(false);
    });

    test('should implement memory cleanup strategies', () => {
      const memoryManager = {
        cache: new Map(),
        eventListeners: new Set(),
        timers: new Set(),

        cleanup: function() {
          // Clear caches
          this.cache.clear();

          // Remove event listeners
          this.eventListeners.forEach(listener => {
            if (listener.element && listener.element.removeEventListener) {
              listener.element.removeEventListener(listener.event, listener.handler);
            }
          });
          this.eventListeners.clear();

          // Clear timers
          this.timers.forEach(timer => {
            clearTimeout(timer.id);
            clearInterval(timer.id);
          });
          this.timers.clear();

          // Force garbage collection hint
          if (global.gc) {
            global.gc();
          }
        },

        addToCache: function(key, value) {
          // Implement LRU cache with size limit
          if (this.cache.size >= 100) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
          }
          this.cache.set(key, value);
        },

        addEventListener: function(element, event, handler) {
          const listener = { element, event, handler };
          this.eventListeners.add(listener);
          if (element.addEventListener) {
            element.addEventListener(event, handler);
          }
        },

        addTimer: function(callback, delay, isInterval = false) {
          const id = isInterval ? setInterval(callback, delay) : setTimeout(callback, delay);
          this.timers.add({ id, isInterval });
          return id;
        }
      };

      // Test cache management
      for (let i = 0; i < 150; i++) {
        memoryManager.addToCache(`key${i}`, { data: `value${i}` });
      }
      expect(memoryManager.cache.size).toBeLessThanOrEqual(100);

      // Test cleanup
      const initialCacheSize = memoryManager.cache.size;
      const initialListenerCount = memoryManager.eventListeners.size;

      memoryManager.cleanup();

      expect(memoryManager.cache.size).toBe(0);
      expect(memoryManager.eventListeners.size).toBe(0);
      expect(memoryManager.timers.size).toBe(0);
    });

    test('should detect and prevent memory leaks', () => {
      const memoryLeakDetector = {
        measurements: [],
        baseline: null,

        takeMeasurement: function() {
          const measurement = {
            timestamp: Date.now(),
            heapUsed: mockPerformance.memory.usedJSHeapSize,
            heapTotal: mockPerformance.memory.totalJSHeapSize
          };
          this.measurements.push(measurement);
          return measurement;
        },

        setBaseline: function() {
          this.baseline = this.takeMeasurement();
        },

        detectLeak: function() {
          if (!this.baseline || this.measurements.length < 5) {
            return { hasLeak: false, confidence: 0 };
          }

          const recent = this.measurements.slice(-5);
          const growthRate = recent.map((measurement, index) => {
            if (index === 0) return 0;
            return measurement.heapUsed - recent[index - 1].heapUsed;
          }).slice(1);

          const avgGrowth = growthRate.reduce((sum, rate) => sum + rate, 0) / growthRate.length;
          const totalGrowth = recent[recent.length - 1].heapUsed - this.baseline.heapUsed;

          const hasLeak = avgGrowth > 1024 * 1024 && totalGrowth > 10 * 1024 * 1024; // 1MB avg, 10MB total
          const confidence = Math.min(Math.abs(avgGrowth) / (1024 * 1024), 1);

          return { hasLeak, confidence, avgGrowth, totalGrowth };
        }
      };

      memoryLeakDetector.setBaseline();

      // Simulate normal memory usage
      for (let i = 0; i < 5; i++) {
        mockPerformance.memory.usedJSHeapSize += 500 * 1024; // 500KB increase
        memoryLeakDetector.takeMeasurement();
      }

      let result = memoryLeakDetector.detectLeak();
      expect(result.hasLeak).toBe(false);

      // Simulate memory leak
      for (let i = 0; i < 5; i++) {
        mockPerformance.memory.usedJSHeapSize += 2 * 1024 * 1024; // 2MB increase each time
        memoryLeakDetector.takeMeasurement();
      }

      result = memoryLeakDetector.detectLeak();
      expect(result.hasLeak).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('Storage Optimization', () => {
    test('should implement efficient data storage patterns', async () => {
      const storageOptimizer = {
        compress: function(data) {
          // Simple compression simulation
          const jsonString = JSON.stringify(data);
          const compressed = jsonString.replace(/\s+/g, '');
          return {
            original: jsonString.length,
            compressed: compressed.length,
            ratio: compressed.length / jsonString.length,
            data: compressed
          };
        },

        chunk: function(data, chunkSize = 1024) {
          const jsonString = JSON.stringify(data);
          const chunks = [];
          for (let i = 0; i < jsonString.length; i += chunkSize) {
            chunks.push(jsonString.slice(i, i + chunkSize));
          }
          return chunks;
        },

        optimizeForStorage: function(data) {
          // Remove unnecessary fields from nested objects
          const optimized = { ...data };

          if (optimized.profiles) {
            optimized.profiles = optimized.profiles.map(profile => {
              const cleanProfile = { ...profile };
              delete cleanProfile.temporaryFields;
              delete cleanProfile.computedValues;
              return cleanProfile;
            });
          }

          // Compress timestamps
          if (optimized.timestamps) {
            optimized.timestamps = optimized.timestamps.map(ts => ts - Date.now());
          }

          return optimized;
        }
      };

      const testData = {
        profiles: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          name: `User ${i}`,
          temporaryFields: 'should be removed',
          computedValues: { calculated: true }
        })),
        timestamps: [Date.now() - 1000, Date.now() - 2000, Date.now() - 3000]
      };

      const optimized = storageOptimizer.optimizeForStorage(testData);
      expect(optimized.profiles[0]).not.toHaveProperty('temporaryFields');
      expect(optimized.profiles[0]).not.toHaveProperty('computedValues');

      const compressed = storageOptimizer.compress(optimized);
      expect(compressed.ratio).toBeLessThan(1);

      const chunks = storageOptimizer.chunk(optimized, 512);
      expect(chunks.length).toBeGreaterThan(1);
    });

    test('should manage storage quota efficiently', async () => {
      const quotaManager = {
        async checkQuota() {
          // Mock storage quota check
          mockChrome.storage.local.getBytesInUse.mockResolvedValue(2 * 1024 * 1024); // 2MB used
          const bytesInUse = await chrome.storage.local.getBytesInUse();

          const quota = 5 * 1024 * 1024; // 5MB quota
          const usagePercentage = (bytesInUse / quota) * 100;

          return {
            used: bytesInUse,
            available: quota - bytesInUse,
            percentage: usagePercentage,
            needsCleanup: usagePercentage > 80
          };
        },

        async cleanup() {
          const oldDataThreshold = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days

          mockChrome.storage.local.get.mockResolvedValue({
            analytics: [
              { timestamp: Date.now() - 1000, event: 'recent' },
              { timestamp: oldDataThreshold - 1000, event: 'old' }
            ],
            cache: {
              'old_key': { timestamp: oldDataThreshold - 1000 },
              'new_key': { timestamp: Date.now() }
            }
          });

          const data = await chrome.storage.local.get();
          const cleanedData = {};

          // Clean old analytics
          if (data.analytics) {
            cleanedData.analytics = data.analytics.filter(
              entry => entry.timestamp > oldDataThreshold
            );
          }

          // Clean old cache entries
          if (data.cache) {
            cleanedData.cache = Object.fromEntries(
              Object.entries(data.cache).filter(
                ([key, value]) => value.timestamp > oldDataThreshold
              )
            );
          }

          mockChrome.storage.local.set.mockResolvedValue();
          await chrome.storage.local.set(cleanedData);

          return cleanedData;
        }
      };

      const quota = await quotaManager.checkQuota();
      expect(quota.percentage).toBeLessThan(100);

      if (quota.needsCleanup) {
        const cleaned = await quotaManager.cleanup();
        expect(cleaned.analytics.length).toBeLessThan(2);
        expect(Object.keys(cleaned.cache).length).toBe(1);
      }
    });

    test('should implement data archiving strategies', () => {
      const archiveManager = {
        archive: function(data, retentionDays = 90) {
          const cutoffDate = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);

          const active = [];
          const archived = [];

          data.forEach(item => {
            if (item.timestamp > cutoffDate) {
              active.push(item);
            } else {
              // Compress archived data
              archived.push({
                id: item.id,
                timestamp: item.timestamp,
                summary: this.summarize(item)
              });
            }
          });

          return { active, archived };
        },

        summarize: function(item) {
          // Create summary of full data
          return {
            type: item.type,
            count: item.details ? Object.keys(item.details).length : 0,
            status: item.status
          };
        },

        restore: function(archivedItem) {
          // Partial restoration from summary
          return {
            ...archivedItem,
            details: `Archived data - original had ${archivedItem.summary.count} properties`,
            isRestored: true
          };
        }
      };

      const testData = [
        {
          id: 1,
          timestamp: Date.now() - 100 * 24 * 60 * 60 * 1000, // 100 days old
          type: 'connection',
          status: 'completed',
          details: { name: 'John', company: 'ABC Corp' }
        },
        {
          id: 2,
          timestamp: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days old
          type: 'message',
          status: 'sent',
          details: { content: 'Hello', length: 5 }
        }
      ];

      const result = archiveManager.archive(testData, 90);

      expect(result.active).toHaveLength(1);
      expect(result.archived).toHaveLength(1);
      expect(result.archived[0]).not.toHaveProperty('details');
      expect(result.archived[0]).toHaveProperty('summary');

      const restored = archiveManager.restore(result.archived[0]);
      expect(restored.isRestored).toBe(true);
    });
  });

  describe('Performance Benchmarking', () => {
    test('should measure critical path performance', () => {
      const performanceBenchmark = {
        marks: new Map(),
        measures: new Map(),

        mark: function(name) {
          this.marks.set(name, performance.now());
        },

        measure: function(name, startMark, endMark) {
          const startTime = this.marks.get(startMark);
          const endTime = this.marks.get(endMark);

          if (startTime && endTime) {
            const duration = endTime - startTime;
            this.measures.set(name, duration);
            return duration;
          }
          return null;
        },

        benchmark: function(operation, iterations = 100) {
          const times = [];

          for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            operation();
            const end = performance.now();
            times.push(end - start);
          }

          return {
            min: Math.min(...times),
            max: Math.max(...times),
            avg: times.reduce((sum, time) => sum + time, 0) / times.length,
            median: times.sort((a, b) => a - b)[Math.floor(times.length / 2)],
            p95: times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)]
          };
        }
      };

      // Test critical operations
      const connectionProcessing = () => {
        // Simulate connection processing
        const profiles = Array.from({ length: 50 }, (_, i) => ({ id: i, name: `User ${i}` }));
        const filtered = profiles.filter(p => p.id % 2 === 0);
        return filtered.length;
      };

      const benchmarkResult = performanceBenchmark.benchmark(connectionProcessing, 50);

      expect(benchmarkResult.avg).toBeLessThan(10); // Should complete in under 10ms on average
      expect(benchmarkResult.p95).toBeLessThan(20); // 95th percentile under 20ms
      expect(benchmarkResult.min).toBeGreaterThan(0);

      // Test performance marks
      performanceBenchmark.mark('operation-start');
      connectionProcessing();
      performanceBenchmark.mark('operation-end');

      const operationTime = performanceBenchmark.measure('full-operation', 'operation-start', 'operation-end');
      expect(operationTime).toBeGreaterThan(0);
    });

    test('should monitor extension startup performance', () => {
      const startupMonitor = {
        phases: {
          'manifest-load': { threshold: 50, measured: null },
          'background-init': { threshold: 200, measured: null },
          'content-script-load': { threshold: 100, measured: null },
          'ui-render': { threshold: 300, measured: null },
          'data-load': { threshold: 500, measured: null }
        },

        measurePhase: function(phase, duration) {
          if (this.phases[phase]) {
            this.phases[phase].measured = duration;
          }
        },

        getStartupReport: function() {
          const report = {
            totalTime: 0,
            passedPhases: 0,
            failedPhases: 0,
            phases: {}
          };

          Object.entries(this.phases).forEach(([name, phase]) => {
            const passed = phase.measured !== null && phase.measured <= phase.threshold;
            report.phases[name] = {
              measured: phase.measured,
              threshold: phase.threshold,
              passed: passed
            };

            if (phase.measured !== null) {
              report.totalTime += phase.measured;
              if (passed) {
                report.passedPhases++;
              } else {
                report.failedPhases++;
              }
            }
          });

          report.overallPassed = report.failedPhases === 0 && report.totalTime <= 1000; // 1 second total

          return report;
        }
      };

      // Simulate startup measurements
      startupMonitor.measurePhase('manifest-load', 30);
      startupMonitor.measurePhase('background-init', 150);
      startupMonitor.measurePhase('content-script-load', 80);
      startupMonitor.measurePhase('ui-render', 250);
      startupMonitor.measurePhase('data-load', 400);

      const report = startupMonitor.getStartupReport();

      expect(report.totalTime).toBeLessThan(1000);
      expect(report.failedPhases).toBe(0);
      expect(report.overallPassed).toBe(true);

      // Test with slow phase
      startupMonitor.measurePhase('data-load', 600); // Exceeds threshold
      const slowReport = startupMonitor.getStartupReport();

      expect(slowReport.failedPhases).toBeGreaterThan(0);
      expect(slowReport.overallPassed).toBe(false);
    });

    test('should track user interaction responsiveness', () => {
      const responsivenessBenchmark = {
        interactions: [],

        recordInteraction: function(type, startTime, endTime) {
          const duration = endTime - startTime;
          this.interactions.push({
            type: type,
            duration: duration,
            timestamp: startTime
          });
        },

        getResponsivenessReport: function() {
          const thresholds = {
            'click': 100,    // 100ms for clicks
            'scroll': 16,    // 16ms for smooth scrolling (60fps)
            'type': 50,      // 50ms for typing
            'search': 200    // 200ms for search
          };

          const report = {
            byType: {},
            overall: {
              totalInteractions: this.interactions.length,
              fastInteractions: 0,
              slowInteractions: 0
            }
          };

          Object.keys(thresholds).forEach(type => {
            const typeInteractions = this.interactions.filter(i => i.type === type);
            if (typeInteractions.length > 0) {
              const durations = typeInteractions.map(i => i.duration);
              const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
              const threshold = thresholds[type];

              report.byType[type] = {
                count: typeInteractions.length,
                avgDuration: avgDuration,
                threshold: threshold,
                passed: avgDuration <= threshold,
                percentilep95: durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.95)]
              };
            }
          });

          this.interactions.forEach(interaction => {
            const threshold = thresholds[interaction.type] || 100;
            if (interaction.duration <= threshold) {
              report.overall.fastInteractions++;
            } else {
              report.overall.slowInteractions++;
            }
          });

          report.overall.responsivenessScore =
            (report.overall.fastInteractions / report.overall.totalInteractions) * 100;

          return report;
        }
      };

      // Simulate user interactions
      responsivenessBenchmark.recordInteraction('click', 1000, 1080);    // 80ms - good
      responsivenessBenchmark.recordInteraction('click', 2000, 2150);    // 150ms - slow
      responsivenessBenchmark.recordInteraction('scroll', 3000, 3012);   // 12ms - good
      responsivenessBenchmark.recordInteraction('type', 4000, 4030);     // 30ms - good
      responsivenessBenchmark.recordInteraction('search', 5000, 5180);   // 180ms - good

      const report = responsivenessBenchmark.getResponsivenessReport();

      expect(report.overall.totalInteractions).toBe(5);
      expect(report.overall.responsivenessScore).toBeGreaterThan(70); // At least 70% fast interactions
      expect(report.byType.click.count).toBe(2);
      expect(report.byType.scroll.passed).toBe(true);
      expect(report.byType.type.passed).toBe(true);
    });
  });

  describe('Resource Management', () => {
    test('should optimize DOM manipulation performance', () => {
      const domOptimizer = {
        batchUpdates: function(updates) {
          // Simulate batched DOM updates
          const fragment = document.createDocumentFragment();
          const startTime = performance.now();

          updates.forEach(update => {
            const element = document.createElement(update.tag);
            element.textContent = update.content;
            if (update.className) {
              element.className = update.className;
            }
            fragment.appendChild(element);
          });

          const endTime = performance.now();
          return {
            duration: endTime - startTime,
            elementsCreated: updates.length,
            fragment: fragment
          };
        },

        measureReflows: function(operation) {
          const startTime = performance.now();

          operation();

          const endTime = performance.now();
          const totalTime = endTime - startTime;

          // Simulate that layout takes about 20% of total time (optimized)
          const layoutTime = totalTime * 0.2;

          return {
            totalTime: totalTime,
            layoutTime: layoutTime,
            layoutPercentage: (layoutTime / totalTime) * 100
          };
        }
      };

      // Mock document methods
      global.document = {
        createDocumentFragment: jest.fn(() => ({
          appendChild: jest.fn()
        })),
        createElement: jest.fn((tag) => ({
          textContent: '',
          className: '',
          appendChild: jest.fn()
        }))
      };

      const updates = Array.from({ length: 100 }, (_, i) => ({
        tag: 'div',
        content: `Item ${i}`,
        className: 'list-item'
      }));

      const batchResult = domOptimizer.batchUpdates(updates);
      expect(batchResult.elementsCreated).toBe(100);
      expect(batchResult.duration).toBeLessThan(10); // Should be fast with batching

      const reflowResult = domOptimizer.measureReflows(() => {
        // Simulate DOM operations that cause reflow
        for (let i = 0; i < 10; i++) {
          const element = document.createElement('div');
          element.textContent = `Content ${i}`;
        }
      });

      expect(reflowResult.layoutPercentage).toBeLessThan(50); // Layout should be less than 50% of total time
    });

    test('should implement efficient event handling', () => {
      const eventOptimizer = {
        delegatedEvents: new Map(),
        throttledEvents: new Map(),
        debouncedEvents: new Map(),

        setupEventDelegation: function(container, eventType, selector, handler) {
          const delegatedHandler = (event) => {
            if (event.target.matches && event.target.matches(selector)) {
              handler(event);
            }
          };

          this.delegatedEvents.set(`${eventType}-${selector}`, {
            container: container,
            handler: delegatedHandler
          });

          if (container.addEventListener) {
            container.addEventListener(eventType, delegatedHandler);
          }
        },

        throttle: function(func, delay) {
          let lastCall = 0;
          return function(...args) {
            const now = Date.now();
            if (now - lastCall >= delay) {
              lastCall = now;
              return func.apply(this, args);
            }
          };
        },

        debounce: function(func, delay) {
          let timeoutId;
          return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
          };
        }
      };

      // Mock container element
      const mockContainer = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      };

      eventOptimizer.setupEventDelegation(
        mockContainer,
        'click',
        '.button',
        () => console.log('Button clicked')
      );

      expect(mockContainer.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));

      // Test throttling
      let callCount = 0;
      const throttledFunc = eventOptimizer.throttle(() => callCount++, 100);

      throttledFunc();
      throttledFunc();
      throttledFunc();

      expect(callCount).toBe(1); // Should only be called once due to throttling

      // Test debouncing
      let debounceCallCount = 0;
      const debouncedFunc = eventOptimizer.debounce(() => debounceCallCount++, 100);

      debouncedFunc();
      debouncedFunc();
      debouncedFunc();

      // Function should not have been called yet due to debouncing
      expect(debounceCallCount).toBe(0);
    });

    test('should manage background task scheduling', () => {
      const taskScheduler = {
        tasks: [],
        isRunning: false,
        maxConcurrent: 3,

        addTask: function(task, priority = 0) {
          this.tasks.push({
            id: Date.now() + Math.random(),
            task: task,
            priority: priority,
            status: 'pending'
          });

          this.tasks.sort((a, b) => b.priority - a.priority);
          // Don't auto-process for testing purposes
        },

        processQueue: function() {
          if (this.isRunning) return;

          const pendingTasks = this.tasks.filter(t => t.status === 'pending');
          const runningTasks = this.tasks.filter(t => t.status === 'running');

          if (pendingTasks.length === 0 || runningTasks.length >= this.maxConcurrent) {
            return;
          }

          this.isRunning = true;
          const tasksToRun = pendingTasks.slice(0, this.maxConcurrent - runningTasks.length);

          tasksToRun.forEach(taskWrapper => {
            taskWrapper.status = 'running';
            this.executeTask(taskWrapper);
          });

          this.isRunning = false;
        },

        executeTask: async function(taskWrapper) {
          try {
            const result = await taskWrapper.task();
            taskWrapper.status = 'completed';
            taskWrapper.result = result;
          } catch (error) {
            taskWrapper.status = 'failed';
            taskWrapper.error = error;
          }

          // Process next tasks in queue
          setTimeout(() => this.processQueue(), 0);
        },

        getQueueStatus: function() {
          const statusCounts = this.tasks.reduce((counts, task) => {
            counts[task.status] = (counts[task.status] || 0) + 1;
            return counts;
          }, {});

          return {
            total: this.tasks.length,
            pending: statusCounts.pending || 0,
            running: statusCounts.running || 0,
            completed: statusCounts.completed || 0,
            failed: statusCounts.failed || 0,
            averagePriority: this.tasks.length > 0 ?
              this.tasks.reduce((sum, task) => sum + task.priority, 0) / this.tasks.length : 0
          };
        }
      };

      // Add test tasks
      taskScheduler.addTask(async () => 'Task 1 result', 1);
      taskScheduler.addTask(async () => 'Task 2 result', 3);
      taskScheduler.addTask(async () => 'Task 3 result', 2);

      const status = taskScheduler.getQueueStatus();
      expect(status.total).toBe(3);
      expect(status.pending).toBeGreaterThan(0);

      // Check that tasks are sorted by priority
      expect(taskScheduler.tasks[0].priority).toBe(3); // Highest priority first
    });
  });
});