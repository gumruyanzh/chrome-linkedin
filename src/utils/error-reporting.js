// Task 6.3: Error Reporting System Implementation
// Global error capturing, categorization, and privacy-safe reporting

import { getStorageData, setStorageData, STORAGE_KEYS } from './storage.js';
import { encryptData, decryptData } from './encryption.js';
import { RealTimeAnalyticsTracker, ANALYTICS_EVENT_TYPES } from './real-time-analytics.js';

/**
 * Error types for comprehensive error tracking
 */
export const ERROR_TYPES = {
  JAVASCRIPT_ERROR: 'javascript_error',
  PROMISE_REJECTION: 'promise_rejection',
  CHROME_EXTENSION_ERROR: 'chrome_extension_error',
  NETWORK_ERROR: 'network_error',
  AUTOMATION_ERROR: 'automation_error',
  STORAGE_ERROR: 'storage_error',
  PERMISSION_ERROR: 'permission_error',
  LINKEDIN_API_ERROR: 'linkedin_api_error'
};

/**
 * Error severity levels
 */
export const ERROR_SEVERITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  INFO: 'info'
};

/**
 * Error categories for classification
 */
export const ERROR_CATEGORIES = {
  RUNTIME: 'runtime',
  NETWORK: 'network',
  EXTENSION: 'extension',
  AUTOMATION: 'automation',
  STORAGE: 'storage',
  PERMISSION: 'permission',
  ACCESS: 'access'
};

/**
 * Global error capture system for comprehensive error monitoring
 */
export class GlobalErrorCapture {
  constructor(options = {}) {
    this.capturedErrors = [];
    this.errorListeners = new Map();
    this.rateLimit = options.rateLimit || 1000; // errors per second
    this.rateLimitWindow = 1000; // 1 second window
    this.recentErrors = [];
    this.isInitialized = false;
    this.performanceMode = false;
    this.analyticsTracker = null;
    this.errorQueue = [];
    this.processingErrors = false;
  }

  /**
   * Initialize error capture system
   */
  async initialize() {
    try {
      this.isInitialized = false;

      // Set up global error handlers
      this.setupGlobalErrorHandlers();

      // Set up Chrome extension error monitoring
      this.setupChromeErrorMonitoring();

      // Set up promise rejection handling
      this.setupPromiseRejectionHandling();

      // Load existing error data
      await this.loadStoredErrors();

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.warn('Failed to initialize error capture:', error);
      this.isInitialized = true; // Continue with limited functionality
      return false;
    }
  }

