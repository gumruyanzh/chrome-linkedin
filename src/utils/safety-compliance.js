// Safety and Compliance Features for LinkedIn Automation

import { getStorageData, setStorageData, STORAGE_KEYS } from './storage.js';

/**
 * Default safety settings
 */
const DEFAULT_SAFETY_SETTINGS = {
  dailyConnectionLimit: 20,
  hourlyConnectionLimit: 5,
  delayBetweenRequests: {
    min: 3000, // 3 seconds
    max: 8000 // 8 seconds
  },
  workingHours: {
    enabled: true,
    start: '09:00',
    end: '17:00',
    timezone: 'auto'
  },
  weekendMode: false,
  safeModeEnabled: true,
  respectLinkedInLimits: true,
  humanLikePatterns: true
};

/**
 * Rate limiting tracker
 */
class RateLimitTracker {
  constructor() {
    this.connectionAttempts = [];
    this.lastActivityTime = 0;
  }

  /**
   * Check if connection request is allowed based on rate limits
   * @returns {Promise<Object>} Rate limit check result
   */
  async checkRateLimit() {
    try {
      const settings = await getSafetySettings();
      const now = Date.now();
      const todayStart = new Date().setHours(0, 0, 0, 0);
      const hourAgo = now - 60 * 60 * 1000;

      // Get recent activity from storage
      const result = await getStorageData(STORAGE_KEYS.ANALYTICS);
      const recentActivity = result.analytics || [];

      // Filter connection attempts
      const todayConnections = recentActivity.filter(
        entry => entry.type === 'connection_sent' && entry.timestamp >= todayStart
      );

      const hourlyConnections = recentActivity.filter(
        entry => entry.type === 'connection_sent' && entry.timestamp >= hourAgo
      );

      // Check daily limit
      if (todayConnections.length >= settings.dailyConnectionLimit) {
        return {
          allowed: false,
          reason: 'DAILY_LIMIT_EXCEEDED',
          message: `Daily limit of ${settings.dailyConnectionLimit} connections reached`,
          waitUntil: todayStart + 24 * 60 * 60 * 1000
        };
      }

      // Check hourly limit
      if (hourlyConnections.length >= settings.hourlyConnectionLimit) {
        return {
          allowed: false,
          reason: 'HOURLY_LIMIT_EXCEEDED',
          message: `Hourly limit of ${settings.hourlyConnectionLimit} connections reached`,
          waitUntil: hourAgo + 60 * 60 * 1000
        };
      }

      // Check working hours
      if (settings.workingHours.enabled && !isWithinWorkingHours(settings.workingHours)) {
        return {
          allowed: false,
          reason: 'OUTSIDE_WORKING_HOURS',
          message: 'Outside configured working hours',
          waitUntil: getNextWorkingHourStart(settings.workingHours)
        };
      }

      // Check weekend mode
      if (!settings.weekendMode && isWeekend()) {
        return {
          allowed: false,
          reason: 'WEEKEND_MODE_DISABLED',
          message: 'Weekend automation is disabled',
          waitUntil: getNextWeekdayStart()
        };
      }

      return {
        allowed: true,
        remainingDaily: settings.dailyConnectionLimit - todayConnections.length,
        remainingHourly: settings.hourlyConnectionLimit - hourlyConnections.length
      };
    } catch (error) {
      console.error('Error checking rate limit:', error);
      return {
        allowed: false,
        reason: 'ERROR',
        message: 'Unable to check rate limits'
      };
    }
  }

  /**
   * Generate human-like delay
   * @returns {Promise<number>} Delay in milliseconds
   */
  async generateHumanDelay() {
    try {
      const settings = await getSafetySettings();

      if (!settings.humanLikePatterns) {
        return settings.delayBetweenRequests.min;
      }

      const { min, max } = settings.delayBetweenRequests;

      // Add some randomization patterns
      const baseDelay = Math.random() * (max - min) + min;

      // Occasionally add longer pauses (10% chance)
      const longPause = Math.random() < 0.1 ? Math.random() * 5000 : 0;

      // Slightly increase delay if many recent requests
      const recentRequests = this.connectionAttempts.filter(
        time => Date.now() - time < 30 * 60 * 1000 // Last 30 minutes
      ).length;

      const loadFactor = Math.min(recentRequests * 0.1, 1.0);
      const additionalDelay = loadFactor * 2000;

      return Math.floor(baseDelay + longPause + additionalDelay);
    } catch (error) {
      console.error('Error generating human delay:', error);
      return DEFAULT_SAFETY_SETTINGS.delayBetweenRequests.min;
    }
  }

