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
  RESPONSE_TEMPLATES: 'response_templates'
};

/**
 * Schema definitions for storage data validation
 */
const STORAGE_SCHEMAS = {
  [STORAGE_KEYS.SETTINGS]: {
    type: 'object',
    properties: {
      connectionRequestsPerDay: { type: 'number', min: 1, max: 100 },
      delayBetweenRequests: { type: 'number', min: 1000, max: 60000 },
      personalizedMessages: { type: 'boolean' },
      analyticsEnabled: { type: 'boolean' },
      safeModeEnabled: { type: 'boolean' },
      autoAcceptConnections: { type: 'boolean' },
      weekendsEnabled: { type: 'boolean' }
    }
  },
  [STORAGE_KEYS.ANALYTICS]: {
    type: 'array',
    items: {
      type: 'object',
      required: ['timestamp', 'type'],
      properties: {
        timestamp: { type: 'number' },
        type: { type: 'string' },
        id: { type: 'string' }
      }
    }
  },
  [STORAGE_KEYS.TEMPLATES]: {
    type: 'array',
    items: {
      type: 'object',
      required: ['id', 'name', 'content'],
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        content: { type: 'string' }
      }
    }
  }
};

/**
 * Validate a value against a schema property
 * @param {*} value - Value to validate
 * @param {Object} schema - Schema definition
 * @returns {boolean} True if valid
 */
function validateValue(value, schema) {
  if (value === null || value === undefined) {
    return !schema.required;
  }

  switch (schema.type) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      if (typeof value !== 'number' || isNaN(value)) return false;
      if (schema.min !== undefined && value < schema.min) return false;
      if (schema.max !== undefined && value > schema.max) return false;
      return true;
    case 'boolean':
      return typeof value === 'boolean';
    case 'array':
      if (!Array.isArray(value)) return false;
      if (schema.items) {
        return value.every(item => validateValue(item, schema.items));
      }
      return true;
    case 'object':
      if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
      if (schema.required) {
        if (!schema.required.every(key => key in value)) return false;
      }
      if (schema.properties) {
        for (const [key, propSchema] of Object.entries(schema.properties)) {
          if (key in value && !validateValue(value[key], propSchema)) {
            return false;
          }
        }
      }
      return true;
    default:
      return true;
  }
}

/**
 * Validate storage data against schema
 * @param {string} key - Storage key
 * @param {*} data - Data to validate
 * @returns {Object} Validation result
 */
export function validateStorageData(key, data) {
  const schema = STORAGE_SCHEMAS[key];

  if (!schema) {
    // No schema defined, accept any data
    return { valid: true, errors: [] };
  }

  const isValid = validateValue(data, schema);
  return {
    valid: isValid,
    errors: isValid ? [] : [`Data for key "${key}" does not match expected schema`]
  };
}

/**
 * Sanitize data to remove potentially dangerous content
 * @param {*} data - Data to sanitize
 * @returns {*} Sanitized data
 */
export function sanitizeStorageData(data) {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    // Remove potential script injections
    return data
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeStorageData(item));
  }

  if (typeof data === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      // Sanitize key names too
      const sanitizedKey = key.replace(/[<>]/g, '');
      sanitized[sanitizedKey] = sanitizeStorageData(value);
    }
    return sanitized;
  }

  return data;
}

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
 * Set data in Chrome storage with validation and sanitization
 * @param {Object} data - Data to store
 * @param {string} area - Storage area ('local' or 'sync')
 * @param {Object} options - Options for storage
 * @param {boolean} options.validate - Whether to validate data (default: true)
 * @param {boolean} options.sanitize - Whether to sanitize data (default: true)
 * @returns {Promise<void>}
 */
export async function setStorageData(data, area = 'local', options = {}) {
  const { validate = true, sanitize = true } = options;

  try {
    let processedData = data;

    // Validate each key in the data
    if (validate) {
      for (const [key, value] of Object.entries(data)) {
        const validation = validateStorageData(key, value);
        if (!validation.valid) {
          console.warn(`Storage validation warning for key "${key}":`, validation.errors);
        }
      }
    }

    // Sanitize the data
    if (sanitize) {
      processedData = sanitizeStorageData(data);
    }

    const storage = area === 'sync' ? chrome.storage.sync : chrome.storage.local;
    await storage.set(processedData);
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
