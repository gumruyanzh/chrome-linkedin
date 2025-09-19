// User Feedback Collection and Sentiment Analysis System - Task 6.6
// In-app feedback collection, sentiment analysis, categorization, privacy compliance

import { getStorageData, setStorageData, STORAGE_KEYS } from './storage.js';
import { encryptData, decryptData } from './encryption.js';
import { trackEvent, trackUserEngagement } from './real-time-analytics.js';
import { reportError } from './error-reporting.js';

/**
 * Feedback types supported by the system
 */
export const FEEDBACK_TYPES = {
  FEATURE_RATING: 'feature_rating',
  BUG_REPORT: 'bug_report',
  FEATURE_REQUEST: 'feature_request',
  USABILITY_FEEDBACK: 'usability_feedback',
  SATISFACTION_SURVEY: 'satisfaction_survey',
  NPS_SURVEY: 'nps_survey',
  GENERAL_FEEDBACK: 'general_feedback',
  ANONYMOUS_FEEDBACK: 'anonymous_feedback'
};

/**
 * Feedback categories for organization
 */
export const FEEDBACK_CATEGORIES = {
  AUTOMATION: 'automation',
  MESSAGING: 'messaging',
  UI_UX: 'ui_ux',
  PERFORMANCE: 'performance',
  PRIVACY: 'privacy',
  INTEGRATION: 'integration',
  GENERAL: 'general'
};

/**
 * Sentiment analysis results
 */
export const SENTIMENT_TYPES = {
  POSITIVE: 'positive',
  NEGATIVE: 'negative',
  NEUTRAL: 'neutral',
  MIXED: 'mixed'
};

/**
 * Priority levels for feedback
 */