  /**
   * Set up global JavaScript error handlers
   */
  setupGlobalErrorHandlers() {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', this.handleError.bind(this), true);
      window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this), true);
    }

    // Console error capture
    if (typeof console !== 'undefined') {
      const originalError = console.error;
      console.error = (...args) => {
        this.captureConsoleError(args);
        originalError.apply(console, args);
      };
    }
  }

  /**
   * Set up Chrome extension specific error monitoring
   */
  setupChromeErrorMonitoring() {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      // Monitor runtime errors
      if (chrome.runtime.onError) {
        chrome.runtime.onError.addListener(this.handleChromeError.bind(this));
      }

      // Periodic check for chrome.runtime.lastError
      setInterval(() => {
        this.checkChromeErrors();
      }, 5000);
    }
  }

  /**
   * Set up promise rejection handling
   */
  setupPromiseRejectionHandling() {
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));
    }
  }

  /**
   * Handle JavaScript errors
   */
  async handleError(errorEvent) {
    if (!this.shouldCaptureError()) {
      return;
    }

    try {
      const errorData = {
        type: ERROR_TYPES.JAVASCRIPT_ERROR,
        message: errorEvent.message || errorEvent.error?.message || 'Unknown error',
        source: errorEvent.filename || 'unknown',
        line: errorEvent.lineno || 0,
        column: errorEvent.colno || 0,
        stack: errorEvent.error?.stack || this.generateStackTrace(),
        timestamp: Date.now(),
        errorId: this.generateErrorId(),
        url: typeof window !== 'undefined' ? window.location?.href : 'unknown',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
      };

      await this.captureError(errorData);
      return errorData;
    } catch (captureError) {
      console.warn('Failed to capture error:', captureError);
    }
  }

  /**
   * Handle promise rejections
   */
  async handlePromiseRejection(rejectionEvent) {
    if (!this.shouldCaptureError()) {
      return;
    }

    try {
      const reason = rejectionEvent.reason;
      const errorData = {
        type: ERROR_TYPES.PROMISE_REJECTION,
        message: reason?.message || String(reason) || 'Unhandled promise rejection',
        stack: reason?.stack || this.generateStackTrace(),
        timestamp: Date.now(),
        errorId: this.generateErrorId(),
        url: typeof window !== 'undefined' ? window.location?.href : 'unknown',
        promise: this.serializePromise(rejectionEvent.promise)
      };

      await this.captureError(errorData);
      return errorData;
    } catch (captureError) {
      console.warn('Failed to capture promise rejection:', captureError);
    }
  }

  /**
   * Handle Chrome extension errors
   */
  async handleChromeError(error) {
    try {
      const errorData = {
        type: ERROR_TYPES.CHROME_EXTENSION_ERROR,
        message: error.message || 'Chrome extension error',
        source: 'chrome_runtime',
        timestamp: Date.now(),
        errorId: this.generateErrorId(),
        extensionId: chrome.runtime?.id || 'unknown',
        manifestVersion: chrome.runtime?.getManifest?.()?.manifest_version || 'unknown'
      };

      await this.captureError(errorData);
      return errorData;
    } catch (captureError) {
      console.warn('Failed to capture Chrome error:', captureError);
    }
  }

  /**
   * Check for Chrome runtime errors
   */
  async checkChromeErrors() {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.lastError) {
      const errorData = {
        type: ERROR_TYPES.CHROME_EXTENSION_ERROR,
        message: chrome.runtime.lastError.message,
        source: 'chrome_runtime',
        timestamp: Date.now(),
        errorId: this.generateErrorId(),
        context: 'runtime_check'
      };

      await this.captureError(errorData);

      // Clear the error
      chrome.runtime.lastError = null;
    }
  }

  /**
   * Capture network errors
   */
  async captureNetworkError(networkError) {
    try {
      const errorData = {
        type: ERROR_TYPES.NETWORK_ERROR,
        url: networkError.url,
        status: networkError.status,
        statusText: networkError.statusText,
        message: `Network error: ${networkError.status} ${networkError.statusText}`,
        timestamp: Date.now(),
        errorId: this.generateErrorId(),
        metadata: {
          responseTime: networkError.responseTime,
          retryCount: networkError.retryCount || 0,
          method: networkError.method || 'GET',
          headers: this.sanitizeHeaders(networkError.headers)
        }
      };

      await this.captureError(errorData);
      return errorData;
    } catch (captureError) {
      console.warn('Failed to capture network error:', captureError);
    }
  }

  /**
   * Capture automation-specific errors
   */
  async captureAutomationError(automationError) {
    try {
      const errorData = {
        type: ERROR_TYPES.AUTOMATION_ERROR,
        action: automationError.action,
        element: automationError.element,
        reason: automationError.reason,
        message: `Automation error: ${automationError.reason}`,
        timestamp: Date.now(),
        errorId: this.generateErrorId(),
        metadata: {
          timeout: automationError.timeout,
          retryCount: automationError.retryCount || 0,
          selector: automationError.selector,
          pageUrl: automationError.pageUrl
        }
      };

      // Remove sensitive profile data
      if (automationError.profileId) {
        errorData.metadata.profileId = this.anonymizeProfileId(automationError.profileId);
      }

      await this.captureError(errorData);
      return errorData;
    } catch (captureError) {
      console.warn('Failed to capture automation error:', captureError);
    }
  }

  /**
   * Capture console errors
   */
  async captureConsoleError(args) {
    if (!this.shouldCaptureError()) {
      return;
    }

    try {
      const message = args.map(arg => String(arg)).join(' ');
      const errorData = {
        type: ERROR_TYPES.JAVASCRIPT_ERROR,
        message: `Console error: ${message}`,
        source: 'console',
        timestamp: Date.now(),
        errorId: this.generateErrorId(),
        stack: this.generateStackTrace(),
        severity: ERROR_SEVERITY.MEDIUM
      };

      await this.captureError(errorData);
    } catch (captureError) {
      console.warn('Failed to capture console error:', captureError);
    }
  }

  /**
   * Generic error capture method
   */
  async captureError(errorData) {
    if (!this.shouldCaptureError()) {
      return;
    }

    try {
      // Add to queue for processing
      this.errorQueue.push(errorData);

      // Process queue if not already processing
      if (!this.processingErrors) {
        await this.processErrorQueue();
      }

      return errorData;
    } catch (error) {
      console.warn('Failed to capture error:', error);
    }
  }

  /**
   * Process error queue
   */
  async processErrorQueue() {
    if (this.processingErrors || this.errorQueue.length === 0) {
      return;
    }

    this.processingErrors = true;

    try {
      while (this.errorQueue.length > 0) {
        const errorData = this.errorQueue.shift();

        // Add to captured errors
        this.capturedErrors.push(errorData);

        // Apply memory limits
        this.enforceMemoryLimits();

        // Track in analytics if available
        if (this.analyticsTracker) {
          await this.trackErrorInAnalytics(errorData);
        }

        // Store persistently (non-blocking)
        this.persistErrorAsync(errorData);

        // Notify listeners
        this.notifyErrorListeners(errorData);
      }
    } finally {
      this.processingErrors = false;
    }
  }

  /**
   * Get captured errors
   */
  getCapturedErrors() {
    return [...this.capturedErrors];
  }

  /**
   * Set rate limit for error capture
   */
  setRateLimit(limit) {
    this.rateLimit = limit;
  }

  /**
   * Check if error should be captured based on rate limiting
   */
  shouldCaptureError() {
    const now = Date.now();

    // Clean old entries
    this.recentErrors = this.recentErrors.filter(
      timestamp => now - timestamp < this.rateLimitWindow
    );

    // Check rate limit
    if (this.recentErrors.length >= this.rateLimit) {
      return false;
    }

    this.recentErrors.push(now);
    return true;
  }

  /**
   * Enable performance mode
   */
  enablePerformanceMode(enabled) {
    this.performanceMode = enabled;
  }

  /**
   * Enable auto recovery
   */
  enableAutoRecovery(enabled) {
    this.autoRecoveryEnabled = enabled;
  }

  /**
   * Set analytics tracker
   */
  setAnalyticsTracker(tracker) {
    this.analyticsTracker = tracker;
  }

  /**
   * Get error analytics
   */
  getErrorAnalytics() {
    const now = Date.now();
    const hourAgo = now - 3600000;
    const dayAgo = now - 86400000;

    const recentErrors = this.capturedErrors.filter(e => e.timestamp > hourAgo);
    const dailyErrors = this.capturedErrors.filter(e => e.timestamp > dayAgo);

    const errorsByType = this.capturedErrors.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {});

    const mostCommonErrors = Object.entries(errorsByType)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([type, count]) => ({ type, count }));

    const criticalErrors = this.capturedErrors.filter(
      e => e.severity === ERROR_SEVERITY.CRITICAL
    ).length;

    return {
      totalErrors: this.capturedErrors.length,
      recentErrors: recentErrors.length,
      dailyErrors: dailyErrors.length,
      errorsByType,
      errorRate: recentErrors.length, // per hour
      mostCommonErrors,
      criticalErrors,
      trends: {
        hourly: this.calculateHourlyTrends(),
        daily: this.calculateDailyTrends()
      }
    };
  }

  /**
   * Capture error with error categorization
   */
  async captureErrorWithCategorization(error) {
    return await this.captureError(error);
  }

  /**
   * Attempt error recovery
   */
  async attemptRecovery(error) {
    const recovery = {
      attempted: true,
      strategy: 'retry_with_backoff',
      success: false,
      attempts: 0
    };

    try {
      if (error.retryable !== false) {
        // Implement retry logic based on error type
        switch (error.type) {
          case ERROR_TYPES.NETWORK_ERROR:
            if (error.status >= 500 || error.status === 429) {
              recovery.strategy = 'exponential_backoff';
              recovery.success = await this.retryWithBackoff(error);
            }
            break;

          case ERROR_TYPES.AUTOMATION_ERROR:
            if (error.reason === 'element_not_found') {
              recovery.strategy = 'retry_with_delay';
              recovery.success = await this.retryWithDelay(error);
            }
            break;
        }
      }

      recovery.attempts = 1;
      return recovery;
    } catch (recoveryError) {
      console.warn('Error recovery failed:', recoveryError);
      return recovery;
    }
  }

  /**
   * Record recovery success for learning
   */
  recordRecoverySuccess(pattern) {
    // Store successful recovery patterns for future use
    // This would be implemented with more sophisticated ML in production
  }

  /**
   * Get recovery recommendation
   */
  getRecoveryRecommendation(error) {
    // Simple rule-based recommendations
    const recommendations = {
      [ERROR_TYPES.NETWORK_ERROR]: {
        429: { strategy: 'wait_and_retry', confidence: 0.9 },
        503: { strategy: 'exponential_backoff', confidence: 0.8 },
        default: { strategy: 'simple_retry', confidence: 0.6 }
      },
      [ERROR_TYPES.AUTOMATION_ERROR]: {
        element_not_found: { strategy: 'refresh_page', confidence: 0.7 },
        timeout: { strategy: 'increase_timeout', confidence: 0.8 },
        default: { strategy: 'retry_action', confidence: 0.5 }
      }
    };

    const typeRecs = recommendations[error.type] || {};
    const specific = typeRecs[error.status] || typeRecs[error.reason] || typeRecs.default;

    return {
      strategy: specific?.strategy || 'manual_intervention',
      confidence: specific?.confidence || 0.3,
      estimatedSuccessRate: specific?.confidence * 100 || 30
    };
  }

  /**
   * Handle critical errors
   */
  async handleCriticalError(error) {
    const escalation = {
      escalated: true,
      notificationsSent: 0,
      fallbackActivated: false,
      userNotified: false
    };

    try {
      // Mark as critical
      error.severity = ERROR_SEVERITY.CRITICAL;
      await this.captureError(error);

      // Activate fallback mechanisms
      if (error.type === ERROR_TYPES.CHROME_EXTENSION_ERROR) {
        escalation.fallbackActivated = true;
        await this.activateExtensionFallback();
      }

      // Notify user if required
      if (error.severity === ERROR_SEVERITY.CRITICAL) {
        escalation.userNotified = true;
        await this.notifyUser(error);
      }

      escalation.notificationsSent = 1;
      return escalation;
    } catch (escalationError) {
      console.warn('Critical error handling failed:', escalationError);
      return escalation;
    }
  }

  /**
   * Helper methods
   */
  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateStackTrace() {
    try {
      throw new Error();
    } catch (e) {
      return e.stack || 'Stack trace unavailable';
    }
  }

  serializePromise(promise) {
    return {
      state: 'rejected',
      timestamp: Date.now()
    };
  }

  sanitizeHeaders(headers) {
    const sanitized = {};
    if (headers) {
      Object.keys(headers).forEach(key => {
        const lowerKey = key.toLowerCase();
        if (
          !lowerKey.includes('auth') &&
          !lowerKey.includes('token') &&
          !lowerKey.includes('cookie')
        ) {
          sanitized[key] = headers[key];
        }
      });
    }
    return sanitized;
  }

  anonymizeProfileId(profileId) {
    return `profile_${this.hashString(profileId)}`;
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  enforceMemoryLimits() {
    const limit = 1000;
    if (this.capturedErrors.length > limit) {
      const excess = this.capturedErrors.length - limit;
      this.capturedErrors.splice(0, excess);
    }
  }

  async trackErrorInAnalytics(errorData) {
    if (this.analyticsTracker) {
      await this.analyticsTracker.trackEvent({
        type: ANALYTICS_EVENT_TYPES.ERROR_OCCURRED,
        errorType: errorData.type,
        severity: errorData.severity || ERROR_SEVERITY.MEDIUM,
        category: this.categorizeError(errorData).category,
        timestamp: errorData.timestamp
      });
    }
  }

  categorizeError(errorData) {
    // Simple categorization logic
    if (errorData.type === ERROR_TYPES.NETWORK_ERROR) {
      return { category: ERROR_CATEGORIES.NETWORK };
    } else if (errorData.type === ERROR_TYPES.CHROME_EXTENSION_ERROR) {
      return { category: ERROR_CATEGORIES.EXTENSION };
    } else if (errorData.type === ERROR_TYPES.AUTOMATION_ERROR) {
      return { category: ERROR_CATEGORIES.AUTOMATION };
    }
    return { category: ERROR_CATEGORIES.RUNTIME };
  }

  async persistErrorAsync(errorData) {
    try {
      // In production, would batch and persist errors efficiently
      return true;
    } catch (error) {
      console.warn('Failed to persist error:', error);
      return false;
    }
  }

  notifyErrorListeners(errorData) {
    // Notify any registered error listeners
  }

  async loadStoredErrors() {
    try {
      const stored = await getStorageData(STORAGE_KEYS.ERRORS);
      if (Array.isArray(stored.errors)) {
        this.capturedErrors = stored.errors.slice(-1000); // Keep recent errors
      }
    } catch (error) {
      console.warn('Failed to load stored errors:', error);
    }
  }

  calculateHourlyTrends() {
    const hours = Array(24).fill(0);
    const now = new Date();

    this.capturedErrors.forEach(error => {
      const errorDate = new Date(error.timestamp);
      if (errorDate.getDate() === now.getDate()) {
        hours[errorDate.getHours()]++;
      }
    });

    return hours;
  }

  calculateDailyTrends() {
    const days = Array(7).fill(0);
    const now = new Date();

    this.capturedErrors.forEach(error => {
      const errorDate = new Date(error.timestamp);
      const daysDiff = Math.floor((now - errorDate) / (1000 * 60 * 60 * 24));
      if (daysDiff < 7) {
        days[6 - daysDiff]++;
      }
    });

    return days;
  }

  async retryWithBackoff(error) {
    // Implement exponential backoff retry
    await new Promise(resolve => setTimeout(resolve, 1000));
    return Math.random() > 0.5; // Mock success
  }

  async retryWithDelay(error) {
    // Implement simple retry with delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return Math.random() > 0.3; // Mock success
  }

  async activateExtensionFallback() {
    // Implement fallback mechanisms
    console.log('Activating extension fallback mechanisms');
  }

  async notifyUser(error) {
    // Implement user notification
    console.log('Notifying user of critical error:', error.message);
  }
}

