/**
 * Enhanced Error Handling and Recovery Mechanisms
 * Provides comprehensive error handling, recovery strategies, and user feedback
 * for LinkedIn automation with intelligent retry logic and graceful degradation.
 */

export class AutomationErrorHandler {
  constructor(stateManager, options = {}) {
    this.stateManager = stateManager;
    this.isDestroyed = false;

    // Configuration
    this.config = {
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 2000,
      retryBackoffMultiplier: options.retryBackoffMultiplier || 1.5,
      enableAutoRecovery: options.enableAutoRecovery !== false,
      enableUserNotifications: options.enableUserNotifications !== false,
      enableErrorReporting: options.enableErrorReporting !== false,
      recoveryTimeout: options.recoveryTimeout || 30000,
      ...options
    };

    // Error tracking
    this.errorHistory = [];
    this.retryAttempts = new Map();
    this.recoveryStrategies = new Map();
    this.errorCallbacks = new Map();

    // Recovery state
    this.isRecovering = false;
    this.lastErrorTime = null;
    this.recoveryTimer = null;

    this.init();
  }

  /**
   * Initialize error handler
   */
  init() {
    this.setupDefaultRecoveryStrategies();
    this.setupStateManagerListener();

    console.log('AutomationErrorHandler initialized');
  }

