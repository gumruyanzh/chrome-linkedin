// A/B Testing Framework for Message Template Optimization

import { getStorageData, setStorageData, STORAGE_KEYS } from './storage.js';
import { logAnalytics } from './storage.js';

/**
 * A/B Test status types
 */
export const AB_TEST_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

/**
 * Statistical significance levels
 */
export const SIGNIFICANCE_LEVELS = {
  LOW: 0.80,      // 80%
  MEDIUM: 0.90,   // 90%
  HIGH: 0.95,     // 95%
  VERY_HIGH: 0.99 // 99%
};

/**
 * A/B Testing Framework for LinkedIn message templates
 */
export class ABTestingFramework {
  constructor() {
    this.tests = new Map();
    this.assignments = new Map();
    this.init();
  }

  async init() {
    try {
      await this.loadExistingTests();
    } catch (error) {
      console.error('Error initializing A/B testing framework:', error);
    }
  }

  /**
   * Create a new A/B test
   * @param {Object} testConfig - Test configuration
   * @returns {Promise<Object>} Created test object
   */
  async createTest(testConfig) {
    try {
      const test = {
        id: this.generateTestId(),
        name: testConfig.name,
        description: testConfig.description || '',
        hypothesis: testConfig.hypothesis || '',
        variants: this.validateVariants(testConfig.variants),
        trafficSplit: testConfig.trafficSplit || this.getEqualSplit(testConfig.variants.length),
        metrics: testConfig.metrics || ['acceptance_rate', 'response_rate'],
        targetAudience: testConfig.targetAudience || {},
        sampleSize: testConfig.sampleSize || null,
        duration: testConfig.duration || null, // Duration in days
        significanceLevel: testConfig.significanceLevel || SIGNIFICANCE_LEVELS.HIGH,
        status: AB_TEST_STATUS.DRAFT,
        createdAt: Date.now(),
        startedAt: null,
        completedAt: null,
        results: null,
        statistics: {
          totalParticipants: 0,
          variantStats: {},
          pValue: null,
          confidenceInterval: null,
          statisticallySignificant: false
        }
      };

      // Initialize variant statistics
      test.variants.forEach(variant => {
        test.statistics.variantStats[variant.id] = {
          participants: 0,
          conversions: 0,
          conversionRate: 0,
          totalMetrics: {},
          averageMetrics: {}
        };
      });

      await this.saveTest(test);
      this.tests.set(test.id, test);

      await logAnalytics({
        type: 'ab_test_created',
        testId: test.id,
        testName: test.name,
        variantCount: test.variants.length
      });

      return test;

    } catch (error) {
      // Re-throw validation errors directly for tests
      if (error.message.includes('variants') || error.message.includes('Test must have')) {
        throw error;
      }
      console.error('Error creating A/B test:', error);
      throw new Error(`Failed to create A/B test: ${error.message}`);
    }
  }

  /**
   * Start an A/B test
   * @param {string} testId - Test ID
   * @returns {Promise<Object>} Started test object
   */
  async startTest(testId) {
    try {
      const test = this.tests.get(testId);
      if (!test) {
        throw new Error('Test not found');
      }

      if (test.status !== AB_TEST_STATUS.DRAFT) {
        throw new Error('Test must be in draft status to start');
      }

      // Validate test configuration
      this.validateTestForStart(test);

      // Update test status
      test.status = AB_TEST_STATUS.ACTIVE;
      test.startedAt = Date.now();

      // Set completion date if duration is specified
      if (test.duration) {
        test.scheduledEndAt = test.startedAt + (test.duration * 24 * 60 * 60 * 1000);
      }

      await this.saveTest(test);

      await logAnalytics({
        type: 'ab_test_started',
        testId: test.id,
        testName: test.name,
        startedAt: test.startedAt
      });

      return test;

    } catch (error) {
      // Re-throw validation errors directly for tests
      if (error.message.includes('not found') || error.message.includes('status')) {
        throw error;
      }
      console.error('Error starting A/B test:', error);
      throw new Error(`Failed to start A/B test: ${error.message}`);
    }
  }

