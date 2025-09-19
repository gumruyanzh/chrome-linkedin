// Enhanced A/B Testing Framework - Task 6.5
// Statistical Significance, Multiple Variants, Real-time Monitoring, Sample Size Calculation

import { getStorageData, setStorageData, STORAGE_KEYS } from './storage.js';
import { trackEvent, trackPerformanceMetric } from './real-time-analytics.js';
import { reportError } from './error-reporting.js';
import { ABTestingFramework, AB_TEST_STATUS, SIGNIFICANCE_LEVELS } from './ab-testing-framework.js';

/**
 * Test types for enhanced framework
 */
export const ENHANCED_TEST_TYPES = {
  TWO_VARIANT: 'two_variant',
  MULTI_VARIANT: 'multi_variant',
  SEQUENTIAL: 'sequential',
  BAYESIAN: 'bayesian'
};

/**
 * Analysis methods
 */
export const ANALYSIS_METHODS = {
  FREQUENTIST: 'frequentist',
  BAYESIAN: 'bayesian',
  SEQUENTIAL: 'sequential',
  MVEF: 'mvef' // Minimum Viable Effect Framework
};

/**
 * Early stopping reasons
 */
export const EARLY_STOPPING_REASONS = {
  SUPERIORITY: 'superiority_boundary_crossed',
  FUTILITY: 'futility_boundary_crossed',
  DURATION: 'maximum_duration_reached',
  SAMPLE_SIZE: 'maximum_sample_size_reached'
};

/**
 * Enhanced A/B Testing Framework with advanced statistical methods
 */
export class EnhancedABTestingFramework extends ABTestingFramework {
  constructor() {
    super();
    this.monitoringIntervals = new Map();
    this.realTimeCallbacks = new Map();
    this.alphaSpendingFunctions = {
      obrien_fleming: this.obrienFlemingBoundary.bind(this),
      pocock: this.pocockBoundary.bind(this),
      haybittle_peto: this.haybittlePetoBoundary.bind(this)
    };
  }

  /**
   * Create a multi-variant test (A/B/C/D...)
   * @param {Object} testConfig - Enhanced test configuration
   * @returns {Promise<Object>} Created test object
   */
  async createMultiVariantTest(testConfig) {
    try {
      const startTime = Date.now();

      // Validate multi-variant specific configuration
      this.validateMultiVariantConfig(testConfig);

      // Enhanced test object
      const test = {
        ...(await this.createTest(testConfig)),
        testType: ENHANCED_TEST_TYPES.MULTI_VARIANT,
        analysisMethod: testConfig.analysisMethod || ANALYSIS_METHODS.FREQUENTIST,
        minimumViableEffectSize: testConfig.minimumViableEffectSize || null,
        earlyStoppingRules: testConfig.earlyStoppingRules || {},
        monitoringInterval: testConfig.monitoringInterval || 3600000, // 1 hour default
        powerAnalysis: null,
        interimAnalyses: [],
        realTimeMetrics: {
          enabled: testConfig.realTimeMonitoring !== false,
          lastUpdate: null,
          checkInterval: testConfig.monitoringInterval || 3600000
        }
      };

      // Calculate sample size if parameters provided
      if (testConfig.baselineConversionRate && testConfig.minimumDetectableEffect) {
        test.powerAnalysis = await this.calculateSampleSize({
          baselineConversionRate: testConfig.baselineConversionRate,
          minimumDetectableEffect: testConfig.minimumDetectableEffect,
          significanceLevel: testConfig.significanceLevel || 0.05,
          statisticalPower: testConfig.statisticalPower || 0.8,
          variants: testConfig.variants.length
        });
      }

      await this.saveEnhancedTest(test);

      await trackEvent({
        type: 'ab_test_created',
        testId: test.id,
        testType: ENHANCED_TEST_TYPES.MULTI_VARIANT,
        variantCount: test.variants.length,
        analysisMethod: test.analysisMethod
      });

      await trackPerformanceMetric({
        metric: 'test_creation_time',
        duration: Date.now() - startTime,
        variantCount: test.variants.length
      });

      return test;
    } catch (error) {
      await reportError({
        message: `Failed to create multi-variant test: ${error.message}`,
        source: 'enhanced_ab_testing_framework',
        context: { testConfig }
      });
      throw error;
    }
  }

