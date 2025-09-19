/**
 * Comprehensive UI State Management Integration
 * Orchestrates all UI components with the automation state manager
 * providing a unified, responsive interface with real-time updates.
 */

import { getGlobalStateManager } from './enhanced-automation-state-manager.js';
import AutomationControlButton from '../components/automation-control-button.js';
import RealTimeStatusDisplay from '../components/real-time-status-display.js';
import AutomationErrorHandler from './automation-error-handler.js';
import { getGlobalConfirmationDialog } from '../components/confirmation-dialog.js';

export class UIStateIntegration {
  constructor(options = {}) {
    // Configuration
    this.config = {
      enableAutoInit: options.enableAutoInit !== false,
      enableErrorHandling: options.enableErrorHandling !== false,
      enableConfirmations: options.enableConfirmations !== false,
      enableAnimations: options.enableAnimations !== false,
      enablePersistence: options.enablePersistence !== false,
      updateInterval: options.updateInterval || 1000,
      ...options
    };

    // Component instances
    this.stateManager = null;
    this.controlButton = null;
    this.statusDisplay = null;
    this.errorHandler = null;
    this.confirmationDialog = null;

    // UI elements
    this.elements = {
      startButton: null,
      statusContainer: null,
      progressSection: null,
      statsContainer: null
    };

    // State tracking
    this.isInitialized = false;
    this.isDestroyed = false;
    this.currentState = null;

    // Event listeners
    this.eventListeners = new Map();
    this.stateListeners = new Set();

    if (this.config.enableAutoInit) {
      this.init();
    }
  }

  /**
   * Initialize the UI state integration
   */
  async init() {
    if (this.isInitialized || this.isDestroyed) return;

    try {
      console.log('Initializing UI State Integration...');

      // Initialize core state manager
      await this.initializeStateManager();

      // Find and cache DOM elements
      this.cacheElements();

      // Initialize UI components
      await this.initializeComponents();

      // Setup cross-component communication
      this.setupComponentIntegration();

      // Setup event listeners
      this.setupEventListeners();

      // Initial state update
      await this.updateUIState();

      this.isInitialized = true;
      console.log('UI State Integration initialized successfully');

    } catch (error) {
      console.error('Error initializing UI State Integration:', error);
      throw error;
    }
  }

  /**
   * Initialize the state manager
   */
  async initializeStateManager() {
    this.stateManager = getGlobalStateManager({
      persistenceEnabled: this.config.enablePersistence,
      autoSaveIntervalMs: this.config.updateInterval * 5
    });

    await this.stateManager.initialize();

    // Listen to all state changes
    this.stateManager.addListener((event, data) => {
      this.handleStateManagerEvent(event, data);
    });
  }

  /**
   * Cache DOM elements
   */
  cacheElements() {
    this.elements = {
      startButton: document.getElementById('start-automation'),
      statusContainer: document.getElementById('status'),
      progressSection: document.getElementById('progress-section'),
      statsContainer: document.querySelector('.stats-container') || document.body,
      sentToday: document.getElementById('sent-today'),
      accepted: document.getElementById('accepted'),
      ...this.config.elements
    };

    // Validate required elements
    const requiredElements = ['startButton'];
    const missingElements = requiredElements.filter(key => !this.elements[key]);

    if (missingElements.length > 0) {
      console.warn('Missing required UI elements:', missingElements);
    }
  }

  /**
   * Initialize UI components
   */
  async initializeComponents() {
    // Initialize control button
    if (this.elements.startButton) {
      this.controlButton = new AutomationControlButton(
        this.elements.startButton,
        this.stateManager,
        {
          showConfirmDialog: this.config.enableConfirmations,
          enableLoadingStates: true,
          animateTransitions: this.config.enableAnimations,
          autoUpdateText: true,
          showProgress: true
        }
      );
    }

    // Initialize status display
    if (this.elements.statusContainer) {
      this.statusDisplay = new RealTimeStatusDisplay(
        this.elements.statusContainer,
        this.stateManager,
        {
          updateInterval: this.config.updateInterval,
          enableAnimations: this.config.enableAnimations,
          showProgress: true,
          showUptime: true,
          showStats: true,
          enablePersistence: this.config.enablePersistence,
          formatNumbers: true
        }
      );
    }

    // Initialize error handler
    if (this.config.enableErrorHandling) {
      this.errorHandler = new AutomationErrorHandler(this.stateManager, {
        enableAutoRecovery: true,
        enableUserNotifications: true,
        enableErrorReporting: true,
        maxRetries: 3
      });
    }

    // Initialize confirmation dialog
    if (this.config.enableConfirmations) {
      this.confirmationDialog = getGlobalConfirmationDialog({
        enableKeyboardNavigation: true,
        enableAnimations: this.config.enableAnimations,
        autoFocus: true,
        closeOnEscape: true
      });
    }
  }

