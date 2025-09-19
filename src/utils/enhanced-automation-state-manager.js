/**
 * Enhanced Automation State Manager
 * Provides comprehensive state management for LinkedIn automation with real-time updates,
 * persistence, progress tracking, and event-driven architecture.
 */

export class AutomationStateManager {
  constructor(options = {}) {
    this.state = 'inactive'; // inactive, starting, active, stopping, paused, error
    this.isActive = false;
    this.connectionsSent = 0;
    this.connectionsAccepted = 0;
    this.currentProgress = { percentage: 0, text: '', count: 0 };
    this.errorMessage = null;
    this.listeners = new Set();
    this.persistenceEnabled = options.persistenceEnabled !== false;
    this.autoSaveInterval = null;
    this.lastStateChange = Date.now();

    // Configuration
    this.config = {
      autoSaveIntervalMs: options.autoSaveIntervalMs || 5000,
      maxRetries: options.maxRetries || 3,
      retryDelayMs: options.retryDelayMs || 1000,
      ...options
    };
  }

  /**
   * Initialize the state manager
   */
  async initialize() {
    try {
      if (this.persistenceEnabled) {
        await this.loadPersistedState();
      }

      this.startAutoSave();
      this.notifyListeners('initialized', this.getState());

      console.log('AutomationStateManager initialized with state:', this.state);
    } catch (error) {
      console.error('Error initializing AutomationStateManager:', error);
      this.notifyListeners('error', { error: error.message });
    }
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.stopAutoSave();
    this.listeners.clear();
  }

  /**
   * Set the automation state with validation and side effects
   */
  async setState(newState, data = {}) {
    const oldState = this.state;

    // Validate state transition
    if (!this.isValidTransition(oldState, newState)) {
      throw new Error(`Invalid state transition from ${oldState} to ${newState}`);
    }

    this.state = newState;
    this.lastStateChange = Date.now();

    // Update related properties based on state
    switch (newState) {
      case 'starting':
        this.errorMessage = null;
        break;
      case 'active':
        this.isActive = true;
        this.errorMessage = null;
        break;
      case 'inactive':
      case 'stopping':
        this.isActive = false;
        this.currentProgress = { percentage: 0, text: '', count: 0 };
        break;
      case 'error':
        this.isActive = false;
        this.errorMessage = data.error || 'Unknown error';
        break;
      case 'paused':
        // Keep isActive true but pause operations
        break;
    }

    if (this.persistenceEnabled) {
      await this.persistState();
    }

    this.notifyListeners('stateChanged', {
      oldState,
      newState,
      isActive: this.isActive,
      timestamp: this.lastStateChange,
      ...data
    });
  }

  /**
   * Start automation
   */
  async start(options = {}) {
    if (this.state === 'active') {
      throw new Error('Automation is already active');
    }

    if (!this.canStart()) {
      throw new Error(`Cannot start automation from state: ${this.state}`);
    }

    try {
      await this.setState('starting', { options });

      // Simulate startup process with real-time updates
      this.notifyListeners('startupProgress', { stage: 'initializing', percentage: 25 });

      await this.delay(100); // Allow UI to update

      this.notifyListeners('startupProgress', { stage: 'connecting', percentage: 50 });

      await this.delay(100);

      this.notifyListeners('startupProgress', { stage: 'ready', percentage: 100 });

      await this.setState('active');

      return { success: true, isActive: true, state: this.state };
    } catch (error) {
      await this.setState('error', { error: error.message });
      throw error;
    }
  }

  /**
   * Stop automation
   */
  async stop(options = {}) {
    if (this.state === 'inactive') {
      throw new Error('Automation is already inactive');
    }

    if (!this.canStop()) {
      throw new Error(`Cannot stop automation from state: ${this.state}`);
    }

    try {
      await this.setState('stopping', { options });

      // Simulate cleanup process
      this.notifyListeners('shutdownProgress', { stage: 'saving', percentage: 33 });

      await this.delay(50);

      this.notifyListeners('shutdownProgress', { stage: 'cleanup', percentage: 66 });

      await this.delay(50);

      this.notifyListeners('shutdownProgress', { stage: 'complete', percentage: 100 });

      await this.setState('inactive');

      return { success: true, isActive: false, state: this.state };
    } catch (error) {
      await this.setState('error', { error: error.message });
      throw error;
    }
  }

  /**
   * Pause automation
   */
  async pause() {
    if (this.state !== 'active') {
      throw new Error('Cannot pause when not active');
    }

    await this.setState('paused');
    return { success: true, state: this.state };
  }

  /**
   * Resume automation
   */
  async resume() {
    if (this.state !== 'paused') {
      throw new Error('Cannot resume when not paused');
    }

    await this.setState('active');
    return { success: true, state: this.state };
  }

  /**
   * Update automation progress
   */
  async updateProgress(progressData) {
    if (typeof progressData !== 'object' || progressData === null) {
      throw new Error('Progress data must be an object');
    }

    // Validate percentage if provided
    if (progressData.percentage !== undefined) {
      if (typeof progressData.percentage !== 'number' ||
          progressData.percentage < 0 ||
          progressData.percentage > 100) {
        throw new Error('Percentage must be a number between 0 and 100');
      }
    }

    this.currentProgress = { ...this.currentProgress, ...progressData };

    if (this.persistenceEnabled) {
      await this.persistState();
    }

    this.notifyListeners('progressUpdated', {
      ...this.currentProgress,
      timestamp: Date.now()
    });
  }