  /**
   * Calculate required sample size for desired statistical power
   * @param {Object} params - Power analysis parameters
   * @returns {Promise<Object>} Sample size calculation results
   */
  async calculateSampleSize(params) {
    try {
      const startTime = Date.now();

      // Validate parameters
      this.validatePowerAnalysisParams(params);

      const {
        baselineConversionRate,
        minimumDetectableEffect,
        significanceLevel,
        statisticalPower,
        variants,
        expectedTrafficPerDay
      } = params;

      // For multi-variant tests, adjust significance level (Bonferroni correction)
      const adjustedAlpha =
        variants > 2 ? significanceLevel / ((variants * (variants - 1)) / 2) : significanceLevel;

      // Calculate effect size (Cohen's h for proportions)
      const p1 = baselineConversionRate;
      const p2 = baselineConversionRate + minimumDetectableEffect;
      const effectSize = 2 * (Math.asin(Math.sqrt(p2)) - Math.asin(Math.sqrt(p1)));

      // Z-values for two-tailed test
      const zAlpha = this.getZCritical(1 - adjustedAlpha / 2);
      const zBeta = this.getZCritical(statisticalPower);

      // Sample size calculation for two proportions
      const sampleSizePerVariant = Math.ceil(
        (2 * Math.pow(zAlpha + zBeta, 2)) / Math.pow(effectSize, 2)
      );

      const totalSampleSize = sampleSizePerVariant * variants;

      // Calculate expected duration
      let expectedDuration = null;
      let trafficAnalysis = null;

      if (expectedTrafficPerDay) {
        const trafficPerVariantPerDay = expectedTrafficPerDay / variants;
        const daysToReachSampleSize = Math.ceil(sampleSizePerVariant / trafficPerVariantPerDay);

        expectedDuration = daysToReachSampleSize;
        trafficAnalysis = {
          expectedTrafficPerDay,
          trafficPerVariantPerDay,
          daysToReachSampleSize
        };
      }

      const result = {
        sampleSizePerVariant,
        totalSampleSize,
        expectedDuration,
        recommendedDurationDays: expectedDuration,
        trafficAnalysis,
        adjustedSignificanceLevel: adjustedAlpha,
        assumptions: {
          baselineConversionRate,
          minimumDetectableEffect,
          significanceLevel,
          statisticalPower
        },
        method: variants > 2 ? 'ANOVA_with_post_hoc' : 'two_proportion_z_test'
      };

      await trackPerformanceMetric({
        metric: 'sample_size_calculation',
        duration: Date.now() - startTime,
        sampleSize: totalSampleSize
      });

      return result;
    } catch (error) {
      await reportError({
        message: `Sample size calculation failed: ${error.message}`,
        source: 'enhanced_ab_testing_framework',
        context: { params }
      });
      throw error;
    }
  }

  /**
   * Calculate statistical significance for multi-variant tests using ANOVA
   * @param {string} testId - Test ID
   * @returns {Promise<Object>} Statistical analysis results
   */
  async calculateMultiVariantSignificance(testId) {
    try {
      const startTime = Date.now();
      const test = this.tests.get(testId);

      if (!test) {
        throw new Error('Test not found');
      }

      if (test.variants.length < 2) {
        throw new Error('Need at least 2 variants for significance testing');
      }

      // For two variants, use existing z-test
      if (test.variants.length === 2) {
        return await this.calculateStatisticalSignificance(test);
      }

      // For multiple variants, use ANOVA
      const variantData = test.variants.map(variant => {
        const stats = test.statistics.variantStats[variant.id];
        return {
          id: variant.id,
          name: variant.name,
          successes: stats.conversions,
          failures: stats.participants - stats.conversions,
          total: stats.participants,
          rate: stats.participants > 0 ? stats.conversions / stats.participants : 0
        };
      });

      // Check minimum sample size
      const minSampleSize = 30;
      if (variantData.some(v => v.total < minSampleSize)) {
        return {
          method: 'ANOVA',
          statisticallySignificant: false,
          fStatistic: null,
          pValue: null,
          message: `Insufficient sample size. Need at least ${minSampleSize} participants per variant.`
        };
      }

      // Calculate ANOVA F-statistic
      const anovaResult = this.calculateANOVA(variantData);

      // Perform pairwise comparisons if significant
      let variantComparisons = null;
      if (anovaResult.pValue < test.significanceLevel) {
        variantComparisons = await this.performPairwiseComparisons(testId);
      }

      // Find best performing variant
      const bestVariant = variantData.reduce((best, current) =>
        current.rate > best.rate ? current : best
      );

      // Ensure bestVariant ID matches test variant IDs
      const bestVariantId = test.variants.find(v => v.id === bestVariant.id)?.id || bestVariant.id;

      const result = {
        method: 'ANOVA',
        statisticallySignificant: anovaResult.pValue < test.significanceLevel,
        fStatistic: anovaResult.fStatistic,
        pValue: anovaResult.pValue,
        degreesOfFreedom: anovaResult.degreesOfFreedom,
        variantData,
        variantComparisons,
        bestVariant: bestVariantId,
        effect: {
          absolute: bestVariant.rate - Math.min(...variantData.map(v => v.rate)),
          relative: this.calculateRelativeImprovement(variantData)
        }
      };

      // Update test statistics
      test.statistics.pValue = anovaResult.pValue;
      test.statistics.statisticallySignificant = result.statisticallySignificant;
      await this.saveTest(test);

      await trackPerformanceMetric({
        metric: 'statistical_calculation_time',
        duration: Date.now() - startTime,
        testId,
        sampleSize: variantData.reduce((sum, v) => sum + v.total, 0),
        variantCount: test.variants.length
      });

      return result;
    } catch (error) {
      await reportError({
        message: `Multi-variant significance calculation failed: ${error.message}`,
        source: 'enhanced_ab_testing_framework',
        context: { testId }
      });
      throw error;
    }
  }