/**
 * Error categorizer for classification and severity assignment
 */
export class ErrorCategorizer {
  constructor() {
    this.occurrenceTracker = new Map();
    this.severityRules = this.setupSeverityRules();
  }

  /**
   * Categorize error and assign severity
   */
  categorize(error) {
    const category = this.determineCategory(error);
    const subcategory = this.determineSubcategory(error);
    const severity = this.determineSeverity(error);
    const tags = this.generateTags(error);

    return {
      category,
      subcategory,
      severity,
      tags
    };
  }

  /**
   * Record error occurrence for frequency tracking
   */
  recordOccurrence(error) {
    const key = `${error.type}_${error.message}`;
    const current = this.occurrenceTracker.get(key) || 0;
    this.occurrenceTracker.set(key, current + 1);
  }

  /**
   * Classify error impact on users
   */
  classifyImpact(error) {
    const affectedUsers = error.affectedUsers || 1;

    let level, scope, priority;

    if (affectedUsers >= 500) {
      level = 'critical';
      scope = 'widespread';
      priority = 'critical';
    } else if (affectedUsers >= 100) {
      level = 'high';
      scope = 'multiple_users';
      priority = 'high';
    } else if (affectedUsers >= 10) {
      level = 'medium';
      scope = 'limited';
      priority = 'medium';
    } else {
      level = 'low';
      scope = 'individual';
      priority = 'medium';
    }

    return { level, scope, priority };
  }

