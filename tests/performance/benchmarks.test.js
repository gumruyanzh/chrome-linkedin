import { jest } from '@jest/globals';

// Mock performance observer for monitoring
const mockPerformanceObserver = {
  observe: jest.fn(),
  disconnect: jest.fn(),
  takeRecords: jest.fn()
};

global.PerformanceObserver = jest.fn(() => mockPerformanceObserver);

// Mock Web Vitals metrics
const mockWebVitals = {
  entries: [],
  addEntry: function(type, value, rating) {
    this.entries.push({
      name: type,
      value: value,
      rating: rating,
      timestamp: Date.now()
    });
  }
};

global.webVitals = mockWebVitals;

describe('Performance Benchmarks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWebVitals.entries = [];
  });

  describe('Core Web Vitals Monitoring', () => {
    test('should measure and validate Largest Contentful Paint (LCP)', () => {
      const lcpMonitor = {
        threshold: 2500, // 2.5 seconds for good LCP
        measurements: [],

        measureLCP: function() {
          // Simulate LCP measurement
          const simulatedLCP = Math.random() * 4000; // 0-4 seconds
          this.measurements.push({
            value: simulatedLCP,
            timestamp: Date.now(),
            rating: this.getRating(simulatedLCP)
          });

          return simulatedLCP;
        },

        getRating: function(value) {
          if (value <= 2500) return 'good';
          if (value <= 4000) return 'needs-improvement';
          return 'poor';
        },

        getReport: function() {
          if (this.measurements.length === 0) return null;

          const latest = this.measurements[this.measurements.length - 1];
          const average = this.measurements.reduce((sum, m) => sum + m.value, 0) / this.measurements.length;

          return {
            latest: latest.value,
            average: average,
            rating: latest.rating,
            passesThreshold: latest.value <= this.threshold,
            measurementCount: this.measurements.length
          };
        }
      };

      // Simulate good LCP
      jest.spyOn(Math, 'random').mockReturnValue(0.5); // Will result in 2000ms
      lcpMonitor.measureLCP();

      const goodReport = lcpMonitor.getReport();
      expect(goodReport.rating).toBe('good');
      expect(goodReport.passesThreshold).toBe(true);

      // Simulate poor LCP
      jest.spyOn(Math, 'random').mockReturnValue(0.9); // Will result in 3600ms
      lcpMonitor.measureLCP();

      const poorReport = lcpMonitor.getReport();
      expect(poorReport.rating).toBe('needs-improvement');
      expect(poorReport.passesThreshold).toBe(false);

      jest.restoreAllMocks();
    });

    test('should measure and validate First Input Delay (FID)', () => {
      const fidMonitor = {
        threshold: 100, // 100ms for good FID
        measurements: [],

        simulateUserInput: function(inputType = 'click') {
          const processingStart = performance.now();

          // Simulate main thread blocking
          const blockingTime = Math.random() * 200; // 0-200ms blocking
          const processingEnd = processingStart + blockingTime;

          const fid = processingEnd - processingStart;
          this.measurements.push({
            inputType: inputType,
            delay: fid,
            timestamp: processingStart,
            rating: this.getRating(fid)
          });

          return fid;
        },

        getRating: function(delay) {
          if (delay <= 100) return 'good';
          if (delay <= 300) return 'needs-improvement';
          return 'poor';
        },

        getReport: function() {
          if (this.measurements.length === 0) return null;

          const latest = this.measurements[this.measurements.length - 1];
          const average = this.measurements.reduce((sum, m) => sum + m.delay, 0) / this.measurements.length;

          const byInputType = this.measurements.reduce((acc, m) => {
            if (!acc[m.inputType]) acc[m.inputType] = [];
            acc[m.inputType].push(m.delay);
            return acc;
          }, {});

          return {
            latest: latest.delay,
            average: average,
            rating: latest.rating,
            passesThreshold: latest.delay <= this.threshold,
            byInputType: byInputType,
            worstCase: Math.max(...this.measurements.map(m => m.delay))
          };
        }
      };

      // Simulate good FID
      jest.spyOn(Math, 'random').mockReturnValue(0.3); // Will result in 60ms
      fidMonitor.simulateUserInput('click');

      const goodReport = fidMonitor.getReport();
      expect(goodReport.rating).toBe('good');
      expect(goodReport.passesThreshold).toBe(true);

      // Simulate poor FID
      jest.spyOn(Math, 'random').mockReturnValue(0.8); // Will result in 160ms
      fidMonitor.simulateUserInput('scroll');

      const poorReport = fidMonitor.getReport();
      expect(poorReport.latest).toBeGreaterThan(100);
      expect(poorReport.byInputType).toHaveProperty('click');
      expect(poorReport.byInputType).toHaveProperty('scroll');

      jest.restoreAllMocks();
    });

    test('should measure and validate Cumulative Layout Shift (CLS)', () => {
      const clsMonitor = {
        threshold: 0.1, // 0.1 for good CLS
        layoutShifts: [],

        simulateLayoutShift: function(impactFraction, distanceFraction) {
          const shiftValue = impactFraction * distanceFraction;
          this.layoutShifts.push({
            value: shiftValue,
            impactFraction: impactFraction,
            distanceFraction: distanceFraction,
            timestamp: Date.now()
          });

          return shiftValue;
        },

        calculateCLS: function() {
          // Group layout shifts into sessions
          const sessionGap = 1000; // 1 second gap between sessions
          const maxSessionDuration = 5000; // 5 second max session duration

          let sessions = [];
          let currentSession = [];

          this.layoutShifts.forEach((shift, index) => {
            if (currentSession.length === 0) {
              currentSession = [shift];
            } else {
              const lastShift = currentSession[currentSession.length - 1];
              const timeDiff = shift.timestamp - lastShift.timestamp;
              const sessionDuration = shift.timestamp - currentSession[0].timestamp;

              if (timeDiff > sessionGap || sessionDuration > maxSessionDuration) {
                sessions.push([...currentSession]);
                currentSession = [shift];
              } else {
                currentSession.push(shift);
              }
            }
          });

          if (currentSession.length > 0) {
            sessions.push(currentSession);
          }

          // Calculate CLS as maximum session value
          const sessionValues = sessions.map(session =>
            session.reduce((sum, shift) => sum + shift.value, 0)
          );

          const cls = sessionValues.length > 0 ? Math.max(...sessionValues) : 0;

          return {
            cls: cls,
            rating: this.getRating(cls),
            sessions: sessions.length,
            totalShifts: this.layoutShifts.length
          };
        },

        getRating: function(cls) {
          if (cls <= 0.1) return 'good';
          if (cls <= 0.25) return 'needs-improvement';
          return 'poor';
        }
      };

      // Simulate small layout shifts (good)
      clsMonitor.simulateLayoutShift(0.1, 0.5); // 0.05
      clsMonitor.simulateLayoutShift(0.05, 0.3); // 0.015

      const goodCLS = clsMonitor.calculateCLS();
      expect(goodCLS.rating).toBe('good');
      expect(goodCLS.cls).toBeLessThan(0.1);

      // Simulate large layout shift (poor)
      clsMonitor.simulateLayoutShift(0.8, 0.6); // 0.48

      const poorCLS = clsMonitor.calculateCLS();
      expect(poorCLS.rating).toBe('poor');
      expect(poorCLS.cls).toBeGreaterThan(0.25);
    });
  });

  describe('Extension-Specific Performance Metrics', () => {
    test('should benchmark connection processing speed', () => {
      const connectionBenchmark = {
        profileData: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `User ${i}`,
          company: `Company ${i % 50}`,
          position: `Position ${i % 20}`,
          connection: i % 3 === 0 ? 'connected' : 'not_connected',
          lastActivity: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
        })),

        benchmarkSearch: function(searchTerm) {
          const startTime = performance.now();

          const results = this.profileData.filter(profile => {
            return profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   profile.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   profile.position.toLowerCase().includes(searchTerm.toLowerCase());
          });

          const endTime = performance.now();

          return {
            searchTerm: searchTerm,
            resultsCount: results.length,
            duration: endTime - startTime,
            resultsPerMs: results.length / (endTime - startTime)
          };
        },

        benchmarkFiltering: function(filters) {
          const startTime = performance.now();

          let filtered = [...this.profileData];

          if (filters.company) {
            filtered = filtered.filter(p => p.company === filters.company);
          }

          if (filters.position) {
            filtered = filtered.filter(p => p.position === filters.position);
          }

          if (filters.connectionStatus) {
            filtered = filtered.filter(p => p.connection === filters.connectionStatus);
          }

          if (filters.recentActivity) {
            const cutoff = Date.now() - filters.recentActivity;
            filtered = filtered.filter(p => p.lastActivity > cutoff);
          }

          const endTime = performance.now();

          return {
            filters: filters,
            originalCount: this.profileData.length,
            filteredCount: filtered.length,
            duration: endTime - startTime,
            efficiency: filtered.length / (endTime - startTime)
          };
        },

        benchmarkBulkOperations: function(operationType, batchSize = 100) {
          const startTime = performance.now();
          const batches = [];

          for (let i = 0; i < this.profileData.length; i += batchSize) {
            const batch = this.profileData.slice(i, i + batchSize);
            const batchStartTime = performance.now();

            // Simulate operation on batch
            const processed = batch.map(profile => ({
              ...profile,
              processed: true,
              processedAt: Date.now()
            }));

            const batchEndTime = performance.now();

            batches.push({
              batchNumber: Math.floor(i / batchSize) + 1,
              size: batch.length,
              duration: batchEndTime - batchStartTime,
              throughput: batch.length / (batchEndTime - batchStartTime)
            });
          }

          const endTime = performance.now();

          return {
            operationType: operationType,
            totalItems: this.profileData.length,
            batchSize: batchSize,
            batchCount: batches.length,
            totalDuration: endTime - startTime,
            averageBatchDuration: batches.reduce((sum, b) => sum + b.duration, 0) / batches.length,
            overallThroughput: this.profileData.length / (endTime - startTime),
            batches: batches
          };
        }
      };

      // Test search performance
      const searchResult = connectionBenchmark.benchmarkSearch('User 1');
      expect(searchResult.duration).toBeLessThan(50); // Should complete in under 50ms
      expect(searchResult.resultsPerMs).toBeGreaterThan(0);

      // Test filtering performance
      const filterResult = connectionBenchmark.benchmarkFiltering({
        company: 'Company 1',
        connectionStatus: 'not_connected'
      });
      expect(filterResult.duration).toBeLessThan(20); // Should complete in under 20ms
      expect(filterResult.efficiency).toBeGreaterThan(0);

      // Test bulk operations performance
      const bulkResult = connectionBenchmark.benchmarkBulkOperations('update', 50);
      expect(bulkResult.totalDuration).toBeLessThan(100); // Should complete in under 100ms
      expect(bulkResult.overallThroughput).toBeGreaterThan(10); // At least 10 items per ms
      expect(bulkResult.batchCount).toBe(20); // 1000 items / 50 per batch
    });

    test('should benchmark analytics processing performance', () => {
      const analyticsBenchmark = {
        generateTestData: function(days = 30, eventsPerDay = 100) {
          const events = [];
          const eventTypes = ['connection_sent', 'connection_accepted', 'message_sent', 'profile_viewed'];

          for (let day = 0; day < days; day++) {
            for (let event = 0; event < eventsPerDay; event++) {
              events.push({
                id: `${day}-${event}`,
                type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
                timestamp: Date.now() - (day * 24 * 60 * 60 * 1000) + (event * 60 * 1000),
                userId: `user_${Math.floor(Math.random() * 100)}`,
                metadata: {
                  source: Math.random() > 0.5 ? 'manual' : 'automated',
                  success: Math.random() > 0.2
                }
              });
            }
          }

          return events;
        },

        benchmarkAggregation: function(events) {
          const startTime = performance.now();

          // Group by day
          const byDay = events.reduce((acc, event) => {
            const day = new Date(event.timestamp).toDateString();
            if (!acc[day]) acc[day] = [];
            acc[day].push(event);
            return acc;
          }, {});

          // Group by type
          const byType = events.reduce((acc, event) => {
            if (!acc[event.type]) acc[event.type] = 0;
            acc[event.type]++;
            return acc;
          }, {});

          // Calculate success rates
          const successRates = Object.keys(byType).reduce((acc, type) => {
            const typeEvents = events.filter(e => e.type === type);
            const successfulEvents = typeEvents.filter(e => e.metadata.success);
            acc[type] = (successfulEvents.length / typeEvents.length) * 100;
            return acc;
          }, {});

          const endTime = performance.now();

          return {
            eventCount: events.length,
            duration: endTime - startTime,
            throughput: events.length / (endTime - startTime),
            dayCount: Object.keys(byDay).length,
            typeCount: Object.keys(byType).length,
            aggregations: {
              byDay: Object.keys(byDay).length,
              byType: byType,
              successRates: successRates
            }
          };
        },

        benchmarkTrendAnalysis: function(events) {
          const startTime = performance.now();

          // Sort events by timestamp
          const sortedEvents = events.sort((a, b) => a.timestamp - b.timestamp);

          // Calculate trends over time periods
          const periods = ['day', 'week', 'month'];
          const trends = {};

          periods.forEach(period => {
            const periodMs = {
              day: 24 * 60 * 60 * 1000,
              week: 7 * 24 * 60 * 60 * 1000,
              month: 30 * 24 * 60 * 60 * 1000
            }[period];

            const periodData = [];
            const startDate = sortedEvents[0].timestamp;
            const endDate = sortedEvents[sortedEvents.length - 1].timestamp;

            for (let time = startDate; time <= endDate; time += periodMs) {
              const periodEvents = sortedEvents.filter(e =>
                e.timestamp >= time && e.timestamp < time + periodMs
              );

              periodData.push({
                period: time,
                count: periodEvents.length,
                types: periodEvents.reduce((acc, e) => {
                  acc[e.type] = (acc[e.type] || 0) + 1;
                  return acc;
                }, {})
              });
            }

            // Calculate trend direction
            const counts = periodData.map(p => p.count);
            const avgGrowth = counts.length > 1 ?
              (counts[counts.length - 1] - counts[0]) / (counts.length - 1) : 0;

            trends[period] = {
              periods: periodData.length,
              avgGrowth: avgGrowth,
              direction: avgGrowth > 0 ? 'increasing' : avgGrowth < 0 ? 'decreasing' : 'stable'
            };
          });

          const endTime = performance.now();

          return {
            eventCount: events.length,
            duration: endTime - startTime,
            throughput: events.length / (endTime - startTime),
            trends: trends,
            analysisComplexity: Object.keys(trends).length
          };
        }
      };

      const testEvents = analyticsBenchmark.generateTestData(30, 100); // 30 days, 100 events per day

      // Test aggregation performance
      const aggregationResult = analyticsBenchmark.benchmarkAggregation(testEvents);
      expect(aggregationResult.duration).toBeLessThan(100); // Should complete in under 100ms
      expect(aggregationResult.throughput).toBeGreaterThan(20); // At least 20 events per ms
      expect(aggregationResult.eventCount).toBe(3000);

      // Test trend analysis performance
      const trendResult = analyticsBenchmark.benchmarkTrendAnalysis(testEvents);
      expect(trendResult.duration).toBeLessThan(200); // Should complete in under 200ms
      expect(trendResult.trends).toHaveProperty('day');
      expect(trendResult.trends).toHaveProperty('week');
      expect(trendResult.trends).toHaveProperty('month');
    });

    test('should benchmark UI rendering performance', () => {
      const uiBenchmark = {
        simulateComponentRender: function(componentType, props = {}) {
          const startTime = performance.now();

          // Simulate different component rendering complexities
          const complexity = {
            'simple-button': 1,
            'profile-card': 5,
            'connection-list': 10,
            'analytics-chart': 20,
            'dashboard': 50
          }[componentType] || 1;

          // Simulate rendering work
          for (let i = 0; i < complexity * 1000; i++) {
            // Simulate DOM operations and calculations
            const element = {
              type: componentType,
              props: props,
              children: []
            };

            if (props.children) {
              element.children = Array.from({ length: props.children }, (_, index) => ({
                type: 'child',
                index: index
              }));
            }
          }

          const endTime = performance.now();

          return {
            componentType: componentType,
            complexity: complexity,
            duration: endTime - startTime,
            propsCount: Object.keys(props).length,
            childrenCount: props.children || 0
          };
        },

        benchmarkListRendering: function(itemCount, itemComplexity = 'simple') {
          const startTime = performance.now();

          const complexityMultiplier = {
            'simple': 1,
            'medium': 3,
            'complex': 8
          }[itemComplexity] || 1;

          const items = [];
          for (let i = 0; i < itemCount; i++) {
            // Simulate rendering each list item
            for (let j = 0; j < complexityMultiplier * 100; j++) {
              const item = {
                id: i,
                content: `Item ${i}`,
                rendered: true
              };
            }
            items.push({ id: i, rendered: true });
          }

          const endTime = performance.now();

          return {
            itemCount: itemCount,
            complexity: itemComplexity,
            duration: endTime - startTime,
            itemsPerMs: itemCount / (endTime - startTime),
            virtualScrollNeeded: itemCount > 100
          };
        },

        benchmarkStateUpdates: function(updateCount, stateSize = 100) {
          const startTime = performance.now();

          let state = {};
          for (let i = 0; i < stateSize; i++) {
            state[`key${i}`] = `value${i}`;
          }

          const updates = [];
          for (let i = 0; i < updateCount; i++) {
            const updateStartTime = performance.now();

            // Simulate state update
            const randomKey = `key${Math.floor(Math.random() * stateSize)}`;
            state = {
              ...state,
              [randomKey]: `updated_value${i}`
            };

            const updateEndTime = performance.now();
            updates.push({
              updateNumber: i,
              duration: updateEndTime - updateStartTime,
              changedKey: randomKey
            });
          }

          const endTime = performance.now();

          return {
            updateCount: updateCount,
            stateSize: stateSize,
            totalDuration: endTime - startTime,
            averageUpdateDuration: updates.reduce((sum, u) => sum + u.duration, 0) / updates.length,
            updatesPerMs: updateCount / (endTime - startTime),
            updates: updates.slice(0, 5) // Include first 5 updates for analysis
          };
        }
      };

      // Test component rendering
      const buttonRender = uiBenchmark.simulateComponentRender('simple-button');
      expect(buttonRender.duration).toBeLessThan(10);

      const dashboardRender = uiBenchmark.simulateComponentRender('dashboard', { children: 10 });
      expect(dashboardRender.duration).toBeLessThan(50);
      expect(dashboardRender.childrenCount).toBe(10);

      // Test list rendering
      const simpleList = uiBenchmark.benchmarkListRendering(100, 'simple');
      expect(simpleList.duration).toBeLessThan(20);
      expect(simpleList.itemsPerMs).toBeGreaterThan(1);

      const complexList = uiBenchmark.benchmarkListRendering(1000, 'complex');
      expect(complexList.virtualScrollNeeded).toBe(true);

      // Test state updates
      const stateUpdates = uiBenchmark.benchmarkStateUpdates(50, 100);
      expect(stateUpdates.averageUpdateDuration).toBeLessThan(1); // Under 1ms per update
      expect(stateUpdates.updatesPerMs).toBeGreaterThan(1);
    });
  });

  describe('Performance Regression Detection', () => {
    test('should detect performance regressions', () => {
      const regressionDetector = {
        baselines: new Map(),
        measurements: [],

        setBaseline: function(operation, baselineValue) {
          this.baselines.set(operation, {
            value: baselineValue,
            timestamp: Date.now(),
            samples: 1
          });
        },

        addMeasurement: function(operation, value) {
          this.measurements.push({
            operation: operation,
            value: value,
            timestamp: Date.now()
          });

          const baseline = this.baselines.get(operation);
          if (baseline) {
            // Update rolling baseline
            baseline.value = (baseline.value * baseline.samples + value) / (baseline.samples + 1);
            baseline.samples++;
          }
        },

        detectRegression: function(operation, currentValue, threshold = 1.5) {
          const baseline = this.baselines.get(operation);
          if (!baseline) {
            return { hasRegression: false, reason: 'No baseline available' };
          }

          const ratio = currentValue / baseline.value;
          const hasRegression = ratio > threshold;

          return {
            hasRegression: hasRegression,
            ratio: ratio,
            threshold: threshold,
            currentValue: currentValue,
            baselineValue: baseline.value,
            percentageIncrease: ((ratio - 1) * 100).toFixed(1),
            severity: this.getSeverity(ratio, threshold)
          };
        },

        getSeverity: function(ratio, threshold) {
          if (ratio <= threshold) return 'none';
          if (ratio <= threshold * 1.2) return 'minor';
          if (ratio <= threshold * 2) return 'major';
          return 'critical';
        },

        getPerformanceReport: function() {
          const report = {
            totalMeasurements: this.measurements.length,
            operations: [],
            regressions: []
          };

          this.baselines.forEach((baseline, operation) => {
            const operationMeasurements = this.measurements.filter(m => m.operation === operation);
            const latestMeasurement = operationMeasurements[operationMeasurements.length - 1];

            const operationReport = {
              operation: operation,
              baseline: baseline.value,
              latest: latestMeasurement ? latestMeasurement.value : null,
              measurementCount: operationMeasurements.length,
              trend: this.calculateTrend(operationMeasurements)
            };

            report.operations.push(operationReport);

            if (latestMeasurement) {
              const regression = this.detectRegression(operation, latestMeasurement.value);
              if (regression.hasRegression) {
                report.regressions.push({
                  operation: operation,
                  ...regression
                });
              }
            }
          });

          return report;
        },

        calculateTrend: function(measurements) {
          if (measurements.length < 2) return 'insufficient-data';

          const recent = measurements.slice(-5);
          if (recent.length < 2) return 'insufficient-data';

          const first = recent[0].value;
          const last = recent[recent.length - 1].value;
          const change = (last - first) / first;

          if (Math.abs(change) < 0.05) return 'stable';
          return change > 0 ? 'degrading' : 'improving';
        }
      };

      // Set baselines for different operations
      regressionDetector.setBaseline('search', 50); // 50ms baseline
      regressionDetector.setBaseline('filter', 20);  // 20ms baseline
      regressionDetector.setBaseline('render', 100); // 100ms baseline

      // Add normal measurements
      regressionDetector.addMeasurement('search', 52);
      regressionDetector.addMeasurement('filter', 18);
      regressionDetector.addMeasurement('render', 95);

      // Test no regression
      const noRegression = regressionDetector.detectRegression('search', 55);
      expect(noRegression.hasRegression).toBe(false);

      // Add regressive measurement
      regressionDetector.addMeasurement('search', 200); // Significant increase

      const hasRegression = regressionDetector.detectRegression('search', 200);
      expect(hasRegression.hasRegression).toBe(true);
      expect(hasRegression.severity).toMatch(/major|critical/);

      // Get full report
      const report = regressionDetector.getPerformanceReport();
      expect(report.operations).toHaveLength(3);
      expect(report.regressions.length).toBeGreaterThan(0);
    });

    test('should track performance over time', () => {
      const performanceTracker = {
        history: [],
        alerts: [],

        track: function(metrics) {
          const entry = {
            timestamp: Date.now(),
            metrics: metrics,
            id: Date.now().toString()
          };

          this.history.push(entry);
          this.checkAlerts(entry);
          this.pruneHistory();

          return entry;
        },

        checkAlerts: function(entry) {
          const alertRules = [
            {
              name: 'High Memory Usage',
              condition: (metrics) => metrics.memoryUsage > 50 * 1024 * 1024, // 50MB
              severity: 'warning'
            },
            {
              name: 'Slow Response Time',
              condition: (metrics) => metrics.responseTime > 1000, // 1 second
              severity: 'error'
            },
            {
              name: 'High CPU Usage',
              condition: (metrics) => metrics.cpuUsage > 80, // 80%
              severity: 'warning'
            }
          ];

          alertRules.forEach(rule => {
            if (rule.condition(entry.metrics)) {
              this.alerts.push({
                rule: rule.name,
                severity: rule.severity,
                timestamp: entry.timestamp,
                metrics: entry.metrics,
                id: Date.now() + Math.random()
              });
            }
          });
        },

        pruneHistory: function(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days
          const cutoff = Date.now() - maxAge;
          this.history = this.history.filter(entry => entry.timestamp > cutoff);
        },

        getMetricsSummary: function(metricName, period = 24 * 60 * 60 * 1000) { // 24 hours
          const cutoff = Date.now() - period;
          const relevantEntries = this.history.filter(entry => entry.timestamp > cutoff);

          if (relevantEntries.length === 0) {
            return { error: 'No data available for specified period' };
          }

          const values = relevantEntries.map(entry => entry.metrics[metricName]).filter(v => v !== undefined);

          if (values.length === 0) {
            return { error: `No data available for metric: ${metricName}` };
          }

          return {
            metric: metricName,
            period: period,
            samples: values.length,
            min: Math.min(...values),
            max: Math.max(...values),
            avg: values.reduce((sum, v) => sum + v, 0) / values.length,
            median: values.sort((a, b) => a - b)[Math.floor(values.length / 2)],
            p95: values.sort((a, b) => a - b)[Math.floor(values.length * 0.95)]
          };
        },

        getAlertsCount: function(severity = null) {
          if (severity) {
            return this.alerts.filter(alert => alert.severity === severity).length;
          }
          return this.alerts.length;
        }
      };

      // Track normal performance
      performanceTracker.track({
        memoryUsage: 30 * 1024 * 1024, // 30MB
        responseTime: 500, // 500ms
        cpuUsage: 45 // 45%
      });

      expect(performanceTracker.getAlertsCount()).toBe(0);

      // Track performance that triggers alerts
      performanceTracker.track({
        memoryUsage: 60 * 1024 * 1024, // 60MB - triggers alert
        responseTime: 1200, // 1200ms - triggers alert
        cpuUsage: 85 // 85% - triggers alert
      });

      expect(performanceTracker.getAlertsCount()).toBe(3);
      expect(performanceTracker.getAlertsCount('warning')).toBe(2);
      expect(performanceTracker.getAlertsCount('error')).toBe(1);

      // Test metrics summary
      const memorySummary = performanceTracker.getMetricsSummary('memoryUsage');
      expect(memorySummary.samples).toBe(2);
      expect(memorySummary.max).toBe(60 * 1024 * 1024);
      expect(memorySummary.min).toBe(30 * 1024 * 1024);
    });
  });
});