  /**
   * Perform pairwise comparisons with Bonferroni correction
   * @param {string} testId - Test ID
   * @returns {Promise<Object>} Pairwise comparison results
   */
  async performPairwiseComparisons(testId) {
    const test = this.tests.get(testId);
    const variants = test.variants;
    const comparisons = [];

    // Calculate adjusted significance level (Bonferroni correction)
    const numComparisons = (variants.length * (variants.length - 1)) / 2;
    const adjustedSignificanceLevel = test.significanceLevel / numComparisons;

    // Perform all pairwise comparisons
    for (let i = 0; i < variants.length; i++) {
      for (let j = i + 1; j < variants.length; j++) {
        const variantA = variants[i];
        const variantB = variants[j];
        const statsA = test.statistics.variantStats[variantA.id];
        const statsB = test.statistics.variantStats[variantB.id];

        if (statsA.participants > 0 && statsB.participants > 0) {
          const comparison = this.performZTest(statsA, statsB);
          comparisons.push({
            variant1: variantA.id,
            variant2: variantB.id,
            pValue: comparison.pValue,
            zScore: comparison.zScore,
            effectSize: comparison.effectSize,
            statisticallySignificant: comparison.pValue < adjustedSignificanceLevel,
            confidenceInterval: comparison.confidenceInterval
          });
        }
      }
    }

    return {
      comparisons,
      adjustedSignificanceLevel,
      bonferroniCorrection: true,
      numComparisons
    };
  }

  /**
   * Start real-time monitoring for a test
   * @param {string} testId - Test ID
   * @returns {Promise<Object>} Monitoring configuration
   */
  async startRealTimeMonitoring(testId) {
    try {
      const test = this.tests.get(testId);
      if (!test) {
        throw new Error('Test not found');
      }

      const monitoring = {
        testId,
        isActive: true,
        checkInterval: test.monitoringInterval || 3600000,
        metrics: ['progress', 'significance', 'early_stopping'],
        startedAt: Date.now(),
        lastCheck: Date.now()
      };

      // Start monitoring interval
      const intervalId = setInterval(async () => {
        await this.performMonitoringCheck(testId);
      }, monitoring.checkInterval);

      this.monitoringIntervals.set(testId, intervalId);

      // Update test with monitoring info
      test.realTimeMetrics.enabled = true;
      test.realTimeMetrics.lastUpdate = Date.now();
      await this.saveTest(test);

      await trackEvent({
        type: 'real_time_monitoring_started',
        testId,
        checkInterval: monitoring.checkInterval
      });

      return monitoring;
    } catch (error) {
      await reportError({
        message: `Failed to start real-time monitoring: ${error.message}`,
        source: 'enhanced_ab_testing_framework',
        context: { testId }
      });
      throw error;
    }
  }