  /**
   * Record connection attempt
   * @param {boolean} success - Whether the attempt was successful
   */
  recordAttempt(success) {
    const now = Date.now();
    this.connectionAttempts.push(now);
    this.lastActivityTime = now;

    // Keep only last 24 hours of attempts
    const dayAgo = now - 24 * 60 * 60 * 1000;
    this.connectionAttempts = this.connectionAttempts.filter(time => time >= dayAgo);
  }
}

/**
 * Get safety settings with defaults
 * @returns {Promise<Object>} Safety settings
 */
export async function getSafetySettings() {
  try {
    const result = await getStorageData(STORAGE_KEYS.SETTINGS);
    const settings = result.settings || {};

    return {
      ...DEFAULT_SAFETY_SETTINGS,
      ...settings.safety
    };
  } catch (error) {
    console.error('Error getting safety settings:', error);
    return DEFAULT_SAFETY_SETTINGS;
  }
}

/**
 * Update safety settings
 * @param {Object} newSettings - New safety settings
 * @returns {Promise<void>}
 */
export async function updateSafetySettings(newSettings) {
  try {
    const result = await getStorageData(STORAGE_KEYS.SETTINGS);
    const currentSettings = result.settings || {};

    const updatedSettings = {
      ...currentSettings,
      safety: {
        ...DEFAULT_SAFETY_SETTINGS,
        ...currentSettings.safety,
        ...newSettings
      }
    };

    await setStorageData({ [STORAGE_KEYS.SETTINGS]: updatedSettings });
  } catch (error) {
    console.error('Error updating safety settings:', error);
    throw error;
  }
}

/**
 * Check if automation should pause for safety
 * @returns {Promise<Object>} Safety check result
 */
export async function performSafetyCheck() {
  try {
    const settings = await getSafetySettings();

    // Check if safe mode is enabled
    if (!settings.safeModeEnabled) {
      return { safe: true, message: 'Safe mode disabled' };
    }

    // Check for suspicious patterns
    const suspiciousActivity = await detectSuspiciousActivity();
    if (suspiciousActivity.detected) {
      return {
        safe: false,
        reason: 'SUSPICIOUS_ACTIVITY',
        message: suspiciousActivity.message,
        recommendation: 'Pause automation for 1-2 hours'
      };
    }

    // Check LinkedIn compliance
    const complianceCheck = await checkLinkedInCompliance();
    if (!complianceCheck.compliant) {
      return {
        safe: false,
        reason: 'COMPLIANCE_VIOLATION',
        message: complianceCheck.message,
        recommendation: complianceCheck.recommendation
      };
    }

    // Check rate limits
    const rateLimitTracker = new RateLimitTracker();
    const rateCheck = await rateLimitTracker.checkRateLimit();
    if (!rateCheck.allowed) {
      return {
        safe: false,
        reason: rateCheck.reason,
        message: rateCheck.message,
        waitUntil: rateCheck.waitUntil
      };
    }

    return {
      safe: true,
      remainingDaily: rateCheck.remainingDaily,
      remainingHourly: rateCheck.remainingHourly
    };
  } catch (error) {
    console.error('Error performing safety check:', error);
    return {
      safe: false,
      reason: 'ERROR',
      message: 'Unable to perform safety check'
    };
  }
}

/**
 * Detect suspicious activity patterns
 * @returns {Promise<Object>} Suspicious activity check result
 */
async function detectSuspiciousActivity() {
  try {
    const result = await getStorageData(STORAGE_KEYS.ANALYTICS);
    const recentActivity = (result.analytics || []).filter(
      entry => Date.now() - entry.timestamp < 60 * 60 * 1000 // Last hour
    );

    // Check for too many rapid requests
    const connectionAttempts = recentActivity.filter(entry => entry.type === 'connection_sent');

    if (connectionAttempts.length > 10) {
      return {
        detected: true,
        message: 'Too many connection attempts in the last hour'
      };
    }

    // Check for too many failures
    const failures = recentActivity.filter(entry => entry.type === 'connection_failed');

    if (failures.length > 5) {
      return {
        detected: true,
        message: 'High failure rate detected'
      };
    }

    // Check for uniform timing (too robotic)
    if (connectionAttempts.length >= 3) {
      const timings = connectionAttempts
        .sort((a, b) => a.timestamp - b.timestamp)
        .reduce((intervals, current, index, array) => {
          if (index > 0) {
            intervals.push(current.timestamp - array[index - 1].timestamp);
          }
          return intervals;
        }, []);

      const avgInterval = timings.reduce((a, b) => a + b, 0) / timings.length;
      const variance =
        timings.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) /
        timings.length;

      // If variance is too low, timing is too uniform (robotic)
      if (variance < 1000000) {
        // Less than 1 second variance
        return {
          detected: true,
          message: 'Robotic timing patterns detected'
        };
      }
    }

    return { detected: false };
  } catch (error) {
    console.error('Error detecting suspicious activity:', error);
    return { detected: false };
  }
}

