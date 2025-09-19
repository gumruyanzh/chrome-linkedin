// Tests for Enhanced A/B Testing Framework - Task 6.5
// Statistical Significance, Multiple Variants, Real-time Monitoring, Sample Size Calculation

import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock storage functions
jest.mock('../src/utils/storage.js', () => ({
  getStorageData: jest.fn(),
  setStorageData: jest.fn(),
  logAnalytics: jest.fn(),
  STORAGE_KEYS: {
    AB_TESTS: 'ab_tests',
    AB_ASSIGNMENTS: 'ab_assignments',
    AB_TEST_CONFIGS: 'ab_test_configs',
    AB_TEST_RESULTS: 'ab_test_results',
    AB_TEST_STATISTICS: 'ab_test_statistics',
    AB_TEST_SAMPLE_SIZES: 'ab_test_sample_sizes',
    AB_TEST_MONITORING: 'ab_test_monitoring',
    ANALYTICS: 'analytics',
    ERRORS: 'errors'
  }
}));

// Mock real-time analytics
jest.mock('../src/utils/real-time-analytics.js', () => ({
  trackEvent: jest.fn(),
  trackPerformanceMetric: jest.fn(),
  ANALYTICS_EVENT_TYPES: {
    AB_TEST_CREATED: 'ab_test_created',
    AB_TEST_STARTED: 'ab_test_started',
    AB_TEST_STOPPED: 'ab_test_stopped',
    AB_TEST_CONVERSION: 'ab_test_conversion'
  }
}));

// Mock error reporting
jest.mock('../src/utils/error-reporting.js', () => ({
  reportError: jest.fn(),
  logErrorEvent: jest.fn()
}));

import { getStorageData, setStorageData, logAnalytics } from '../src/utils/storage.js';
import { trackEvent, trackPerformanceMetric } from '../src/utils/real-time-analytics.js';
import { reportError } from '../src/utils/error-reporting.js';