  /**
   * Update connection statistics
   */
  async updateConnectionStats(sent = null, accepted = null) {
    if (sent !== null) {
      if (typeof sent !== 'number' || sent < 0) {
        throw new Error('Connections sent must be a non-negative number');
      }
      this.connectionsSent = sent;
    }

    if (accepted !== null) {
      if (typeof accepted !== 'number' || accepted < 0) {
        throw new Error('Connections accepted must be a non-negative number');
      }
      this.connectionsAccepted = accepted;
    }

    if (this.persistenceEnabled) {
      await this.persistState();
    }

    this.notifyListeners('statsUpdated', {
      connectionsSent: this.connectionsSent,
      connectionsAccepted: this.connectionsAccepted,
      acceptanceRate: this.connectionsSent > 0 ?
        (this.connectionsAccepted / this.connectionsSent * 100).toFixed(1) : 0,
      timestamp: Date.now()
    });
  }

  /**
   * Increment connection counters
   */
  async incrementConnectionsSent(count = 1) {
    await this.updateConnectionStats(this.connectionsSent + count, null);
  }

  async incrementConnectionsAccepted(count = 1) {
    await this.updateConnectionStats(null, this.connectionsAccepted + count);
  }

  /**
   * Reset statistics
   */
  async resetStats() {
    this.connectionsSent = 0;
    this.connectionsAccepted = 0;
    this.currentProgress = { percentage: 0, text: '', count: 0 };

    if (this.persistenceEnabled) {
      await this.persistState();
    }

    this.notifyListeners('statsReset', {
      timestamp: Date.now()
    });
  }

  /**
   * Event listener management
   */
  addListener(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Listener must be a function');
    }
    this.listeners.add(callback);
  }

  removeListener(callback) {
    this.listeners.delete(callback);
  }

  notifyListeners(event, data = {}) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Error in state manager listener:', error);
      }
    });
  }

  /**
   * State persistence
   */
  async persistState() {
    if (!this.persistenceEnabled) return;

    try {
      const stateData = {
        state: this.state,
        isActive: this.isActive,
        connectionsSent: this.connectionsSent,
        connectionsAccepted: this.connectionsAccepted,
        currentProgress: this.currentProgress,
        errorMessage: this.errorMessage,
        lastStateChange: this.lastStateChange,
        timestamp: Date.now()
      };

      await chrome.storage.local.set({ automationState: stateData });
    } catch (error) {
      console.error('Error persisting state:', error);
      this.notifyListeners('persistenceError', { error: error.message });
    }
  }

  async loadPersistedState() {
    try {
      const result = await chrome.storage.local.get('automationState');
      if (result.automationState) {
        const data = result.automationState;

        // Validate loaded data
        if (this.isValidState(data.state)) {
          this.state = data.state;
        }

        this.isActive = Boolean(data.isActive);
        this.connectionsSent = Number(data.connectionsSent) || 0;
        this.connectionsAccepted = Number(data.connectionsAccepted) || 0;
        this.currentProgress = data.currentProgress || { percentage: 0, text: '', count: 0 };
        this.errorMessage = data.errorMessage || null;
        this.lastStateChange = data.lastStateChange || Date.now();

        console.log('Loaded persisted automation state:', this.state);
      }
    } catch (error) {
      console.error('Error loading persisted state:', error);
      this.notifyListeners('persistenceError', { error: error.message });
    }
  }

  async clearPersistedState() {
    try {
      await chrome.storage.local.remove('automationState');
    } catch (error) {
      console.error('Error clearing persisted state:', error);
    }
  }

  /**
   * Auto-save functionality
   */
  startAutoSave() {
    if (!this.persistenceEnabled || this.autoSaveInterval) return;

    this.autoSaveInterval = setInterval(async () => {
      await this.persistState();
    }, this.config.autoSaveIntervalMs);
  }

  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  /**
   * State validation
   */
  isValidState(state) {
    const validStates = ['inactive', 'starting', 'active', 'stopping', 'paused', 'error'];
    return validStates.includes(state);
  }

  isValidTransition(fromState, toState) {
    const transitions = {
      'inactive': ['starting', 'error'],
      'starting': ['active', 'error', 'stopping'],
      'active': ['stopping', 'paused', 'error'],
      'stopping': ['inactive', 'error'],
      'paused': ['active', 'stopping', 'error'],
      'error': ['starting', 'inactive']
    };

    return transitions[fromState]?.includes(toState) || false;
  }

  /**
   * State query methods
   */
  getState() {
    return {
      state: this.state,
      isActive: this.isActive,
      connectionsSent: this.connectionsSent,
      connectionsAccepted: this.connectionsAccepted,
      currentProgress: this.currentProgress,
      errorMessage: this.errorMessage,
      lastStateChange: this.lastStateChange,
      acceptanceRate: this.connectionsSent > 0 ?
        (this.connectionsAccepted / this.connectionsSent * 100).toFixed(1) : 0
    };
  }

  isInState(state) {
    return this.state === state;
  }

  canStart() {
    return ['inactive', 'error'].includes(this.state);
  }

  canStop() {
    return ['active', 'paused', 'starting'].includes(this.state);
  }

  canPause() {
    return this.state === 'active';
  }

  canResume() {
    return this.state === 'paused';
  }

  isProcessing() {
    return ['starting', 'stopping'].includes(this.state);
  }

  hasError() {
    return this.state === 'error';
  }

  /**
   * Utility methods
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getUptime() {
    if (!this.isActive) return 0;
    return Date.now() - this.lastStateChange;
  }

  getFormattedUptime() {
    const uptime = this.getUptime();
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}

// Singleton instance for global use
let globalStateManager = null;

export function getGlobalStateManager(options = {}) {
  if (!globalStateManager) {
    globalStateManager = new AutomationStateManager(options);
  }
  return globalStateManager;
}

export function resetGlobalStateManager() {
  if (globalStateManager) {
    globalStateManager.destroy();
    globalStateManager = null;
  }
}

export default AutomationStateManager;