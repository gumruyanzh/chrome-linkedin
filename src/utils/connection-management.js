// Connection Management System - Task 3.5
// Comprehensive connection database with metadata and follow-up tracking

import { getStorageData, setStorageData, STORAGE_KEYS } from './storage.js';
import { trackEvent, ANALYTICS_EVENTS } from './analytics.js';

/**
 * Connection status types
 */
export const CONNECTION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  WITHDRAWN: 'withdrawn',
  EXPIRED: 'expired',
  BLOCKED: 'blocked'
};

/**
 * Connection categories for organization
 */
export const CONNECTION_CATEGORIES = {
  PROSPECTING: 'prospecting',
  CLIENT: 'client',
  PARTNER: 'partner',
  COLLEAGUE: 'colleague',
  MENTOR: 'mentor',
  STUDENT: 'student',
  RECRUITER: 'recruiter',
  OTHER: 'other'
};

/**
 * Follow-up types
 */
export const FOLLOWUP_TYPES = {
  THANK_YOU: 'thank_you',
  MEETING_REQUEST: 'meeting_request',
  CONTENT_SHARE: 'content_share',
  CHECK_IN: 'check_in',
  BUSINESS_PROPOSAL: 'business_proposal',
  CUSTOM: 'custom'
};

/**
 * Create new connection record
 * @param {Object} connectionData - Connection data
 * @returns {Promise<Object>} Created connection record
 */
export async function createConnectionRecord(connectionData) {
  try {
    const connection = {
      id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      profileId: connectionData.profileId,
      profileUrl: connectionData.profileUrl,
      name: connectionData.name,
      firstName: extractFirstName(connectionData.name),
      lastName: extractLastName(connectionData.name),
      title: connectionData.title || '',
      company: connectionData.company || '',
      location: connectionData.location || '',
      industry: connectionData.industry || '',
      status: connectionData.status || CONNECTION_STATUS.PENDING,
      category: connectionData.category || CONNECTION_CATEGORIES.OTHER,
      tags: connectionData.tags || [],
      notes: connectionData.notes || '',

      // Connection details
      connectionRequest: {
        sentAt: connectionData.sentAt || Date.now(),
        messageUsed: connectionData.messageUsed || '',
        templateId: connectionData.templateId || null,
        campaignId: connectionData.campaignId || null,
        source: connectionData.source || 'manual' // manual, campaign, import
      },

      // Response tracking
      response: {
        respondedAt: null,
        responseMessage: '',
        responseType: null, // accepted, declined, no_response
        responseTime: null // Time to respond in ms
      },

      // Relationship metadata
      relationship: {
        mutualConnections: connectionData.mutualConnections || 0,
        connectionDegree: connectionData.connectionDegree || '2nd',
        firstInteraction: Date.now(),
        lastInteraction: Date.now(),
        interactionCount: 1,
        relationshipScore: calculateInitialRelationshipScore(connectionData)
      },

      // Follow-up tracking
      followUp: {
        isRequired: false,
        lastFollowUp: null,
        nextFollowUp: null,
        followUpCount: 0,
        followUpHistory: []
      },

      // Analytics and performance
      analytics: {
        viewCount: 0,
        messageCount: 0,
        meetingCount: 0,
        conversionEvents: [],
        engagementScore: 0,
        responseRate: 0
      },

      // Metadata
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        importedFrom: connectionData.importedFrom || null,
        dataSource: connectionData.dataSource || 'linkedin',
        syncStatus: 'synced'
      }
    };

    // Save connection
    const connections = await getConnectionRecords();
    connections.push(connection);
    await saveConnectionRecords(connections);

    // Track analytics event
    await trackEvent(ANALYTICS_EVENTS.CONNECTION_SENT, {
      connectionId: connection.id,
      profileId: connection.profileId,
      templateId: connection.connectionRequest.templateId,
      campaignId: connection.connectionRequest.campaignId
    });

    return connection;
  } catch (error) {
    console.error('Error creating connection record:', error);
    throw error;
  }
}