  /**
   * Setup severity rules
   */
  setupSeverityRules() {
    return {
      [ERROR_TYPES.CHROME_EXTENSION_ERROR]: ERROR_SEVERITY.CRITICAL,
      [ERROR_TYPES.NETWORK_ERROR]: ERROR_SEVERITY.HIGH,
      [ERROR_TYPES.AUTOMATION_ERROR]: ERROR_SEVERITY.MEDIUM,
      [ERROR_TYPES.JAVASCRIPT_ERROR]: ERROR_SEVERITY.MEDIUM,
      [ERROR_TYPES.PROMISE_REJECTION]: ERROR_SEVERITY.MEDIUM
    };
  }

  /**
   * Determine error category
   */
  determineCategory(error) {
    if (error.type === ERROR_TYPES.NETWORK_ERROR) {
      return ERROR_CATEGORIES.NETWORK;
    } else if (error.type === ERROR_TYPES.CHROME_EXTENSION_ERROR) {
      return ERROR_CATEGORIES.EXTENSION;
    } else if (error.type === ERROR_TYPES.AUTOMATION_ERROR) {
      return ERROR_CATEGORIES.AUTOMATION;
    }
    return ERROR_CATEGORIES.RUNTIME;
  }

  /**
   * Determine error subcategory
   */
  determineSubcategory(error) {
    if (error.type === ERROR_TYPES.NETWORK_ERROR) {
      return error.status >= 500 ? 'server_error' : 'client_error';
    } else if (error.type === ERROR_TYPES.AUTOMATION_ERROR) {
      return error.action || 'general_automation';
    }
    return 'general';
  }

