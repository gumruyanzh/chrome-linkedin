// Storage utility functions for Chrome Extension
// import browser from 'webextension-polyfill';

/**
 * Storage keys used throughout the extension
 */
export const STORAGE_KEYS = {
  SETTINGS: 'settings',
  ANALYTICS: 'analytics',
  TEMPLATES: 'message_templates',
  TEMPLATE_LIBRARY: 'template_library',
  SAVED_SEARCHES: 'saved_searches',
  CONNECTION_QUEUE: 'connection_queue',
  CONNECTION_DATABASE: 'connection_database',
  USER_PROFILE: 'user_profile',
  CAMPAIGNS: 'campaigns',
  AB_TESTS: 'ab_tests',
  AB_ASSIGNMENTS: 'ab_assignments',
  REPORT_TEMPLATES: 'report_templates',
  SCHEDULED_REPORTS: 'scheduled_reports',
  REPORT_HISTORY: 'report_history',
  REPORTS: 'reports',
  CONVERSATIONS: 'conversations',
  FOLLOWUP_SEQUENCES: 'followup_sequences',
  RESPONSE_TEMPLATES: 'response_templates',
  // Task 6.3 & 6.4: Error Reporting and Crash Analytics
  ERRORS: 'errors',
  CRASHES: 'crashes',
  PERFORMANCE: 'performance',
  MEMORY: 'memory',
  HEALTH: 'health',
  RECOVERY: 'recovery',
  // Task 6.5: Enhanced A/B Testing Framework
  AB_TEST_CONFIGS: 'ab_test_configs',
  AB_TEST_RESULTS: 'ab_test_results',
  AB_TEST_STATISTICS: 'ab_test_statistics',
  AB_TEST_SAMPLE_SIZES: 'ab_test_sample_sizes',
  AB_TEST_MONITORING: 'ab_test_monitoring',
  // Task 6.6: User Feedback Collection and Sentiment Analysis
  USER_FEEDBACK: 'user_feedback',
  FEEDBACK_SENTIMENT: 'feedback_sentiment',
  FEEDBACK_CATEGORIES: 'feedback_categories',
  FEEDBACK_ANALYTICS: 'feedback_analytics',
  USER_SATISFACTION: 'user_satisfaction',
  // Task 6.7: Performance Optimization Systems
  PERFORMANCE_OPTIMIZATION: 'performance_optimization',
  PERFORMANCE_BUDGETS: 'performance_budgets',
  BROWSER_CAPABILITIES: 'browser_capabilities',
  OPTIMIZATION_HISTORY: 'optimization_history',
  RESOURCE_CACHE: 'resource_cache',
  NETWORK_STATS: 'network_stats'
};

/**
 * Get data from Chrome storage
 * @param {string|string[]|null} keys - Storage keys to retrieve
 * @param {string} area - Storage area ('local' or 'sync')
 * @returns {Promise<Object>} Retrieved data
 */
export async function getStorageData(keys = null, area = 'local') {
  try {
    const storage = area === 'sync' ? chrome.storage.sync : chrome.storage.local;
    const result = await storage.get(keys);
    return result;
  } catch (error) {
    console.error('Error getting storage data:', error);
    throw error;
  }
}

/**
 * Set data in Chrome storage
 * @param {Object} data - Data to store
 * @param {string} area - Storage area ('local' or 'sync')
 * @returns {Promise<void>}
 */
export async function setStorageData(data, area = 'local') {
  try {
    const storage = area === 'sync' ? chrome.storage.sync : chrome.storage.local;
    await storage.set(data);
  } catch (error) {
    console.error('Error setting storage data:', error);
    throw error;
  }
}

/**
 * Remove data from Chrome storage
 * @param {string|string[]} keys - Keys to remove
 * @param {string} area - Storage area ('local' or 'sync')
 * @returns {Promise<void>}
 */
export async function removeStorageData(keys, area = 'local') {
  try {
    const storage = area === 'sync' ? chrome.storage.sync : chrome.storage.local;
    await storage.remove(keys);
  } catch (error) {
    console.error('Error removing storage data:', error);
    throw error;
  }
}

/**
 * Clear all data from Chrome storage
 * @param {string} area - Storage area ('local' or 'sync')
 * @returns {Promise<void>}
 */
export async function clearStorageData(area = 'local') {
  try {
    const storage = area === 'sync' ? chrome.storage.sync : chrome.storage.local;
    await storage.clear();
  } catch (error) {
    console.error('Error clearing storage data:', error);
    throw error;
  }
}

/**
 * Get settings with default values
 * @returns {Promise<Object>} Settings object
 */
export async function getSettings() {
  const defaultSettings = {
    connectionRequestsPerDay: 20,
    delayBetweenRequests: 5000,
    personalizedMessages: true,
    analyticsEnabled: true,
    safeModeEnabled: true,
    autoAcceptConnections: false,
    workingHours: {
      start: '09:00',
      end: '17:00',
      timezone: 'auto'
    },
    weekendsEnabled: false
  };

  try {
    const result = await getStorageData(STORAGE_KEYS.SETTINGS);
    return { ...defaultSettings, ...result.settings };
  } catch (error) {
    console.error('Error getting settings:', error);
    return defaultSettings;
  }
}

/**
 * Update settings
 * @param {Object} newSettings - Settings to update
 * @returns {Promise<void>}
 */
export async function updateSettings(newSettings) {
  try {
    const currentSettings = await getSettings();
    const updatedSettings = { ...currentSettings, ...newSettings };
    await setStorageData({ [STORAGE_KEYS.SETTINGS]: updatedSettings });
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
}

/**
 * Get analytics data
 * @param {number} days - Number of days to retrieve (optional)
 * @returns {Promise<Array>} Analytics data
 */
export async function getAnalytics(days = null) {
  try {
    const result = await getStorageData(STORAGE_KEYS.ANALYTICS);
    let analytics = result.analytics || [];

    if (days) {
      const cutoffDate = Date.now() - days * 24 * 60 * 60 * 1000;
      analytics = analytics.filter(entry => entry.timestamp >= cutoffDate);
    }

    return analytics;
  } catch (error) {
    console.error('Error getting analytics:', error);
    return [];
  }
}

/**
 * Log analytics event
 * @param {Object} eventData - Event data to log
 * @returns {Promise<void>}
 */
export async function logAnalytics(eventData) {
  try {
    const analytics = await getAnalytics();
    const newEntry = {
      ...eventData,
      timestamp: Date.now(),
      id: Date.now().toString()
    };

    analytics.push(newEntry);

    // Keep only last 1000 entries to prevent storage bloat
    if (analytics.length > 1000) {
      analytics.splice(0, analytics.length - 1000);
    }

    await setStorageData({ [STORAGE_KEYS.ANALYTICS]: analytics });
  } catch (error) {
    console.error('Error logging analytics:', error);
    throw error;
  }
}
