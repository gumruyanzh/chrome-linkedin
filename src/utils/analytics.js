// Analytics Collection for LinkedIn Automation

import { getStorageData, setStorageData, STORAGE_KEYS } from './storage.js';

/**
 * Analytics event types
 */
export const ANALYTICS_EVENTS = {
  CONNECTION_SENT: 'connection_sent',
  CONNECTION_ACCEPTED: 'connection_accepted',
  CONNECTION_DECLINED: 'connection_declined',
  CONNECTION_FAILED: 'connection_failed',
  MESSAGE_SENT: 'message_sent',
  PROFILE_VIEWED: 'profile_viewed',
  SEARCH_PERFORMED: 'search_performed',
  AUTOMATION_STARTED: 'automation_started',
  AUTOMATION_STOPPED: 'automation_stopped',
  TEMPLATE_USED: 'template_used'
};

/**
 * Track analytics event
 * @param {string} eventType - Type of event
 * @param {Object} eventData - Event data
 * @returns {Promise<void>}
 */
export async function trackEvent(eventType, eventData = {}) {
  try {
    const analytics = await getStorageData(STORAGE_KEYS.ANALYTICS);
    const analyticsData = analytics.analytics || [];

    const event = {
      id: generateEventId(),
      type: eventType,
      timestamp: Date.now(),
      date: new Date().toISOString().split('T')[0],
      ...eventData
    };

    analyticsData.push(event);

    // Keep only last 1000 events
    if (analyticsData.length > 1000) {
      analyticsData.splice(0, analyticsData.length - 1000);
    }

    await setStorageData({ [STORAGE_KEYS.ANALYTICS]: analyticsData });
  } catch (error) {
    console.error('Error tracking analytics event:', error);
  }
}

/**
 * Get analytics summary
 * @param {number} days - Number of days to analyze
 * @returns {Promise<Object>} Analytics summary
 */
export async function getAnalyticsSummary(days = 30) {
  try {
    const analytics = await getStorageData(STORAGE_KEYS.ANALYTICS);
    const analyticsData = analytics.analytics || [];

    const cutoffDate = Date.now() - (days * 24 * 60 * 60 * 1000);
    const filteredData = analyticsData.filter(event => event.timestamp >= cutoffDate);

    const summary = {
      totalEvents: filteredData.length,
      connectionsSent: filteredData.filter(e => e.type === ANALYTICS_EVENTS.CONNECTION_SENT).length,
      connectionsAccepted: filteredData.filter(e => e.type === ANALYTICS_EVENTS.CONNECTION_ACCEPTED).length,
      connectionsDeclined: filteredData.filter(e => e.type === ANALYTICS_EVENTS.CONNECTION_DECLINED).length,
      connectionsFailed: filteredData.filter(e => e.type === ANALYTICS_EVENTS.CONNECTION_FAILED).length,
      acceptanceRate: 0,
      averageDaily: 0,
      peakDay: null,
      recentActivity: filteredData.slice(-10)
    };

    // Calculate acceptance rate
    if (summary.connectionsSent > 0) {
      summary.acceptanceRate = (summary.connectionsAccepted / summary.connectionsSent) * 100;
    }

    // Calculate average daily connections
    if (days > 0) {
      summary.averageDaily = summary.connectionsSent / days;
    }

    // Find peak day
    const dailyStats = getDailyStats(filteredData);
    summary.peakDay = Object.entries(dailyStats)
      .sort(([,a], [,b]) => b.connections - a.connections)[0];

    return summary;
  } catch (error) {
    console.error('Error getting analytics summary:', error);
    return null;
  }
}

/**
 * Get daily statistics
 * @param {Array} analyticsData - Analytics data
 * @returns {Object} Daily statistics
 */
function getDailyStats(analyticsData) {
  return analyticsData.reduce((stats, event) => {
    if (!stats[event.date]) {
      stats[event.date] = { connections: 0, accepted: 0, failed: 0 };
    }

    if (event.type === ANALYTICS_EVENTS.CONNECTION_SENT) {
      stats[event.date].connections++;
    } else if (event.type === ANALYTICS_EVENTS.CONNECTION_ACCEPTED) {
      stats[event.date].accepted++;
    } else if (event.type === ANALYTICS_EVENTS.CONNECTION_FAILED) {
      stats[event.date].failed++;
    }

    return stats;
  }, {});
}

/**
 * Generate unique event ID
 * @returns {string} Unique event ID
 */
function generateEventId() {
  return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}