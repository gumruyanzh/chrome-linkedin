// Tests for A/B Testing Framework - Statistical Analysis and Template Optimization

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import {
  ABTestingFramework,
  createABTestingFramework,
  createSimpleABTest,
  AB_TEST_STATUS,
  SIGNIFICANCE_LEVELS
} from '../src/utils/ab-testing-framework.js';

// Mock storage functions
jest.mock('../src/utils/storage.js', () => ({
  getStorageData: jest.fn(),
  setStorageData: jest.fn(),
  logAnalytics: jest.fn(),
  STORAGE_KEYS: {
    AB_TESTS: 'ab_tests',
    AB_ASSIGNMENTS: 'ab_assignments'
  }
}));

import { getStorageData, setStorageData, logAnalytics } from '../src/utils/storage.js';

describe('ABTestingFramework', () => {
  let framework;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock storage to return empty data initially
    getStorageData.mockResolvedValue({});
    setStorageData.mockResolvedValue();
    logAnalytics.mockResolvedValue();

    framework = new ABTestingFramework();
  });

  describe('Test Creation', () => {
    test('should create a new A/B test with valid configuration', async () => {
      const testConfig = {
        name: 'Template Optimization Test',
        description: 'Testing different message templates',
        hypothesis: 'Template B will have higher acceptance rate',
        variants: [
          { id: 'control', name: 'Control Template', template: 'Hi {{name}}, I would like to connect.' },
          { id: 'variant_b', name: 'Personal Template', template: 'Hi {{name}}, I noticed we both work in {{industry}}. Let\'s connect!' }
        ],
        metrics: ['acceptance_rate', 'response_rate'],
        significanceLevel: SIGNIFICANCE_LEVELS.HIGH
      };

      const test = await framework.createTest(testConfig);

      expect(test.id).toBeDefined();
      expect(test.name).toBe(testConfig.name);
      expect(test.description).toBe(testConfig.description);
      expect(test.hypothesis).toBe(testConfig.hypothesis);
      expect(test.variants).toHaveLength(2);
      expect(test.status).toBe(AB_TEST_STATUS.DRAFT);
      expect(test.createdAt).toBeDefined();
      expect(test.statistics.totalParticipants).toBe(0);

      // Check that variants are properly initialized
      expect(test.variants[0].isControl).toBe(true);
      expect(test.variants[1].isControl).toBe(false);

      // Check that variant statistics are initialized
      test.variants.forEach(variant => {
        expect(test.statistics.variantStats[variant.id]).toBeDefined();
        expect(test.statistics.variantStats[variant.id].participants).toBe(0);
        expect(test.statistics.variantStats[variant.id].conversions).toBe(0);
      });

      expect(setStorageData).toHaveBeenCalled();
      expect(logAnalytics).toHaveBeenCalledWith({
        type: 'ab_test_created',
        testId: test.id,
        testName: test.name,
        variantCount: 2
      });
    });

    test('should create test with default values when optional fields are missing', async () => {
      const testConfig = {
        name: 'Simple Test',
        variants: [
          { template: 'Template A' },
          { template: 'Template B' }
        ]
      };

      const test = await framework.createTest(testConfig);

      expect(test.description).toBe('');
      expect(test.hypothesis).toBe('');
      expect(test.metrics).toEqual(['acceptance_rate', 'response_rate']);
      expect(test.significanceLevel).toBe(SIGNIFICANCE_LEVELS.HIGH);
      expect(test.trafficSplit).toEqual([50, 50]);

      // Check auto-generated variant names
      expect(test.variants[0].name).toBe('Variant A');
      expect(test.variants[1].name).toBe('Variant B');
    });

    test('should validate variants correctly', async () => {
      const invalidConfig = {
        name: 'Invalid Test',
        variants: [{ template: 'Only one template' }]
      };

      await expect(framework.createTest(invalidConfig)).rejects.toThrow('Test must have at least 2 variants');
    });

    test('should generate unique test IDs', async () => {
      const config = {
        name: 'Test 1',
        variants: [{ template: 'A' }, { template: 'B' }]
      };

      const test1 = await framework.createTest(config);
      const test2 = await framework.createTest({ ...config, name: 'Test 2' });

      expect(test1.id).not.toBe(test2.id);
      expect(test1.id).toMatch(/^abtest_\d+_[a-z0-9]+$/);
    });
  });

  describe('Test Management', () => {
    let testId;

    beforeEach(async () => {
      const test = await framework.createTest({
        name: 'Management Test',
        variants: [
          { template: 'Template A' },
          { template: 'Template B' }
        ]
      });
      testId = test.id;
    });

    test('should start a test successfully', async () => {
      const startedTest = await framework.startTest(testId);

      expect(startedTest.status).toBe(AB_TEST_STATUS.ACTIVE);
      expect(startedTest.startedAt).toBeDefined();
      expect(logAnalytics).toHaveBeenCalledWith({
        type: 'ab_test_started',
        testId: startedTest.id,
        testName: startedTest.name,
        startedAt: startedTest.startedAt
      });
    });

    test('should set scheduled end date when duration is specified', async () => {
      await framework.createTest({
        name: 'Duration Test',
        variants: [{ template: 'A' }, { template: 'B' }],
        duration: 7 // 7 days
      });

      const tests = Array.from(framework.tests.values());
      const durationTest = tests.find(t => t.name === 'Duration Test');

      await framework.startTest(durationTest.id);

      const updatedTest = framework.tests.get(durationTest.id);
      expect(updatedTest.scheduledEndAt).toBeDefined();
      expect(updatedTest.scheduledEndAt - updatedTest.startedAt).toBe(7 * 24 * 60 * 60 * 1000);
    });

    test('should not allow starting a test that is not in draft status', async () => {
      await framework.startTest(testId);

      await expect(framework.startTest(testId)).rejects.toThrow('Test must be in draft status to start');
    });

    test('should not allow starting a non-existent test', async () => {
      await expect(framework.startTest('nonexistent')).rejects.toThrow('Test not found');
    });

    test('should validate test configuration before starting', async () => {
      const invalidTest = await framework.createTest({
        name: 'Invalid Test',
        variants: [{ template: 'A' }, { template: 'B' }],
        trafficSplit: [60, 30] // Doesn't sum to 100
      });

      await expect(framework.startTest(invalidTest.id)).rejects.toThrow('Traffic split must sum to 100%');
    });
  });

  describe('User Assignment', () => {
    let testId;

    beforeEach(async () => {
      const test = await framework.createTest({
        name: 'Assignment Test',
        variants: [
          { template: 'Template A' },
          { template: 'Template B' }
        ]
      });
      testId = test.id;
      await framework.startTest(testId);
    });

    test('should assign user to variant consistently', async () => {
      const userId = 'user123';

      const assignment1 = await framework.assignUserToVariant(testId, userId);
      const assignment2 = await framework.assignUserToVariant(testId, userId);

      expect(assignment1).toBeDefined();
      expect(assignment2).toBeDefined();
      expect(assignment1.variantId).toBe(assignment2.variantId);
      expect(assignment1.testId).toBe(testId);
      expect(assignment1.userId).toBe(userId);
      expect(assignment1.assignedAt).toBeDefined();
    });

    test('should update test statistics when assigning users', async () => {
      const test = framework.tests.get(testId);
      const initialParticipants = test.statistics.totalParticipants;

      await framework.assignUserToVariant(testId, 'user1');
      await framework.assignUserToVariant(testId, 'user2');

      const updatedTest = framework.tests.get(testId);
      expect(updatedTest.statistics.totalParticipants).toBe(initialParticipants + 2);
    });

    test('should distribute users across variants based on traffic split', async () => {
      const test = await framework.createTest({
        name: 'Split Test',
        variants: [
          { template: 'A' },
          { template: 'B' }
        ],
        trafficSplit: [80, 20]
      });
      await framework.startTest(test.id);

      const assignments = {};

      // Assign many users to see distribution
      for (let i = 0; i < 100; i++) {
        const assignment = await framework.assignUserToVariant(test.id, `user${i}`);
        if (assignment) {
          assignments[assignment.variantId] = (assignments[assignment.variantId] || 0) + 1;
        }
      }

      // Should roughly follow 80/20 split (allow some variance)
      const variantA = assignments[test.variants[0].id] || 0;
      const variantB = assignments[test.variants[1].id] || 0;
      const total = variantA + variantB;

      expect(variantA / total).toBeCloseTo(0.8, 1);
      expect(variantB / total).toBeCloseTo(0.2, 1);
    });

    test('should return null for inactive tests', async () => {
      const inactiveTest = await framework.createTest({
        name: 'Inactive Test',
        variants: [{ template: 'A' }, { template: 'B' }]
      });

      const assignment = await framework.assignUserToVariant(inactiveTest.id, 'user123');
      expect(assignment).toBeNull();
    });

    test('should handle target audience matching', async () => {
      const test = await framework.createTest({
        name: 'Targeted Test',
        variants: [{ template: 'A' }, { template: 'B' }],
        targetAudience: { industry: 'tech', level: 'senior' }
      });
      await framework.startTest(test.id);

      // Matching context
      const matchingAssignment = await framework.assignUserToVariant(
        test.id,
        'user1',
        { industry: 'tech', level: 'senior' }
      );
      expect(matchingAssignment).toBeDefined();

      // Non-matching context
      const nonMatchingAssignment = await framework.assignUserToVariant(
        test.id,
        'user2',
        { industry: 'finance', level: 'junior' }
      );
      expect(nonMatchingAssignment).toBeNull();
    });
  });

  describe('Conversion Tracking', () => {
    let testId;
    let userId = 'user123';

    beforeEach(async () => {
      const test = await framework.createTest({
        name: 'Conversion Test',
        variants: [
          { template: 'Template A' },
          { template: 'Template B' }
        ]
      });
      testId = test.id;
      await framework.startTest(testId);
      await framework.assignUserToVariant(testId, userId);
    });

    test('should record conversions correctly', async () => {
      const success = await framework.recordConversion(testId, userId, 'acceptance_rate', 1);

      expect(success).toBe(true);
      expect(logAnalytics).toHaveBeenCalledWith({
        type: 'ab_test_conversion',
        testId,
        userId,
        variantId: expect.any(String),
        metric: 'acceptance_rate',
        value: 1
      });
    });

    test('should update variant statistics when recording conversions', async () => {
      const test = framework.tests.get(testId);
      const assignment = framework.assignments.get(`${testId}-${userId}`);
      const variantStats = test.statistics.variantStats[assignment.variantId];

      const initialConversions = variantStats.conversions;

      await framework.recordConversion(testId, userId, 'acceptance_rate', 1);

      const updatedTest = framework.tests.get(testId);
      const updatedStats = updatedTest.statistics.variantStats[assignment.variantId];

      expect(updatedStats.conversions).toBe(initialConversions + 1);
      expect(updatedStats.conversionRate).toBeGreaterThan(0);
    });

    test('should track multiple metrics per user', async () => {
      await framework.recordConversion(testId, userId, 'acceptance_rate', 1);
      await framework.recordConversion(testId, userId, 'response_rate', 1);
      await framework.recordConversion(testId, userId, 'custom_metric', 5);

      const assignment = framework.assignments.get(`${testId}-${userId}`);
      expect(assignment.conversions).toHaveLength(3);
      expect(assignment.metrics.acceptance_rate).toEqual([1]);
      expect(assignment.metrics.response_rate).toEqual([1]);
      expect(assignment.metrics.custom_metric).toEqual([5]);
    });

    test('should return false for invalid conversions', async () => {
      // Non-existent user
      const invalidUser = await framework.recordConversion(testId, 'nonexistent', 'acceptance_rate', 1);
      expect(invalidUser).toBe(false);

      // Non-existent test
      const invalidTest = await framework.recordConversion('nonexistent', userId, 'acceptance_rate', 1);
      expect(invalidTest).toBe(false);
    });
  });

  describe('Statistical Significance Calculation', () => {
    let testId;

    beforeEach(async () => {
      const test = await framework.createTest({
        name: 'Statistics Test',
        variants: [
          { id: 'control', template: 'Control' },
          { id: 'variant', template: 'Variant' }
        ]
      });
      testId = test.id;
      await framework.startTest(testId);
    });

    test('should require minimum sample size for significance testing', async () => {
      // Add only a few participants
      for (let i = 0; i < 5; i++) {
        await framework.assignUserToVariant(testId, `user${i}`);
        await framework.recordConversion(testId, `user${i}`, 'acceptance_rate', i % 2);
      }

      const test = framework.tests.get(testId);
      const result = await framework.calculateStatisticalSignificance(test);

      expect(result.statisticallySignificant).toBe(false);
      expect(result.message).toContain('Insufficient sample size');
    });

    test('should calculate statistical significance for adequate sample size', async () => {
      const test = framework.tests.get(testId);

      // Add adequate sample size with different conversion rates
      // Control: 30% conversion (15/50)
      for (let i = 0; i < 50; i++) {
        await framework.assignUserToVariant(testId, `control_user${i}`);
        if (i < 15) {
          await framework.recordConversion(testId, `control_user${i}`, 'acceptance_rate', 1);
        }
      }

      // Variant: 50% conversion (25/50)
      for (let i = 0; i < 50; i++) {
        await framework.assignUserToVariant(testId, `variant_user${i}`);
        if (i < 25) {
          await framework.recordConversion(testId, `variant_user${i}`, 'acceptance_rate', 1);
        }
      }

      const result = await framework.calculateStatisticalSignificance(test);

      expect(result.pValue).toBeDefined();
      expect(result.zScore).toBeDefined();
      expect(result.confidenceInterval).toBeDefined();
      expect(result.effect.absolute).toBeCloseTo(0.2, 1); // 50% - 30% = 20% difference
      expect(result.sampleSizes.variantA).toBe(50);
      expect(result.sampleSizes.variantB).toBe(50);
    });

    test('should handle edge case of zero conversions', async () => {
      const test = framework.tests.get(testId);

      // Add participants but no conversions
      for (let i = 0; i < 60; i++) {
        await framework.assignUserToVariant(testId, `user${i}`);
        // No conversions recorded
      }

      const result = await framework.calculateStatisticalSignificance(test);

      expect(result.pValue).toBeDefined();
      expect(result.effect.absolute).toBe(0);
      expect(result.conversionRates.variantA).toBe(0);
      expect(result.conversionRates.variantB).toBe(0);
    });

    test('should only work with 2-variant tests', async () => {
      const multiVariantTest = await framework.createTest({
        name: 'Multi-variant Test',
        variants: [
          { template: 'A' },
          { template: 'B' },
          { template: 'C' }
        ]
      });

      const result = await framework.calculateStatisticalSignificance(multiVariantTest);

      expect(result.statisticallySignificant).toBe(false);
      expect(result.error).toContain('only 2-variant tests');
    });
  });

  describe('Test Completion', () => {
    let testId;

    beforeEach(async () => {
      const test = await framework.createTest({
        name: 'Completion Test',
        variants: [
          { template: 'Template A' },
          { template: 'Template B' }
        ]
      });
      testId = test.id;
      await framework.startTest(testId);
    });

    test('should stop test and calculate final results', async () => {
      // Add some test data
      for (let i = 0; i < 40; i++) {
        await framework.assignUserToVariant(testId, `user${i}`);
        if (i % 3 === 0) {
          await framework.recordConversion(testId, `user${i}`, 'acceptance_rate', 1);
        }
      }

      const completedTest = await framework.stopTest(testId, 'manual');

      expect(completedTest.status).toBe(AB_TEST_STATUS.COMPLETED);
      expect(completedTest.completedAt).toBeDefined();
      expect(completedTest.results).toBeDefined();
      expect(completedTest.results.reason).toBe('manual');
      expect(completedTest.results.duration).toBeGreaterThan(0);
      expect(completedTest.results.statisticalAnalysis).toBeDefined();
      expect(completedTest.results.recommendations).toBeDefined();
    });

    test('should determine winner correctly', async () => {
      const test = framework.tests.get(testId);

      // Manually set different conversion rates
      test.statistics.variantStats[test.variants[0].id] = {
        participants: 50,
        conversions: 10,
        conversionRate: 20
      };

      test.statistics.variantStats[test.variants[1].id] = {
        participants: 50,
        conversions: 20,
        conversionRate: 40
      };

      const winner = framework.determineWinner(test);
      expect(winner).toBe(test.variants[1]);
    });

    test('should generate appropriate recommendations', async () => {
      const test = framework.tests.get(testId);
      const statisticalAnalysis = {
        statisticallySignificant: true,
        pValue: 0.02
      };

      const recommendations = framework.generateRecommendations(test, statisticalAnalysis);

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].type).toBe('implementation');
      expect(recommendations[0].priority).toBe('high');
    });

    test('should not allow stopping inactive tests', async () => {
      await framework.stopTest(testId);

      await expect(framework.stopTest(testId)).rejects.toThrow('Test is not active');
    });
  });

  describe('Auto-stop Conditions', () => {
    test('should auto-stop when duration is reached', async () => {
      const test = await framework.createTest({
        name: 'Duration Test',
        variants: [{ template: 'A' }, { template: 'B' }],
        duration: 0.001 // Very short duration for testing
      });

      await framework.startTest(test.id);

      // Simulate time passing
      const updatedTest = framework.tests.get(test.id);
      updatedTest.scheduledEndAt = Date.now() - 1000; // Past end time

      await framework.checkAutoStop(updatedTest);

      const finalTest = framework.tests.get(test.id);
      expect(finalTest.status).toBe(AB_TEST_STATUS.COMPLETED);
      expect(finalTest.results.reason).toBe('duration_reached');
    });

    test('should auto-stop when sample size is reached', async () => {
      const test = await framework.createTest({
        name: 'Sample Size Test',
        variants: [{ template: 'A' }, { template: 'B' }],
        sampleSize: 5
      });

      await framework.startTest(test.id);

      // Add users to reach sample size
      for (let i = 0; i < 5; i++) {
        await framework.assignUserToVariant(test.id, `user${i}`);
      }

      await framework.checkAutoStop(framework.tests.get(test.id));

      const finalTest = framework.tests.get(test.id);
      expect(finalTest.status).toBe(AB_TEST_STATUS.COMPLETED);
      expect(finalTest.results.reason).toBe('sample_size_reached');
    });
  });

  describe('Active Test Management', () => {
    test('should get active test for user', async () => {
      const test = await framework.createTest({
        name: 'Active Test',
        variants: [{ template: 'A' }, { template: 'B' }]
      });
      await framework.startTest(test.id);

      const result = await framework.getActiveTestForUser('user123');

      expect(result).toBeDefined();
      expect(result.test.id).toBe(test.id);
      expect(result.assignment).toBeDefined();
      expect(result.variant).toBeDefined();
    });

    test('should return null when no active tests match', async () => {
      const result = await framework.getActiveTestForUser('user123');
      expect(result).toBeNull();
    });

    test('should return existing assignment for already assigned user', async () => {
      const test = await framework.createTest({
        name: 'Existing Assignment Test',
        variants: [{ template: 'A' }, { template: 'B' }]
      });
      await framework.startTest(test.id);

      const firstResult = await framework.getActiveTestForUser('user123');
      const secondResult = await framework.getActiveTestForUser('user123');

      expect(firstResult.assignment.variantId).toBe(secondResult.assignment.variantId);
      expect(firstResult.assignment.assignedAt).toBe(secondResult.assignment.assignedAt);
    });
  });

  describe('Utility Functions', () => {
    test('should hash user IDs consistently', () => {
      const hash1 = framework.hashUserId('user123');
      const hash2 = framework.hashUserId('user123');
      const hash3 = framework.hashUserId('user456');

      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hash3);
      expect(typeof hash1).toBe('number');
      expect(hash1).toBeGreaterThanOrEqual(0);
    });

    test('should calculate normal CDF approximation', () => {
      const result = framework.normalCDF(0);
      expect(result).toBeCloseTo(0.5, 2);

      const positive = framework.normalCDF(1.96);
      expect(positive).toBeCloseTo(0.975, 2);

      const negative = framework.normalCDF(-1.96);
      expect(negative).toBeCloseTo(0.025, 2);
    });

    test('should get correct Z-critical values', () => {
      expect(framework.getZCritical(0.95)).toBeCloseTo(1.960, 3);
      expect(framework.getZCritical(0.99)).toBeCloseTo(2.576, 3);
      expect(framework.getZCritical(0.90)).toBeCloseTo(1.645, 3);
    });
  });
});