  /**
   * Setup integration between components
   */
  setupComponentIntegration() {
    // Connect control button with confirmations
    if (this.controlButton && this.confirmationDialog) {
      this.controlButton.config.showConfirmDialog = this.config.enableConfirmations;
    }

    // Connect error handler with state manager
    if (this.errorHandler) {
      this.errorHandler.addErrorCallback('ui-integration', (event, data) => {
        this.handleErrorEvent(event, data);
      });
    }

    // Setup cross-component data sharing
    this.setupDataSharing();
  }

  /**
   * Setup data sharing between components
   */
  setupDataSharing() {
    // Share progress updates between components
    this.stateManager.addListener((event, data) => {
      if (event === 'progressUpdated') {
        this.broadcastToComponents('progressUpdate', data);
      } else if (event === 'statsUpdated') {
        this.broadcastToComponents('statsUpdate', data);
      }
    });
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for chrome extension events
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        this.handleChromeMessage(message, sender, sendResponse);
      });
    }

    // Listen for page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.handleVisibilityChange();
    });

    // Listen for window focus/blur
    window.addEventListener('focus', () => {
      this.handleWindowFocus();
    });

    window.addEventListener('blur', () => {
      this.handleWindowBlur();
    });

    // Listen for keyboard shortcuts
    document.addEventListener('keydown', (event) => {
      this.handleKeyboardShortcuts(event);
    });
  }

  /**
   * Handle state manager events
   */
  handleStateManagerEvent(event, data) {
    this.currentState = this.stateManager.getState();

    switch (event) {
      case 'stateChanged':
        this.onStateChanged(data);
        break;

      case 'progressUpdated':
        this.onProgressUpdated(data);
        break;

      case 'statsUpdated':
        this.onStatsUpdated(data);
        break;

      case 'error':
        this.onError(data);
        break;

      case 'initialized':
        this.onStateManagerReady();
        break;
    }

    // Notify listeners
    this.notifyStateListeners(event, data);
  }

  /**
   * Handle state changes
   */
  onStateChanged(data) {
    console.log('State changed:', data.oldState, '->', data.newState);

    // Update page title to reflect state
    this.updatePageTitle(data.newState);

    // Update favicon if possible
    this.updateFavicon(data.newState);

    // Handle state-specific actions
    switch (data.newState) {
      case 'active':
        this.onAutomationStarted();
        break;

      case 'inactive':
        this.onAutomationStopped();
        break;

      case 'paused':
        this.onAutomationPaused();
        break;

      case 'error':
        this.onAutomationError(data);
        break;
    }
  }

  /**
   * Handle progress updates
   */
  onProgressUpdated(data) {
    // Update browser badge if available
    this.updateBrowserBadge(data.percentage);

    // Show notification for milestones
    this.checkProgressMilestones(data);
  }

  /**
   * Handle stats updates
   */
  onStatsUpdated(data) {
    // Update browser badge with connection count
    this.updateBrowserBadge(null, data.connectionsSent);

    // Show achievement notifications
    this.checkStatsAchievements(data);
  }

  /**
   * Handle errors
   */
  onError(data) {
    console.error('Automation error:', data.error);

    // Show error notification
    this.showErrorNotification(data.error);

    // Log error for debugging
    this.logError(data);
  }

  /**
   * Handle automation started
   */
  onAutomationStarted() {
    this.showSuccessNotification('Automation started successfully!');
    this.updateBrowserBadge(0, 0);
  }

  /**
   * Handle automation stopped
   */
  onAutomationStopped() {
    this.showInfoNotification('Automation stopped');
    this.clearBrowserBadge();
  }

  /**
   * Handle automation paused
   */
  onAutomationPaused() {
    this.showInfoNotification('Automation paused');
  }

  /**
   * Handle automation error
   */
  onAutomationError(data) {
    const message = `Automation error: ${data.error}`;
    this.showErrorNotification(message);
  }

  /**
   * Handle error events from error handler
   */
  handleErrorEvent(event, data) {
    switch (event) {
      case 'recovered':
        this.showSuccessNotification(`Recovered: ${data.result.message}`);
        break;

      case 'recovery_failed':
        this.showErrorNotification(`Recovery failed: ${data.error.message}`);
        break;

      case 'unrecoverable':
        this.showErrorNotification(`Unrecoverable error: ${data.error.message}`);
        break;
    }
  }

  /**
   * Handle chrome extension messages
   */
  handleChromeMessage(message, sender, sendResponse) {
    switch (message.type) {
      case 'GET_UI_STATE':
        sendResponse({
          success: true,
          data: {
            isInitialized: this.isInitialized,
            currentState: this.currentState,
            components: {
              stateManager: !!this.stateManager,
              controlButton: !!this.controlButton,
              statusDisplay: !!this.statusDisplay,
              errorHandler: !!this.errorHandler
            }
          }
        });
        break;

      case 'UPDATE_UI_STATE':
        this.updateUIState().then(() => {
          sendResponse({ success: true });
        }).catch(error => {
          sendResponse({ success: false, error: error.message });
        });
        break;

      case 'FORCE_STATE_SYNC':
        this.syncWithContentScript().then(() => {
          sendResponse({ success: true });
        }).catch(error => {
          sendResponse({ success: false, error: error.message });
        });
        break;

      default:
        sendResponse({ success: false, error: 'Unknown message type' });
    }

    return true; // Keep message channel open for async response
  }

  /**
   * Handle page visibility changes
   */
  handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      // Page became visible, sync state
      this.syncWithContentScript();
    }
  }

  /**
   * Handle window focus
   */
  handleWindowFocus() {
    // Refresh UI state when window gains focus
    this.updateUIState();
  }

  /**
   * Handle window blur
   */
  handleWindowBlur() {
    // Save state when window loses focus
    if (this.stateManager && this.config.enablePersistence) {
      this.stateManager.persistState();
    }
  }

  /**
   * Handle keyboard shortcuts
   */
  handleKeyboardShortcuts(event) {
    // Ctrl/Cmd + Shift + S to start/stop automation
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'S') {
      event.preventDefault();
      this.toggleAutomation();
    }

    // Ctrl/Cmd + Shift + P to pause/resume automation
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'P') {
      event.preventDefault();
      this.togglePause();
    }

    // Escape to stop automation if active
    if (event.key === 'Escape' && this.currentState?.isActive) {
      event.preventDefault();
      this.stopAutomation();
    }
  }

  /**
   * Toggle automation state
   */
  async toggleAutomation() {
    if (!this.stateManager) return;

    try {
      const state = this.stateManager.getState();

      if (state.state === 'inactive' || state.state === 'error') {
        await this.startAutomation();
      } else if (state.state === 'active' || state.state === 'paused') {
        await this.stopAutomation();
      }
    } catch (error) {
      console.error('Error toggling automation:', error);
      this.showErrorNotification(`Failed to toggle automation: ${error.message}`);
    }
  }

  /**
   * Start automation
   */
  async startAutomation() {
    if (!this.stateManager) return;

    try {
      await this.stateManager.start();
    } catch (error) {
      console.error('Error starting automation:', error);
      throw error;
    }
  }

  /**
   * Stop automation
   */
  async stopAutomation() {
    if (!this.stateManager) return;

    try {
      await this.stateManager.stop();
    } catch (error) {
      console.error('Error stopping automation:', error);
      throw error;
    }
  }

  /**
   * Toggle pause state
   */
  async togglePause() {
    if (!this.stateManager) return;

    try {
      const state = this.stateManager.getState();

      if (state.state === 'active') {
        await this.stateManager.pause();
      } else if (state.state === 'paused') {
        await this.stateManager.resume();
      }
    } catch (error) {
      console.error('Error toggling pause:', error);
      this.showErrorNotification(`Failed to toggle pause: ${error.message}`);
    }
  }

  /**
   * Update UI state
   */
  async updateUIState() {
    if (!this.isInitialized || this.isDestroyed) return;

    try {
      // Update all components
      if (this.statusDisplay) {
        this.statusDisplay.updateDisplay();
      }

      if (this.controlButton) {
        this.controlButton.updateButtonState();
      }

      // Sync with content script
      await this.syncWithContentScript();

    } catch (error) {
      console.error('Error updating UI state:', error);
    }
  }

  /**
   * Sync with content script
   */
  async syncWithContentScript() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (tab && tab.url && tab.url.includes('linkedin.com')) {
        const response = await chrome.tabs.sendMessage(tab.id, {
          type: 'GET_AUTOMATION_STATE'
        });

        if (response && response.success && this.stateManager) {
          const contentState = response.isActive;
          const currentState = this.stateManager.getState();

          // Sync states if mismatched
          if (currentState.isActive !== contentState) {
            console.log('Syncing state with content script');
            if (contentState) {
              await this.stateManager.setState('active');
            } else {
              await this.stateManager.setState('inactive');
            }
          }
        }
      }
    } catch (error) {
      console.warn('Could not sync with content script:', error);
    }
  }

  /**
   * Broadcast events to all components
   */
  broadcastToComponents(event, data) {
    this.stateListeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Error in component listener:', error);
      }
    });
  }

  /**
   * Utility methods for UI updates
   */
  updatePageTitle(state) {
    const originalTitle = document.title.replace(/ - (Active|Paused|Error)$/, '');
    const stateText = {
      'active': 'Active',
      'paused': 'Paused',
      'error': 'Error'
    };

    if (stateText[state]) {
      document.title = `${originalTitle} - ${stateText[state]}`;
    } else {
      document.title = originalTitle;
    }
  }

  updateFavicon(state) {
    // Update favicon color based on state (if supported)
    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon) {
      // This would require a dynamic favicon generation
      // For now, just log the state change
      console.log('Favicon update for state:', state);
    }
  }

  updateBrowserBadge(percentage = null, count = null) {
    if (typeof chrome !== 'undefined' && chrome.action) {
      try {
        if (count !== null) {
          chrome.action.setBadgeText({ text: count > 0 ? count.toString() : '' });
          chrome.action.setBadgeBackgroundColor({ color: '#0073b1' });
        } else if (percentage !== null) {
          const percentText = percentage > 0 ? `${Math.round(percentage)}%` : '';
          chrome.action.setBadgeText({ text: percentText });
          chrome.action.setBadgeBackgroundColor({ color: '#28a745' });
        }
      } catch (error) {
        console.warn('Could not update browser badge:', error);
      }
    }
  }

  clearBrowserBadge() {
    if (typeof chrome !== 'undefined' && chrome.action) {
      try {
        chrome.action.setBadgeText({ text: '' });
      } catch (error) {
        console.warn('Could not clear browser badge:', error);
      }
    }
  }

  /**
   * Notification methods
   */
  showSuccessNotification(message) {
    this.showNotification(message, 'success');
  }

  showErrorNotification(message) {
    this.showNotification(message, 'error');
  }

  showInfoNotification(message) {
    this.showNotification(message, 'info');
  }

  showNotification(message, type = 'info') {
    // Use existing notification system or create one
    if (this.statusDisplay) {
      // Reuse status display notification system
      console.log(`${type.toUpperCase()}: ${message}`);
    }

    // Could also use browser notifications API
    this.showBrowserNotification(message, type);
  }

  showBrowserNotification(message, type) {
    if (typeof chrome !== 'undefined' && chrome.notifications) {
      try {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: chrome.runtime.getURL('icons/icon48.png'),
          title: 'LinkedIn Automation',
          message: message
        });
      } catch (error) {
        console.warn('Could not show browser notification:', error);
      }
    }
  }

  /**
   * Achievement checking
   */
  checkProgressMilestones(data) {
    if (data.percentage === 25 || data.percentage === 50 || data.percentage === 75) {
      this.showInfoNotification(`Progress: ${data.percentage}% complete`);
    }
  }

  checkStatsAchievements(data) {
    const milestones = [10, 25, 50, 100, 250, 500];
    if (milestones.includes(data.connectionsSent)) {
      this.showSuccessNotification(`Achievement: ${data.connectionsSent} connections sent!`);
    }
  }

  /**
   * Error logging
   */
  logError(data) {
    // Send error to background script for logging
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      try {
        chrome.runtime.sendMessage({
          type: 'LOG_ERROR',
          data: {
            error: data.error,
            timestamp: Date.now(),
            context: 'UI Integration'
          }
        });
      } catch (error) {
        console.warn('Could not log error to background script:', error);
      }
    }
  }

  /**
   * State listener management
   */
  addStateListener(listener) {
    this.stateListeners.add(listener);
  }

  removeStateListener(listener) {
    this.stateListeners.delete(listener);
  }

  notifyStateListeners(event, data) {
    this.stateListeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Error in state listener:', error);
      }
    });
  }

  /**
   * Ready callback
   */
  onStateManagerReady() {
    console.log('State manager ready');
    this.updateUIState();
  }

  /**
   * Get current state
   */
  getCurrentState() {
    return this.currentState;
  }

  /**
   * Check if initialized
   */
  isReady() {
    return this.isInitialized && !this.isDestroyed;
  }

  /**
   * Destroy integration
   */
  destroy() {
    if (this.isDestroyed) return;

    this.isDestroyed = true;

    // Destroy components
    if (this.controlButton) {
      this.controlButton.destroy();
    }

    if (this.statusDisplay) {
      this.statusDisplay.destroy();
    }

    if (this.errorHandler) {
      this.errorHandler.destroy();
    }

    // Clear state
    this.stateListeners.clear();
    this.eventListeners.clear();

    // Clear browser badge
    this.clearBrowserBadge();

    console.log('UI State Integration destroyed');
  }
}

// Global instance management
let globalUIIntegration = null;

export function getGlobalUIIntegration(options = {}) {
  if (!globalUIIntegration) {
    globalUIIntegration = new UIStateIntegration(options);
  }
  return globalUIIntegration;
}

export function resetGlobalUIIntegration() {
  if (globalUIIntegration) {
    globalUIIntegration.destroy();
    globalUIIntegration = null;
  }
}

export default UIStateIntegration;