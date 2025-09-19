// Tests for User Feedback Collection and Sentiment Analysis System - Task 6.6
// In-app feedback collection, sentiment analysis, categorization, privacy compliance

import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock dependencies
jest.mock('../src/utils/storage.js', () => ({
  getStorageData: jest.fn(),
  setStorageData: jest.fn(),
  logAnalytics: jest.fn(),
  STORAGE_KEYS: {
    USER_FEEDBACK: 'user_feedback',
    FEEDBACK_SENTIMENT: 'feedback_sentiment',
    FEEDBACK_CATEGORIES: 'feedback_categories',
    FEEDBACK_ANALYTICS: 'feedback_analytics',
    USER_SATISFACTION: 'user_satisfaction',
    ANALYTICS: 'analytics'
  }
}));

jest.mock('../src/utils/encryption.js', () => ({
  encryptData: jest.fn((data) => `encrypted_${JSON.stringify(data)}`),
  decryptData: jest.fn((encryptedData) => JSON.parse(encryptedData.replace('encrypted_', '')))
}));

jest.mock('../src/utils/real-time-analytics.js', () => ({
  trackEvent: jest.fn(),
  trackUserEngagement: jest.fn(),
  ANALYTICS_EVENT_TYPES: {
    FEEDBACK_COLLECTED: 'feedback_collected',
    SENTIMENT_ANALYZED: 'sentiment_analyzed',
    FEEDBACK_CATEGORIZED: 'feedback_categorized'
  }
}));

jest.mock('../src/utils/error-reporting.js', () => ({
  reportError: jest.fn(),
  logErrorEvent: jest.fn()
}));

import { getStorageData, setStorageData, logAnalytics } from '../src/utils/storage.js';
import { encryptData, decryptData } from '../src/utils/encryption.js';
import { trackEvent, trackUserEngagement } from '../src/utils/real-time-analytics.js';
import { reportError } from '../src/utils/error-reporting.js';