  /**
   * Get real-time test progress
   * @param {string} testId - Test ID
   * @returns {Promise<Object>} Progress information
   */
  async getTestProgress(testId) {
    try {
      const test = this.tests.get(testId);
      if (!test) {
        throw new Error('Test not found');
      }

      const totalParticipants = test.statistics.totalParticipants;
      const targetSampleSize = test.sampleSize || test.powerAnalysis?.totalSampleSize;
      const progressPercentage = targetSampleSize
        ? Math.round((totalParticipants / targetSampleSize) * 100)
        : 0;

      // Calculate variant-specific progress
      const variantProgress = {};
      for (const variant of test.variants) {
        const stats = test.statistics.variantStats[variant.id];
        variantProgress[variant.id] = {
          participants: stats.participants,
          conversions: stats.conversions,
          conversionRate: stats.conversionRate,
          targetParticipants: targetSampleSize
            ? Math.ceil(targetSampleSize / test.variants.length)
            : null
        };
      }

      // Estimate time to completion
      let estimatedTimeToCompletion = null;
      if (test.startedAt && targetSampleSize && totalParticipants > 0) {
        const elapsedTime = Date.now() - test.startedAt;
        const participationRate = totalParticipants / elapsedTime; // participants per ms
        const remainingParticipants = targetSampleSize - totalParticipants;
        estimatedTimeToCompletion = remainingParticipants / participationRate;
      }

      // Get current significance if applicable
      let currentSignificance = null;
      if (totalParticipants >= 60) {
        // Minimum for interim analysis
        try {
          currentSignificance = await this.calculateMultiVariantSignificance(testId);
        } catch (error) {
          // Ignore errors in interim significance calculation
        }
      }

      const progress = {
        totalParticipants,
        targetSampleSize,
        progressPercentage,
        variantProgress,
        estimatedTimeToCompletion,
        currentSignificance,
        lastUpdated: Date.now()
      };

      await trackPerformanceMetric({
        metric: 'test_progress_check',
        testId,
        progress: progressPercentage
      });

      return progress;
    } catch (error) {
      await reportError({
        message: `Failed to get test progress: ${error.message}`,
        source: 'enhanced_ab_testing_framework',
        context: { testId }
      });
      throw error;
    }
  }

  /**
   * Check early stopping conditions
   * @param {string} testId - Test ID
   * @returns {Promise<Object>} Early stopping analysis
   */
  async checkEarlyStoppingConditions(testId) {
    try {
      const test = this.tests.get(testId);
      if (!test || !test.earlyStoppingRules) {
        return { shouldStop: false, reason: null };
      }

      const rules = test.earlyStoppingRules;
      const totalParticipants = test.statistics.totalParticipants;

      // Check minimum sample size before any stopping
      if (totalParticipants < (rules.minimumSampleSize || 50)) {
        return { shouldStop: false, reason: 'insufficient_sample_size' };
      }

      // Check maximum duration
      if (rules.maximumDuration && test.startedAt) {
        const maxDurationMs = rules.maximumDuration * 24 * 60 * 60 * 1000;
        if (Date.now() - test.startedAt > maxDurationMs) {
          return {
            shouldStop: true,
            reason: EARLY_STOPPING_REASONS.DURATION,
            recommendedAction: 'stop_test_analyze_results'
          };
        }
      }

      // Calculate current significance
      const significance = await this.calculateMultiVariantSignificance(testId);
      const pValue = significance.pValue;

      // Check superiority boundary
      if (rules.superiorityBoundary && pValue !== null && pValue < rules.superiorityBoundary) {
        await trackEvent({
          type: 'early_stopping_triggered',
          testId,
          reason: EARLY_STOPPING_REASONS.SUPERIORITY,
          sampleSize: totalParticipants
        });

        return {
          shouldStop: true,
          reason: EARLY_STOPPING_REASONS.SUPERIORITY,
          pValue,
          recommendedAction: 'stop_test_declare_winner'
        };
      }

      // Check futility boundary
      if (rules.futilityBoundary && pValue !== null && pValue > rules.futilityBoundary) {
        return {
          shouldStop: true,
          reason: EARLY_STOPPING_REASONS.FUTILITY,
          pValue,
          recommendedAction: 'stop_test_no_difference'
        };
      }

      return { shouldStop: false, reason: null, pValue };
    } catch (error) {
      await reportError({
        message: `Early stopping check failed: ${error.message}`,
        source: 'enhanced_ab_testing_framework',
        context: { testId }
      });
      return { shouldStop: false, reason: 'error_in_analysis' };
    }
  }