  /**
   * Assign a user to a variant in an A/B test
   * @param {string} testId - Test ID
   * @param {string} userId - User ID (profile ID)
   * @param {Object} context - Assignment context
   * @returns {Promise<Object>} Assignment result
   */
  async assignUserToVariant(testId, userId, context = {}) {
    try {
      const test = this.tests.get(testId);
      if (!test || test.status !== AB_TEST_STATUS.ACTIVE) {
        return null;
      }

      // Check if user is already assigned
      const existingAssignment = this.assignments.get(`${testId}-${userId}`);
      if (existingAssignment) {
        return existingAssignment;
      }

      // Check if user matches target audience
      if (!this.matchesTargetAudience(context, test.targetAudience)) {
        return null;
      }

      // Assign to variant based on traffic split
      const variant = this.selectVariant(test, userId);

      const assignment = {
        testId,
        userId,
        variantId: variant.id,
        variantName: variant.name,
        assignedAt: Date.now(),
        context,
        conversions: [],
        metrics: {}
      };

      // Store assignment
      this.assignments.set(`${testId}-${userId}`, assignment);
      await this.saveAssignment(assignment);

      // Update test statistics
      test.statistics.totalParticipants++;
      test.statistics.variantStats[variant.id].participants++;
      await this.saveTest(test);

      await logAnalytics({
        type: 'ab_test_assignment',
        testId,
        userId,
        variantId: variant.id,
        variantName: variant.name
      });

      return assignment;

    } catch (error) {
      console.error('Error assigning user to variant:', error);
      return null;
    }
  }

  /**
   * Record a conversion for a user in an A/B test
   * @param {string} testId - Test ID
   * @param {string} userId - User ID
   * @param {string} metric - Metric name
   * @param {number} value - Metric value
   * @param {Object} context - Conversion context
   * @returns {Promise<boolean>} Success status
   */
  async recordConversion(testId, userId, metric, value = 1, context = {}) {
    try {
      const assignmentKey = `${testId}-${userId}`;
      const assignment = this.assignments.get(assignmentKey);

      if (!assignment) {
        return false;
      }

      const test = this.tests.get(testId);
      if (!test || test.status !== AB_TEST_STATUS.ACTIVE) {
        return false;
      }

      // Record conversion
      const conversion = {
        metric,
        value,
        timestamp: Date.now(),
        context
      };

      assignment.conversions.push(conversion);

      // Update assignment metrics
      if (!assignment.metrics[metric]) {
        assignment.metrics[metric] = [];
      }
      assignment.metrics[metric].push(value);

      await this.saveAssignment(assignment);

      // Update test statistics
      const variantStats = test.statistics.variantStats[assignment.variantId];

      if (metric === 'acceptance_rate' || metric === 'response_rate') {
        if (value > 0) {
          variantStats.conversions++;
        }
      }

      if (!variantStats.totalMetrics[metric]) {
        variantStats.totalMetrics[metric] = 0;
        variantStats.averageMetrics[metric] = 0;
      }

      variantStats.totalMetrics[metric] += value;
      variantStats.averageMetrics[metric] =
        variantStats.totalMetrics[metric] / variantStats.participants;

      if (variantStats.participants > 0) {
        variantStats.conversionRate = (variantStats.conversions / variantStats.participants) * 100;
      }

      await this.saveTest(test);

      await logAnalytics({
        type: 'ab_test_conversion',
        testId,
        userId,
        variantId: assignment.variantId,
        metric,
        value
      });

      // Check if test should be automatically stopped
      await this.checkAutoStop(test);

      return true;

    } catch (error) {
      console.error('Error recording conversion:', error);
      return false;
    }
  }

  /**
   * Calculate statistical significance of test results
   * @param {Object} test - Test object
   * @returns {Promise<Object>} Statistical analysis results
   */
  async calculateStatisticalSignificance(test) {
    try {
      if (test.variants.length !== 2) {
        throw new Error('Statistical significance calculation currently supports only 2-variant tests');
      }

      const [variantA, variantB] = test.variants;
      const statsA = test.statistics.variantStats[variantA.id];
      const statsB = test.statistics.variantStats[variantB.id];

      // Need minimum sample size for statistical significance
      const minSampleSize = 30;
      if (statsA.participants < minSampleSize || statsB.participants < minSampleSize) {
        return {
          statisticallySignificant: false,
          pValue: null,
          confidenceInterval: null,
          message: `Insufficient sample size. Need at least ${minSampleSize} participants per variant.`
        };
      }

      // Calculate Z-test for two proportions
      const pA = statsA.conversions / statsA.participants;
      const pB = statsB.conversions / statsB.participants;

      const nA = statsA.participants;
      const nB = statsB.participants;

      // Pooled proportion
      const pPooled = (statsA.conversions + statsB.conversions) / (nA + nB);

      // Standard error
      const se = Math.sqrt(pPooled * (1 - pPooled) * (1/nA + 1/nB));

      // Z-score
      const zScore = (pA - pB) / se;

      // Two-tailed p-value
      const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));