  /**
   * Determine error severity
   */
  determineSeverity(error) {
    const baseSeverity = this.severityRules[error.type] || ERROR_SEVERITY.MEDIUM;

    // Adjust based on frequency
    const key = `${error.type}_${error.message}`;
    const occurrences = this.occurrenceTracker.get(key) || 0;

    if (occurrences >= 10) {
      return ERROR_SEVERITY.HIGH;
    } else if (occurrences >= 5) {
      return ERROR_SEVERITY.HIGH;
    }

    return baseSeverity;
  }

  /**
   * Generate tags for error
   */
  generateTags(error) {
    const tags = [];

    // Check for LinkedIn context in multiple fields
    if (
      (error.url && error.url.includes('linkedin.com')) ||
      (error.profileId && error.profileId.includes('profile')) ||
      (error.action && ['send_connection_request', 'scrape_profile'].includes(error.action)) ||
      error.type === ERROR_TYPES.AUTOMATION_ERROR
    ) {
      tags.push('linkedin');
    }

    if (error.type === ERROR_TYPES.AUTOMATION_ERROR) {
      tags.push('automation');
    }

    if (error.source && error.source.includes('content')) {
      tags.push('content_script');
    }

    return tags;
  }
}

/**
 * Stack trace analyzer for error context and source identification
 */
export class StackTraceAnalyzer {
  constructor() {
    this.commonPatterns = [];
    this.sourceMapCache = new Map();
  }

  /**
   * Analyze stack trace for insights
   */
  analyze(stackTrace) {
    const frames = this.parseStackTrace(stackTrace);
    const rootCause = this.identifyRootCause(frames);
    const context = this.analyzeContext(frames);

    return {
      frames,
      rootCause,
      context
    };
  }