describe('Enhanced A/B Testing Framework - Task 6.5', () => {
  let enhancedABFramework;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock storage responses
    getStorageData.mockResolvedValue({});
    setStorageData.mockResolvedValue();
    logAnalytics.mockResolvedValue();
    trackEvent.mockResolvedValue();
    trackPerformanceMetric.mockResolvedValue();
    reportError.mockResolvedValue();
  });

  describe('Multi-Variant Testing (A/B/C/D)', () => {
    test('should create test with multiple variants (A/B/C/D)', async () => {
      // Import the enhanced framework that we'll implement
      const { EnhancedABTestingFramework } = await import('../src/utils/enhanced-ab-testing-framework.js');
      enhancedABFramework = new EnhancedABTestingFramework();

      const testConfig = {
        name: 'Multi-Variant Message Test',
        description: 'Testing 4 different message templates',
        hypothesis: 'Personalized templates will outperform generic ones',
        variants: [
          { id: 'control', name: 'Control', template: 'Hi {{name}}, let\'s connect!' },
          { id: 'personal', name: 'Personal', template: 'Hi {{name}}, I noticed we both work in {{industry}}. Let\'s connect!' },
          { id: 'benefit', name: 'Benefit-focused', template: 'Hi {{name}}, connecting could help us both grow our networks in {{industry}}!' },
          { id: 'question', name: 'Question-based', template: 'Hi {{name}}, are you interested in expanding your {{industry}} network?' }
        ],
        metrics: ['acceptance_rate', 'response_rate', 'engagement_score'],
        significanceLevel: 0.95,
        targetAudience: { industry: 'tech' }
      };

      const test = await enhancedABFramework.createMultiVariantTest(testConfig);

      expect(test.id).toBeDefined();
      expect(test.variants).toHaveLength(4);
      expect(test.trafficSplit).toEqual([25, 25, 25, 25]); // Equal distribution
      expect(test.testType).toBe('multi_variant');
      expect(test.statistics.variantStats).toHaveProperty('control');
      expect(test.statistics.variantStats).toHaveProperty('personal');
      expect(test.statistics.variantStats).toHaveProperty('benefit');
      expect(test.statistics.variantStats).toHaveProperty('question');

      expect(trackEvent).toHaveBeenCalledWith({
        type: 'ab_test_created',
        testId: test.id,
        testType: 'multi_variant',
        variantCount: 4
      });
    });

    test('should support custom traffic split for multi-variant tests', async () => {
      const { EnhancedABTestingFramework } = await import('../src/utils/enhanced-ab-testing-framework.js');
      enhancedABFramework = new EnhancedABTestingFramework();

      const testConfig = {
        name: 'Custom Split Test',
        variants: [
          { template: 'Control' },
          { template: 'Variant B' },
          { template: 'Variant C' }
        ],
        trafficSplit: [50, 30, 20] // Custom split
      };

      const test = await enhancedABFramework.createMultiVariantTest(testConfig);

      expect(test.trafficSplit).toEqual([50, 30, 20]);

      // Verify traffic split validation
      const testConfigInvalid = {
        name: 'Invalid Split Test',
        variants: [{ template: 'A' }, { template: 'B' }],
        trafficSplit: [60, 30] // Doesn't sum to 100
      };

      await expect(enhancedABFramework.createMultiVariantTest(testConfigInvalid))
        .rejects.toThrow('Traffic split must sum to 100%');
    });

    test('should calculate statistical significance for multi-variant tests using ANOVA', async () => {
      const { EnhancedABTestingFramework } = await import('../src/utils/enhanced-ab-testing-framework.js');
      enhancedABFramework = new EnhancedABTestingFramework();

      const test = await enhancedABFramework.createMultiVariantTest({
        name: 'ANOVA Test',
        variants: [
          { id: 'A', template: 'Template A' },
          { id: 'B', template: 'Template B' },
          { id: 'C', template: 'Template C' }
        ]
      });

      await enhancedABFramework.startTest(test.id);

      // Simulate different conversion rates for each variant
      // Variant A: 30% conversion (30/100)
      for (let i = 0; i < 100; i++) {
        await enhancedABFramework.assignUserToVariant(test.id, `userA${i}`);
        if (i < 30) {
          await enhancedABFramework.recordConversion(test.id, `userA${i}`, 'acceptance_rate', 1);
        }
      }

      // Variant B: 45% conversion (45/100)
      for (let i = 0; i < 100; i++) {
        await enhancedABFramework.assignUserToVariant(test.id, `userB${i}`);
        if (i < 45) {
          await enhancedABFramework.recordConversion(test.id, `userB${i}`, 'acceptance_rate', 1);
        }
      }

      // Variant C: 35% conversion (35/100)
      for (let i = 0; i < 100; i++) {
        await enhancedABFramework.assignUserToVariant(test.id, `userC${i}`);
        if (i < 35) {
          await enhancedABFramework.recordConversion(test.id, `userC${i}`, 'acceptance_rate', 1);
        }
      }

      const statisticalAnalysis = await enhancedABFramework.calculateMultiVariantSignificance(test.id);

      expect(statisticalAnalysis.method).toBe('ANOVA');
      expect(statisticalAnalysis.fStatistic).toBeDefined();
      expect(statisticalAnalysis.pValue).toBeDefined();
      expect(statisticalAnalysis.degreesOfFreedom).toEqual({ between: 2, within: 297 });
      expect(statisticalAnalysis.variantComparisons).toBeDefined();
      expect(statisticalAnalysis.bestVariant).toBe('B'); // Highest conversion rate
      expect(statisticalAnalysis.statisticallySignificant).toBe(true);
    });

    test('should perform pairwise comparisons with Bonferroni correction', async () => {
      const { EnhancedABTestingFramework } = await import('../src/utils/enhanced-ab-testing-framework.js');
      enhancedABFramework = new EnhancedABTestingFramework();

      const test = await enhancedABFramework.createMultiVariantTest({
        name: 'Pairwise Test',
        variants: [
          { id: 'A', template: 'Template A' },
          { id: 'B', template: 'Template B' },
          { id: 'C', template: 'Template C' }
        ]
      });

      await enhancedABFramework.startTest(test.id);

      // Add test data with significant differences
      const testData = [
        { variant: 'A', users: 100, conversions: 20 }, // 20%
        { variant: 'B', users: 100, conversions: 40 }, // 40%
        { variant: 'C', users: 100, conversions: 25 }  // 25%
      ];

      for (const data of testData) {
        for (let i = 0; i < data.users; i++) {
          await enhancedABFramework.assignUserToVariant(test.id, `user${data.variant}${i}`);
          if (i < data.conversions) {
            await enhancedABFramework.recordConversion(test.id, `user${data.variant}${i}`, 'acceptance_rate', 1);
          }
        }
      }

      const pairwiseResults = await enhancedABFramework.performPairwiseComparisons(test.id);

      expect(pairwiseResults.comparisons).toHaveLength(3); // A vs B, A vs C, B vs C
      expect(pairwiseResults.adjustedSignificanceLevel).toBeCloseTo(0.0167, 3); // 0.05/3 for Bonferroni

      // Check specific comparisons
      const aVsB = pairwiseResults.comparisons.find(c =>
        (c.variant1 === 'A' && c.variant2 === 'B') || (c.variant1 === 'B' && c.variant2 === 'A')
      );
      expect(aVsB.pValue).toBeLessThan(0.0167);
      expect(aVsB.statisticallySignificant).toBe(true);
      expect(Math.abs(aVsB.effectSize)).toBeCloseTo(0.2, 1); // 20% difference
    });
  });

  describe('Sample Size Calculation and Power Analysis', () => {
    test('should calculate required sample size for desired power', async () => {
      const { EnhancedABTestingFramework } = await import('../src/utils/enhanced-ab-testing-framework.js');
      enhancedABFramework = new EnhancedABTestingFramework();

      const powerAnalysis = await enhancedABFramework.calculateSampleSize({
        baselineConversionRate: 0.15, // 15% baseline
        minimumDetectableEffect: 0.05, // Want to detect 5% improvement (20% relative improvement)
        significanceLevel: 0.05,
        statisticalPower: 0.80,
        variants: 2
      });

      expect(powerAnalysis.sampleSizePerVariant).toBeGreaterThan(0);
      expect(powerAnalysis.totalSampleSize).toBe(powerAnalysis.sampleSizePerVariant * 2);
      expect(powerAnalysis.expectedDuration).toBeDefined();
      expect(powerAnalysis.assumptions).toEqual({
        baselineConversionRate: 0.15,
        minimumDetectableEffect: 0.05,
        significanceLevel: 0.05,
        statisticalPower: 0.80
      });

      expect(trackPerformanceMetric).toHaveBeenCalledWith({
        metric: 'sample_size_calculation',
        duration: expect.any(Number),
        sampleSize: powerAnalysis.totalSampleSize
      });
    });

    test('should calculate sample size for multi-variant tests', async () => {
      const { EnhancedABTestingFramework } = await import('../src/utils/enhanced-ab-testing-framework.js');
      enhancedABFramework = new EnhancedABTestingFramework();

      const powerAnalysis = await enhancedABFramework.calculateSampleSize({
        baselineConversionRate: 0.20,
        minimumDetectableEffect: 0.08,
        significanceLevel: 0.05,
        statisticalPower: 0.80,
        variants: 4 // A/B/C/D test
      });

      expect(powerAnalysis.sampleSizePerVariant).toBeGreaterThan(0);
      expect(powerAnalysis.totalSampleSize).toBe(powerAnalysis.sampleSizePerVariant * 4);
      expect(powerAnalysis.adjustedSignificanceLevel).toBeCloseTo(0.0125, 3); // Bonferroni correction
      expect(powerAnalysis.method).toBe('ANOVA_with_post_hoc');
    });

    test('should validate power analysis parameters', async () => {
      const { EnhancedABTestingFramework } = await import('../src/utils/enhanced-ab-testing-framework.js');
      enhancedABFramework = new EnhancedABTestingFramework();

      // Test invalid parameters
      await expect(enhancedABFramework.calculateSampleSize({
        baselineConversionRate: -0.1 // Invalid negative rate
      })).rejects.toThrow('Baseline conversion rate must be between 0 and 1');

      await expect(enhancedABFramework.calculateSampleSize({
        baselineConversionRate: 0.15,
        minimumDetectableEffect: 0,
        significanceLevel: 0.05,
        statisticalPower: 0.80
      })).rejects.toThrow('Minimum detectable effect must be greater than 0');

      await expect(enhancedABFramework.calculateSampleSize({
        baselineConversionRate: 0.15,
        minimumDetectableEffect: 0.05,
        significanceLevel: 1.5 // Invalid significance level
      })).rejects.toThrow('Significance level must be between 0 and 1');
    });

    test('should recommend optimal test duration based on traffic', async () => {
      const { EnhancedABTestingFramework } = await import('../src/utils/enhanced-ab-testing-framework.js');
      enhancedABFramework = new EnhancedABTestingFramework();

      const powerAnalysis = await enhancedABFramework.calculateSampleSize({
        baselineConversionRate: 0.12,
        minimumDetectableEffect: 0.03,
        significanceLevel: 0.05,
        statisticalPower: 0.80,
        variants: 2,
        expectedTrafficPerDay: 100 // 100 users per day
      });

      expect(powerAnalysis.recommendedDurationDays).toBeDefined();
      expect(powerAnalysis.recommendedDurationDays).toBeGreaterThan(0);
      expect(powerAnalysis.trafficAnalysis).toEqual({
        expectedTrafficPerDay: 100,
        trafficPerVariantPerDay: 50,
        daysToReachSampleSize: Math.ceil(powerAnalysis.sampleSizePerVariant / 50)
      });
    });
  });

  describe('Real-time Results Monitoring', () => {
    test('should track test progress in real-time', async () => {
      const { EnhancedABTestingFramework } = await import('../src/utils/enhanced-ab-testing-framework.js');
      enhancedABFramework = new EnhancedABTestingFramework();

      const test = await enhancedABFramework.createMultiVariantTest({
        name: 'Real-time Test',
        variants: [
          { id: 'A', template: 'Template A' },
          { id: 'B', template: 'Template B' }
        ],
        sampleSize: 200,
        monitoringInterval: 1000 // Check every second
      });

      await enhancedABFramework.startTest(test.id);

      // Start real-time monitoring
      const monitoring = await enhancedABFramework.startRealTimeMonitoring(test.id);

      expect(monitoring.testId).toBe(test.id);
      expect(monitoring.isActive).toBe(true);
      expect(monitoring.checkInterval).toBe(1000);
      expect(monitoring.metrics).toEqual(['progress', 'significance', 'early_stopping']);

      // Add some test data
      for (let i = 0; i < 50; i++) {
        await enhancedABFramework.assignUserToVariant(test.id, `user${i}`);
        if (i % 3 === 0) {
          await enhancedABFramework.recordConversion(test.id, `user${i}`, 'acceptance_rate', 1);
        }
      }

      // Get real-time progress
      const progress = await enhancedABFramework.getTestProgress(test.id);

      expect(progress.totalParticipants).toBe(50);
      expect(progress.targetSampleSize).toBe(200);
      expect(progress.progressPercentage).toBe(25); // 50/200 = 25%
      expect(progress.variantProgress).toBeDefined();
      expect(progress.estimatedTimeToCompletion).toBeDefined();
      expect(progress.currentSignificance).toBeDefined();

      expect(trackPerformanceMetric).toHaveBeenCalledWith({
        metric: 'test_progress_check',
        testId: test.id,
        progress: 25
      });
    });

    test('should detect early stopping conditions', async () => {
      const { EnhancedABTestingFramework } = await import('../src/utils/enhanced-ab-testing-framework.js');
      enhancedABFramework = new EnhancedABTestingFramework();

      const test = await enhancedABFramework.createMultiVariantTest({
        name: 'Early Stopping Test',
        variants: [
          { id: 'A', template: 'Template A' },
          { id: 'B', template: 'Template B' }
        ],
        earlyStoppingRules: {
          futilityBoundary: 0.8, // Stop if p-value > 0.8 (futile)
          superiorityBoundary: 0.001, // Stop if p-value < 0.001 (highly significant)
          minimumSampleSize: 50,
          maximumDuration: 30 // days
        }
      });

      await enhancedABFramework.startTest(test.id);

      // Simulate highly significant results early
      for (let i = 0; i < 60; i++) {
        await enhancedABFramework.assignUserToVariant(test.id, `user${i}`);
        // Variant B gets much higher conversion rate
        const variantId = i < 30 ? 'A' : 'B';
        const shouldConvert = variantId === 'A' ? (i % 10 === 0) : (i % 2 === 0); // 10% vs 50%

        if (shouldConvert) {
          await enhancedABFramework.recordConversion(test.id, `user${i}`, 'acceptance_rate', 1);
        }
      }

      const earlyStoppingCheck = await enhancedABFramework.checkEarlyStoppingConditions(test.id);

      expect(earlyStoppingCheck.shouldStop).toBe(true);
      expect(earlyStoppingCheck.reason).toBe('superiority_boundary_crossed');
      expect(earlyStoppingCheck.pValue).toBeLessThan(0.001);
      expect(earlyStoppingCheck.recommendedAction).toBe('stop_test_declare_winner');

      expect(trackEvent).toHaveBeenCalledWith({
        type: 'early_stopping_triggered',
        testId: test.id,
        reason: 'superiority_boundary_crossed',
        sampleSize: 60
      });
    });

    test('should handle futility stopping (no significant difference likely)', async () => {
      const { EnhancedABTestingFramework } = await import('../src/utils/enhanced-ab-testing-framework.js');
      enhancedABFramework = new EnhancedABTestingFramework();

      const test = await enhancedABFramework.createMultiVariantTest({
        name: 'Futility Test',
        variants: [
          { id: 'A', template: 'Template A' },
          { id: 'B', template: 'Template B' }
        ],
        earlyStoppingRules: {
          futilityBoundary: 0.8,
          minimumSampleSize: 100
        }
      });

      await enhancedABFramework.startTest(test.id);

      // Simulate very similar conversion rates (no real difference)
      for (let i = 0; i < 120; i++) {
        await enhancedABFramework.assignUserToVariant(test.id, `user${i}`);
        // Both variants get ~25% conversion with random noise
        if (Math.random() < 0.25) {
          await enhancedABFramework.recordConversion(test.id, `user${i}`, 'acceptance_rate', 1);
        }
      }

      const earlyStoppingCheck = await enhancedABFramework.checkEarlyStoppingConditions(test.id);

      if (earlyStoppingCheck.shouldStop) {
        expect(earlyStoppingCheck.reason).toBe('futility_boundary_crossed');
        expect(earlyStoppingCheck.pValue).toBeGreaterThan(0.8);
        expect(earlyStoppingCheck.recommendedAction).toBe('stop_test_no_difference');
      }
    });

    test('should calculate Bayesian probability of superiority', async () => {
      const { EnhancedABTestingFramework } = await import('../src/utils/enhanced-ab-testing-framework.js');
      enhancedABFramework = new EnhancedABTestingFramework();

      const test = await enhancedABFramework.createMultiVariantTest({
        name: 'Bayesian Test',
        variants: [
          { id: 'A', template: 'Template A' },
          { id: 'B', template: 'Template B' }
        ],
        analysisMethod: 'bayesian'
      });

      await enhancedABFramework.startTest(test.id);

      // Add test data
      for (let i = 0; i < 100; i++) {
        await enhancedABFramework.assignUserToVariant(test.id, `user${i}`);
        const variantId = i < 50 ? 'A' : 'B';
        const conversionRate = variantId === 'A' ? 0.2 : 0.35; // B is better

        if (Math.random() < conversionRate) {
          await enhancedABFramework.recordConversion(test.id, `user${i}`, 'acceptance_rate', 1);
        }
      }

      const bayesianAnalysis = await enhancedABFramework.calculateBayesianAnalysis(test.id);

      expect(bayesianAnalysis.probabilityBIsBetter).toBeGreaterThan(0.5);
      expect(bayesianAnalysis.credibleInterval).toBeDefined();
      expect(bayesianAnalysis.credibleInterval.lower).toBeDefined();
      expect(bayesianAnalysis.credibleInterval.upper).toBeDefined();
      expect(bayesianAnalysis.posteriorDistributions).toHaveProperty('A');
      expect(bayesianAnalysis.posteriorDistributions).toHaveProperty('B');
      expect(bayesianAnalysis.expectedLoss).toBeDefined();
    });
  });

  describe('Integration with Analytics and Error Reporting', () => {
    test('should integrate with real-time analytics system', async () => {
      const { EnhancedABTestingFramework } = await import('../src/utils/enhanced-ab-testing-framework.js');
      enhancedABFramework = new EnhancedABTestingFramework();

      const test = await enhancedABFramework.createMultiVariantTest({
        name: 'Analytics Integration Test',
        variants: [
          { id: 'A', template: 'Template A' },
          { id: 'B', template: 'Template B' }
        ]
      });

      await enhancedABFramework.startTest(test.id);

      // Verify analytics integration
      expect(trackEvent).toHaveBeenCalledWith({
        type: 'ab_test_created',
        testId: test.id,
        testType: 'multi_variant',
        variantCount: 2
      });

      // Test user assignment analytics
      await enhancedABFramework.assignUserToVariant(test.id, 'user123');

      expect(trackEvent).toHaveBeenCalledWith({
        type: 'ab_test_assignment',
        testId: test.id,
        userId: 'user123',
        variantId: expect.any(String),
        timestamp: expect.any(Number)
      });

      // Test conversion analytics
      await enhancedABFramework.recordConversion(test.id, 'user123', 'acceptance_rate', 1);

      expect(trackEvent).toHaveBeenCalledWith({
        type: 'ab_test_conversion',
        testId: test.id,
        userId: 'user123',
        variantId: expect.any(String),
        metric: 'acceptance_rate',
        value: 1,
        timestamp: expect.any(Number)
      });
    });

    test('should report errors to error reporting system', async () => {
      const { EnhancedABTestingFramework } = await import('../src/utils/enhanced-ab-testing-framework.js');
      enhancedABFramework = new EnhancedABTestingFramework();

      // Force an error by providing invalid test configuration
      try {
        await enhancedABFramework.calculateSampleSize({
          baselineConversionRate: 'invalid' // Should be number
        });
      } catch (error) {
        // Error should be caught and reported
      }

      expect(reportError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Baseline conversion rate'),
          source: 'enhanced_ab_testing_framework',
          context: expect.any(Object)
        })
      );
    });

    test('should track performance metrics during calculations', async () => {
      const { EnhancedABTestingFramework } = await import('../src/utils/enhanced-ab-testing-framework.js');
      enhancedABFramework = new EnhancedABTestingFramework();

      const test = await enhancedABFramework.createMultiVariantTest({
        name: 'Performance Test',
        variants: [
          { id: 'A', template: 'Template A' },
          { id: 'B', template: 'Template B' },
          { id: 'C', template: 'Template C' }
        ]
      });

      await enhancedABFramework.startTest(test.id);

      // Add substantial test data to measure performance
      for (let i = 0; i < 500; i++) {
        await enhancedABFramework.assignUserToVariant(test.id, `user${i}`);
        if (i % 3 === 0) {
          await enhancedABFramework.recordConversion(test.id, `user${i}`, 'acceptance_rate', 1);
        }
      }

      await enhancedABFramework.calculateMultiVariantSignificance(test.id);

      expect(trackPerformanceMetric).toHaveBeenCalledWith({
        metric: 'statistical_calculation_time',
        duration: expect.any(Number),
        testId: test.id,
        sampleSize: 500,
        variantCount: 3
      });
    });

    test('should maintain data consistency across systems', async () => {
      const { EnhancedABTestingFramework } = await import('../src/utils/enhanced-ab-testing-framework.js');
      enhancedABFramework = new EnhancedABTestingFramework();

      const test = await enhancedABFramework.createMultiVariantTest({
        name: 'Consistency Test',
        variants: [
          { id: 'A', template: 'Template A' },
          { id: 'B', template: 'Template B' }
        ]
      });

      await enhancedABFramework.startTest(test.id);
      await enhancedABFramework.assignUserToVariant(test.id, 'user123');
      await enhancedABFramework.recordConversion(test.id, 'user123', 'acceptance_rate', 1);

      // Verify data is stored consistently across different storage keys
      expect(setStorageData).toHaveBeenCalledWith(
        expect.objectContaining({
          ab_test_configs: expect.any(Object)
        })
      );

      expect(setStorageData).toHaveBeenCalledWith(
        expect.objectContaining({
          ab_test_statistics: expect.any(Object)
        })
      );

      expect(setStorageData).toHaveBeenCalledWith(
        expect.objectContaining({
          ab_test_results: expect.any(Object)
        })
      );
    });
  });

  describe('Advanced Statistical Methods', () => {
    test('should support sequential testing with alpha spending', async () => {
      const { EnhancedABTestingFramework } = await import('../src/utils/enhanced-ab-testing-framework.js');
      enhancedABFramework = new EnhancedABTestingFramework();

      const test = await enhancedABFramework.createMultiVariantTest({
        name: 'Sequential Test',
        variants: [
          { id: 'A', template: 'Template A' },
          { id: 'B', template: 'Template B' }
        ],
        analysisMethod: 'sequential',
        alphaSpending: 'obrien_fleming' // Or 'pocock', 'haybittle_peto'
      });

      await enhancedABFramework.startTest(test.id);

      // Add data incrementally and check at each interim analysis
      for (let analysis = 1; analysis <= 5; analysis++) {
        // Add 50 users per analysis
        for (let i = 0; i < 50; i++) {
          const userId = `user_${analysis}_${i}`;
          await enhancedABFramework.assignUserToVariant(test.id, userId);
          if (Math.random() < (analysis === 1 ? 0.2 : 0.35)) { // B gets better over time
            await enhancedABFramework.recordConversion(test.id, userId, 'acceptance_rate', 1);
          }
        }

        const interimAnalysis = await enhancedABFramework.performInterimAnalysis(test.id, analysis);

        expect(interimAnalysis.analysisNumber).toBe(analysis);
        expect(interimAnalysis.spentAlpha).toBeDefined();
        expect(interimAnalysis.remainingAlpha).toBeDefined();
        expect(interimAnalysis.criticalValue).toBeDefined();
        expect(interimAnalysis.recommendation).toBeOneOf(['continue', 'stop_efficacy', 'stop_futility']);
      }
    });

    test('should handle minimum viable effect size testing', async () => {
      const { EnhancedABTestingFramework } = await import('../src/utils/enhanced-ab-testing-framework.js');
      enhancedABFramework = new EnhancedABTestingFramework();

      const test = await enhancedABFramework.createMultiVariantTest({
        name: 'MVEF Test',
        variants: [
          { id: 'A', template: 'Template A' },
          { id: 'B', template: 'Template B' }
        ],
        minimumViableEffectSize: 0.05, // 5% minimum improvement needed
        analysisMethod: 'mvef'
      });

      await enhancedABFramework.startTest(test.id);

      // Simulate small but statistically significant difference (2%)
      for (let i = 0; i < 1000; i++) {
        await enhancedABFramework.assignUserToVariant(test.id, `user${i}`);
        const variantId = i < 500 ? 'A' : 'B';
        const conversionRate = variantId === 'A' ? 0.25 : 0.27; // Only 2% difference

        if (Math.random() < conversionRate) {
          await enhancedABFramework.recordConversion(test.id, `user${i}`, 'acceptance_rate', 1);
        }
      }

      const mvefAnalysis = await enhancedABFramework.calculateMVEFAnalysis(test.id);

      expect(mvefAnalysis.observedEffect).toBeCloseTo(0.02, 2);
      expect(mvefAnalysis.minimumViableEffect).toBe(0.05);
      expect(mvefAnalysis.isViable).toBe(false); // 2% < 5% minimum
      expect(mvefAnalysis.recommendation).toBe('continue_testing_or_redesign');
      expect(mvefAnalysis.probabilityViableEffect).toBeLessThan(0.5);
    });

    test('should calculate test sensitivity and retrospective power', async () => {
      const { EnhancedABTestingFramework } = await import('../src/utils/enhanced-ab-testing-framework.js');
      enhancedABFramework = new EnhancedABTestingFramework();

      const test = await enhancedABFramework.createMultiVariantTest({
        name: 'Power Analysis Test',
        variants: [
          { id: 'A', template: 'Template A' },
          { id: 'B', template: 'Template B' }
        ]
      });

      await enhancedABFramework.startTest(test.id);

      // Add test data
      for (let i = 0; i < 200; i++) {
        await enhancedABFramework.assignUserToVariant(test.id, `user${i}`);
        const variantId = i < 100 ? 'A' : 'B';
        const conversionRate = variantId === 'A' ? 0.20 : 0.30;

        if (Math.random() < conversionRate) {
          await enhancedABFramework.recordConversion(test.id, `user${i}`, 'acceptance_rate', 1);
        }
      }

      const powerAnalysis = await enhancedABFramework.calculateRetrospectivePower(test.id);

      expect(powerAnalysis.actualSampleSize).toBe(200);
      expect(powerAnalysis.observedEffectSize).toBeCloseTo(0.1, 1); // 10% difference
      expect(powerAnalysis.achievedPower).toBeDefined();
      expect(powerAnalysis.achievedPower).toBeGreaterThan(0);
      expect(powerAnalysis.sensitivityAnalysis).toBeDefined();
      expect(powerAnalysis.minimumDetectableEffect).toBeDefined();
    });
  });
});