  /**
   * Calculate Bayesian analysis for test results
   * @param {string} testId - Test ID
   * @returns {Promise<Object>} Bayesian analysis results
   */
  async calculateBayesianAnalysis(testId) {
    try {
      const test = this.tests.get(testId);
      if (!test) {
        throw new Error('Test not found');
      }

      const variantData = test.variants.map(variant => {
        const stats = test.statistics.variantStats[variant.id];
        return {
          id: variant.id,
          alpha: stats.conversions + 1, // Beta prior parameters
          beta: stats.participants - stats.conversions + 1,
          participants: stats.participants,
          conversions: stats.conversions
        };
      });

      // Calculate posterior distributions and probability of superiority
      const posteriorDistributions = {};
      const bayesianResults = {};

      for (const variant of variantData) {
        posteriorDistributions[variant.id] = {
          alpha: variant.alpha,
          beta: variant.beta,
          mean: variant.alpha / (variant.alpha + variant.beta),
          variance:
            (variant.alpha * variant.beta) /
            (Math.pow(variant.alpha + variant.beta, 2) * (variant.alpha + variant.beta + 1))
        };
      }

      // For two variants, calculate probability B is better than A
      if (test.variants.length === 2) {
        const [variantA, variantB] = variantData;
        const probabilityBIsBetter = this.calculateBetaProbability(variantB, variantA);

        bayesianResults.probabilityBIsBetter = probabilityBIsBetter;
        bayesianResults.credibleInterval = this.calculateCredibleInterval(variantB, 0.95);
        bayesianResults.expectedLoss = this.calculateExpectedLoss(variantA, variantB);
      }

      return {
        posteriorDistributions,
        ...bayesianResults,
        method: 'bayesian',
        priorType: 'beta_uniform'
      };
    } catch (error) {
      await reportError({
        message: `Bayesian analysis failed: ${error.message}`,
        source: 'enhanced_ab_testing_framework',
        context: { testId }
      });
      throw error;
    }
  }

  /**
   * Perform interim analysis for sequential testing
   * @param {string} testId - Test ID
   * @param {number} analysisNumber - Which interim analysis this is
   * @returns {Promise<Object>} Interim analysis results
   */
  async performInterimAnalysis(testId, analysisNumber) {
    try {
      const test = this.tests.get(testId);
      if (!test) {
        throw new Error('Test not found');
      }

      const alphaSpendingFunction = test.alphaSpending || 'obrien_fleming';
      const totalAlpha = test.significanceLevel || 0.05;
      const plannedAnalyses = test.plannedInterimAnalyses || 5;

      // Calculate spent and remaining alpha
      const spentAlpha = this.alphaSpendingFunctions[alphaSpendingFunction](
        analysisNumber,
        plannedAnalyses,
        totalAlpha
      );
      const remainingAlpha = totalAlpha - spentAlpha;

      // Calculate critical value for this analysis
      const criticalValue = this.getZCritical(1 - spentAlpha / 2);

      // Perform current significance test
      const significance = await this.calculateMultiVariantSignificance(testId);

      let recommendation = 'continue';
      if (significance.pValue && significance.pValue < spentAlpha) {
        recommendation = 'stop_efficacy';
      } else if (analysisNumber >= plannedAnalyses) {
        recommendation = 'stop_final_analysis';
      }

      const interimResult = {
        analysisNumber,
        spentAlpha,
        remainingAlpha,
        criticalValue,
        currentPValue: significance.pValue,
        recommendation,
        timestamp: Date.now()
      };

      // Store interim analysis
      test.interimAnalyses.push(interimResult);
      await this.saveTest(test);

      return interimResult;
    } catch (error) {
      await reportError({
        message: `Interim analysis failed: ${error.message}`,
        source: 'enhanced_ab_testing_framework',
        context: { testId, analysisNumber }
      });
      throw error;
    }
  }

  /**
   * Calculate minimum viable effect framework analysis
   * @param {string} testId - Test ID
   * @returns {Promise<Object>} MVEF analysis results
   */
  async calculateMVEFAnalysis(testId) {
    try {
      const test = this.tests.get(testId);
      if (!test || !test.minimumViableEffectSize) {
        throw new Error('Test not found or MVEF not configured');
      }

      const significance = await this.calculateMultiVariantSignificance(testId);
      const observedEffect = significance.effect?.absolute || 0;
      const minimumViableEffect = test.minimumViableEffectSize;

      // Calculate probability that true effect is above MVEF threshold
      const probabilityViableEffect = this.calculateViabilityProbability(
        observedEffect,
        minimumViableEffect,
        test.statistics.totalParticipants
      );

      const isViable =
        observedEffect >= minimumViableEffect && significance.statisticallySignificant;

      let recommendation = 'continue_testing';
      if (isViable) {
        recommendation = 'implement_winning_variant';
      } else if (probabilityViableEffect < 0.1) {
        recommendation = 'continue_testing_or_redesign';
      }

      return {
        observedEffect,
        minimumViableEffect,
        isViable,
        probabilityViableEffect,
        recommendation,
        statisticallySignificant: significance.statisticallySignificant
      };
    } catch (error) {
      await reportError({
        message: `MVEF analysis failed: ${error.message}`,
        source: 'enhanced_ab_testing_framework',
        context: { testId }
      });
      throw error;
    }
  }