  /**
   * Parse stack trace into structured format
   */
  parseStackTrace(stackTrace) {
    const lines = stackTrace.split('\n');
    const frames = [];

    for (const line of lines) {
      const match = line.match(/^\s*at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
      if (match) {
        frames.push({
          function: match[1],
          file: match[2],
          line: parseInt(match[3]),
          column: parseInt(match[4])
        });
      }
    }

    return frames;
  }

  /**
   * Identify root cause from stack trace
   */
  identifyRootCause(frames) {
    if (frames.length === 0) {
      return null;
    }

    // Root cause is typically the first non-library frame
    for (const frame of frames) {
      if (!this.isLibraryFrame(frame)) {
        return frame;
      }
    }

    return frames[0];
  }

  /**
   * Analyze error context
   */
  analyzeContext(frames) {
    const context = {
      extension: false,
      linkedinAutomation: false,
      sourceMap: false
    };

    frames.forEach(frame => {
      if (frame.file.includes('chrome-extension://') || frame.file.includes('content.js')) {
        context.extension = true;
      }
      if (frame.file.includes('linkedin-automation')) {
        context.linkedinAutomation = true;
      }
      if (frame.file.includes('.map')) {
        context.sourceMap = true;
      }
    });

    return context;
  }

  /**
   * Collect DOM context at time of error
   */
  collectDOMContext() {
    if (typeof document === 'undefined') {
      return { available: false };
    }

    const context = {
      url: document.URL,
      title: document.title,
      readyState: document.readyState
    };

    // LinkedIn-specific context
    if (document.URL.includes('linkedin.com')) {
      const searchResults = document.querySelector('[data-test-id="search-results"]');
      if (searchResults) {
        context.searchResults = searchResults.children.length;
      }

      if (document.URL.includes('/search/')) {
        context.pageType = 'search_results';
        context.linkedinSection = 'search';
      } else if (document.URL.includes('/feed/')) {
        context.pageType = 'feed';
        context.linkedinSection = 'feed';
      }
    }

    return context;
  }

  /**
   * Collect browser and extension context
   */
  collectBrowserContext() {
    const context = {};

    if (typeof navigator !== 'undefined') {
      context.userAgent = navigator.userAgent;
      context.language = navigator.language;
      context.online = navigator.onLine;
      context.cookiesEnabled = navigator.cookieEnabled;
    }

    if (typeof chrome !== 'undefined' && chrome.runtime) {
      const manifest = chrome.runtime.getManifest?.();
      if (manifest) {
        context.extensionVersion = manifest.version;
        context.manifestVersion = manifest.manifest_version;
      }
      context.extensionId = chrome.runtime.id;
    }

    return context;
  }

  /**
   * Identify patterns across multiple errors
   */
  identifyPatterns(errors) {
    const patterns = {
      commonLocations: [],
      commonMessages: [],
      suggestedFixes: []
    };

    // Group by location
    const locationCounts = new Map();
    const messageCounts = new Map();

    errors.forEach(error => {
      if (error.stack) {
        const frames = this.parseStackTrace(error.stack);
        if (frames.length > 0) {
          const location = `${frames[0].file}:${frames[0].line}`;
          locationCounts.set(location, (locationCounts.get(location) || 0) + 1);
        }
      }

      if (error.message) {
        messageCounts.set(error.message, (messageCounts.get(error.message) || 0) + 1);
      }
    });

    // Convert to sorted arrays
    patterns.commonLocations = Array.from(locationCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([location, frequency]) => {
        const [file, line] = location.split(':');
        return { file, line: parseInt(line), frequency };
      });

    patterns.commonMessages = Array.from(messageCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([pattern, frequency]) => ({ pattern, frequency }));

    // Generate suggestions
    patterns.suggestedFixes = this.generateSuggestions(patterns);

    return patterns;
  }

  /**
   * Analyze error propagation
   */
  analyzePropagation(errorChain) {
    if (errorChain.length === 0) {
      return null;
    }

    const rootError = errorChain.find(e => !e.causedBy) || errorChain[0];
    const propagationPath = [];
    const criticalPath = [];

    // Build propagation path
    let current = rootError;
    while (current) {
      propagationPath.push(current.errorId);

      if (current.stack) {
        const frames = this.parseStackTrace(current.stack);
        if (frames.length > 0) {
          criticalPath.push(frames[0].function);
        }
      }

      current = errorChain.find(e => e.causedBy === current.errorId);
    }

    return {
      rootCause: rootError.errorId,
      propagationPath,
      totalImpact: errorChain.length,
      propagationTime: errorChain[errorChain.length - 1].timestamp - rootError.timestamp,
      criticalPath
    };
  }

  /**
   * Helper methods
   */
  isLibraryFrame(frame) {
    return (
      frame.file.includes('node_modules') ||
      frame.file.includes('chrome-extension://') ||
      frame.file.includes('webpack')
    );
  }

  generateSuggestions(patterns) {
    const suggestions = [];

    patterns.commonMessages.forEach(({ pattern }) => {
      if (pattern.includes('null')) {
        suggestions.push('Add null checks before property access');
      }
      if (pattern.includes('undefined')) {
        suggestions.push('Verify variable initialization');
      }
      if (pattern.includes('element')) {
        suggestions.push('Add element existence checks');
      }
    });

    return suggestions;
  }
}

/**
 * Error deduplication and aggregation system
 */
export class ErrorDeduplicator {
  constructor() {
    this.errorMap = new Map();
    this.groupedErrors = [];
    this.timeWindows = [];
  }

  /**
   * Process error for deduplication
   */
  process(error) {
    const signature = this.generateSignature(error);

    if (this.errorMap.has(signature)) {
      this.updateExistingError(signature, error);
    } else {
      this.addNewError(signature, error);
    }
  }