/**
 * Update connection status
 * @param {string} connectionId - Connection ID
 * @param {string} newStatus - New status
 * @param {Object} updateData - Additional update data
 * @returns {Promise<Object>} Updated connection
 */
export async function updateConnectionStatus(connectionId, newStatus, updateData = {}) {
  try {
    const connections = await getConnectionRecords();
    const connectionIndex = connections.findIndex(c => c.id === connectionId);

    if (connectionIndex === -1) {
      throw new Error(`Connection with ID ${connectionId} not found`);
    }

    const connection = connections[connectionIndex];
    const oldStatus = connection.status;

    // Update status
    connection.status = newStatus;
    connection.metadata.updatedAt = Date.now();

    // Handle status-specific updates
    if (newStatus === CONNECTION_STATUS.ACCEPTED) {
      connection.response.respondedAt = updateData.respondedAt || Date.now();
      connection.response.responseType = 'accepted';
      connection.response.responseTime =
        connection.response.respondedAt - connection.connectionRequest.sentAt;
      connection.relationship.lastInteraction = Date.now();

      // Track acceptance event
      await trackEvent(ANALYTICS_EVENTS.CONNECTION_ACCEPTED, {
        connectionId: connection.id,
        profileId: connection.profileId,
        responseTime: connection.response.responseTime
      });

      // Schedule follow-up if needed
      if (updateData.scheduleFollowUp) {
        await scheduleFollowUp(connectionId, {
          type: FOLLOWUP_TYPES.THANK_YOU,
          scheduledFor: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
          message: 'Thank connection for accepting'
        });
      }
    } else if (newStatus === CONNECTION_STATUS.DECLINED) {
      connection.response.respondedAt = updateData.respondedAt || Date.now();
      connection.response.responseType = 'declined';
      connection.response.responseTime =
        connection.response.respondedAt - connection.connectionRequest.sentAt;

      await trackEvent(ANALYTICS_EVENTS.CONNECTION_DECLINED, {
        connectionId: connection.id,
        profileId: connection.profileId
      });
    }

    // Update response message if provided
    if (updateData.responseMessage) {
      connection.response.responseMessage = updateData.responseMessage;
    }

    connections[connectionIndex] = connection;
    await saveConnectionRecords(connections);

    return connection;
  } catch (error) {
    console.error('Error updating connection status:', error);
    throw error;
  }
}

/**
 * Get connection records with filtering and pagination
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Query results
 */
export async function getConnectionRecords(options = {}) {
  try {
    const data = await getStorageData(STORAGE_KEYS.CONNECTION_DATABASE);
    let connections = data.connection_database || [];

    // Apply filters
    connections = applyConnectionFilters(connections, options.filters || {});

    // Apply search
    if (options.search) {
      connections = searchConnections(connections, options.search);
    }

    // Apply sorting
    if (options.sortBy) {
      connections = sortConnections(connections, options.sortBy, options.sortOrder);
    }

    // Calculate total before pagination
    const total = connections.length;

    // Apply pagination
    if (options.limit || options.offset) {
      const offset = options.offset || 0;
      const limit = options.limit || connections.length;
      connections = connections.slice(offset, offset + limit);
    }

    return {
      connections,
      total,
      offset: options.offset || 0,
      limit: options.limit || total
    };
  } catch (error) {
    console.error('Error getting connection records:', error);
    return { connections: [], total: 0, offset: 0, limit: 0 };
  }
}

/**
 * Get connection by ID
 * @param {string} connectionId - Connection ID
 * @returns {Promise<Object|null>} Connection record
 */
export async function getConnectionById(connectionId) {
  try {
    const result = await getConnectionRecords();
    return result.connections.find(c => c.id === connectionId) || null;
  } catch (error) {
    console.error('Error getting connection by ID:', error);
    return null;
  }
}

