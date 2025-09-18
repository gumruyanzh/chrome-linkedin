// Tests for Analytics Engine - Data Aggregation and Calculation Accuracy

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { AnalyticsEngine, createAnalyticsEngine, getQuickAnalytics, ANALYTICS_TYPES } from '../src/utils/analytics-engine.js';

// Mock storage functions
jest.mock('../src/utils/storage.js', () => ({
  getStorageData: jest.fn(),
  setStorageData: jest.fn(),
  STORAGE_KEYS: {
    ANALYTICS: 'analytics',
    CAMPAIGNS: 'campaigns'
  }
}));

import { getStorageData, setStorageData } from '../src/utils/storage.js';

describe('AnalyticsEngine', () => {
  let engine;
  let testData;

  beforeEach(() => {
    jest.clearAllMocks();
    engine = new AnalyticsEngine();

    // Create test data
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    testData = [
      // Day 1 - 5 connections sent
      { type: ANALYTICS_TYPES.CONNECTION_SENT, timestamp: now - 2 * day, profileId: 'profile1', templateId: 'template1' },
      { type: ANALYTICS_TYPES.CONNECTION_SENT, timestamp: now - 2 * day + 1000, profileId: 'profile2', templateId: 'template1' },
      { type: ANALYTICS_TYPES.CONNECTION_SENT, timestamp: now - 2 * day + 2000, profileId: 'profile3', templateId: 'template2' },
      { type: ANALYTICS_TYPES.CONNECTION_SENT, timestamp: now - 2 * day + 3000, profileId: 'profile4', templateId: 'template2' },
      { type: ANALYTICS_TYPES.CONNECTION_SENT, timestamp: now - 2 * day + 4000, profileId: 'profile5', templateId: 'template1' },

      // Day 1 - 3 connections accepted
      { type: ANALYTICS_TYPES.CONNECTION_ACCEPTED, timestamp: now - 2 * day + 10000, profileId: 'profile1' },
      { type: ANALYTICS_TYPES.CONNECTION_ACCEPTED, timestamp: now - 2 * day + 11000, profileId: 'profile2' },
      { type: ANALYTICS_TYPES.CONNECTION_ACCEPTED, timestamp: now - 2 * day + 12000, profileId: 'profile3' },

      // Day 1 - 1 connection declined
      { type: ANALYTICS_TYPES.CONNECTION_DECLINED, timestamp: now - 2 * day + 13000, profileId: 'profile4' },

      // Day 2 - 3 connections sent
      { type: ANALYTICS_TYPES.CONNECTION_SENT, timestamp: now - day, profileId: 'profile6', templateId: 'template1' },
      { type: ANALYTICS_TYPES.CONNECTION_SENT, timestamp: now - day + 1000, profileId: 'profile7', templateId: 'template2' },
      { type: ANALYTICS_TYPES.CONNECTION_SENT, timestamp: now - day + 2000, profileId: 'profile8', templateId: 'template1' },

      // Day 2 - 2 connections accepted
      { type: ANALYTICS_TYPES.CONNECTION_ACCEPTED, timestamp: now - day + 10000, profileId: 'profile6' },
      { type: ANALYTICS_TYPES.CONNECTION_ACCEPTED, timestamp: now - day + 11000, profileId: 'profile7' },

      // Messages
      { type: ANALYTICS_TYPES.MESSAGE_SENT, timestamp: now - day + 20000, profileId: 'profile1', messageId: 'msg1' },
      { type: ANALYTICS_TYPES.MESSAGE_SENT, timestamp: now - day + 21000, profileId: 'profile2', messageId: 'msg2' },
      { type: ANALYTICS_TYPES.MESSAGE_SENT, timestamp: now - day + 22000, profileId: 'profile3', messageId: 'msg3' },

      // Responses (with delays for response time calculation)
      { type: ANALYTICS_TYPES.MESSAGE_RECEIVED, timestamp: now - day + 20000 + (2 * 60 * 60 * 1000), profileId: 'profile1', messageId: 'msg1' }, // 2 hour response
      { type: ANALYTICS_TYPES.MESSAGE_RECEIVED, timestamp: now - day + 21000 + (6 * 60 * 60 * 1000), profileId: 'profile2', messageId: 'msg2' }, // 6 hour response

      // Profile views
      { type: ANALYTICS_TYPES.PROFILE_VIEWED, timestamp: now - 2 * day, profileId: 'profile1' },
      { type: ANALYTICS_TYPES.PROFILE_VIEWED, timestamp: now - 2 * day + 500, profileId: 'profile2' },
      { type: ANALYTICS_TYPES.PROFILE_VIEWED, timestamp: now - day, profileId: 'profile6' },

      // Template usage
      { type: ANALYTICS_TYPES.TEMPLATE_USED, timestamp: now - 2 * day, templateId: 'template1', templateName: 'Professional Template', resultType: 'connection_sent' },
      { type: ANALYTICS_TYPES.TEMPLATE_USED, timestamp: now - 2 * day + 1000, templateId: 'template1', templateName: 'Professional Template', resultType: 'connection_accepted' },
      { type: ANALYTICS_TYPES.TEMPLATE_USED, timestamp: now - 2 * day + 2000, templateId: 'template2', templateName: 'Casual Template', resultType: 'connection_sent' },

      // Campaign data
      { type: ANALYTICS_TYPES.CAMPAIGN_STARTED, timestamp: now - 3 * day, campaignId: 'campaign1' },
      { type: ANALYTICS_TYPES.CAMPAIGN_COMPLETED, timestamp: now - day, campaignId: 'campaign1' }
    ];

    getStorageData.mockImplementation((key) => {
      if (key === 'analytics') {
        return Promise.resolve({ analytics: testData });
      }
      if (key === 'campaigns') {
        return Promise.resolve({
          campaigns: [
            {
              id: 'campaign1',
              name: 'Test Campaign',
              status: 'completed',
              createdAt: now - 3 * day,
              completedAt: now - day
            }
          ]
        });
      }
      return Promise.resolve({});
    });
  });

  describe('Data Aggregation', () => {
    test('should correctly filter data by date range', async () => {
      const now = Date.now();
      const day = 24 * 60 * 60 * 1000;

      const data = await engine.getRawAnalyticsData(now - 2 * day, now - day);

      // Should include data from 2 days ago and 1 day ago, but not today
      expect(data.length).toBeGreaterThan(0);
      expect(data.every(entry =>
        entry.timestamp >= now - 2 * day && entry.timestamp <= now - day
      )).toBe(true);
    });

    test('should group data by time periods correctly', () => {
      const now = Date.now();
      const day = 24 * 60 * 60 * 1000;

      const sampleData = [
        { timestamp: now, type: 'test' },
        { timestamp: now - day, type: 'test' },
        { timestamp: now - 2 * day, type: 'test' }
      ];

      // Test daily grouping
      const dailyGrouped = engine.groupDataByTime(sampleData, 'day');
      expect(Object.keys(dailyGrouped)).toHaveLength(3);

      // Test weekly grouping
      const weeklyGrouped = engine.groupDataByTime(sampleData, 'week');
      expect(Object.keys(weeklyGrouped).length).toBeGreaterThan(0);
    });

    test('should handle empty data gracefully', async () => {
      getStorageData.mockResolvedValueOnce({ analytics: [] });

      const analytics = await engine.calculateAnalytics();

      expect(analytics.summary.totalConnections).toBe(0);
      expect(analytics.summary.acceptanceRate).toBe(0);
      expect(analytics.timeSeries).toBeDefined();
    });
  });

  describe('Summary Metrics Calculation', () => {
    test('should calculate connection metrics accurately', async () => {
      const summary = await engine.calculateSummaryMetrics(testData);

      expect(summary.totalConnections).toBe(8); // 5 + 3 connections sent
      expect(summary.acceptedConnections).toBe(5); // 3 + 2 connections accepted
      expect(summary.declinedConnections).toBe(1);
      expect(summary.pendingConnections).toBe(2); // 8 - 5 - 1 = 2
    });

    test('should calculate acceptance rate correctly', async () => {
      const summary = await engine.calculateSummaryMetrics(testData);

      // 5 accepted / 8 total = 62.5%
      expect(summary.acceptanceRate).toBe(62.5);
    });

    test('should calculate message metrics accurately', async () => {
      const summary = await engine.calculateSummaryMetrics(testData);

      expect(summary.totalMessages).toBe(3);
      expect(summary.receivedResponses).toBe(2);
      expect(summary.responseRate).toBe(66.67); // 2/3 * 100, rounded to 2 decimals
    });

    test('should calculate daily averages correctly', async () => {
      const summary = await engine.calculateSummaryMetrics(testData);

      // Should calculate based on the time span of the data
      expect(summary.averageConnectionsPerDay).toBeGreaterThan(0);
      expect(summary.averageMessagesPerDay).toBeGreaterThan(0);
    });
  });

  describe('Performance Metrics Calculation', () => {
    test('should calculate hourly acceptance rates', async () => {
      const performance = await engine.calculatePerformanceMetrics(testData);

      expect(performance.hourlyAcceptance).toHaveLength(24);
      expect(performance.hourlyAcceptance.every(hour =>
        typeof hour.hour === 'number' &&
        typeof hour.connections === 'number' &&
        typeof hour.accepted === 'number' &&
        typeof hour.rate === 'number'
      )).toBe(true);
    });

    test('should calculate daily acceptance rates', async () => {
      const performance = await engine.calculatePerformanceMetrics(testData);

      expect(performance.dailyAcceptance).toHaveLength(7);
      expect(performance.dailyAcceptance.every(day =>
        typeof day.day === 'number' &&
        typeof day.dayName === 'string' &&
        typeof day.connections === 'number' &&
        typeof day.accepted === 'number' &&
        typeof day.rate === 'number'
      )).toBe(true);
    });

    test('should identify best performing time periods', async () => {
      const performance = await engine.calculatePerformanceMetrics(testData);

      expect(performance.bestHour).toBeDefined();
      expect(performance.bestHour.hour).toBeGreaterThanOrEqual(0);
      expect(performance.bestHour.hour).toBeLessThan(24);

      expect(performance.bestDay).toBeDefined();
      expect(performance.bestDay.day).toBeGreaterThanOrEqual(0);
      expect(performance.bestDay.day).toBeLessThan(7);
    });
  });

  describe('Engagement Metrics Calculation', () => {
    test('should calculate engagement funnel correctly', async () => {
      const engagement = await engine.calculateEngagementMetrics(testData);

      expect(engagement.profileViews).toBe(3);
      expect(engagement.viewToConnectionRate).toBeCloseTo(266.67, 1); // 8 connections / 3 views * 100
      expect(engagement.connectionToMessageRate).toBe(37.5); // 3 messages / 8 connections * 100
    });

    test('should calculate response time metrics', async () => {
      const engagement = await engine.calculateEngagementMetrics(testData);

      expect(engagement.averageResponseTime).toBeGreaterThan(0);
      expect(engagement.responseTimeDistribution).toBeDefined();
      expect(typeof engagement.responseTimeDistribution['< 1 hour']).toBe('number');
      expect(typeof engagement.responseTimeDistribution['1-6 hours']).toBe('number');
    });

    test('should calculate engagement score', async () => {
      const engagement = await engine.calculateEngagementMetrics(testData);

      expect(engagement.engagementScore).toBeGreaterThanOrEqual(0);
      expect(engagement.engagementScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Conversion Metrics Calculation', () => {
    test('should create conversion funnel correctly', async () => {
      const conversion = await engine.calculateConversionMetrics(testData);

      expect(conversion.conversionFunnel).toHaveLength(4);
      expect(conversion.conversionFunnel[0].name).toBe('Connections Sent');
      expect(conversion.conversionFunnel[0].rate).toBe(100);

      // Check that rates decrease down the funnel
      for (let i = 1; i < conversion.conversionFunnel.length; i++) {
        expect(conversion.conversionFunnel[i].rate).toBeLessThanOrEqual(conversion.conversionFunnel[i-1].rate);
      }
    });

    test('should calculate total conversion rate', async () => {
      const conversion = await engine.calculateConversionMetrics(testData);

      // 2 responses / 8 connections = 25%
      expect(conversion.totalConversionRate).toBe(25);
    });

    test('should analyze drop-off between stages', async () => {
      const conversion = await engine.calculateConversionMetrics(testData);

      expect(conversion.dropOffAnalysis).toBeDefined();
      expect(Array.isArray(conversion.dropOffAnalysis)).toBe(true);
      expect(conversion.dropOffAnalysis.length).toBe(3); // 4 stages - 1 = 3 transitions
    });
  });

  describe('Template Metrics Calculation', () => {
    test('should analyze template performance', async () => {
      const templates = await engine.calculateTemplateMetrics(testData);

      expect(templates.totalTemplates).toBeGreaterThan(0);
      expect(templates.templatePerformance).toBeDefined();
      expect(Array.isArray(templates.templatePerformance)).toBe(true);
    });

    test('should identify best performing template', async () => {
      const templates = await engine.calculateTemplateMetrics(testData);

      expect(templates.bestPerformingTemplate).toBeDefined();
      expect(typeof templates.bestPerformingTemplate.acceptanceRate).toBe('number');
    });

    test('should sort templates by usage', async () => {
      const templates = await engine.calculateTemplateMetrics(testData);

      // Check that templates are sorted by usage (descending)
      for (let i = 1; i < templates.templatePerformance.length; i++) {
        expect(templates.templatePerformance[i].usage).toBeLessThanOrEqual(templates.templatePerformance[i-1].usage);
      }
    });
  });

  describe('Campaign Metrics Calculation', () => {
    test('should calculate campaign statistics', async () => {
      const campaigns = await engine.calculateCampaignMetrics(testData);

      expect(campaigns.totalCampaigns).toBe(1);
      expect(campaigns.completedCampaigns).toBe(1);
      expect(campaigns.activeCampaigns).toBe(0);
    });

    test('should calculate campaign performance', async () => {
      const campaigns = await engine.calculateCampaignMetrics(testData);

      expect(campaigns.campaignPerformance).toHaveLength(1);
      expect(campaigns.campaignPerformance[0].id).toBe('campaign1');
      expect(campaigns.campaignPerformance[0].name).toBe('Test Campaign');
    });

    test('should calculate average campaign duration', async () => {
      const campaigns = await engine.calculateCampaignMetrics(testData);

      expect(campaigns.averageCampaignDuration).toBeGreaterThan(0);
    });
  });

  describe('Time Series Data', () => {
    test('should generate time series for all analytics types', async () => {
      const timeSeries = await engine.calculateTimeSeriesData(testData, 'day');

      Object.keys(ANALYTICS_TYPES).forEach(type => {
        const seriesKey = type.toLowerCase();
        expect(timeSeries[seriesKey]).toBeDefined();
        expect(Array.isArray(timeSeries[seriesKey])).toBe(true);

        // Check data structure
        if (timeSeries[seriesKey].length > 0) {
          expect(timeSeries[seriesKey][0]).toHaveProperty('timestamp');
          expect(timeSeries[seriesKey][0]).toHaveProperty('date');
          expect(timeSeries[seriesKey][0]).toHaveProperty('value');
        }
      });
    });

    test('should group data by different time periods', async () => {
      const hourlyData = await engine.calculateTimeSeriesData(testData, 'hour');
      const dailyData = await engine.calculateTimeSeriesData(testData, 'day');
      const weeklyData = await engine.calculateTimeSeriesData(testData, 'week');

      expect(hourlyData.connection_sent).toBeDefined();
      expect(dailyData.connection_sent).toBeDefined();
      expect(weeklyData.connection_sent).toBeDefined();
    });
  });

  describe('Insights Generation', () => {
    test('should generate insights based on data trends', async () => {
      const insights = await engine.generateInsights(testData);

      expect(insights.insights).toBeDefined();
      expect(Array.isArray(insights.insights)).toBe(true);
      expect(insights.recommendations).toBeDefined();
      expect(Array.isArray(insights.recommendations)).toBe(true);
      expect(insights.keyMetrics).toBeDefined();
    });

    test('should calculate week-over-week growth', async () => {
      const insights = await engine.generateInsights(testData);

      expect(typeof insights.keyMetrics.weekOverWeekGrowth).toBe('number');
      expect(typeof insights.keyMetrics.acceptanceRate).toBe('number');
      expect(typeof insights.keyMetrics.totalActivity).toBe('number');
    });

    test('should provide actionable recommendations', async () => {
      // Create data that would trigger recommendations
      const lowPerformanceData = [
        { type: ANALYTICS_TYPES.CONNECTION_SENT, timestamp: Date.now() - 86400000, profileId: 'profile1' },
        { type: ANALYTICS_TYPES.CONNECTION_SENT, timestamp: Date.now() - 86400000 + 1000, profileId: 'profile2' },
        { type: ANALYTICS_TYPES.CONNECTION_SENT, timestamp: Date.now() - 86400000 + 2000, profileId: 'profile3' },
        { type: ANALYTICS_TYPES.CONNECTION_SENT, timestamp: Date.now() - 86400000 + 3000, profileId: 'profile4' },
        { type: ANALYTICS_TYPES.CONNECTION_SENT, timestamp: Date.now() - 86400000 + 4000, profileId: 'profile5' }
        // No acceptances - low acceptance rate
      ];

      const insights = await engine.generateInsights(lowPerformanceData);

      // Should have recommendations for low acceptance rate
      expect(insights.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Caching System', () => {
    test('should cache results for performance', async () => {
      const options = { startDate: Date.now() - 86400000, endDate: Date.now() };

      // First call
      const result1 = await engine.calculateAnalytics(options);

      // Second call should use cache
      const result2 = await engine.calculateAnalytics(options);

      expect(result1).toEqual(result2);
      expect(engine.cache.size).toBeGreaterThan(0);
    });

    test('should bypass cache for real-time data', async () => {
      const options = {
        startDate: Date.now() - 86400000,
        endDate: Date.now(),
        includeRealTime: true
      };

      await engine.calculateAnalytics(options);

      // Cache should not be used for real-time data
      expect(engine.cache.size).toBe(0);
    });

    test('should clear cache when requested', () => {
      engine.cache.set('test', { data: 'test', timestamp: Date.now() });
      expect(engine.cache.size).toBe(1);

      engine.clearCache();
      expect(engine.cache.size).toBe(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle storage errors gracefully', async () => {
      getStorageData.mockRejectedValueOnce(new Error('Storage error'));

      const data = await engine.getRawAnalyticsData(Date.now() - 86400000, Date.now());
      expect(data).toEqual([]);
    });

    test('should handle calculation errors', async () => {
      getStorageData.mockResolvedValueOnce({ analytics: 'invalid data' });

      const analytics = await engine.calculateAnalytics();
      // Should handle invalid data gracefully and return empty results
      expect(analytics.summary.totalConnections).toBe(0);
    });

    test('should validate input parameters', async () => {
      const invalidOptions = { startDate: 'invalid', endDate: 'invalid' };

      const analytics = await engine.calculateAnalytics(invalidOptions);
      // Should handle invalid dates gracefully
      expect(analytics).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    test('should handle data with missing fields', async () => {
      const incompleteData = [
        { type: ANALYTICS_TYPES.CONNECTION_SENT, timestamp: Date.now() },
        { type: ANALYTICS_TYPES.CONNECTION_ACCEPTED }, // Missing timestamp
        { timestamp: Date.now() } // Missing type
      ];

      getStorageData.mockResolvedValueOnce({ analytics: incompleteData });

      const analytics = await engine.calculateAnalytics();
      expect(analytics).toBeDefined();
    });

    test('should handle very large datasets', async () => {
      // Create large dataset
      const largeData = Array.from({ length: 10000 }, (_, i) => ({
        type: ANALYTICS_TYPES.CONNECTION_SENT,
        timestamp: Date.now() - (i * 1000),
        profileId: `profile${i}`
      }));

      getStorageData.mockResolvedValueOnce({ analytics: largeData });

      const analytics = await engine.calculateAnalytics();
      expect(analytics.summary.totalConnections).toBe(10000);
    });

    test('should handle future timestamps', async () => {
      const futureData = [
        { type: ANALYTICS_TYPES.CONNECTION_SENT, timestamp: Date.now() + 86400000, profileId: 'future1' }
      ];

      getStorageData.mockResolvedValueOnce({ analytics: futureData });

      const analytics = await engine.calculateAnalytics({
        startDate: Date.now() - 86400000,
        endDate: Date.now() + 2 * 86400000
      });

      expect(analytics.summary.totalConnections).toBe(1);
    });
  });
});

describe('Factory Functions', () => {
  test('should create analytics engine instance', () => {
    const engine = createAnalyticsEngine();
    expect(engine).toBeInstanceOf(AnalyticsEngine);
  });

  test('should get quick analytics', async () => {
    getStorageData.mockResolvedValueOnce({ analytics: [] });

    const quickAnalytics = await getQuickAnalytics();
    expect(quickAnalytics).toBeDefined();
    expect(quickAnalytics.summary).toBeDefined();
  });
});

describe('Mathematical Accuracy', () => {
  let mathEngine;

  beforeEach(() => {
    mathEngine = new AnalyticsEngine();
  });

  test('should calculate percentages correctly', async () => {
    const testCases = [
      { accepted: 0, total: 0, expected: 0 },
      { accepted: 1, total: 1, expected: 100 },
      { accepted: 1, total: 3, expected: 33.33 },
      { accepted: 2, total: 3, expected: 66.67 },
      { accepted: 5, total: 8, expected: 62.5 }
    ];

    for (const testCase of testCases) {
      const testData = [
        ...Array.from({ length: testCase.total }, (_, i) => ({
          type: ANALYTICS_TYPES.CONNECTION_SENT,
          timestamp: Date.now(),
          profileId: `profile${i}`
        })),
        ...Array.from({ length: testCase.accepted }, (_, i) => ({
          type: ANALYTICS_TYPES.CONNECTION_ACCEPTED,
          timestamp: Date.now(),
          profileId: `profile${i}`
        }))
      ];

      const summary = await mathEngine.calculateSummaryMetrics(testData);
      expect(summary.acceptanceRate).toBe(testCase.expected);
    }
  });

  test('should handle floating point precision', async () => {
    // Test case that might cause floating point issues
    const testData = Array.from({ length: 7 }, (_, i) => ({
      type: ANALYTICS_TYPES.CONNECTION_SENT,
      timestamp: Date.now(),
      profileId: `profile${i}`
    })).concat([
      { type: ANALYTICS_TYPES.CONNECTION_ACCEPTED, timestamp: Date.now(), profileId: 'profile0' },
      { type: ANALYTICS_TYPES.CONNECTION_ACCEPTED, timestamp: Date.now(), profileId: 'profile1' }
    ]);

    const summary = await mathEngine.calculateSummaryMetrics(testData);
    // 2/7 = 0.2857... should be rounded to 28.57
    expect(summary.acceptanceRate).toBe(28.57);
  });
});