      // Confidence interval
      const seCI = Math.sqrt((pA * (1 - pA) / nA) + (pB * (1 - pB) / nB));
      const zCritical = this.getZCritical(test.significanceLevel);
      const diff = pA - pB;
      const margin = zCritical * seCI;

      const confidenceInterval = {
        lower: diff - margin,
        upper: diff + margin,
        level: test.significanceLevel
      };

      const statisticallySignificant = pValue < (1 - test.significanceLevel);

      // Calculate effect size with variant B as the treatment vs variant A as control
      const effectSize = pB - pA; // Variant B - Variant A (control)

      const result = {
        statisticallySignificant,
        pValue,
        zScore,
        confidenceInterval,
        effect: {
          absolute: effectSize, // Use variant B - variant A for positive effect
          relative: pA > 0 ? ((pB - pA) / pA) * 100 : 0
        },
        sampleSizes: { variantA: nA, variantB: nB },
        conversionRates: { variantA: pA, variantB: pB }
      };

      // Update test statistics
      test.statistics.pValue = pValue;
      test.statistics.confidenceInterval = confidenceInterval;
      test.statistics.statisticallySignificant = statisticallySignificant;

      return result;

    } catch (error) {
      console.error('Error calculating statistical significance:', error);
      return {
        statisticallySignificant: false,
        pValue: null,
        zScore: null,
        confidenceInterval: null,
        effect: {
          absolute: 0,
          relative: 0
        },
        sampleSizes: { variantA: 0, variantB: 0 },
        conversionRates: { variantA: 0, variantB: 0 },
        error: error.message
      };
    }
  }

  /**
   * Stop an A/B test
   * @param {string} testId - Test ID
   * @param {string} reason - Reason for stopping
   * @returns {Promise<Object>} Stopped test with results
   */
  async stopTest(testId, reason = 'manual') {
    try {
      const test = this.tests.get(testId);
      if (!test) {
        throw new Error('Test not found');
      }

      if (test.status !== AB_TEST_STATUS.ACTIVE) {
        throw new Error('Test is not active');
      }

      // Calculate final results
      const statisticalAnalysis = await this.calculateStatisticalSignificance(test);

      const results = {
        completedAt: Date.now(),
        duration: Date.now() - test.startedAt,
        reason,
        winnerVariant: this.determineWinner(test),
        statisticalAnalysis,
        recommendations: this.generateRecommendations(test, statisticalAnalysis)
      };

      test.status = AB_TEST_STATUS.COMPLETED;
      test.completedAt = Date.now();
      test.results = results;

      await this.saveTest(test);

      await logAnalytics({
        type: 'ab_test_completed',
        testId: test.id,
        testName: test.name,
        reason,
        duration: results.duration,
        winner: results.winnerVariant?.id || null,
        significantResult: statisticalAnalysis.statisticallySignificant
      });

      return test;

    } catch (error) {
      console.error('Error stopping A/B test:', error);
      throw new Error(`Failed to stop A/B test: ${error.message}`);
    }
  }

  /**
   * Get active test for a user and context
   * @param {string} userId - User ID
   * @param {Object} context - Context for test matching
   * @returns {Promise<Object|null>} Active test assignment or null
   */
  async getActiveTestForUser(userId, context = {}) {
    try {
      // Find active tests that match the context
      const activeTests = Array.from(this.tests.values()).filter(test =>
        test.status === AB_TEST_STATUS.ACTIVE &&
        this.matchesTargetAudience(context, test.targetAudience)
      );

      // Return the first matching test assignment
      for (const test of activeTests) {
        const assignment = this.assignments.get(`${test.id}-${userId}`);
        if (assignment) {
          return {
            test,
            assignment,
            variant: test.variants.find(v => v.id === assignment.variantId)
          };
        }
      }

      // Try to assign to a new test
      for (const test of activeTests) {
        const assignment = await this.assignUserToVariant(test.id, userId, context);
        if (assignment) {
          return {
            test,
            assignment,
            variant: test.variants.find(v => v.id === assignment.variantId)
          };
        }
      }

      return null;

    } catch (error) {
      console.error('Error getting active test for user:', error);
      return null;
    }
  }

  /**
   * Get test results and statistics
   * @param {string} testId - Test ID
   * @returns {Promise<Object>} Test results and statistics
   */
  async getTestResults(testId) {
    try {
      const test = this.tests.get(testId);
      if (!test) {
        throw new Error('Test not found');
      }

      const statisticalAnalysis = test.status === AB_TEST_STATUS.COMPLETED ?
        test.results.statisticalAnalysis :
        await this.calculateStatisticalSignificance(test);

      return {
        test,
        statistics: test.statistics,
        statisticalAnalysis,
        isComplete: test.status === AB_TEST_STATUS.COMPLETED,
        recommendations: test.results?.recommendations || this.generateRecommendations(test, statisticalAnalysis)
      };

    } catch (error) {
      console.error('Error getting test results:', error);
      throw new Error(`Failed to get test results: ${error.message}`);
    }
  }

  /**
   * Helper methods
   */

  generateTestId() {
    return `abtest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  validateVariants(variants) {
    if (!Array.isArray(variants) || variants.length < 2) {
      throw new Error('Test must have at least 2 variants');
    }

    return variants.map((variant, index) => ({
      id: variant.id || `variant_${index + 1}`,
      name: variant.name || `Variant ${String.fromCharCode(65 + index)}`,
      template: variant.template,
      description: variant.description || '',
      isControl: variant.isControl || index === 0
    }));
  }

  getEqualSplit(variantCount) {
    const splitPercentage = 100 / variantCount;
    return Array.from({ length: variantCount }, () => splitPercentage);
  }

  validateTestForStart(test) {
    if (!test.variants || test.variants.length < 2) {
      throw new Error('Test must have at least 2 variants');
    }

    if (!test.trafficSplit || test.trafficSplit.length !== test.variants.length) {
      throw new Error('Traffic split must match number of variants');
    }

    const totalSplit = test.trafficSplit.reduce((sum, split) => sum + split, 0);
    if (Math.abs(totalSplit - 100) > 0.01) {
      throw new Error('Traffic split must sum to 100%');
    }
  }

  matchesTargetAudience(context, targetAudience) {
    if (!targetAudience || Object.keys(targetAudience).length === 0) {
      return true;
    }

    // Implement target audience matching logic
    for (const [key, value] of Object.entries(targetAudience)) {
      if (context[key] !== value) {
        return false;
      }
    }

    return true;
  }

  selectVariant(test, userId) {
    // Use hash-based assignment for consistent variant selection
    const hash = this.hashUserId(userId + test.id);
    const hashValue = hash % 100;

    let cumulativeSplit = 0;
    for (let i = 0; i < test.variants.length; i++) {
      cumulativeSplit += test.trafficSplit[i];
      if (hashValue < cumulativeSplit) {
        return test.variants[i];
      }
    }

    // Fallback to first variant
    return test.variants[0];
  }

  hashUserId(userId) {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  async checkAutoStop(test) {
    try {
      // Check duration-based stopping
      if (test.scheduledEndAt && Date.now() >= test.scheduledEndAt) {
        await this.stopTest(test.id, 'duration_reached');
        return;
      }

      // Check sample size-based stopping
      if (test.sampleSize && test.statistics.totalParticipants >= test.sampleSize) {
        await this.stopTest(test.id, 'sample_size_reached');
        return;
      }

      // Check for early statistical significance
      const statisticalAnalysis = await this.calculateStatisticalSignificance(test);
      if (statisticalAnalysis.statisticallySignificant &&
          test.statistics.totalParticipants >= 100) {
        await this.stopTest(test.id, 'statistical_significance_reached');
        return;
      }

    } catch (error) {
      console.error('Error checking auto-stop conditions:', error);
    }
  }

  determineWinner(test) {
    if (test.variants.length !== 2) {
      return null;
    }

    const [variantA, variantB] = test.variants;
    const statsA = test.statistics.variantStats[variantA.id];
    const statsB = test.statistics.variantStats[variantB.id];

    if (statsA.conversionRate > statsB.conversionRate) {
      return variantA;
    } else if (statsB.conversionRate > statsA.conversionRate) {
      return variantB;
    }

    return null; // Tie
  }

  generateRecommendations(test, statisticalAnalysis) {
    const recommendations = [];

    if (statisticalAnalysis.statisticallySignificant) {
      const winner = this.determineWinner(test);
      if (winner) {
        recommendations.push({
          type: 'implementation',
          title: 'Implement Winning Variant',
          description: `Variant "${winner.name}" shows statistically significant improvement. Consider implementing this as your default template.`,
          priority: 'high'
        });
      }
    } else {
      recommendations.push({
        type: 'continue',
        title: 'Continue Testing',
        description: 'Results are not yet statistically significant. Consider running the test longer or increasing sample size.',
        priority: 'medium'
      });
    }

    // Check for low conversion rates only if not statistically significant
    if (!statisticalAnalysis.statisticallySignificant) {
      const avgConversionRate = Object.values(test.statistics.variantStats)
        .reduce((sum, stats) => sum + stats.conversionRate, 0) / test.variants.length;

      if (avgConversionRate < 10) {
        recommendations.push({
          type: 'optimization',
          title: 'Low Overall Performance',
          description: 'All variants show low conversion rates. Consider testing more different approaches.',
          priority: 'high'
        });
      }
    }

    return recommendations;
  }

  normalCDF(x) {
    // Approximation of the cumulative distribution function of the standard normal distribution
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  erf(x) {
    // Approximation of the error function
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  getZCritical(significanceLevel) {
    // Z-critical values for common significance levels
    const zValues = {
      0.80: 1.282,
      0.90: 1.645,
      0.95: 1.960,
      0.99: 2.576
    };

    return zValues[significanceLevel] || 1.960;
  }

  async saveTest(test) {
    try {
      const result = await getStorageData(STORAGE_KEYS.AB_TESTS);
      const tests = result.ab_tests || {};
      tests[test.id] = test;
      await setStorageData({ [STORAGE_KEYS.AB_TESTS]: tests });
    } catch (error) {
      console.error('Error saving test:', error);
    }
  }

  async saveAssignment(assignment) {
    try {
      const result = await getStorageData(STORAGE_KEYS.AB_ASSIGNMENTS);
      const assignments = result.ab_assignments || {};
      assignments[`${assignment.testId}-${assignment.userId}`] = assignment;
      await setStorageData({ [STORAGE_KEYS.AB_ASSIGNMENTS]: assignments });
    } catch (error) {
      console.error('Error saving assignment:', error);
    }
  }

  async loadExistingTests() {
    try {
      const testsResult = await getStorageData(STORAGE_KEYS.AB_TESTS);
      const tests = testsResult.ab_tests || {};

      const assignmentsResult = await getStorageData(STORAGE_KEYS.AB_ASSIGNMENTS);
      const assignments = assignmentsResult.ab_assignments || {};

      // Load tests
      Object.values(tests).forEach(test => {
        this.tests.set(test.id, test);
      });

      // Load assignments
      Object.entries(assignments).forEach(([key, assignment]) => {
        this.assignments.set(key, assignment);
      });

    } catch (error) {
      console.error('Error loading existing tests:', error);
    }
  }
}

/**
 * Create A/B testing framework instance
 * @returns {ABTestingFramework} A/B testing framework instance
 */
export function createABTestingFramework() {
  return new ABTestingFramework();
}

/**
 * Helper function to create a simple A/B test
 * @param {string} name - Test name
 * @param {Array} templates - Array of template objects
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Created test
 */
export async function createSimpleABTest(name, templates, options = {}) {
  const framework = createABTestingFramework();

  const variants = templates.map((template, index) => ({
    id: `variant_${index + 1}`,
    name: template.name || `Variant ${String.fromCharCode(65 + index)}`,
    template: template,
    isControl: index === 0
  }));

  return await framework.createTest({
    name,
    variants,
    ...options
  });
}