/**
 * Add note to connection
 * @param {string} connectionId - Connection ID
 * @param {string} note - Note content
 * @returns {Promise<boolean>} Success status
 */
export async function addConnectionNote(connectionId, note) {
  try {
    const connections = await getConnectionRecords();
    const connection = connections.connections.find(c => c.id === connectionId);

    if (!connection) {
      throw new Error(`Connection with ID ${connectionId} not found`);
    }

    // Add timestamp to note
    const timestampedNote = `[${new Date().toLocaleString()}] ${note}`;

    if (connection.notes) {
      connection.notes += `\n${timestampedNote}`;
    } else {
      connection.notes = timestampedNote;
    }

    connection.metadata.updatedAt = Date.now();
    await saveConnectionRecords(connections.connections);

    return true;
  } catch (error) {
    console.error('Error adding connection note:', error);
    return false;
  }
}

/**
 * Update connection tags
 * @param {string} connectionId - Connection ID
 * @param {Array} tags - Array of tags
 * @returns {Promise<boolean>} Success status
 */
export async function updateConnectionTags(connectionId, tags) {
  try {
    const connections = await getConnectionRecords();
    const connection = connections.connections.find(c => c.id === connectionId);

    if (!connection) {
      throw new Error(`Connection with ID ${connectionId} not found`);
    }

    connection.tags = [...new Set(tags)]; // Remove duplicates
    connection.metadata.updatedAt = Date.now();
    await saveConnectionRecords(connections.connections);

    return true;
  } catch (error) {
    console.error('Error updating connection tags:', error);
    return false;
  }
}

/**
 * Schedule follow-up for connection
 * @param {string} connectionId - Connection ID
 * @param {Object} followUpData - Follow-up data
 * @returns {Promise<Object>} Scheduled follow-up
 */