describe('Factory Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getStorageData.mockResolvedValue({});
  });

  test('should create A/B testing framework instance', () => {
    const framework = createABTestingFramework();
    expect(framework).toBeInstanceOf(ABTestingFramework);
  });

  test('should create simple A/B test', async () => {
    const templates = [
      { name: 'Control', content: 'Hi {{name}}' },
      { name: 'Variant', content: 'Hello {{name}}' }
    ];

    const test = await createSimpleABTest('Simple Test', templates, {
      description: 'Testing simple templates'
    });

    expect(test.name).toBe('Simple Test');
    expect(test.description).toBe('Testing simple templates');
    expect(test.variants).toHaveLength(2);
    expect(test.variants[0].name).toBe('Control');
    expect(test.variants[1].name).toBe('Variant');
    expect(test.variants[0].isControl).toBe(true);
    expect(test.variants[1].isControl).toBe(false);
  });
});

describe('Constants and Enums', () => {
  test('should export correct test status constants', () => {
    expect(AB_TEST_STATUS.DRAFT).toBe('draft');
    expect(AB_TEST_STATUS.ACTIVE).toBe('active');
    expect(AB_TEST_STATUS.PAUSED).toBe('paused');
    expect(AB_TEST_STATUS.COMPLETED).toBe('completed');
    expect(AB_TEST_STATUS.CANCELLED).toBe('cancelled');
  });

  test('should export correct significance level constants', () => {
    expect(SIGNIFICANCE_LEVELS.LOW).toBe(0.80);
    expect(SIGNIFICANCE_LEVELS.MEDIUM).toBe(0.90);
    expect(SIGNIFICANCE_LEVELS.HIGH).toBe(0.95);
    expect(SIGNIFICANCE_LEVELS.VERY_HIGH).toBe(0.99);
  });
});