  /**
   * Calculate retrospective power analysis
   * @param {string} testId - Test ID
   * @returns {Promise<Object>} Power analysis results
   */
  async calculateRetrospectivePower(testId) {
    try {
      const test = this.tests.get(testId);
      if (!test) {
        throw new Error('Test not found');
      }

      const significance = await this.calculateMultiVariantSignificance(testId);
      const actualSampleSize = test.statistics.totalParticipants;
      const observedEffectSize = significance.effect?.absolute || 0;

      // Calculate achieved power
      const achievedPower = this.calculatePower(
        observedEffectSize,
        actualSampleSize,
        test.significanceLevel || 0.05
      );

      // Calculate minimum detectable effect with current sample size
      const minimumDetectableEffect = this.calculateMinimumDetectableEffect(
        actualSampleSize,
        test.significanceLevel || 0.05,
        0.8
      );

      return {
        actualSampleSize,
        observedEffectSize,
        achievedPower,
        minimumDetectableEffect,
        sensitivityAnalysis: {
          power50: this.calculateMinimumDetectableEffect(actualSampleSize, 0.05, 0.5),
          power80: this.calculateMinimumDetectableEffect(actualSampleSize, 0.05, 0.8),
          power90: this.calculateMinimumDetectableEffect(actualSampleSize, 0.05, 0.9)
        }
      };
    } catch (error) {
      await reportError({
        message: `Retrospective power analysis failed: ${error.message}`,
        source: 'enhanced_ab_testing_framework',
        context: { testId }
      });
      throw error;
    }
  }

  /**
   * Helper methods for statistical calculations
   */

  validateMultiVariantConfig(config) {
    if (!config.variants || config.variants.length < 2) {
      throw new Error('Test must have at least 2 variants');
    }

    if (config.trafficSplit) {
      const total = config.trafficSplit.reduce((sum, split) => sum + split, 0);
      if (Math.abs(total - 100) > 0.01) {
        throw new Error('Traffic split must sum to 100%');
      }
      if (config.trafficSplit.length !== config.variants.length) {
        throw new Error('Traffic split length must match number of variants');
      }
    }
  }

  validatePowerAnalysisParams(params) {
    if (
      typeof params.baselineConversionRate !== 'number' ||
      params.baselineConversionRate < 0 ||
      params.baselineConversionRate > 1
    ) {
      throw new Error('Baseline conversion rate must be between 0 and 1');
    }

    if (typeof params.minimumDetectableEffect !== 'number' || params.minimumDetectableEffect <= 0) {
      throw new Error('Minimum detectable effect must be greater than 0');
    }

    if (
      typeof params.significanceLevel !== 'number' ||
      params.significanceLevel <= 0 ||
      params.significanceLevel >= 1
    ) {
      throw new Error('Significance level must be between 0 and 1');
    }

    if (
      typeof params.statisticalPower !== 'number' ||
      params.statisticalPower <= 0 ||
      params.statisticalPower >= 1
    ) {
      throw new Error('Statistical power must be between 0 and 1');
    }
  }

  calculateANOVA(variantData) {
    const k = variantData.length; // number of groups
    const N = variantData.reduce((sum, v) => sum + v.total, 0); // total sample size

    // Calculate overall mean
    const totalSuccesses = variantData.reduce((sum, v) => sum + v.successes, 0);
    const overallMean = totalSuccesses / N;

    // Calculate sum of squares between groups (SSB)
    const ssb = variantData.reduce((sum, v) => {
      const groupMean = v.rate;
      return sum + v.total * Math.pow(groupMean - overallMean, 2);
    }, 0);

    // Calculate sum of squares within groups (SSW)
    const ssw = variantData.reduce((sum, v) => {
      return sum + v.total * v.rate * (1 - v.rate);
    }, 0);

    // Degrees of freedom
    const dfBetween = k - 1;
    const dfWithin = N - k;

    // Mean squares
    const msBetween = ssb / dfBetween;
    const msWithin = ssw / dfWithin;

    // F-statistic
    const fStatistic = msBetween / msWithin;

    // Calculate p-value (approximation)
    const pValue = this.calculateFProbability(fStatistic, dfBetween, dfWithin);

    return {
      fStatistic,
      pValue,
      degreesOfFreedom: { between: dfBetween, within: dfWithin },
      sumOfSquares: { between: ssb, within: ssw },
      meanSquares: { between: msBetween, within: msWithin }
    };
  }