export async function scheduleFollowUp(connectionId, followUpData) {
  try {
    const connections = await getConnectionRecords();
    const connection = connections.connections.find(c => c.id === connectionId);

    if (!connection) {
      throw new Error(`Connection with ID ${connectionId} not found`);
    }

    const followUp = {
      id: `followup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: followUpData.type || FOLLOWUP_TYPES.CHECK_IN,
      scheduledFor: followUpData.scheduledFor || Date.now(),
      message: followUpData.message || '',
      templateId: followUpData.templateId || null,
      status: 'scheduled', // scheduled, sent, cancelled
      createdAt: Date.now()
    };

    connection.followUp.followUpHistory.push(followUp);
    connection.followUp.nextFollowUp = followUpData.scheduledFor;
    connection.followUp.isRequired = true;
    connection.metadata.updatedAt = Date.now();

    await saveConnectionRecords(connections.connections);
    return followUp;
  } catch (error) {
    console.error('Error scheduling follow-up:', error);
    throw error;
  }
}

/**
 * Get connections requiring follow-up
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Connections needing follow-up
 */
export async function getConnectionsRequiringFollowUp(options = {}) {
  try {
    const result = await getConnectionRecords();
    const now = Date.now();

    return result.connections.filter(connection => {
      // Has follow-up required
      if (!connection.followUp.isRequired) {
        return false;
      }

      // Follow-up time has passed
      if (connection.followUp.nextFollowUp && connection.followUp.nextFollowUp <= now) {
        return true;
      }

      // Custom follow-up rules
      if (options.includeOverdue) {
        const daysSinceConnection =
          (now - connection.connectionRequest.sentAt) / (24 * 60 * 60 * 1000);

        // Auto follow-up for accepted connections after 7 days
        if (
          connection.status === CONNECTION_STATUS.ACCEPTED &&
          daysSinceConnection > 7 &&
          !connection.followUp.lastFollowUp
        ) {
          return true;
        }

        // Follow-up for pending connections after 14 days
        if (connection.status === CONNECTION_STATUS.PENDING && daysSinceConnection > 14) {
          return true;
        }
      }

      return false;
    });
  } catch (error) {
    console.error('Error getting connections requiring follow-up:', error);
    return [];
  }
}

/**
 * Get connection analytics summary
 * @param {Object} options - Analytics options
 * @returns {Promise<Object>} Analytics summary
 */
export async function getConnectionAnalytics(options = {}) {
  try {
    const result = await getConnectionRecords();
    const connections = result.connections;

    // Filter by date range if specified
    let filteredConnections = connections;
    if (options.dateRange) {
      const { startDate, endDate } = options.dateRange;
      filteredConnections = connections.filter(
        c => c.connectionRequest.sentAt >= startDate && c.connectionRequest.sentAt <= endDate
      );
    }

    const analytics = {
      totalConnections: filteredConnections.length,
      statusBreakdown: {},
      categoryBreakdown: {},
      averageResponseTime: 0,
      responseRate: 0,
      acceptanceRate: 0,
      topPerformingTemplates: [],
      topPerformingCampaigns: [],
      followUpStats: {
        required: 0,
        completed: 0,
        overdue: 0
      },
      timelineData: generateTimelineData(filteredConnections),
      insights: []
    };

    // Status breakdown
    Object.values(CONNECTION_STATUS).forEach(status => {
      analytics.statusBreakdown[status] = filteredConnections.filter(
        c => c.status === status
      ).length;
    });

    // Category breakdown
    Object.values(CONNECTION_CATEGORIES).forEach(category => {
      analytics.categoryBreakdown[category] = filteredConnections.filter(
        c => c.category === category
      ).length;
    });

    // Response metrics
    const respondedConnections = filteredConnections.filter(c => c.response.respondedAt);
    const acceptedConnections = filteredConnections.filter(
      c => c.status === CONNECTION_STATUS.ACCEPTED
    );

    if (respondedConnections.length > 0) {
      analytics.averageResponseTime =
        respondedConnections.reduce((sum, c) => sum + (c.response.responseTime || 0), 0) /
        respondedConnections.length;
      analytics.responseRate = respondedConnections.length / filteredConnections.length;
    }

    if (filteredConnections.length > 0) {
      analytics.acceptanceRate = acceptedConnections.length / filteredConnections.length;
    }

    // Template performance
    analytics.topPerformingTemplates = getTopPerformingTemplates(filteredConnections);
    analytics.topPerformingCampaigns = getTopPerformingCampaigns(filteredConnections);

    // Follow-up stats
    analytics.followUpStats.required = filteredConnections.filter(
      c => c.followUp.isRequired
    ).length;
    analytics.followUpStats.completed = filteredConnections.filter(
      c => c.followUp.lastFollowUp
    ).length;

    const overdueConnections = await getConnectionsRequiringFollowUp({ includeOverdue: true });
    analytics.followUpStats.overdue = overdueConnections.length;

    // Generate insights
    analytics.insights = generateConnectionInsights(analytics, filteredConnections);

    return analytics;
  } catch (error) {
    console.error('Error getting connection analytics:', error);
    return null;
  }
}

/**
 * Export connections data
 * @param {Object} options - Export options
 * @returns {Promise<Object>} Export result
 */
export async function exportConnections(options = {}) {
  try {
    const result = await getConnectionRecords(options);
    let connections = result.connections;

    // Apply additional filters
    if (options.status) {
      connections = connections.filter(c => c.status === options.status);
    }

    if (options.category) {
      connections = connections.filter(c => c.category === options.category);
    }

    // Format for export
    const exportData = connections.map(connection => {
      const data = {
        name: connection.name,
        title: connection.title,
        company: connection.company,
        location: connection.location,
        status: connection.status,
        category: connection.category,
        tags: connection.tags.join(', '),
        connectionDate: new Date(connection.connectionRequest.sentAt).toISOString(),
        responseTime: connection.response.responseTime
          ? Math.round(connection.response.responseTime / (60 * 60 * 1000)) + ' hours'
          : '',
        notes: connection.notes
      };

      if (options.includeProfile) {
        data.profileUrl = connection.profileUrl;
        data.industry = connection.industry;
        data.mutualConnections = connection.relationship.mutualConnections;
      }

      if (options.includeAnalytics) {
        data.interactionCount = connection.relationship.interactionCount;
        data.engagementScore = connection.analytics.engagementScore;
        data.relationshipScore = connection.relationship.relationshipScore;
      }

      return data;
    });

    return {
      success: true,
      data: exportData,
      count: connections.length,
      format: options.format || 'json'
    };
  } catch (error) {
    console.error('Error exporting connections:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Helper Functions

async function saveConnectionRecords(connections) {
  await setStorageData({
    [STORAGE_KEYS.CONNECTION_DATABASE]: connections
  });
}

function applyConnectionFilters(connections, filters) {
  return connections.filter(connection => {
    // Status filter
    if (filters.status && connection.status !== filters.status) {
      return false;
    }

    // Category filter
    if (filters.category && connection.category !== filters.category) {
      return false;
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      const hasTag = filters.tags.some(tag => connection.tags.includes(tag));
      if (!hasTag) {
        return false;
      }
    }

    // Date range filter
    if (filters.dateRange) {
      const { startDate, endDate } = filters.dateRange;
      if (
        connection.connectionRequest.sentAt < startDate ||
        connection.connectionRequest.sentAt > endDate
      ) {
        return false;
      }
    }

    // Campaign filter
    if (filters.campaignId && connection.connectionRequest.campaignId !== filters.campaignId) {
      return false;
    }

    return true;
  });
}

function searchConnections(connections, searchQuery) {
  const query = searchQuery.toLowerCase();
  return connections.filter(
    connection =>
      connection.name.toLowerCase().includes(query) ||
      connection.title.toLowerCase().includes(query) ||
      connection.company.toLowerCase().includes(query) ||
      connection.location.toLowerCase().includes(query) ||
      connection.notes.toLowerCase().includes(query) ||
      connection.tags.some(tag => tag.toLowerCase().includes(query))
  );
}

function sortConnections(connections, sortBy, sortOrder = 'desc') {
  return connections.sort((a, b) => {
    let aValue, bValue;

    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);

      case 'connectionDate':
        aValue = a.connectionRequest.sentAt;
        bValue = b.connectionRequest.sentAt;
        break;

      case 'responseTime':
        aValue = a.response.responseTime || Infinity;
        bValue = b.response.responseTime || Infinity;
        break;

      case 'relationshipScore':
        aValue = a.relationship.relationshipScore || 0;
        bValue = b.relationship.relationshipScore || 0;
        break;

      case 'engagementScore':
        aValue = a.analytics.engagementScore || 0;
        bValue = b.analytics.engagementScore || 0;
        break;

      default:
        return 0;
    }

    return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
  });
}

function calculateInitialRelationshipScore(connectionData) {
  let score = 50; // Base score

  // Mutual connections boost
  if (connectionData.mutualConnections > 10) {
    score += 20;
  } else if (connectionData.mutualConnections > 5) {
    score += 15;
  } else if (connectionData.mutualConnections > 0) {
    score += 10;
  }

  // Same company boost
  if (connectionData.company && connectionData.company.length > 0) {
    score += 10;
  }

  // Same location boost
  if (connectionData.location && connectionData.location.length > 0) {
    score += 5;
  }

  // Premium account boost
  if (connectionData.isPremium) {
    score += 10;
  }

  return Math.min(score, 100);
}

function extractFirstName(fullName) {
  if (!fullName) {
    return '';
  }
  return fullName.split(' ')[0];
}

function extractLastName(fullName) {
  if (!fullName) {
    return '';
  }
  const parts = fullName.split(' ');
  return parts.length > 1 ? parts.slice(1).join(' ') : '';
}

function getTopPerformingTemplates(connections) {
  const templateStats = {};

  connections.forEach(connection => {
    if (connection.connectionRequest.templateId) {
      const templateId = connection.connectionRequest.templateId;
      if (!templateStats[templateId]) {
        templateStats[templateId] = { sent: 0, accepted: 0, declined: 0 };
      }

      templateStats[templateId].sent++;
      if (connection.status === CONNECTION_STATUS.ACCEPTED) {
        templateStats[templateId].accepted++;
      } else if (connection.status === CONNECTION_STATUS.DECLINED) {
        templateStats[templateId].declined++;
      }
    }
  });

  return Object.entries(templateStats)
    .map(([templateId, stats]) => ({
      templateId,
      ...stats,
      acceptanceRate: stats.sent > 0 ? stats.accepted / stats.sent : 0
    }))
    .sort((a, b) => b.acceptanceRate - a.acceptanceRate)
    .slice(0, 5);
}

function getTopPerformingCampaigns(connections) {
  const campaignStats = {};

  connections.forEach(connection => {
    if (connection.connectionRequest.campaignId) {
      const campaignId = connection.connectionRequest.campaignId;
      if (!campaignStats[campaignId]) {
        campaignStats[campaignId] = { sent: 0, accepted: 0, declined: 0 };
      }

      campaignStats[campaignId].sent++;
      if (connection.status === CONNECTION_STATUS.ACCEPTED) {
        campaignStats[campaignId].accepted++;
      } else if (connection.status === CONNECTION_STATUS.DECLINED) {
        campaignStats[campaignId].declined++;
      }
    }
  });

  return Object.entries(campaignStats)
    .map(([campaignId, stats]) => ({
      campaignId,
      ...stats,
      acceptanceRate: stats.sent > 0 ? stats.accepted / stats.sent : 0
    }))
    .sort((a, b) => b.acceptanceRate - a.acceptanceRate)
    .slice(0, 5);
}

function generateTimelineData(connections) {
  const timeline = {};

  connections.forEach(connection => {
    const date = new Date(connection.connectionRequest.sentAt).toISOString().split('T')[0];
    if (!timeline[date]) {
      timeline[date] = { sent: 0, accepted: 0, declined: 0 };
    }

    timeline[date].sent++;
    if (connection.status === CONNECTION_STATUS.ACCEPTED) {
      timeline[date].accepted++;
    } else if (connection.status === CONNECTION_STATUS.DECLINED) {
      timeline[date].declined++;
    }
  });

  return timeline;
}

function generateConnectionInsights(analytics, connections) {
  const insights = [];

  // High acceptance rate insight
  if (analytics.acceptanceRate > 0.3) {
    insights.push({
      type: 'positive',
      title: 'High Acceptance Rate',
      message: `Your ${Math.round(analytics.acceptanceRate * 100)}% acceptance rate is above average. Keep using similar approaches.`
    });
  }

  // Low response rate insight
  if (analytics.responseRate < 0.2 && analytics.totalConnections > 10) {
    insights.push({
      type: 'warning',
      title: 'Low Response Rate',
      message: `Consider revising your connection messages. Only ${Math.round(analytics.responseRate * 100)}% of recipients are responding.`
    });
  }

  // Follow-up opportunity
  if (analytics.followUpStats.overdue > 5) {
    insights.push({
      type: 'action',
      title: 'Follow-up Opportunities',
      message: `You have ${analytics.followUpStats.overdue} connections that could benefit from follow-up messages.`
    });
  }

  // Fast response time insight
  if (analytics.averageResponseTime < 24 * 60 * 60 * 1000) {
    // Less than 24 hours
    insights.push({
      type: 'positive',
      title: 'Quick Responses',
      message: `People respond to your requests quickly (average: ${Math.round(analytics.averageResponseTime / (60 * 60 * 1000))} hours).`
    });
  }

  return insights;
}

// Add storage key
if (!STORAGE_KEYS.CONNECTION_DATABASE) {
  STORAGE_KEYS.CONNECTION_DATABASE = 'connection_database';
}