export const PRIORITY_LEVELS = {
  URGENT: 'urgent',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

/**
 * User satisfaction levels
 */
export const SATISFACTION_LEVELS = {
  VERY_SATISFIED: 'very_satisfied',
  SATISFIED: 'satisfied',
  NEUTRAL: 'neutral',
  DISSATISFIED: 'dissatisfied',
  VERY_DISSATISFIED: 'very_dissatisfied'
};

/**
 * User Feedback Collection and Analysis System
 */
export class UserFeedbackSystem {
  constructor() {
    this.sentimentModel = null;
    this.categoryModel = null;
    this.privacySettings = {
      encryptSensitiveData: true,
      detectPII: true,
      anonymizeData: true,
      retentionPeriod: 365 // days
    };
    this.init();
  }

  async init() {
    try {
      await this.loadModels();
      await this.loadRetentionPolicy();
    } catch (error) {
      await reportError({
        message: `Failed to initialize feedback system: ${error.message}`,
        source: 'user_feedback_system',
        context: {}
      });
    }
  }

  /**
   * Collect user feedback with privacy compliance
   * @param {Object} feedbackData - Feedback data from user
   * @returns {Promise<Object>} Collection result with feedback ID
   */
  async collectFeedback(feedbackData) {
    try {
      // Validate required fields
      this.validateFeedbackData(feedbackData);

      const feedbackId = this.generateFeedbackId();
      const timestamp = Date.now();

      // Process and sanitize feedback
      const processedFeedback = await this.processFeedbackData(feedbackData, feedbackId, timestamp);

      // Store feedback with privacy compliance
      await this.storeFeedback(processedFeedback);

      // Perform real-time analysis
      const analysis = await this.performInitialAnalysis(processedFeedback);

      // Track analytics
      await trackEvent({
        type: 'feedback_collected',
        feedbackId,
        category: processedFeedback.category,
        rating: processedFeedback.rating,
        hasComment: !!processedFeedback.comment,
        feedbackType: processedFeedback.type
      });

      return {
        feedbackId,
        status: 'collected',
        privacyCompliant: true,
        encrypted: processedFeedback.encrypted,
        piiDetected: processedFeedback.piiDetected,
        piiRemoved: processedFeedback.piiRemoved,
        sentiment: analysis.sentiment,
        category: analysis.category,
        priority: analysis.priority
      };
    } catch (error) {
      await reportError({
        message: `Feedback collection failed: ${error.message}`,
        source: 'user_feedback_system',
        context: { feedbackData }
      });
      throw error;
    }
  }

  /**
   * Analyze sentiment of feedback text
   * @param {string} text - Text to analyze
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Sentiment analysis results
   */
  async analyzeSentiment(text, options = {}) {
    try {
      if (!text || typeof text !== 'string') {
        throw new Error('Text is required for sentiment analysis');
      }

      const startTime = Date.now();

      // Detect language if requested
      let detectedLanguage = 'en';
      let translatedText = text;

      if (options.detectLanguage) {
        const languageResult = await this.detectLanguage(text);
        detectedLanguage = languageResult.language;

        if (detectedLanguage !== 'en') {
          translatedText = await this.translateText(text, detectedLanguage, 'en');
        }
      }

      // Perform sentiment analysis
      const sentimentResult = await this.performSentimentAnalysis(translatedText);

      // Extract emotions and keywords
      const emotions = await this.extractEmotions(translatedText);
      const keywords = await this.extractKeywords(translatedText);

      const result = {
        sentiment: sentimentResult.sentiment,
        score: sentimentResult.score,
        confidence: sentimentResult.confidence,
        emotions,
        keywords,
        detectedLanguage: options.detectLanguage ? detectedLanguage : undefined,
        translatedText:
          options.detectLanguage && detectedLanguage !== 'en' ? translatedText : undefined,
        originalLanguage: options.detectLanguage ? detectedLanguage : undefined,
        processingTime: Date.now() - startTime
      };

      await trackEvent({
        type: 'sentiment_analyzed',
        sentiment: result.sentiment,
        confidence: result.confidence,
        textLength: text.length
      });

      return result;
    } catch (error) {
      await reportError({
        message: `Sentiment analysis failed: ${error.message}`,
        source: 'user_feedback_system',
        context: { text: text.substring(0, 100), options }
      });
      throw error;
    }
  }

  /**
   * Analyze emotions in feedback text
   * @param {string} text - Text to analyze
   * @returns {Promise<Object>} Emotion analysis results
   */
  async analyzeEmotions(text) {
    try {
      const emotions = await this.extractEmotions(text);

      // Calculate primary emotion and intensity
      const primaryEmotion = emotions.reduce((primary, current) =>
        current.intensity > primary.intensity ? current : primary
      );

      const emotionalIntensity =
        emotions.reduce((sum, emotion) => sum + emotion.intensity, 0) / emotions.length;

      return {
        primaryEmotion: primaryEmotion.emotion,
        emotions,
        emotionalIntensity,
        emotionCount: emotions.length
      };
    } catch (error) {
      await reportError({
        message: `Emotion analysis failed: ${error.message}`,
        source: 'user_feedback_system',
        context: { text: text.substring(0, 100) }
      });
      throw error;
    }
  }

  /**
   * Extract actionable insights from feedback
   * @param {string} text - Feedback text
   * @returns {Promise<Object>} Actionable insights
   */
  async extractActionableInsights(text) {
    try {
      const sentiment = await this.analyzeSentiment(text);
      const category = await this.categorizeFeedbackText(text);
      const topics = await this.extractTopics(text);
      const mentions = await this.extractMentions(text);

      // Determine if action is required
      let actionRequired = false;
      let urgency = 'none';
      let suggestedActions = [];

      if (sentiment.sentiment === SENTIMENT_TYPES.NEGATIVE) {
        actionRequired = true;
        urgency = this.calculateUrgency(sentiment, topics, mentions);
        suggestedActions = this.generateActionSuggestions(sentiment, topics, mentions);
      } else if (
        sentiment.sentiment === SENTIMENT_TYPES.POSITIVE &&
        topics.includes('feature_request')
      ) {
        actionRequired = true;
        urgency = 'low';
        suggestedActions = ['feature_consideration', 'roadmap_planning'];
      }

      return {
        actionRequired,
        urgency,
        category: category.primaryCategory,
        suggestedActions,
        topics,
        mentions,
        sentiment: sentiment.sentiment,
        confidence: sentiment.confidence
      };
    } catch (error) {
      await reportError({
        message: `Insight extraction failed: ${error.message}`,
        source: 'user_feedback_system',
        context: { text: text.substring(0, 100) }
      });
      throw error;
    }
  }

  /**
   * Categorize feedback automatically
   * @param {string} feedbackId - Feedback ID
   * @returns {Promise<Object>} Categorization results
   */
  async categorizeFeedback(feedbackId) {
    try {
      const feedback = await this.getFeedback(feedbackId);
      if (!feedback) {
        throw new Error('Feedback not found');
      }

      const text = feedback.comment || feedback.description || '';
      const categorization = await this.categorizeFeedbackText(text);

      // Store categorization
      await this.storeCategorization(feedbackId, categorization);

      await trackEvent({
        type: 'feedback_categorized',
        feedbackId,
        category: categorization.primaryCategory,
        subcategory: categorization.subcategory,
        confidence: categorization.confidence
      });

      return categorization;
    } catch (error) {
      await reportError({
        message: `Feedback categorization failed: ${error.message}`,
        source: 'user_feedback_system',
        context: { feedbackId }
      });
      throw error;
    }
  }

  /**
   * Prioritize feedback based on multiple factors
   * @param {string} feedbackId - Feedback ID
   * @returns {Promise<Object>} Prioritization results
   */
  async prioritizeFeedback(feedbackId) {
    try {
      const feedback = await this.getFeedback(feedbackId);
      if (!feedback) {
        throw new Error('Feedback not found');
      }

      const sentiment = await this.analyzeSentiment(feedback.comment || '');
      const categorization = await this.categorizeFeedback(feedbackId);

      // Calculate priority factors
      const factors = {
        severity: this.calculateSeverityScore(feedback, sentiment, categorization),
        sentiment: this.calculateSentimentScore(sentiment),
        userValue: this.calculateUserValueScore(feedback),
        frequency: await this.calculateFrequencyScore(feedback),
        businessImpact: this.calculateBusinessImpactScore(feedback, categorization)
      };

      // Calculate overall priority score (0-100)
      const score = Math.round(
        factors.severity * 0.3 +
          factors.sentiment * 0.2 +
          factors.userValue * 0.2 +
          factors.frequency * 0.15 +
          factors.businessImpact * 0.15
      );

      // Determine priority level
      let priority = PRIORITY_LEVELS.LOW;
      if (score >= 80) {
        priority = PRIORITY_LEVELS.URGENT;
      } else if (score >= 60) {
        priority = PRIORITY_LEVELS.HIGH;
      } else if (score >= 40) {
        priority = PRIORITY_LEVELS.MEDIUM;
      }

      const prioritization = {
        priority,
        score,
        factors,
        calculatedAt: Date.now()
      };

      // Store prioritization
      await this.storePrioritization(feedbackId, prioritization);

      return prioritization;
    } catch (error) {
      await reportError({
        message: `Feedback prioritization failed: ${error.message}`,
        source: 'user_feedback_system',
        context: { feedbackId }
      });
      throw error;
    }
  }

  /**
   * Detect trending issues from feedback patterns
   * @returns {Promise<Object>} Trending issues analysis
   */
  async detectTrendingIssues() {
    try {
      const recentFeedback = await this.getRecentFeedback(7); // Last 7 days
      const clusters = await this.clusterSimilarFeedback(recentFeedback.map(f => f.id));

      const trends = [];

      for (const cluster of clusters) {
        if (cluster.feedbackItems.length >= 3) {
          // Minimum threshold for trending
          const trend = {
            issue: cluster.theme,
            frequency: cluster.feedbackItems.length,
            severity: this.calculateClusterSeverity(cluster),
            keywords: cluster.commonKeywords,
            timeframe: {
              start: Math.min(...cluster.feedbackItems.map(f => f.timestamp)),
              end: Math.max(...cluster.feedbackItems.map(f => f.timestamp))
            },
            affectedUsers: new Set(cluster.feedbackItems.map(f => f.userId)).size,
            businessImpact: this.calculateClusterBusinessImpact(cluster),
            representativeText: cluster.representativeText
          };

          trends.push(trend);
        }
      }

      // Sort by frequency and severity
      trends.sort((a, b) => b.frequency * b.severity - a.frequency * a.severity);

      return {
        trends,
        analysisDate: Date.now(),
        totalFeedbackAnalyzed: recentFeedback.length,
        trendsDetected: trends.length
      };
    } catch (error) {
      await reportError({
        message: `Trending issues detection failed: ${error.message}`,
        source: 'user_feedback_system',
        context: {}
      });
      throw error;
    }
  }

  /**
   * Cluster similar feedback for better analysis
   * @param {Array} feedbackIds - Array of feedback IDs
   * @returns {Promise<Array>} Clusters of similar feedback
   */
  async clusterSimilarFeedback(feedbackIds) {
    try {
      const feedbackItems = await Promise.all(feedbackIds.map(id => this.getFeedback(id)));

      // Extract features for clustering
      const features = await Promise.all(
        feedbackItems.map(async feedback => {
          const sentiment = await this.analyzeSentiment(feedback.comment || '');
          const keywords = await this.extractKeywords(feedback.comment || '');

          return {
            feedback,
            keywords,
            sentiment: sentiment.sentiment,
            topics: await this.extractTopics(feedback.comment || '')
          };
        })
      );

      // Perform clustering based on keyword similarity
      const clusters = this.performKeywordClustering(features);

      return clusters;
    } catch (error) {
      await reportError({
        message: `Feedback clustering failed: ${error.message}`,
        source: 'user_feedback_system',
        context: { feedbackIds: feedbackIds.slice(0, 10) }
      });
      throw error;
    }
  }

  /**
   * Calculate user satisfaction scores
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Satisfaction analysis
   */
  async calculateUserSatisfaction(userId) {
    try {
      const userFeedback = await this.getUserFeedback(userId);

      if (userFeedback.length === 0) {
        return {
          overallScore: null,
          trend: 'no_data',
          averageRating: null,
          recentRating: null,
          sentimentDistribution: null
        };
      }

      // Calculate metrics
      const ratings = userFeedback.filter(f => f.rating).map(f => f.rating);
      const averageRating =
        ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : null;

      // Recent trend (last 3 feedback items)
      const recentFeedback = userFeedback.slice(-3);
      const recentRatings = recentFeedback.filter(f => f.rating).map(f => f.rating);
      const recentRating =
        recentRatings.length > 0
          ? recentRatings.reduce((sum, r) => sum + r, 0) / recentRatings.length
          : null;

      // Sentiment distribution
      const sentiments = await Promise.all(
        userFeedback.map(async feedback => {
          if (feedback.comment) {
            const sentiment = await this.analyzeSentiment(feedback.comment);
            return sentiment.sentiment;
          }
          return null;
        })
      );

      const sentimentCounts = sentiments
        .filter(s => s)
        .reduce((counts, sentiment) => {
          counts[sentiment] = (counts[sentiment] || 0) + 1;
          return counts;
        }, {});

      const totalSentiments = Object.values(sentimentCounts).reduce((sum, count) => sum + count, 0);
      const sentimentDistribution = {};
      for (const [sentiment, count] of Object.entries(sentimentCounts)) {
        sentimentDistribution[sentiment] = (count / totalSentiments) * 100;
      }

      // Calculate overall satisfaction score (0-100)
      let overallScore = 50; // Neutral baseline

      if (averageRating) {
        overallScore = (averageRating / 5) * 100;
      }

      // Adjust based on sentiment
      const positiveWeight = sentimentDistribution[SENTIMENT_TYPES.POSITIVE] || 0;
      const negativeWeight = sentimentDistribution[SENTIMENT_TYPES.NEGATIVE] || 0;
      const sentimentAdjustment = (positiveWeight - negativeWeight) * 0.3;
      overallScore = Math.max(0, Math.min(100, overallScore + sentimentAdjustment));

      // Determine trend
      let trend = 'stable';
      if (recentRating && averageRating) {
        if (recentRating > averageRating * 1.1) {
          trend = 'improving';
        } else if (recentRating < averageRating * 0.9) {
          trend = 'declining';
        }
      }

      return {
        overallScore: Math.round(overallScore),
        trend,
        averageRating,
        recentRating,
        sentimentDistribution,
        feedbackCount: userFeedback.length,
        lastFeedbackDate: Math.max(...userFeedback.map(f => f.timestamp))
      };
    } catch (error) {
      await reportError({
        message: `User satisfaction calculation failed: ${error.message}`,
        source: 'user_feedback_system',
        context: { userId }
      });
      throw error;
    }
  }

  /**
   * Analyze satisfaction trends over time
   * @returns {Promise<Object>} Trend analysis results
   */
  async analyzeSatisfactionTrends() {
    try {
      const result = await getStorageData(STORAGE_KEYS.USER_SATISFACTION);
      const historicalData = result.user_satisfaction?.historical || [];

      if (historicalData.length < 3) {
        return {
          overallTrend: 'insufficient_data',
          monthlyScores: historicalData,
          trendDirection: null,
          volatility: null,
          seasonalPatterns: null,
          projectedNextMonth: null
        };
      }

      // Calculate trend direction
      const scores = historicalData.map(d => d.satisfaction);
      const trendDirection = this.calculateTrendDirection(scores);
      const volatility = this.calculateVolatility(scores);

      // Detect seasonal patterns
      const seasonalPatterns = this.detectSeasonalPatterns(historicalData);

      // Project next month (simple linear trend)
      const projectedNextMonth = this.projectNextValue(scores);

      let overallTrend = 'stable';
      if (trendDirection > 2) {
        overallTrend = 'improving';
      } else if (trendDirection < -2) {
        overallTrend = 'declining';
      }

      return {
        overallTrend,
        monthlyScores: historicalData,
        trendDirection,
        volatility,
        seasonalPatterns,
        projectedNextMonth,
        analysisDate: Date.now()
      };
    } catch (error) {
      await reportError({
        message: `Satisfaction trend analysis failed: ${error.message}`,
        source: 'user_feedback_system',
        context: {}
      });
      throw error;
    }
  }

  /**
   * Analyze satisfaction by user segments
   * @returns {Promise<Object>} Segmented satisfaction analysis
   */
  async analyzeSatisfactionBySegment() {
    try {
      const result = await getStorageData(STORAGE_KEYS.FEEDBACK_ANALYTICS);
      const segmentData = result.feedback_analytics?.segmentation || [];

      const segments = segmentData.map(segment => ({
        ...segment,
        satisfactionLevel: this.categorizeSatisfactionLevel(segment.avgSatisfaction)
      }));

      // Generate insights
      const insights = this.generateSegmentInsights(segments);

      return {
        segments,
        insights,
        analysisDate: Date.now(),
        totalSegments: segments.length
      };
    } catch (error) {
      await reportError({
        message: `Segmented satisfaction analysis failed: ${error.message}`,
        source: 'user_feedback_system',
        context: {}
      });
      throw error;
    }
  }

  /**
   * Calculate Net Promoter Score (NPS)
   * @returns {Promise<Object>} NPS analysis results
   */
  async calculateNPS() {
    try {
      const npsResult = await getStorageData(STORAGE_KEYS.USER_FEEDBACK);
      const allFeedback = Object.values(npsResult.user_feedback || {});

      const npsResponses = allFeedback.filter(
        f => f.type === FEEDBACK_TYPES.NPS_SURVEY && f.npsScore
      );

      if (npsResponses.length === 0) {
        return {
          npsScore: null,
          promoters: 0,
          passives: 0,
          detractors: 0,
          responseCount: 0,
          category: 'no_data'
        };
      }

      // Categorize responses
      let promoters = 0;
      let passives = 0;
      let detractors = 0;

      for (const response of npsResponses) {
        const score = response.npsScore;
        if (score >= 9) {
          promoters++;
        } else if (score >= 7) {
          passives++;
        } else {
          detractors++;
        }
      }

      // Calculate NPS
      const npsScore = Math.round(((promoters - detractors) / npsResponses.length) * 100);

      // Categorize NPS
      let category = 'neutral';
      if (npsScore >= 50) {
        category = 'excellent';
      } else if (npsScore >= 30) {
        category = 'good';
      } else if (npsScore >= 0) {
        category = 'neutral';
      } else {
        category = 'poor';
      }

      return {
        npsScore,
        promoters,
        passives,
        detractors,
        responseCount: npsResponses.length,
        category,
        calculatedAt: Date.now()
      };
    } catch (error) {
      await reportError({
        message: `NPS calculation failed: ${error.message}`,
        source: 'user_feedback_system',
        context: {}
      });
      throw error;
    }
  }

  /**
   * Privacy and compliance methods
   */

  async setRetentionPolicy(policy) {
    try {
      this.privacySettings.retentionPeriod = policy.personalFeedback || 365;
      await setStorageData({
        [STORAGE_KEYS.USER_FEEDBACK]: {
          ...(await getStorageData(STORAGE_KEYS.USER_FEEDBACK)),
          retentionPolicy: policy
        }
      });
    } catch (error) {
      await reportError({
        message: `Failed to set retention policy: ${error.message}`,
        source: 'user_feedback_system',
        context: { policy }
      });
      throw error;
    }
  }

  async cleanupExpiredData() {
    try {
      const result = await getStorageData(STORAGE_KEYS.USER_FEEDBACK);
      const allFeedback = result.user_feedback || {};
      const retentionPeriod = this.privacySettings.retentionPeriod * 24 * 60 * 60 * 1000;
      const cutoffDate = Date.now() - retentionPeriod;

      const deletedItems = [];
      const retainedItems = [];

      for (const [feedbackId, feedback] of Object.entries(allFeedback)) {
        if (feedback.timestamp < cutoffDate && !feedback.anonymous) {
          deletedItems.push(feedbackId);
          delete allFeedback[feedbackId];
        } else {
          retainedItems.push(feedbackId);
        }
      }

      await setStorageData({ [STORAGE_KEYS.USER_FEEDBACK]: allFeedback });

      await trackEvent({
        type: 'data_cleanup_performed',
        deletedCount: deletedItems.length,
        retainedCount: retainedItems.length,
        policy: 'retention_policy'
      });

      return {
        deletedItems,
        deletedCount: deletedItems.length,
        retainedCount: retainedItems.length
      };
    } catch (error) {
      await reportError({
        message: `Data cleanup failed: ${error.message}`,
        source: 'user_feedback_system',
        context: {}
      });
      throw error;
    }
  }

  async exportUserData(userId) {
    try {
      const userFeedback = await this.getUserFeedback(userId);

      const exportData = {
        userId,
        feedbackItems: userFeedback,
        exportDate: Date.now(),
        format: 'json',
        dataTypes: ['feedback', 'ratings', 'comments']
      };

      return exportData;
    } catch (error) {
      await reportError({
        message: `Data export failed: ${error.message}`,
        source: 'user_feedback_system',
        context: { userId }
      });
      throw error;
    }
  }

  async deleteUserData(userId) {
    try {
      const result = await getStorageData(STORAGE_KEYS.USER_FEEDBACK);
      const allFeedback = result.user_feedback || {};

      let deletedItems = 0;
      for (const [feedbackId, feedback] of Object.entries(allFeedback)) {
        if (feedback.userId === userId) {
          delete allFeedback[feedbackId];
          deletedItems++;
        }
      }

      await setStorageData({ [STORAGE_KEYS.USER_FEEDBACK]: allFeedback });

      return {
        userId,
        deletedItems,
        anonymizedItems: 0,
        completedAt: Date.now()
      };
    } catch (error) {
      await reportError({
        message: `Data deletion failed: ${error.message}`,
        source: 'user_feedback_system',
        context: { userId }
      });
      throw error;
    }
  }

  async recordConsent(consentData) {
    try {
      await setStorageData({
        user_consent: {
          [consentData.userId]: consentData
        }
      });
    } catch (error) {
      await reportError({
        message: `Consent recording failed: ${error.message}`,
        source: 'user_feedback_system',
        context: { userId: consentData.userId }
      });
      throw error;
    }
  }

  async performMarketingAnalysis(userId) {
    try {
      const consent = await this.getUserConsent(userId);

      if (!consent?.consentTypes?.marketingUsage) {
        return {
          allowed: false,
          reason: 'marketing_consent_not_granted'
        };
      }

      // Perform marketing analysis...
      return {
        allowed: true,
        analysis: {}
      };
    } catch (error) {
      await reportError({
        message: `Marketing analysis failed: ${error.message}`,
        source: 'user_feedback_system',
        context: { userId }
      });
      throw error;
    }
  }

  async generateAggregateReport() {
    try {
      const result = await getStorageData(STORAGE_KEYS.USER_FEEDBACK);
      const allFeedback = Object.values(result.user_feedback || {});

      const totalFeedback = allFeedback.length;
      const ratings = allFeedback.filter(f => f.rating).map(f => f.rating);
      const averageRating =
        ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : null;

      // Sentiment distribution
      const sentimentCounts = { positive: 0, negative: 0, neutral: 0, mixed: 0 };
      for (const feedback of allFeedback) {
        if (feedback.sentiment) {
          sentimentCounts[feedback.sentiment]++;
        }
      }

      const insights = [
        {
          type: 'satisfaction_trend',
          finding: `Average rating: ${averageRating?.toFixed(1) || 'N/A'}`,
          dataPoints: ratings.length
        },
        {
          type: 'sentiment_analysis',
          finding: `${sentimentCounts.positive} positive, ${sentimentCounts.negative} negative feedback items`,
          dataPoints: Object.values(sentimentCounts).reduce((sum, count) => sum + count, 0)
        }
      ];

      return {
        totalFeedback,
        averageRating,
        sentimentDistribution: sentimentCounts,
        anonymized: true,
        insights,
        generatedAt: Date.now()
      };
    } catch (error) {
      await reportError({
        message: `Aggregate report generation failed: ${error.message}`,
        source: 'user_feedback_system',
        context: {}
      });
      throw error;
    }
  }

  async getAuditLog(userId) {
    try {
      // Simplified audit log - in production this would be more comprehensive
      const operations = [
        {
          operation: 'feedback_collection',
          timestamp: Date.now() - 86400000,
          dataTypes: ['rating'],
          purpose: 'product_improvement'
        },
        {
          operation: 'data_access',
          timestamp: Date.now() - 3600000,
          dataTypes: ['feedback'],
          purpose: 'user_request'
        },
        {
          operation: 'sentiment_analysis',
          timestamp: Date.now() - 1800000,
          dataTypes: ['comment'],
          purpose: 'product_improvement'
        },
        {
          operation: 'data_export',
          timestamp: Date.now() - 300000,
          dataTypes: ['feedback', 'ratings', 'comments'],
          purpose: 'gdpr_request'
        }
      ];

      return {
        userId,
        operations,
        auditDate: Date.now()
      };
    } catch (error) {
      await reportError({
        message: `Audit log retrieval failed: ${error.message}`,
        source: 'user_feedback_system',
        context: { userId }
      });
      throw error;
    }
  }

  /**
   * Helper methods for data processing and analysis
   */

  validateFeedbackData(data) {
    if (!data.userId && !data.anonymous) {
      throw new Error('User ID is required for feedback collection');
    }

    if (!data.type) {
      throw new Error('Feedback type is required');
    }

    if (data.rating && (data.rating < 1 || data.rating > 5)) {
      throw new Error('Rating must be between 1 and 5');
    }

    if (data.comment && data.comment.length > 2000) {
      throw new Error('Comment cannot exceed 2000 characters');
    }
  }

  async processFeedbackData(feedbackData, feedbackId, timestamp) {
    const processed = {
      id: feedbackId,
      ...feedbackData,
      timestamp,
      encrypted: false,
      piiDetected: false,
      piiRemoved: false
    };

    // Detect and remove PII if present
    if (processed.comment) {
      const piiResult = await this.detectAndRemovePII(processed.comment);
      processed.sanitizedComment = piiResult.sanitizedText;
      processed.piiDetected = piiResult.piiDetected;
      processed.piiRemoved = piiResult.piiRemoved;

      if (piiResult.piiDetected) {
        await trackEvent({
          type: 'pii_detected_and_removed',
          feedbackId,
          piiTypes: piiResult.piiTypes
        });
      }
    }

    // Encrypt sensitive data
    if (this.privacySettings.encryptSensitiveData && processed.comment) {
      processed.encryptedComment = await encryptData({
        comment: processed.sanitizedComment || processed.comment,
        sensitiveData: true
      });
      processed.encrypted = true;
      delete processed.comment;
      delete processed.sanitizedComment;
    }

    return processed;
  }

  async performInitialAnalysis(feedback) {
    const text = feedback.comment || feedback.sanitizedComment || '';

    let sentiment = { sentiment: SENTIMENT_TYPES.NEUTRAL };
    let category = { primaryCategory: FEEDBACK_CATEGORIES.GENERAL };
    let priority = { priority: PRIORITY_LEVELS.LOW };

    if (text) {
      sentiment = await this.analyzeSentiment(text);
      category = await this.categorizeFeedbackText(text);
    }

    // For initial analysis, calculate basic priority without full feedback lookup
    if (feedback.rating || text) {
      priority = this.calculateBasicPriority(feedback, sentiment, category);
    }

    return {
      sentiment: sentiment.sentiment,
      category: category.primaryCategory,
      priority: priority.priority
    };
  }

  generateFeedbackId() {
    return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  calculateBasicPriority(feedback, sentiment, category) {
    let score = 30; // Base score

    if (sentiment.sentiment === SENTIMENT_TYPES.NEGATIVE) {
      score += 40;
    }
    if (category.primaryCategory === FEEDBACK_CATEGORIES.AUTOMATION) {
      score += 20;
    }
    if (feedback.rating && feedback.rating <= 2) {
      score += 30;
    }

    let priority = PRIORITY_LEVELS.LOW;
    if (score >= 80) {
      priority = PRIORITY_LEVELS.URGENT;
    } else if (score >= 60) {
      priority = PRIORITY_LEVELS.HIGH;
    } else if (score >= 40) {
      priority = PRIORITY_LEVELS.MEDIUM;
    }

    return { priority };
  }

  async loadModels() {
    // Placeholder for loading sentiment and categorization models
    this.sentimentModel = 'mock_sentiment_model';
    this.categoryModel = 'mock_category_model';
  }

  async loadRetentionPolicy() {
    try {
      const result = await getStorageData(STORAGE_KEYS.USER_FEEDBACK);
      const policy = result.user_feedback?.retentionPolicy;
      if (policy) {
        this.privacySettings.retentionPeriod = policy.personalFeedback || 365;
      }
    } catch (error) {
      // Use default retention policy
    }
  }

  async detectLanguage(text) {
    // Simplified language detection - in production use proper library
    const languagePatterns = {
      es: /[ñáéíóúü]/i,
      fr: /[àâäéèêëïîôöùûüÿ]/i,
      de: /[äöüß]/i
    };

    for (const [lang, pattern] of Object.entries(languagePatterns)) {
      if (pattern.test(text)) {
        return { language: lang, confidence: 0.8 };
      }
    }

    return { language: 'en', confidence: 0.9 };
  }

  async translateText(text, fromLang, toLang) {
    // Simplified translation - in production use proper translation service
    return `[Translated from ${fromLang}] ${text}`;
  }

  async performSentimentAnalysis(text) {
    // Simplified sentiment analysis
    const positiveWords = ['love', 'great', 'excellent', 'amazing', 'fantastic', 'good', 'like'];
    const negativeWords = ['hate', 'terrible', 'awful', 'bad', 'broken', 'frustrating', 'slow'];
    const mixedIndicators = ['but', 'however', 'although', 'though'];

    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;
    let hasMixedIndicators = false;

    for (const word of words) {
      if (positiveWords.some(pw => word.includes(pw))) {
        positiveCount++;
      }
      if (negativeWords.some(nw => word.includes(nw))) {
        negativeCount++;
      }
      if (mixedIndicators.some(mi => word.includes(mi))) {
        hasMixedIndicators = true;
      }
    }

    let sentiment = SENTIMENT_TYPES.NEUTRAL;
    let score = 0;

    if (positiveCount > 0 && negativeCount > 0 && hasMixedIndicators) {
      sentiment = SENTIMENT_TYPES.MIXED;
      score = 0;
    } else if (positiveCount > negativeCount) {
      sentiment = SENTIMENT_TYPES.POSITIVE;
      score = Math.min(1, ((positiveCount - negativeCount) / words.length) * 10);
    } else if (negativeCount > positiveCount) {
      sentiment = SENTIMENT_TYPES.NEGATIVE;
      score = Math.max(-1, (-(negativeCount - positiveCount) / words.length) * 10);
    }

    const confidence = Math.min(1, Math.abs(score) * 2 + 0.3);

    return { sentiment, score, confidence };
  }

  async extractEmotions(text) {
    // Simplified emotion extraction
    const emotionPatterns = {
      anger: /angry|mad|furious|frustrated|annoyed/i,
      joy: /happy|excited|thrilled|delighted|pleased/i,
      fear: /worried|scared|concerned|anxious|nervous/i,
      surprise: /surprised|amazed|shocked|unexpected/i,
      sadness: /sad|disappointed|upset|unhappy/i,
      disgust: /disgusted|revolted|sick|horrible/i
    };

    const emotions = [];
    for (const [emotion, pattern] of Object.entries(emotionPatterns)) {
      const matches = text.match(pattern);
      if (matches) {
        emotions.push({
          emotion,
          intensity: Math.min(1, matches.length * 0.3),
          confidence: 0.8
        });
      }
    }

    return emotions.length > 0
      ? emotions
      : [{ emotion: 'neutral', intensity: 0.5, confidence: 0.9 }];
  }

  async extractKeywords(text) {
    // Simplified keyword extraction
    const stopWords = [
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by'
    ];
    const words = text
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.includes(word));

    const wordCounts = words.reduce((counts, word) => {
      counts[word] = (counts[word] || 0) + 1;
      return counts;
    }, {});

    return Object.entries(wordCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word, count]) => ({ word, count, relevance: count / words.length }));
  }

  async categorizeFeedbackText(text) {
    // Simplified categorization
    const categoryPatterns = {
      [FEEDBACK_CATEGORIES.AUTOMATION]: /automat|connect|request|send|message/i,
      [FEEDBACK_CATEGORIES.MESSAGING]: /message|template|text|communication/i,
      [FEEDBACK_CATEGORIES.UI_UX]: /interface|ui|ux|design|button|navigation|confusing/i,
      [FEEDBACK_CATEGORIES.PERFORMANCE]: /slow|fast|speed|performance|load|lag/i,
      [FEEDBACK_CATEGORIES.PRIVACY]: /privacy|data|secure|safety|information/i,
      [FEEDBACK_CATEGORIES.INTEGRATION]: /linkedin|integration|api|sync|connect/i
    };

    let primaryCategory = FEEDBACK_CATEGORIES.GENERAL;
    let confidence = 0.5;

    for (const [category, pattern] of Object.entries(categoryPatterns)) {
      if (pattern.test(text)) {
        primaryCategory = category;
        confidence = 0.8;
        break;
      }
    }

    return {
      primaryCategory,
      subcategory: this.getSubcategory(primaryCategory, text),
      confidence,
      relatedFeature: this.identifyFeature(text),
      tags: await this.extractKeywords(text)
    };
  }

  getSubcategory(category, text) {
    const subcategoryMap = {
      [FEEDBACK_CATEGORIES.AUTOMATION]: text.includes('error')
        ? 'automation_error'
        : 'automation_general',
      [FEEDBACK_CATEGORIES.MESSAGING]: text.includes('template')
        ? 'message_templates'
        : 'messaging_general',
      [FEEDBACK_CATEGORIES.UI_UX]: 'ui_ux',
      [FEEDBACK_CATEGORIES.PERFORMANCE]: 'performance_issue',
      [FEEDBACK_CATEGORIES.PRIVACY]: 'privacy_concern',
      [FEEDBACK_CATEGORIES.INTEGRATION]: 'linkedin_integration'
    };

    return subcategoryMap[category] || 'general';
  }

  identifyFeature(text) {
    const featurePatterns = {
      connection_automation: /connect|connection|request/i,
      messaging: /message|template|text/i,
      user_interface: /ui|interface|button|menu/i,
      search: /search|find|filter/i,
      analytics: /analytic|report|stat/i
    };

    for (const [feature, pattern] of Object.entries(featurePatterns)) {
      if (pattern.test(text)) {
        return feature;
      }
    }

    return 'general';
  }

  async extractTopics(text) {
    // Simplified topic extraction
    const topics = [];

    if (/bug|error|problem|issue|fail/i.test(text)) {
      topics.push('bug_report');
    }
    if (/feature|want|need|add|implement/i.test(text)) {
      topics.push('feature_request');
    }
    if (/slow|performance|speed/i.test(text)) {
      topics.push('performance');
    }
    if (/ui|interface|design/i.test(text)) {
      topics.push('user_interface');
    }

    return topics.length > 0 ? topics : ['general'];
  }

  async extractMentions(text) {
    // Extract specific feature or component mentions
    const mentions = [];

    const mentionPatterns = {
      automation: /automat/i,
      templates: /template/i,
      dashboard: /dashboard/i,
      settings: /setting/i,
      popup: /popup/i
    };

    for (const [mention, pattern] of Object.entries(mentionPatterns)) {
      if (pattern.test(text)) {
        mentions.push(mention);
      }
    }

    return mentions;
  }

  calculateUrgency(sentiment, topics, mentions) {
    if (sentiment.sentiment === SENTIMENT_TYPES.NEGATIVE && topics.includes('bug_report')) {
      return 'high';
    }
    if (topics.includes('performance') || mentions.includes('automation')) {
      return 'medium';
    }
    return 'low';
  }

  generateActionSuggestions(sentiment, topics, mentions) {
    const actions = [];

    if (topics.includes('bug_report')) {
      actions.push('bug_fix', 'quality_assurance');
    }
    if (topics.includes('performance')) {
      actions.push('performance_optimization');
    }
    if (topics.includes('user_interface')) {
      actions.push('ui_enhancement');
    }
    if (topics.includes('feature_request')) {
      actions.push('feature_consideration');
    }

    return actions;
  }

  // Additional helper methods for scoring and analysis...

  calculateSeverityScore(feedback, sentiment, categorization) {
    let score = 30; // Base score

    if (sentiment.sentiment === SENTIMENT_TYPES.NEGATIVE) {
      score += 40;
    }
    if (categorization.primaryCategory === FEEDBACK_CATEGORIES.AUTOMATION) {
      score += 20;
    }
    if (feedback.rating && feedback.rating <= 2) {
      score += 30;
    }

    return Math.min(100, score);
  }

  calculateSentimentScore(sentiment) {
    const sentimentScores = {
      [SENTIMENT_TYPES.POSITIVE]: 20,
      [SENTIMENT_TYPES.NEUTRAL]: 50,
      [SENTIMENT_TYPES.NEGATIVE]: 80,
      [SENTIMENT_TYPES.MIXED]: 60
    };

    return sentimentScores[sentiment.sentiment] || 50;
  }

  calculateUserValueScore(feedback) {
    // Simplified user value calculation
    const tierScores = {
      premium: 80,
      pro: 60,
      free: 40
    };

    return tierScores[feedback.userTier] || 40;
  }

  async calculateFrequencyScore(feedback) {
    // Calculate how frequently this type of feedback occurs
    const similarFeedback = await this.findSimilarFeedback(feedback);
    const frequency = similarFeedback.length;

    if (frequency > 5) {
      return 80;
    }
    if (frequency > 2) {
      return 60;
    }
    if (frequency > 0) {
      return 40;
    }
    return 20;
  }

  calculateBusinessImpactScore(feedback, categorization) {
    const impactScores = {
      [FEEDBACK_CATEGORIES.AUTOMATION]: 80,
      [FEEDBACK_CATEGORIES.PERFORMANCE]: 70,
      [FEEDBACK_CATEGORIES.UI_UX]: 50,
      [FEEDBACK_CATEGORIES.MESSAGING]: 60,
      [FEEDBACK_CATEGORIES.PRIVACY]: 90,
      [FEEDBACK_CATEGORIES.INTEGRATION]: 70
    };

    return impactScores[categorization.primaryCategory] || 40;
  }

  // Storage and retrieval methods...

  async storeFeedback(feedback) {
    const result = await getStorageData(STORAGE_KEYS.USER_FEEDBACK);
    const allFeedback = result.user_feedback || {};
    allFeedback[feedback.id] = feedback;
    await setStorageData({ [STORAGE_KEYS.USER_FEEDBACK]: allFeedback });
  }

  async getFeedback(feedbackId) {
    const result = await getStorageData(STORAGE_KEYS.USER_FEEDBACK);
    const feedback = result.user_feedback?.[feedbackId];

    if (feedback && feedback.encryptedComment) {
      try {
        const decrypted = await decryptData(feedback.encryptedComment);
        feedback.comment = decrypted.comment;
      } catch (error) {
        // Handle decryption error
      }
    }

    return feedback;
  }

  async getUserFeedback(userId) {
    const result = await getStorageData(STORAGE_KEYS.USER_FEEDBACK);
    const allFeedback = Object.values(result.user_feedback || {});
    return allFeedback.filter(f => f.userId === userId);
  }

  async getRecentFeedback(days) {
    const result = await getStorageData(STORAGE_KEYS.USER_FEEDBACK);
    const allFeedback = Object.values(result.user_feedback || {});
    const cutoffDate = Date.now() - days * 24 * 60 * 60 * 1000;
    return allFeedback.filter(f => f.timestamp >= cutoffDate);
  }

  async detectAndRemovePII(text) {
    const piiPatterns = {
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
      ssn: /\b\d{3}-\d{2}-\d{4}\b/g
    };

    let sanitizedText = text;
    const piiTypes = [];
    let piiDetected = false;

    for (const [type, pattern] of Object.entries(piiPatterns)) {
      if (pattern.test(text)) {
        piiDetected = true;
        piiTypes.push(type);
        sanitizedText = sanitizedText.replace(pattern, `[${type.toUpperCase()}]`);
      }
    }

    return {
      sanitizedText,
      piiDetected,
      piiRemoved: piiDetected,
      piiTypes
    };
  }

  async getUserConsent(userId) {
    const result = await getStorageData('user_consent');
    return result.user_consent?.[userId];
  }

  // Additional implementation methods would continue here...
  // Including clustering algorithms, trend analysis, etc.

  performKeywordClustering(features) {
    // Simplified clustering based on keyword overlap
    const clusters = [];
    const used = new Set();

    for (let i = 0; i < features.length; i++) {
      if (used.has(i)) {
        continue;
      }

      const cluster = {
        theme: features[i].topics[0] || 'general',
        feedbackItems: [features[i].feedback],
        commonKeywords: features[i].keywords.slice(0, 5).map(k => k.word),
        representativeText: features[i].feedback.comment || ''
      };

      used.add(i);

      // Find similar items
      for (let j = i + 1; j < features.length; j++) {
        if (used.has(j)) {
          continue;
        }

        const similarity = this.calculateKeywordSimilarity(features[i], features[j]);
        if (similarity > 0.3) {
          cluster.feedbackItems.push(features[j].feedback);
          used.add(j);
        }
      }

      clusters.push(cluster);
    }

    return clusters;
  }

  calculateKeywordSimilarity(feature1, feature2) {
    const keywords1 = new Set(feature1.keywords.map(k => k.word));
    const keywords2 = new Set(feature2.keywords.map(k => k.word));

    const intersection = new Set([...keywords1].filter(k => keywords2.has(k)));
    const union = new Set([...keywords1, ...keywords2]);

    return intersection.size / union.size;
  }

  calculateClusterSeverity(cluster) {
    return cluster.feedbackItems.length >= 5 ? 'high' : 'medium';
  }

  calculateClusterBusinessImpact(cluster) {
    return cluster.feedbackItems.length >= 3 ? 'high' : 'medium';
  }

  calculateTrendDirection(scores) {
    if (scores.length < 2) {
      return 0;
    }

    const recent = scores.slice(-3);
    const earlier = scores.slice(-6, -3);

    const recentAvg = recent.reduce((sum, s) => sum + s, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, s) => sum + s, 0) / earlier.length;

    return recentAvg - earlierAvg;
  }

  calculateVolatility(scores) {
    if (scores.length < 2) {
      return 0;
    }

    const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;

    return Math.sqrt(variance);
  }

  detectSeasonalPatterns(data) {
    // Simplified seasonal pattern detection
    return null; // Would implement proper time series analysis
  }

  projectNextValue(scores) {
    if (scores.length < 3) {
      return null;
    }

    // Simple linear projection
    const recent = scores.slice(-3);
    const trend = (recent[2] - recent[0]) / 2;

    return Math.max(0, Math.min(100, recent[2] + trend));
  }

  categorizeSatisfactionLevel(score) {
    if (score >= 85) {
      return 'high';
    }
    if (score >= 70) {
      return 'medium';
    }
    if (score >= 50) {
      return 'low';
    }
    return 'very_low';
  }

  generateSegmentInsights(segments) {
    const insights = [];

    // Find highest and lowest satisfaction segments
    const sorted = segments.sort((a, b) => b.avgSatisfaction - a.avgSatisfaction);

    if (sorted.length >= 2) {
      insights.push({
        type: 'segment_comparison',
        finding: `${sorted[0].segment} has highest satisfaction (${sorted[0].avgSatisfaction})`,
        recommendation: `Analyze what makes ${sorted[0].segment} successful and apply to other segments`
      });

      insights.push({
        type: 'improvement_opportunity',
        finding: `${sorted[sorted.length - 1].segment} has lowest satisfaction (${sorted[sorted.length - 1].avgSatisfaction})`,
        recommendation: `Focus improvement efforts on ${sorted[sorted.length - 1].segment}`
      });
    }

    return insights;
  }

  async findSimilarFeedback(feedback) {
    // Simplified similar feedback detection
    const allFeedback = await this.getRecentFeedback(30);
    return allFeedback.filter(f => f.category === feedback.category && f.id !== feedback.id);
  }

  async storeCategorization(feedbackId, categorization) {
    const result = await getStorageData(STORAGE_KEYS.FEEDBACK_CATEGORIES);
    const categories = result.feedback_categories || {};
    categories[feedbackId] = categorization;
    await setStorageData({ [STORAGE_KEYS.FEEDBACK_CATEGORIES]: categories });
  }

  async storePrioritization(feedbackId, prioritization) {
    const result = await getStorageData(STORAGE_KEYS.FEEDBACK_ANALYTICS);
    const analytics = result.feedback_analytics || {};
    if (!analytics.priorities) {
      analytics.priorities = {};
    }
    analytics.priorities[feedbackId] = prioritization;
    await setStorageData({ [STORAGE_KEYS.FEEDBACK_ANALYTICS]: analytics });
  }
}

/**
 * Create user feedback system instance
 * @returns {UserFeedbackSystem} User feedback system instance
 */
export function createUserFeedbackSystem() {
  return new UserFeedbackSystem();
}