/**
 * Check LinkedIn compliance
 * @returns {Promise<Object>} Compliance check result
 */
async function checkLinkedInCompliance() {
  try {
    const settings = await getSafetySettings();

    if (!settings.respectLinkedInLimits) {
      return {
        compliant: false,
        message: 'LinkedIn limits not being respected',
        recommendation: 'Enable LinkedIn limits compliance'
      };
    }

    // Check daily LinkedIn limits (LinkedIn allows ~100-200 per week)
    const result = await getStorageData(STORAGE_KEYS.ANALYTICS);
    const weekStart = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weeklyConnections = (result.analytics || []).filter(
      entry => entry.type === 'connection_sent' && entry.timestamp >= weekStart
    );

    if (weeklyConnections.length > 100) {
      return {
        compliant: false,
        message: 'Approaching LinkedIn weekly connection limits',
        recommendation: 'Reduce connection frequency'
      };
    }

    return { compliant: true };
  } catch (error) {
    console.error('Error checking LinkedIn compliance:', error);
    return { compliant: true }; // Default to compliant on error
  }
}

/**
 * Check if current time is within working hours
 * @param {Object} workingHours - Working hours configuration
 * @returns {boolean} True if within working hours
 */
function isWithinWorkingHours(workingHours) {
  if (!workingHours.enabled) {
    return true;
  }

  const now = new Date();
  const currentTime = now.getHours() * 100 + now.getMinutes();

  const startTime = parseTime(workingHours.start);
  const endTime = parseTime(workingHours.end);

  return currentTime >= startTime && currentTime <= endTime;
}

/**
 * Parse time string to numeric format
 * @param {string} timeStr - Time string (e.g., "09:30")
 * @returns {number} Numeric time (e.g., 930)
 */
function parseTime(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 100 + minutes;
}

/**
 * Check if current day is weekend
 * @returns {boolean} True if weekend
 */
function isWeekend() {
  const day = new Date().getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

/**
 * Get next working hour start time
 * @param {Object} workingHours - Working hours configuration
 * @returns {number} Timestamp of next working hour start
 */
function getNextWorkingHourStart(workingHours) {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [startHour, startMinute] = workingHours.start.split(':').map(Number);
  tomorrow.setHours(startHour, startMinute, 0, 0);

  return tomorrow.getTime();
}

/**
 * Get next weekday start time
 * @returns {number} Timestamp of next weekday start
 */
function getNextWeekdayStart() {
  const now = new Date();
  const nextWeekday = new Date(now);

  // Find next Monday
  const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
  nextWeekday.setDate(now.getDate() + daysUntilMonday);
  nextWeekday.setHours(9, 0, 0, 0); // 9 AM Monday

  return nextWeekday.getTime();
}

/**
 * Create rate limit tracker instance
 * @returns {RateLimitTracker} Rate limit tracker
 */
export function createRateLimitTracker() {
  return new RateLimitTracker();
}

/**
 * Emergency stop automation
 * @param {string} reason - Reason for emergency stop
 * @returns {Promise<void>}
 */
export async function emergencyStopAutomation(reason) {
  try {
    const settings = await getSafetySettings();
    const updatedSettings = {
      ...settings,
      emergencyStop: {
        enabled: true,
        reason: reason,
        timestamp: Date.now()
      }
    };

    await updateSafetySettings(updatedSettings);

    // Log the emergency stop
    const result = await getStorageData(STORAGE_KEYS.ANALYTICS);
    const analyticsData = result.analytics || [];

    analyticsData.push({
      type: 'emergency_stop',
      reason: reason,
      timestamp: Date.now()
    });

    await setStorageData({ [STORAGE_KEYS.ANALYTICS]: analyticsData });
  } catch (error) {
    console.error('Error performing emergency stop:', error);
  }
}