describe('User Feedback Collection and Sentiment Analysis System - Task 6.6', () => {
  let feedbackSystem;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock storage responses
    getStorageData.mockResolvedValue({});
    setStorageData.mockResolvedValue();
    logAnalytics.mockResolvedValue();
    trackEvent.mockResolvedValue();
    trackUserEngagement.mockResolvedValue();
    reportError.mockResolvedValue();
  });

  describe('In-App Feedback Collection', () => {
    test('should collect user feedback with ratings and comments', async () => {
      const { UserFeedbackSystem } = await import('../src/utils/user-feedback-system.js');
      feedbackSystem = new UserFeedbackSystem();

      const feedbackData = {
        userId: 'user123',
        sessionId: 'session456',
        type: 'feature_rating',
        category: 'automation',
        rating: 4,
        comment: 'The automation feature is great, but could use more customization options.',
        context: {
          feature: 'linkedin_automation',
          page: 'dashboard',
          action: 'connection_request_sent'
        },
        metadata: {
          userAgent: 'Chrome/91.0',
          extensionVersion: '2.1.0',
          timestamp: Date.now()
        }
      };

      const result = await feedbackSystem.collectFeedback(feedbackData);

      expect(result.feedbackId).toBeDefined();
      expect(result.status).toBe('collected');
      expect(result.privacyCompliant).toBe(true);
      expect(result.encrypted).toBe(true);

      expect(encryptData).toHaveBeenCalledWith(
        expect.objectContaining({
          comment: feedbackData.comment,
          sensitiveData: true
        })
      );

      expect(trackEvent).toHaveBeenCalledWith({
        type: 'feedback_collected',
        feedbackId: result.feedbackId,
        category: 'automation',
        rating: 4,
        hasComment: true
      });

      expect(setStorageData).toHaveBeenCalledWith({
        user_feedback: expect.objectContaining({
          [result.feedbackId]: expect.objectContaining({
            id: result.feedbackId,
            type: 'feature_rating',
            category: 'automation',
            rating: 4,
            encryptedComment: expect.stringContaining('encrypted_'),
            context: feedbackData.context,
            timestamp: expect.any(Number)
          })
        })
      });
    });

    test('should support different feedback types', async () => {
      const { UserFeedbackSystem } = await import('../src/utils/user-feedback-system.js');
      feedbackSystem = new UserFeedbackSystem();

      const feedbackTypes = [
        {
          type: 'bug_report',
          category: 'connection_automation',
          severity: 'medium',
          description: 'Connection requests sometimes fail to send',
          steps: ['Open LinkedIn', 'Navigate to profile', 'Click connect', 'Error occurs'],
          expectedBehavior: 'Connection request should be sent successfully',
          actualBehavior: 'Error message appears'
        },
        {
          type: 'feature_request',
          category: 'messaging',
          priority: 'high',
          title: 'Bulk message templates',
          description: 'Would like to send different templates to different user segments',
          useCase: 'Marketing campaigns with personalized messages'
        },
        {
          type: 'usability_feedback',
          category: 'ui_ux',
          component: 'popup_interface',
          issue: 'Button placement is confusing',
          suggestion: 'Move primary action button to bottom right'
        },
        {
          type: 'satisfaction_survey',
          category: 'overall_experience',
          npsScore: 8,
          satisfactionScore: 9,
          responses: {
            easeOfUse: 4,
            featureCompleteness: 3,
            reliability: 5,
            support: 4
          }
        }
      ];

      for (const feedback of feedbackTypes) {
        const result = await feedbackSystem.collectFeedback({
          userId: 'user123',
          ...feedback
        });

        expect(result.feedbackId).toBeDefined();
        expect(result.status).toBe('collected');

        expect(trackEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'feedback_collected',
            feedbackType: feedback.type,
            category: feedback.category
          })
        );
      }
    });

    test('should validate feedback data and handle errors', async () => {
      const { UserFeedbackSystem } = await import('../src/utils/user-feedback-system.js');
      feedbackSystem = new UserFeedbackSystem();

      // Test missing required fields
      await expect(feedbackSystem.collectFeedback({}))
        .rejects.toThrow('User ID is required for feedback collection');

      await expect(feedbackSystem.collectFeedback({ userId: 'user123' }))
        .rejects.toThrow('Feedback type is required');

      // Test invalid rating
      await expect(feedbackSystem.collectFeedback({
        userId: 'user123',
        type: 'feature_rating',
        rating: 6 // Should be 1-5
      })).rejects.toThrow('Rating must be between 1 and 5');

      // Test comment length validation
      await expect(feedbackSystem.collectFeedback({
        userId: 'user123',
        type: 'feature_rating',
        comment: 'a'.repeat(2001) // Too long
      })).rejects.toThrow('Comment cannot exceed 2000 characters');
    });

    test('should implement privacy compliance and data anonymization', async () => {
      const { UserFeedbackSystem } = await import('../src/utils/user-feedback-system.js');
      feedbackSystem = new UserFeedbackSystem();

      const feedbackData = {
        userId: 'user123',
        type: 'feature_rating',
        rating: 4,
        comment: 'Great feature! My email is john@example.com and phone is 555-1234',
        personalInfo: {
          email: 'john@example.com',
          name: 'John Doe'
        }
      };

      const result = await feedbackSystem.collectFeedback(feedbackData);

      // Check that personal information is handled properly
      expect(result.privacyCompliant).toBe(true);
      expect(result.piiDetected).toBe(true);
      expect(result.piiRemoved).toBe(true);

      // Verify PII detection and removal
      const storedFeedback = await feedbackSystem.getFeedback(result.feedbackId);
      expect(storedFeedback.sanitizedComment).toBe('Great feature! My email is [EMAIL] and phone is [PHONE]');
      expect(storedFeedback.originalComment).toBeUndefined(); // Should not store original
      expect(storedFeedback.personalInfo).toBeUndefined(); // Should not store PII

      expect(trackEvent).toHaveBeenCalledWith({
        type: 'pii_detected_and_removed',
        feedbackId: result.feedbackId,
        piiTypes: ['email', 'phone']
      });
    });

    test('should support anonymous feedback collection', async () => {
      const { UserFeedbackSystem } = await import('../src/utils/user-feedback-system.js');
      feedbackSystem = new UserFeedbackSystem();

      const anonymousFeedback = {
        type: 'anonymous_feedback',
        category: 'general',
        rating: 5,
        comment: 'Love this extension!',
        anonymous: true
      };

      const result = await feedbackSystem.collectFeedback(anonymousFeedback);

      expect(result.feedbackId).toBeDefined();
      expect(result.anonymous).toBe(true);
      expect(result.userId).toBeUndefined();

      const storedFeedback = await feedbackSystem.getFeedback(result.feedbackId);
      expect(storedFeedback.userId).toBeUndefined();
      expect(storedFeedback.sessionId).toBeUndefined();
      expect(storedFeedback.anonymized).toBe(true);
    });
  });

  describe('Sentiment Analysis', () => {
    test('should analyze sentiment of feedback text', async () => {
      const { UserFeedbackSystem } = await import('../src/utils/user-feedback-system.js');
      feedbackSystem = new UserFeedbackSystem();

      const feedbackTexts = [
        {
          text: 'I absolutely love this extension! It saves me so much time.',
          expectedSentiment: 'positive',
          expectedScore: expect.any(Number)
        },
        {
          text: 'This feature is completely broken and frustrating to use.',
          expectedSentiment: 'negative',
          expectedScore: expect.any(Number)
        },
        {
          text: 'The extension works fine, nothing special.',
          expectedSentiment: 'neutral',
          expectedScore: expect.any(Number)
        },
        {
          text: 'Great automation but the UI could be better designed.',
          expectedSentiment: 'mixed',
          expectedScore: expect.any(Number)
        }
      ];

      for (const { text, expectedSentiment } of feedbackTexts) {
        const sentimentResult = await feedbackSystem.analyzeSentiment(text);

        expect(sentimentResult.sentiment).toBe(expectedSentiment);
        expect(sentimentResult.confidence).toBeGreaterThanOrEqual(0);
        expect(sentimentResult.confidence).toBeLessThanOrEqual(1);
        expect(sentimentResult.score).toBeGreaterThanOrEqual(-1);
        expect(sentimentResult.score).toBeLessThanOrEqual(1);
        expect(sentimentResult.emotions).toBeDefined();
        expect(sentimentResult.keywords).toBeDefined();

        expect(trackEvent).toHaveBeenCalledWith({
          type: 'sentiment_analyzed',
          sentiment: expectedSentiment,
          confidence: sentimentResult.confidence,
          textLength: text.length
        });
      }
    });

    test('should extract emotions and emotional intensity', async () => {
      const { UserFeedbackSystem } = await import('../src/utils/user-feedback-system.js');
      feedbackSystem = new UserFeedbackSystem();

      const emotionalTexts = [
        {
          text: 'I am extremely frustrated with the constant crashes!',
          expectedEmotions: ['anger', 'frustration'],
          primaryEmotion: 'frustration'
        },
        {
          text: 'So excited about the new features! Can\'t wait to try them.',
          expectedEmotions: ['joy', 'excitement'],
          primaryEmotion: 'excitement'
        },
        {
          text: 'I\'m worried this might not work with the new LinkedIn update.',
          expectedEmotions: ['fear', 'concern'],
          primaryEmotion: 'concern'
        }
      ];

      for (const { text, expectedEmotions, primaryEmotion } of emotionalTexts) {
        const emotionAnalysis = await feedbackSystem.analyzeEmotions(text);

        expect(emotionAnalysis.primaryEmotion).toBe(primaryEmotion);
        expect(emotionAnalysis.emotions).toEqual(
          expect.arrayContaining(expectedEmotions.map(emotion =>
            expect.objectContaining({
              emotion,
              intensity: expect.any(Number)
            })
          ))
        );
        expect(emotionAnalysis.emotionalIntensity).toBeGreaterThanOrEqual(0);
        expect(emotionAnalysis.emotionalIntensity).toBeLessThanOrEqual(1);
      }
    });

    test('should extract actionable insights from feedback', async () => {
      const { UserFeedbackSystem } = await import('../src/utils/user-feedback-system.js');
      feedbackSystem = new UserFeedbackSystem();

      const feedbackTexts = [
        {
          text: 'The automation is slow and sometimes freezes. Please fix the performance issues.',
          expectedInsights: {
            actionRequired: true,
            urgency: 'medium',
            category: 'performance',
            suggestedActions: ['performance_optimization', 'bug_fix']
          }
        },
        {
          text: 'Love the extension but wish it had dark mode and better notifications.',
          expectedInsights: {
            actionRequired: true,
            urgency: 'low',
            category: 'feature_request',
            suggestedActions: ['ui_enhancement', 'notification_improvement']
          }
        },
        {
          text: 'Everything works perfectly, no complaints!',
          expectedInsights: {
            actionRequired: false,
            urgency: 'none',
            category: 'positive_feedback',
            suggestedActions: []
          }
        }
      ];

      for (const { text, expectedInsights } of feedbackTexts) {
        const insights = await feedbackSystem.extractActionableInsights(text);

        expect(insights.actionRequired).toBe(expectedInsights.actionRequired);
        expect(insights.urgency).toBe(expectedInsights.urgency);
        expect(insights.category).toBe(expectedInsights.category);
        expect(insights.suggestedActions).toEqual(
          expect.arrayContaining(expectedInsights.suggestedActions)
        );
        expect(insights.topics).toBeDefined();
        expect(insights.mentions).toBeDefined();
      }
    });

    test('should handle multilingual sentiment analysis', async () => {
      const { UserFeedbackSystem } = await import('../src/utils/user-feedback-system.js');
      feedbackSystem = new UserFeedbackSystem();

      const multilingualTexts = [
        {
          text: 'Esta extensión es fantástica! Me encanta.',
          language: 'es',
          expectedSentiment: 'positive'
        },
        {
          text: 'Cette extension est terrible, elle ne fonctionne pas.',
          language: 'fr',
          expectedSentiment: 'negative'
        },
        {
          text: 'Die Erweiterung ist in Ordnung, aber könnte besser sein.',
          language: 'de',
          expectedSentiment: 'neutral'
        }
      ];

      for (const { text, language, expectedSentiment } of multilingualTexts) {
        const sentimentResult = await feedbackSystem.analyzeSentiment(text, { detectLanguage: true });

        expect(sentimentResult.detectedLanguage).toBe(language);
        expect(sentimentResult.sentiment).toBe(expectedSentiment);
        expect(sentimentResult.translatedText).toBeDefined();
        expect(sentimentResult.originalLanguage).toBe(language);
      }
    });
  });

  describe('Feedback Categorization and Prioritization', () => {
    test('should automatically categorize feedback by type and topic', async () => {
      const { UserFeedbackSystem } = await import('../src/utils/user-feedback-system.js');
      feedbackSystem = new UserFeedbackSystem();

      const feedbackSamples = [
        {
          text: 'The connection automation keeps failing and showing error messages.',
          expectedCategory: 'bug_report',
          expectedSubcategory: 'automation_error',
          expectedFeature: 'connection_automation'
        },
        {
          text: 'Would love to see bulk messaging capabilities for marketing campaigns.',
          expectedCategory: 'feature_request',
          expectedSubcategory: 'new_feature',
          expectedFeature: 'messaging'
        },
        {
          text: 'The UI is confusing and hard to navigate, especially the settings.',
          expectedCategory: 'usability_feedback',
          expectedSubcategory: 'ui_ux',
          expectedFeature: 'user_interface'
        },
        {
          text: 'Love the extension! Works perfectly and saves me hours every week.',
          expectedCategory: 'positive_feedback',
          expectedSubcategory: 'satisfaction',
          expectedFeature: 'general'
        }
      ];

      for (const sample of feedbackSamples) {
        const feedback = await feedbackSystem.collectFeedback({
          userId: 'user123',
          type: 'general_feedback',
          comment: sample.text
        });

        const categorization = await feedbackSystem.categorizeFeedback(feedback.feedbackId);

        expect(categorization.primaryCategory).toBe(sample.expectedCategory);
        expect(categorization.subcategory).toBe(sample.expectedSubcategory);
        expect(categorization.relatedFeature).toBe(sample.expectedFeature);
        expect(categorization.confidence).toBeGreaterThan(0.7);
        expect(categorization.tags).toBeDefined();

        expect(trackEvent).toHaveBeenCalledWith({
          type: 'feedback_categorized',
          feedbackId: feedback.feedbackId,
          category: sample.expectedCategory,
          subcategory: sample.expectedSubcategory,
          confidence: categorization.confidence
        });
      }
    });

    test('should prioritize feedback based on multiple factors', async () => {
      const { UserFeedbackSystem } = await import('../src/utils/user-feedback-system.js');
      feedbackSystem = new UserFeedbackSystem();

      const feedbackItems = [
        {
          text: 'Critical bug: Extension crashes and loses all data!',
          severity: 'critical',
          sentiment: 'negative',
          userTier: 'premium',
          expectedPriority: 'urgent'
        },
        {
          text: 'Nice feature request: Add export functionality.',
          severity: 'low',
          sentiment: 'positive',
          userTier: 'free',
          expectedPriority: 'low'
        },
        {
          text: 'Performance issues are frustrating paying customers.',
          severity: 'high',
          sentiment: 'negative',
          userTier: 'premium',
          expectedPriority: 'high'
        },
        {
          text: 'Minor UI suggestion for better alignment.',
          severity: 'low',
          sentiment: 'neutral',
          userTier: 'free',
          expectedPriority: 'low'
        }
      ];

      for (const item of feedbackItems) {
        const feedback = await feedbackSystem.collectFeedback({
          userId: 'user123',
          type: 'general_feedback',
          comment: item.text,
          userTier: item.userTier
        });

        const prioritization = await feedbackSystem.prioritizeFeedback(feedback.feedbackId);

        expect(prioritization.priority).toBe(item.expectedPriority);
        expect(prioritization.score).toBeGreaterThanOrEqual(0);
        expect(prioritization.score).toBeLessThanOrEqual(100);
        expect(prioritization.factors).toEqual(
          expect.objectContaining({
            severity: expect.any(Number),
            sentiment: expect.any(Number),
            userValue: expect.any(Number),
            frequency: expect.any(Number),
            businessImpact: expect.any(Number)
          })
        );
      }
    });

    test('should detect trending issues and patterns', async () => {
      const { UserFeedbackSystem } = await import('../src/utils/user-feedback-system.js');
      feedbackSystem = new UserFeedbackSystem();

      // Simulate multiple similar feedback items
      const similarIssues = [
        'The automation stopped working after the latest update',
        'Connection requests fail since the recent update',
        'Update broke the automation feature completely',
        'Automation not working since yesterday\'s update',
        'Latest version has automation bugs'
      ];

      const feedbackIds = [];
      for (let i = 0; i < similarIssues.length; i++) {
        const feedback = await feedbackSystem.collectFeedback({
          userId: `user${i}`,
          type: 'bug_report',
          comment: similarIssues[i]
        });
        feedbackIds.push(feedback.feedbackId);
      }

      const trendAnalysis = await feedbackSystem.detectTrendingIssues();

      expect(trendAnalysis.trends).toHaveLength(1);
      expect(trendAnalysis.trends[0]).toEqual(
        expect.objectContaining({
          issue: 'automation_update_failure',
          frequency: 5,
          severity: 'high',
          keywords: expect.arrayContaining(['automation', 'update', 'broken']),
          timeframe: expect.any(Object),
          affectedUsers: 5,
          businessImpact: 'high'
        })
      );
    });

    test('should cluster similar feedback for better analysis', async () => {
      const { UserFeedbackSystem } = await import('../src/utils/user-feedback-system.js');
      feedbackSystem = new UserFeedbackSystem();

      const feedbackGroups = [
        // Performance cluster
        ['The extension is very slow', 'Takes forever to load', 'Performance issues'],
        // UI cluster
        ['Hard to find settings', 'Confusing interface', 'UI is not intuitive'],
        // Feature request cluster
        ['Need dark mode', 'Want bulk actions', 'Missing export feature']
      ];

      const allFeedbackIds = [];
      for (const group of feedbackGroups) {
        for (const comment of group) {
          const feedback = await feedbackSystem.collectFeedback({
            userId: `user_${Math.random()}`,
            type: 'general_feedback',
            comment
          });
          allFeedbackIds.push(feedback.feedbackId);
        }
      }

      const clusters = await feedbackSystem.clusterSimilarFeedback(allFeedbackIds);

      expect(clusters).toHaveLength(3);
      expect(clusters[0].theme).toBeOneOf(['performance', 'ui', 'feature_request']);
      expect(clusters[0].feedbackItems).toHaveLength(3);
      expect(clusters[0].commonKeywords).toBeDefined();
      expect(clusters[0].representativeText).toBeDefined();
    });
  });

  describe('User Satisfaction Scoring and Trends', () => {
    test('should calculate user satisfaction scores', async () => {
      const { UserFeedbackSystem } = await import('../src/utils/user-feedback-system.js');
      feedbackSystem = new UserFeedbackSystem();

      const userFeedbackHistory = [
        { rating: 5, sentiment: 'positive', date: Date.now() - 86400000 * 1 },
        { rating: 4, sentiment: 'positive', date: Date.now() - 86400000 * 2 },
        { rating: 3, sentiment: 'neutral', date: Date.now() - 86400000 * 3 },
        { rating: 2, sentiment: 'negative', date: Date.now() - 86400000 * 4 },
        { rating: 4, sentiment: 'positive', date: Date.now() - 86400000 * 5 }
      ];

      for (const feedback of userFeedbackHistory) {
        await feedbackSystem.collectFeedback({
          userId: 'user123',
          type: 'satisfaction_survey',
          rating: feedback.rating,
          comment: `${feedback.sentiment} feedback`,
          timestamp: feedback.date
        });
      }

      const satisfactionScore = await feedbackSystem.calculateUserSatisfaction('user123');

      expect(satisfactionScore.overallScore).toBeGreaterThanOrEqual(0);
      expect(satisfactionScore.overallScore).toBeLessThanOrEqual(100);
      expect(satisfactionScore.trend).toBeOneOf(['improving', 'declining', 'stable']);
      expect(satisfactionScore.averageRating).toBeCloseTo(3.6, 1); // (5+4+3+2+4)/5
      expect(satisfactionScore.recentRating).toBeCloseTo(4.5, 1); // Recent trend
      expect(satisfactionScore.sentimentDistribution).toEqual(
        expect.objectContaining({
          positive: expect.any(Number),
          neutral: expect.any(Number),
          negative: expect.any(Number)
        })
      );
    });

    test('should track satisfaction trends over time', async () => {
      const { UserFeedbackSystem } = await import('../src/utils/user-feedback-system.js');
      feedbackSystem = new UserFeedbackSystem();

      // Simulate satisfaction data over several months
      const monthlyData = [
        { month: '2023-08', avgRating: 4.2, satisfaction: 82 },
        { month: '2023-09', avgRating: 4.0, satisfaction: 78 },
        { month: '2023-10', avgRating: 3.8, satisfaction: 74 },
        { month: '2023-11', avgRating: 4.1, satisfaction: 80 },
        { month: '2023-12', avgRating: 4.3, satisfaction: 84 }
      ];

      // Mock storage to return historical data
      getStorageData.mockResolvedValue({
        user_satisfaction: {
          historical: monthlyData
        }
      });

      const trendAnalysis = await feedbackSystem.analyzeSatisfactionTrends();

      expect(trendAnalysis.overallTrend).toBeOneOf(['improving', 'declining', 'stable']);
      expect(trendAnalysis.monthlyScores).toHaveLength(5);
      expect(trendAnalysis.trendDirection).toBeDefined();
      expect(trendAnalysis.volatility).toBeGreaterThanOrEqual(0);
      expect(trendAnalysis.seasonalPatterns).toBeDefined();
      expect(trendAnalysis.projectedNextMonth).toBeDefined();
    });

    test('should segment satisfaction by user demographics and behavior', async () => {
      const { UserFeedbackSystem } = await import('../src/utils/user-feedback-system.js');
      feedbackSystem = new UserFeedbackSystem();

      const userSegments = [
        { segment: 'premium_users', avgSatisfaction: 85, sampleSize: 150 },
        { segment: 'free_users', avgSatisfaction: 72, sampleSize: 800 },
        { segment: 'new_users', avgSatisfaction: 68, sampleSize: 200 },
        { segment: 'power_users', avgSatisfaction: 88, sampleSize: 50 }
      ];

      // Mock segmented satisfaction data
      getStorageData.mockResolvedValue({
        feedback_analytics: {
          segmentation: userSegments
        }
      });

      const segmentAnalysis = await feedbackSystem.analyzeSatisfactionBySegment();

      expect(segmentAnalysis.segments).toHaveLength(4);
      expect(segmentAnalysis.segments[0]).toEqual(
        expect.objectContaining({
          segment: 'premium_users',
          averageSatisfaction: 85,
          sampleSize: 150,
          satisfactionLevel: 'high' // 85+ is high
        })
      );

      expect(segmentAnalysis.insights).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'segment_comparison',
            finding: expect.stringContaining('premium_users'),
            recommendation: expect.any(String)
          })
        ])
      );
    });

    test('should calculate Net Promoter Score (NPS)', async () => {
      const { UserFeedbackSystem } = await import('../src/utils/user-feedback-system.js');
      feedbackSystem = new UserFeedbackSystem();

      const npsResponses = [
        { userId: 'user1', score: 9, likelihood: 'very_likely' },    // Promoter
        { userId: 'user2', score: 8, likelihood: 'likely' },        // Promoter
        { userId: 'user3', score: 7, likelihood: 'neutral' },       // Passive
        { userId: 'user4', score: 6, likelihood: 'neutral' },       // Passive
        { userId: 'user5', score: 4, likelihood: 'unlikely' },      // Detractor
        { userId: 'user6', score: 3, likelihood: 'very_unlikely' }, // Detractor
        { userId: 'user7', score: 10, likelihood: 'extremely_likely' }, // Promoter
        { userId: 'user8', score: 8, likelihood: 'likely' },        // Promoter
        { userId: 'user9', score: 5, likelihood: 'neutral' },       // Detractor
        { userId: 'user10', score: 9, likelihood: 'very_likely' }   // Promoter
      ];

      for (const response of npsResponses) {
        await feedbackSystem.collectFeedback({
          userId: response.userId,
          type: 'nps_survey',
          npsScore: response.score,
          likelihood: response.likelihood
        });
      }

      const npsAnalysis = await feedbackSystem.calculateNPS();

      expect(npsAnalysis.npsScore).toBeCloseTo(30, 0); // (5 promoters - 2 detractors) / 10 * 100 = 30
      expect(npsAnalysis.promoters).toBe(5);
      expect(npsAnalysis.passives).toBe(3);
      expect(npsAnalysis.detractors).toBe(2);
      expect(npsAnalysis.responseCount).toBe(10);
      expect(npsAnalysis.category).toBe('neutral'); // 0-30 is neutral
    });
  });

  describe('Privacy-Compliant Feedback Storage and Analysis', () => {
    test('should implement data retention policies', async () => {
      const { UserFeedbackSystem } = await import('../src/utils/user-feedback-system.js');
      feedbackSystem = new UserFeedbackSystem();

      const retentionPolicy = {
        personalFeedback: 365, // days
        anonymousFeedback: 1095, // 3 years
        aggregatedData: 'indefinite',
        sensitiveData: 90 // days
      };

      await feedbackSystem.setRetentionPolicy(retentionPolicy);

      // Create old feedback data
      const oldFeedback = await feedbackSystem.collectFeedback({
        userId: 'user123',
        type: 'personal_feedback',
        comment: 'Old feedback with personal info',
        timestamp: Date.now() - (400 * 24 * 60 * 60 * 1000) // 400 days old
      });

      const recentFeedback = await feedbackSystem.collectFeedback({
        userId: 'user123',
        type: 'personal_feedback',
        comment: 'Recent feedback',
        timestamp: Date.now() - (30 * 24 * 60 * 60 * 1000) // 30 days old
      });

      const cleanupResult = await feedbackSystem.cleanupExpiredData();

      expect(cleanupResult.deletedItems).toContain(oldFeedback.feedbackId);
      expect(cleanupResult.deletedItems).not.toContain(recentFeedback.feedbackId);
      expect(cleanupResult.deletedCount).toBe(1);
      expect(cleanupResult.retainedCount).toBe(1);

      expect(trackEvent).toHaveBeenCalledWith({
        type: 'data_cleanup_performed',
        deletedCount: 1,
        retainedCount: 1,
        policy: 'retention_policy'
      });
    });

    test('should handle GDPR data requests', async () => {
      const { UserFeedbackSystem } = await import('../src/utils/user-feedback-system.js');
      feedbackSystem = new UserFeedbackSystem();

      const userId = 'user123';

      // Create user feedback
      await feedbackSystem.collectFeedback({
        userId,
        type: 'feature_rating',
        rating: 4,
        comment: 'Good feature'
      });

      await feedbackSystem.collectFeedback({
        userId,
        type: 'bug_report',
        comment: 'Found a bug'
      });

      // Data export request
      const exportResult = await feedbackSystem.exportUserData(userId);

      expect(exportResult.userId).toBe(userId);
      expect(exportResult.feedbackItems).toHaveLength(2);
      expect(exportResult.format).toBe('json');
      expect(exportResult.exportDate).toBeDefined();
      expect(exportResult.dataTypes).toEqual(['feedback', 'ratings', 'comments']);

      // Data deletion request
      const deletionResult = await feedbackSystem.deleteUserData(userId);

      expect(deletionResult.userId).toBe(userId);
      expect(deletionResult.deletedItems).toBe(2);
      expect(deletionResult.anonymizedItems).toBe(0);
      expect(deletionResult.completedAt).toBeDefined();

      // Verify data is actually deleted
      const remainingData = await feedbackSystem.getUserFeedback(userId);
      expect(remainingData).toHaveLength(0);
    });

    test('should implement consent management', async () => {
      const { UserFeedbackSystem } = await import('../src/utils/user-feedback-system.js');
      feedbackSystem = new UserFeedbackSystem();

      const consentData = {
        userId: 'user123',
        consentTypes: {
          feedbackCollection: true,
          sentimentAnalysis: true,
          dataSharing: false,
          marketingUsage: false
        },
        consentDate: Date.now(),
        version: '1.0'
      };

      await feedbackSystem.recordConsent(consentData);

      // Try to collect feedback with different consent levels
      const feedbackWithConsent = await feedbackSystem.collectFeedback({
        userId: 'user123',
        type: 'feature_rating',
        rating: 4
      });

      expect(feedbackWithConsent.consentVerified).toBe(true);
      expect(feedbackWithConsent.allowedProcessing).toEqual(['feedbackCollection', 'sentimentAnalysis']);

      // Try to perform marketing analysis (should be blocked)
      const marketingAnalysis = await feedbackSystem.performMarketingAnalysis('user123');
      expect(marketingAnalysis.allowed).toBe(false);
      expect(marketingAnalysis.reason).toBe('marketing_consent_not_granted');
    });

    test('should anonymize data for aggregate analysis', async () => {
      const { UserFeedbackSystem } = await import('../src/utils/user-feedback-system.js');
      feedbackSystem = new UserFeedbackSystem();

      // Collect various feedback
      const feedbackItems = [];
      for (let i = 0; i < 10; i++) {
        const feedback = await feedbackSystem.collectFeedback({
          userId: `user${i}`,
          type: 'feature_rating',
          rating: Math.floor(Math.random() * 5) + 1,
          comment: `Feedback comment ${i}`
        });
        feedbackItems.push(feedback.feedbackId);
      }

      const aggregateAnalysis = await feedbackSystem.generateAggregateReport();

      expect(aggregateAnalysis.totalFeedback).toBe(10);
      expect(aggregateAnalysis.averageRating).toBeDefined();
      expect(aggregateAnalysis.sentimentDistribution).toBeDefined();
      expect(aggregateAnalysis.anonymized).toBe(true);
      expect(aggregateAnalysis.userIds).toBeUndefined(); // Should not include user IDs
      expect(aggregateAnalysis.personalData).toBeUndefined(); // Should not include personal data

      expect(aggregateAnalysis.insights).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: expect.any(String),
            finding: expect.any(String),
            dataPoints: expect.any(Number)
          })
        ])
      );
    });

    test('should audit data access and processing', async () => {
      const { UserFeedbackSystem } = await import('../src/utils/user-feedback-system.js');
      feedbackSystem = new UserFeedbackSystem();

      const userId = 'user123';

      // Perform various operations
      await feedbackSystem.collectFeedback({ userId, type: 'rating', rating: 4 });
      await feedbackSystem.getUserFeedback(userId);
      await feedbackSystem.analyzeSentiment('Test feedback');
      await feedbackSystem.exportUserData(userId);

      const auditLog = await feedbackSystem.getAuditLog(userId);

      expect(auditLog.userId).toBe(userId);
      expect(auditLog.operations).toHaveLength(4);
      expect(auditLog.operations[0]).toEqual(
        expect.objectContaining({
          operation: 'feedback_collection',
          timestamp: expect.any(Number),
          dataTypes: ['rating'],
          purpose: 'product_improvement'
        })
      );

      expect(auditLog.operations[3]).toEqual(
        expect.objectContaining({
          operation: 'data_export',
          timestamp: expect.any(Number),
          dataTypes: ['feedback', 'ratings', 'comments'],
          purpose: 'gdpr_request'
        })
      );
    });
  });
});