  /**
   * Setup default recovery strategies for common errors
   */
  setupDefaultRecoveryStrategies() {
    // Network/Connection errors
    this.addRecoveryStrategy('NetworkError', async (error, context) => {
      console.log('Attempting network error recovery...');
      await this.delay(this.config.retryDelay);

      // Check if we're still on LinkedIn
      if (!this.isOnLinkedIn()) {
        throw new Error('Not on LinkedIn page - manual navigation required');
      }

      // Try to refresh the page state
      await this.refreshPageState();
      return { recovered: true, message: 'Network connection restored' };
    });

    // Content script communication errors
    this.addRecoveryStrategy('ContentScriptError', async (error, context) => {
      console.log('Attempting content script recovery...');

      // Try to re-establish content script connection
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url.includes('linkedin.com')) {
          // Send a ping to check if content script is responding
          const response = await chrome.tabs.sendMessage(tab.id, { type: 'PING' });
          if (response && response.success) {
            return { recovered: true, message: 'Content script connection restored' };
          }
        }
      } catch (pingError) {
        console.log('Content script not responding, suggesting page refresh');
      }

      throw new Error('Content script not responding - please refresh the LinkedIn page');
    });

    // DOM/Page structure errors
    this.addRecoveryStrategy('DOMError', async (error, context) => {
      console.log('Attempting DOM error recovery...');

      // Wait for potential dynamic content loading
      await this.delay(3000);

      // Check if required elements are now available
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url.includes('linkedin.com')) {
          const response = await chrome.tabs.sendMessage(tab.id, { type: 'CHECK_PAGE_STRUCTURE' });
          if (response && response.success) {
            return { recovered: true, message: 'Page structure loaded successfully' };
          }
        }
      } catch (checkError) {
        console.log('Page structure check failed:', checkError);
      }

      throw new Error('Page structure not available - try refreshing or navigating to a different LinkedIn page');
    });

    // Rate limiting errors
    this.addRecoveryStrategy('RateLimitError', async (error, context) => {
      console.log('Attempting rate limit recovery...');

      const waitTime = this.calculateRateLimitWaitTime(error, context);
      await this.delay(waitTime);

      return {
        recovered: true,
        message: `Rate limit recovered after ${Math.round(waitTime / 1000)}s wait`
      };
    });

    // Authentication/Session errors
    this.addRecoveryStrategy('AuthError', async (error, context) => {
      console.log('Attempting authentication recovery...');

      // Check if user is still logged in
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url.includes('linkedin.com')) {
          const response = await chrome.tabs.sendMessage(tab.id, { type: 'CHECK_AUTH_STATUS' });
          if (response && response.isLoggedIn) {
            return { recovered: true, message: 'Authentication verified' };
          }
        }
      } catch (authError) {
        console.log('Auth check failed:', authError);
      }

      throw new Error('Please log in to LinkedIn and try again');
    });

    // Generic timeout errors
    this.addRecoveryStrategy('TimeoutError', async (error, context) => {
      console.log('Attempting timeout error recovery...');

      // Increase delay and retry
      const retryDelay = this.config.retryDelay * 2;
      await this.delay(retryDelay);

      return { recovered: true, message: 'Retry after extended delay' };
    });
  }

  /**
   * Setup state manager event listener
   */
  setupStateManagerListener() {
    this.stateManager.addListener((event, data) => {
      if (event === 'error' && !this.isDestroyed) {
        this.handleError(new Error(data.error), { event, data });
      }
    });
  }

  /**
   * Main error handling method
   */
  async handleError(error, context = {}) {
    if (this.isDestroyed) return;

    console.error('Handling automation error:', error);

    // Record error in history
    this.recordError(error, context);

    // Determine error type
    const errorType = this.classifyError(error);

    // Check if we should attempt recovery
    const shouldRecover = this.shouldAttemptRecovery(errorType, context);

    if (shouldRecover && this.config.enableAutoRecovery) {
      try {
        const recoveryResult = await this.attemptRecovery(error, errorType, context);

        if (recoveryResult.recovered) {
          await this.handleRecoverySuccess(recoveryResult, errorType);
          return { recovered: true, result: recoveryResult };
        }
      } catch (recoveryError) {
        console.error('Recovery failed:', recoveryError);
        await this.handleRecoveryFailure(recoveryError, errorType);
      }
    }

    // If recovery not attempted or failed, handle as unrecoverable
    await this.handleUnrecoverableError(error, errorType, context);
    return { recovered: false, error };
  }

  /**
   * Classify error type for appropriate handling
   */
  classifyError(error) {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return 'NetworkError';
    }

    if (message.includes('content script') || message.includes('message port') || message.includes('connection')) {
      return 'ContentScriptError';
    }

    if (message.includes('element not found') || message.includes('dom') || message.includes('selector')) {
      return 'DOMError';
    }

    if (message.includes('rate limit') || message.includes('too many requests') || message.includes('429')) {
      return 'RateLimitError';
    }

    if (message.includes('auth') || message.includes('login') || message.includes('session') || message.includes('401')) {
      return 'AuthError';
    }

    if (message.includes('timeout') || message.includes('timed out')) {
      return 'TimeoutError';
    }

    return 'UnknownError';
  }

  /**
   * Attempt error recovery
   */
  async attemptRecovery(error, errorType, context) {
    if (this.isRecovering) {
      throw new Error('Recovery already in progress');
    }

    this.isRecovering = true;
    this.lastErrorTime = Date.now();

    try {
      const strategy = this.recoveryStrategies.get(errorType);

      if (!strategy) {
        throw new Error(`No recovery strategy for error type: ${errorType}`);
      }

      // Set recovery timeout
      const recoveryPromise = strategy(error, context);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Recovery timeout')), this.config.recoveryTimeout);
      });

      const result = await Promise.race([recoveryPromise, timeoutPromise]);

      this.incrementRetryCount(errorType, false); // Reset on success
      return result;

    } finally {
      this.isRecovering = false;
    }
  }

  /**
   * Handle successful recovery
   */
  async handleRecoverySuccess(result, errorType) {
    console.log(`Recovery successful for ${errorType}:`, result.message);

    if (this.config.enableUserNotifications) {
      this.showSuccessNotification(`Recovered: ${result.message}`);
    }

    // Reset retry count for this error type
    this.retryAttempts.delete(errorType);

    // Notify callbacks
    this.notifyErrorCallbacks('recovered', { errorType, result });
  }

  /**
   * Handle failed recovery
   */
  async handleRecoveryFailure(error, errorType) {
    console.error(`Recovery failed for ${errorType}:`, error);

    this.incrementRetryCount(errorType, true);

    if (this.config.enableUserNotifications) {
      this.showErrorNotification(`Recovery failed: ${error.message}`);
    }

    // Notify callbacks
    this.notifyErrorCallbacks('recovery_failed', { errorType, error });
  }

  /**
   * Handle unrecoverable errors
   */
  async handleUnrecoverableError(error, errorType, context) {
    console.error(`Unrecoverable error (${errorType}):`, error);

    // Stop automation
    try {
      if (this.stateManager.canStop()) {
        await this.stateManager.stop();
      }
    } catch (stopError) {
      console.error('Error stopping automation:', stopError);
    }

    if (this.config.enableUserNotifications) {
      this.showErrorNotification(this.getErrorMessage(error, errorType));
    }

    // Report error if enabled
    if (this.config.enableErrorReporting) {
      this.reportError(error, errorType, context);
    }

    // Notify callbacks
    this.notifyErrorCallbacks('unrecoverable', { error, errorType, context });
  }

  /**
   * Get user-friendly error message
   */
  getErrorMessage(error, errorType) {
    const userMessages = {
      'NetworkError': 'Network connection issue. Please check your internet connection.',
      'ContentScriptError': 'Extension communication error. Please refresh the LinkedIn page.',
      'DOMError': 'Page structure changed. Please refresh the page or navigate to LinkedIn search.',
      'RateLimitError': 'LinkedIn rate limit reached. Please wait before continuing.',
      'AuthError': 'Authentication required. Please log in to LinkedIn.',
      'TimeoutError': 'Operation timed out. Please try again.',
      'UnknownError': 'An unexpected error occurred. Please try again.'
    };

    return userMessages[errorType] || error.message;
  }

  /**
   * Check if recovery should be attempted
   */
  shouldAttemptRecovery(errorType, context) {
    const retryCount = this.retryAttempts.get(errorType) || 0;
    return retryCount < this.config.maxRetries && this.recoveryStrategies.has(errorType);
  }

  /**
   * Increment retry count for error type
   */
  incrementRetryCount(errorType, increment = true) {
    if (increment) {
      const current = this.retryAttempts.get(errorType) || 0;
      this.retryAttempts.set(errorType, current + 1);
    } else {
      this.retryAttempts.delete(errorType);
    }
  }

  /**
   * Calculate wait time for rate limiting
   */
  calculateRateLimitWaitTime(error, context) {
    const baseWait = 60000; // 1 minute
    const retryCount = this.retryAttempts.get('RateLimitError') || 0;
    return baseWait * Math.pow(this.config.retryBackoffMultiplier, retryCount);
  }

  /**
   * Record error in history
   */
  recordError(error, context) {
    const errorRecord = {
      error: error.message,
      type: this.classifyError(error),
      timestamp: Date.now(),
      context,
      stack: error.stack
    };

    this.errorHistory.push(errorRecord);

    // Keep only last 50 errors
    if (this.errorHistory.length > 50) {
      this.errorHistory.shift();
    }
  }

  /**
   * Add custom recovery strategy
   */
  addRecoveryStrategy(errorType, strategyFunction) {
    this.recoveryStrategies.set(errorType, strategyFunction);
  }

  /**
   * Remove recovery strategy
   */
  removeRecoveryStrategy(errorType) {
    this.recoveryStrategies.delete(errorType);
  }

  /**
   * Add error callback
   */
  addErrorCallback(name, callback) {
    this.errorCallbacks.set(name, callback);
  }

  /**
   * Remove error callback
   */
  removeErrorCallback(name) {
    this.errorCallbacks.delete(name);
  }

  /**
   * Notify error callbacks
   */
  notifyErrorCallbacks(event, data) {
    this.errorCallbacks.forEach((callback, name) => {
      try {
        callback(event, data);
      } catch (error) {
        console.error(`Error in callback ${name}:`, error);
      }
    });
  }

  /**
   * Show success notification
   */
  showSuccessNotification(message) {
    this.showNotification(message, 'success');
  }

  /**
   * Show error notification
   */
  showErrorNotification(message) {
    this.showNotification(message, 'error');
  }

  /**
   * Show notification to user
   */
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');

    const typeStyles = {
      success: 'bg-vintage-sage text-vintage-paper border-vintage-sage-dark',
      error: 'bg-vintage-sepia text-vintage-paper border-vintage-sepia-dark',
      warning: 'bg-vintage-paper text-vintage-accent border-vintage-accent',
      info: 'bg-vintage-accent text-vintage-paper border-vintage-accent-light'
    };

    const styles = typeStyles[type] || typeStyles.info;

    notification.className = `fixed top-4 left-4 right-4 ${styles} p-vintage-md rounded-vintage vintage-body text-vintage-sm z-50 transform transition-all duration-300 ease-in-out shadow-vintage-lg border font-newspaper`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Animate in
    requestAnimationFrame(() => {
      notification.style.transform = 'translateY(0) scale(1)';
      notification.style.opacity = '1';
    });

    // Remove after delay
    setTimeout(() => {
      notification.style.transform = 'translateY(-100%) scale(0.95)';
      notification.style.opacity = '0';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }, type === 'error' ? 5000 : 3000);
  }

  /**
   * Report error for analytics/debugging
   */
  reportError(error, errorType, context) {
    const errorReport = {
      error: error.message,
      type: errorType,
      timestamp: Date.now(),
      context,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Send to background script for logging
    try {
      chrome.runtime.sendMessage({
        type: 'REPORT_ERROR',
        data: errorReport
      });
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    }
  }

  /**
   * Utility methods
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  isOnLinkedIn() {
    return window.location.href.includes('linkedin.com');
  }

  async refreshPageState() {
    // Implement page state refresh logic
    return new Promise(resolve => setTimeout(resolve, 1000));
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    const stats = {
      totalErrors: this.errorHistory.length,
      errorsByType: {},
      recentErrors: this.errorHistory.slice(-10),
      retryAttempts: Object.fromEntries(this.retryAttempts)
    };

    this.errorHistory.forEach(error => {
      stats.errorsByType[error.type] = (stats.errorsByType[error.type] || 0) + 1;
    });

    return stats;
  }

  /**
   * Clear error history
   */
  clearErrorHistory() {
    this.errorHistory = [];
    this.retryAttempts.clear();
  }

  /**
   * Reset error handler
   */
  reset() {
    this.clearErrorHistory();
    this.isRecovering = false;
    this.lastErrorTime = null;

    if (this.recoveryTimer) {
      clearTimeout(this.recoveryTimer);
      this.recoveryTimer = null;
    }
  }

  /**
   * Destroy error handler
   */
  destroy() {
    this.isDestroyed = true;
    this.reset();
    this.recoveryStrategies.clear();
    this.errorCallbacks.clear();

    console.log('AutomationErrorHandler destroyed');
  }
}

export default AutomationErrorHandler;