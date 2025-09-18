// Advanced Analytics Engine for LinkedIn Automation
// Provides comprehensive data aggregation, calculation, and insights

import { getStorageData, setStorageData, STORAGE_KEYS } from './storage.js';

/**
 * Analytics data types and structures
 */
export const ANALYTICS_TYPES = {
  CONNECTION_SENT: 'connection_sent',
  CONNECTION_ACCEPTED: 'connection_accepted',
  CONNECTION_DECLINED: 'connection_declined',
  MESSAGE_SENT: 'message_sent',
  MESSAGE_RECEIVED: 'message_received',
  PROFILE_VIEWED: 'profile_viewed',
  CAMPAIGN_STARTED: 'campaign_started',
  CAMPAIGN_COMPLETED: 'campaign_completed',
  TEMPLATE_USED: 'template_used',
  SEARCH_PERFORMED: 'search_performed'
};

/**
 * Analytics metrics calculator
 */
export class AnalyticsEngine {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Calculate comprehensive analytics for a date range
   * @param {Object} options - Calculation options
   * @returns {Promise<Object>} Analytics data
   */
  async calculateAnalytics(options = {}) {
    try {
      const {
        startDate = Date.now() - (30 * 24 * 60 * 60 * 1000), // 30 days ago
        endDate = Date.now(),
        includeRealTime = false,
        groupBy = 'day',
        metrics = 'all'
      } = options;

      const cacheKey = this.generateCacheKey(options);

      // Check cache first
      if (!includeRealTime && this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data;
        }
      }

      // Get raw analytics data
      const rawData = await this.getRawAnalyticsData(startDate, endDate);

      // Calculate metrics
      const analytics = {
        summary: await this.calculateSummaryMetrics(rawData),
        timeSeries: await this.calculateTimeSeriesData(rawData, groupBy),
        performance: await this.calculatePerformanceMetrics(rawData),
        engagement: await this.calculateEngagementMetrics(rawData),
        conversion: await this.calculateConversionMetrics(rawData),
        templates: await this.calculateTemplateMetrics(rawData),
        campaigns: await this.calculateCampaignMetrics(rawData),
        insights: await this.generateInsights(rawData)
      };

      // Cache the results
      if (!includeRealTime) {
        this.cache.set(cacheKey, {
          data: analytics,
          timestamp: Date.now()
        });
      }

      return analytics;

    } catch (error) {
      console.error('Error calculating analytics:', error);
      throw new Error(`Analytics calculation failed: ${error.message}`);
    }
  }

  /**
   * Get raw analytics data from storage
   * @param {number} startDate - Start timestamp
   * @param {number} endDate - End timestamp
   * @returns {Promise<Array>} Raw analytics data
   */
  async getRawAnalyticsData(startDate, endDate) {
    try {
      const result = await getStorageData(STORAGE_KEYS.ANALYTICS);
      const analytics = result.analytics || [];

      return analytics.filter(entry =>
        entry.timestamp >= startDate &&
        entry.timestamp <= endDate
      );
    } catch (error) {
      console.error('Error getting raw analytics data:', error);
      return [];
    }
  }

  /**
   * Calculate summary metrics
   * @param {Array} data - Raw analytics data
   * @returns {Promise<Object>} Summary metrics
   */
  async calculateSummaryMetrics(data) {
    const connections = data.filter(entry => entry.type === ANALYTICS_TYPES.CONNECTION_SENT);
    const accepted = data.filter(entry => entry.type === ANALYTICS_TYPES.CONNECTION_ACCEPTED);
    const declined = data.filter(entry => entry.type === ANALYTICS_TYPES.CONNECTION_DECLINED);
    const messages = data.filter(entry => entry.type === ANALYTICS_TYPES.MESSAGE_SENT);
    const responses = data.filter(entry => entry.type === ANALYTICS_TYPES.MESSAGE_RECEIVED);

    const acceptanceRate = connections.length > 0 ?
      (accepted.length / connections.length) * 100 : 0;

    const responseRate = messages.length > 0 ?
      (responses.length / messages.length) * 100 : 0;

    return {
      totalConnections: connections.length,
      acceptedConnections: accepted.length,
      declinedConnections: declined.length,
      pendingConnections: connections.length - accepted.length - declined.length,
      acceptanceRate: Math.round(acceptanceRate * 100) / 100,
      totalMessages: messages.length,
      receivedResponses: responses.length,
      responseRate: Math.round(responseRate * 100) / 100,
      averageConnectionsPerDay: this.calculateDailyAverage(connections),
      averageMessagesPerDay: this.calculateDailyAverage(messages)
    };
  }

  /**
   * Calculate time series data
   * @param {Array} data - Raw analytics data
   * @param {string} groupBy - Grouping period (hour, day, week, month)
   * @returns {Promise<Object>} Time series data
   */
  async calculateTimeSeriesData(data, groupBy) {
    const groupedData = this.groupDataByTime(data, groupBy);
    const series = {};

    Object.keys(ANALYTICS_TYPES).forEach(type => {
      series[type.toLowerCase()] = [];
    });

    Object.entries(groupedData).forEach(([timestamp, entries]) => {
      const date = new Date(parseInt(timestamp));

      Object.keys(ANALYTICS_TYPES).forEach(type => {
        const count = entries.filter(entry =>
          entry.type === ANALYTICS_TYPES[type]
        ).length;

        series[type.toLowerCase()].push({
          timestamp: parseInt(timestamp),
          date: date.toISOString(),
          value: count
        });
      });
    });

    return series;
  }

  /**
   * Calculate performance metrics
   * @param {Array} data - Raw analytics data
   * @returns {Promise<Object>} Performance metrics
   */
  async calculatePerformanceMetrics(data) {
    const connections = data.filter(entry => entry.type === ANALYTICS_TYPES.CONNECTION_SENT);
    const accepted = data.filter(entry => entry.type === ANALYTICS_TYPES.CONNECTION_ACCEPTED);

    // Calculate acceptance rate by time of day
    const hourlyAcceptance = Array.from({ length: 24 }, (_, hour) => {
      const hourConnections = connections.filter(entry =>
        new Date(entry.timestamp).getHours() === hour
      );
      const hourAccepted = accepted.filter(entry =>
        new Date(entry.timestamp).getHours() === hour
      );

      return {
        hour,
        connections: hourConnections.length,
        accepted: hourAccepted.length,
        rate: hourConnections.length > 0 ?
          (hourAccepted.length / hourConnections.length) * 100 : 0
      };
    });

    // Calculate acceptance rate by day of week
    const dailyAcceptance = Array.from({ length: 7 }, (_, day) => {
      const dayConnections = connections.filter(entry =>
        new Date(entry.timestamp).getDay() === day
      );
      const dayAccepted = accepted.filter(entry =>
        new Date(entry.timestamp).getDay() === day
      );

      return {
        day,
        dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day],
        connections: dayConnections.length,
        accepted: dayAccepted.length,
        rate: dayConnections.length > 0 ?
          (dayAccepted.length / dayConnections.length) * 100 : 0
      };
    });

    return {
      hourlyAcceptance,
      dailyAcceptance,
      bestHour: hourlyAcceptance.reduce((best, current) =>
        current.rate > best.rate ? current : best
      ),
      bestDay: dailyAcceptance.reduce((best, current) =>
        current.rate > best.rate ? current : best
      )
    };
  }

  /**
   * Calculate engagement metrics
   * @param {Array} data - Raw analytics data
   * @returns {Promise<Object>} Engagement metrics
   */
  async calculateEngagementMetrics(data) {
    const profileViews = data.filter(entry => entry.type === ANALYTICS_TYPES.PROFILE_VIEWED);
    const connections = data.filter(entry => entry.type === ANALYTICS_TYPES.CONNECTION_SENT);
    const messages = data.filter(entry => entry.type === ANALYTICS_TYPES.MESSAGE_SENT);
    const responses = data.filter(entry => entry.type === ANALYTICS_TYPES.MESSAGE_RECEIVED);

    // Calculate engagement funnel
    const viewToConnectionRate = profileViews.length > 0 ?
      (connections.length / profileViews.length) * 100 : 0;

    const connectionToMessageRate = connections.length > 0 ?
      (messages.length / connections.length) * 100 : 0;

    // Calculate response time analysis
    const responseTimeAnalysis = await this.calculateResponseTimeMetrics(data);

    return {
      profileViews: profileViews.length,
      viewToConnectionRate: Math.round(viewToConnectionRate * 100) / 100,
      connectionToMessageRate: Math.round(connectionToMessageRate * 100) / 100,
      averageResponseTime: responseTimeAnalysis.averageResponseTime,
      responseTimeDistribution: responseTimeAnalysis.distribution,
      engagementScore: this.calculateEngagementScore({
        profileViews: profileViews.length,
        connections: connections.length,
        messages: messages.length,
        responses: responses.length
      })
    };
  }

  /**
   * Calculate conversion metrics
   * @param {Array} data - Raw analytics data
   * @returns {Promise<Object>} Conversion metrics
   */
  async calculateConversionMetrics(data) {
    const connections = data.filter(entry => entry.type === ANALYTICS_TYPES.CONNECTION_SENT);
    const accepted = data.filter(entry => entry.type === ANALYTICS_TYPES.CONNECTION_ACCEPTED);
    const messages = data.filter(entry => entry.type === ANALYTICS_TYPES.MESSAGE_SENT);
    const responses = data.filter(entry => entry.type === ANALYTICS_TYPES.MESSAGE_RECEIVED);

    // Calculate conversion funnel
    const stages = [
      { name: 'Connections Sent', count: connections.length },
      { name: 'Connections Accepted', count: accepted.length },
      { name: 'Messages Sent', count: messages.length },
      { name: 'Responses Received', count: responses.length }
    ];

    // Calculate conversion rates between stages
    const conversionRates = stages.map((stage, index) => {
      if (index === 0) return { ...stage, rate: 100 };

      const rate = stages[0].count > 0 ?
        (stage.count / stages[0].count) * 100 : 0;

      return {
        ...stage,
        rate: Math.round(rate * 100) / 100
      };
    });

    return {
      conversionFunnel: conversionRates,
      totalConversionRate: connections.length > 0 ?
        (responses.length / connections.length) * 100 : 0,
      dropOffAnalysis: this.calculateDropOffAnalysis(conversionRates)
    };
  }

  /**
   * Calculate template performance metrics
   * @param {Array} data - Raw analytics data
   * @returns {Promise<Object>} Template metrics
   */
  async calculateTemplateMetrics(data) {
    const templateUsage = data.filter(entry => entry.type === ANALYTICS_TYPES.TEMPLATE_USED);

    // Group by template ID
    const templateStats = templateUsage.reduce((stats, entry) => {
      const templateId = entry.templateId || 'unknown';

      if (!stats[templateId]) {
        stats[templateId] = {
          id: templateId,
          name: entry.templateName || 'Unknown Template',
          usage: 0,
          connections: 0,
          accepted: 0,
          responses: 0
        };
      }

      stats[templateId].usage++;

      // Count related metrics
      if (entry.resultType === 'connection_sent') stats[templateId].connections++;
      if (entry.resultType === 'connection_accepted') stats[templateId].accepted++;
      if (entry.resultType === 'message_response') stats[templateId].responses++;

      return stats;
    }, {});

    // Calculate performance for each template
    const templatePerformance = Object.values(templateStats).map(template => ({
      ...template,
      acceptanceRate: template.connections > 0 ?
        (template.accepted / template.connections) * 100 : 0,
      responseRate: template.usage > 0 ?
        (template.responses / template.usage) * 100 : 0
    }));

    return {
      totalTemplates: Object.keys(templateStats).length,
      templatePerformance: templatePerformance.sort((a, b) => b.usage - a.usage),
      bestPerformingTemplate: templatePerformance.reduce((best, current) =>
        current.acceptanceRate > best.acceptanceRate ? current : best,
        { acceptanceRate: 0 }
      )
    };
  }

  /**
   * Calculate campaign metrics
   * @param {Array} data - Raw analytics data
   * @returns {Promise<Object>} Campaign metrics
   */
  async calculateCampaignMetrics(data) {
    const campaignStarts = data.filter(entry => entry.type === ANALYTICS_TYPES.CAMPAIGN_STARTED);
    const campaignCompletes = data.filter(entry => entry.type === ANALYTICS_TYPES.CAMPAIGN_COMPLETED);

    // Get campaign data from storage
    const campaignsResult = await getStorageData(STORAGE_KEYS.CAMPAIGNS);
    const campaigns = campaignsResult.campaigns || [];

    const campaignStats = campaigns.map(campaign => {
      const campaignData = data.filter(entry => entry.campaignId === campaign.id);
      const connections = campaignData.filter(entry => entry.type === ANALYTICS_TYPES.CONNECTION_SENT);
      const accepted = campaignData.filter(entry => entry.type === ANALYTICS_TYPES.CONNECTION_ACCEPTED);

      return {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        connections: connections.length,
        accepted: accepted.length,
        acceptanceRate: connections.length > 0 ?
          (accepted.length / connections.length) * 100 : 0,
        startDate: campaign.createdAt,
        duration: campaign.completedAt ?
          campaign.completedAt - campaign.createdAt :
          Date.now() - campaign.createdAt
      };
    });

    return {
      totalCampaigns: campaigns.length,
      activeCampaigns: campaignStats.filter(c => c.status === 'active').length,
      completedCampaigns: campaignStats.filter(c => c.status === 'completed').length,
      campaignPerformance: campaignStats.sort((a, b) => b.acceptanceRate - a.acceptanceRate),
      averageCampaignDuration: this.calculateAverageDuration(campaignStats)
    };
  }

  /**
   * Generate insights and recommendations
   * @param {Array} data - Raw analytics data
   * @returns {Promise<Object>} Insights and recommendations
   */
  async generateInsights(data) {
    const insights = [];
    const recommendations = [];

    // Analyze trends
    const connections = data.filter(entry => entry.type === ANALYTICS_TYPES.CONNECTION_SENT);
    const accepted = data.filter(entry => entry.type === ANALYTICS_TYPES.CONNECTION_ACCEPTED);

    // Time-based insights
    const recentData = data.filter(entry =>
      entry.timestamp >= Date.now() - (7 * 24 * 60 * 60 * 1000)
    );
    const previousData = data.filter(entry =>
      entry.timestamp >= Date.now() - (14 * 24 * 60 * 60 * 1000) &&
      entry.timestamp < Date.now() - (7 * 24 * 60 * 60 * 1000)
    );

    const recentConnections = recentData.filter(entry => entry.type === ANALYTICS_TYPES.CONNECTION_SENT).length;
    const previousConnections = previousData.filter(entry => entry.type === ANALYTICS_TYPES.CONNECTION_SENT).length;

    if (recentConnections > previousConnections * 1.2) {
      insights.push({
        type: 'positive',
        title: 'Increased Activity',
        description: `Connection requests increased by ${Math.round(((recentConnections - previousConnections) / previousConnections) * 100)}% this week`
      });
    } else if (recentConnections < previousConnections * 0.8) {
      insights.push({
        type: 'warning',
        title: 'Decreased Activity',
        description: `Connection requests decreased by ${Math.round(((previousConnections - recentConnections) / previousConnections) * 100)}% this week`
      });
      recommendations.push({
        title: 'Increase Activity',
        description: 'Consider adjusting your automation schedule or expanding your target criteria'
      });
    }

    // Acceptance rate insights
    const overallAcceptanceRate = connections.length > 0 ?
      (accepted.length / connections.length) * 100 : 0;

    if (overallAcceptanceRate > 30) {
      insights.push({
        type: 'positive',
        title: 'High Acceptance Rate',
        description: `Your ${overallAcceptanceRate.toFixed(1)}% acceptance rate is above average`
      });
    } else if (overallAcceptanceRate < 15) {
      insights.push({
        type: 'warning',
        title: 'Low Acceptance Rate',
        description: `Your ${overallAcceptanceRate.toFixed(1)}% acceptance rate could be improved`
      });
      recommendations.push({
        title: 'Improve Message Templates',
        description: 'Consider personalizing your connection messages or A/B testing different templates'
      });
    }

    return {
      insights,
      recommendations,
      keyMetrics: {
        totalActivity: data.length,
        weekOverWeekGrowth: previousConnections > 0 ?
          ((recentConnections - previousConnections) / previousConnections) * 100 : 0,
        acceptanceRate: overallAcceptanceRate
      }
    };
  }

  /**
   * Helper methods
   */
  generateCacheKey(options) {
    return JSON.stringify(options);
  }

  calculateDailyAverage(data) {
    if (data.length === 0) return 0;

    const firstDate = Math.min(...data.map(entry => entry.timestamp));
    const lastDate = Math.max(...data.map(entry => entry.timestamp));
    const daysDiff = Math.max(1, Math.ceil((lastDate - firstDate) / (24 * 60 * 60 * 1000)));

    return Math.round((data.length / daysDiff) * 100) / 100;
  }

  groupDataByTime(data, groupBy) {
    const grouped = {};

    data.forEach(entry => {
      const date = new Date(entry.timestamp);
      let key;

      switch (groupBy) {
        case 'hour':
          key = date.setMinutes(0, 0, 0);
          break;
        case 'day':
          key = date.setHours(0, 0, 0, 0);
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.setHours(0, 0, 0, 0);
          break;
        case 'month':
          key = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
          break;
        default:
          key = date.setHours(0, 0, 0, 0);
      }

      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(entry);
    });

    return grouped;
  }

  async calculateResponseTimeMetrics(data) {
    const messages = data.filter(entry => entry.type === ANALYTICS_TYPES.MESSAGE_SENT);
    const responses = data.filter(entry => entry.type === ANALYTICS_TYPES.MESSAGE_RECEIVED);

    const responseTimes = responses.map(response => {
      const relatedMessage = messages.find(msg =>
        msg.profileId === response.profileId &&
        msg.timestamp < response.timestamp
      );

      if (relatedMessage) {
        return response.timestamp - relatedMessage.timestamp;
      }
      return null;
    }).filter(time => time !== null);

    const averageResponseTime = responseTimes.length > 0 ?
      responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length : 0;

    // Create distribution buckets
    const distribution = {
      '< 1 hour': responseTimes.filter(time => time < 60 * 60 * 1000).length,
      '1-6 hours': responseTimes.filter(time => time >= 60 * 60 * 1000 && time < 6 * 60 * 60 * 1000).length,
      '6-24 hours': responseTimes.filter(time => time >= 6 * 60 * 60 * 1000 && time < 24 * 60 * 60 * 1000).length,
      '1-3 days': responseTimes.filter(time => time >= 24 * 60 * 60 * 1000 && time < 3 * 24 * 60 * 60 * 1000).length,
      '> 3 days': responseTimes.filter(time => time >= 3 * 24 * 60 * 60 * 1000).length
    };

    return {
      averageResponseTime,
      distribution
    };
  }

  calculateEngagementScore(metrics) {
    const { profileViews, connections, messages, responses } = metrics;

    // Weighted engagement score
    let score = 0;

    // Base activity score
    score += Math.min(profileViews * 0.1, 10);
    score += Math.min(connections * 0.5, 25);
    score += Math.min(messages * 0.3, 15);
    score += Math.min(responses * 1.0, 50);

    return Math.min(Math.round(score), 100);
  }

  calculateDropOffAnalysis(conversionRates) {
    const dropOffs = [];

    for (let i = 1; i < conversionRates.length; i++) {
      const current = conversionRates[i];
      const previous = conversionRates[i - 1];
      const dropOff = previous.rate - current.rate;

      dropOffs.push({
        stage: `${previous.name} → ${current.name}`,
        dropOffRate: dropOff,
        retentionRate: 100 - dropOff
      });
    }

    return dropOffs;
  }

  calculateAverageDuration(campaigns) {
    if (campaigns.length === 0) return 0;

    const completedCampaigns = campaigns.filter(c => c.status === 'completed');
    if (completedCampaigns.length === 0) return 0;

    const totalDuration = completedCampaigns.reduce((sum, campaign) => sum + campaign.duration, 0);
    return Math.round(totalDuration / completedCampaigns.length);
  }

  /**
   * Clear analytics cache
   */
  clearCache() {
    this.cache.clear();
  }
}

/**
 * Create analytics engine instance
 * @returns {AnalyticsEngine} Analytics engine instance
 */
export function createAnalyticsEngine() {
  return new AnalyticsEngine();
}

/**
 * Quick analytics calculation for dashboard
 * @param {Object} options - Calculation options
 * @returns {Promise<Object>} Quick analytics data
 */
export async function getQuickAnalytics(options = {}) {
  const engine = createAnalyticsEngine();
  return await engine.calculateAnalytics({
    ...options,
    metrics: ['summary', 'performance']
  });
}