  performZTest(statsA, statsB) {
    const pA = statsA.conversions / statsA.participants;
    const pB = statsB.conversions / statsB.participants;
    const nA = statsA.participants;
    const nB = statsB.participants;

    // Pooled proportion
    const pPooled = (statsA.conversions + statsB.conversions) / (nA + nB);

    // Standard error
    const se = Math.sqrt(pPooled * (1 - pPooled) * (1 / nA + 1 / nB));

    // Z-score
    const zScore = (pB - pA) / se;

    // Two-tailed p-value
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));

    // Confidence interval
    const seCI = Math.sqrt((pA * (1 - pA)) / nA + (pB * (1 - pB)) / nB);
    const zCritical = 1.96; // 95% confidence
    const diff = pB - pA;
    const margin = zCritical * seCI;

    return {
      zScore,
      pValue,
      effectSize: diff,
      confidenceInterval: {
        lower: diff - margin,
        upper: diff + margin
      }
    };
  }

  calculateRelativeImprovement(variantData) {
    if (variantData.length < 2) {
      return 0;
    }

    const rates = variantData.map(v => v.rate);
    const maxRate = Math.max(...rates);
    const minRate = Math.min(...rates);

    return minRate > 0 ? ((maxRate - minRate) / minRate) * 100 : 0;
  }

  calculateFProbability(f, df1, df2) {
    // Simplified F-distribution p-value calculation
    // This is an approximation - in production, use a proper statistical library
    if (f <= 1) {
      return 0.5;
    }

    // Very rough approximation
    const criticalValues = {
      1: { 1: 161.4, 2: 18.51, 3: 10.13, 4: 7.71, 5: 6.61 },
      2: { 1: 199.5, 2: 19.0, 3: 9.55, 4: 6.94, 5: 5.79 },
      3: { 1: 215.7, 2: 19.16, 3: 9.28, 4: 6.59, 5: 5.41 }
    };

    const critical05 = criticalValues[Math.min(df1, 3)]?.[Math.min(df2, 5)] || 5.0;

    if (f > critical05) {
      return 0.01; // Very significant
    } else if (f > critical05 * 0.7) {
      return 0.05; // Significant
    } else {
      return 0.2; // Not significant
    }
  }

  // Alpha spending functions for sequential testing
  obrienFlemingBoundary(k, K, alpha) {
    return alpha * (1 - Math.exp(-1.96 * Math.sqrt(k / K)));
  }

  pocockBoundary(k, K, alpha) {
    return (alpha * k) / K;
  }

  haybittlePetoBoundary(k, K, alpha) {
    return k === K ? alpha : alpha * 0.001;
  }

  // Bayesian calculations
  calculateBetaProbability(variantB, variantA) {
    // Simplified calculation - in production use proper beta function
    const meanA = variantA.alpha / (variantA.alpha + variantA.beta);
    const meanB = variantB.alpha / (variantB.alpha + variantB.beta);
    const varA =
      (variantA.alpha * variantA.beta) /
      (Math.pow(variantA.alpha + variantA.beta, 2) * (variantA.alpha + variantA.beta + 1));
    const varB =
      (variantB.alpha * variantB.beta) /
      (Math.pow(variantB.alpha + variantB.beta, 2) * (variantB.alpha + variantB.beta + 1));

    // Approximate using normal approximation to beta
    const diffMean = meanB - meanA;
    const diffVar = varA + varB;
    const diffSd = Math.sqrt(diffVar);

    return this.normalCDF(diffMean / diffSd);
  }

  calculateCredibleInterval(variant, level) {
    // Simplified beta distribution credible interval
    const alpha = variant.alpha;
    const beta = variant.beta;
    const mean = alpha / (alpha + beta);

    // Approximate using normal approximation
    const variance = (alpha * beta) / (Math.pow(alpha + beta, 2) * (alpha + beta + 1));
    const sd = Math.sqrt(variance);
    const z = this.getZCritical(level);

    return {
      lower: Math.max(0, mean - z * sd),
      upper: Math.min(1, mean + z * sd),
      level
    };
  }

  calculateExpectedLoss(variantA, variantB) {
    // Simplified expected loss calculation
    const meanA = variantA.alpha / (variantA.alpha + variantA.beta);
    const meanB = variantB.alpha / (variantB.alpha + variantB.beta);
    return Math.max(0, meanA - meanB);
  }

  calculateViabilityProbability(observedEffect, minimumEffect, sampleSize) {
    // Simplified probability calculation
    const se = Math.sqrt((observedEffect * (1 - observedEffect)) / sampleSize);
    const z = (observedEffect - minimumEffect) / se;
    return this.normalCDF(z);
  }

  calculatePower(effectSize, sampleSize, alpha) {
    // Simplified power calculation
    const zAlpha = this.getZCritical(1 - alpha / 2);
    const zBeta = (Math.sqrt(sampleSize) * effectSize) / 2 - zAlpha;
    return this.normalCDF(zBeta);
  }

  calculateMinimumDetectableEffect(sampleSize, alpha, power) {
    // Simplified MDE calculation
    const zAlpha = this.getZCritical(1 - alpha / 2);
    const zBeta = this.getZCritical(power);
    return (2 * (zAlpha + zBeta)) / Math.sqrt(sampleSize);
  }

  async performMonitoringCheck(testId) {
    try {
      // Update test progress
      const progress = await this.getTestProgress(testId);

      // Check early stopping
      const earlyStop = await this.checkEarlyStoppingConditions(testId);

      if (earlyStop.shouldStop) {
        await this.stopTest(testId, earlyStop.reason);
        this.stopRealTimeMonitoring(testId);
      }

      // Update real-time metrics
      const test = this.tests.get(testId);
      if (test) {
        test.realTimeMetrics.lastUpdate = Date.now();
        await this.saveTest(test);
      }
    } catch (error) {
      await reportError({
        message: `Monitoring check failed: ${error.message}`,
        source: 'enhanced_ab_testing_framework',
        context: { testId }
      });
    }
  }

  stopRealTimeMonitoring(testId) {
    const intervalId = this.monitoringIntervals.get(testId);
    if (intervalId) {
      clearInterval(intervalId);
      this.monitoringIntervals.delete(testId);
    }
  }

  /**
   * Override assignUserToVariant to use enhanced tracking
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

      // Track enhanced analytics
      await trackEvent({
        type: 'ab_test_assignment',
        testId,
        userId,
        variantId: variant.id,
        variantName: variant.name,
        timestamp: Date.now()
      });

      return assignment;
    } catch (error) {
      await reportError({
        message: `Enhanced user assignment failed: ${error.message}`,
        source: 'enhanced_ab_testing_framework',
        context: { testId, userId }
      });
      return null;
    }
  }

  /**
   * Override recordConversion to use enhanced tracking
   */
  async recordConversion(testId, userId, metric, value = 1, context = {}) {
    try {
      const result = await super.recordConversion(testId, userId, metric, value, context);

      if (result) {
        // Enhanced tracking
        await trackEvent({
          type: 'ab_test_conversion',
          testId,
          userId,
          variantId: this.assignments.get(`${testId}-${userId}`)?.variantId,
          metric,
          value,
          timestamp: Date.now()
        });
      }

      return result;
    } catch (error) {
      await reportError({
        message: `Enhanced conversion recording failed: ${error.message}`,
        source: 'enhanced_ab_testing_framework',
        context: { testId, userId, metric, value }
      });
      return false;
    }
  }

  async saveEnhancedTest(test) {
    try {
      // Save to multiple storage buckets for enhanced features
      await Promise.all([
        this.saveTest(test), // Base test storage
        setStorageData({ [STORAGE_KEYS.AB_TEST_CONFIGS]: { [test.id]: test } }),
        setStorageData({ [STORAGE_KEYS.AB_TEST_STATISTICS]: { [test.id]: test.statistics } })
      ]);
    } catch (error) {
      await reportError({
        message: `Failed to save enhanced test: ${error.message}`,
        source: 'enhanced_ab_testing_framework',
        context: { testId: test.id }
      });
      throw error;
    }
  }
}

/**
 * Create enhanced A/B testing framework instance
 * @returns {EnhancedABTestingFramework} Enhanced A/B testing framework instance
 */
export function createEnhancedABTestingFramework() {
  return new EnhancedABTestingFramework();
}