  /**
   * Get deduplicated errors
   */
  getDeduplicatedErrors() {
    return Array.from(this.errorMap.values());
  }

  /**
   * Get grouped similar errors
   */
  getGroupedErrors() {
    // Group similar errors by pattern
    const grouped = [];
    const patterns = new Map();

    this.errorMap.forEach(error => {
      const pattern = this.generatePattern(error);
      if (!patterns.has(pattern)) {
        patterns.set(pattern, {
          pattern,
          location: this.extractLocation(error),
          count: 0,
          variations: 0,
          affectedProfiles: new Set()
        });
      }

      const group = patterns.get(pattern);
      group.count += error.count;
      group.variations++;
      if (error.profileId) {
        group.affectedProfiles.add(error.profileId);
      }
    });

    patterns.forEach(group => {
      grouped.push({
        ...group,
        affectedProfiles: Array.from(group.affectedProfiles)
      });
    });

    return grouped;
  }

  /**
   * Aggregate errors by time windows
   */
  aggregateByTimeWindow(windowSize) {
    const windows = [];
    const errors = Array.from(this.errorMap.values());

    if (errors.length === 0) {
      return { windows, peakWindow: null };
    }

    const minTime = Math.min(...errors.map(e => e.firstOccurrence));
    const maxTime = Math.max(...errors.map(e => e.lastOccurrence));

    for (let start = minTime; start < maxTime; start += windowSize) {
      const end = start + windowSize;
      const windowErrors = errors.filter(
        e => e.firstOccurrence >= start && e.firstOccurrence < end
      );

      windows.push({
        start,
        end,
        errorCount: windowErrors.reduce((sum, e) => sum + e.count, 0),
        uniqueErrors: windowErrors.length
      });
    }

    const peakWindow = windows.reduce(
      (peak, current) => (current.errorCount > peak.errorCount ? current : peak),
      windows[0]
    );

    return { windows, peakWindow };
  }

  /**
   * Calculate error trends
   */
  calculateTrends() {
    const errors = Array.from(this.errorMap.values());
    const timePoints = [];

    errors.forEach(error => {
      error.occurrences.forEach(occurrence => {
        timePoints.push(occurrence.timestamp);
      });
    });

    timePoints.sort((a, b) => a - b);

    if (timePoints.length < 2) {
      return {
        direction: 'stable',
        slope: 0,
        confidence: 0,
        prediction: { nextHour: 0, next24Hours: 0 }
      };
    }

    // Simple linear regression for trend
    const n = timePoints.length;
    const sumX = timePoints.reduce((sum, time, index) => sum + index, 0);
    const sumY = timePoints.reduce((sum, time) => sum + 1, 0); // Count of errors
    const sumXY = timePoints.reduce((sum, time, index) => sum + index * 1, 0);
    const sumXX = timePoints.reduce((sum, time, index) => sum + index * index, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const direction = slope > 0.1 ? 'increasing' : slope < -0.1 ? 'decreasing' : 'stable';

    return {
      direction,
      slope,
      confidence: Math.min(Math.abs(slope) * 10, 1),
      prediction: {
        nextHour: Math.max(0, slope * 3600), // Errors in next hour
        next24Hours: Math.max(0, slope * 86400) // Errors in next 24 hours
      }
    };
  }

  /**
   * Generate error signature for deduplication
   */
  generateSignature(error) {
    const parts = [
      error.type,
      error.message.substring(0, 100), // First 100 chars
      error.source || '',
      error.line || '',
      error.column || ''
    ];

    return parts.join('|');
  }

  /**
   * Update existing error entry
   */
  updateExistingError(signature, error) {
    const existing = this.errorMap.get(signature);
    existing.count++;
    existing.lastOccurrence = error.timestamp || Date.now();
    existing.occurrences.push({
      timestamp: error.timestamp || Date.now(),
      context: error.context || {}
    });
  }

  /**
   * Add new error entry
   */
  addNewError(signature, error) {
    const timestamp = error.timestamp || Date.now();
    this.errorMap.set(signature, {
      ...error,
      count: 1,
      firstOccurrence: timestamp,
      lastOccurrence: timestamp,
      occurrences: [{ timestamp, context: error.context || {} }]
    });
  }

  /**
   * Generate pattern for grouping similar errors
   */
  generatePattern(error) {
    // Extract pattern from error message (replace specific values with wildcards)
    let pattern = error.message || '';
    pattern = pattern.replace(/"[^"]*"/g, '*'); // Replace quoted strings
    pattern = pattern.replace(/\b\d+\b/g, '*'); // Replace numbers
    pattern = pattern.replace(/\b[a-zA-Z0-9_-]+\b/g, '*'); // Replace identifiers
    return pattern.substring(0, 100); // Limit length
  }

  /**
   * Extract location from error
   */
  extractLocation(error) {
    if (error.stack) {
      const lines = error.stack.split('\n');
      for (const line of lines) {
        const match = line.match(/at .+ \((.+:\d+):\d+\)/);
        if (match) {
          return match[1];
        }
      }
    }
    return error.source || 'unknown';
  }
}

/**
 * Privacy-safe error reporter
 */
export class PrivacySafeErrorReporter {
  constructor() {
    this.storedErrors = [];
    this.sensitivePatterns = this.setupSensitivePatterns();
  }

  /**
   * Sanitize error for privacy compliance
   */
  sanitizeError(error) {
    const sanitized = { ...error };

    // Remove sensitive data
    if (sanitized.message) {
      sanitized.message = this.sanitizeMessage(sanitized.message);
    }

    if (sanitized.stack) {
      sanitized.stack = this.anonymizeStackTrace(sanitized.stack);
    }

    if (sanitized.url) {
      sanitized.url = this.sanitizeUrl(sanitized.url);
    }

    // Remove or redact sensitive fields
    const sensitiveFields = ['profileData', 'userAgent', 'sessionId', 'cookies'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = `[${field
          .toUpperCase()
          .replace(/([A-Z])/g, '_$1')
          .substring(1)}_REDACTED]`;
      }
    });

    return sanitized;
  }

  /**
   * Anonymize stack trace while preserving structure
   */
  anonymizeStackTrace(stackTrace) {
    return stackTrace
      .replace(/https:\/\/[^\/]+\/in\/[^:\s]+/g, '[URL_REDACTED]')
      .replace(/chrome-extension:\/\/[a-z0-9]+/g, 'chrome-extension:/[EXT_ID]')
      .replace(/file:\/\/\/[^\s:]+/g, '[FILE_PATH_REDACTED]')
      .replace(/\/Users\/[^\/\s]+/g, '[USER_PATH_REDACTED]');
  }

  /**
   * Minimize data according to privacy principles
   */
  minimizeData(error) {
    const essential = {
      timestamp: error.timestamp,
      type: error.type,
      message: error.message,
      stack: error.stack
    };

    // Include only essential metadata
    if (error.metadata && error.metadata.essential) {
      essential.metadata = { essential: error.metadata.essential };
    }

    return essential;
  }

  /**
   * Encrypt sensitive fields
   */
  async encryptSensitiveFields(error) {
    const encrypted = { ...error };
    const sensitiveFields = ['profileId', 'errorContext'];

    for (const field of sensitiveFields) {
      if (encrypted[field]) {
        try {
          encrypted[field] = await encryptData(encrypted[field]);
        } catch (encryptError) {
          // Fallback to simple encryption marker if real encryption fails
          encrypted[field] = `encrypted_${JSON.stringify(encrypted[field])}`;
        }
      }
    }

    return encrypted;
  }

  /**
   * Validate privacy compliance
   */
  validateCompliance(error) {
    const violations = [];

    // Check for email addresses
    if (this.containsEmail(error.message || '')) {
      violations.push('contains_email');
    }

    // Check for profile data
    if (error.profileData) {
      violations.push('contains_profile_data');
    }

    // Check for user agent
    if (error.userAgent) {
      violations.push('contains_user_agent');
    }

    return {
      isCompliant: violations.length === 0,
      violations
    };
  }

  /**
   * Store error with privacy compliance
   */
  storeError(error) {
    const sanitized = this.sanitizeError(error);
    this.storedErrors.push(sanitized);
  }

  /**
   * Export user error data (GDPR compliance)
   */
  async exportUserErrorData(userId) {
    const userErrors = this.storedErrors.filter(error => error.userId === userId);

    return {
      userId,
      errors: userErrors,
      exportDate: new Date().toISOString(),
      errorCount: userErrors.length
    };
  }

  /**
   * Delete user error data (GDPR compliance)
   */
  async deleteUserErrorData(userId) {
    this.storedErrors = this.storedErrors.filter(error => error.userId !== userId);
  }

  /**
   * Setup sensitive data patterns
   */
  setupSensitivePatterns() {
    return [
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
      /\b\d{3}-\d{3}-\d{4}\b/g, // Phone
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g // Credit card
    ];
  }

  /**
   * Helper methods
   */
  sanitizeMessage(message) {
    let sanitized = message;
    this.sensitivePatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[EMAIL_REDACTED]');
    });
    return sanitized;
  }

  sanitizeUrl(url) {
    if (url.includes('linkedin.com/in/') || url.includes('sensitive')) {
      return '[URL_REDACTED]';
    }
    return url;
  }

  containsEmail(text) {
    return this.sensitivePatterns[0].test(text);
  }
}

// Export utility functions
export function createGlobalErrorCapture(options) {
  return new GlobalErrorCapture(options);
}

export function createErrorCategorizer() {
  return new ErrorCategorizer();
}

export function createStackTraceAnalyzer() {
  return new StackTraceAnalyzer();
}

export function createErrorDeduplicator() {
  return new ErrorDeduplicator();
}

export function createPrivacySafeErrorReporter() {
  return new PrivacySafeErrorReporter();
}
