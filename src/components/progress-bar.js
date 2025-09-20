/**
 * Enhanced Progress Bar Component
 * Provides smooth, accessible progress tracking for Chrome extension operations
 */

class ProgressBarComponent {
  constructor() {
    this.currentState = {
      percentage: 0,
      text: 'Starting...',
      isVisible: false
    };

    this.elements = {
      section: null,
      bar: null,
      text: null,
      percentage: null
    };

    this.throttleTime = 16; // 60fps throttling
    this.lastUpdateTime = 0;
    this.pendingUpdate = null;

    this.init();
  }

  init() {
    this.findElements();
    this.setupEventListeners();
    this.setupAccessibility();
  }

  findElements() {
    this.elements.section = document.getElementById('progress-section');
    this.elements.bar = document.getElementById('progress-bar');
    this.elements.text = document.getElementById('progress-text');
    this.elements.percentage = document.getElementById('progress-percentage');

    if (!this.elements.section || !this.elements.bar) {
      console.warn('Progress bar elements not found in DOM');
    }
  }

  setupEventListeners() {
    // Listen for automation events
    document.addEventListener('automationStarted', () => this.show());
    document.addEventListener('automationStopped', () => this.hide());
    document.addEventListener('automationProgress', (event) => {
      this.updateProgress(event.detail);
    });
  }

  setupAccessibility() {
    if (this.elements.bar) {
      this.elements.bar.setAttribute('role', 'progressbar');
      this.elements.bar.setAttribute('aria-valuemin', '0');
      this.elements.bar.setAttribute('aria-valuemax', '100');
      this.elements.bar.setAttribute('aria-valuenow', '0');
    }
  }

  show() {
    if (this.elements.section) {
      this.elements.section.classList.remove('hidden');
      this.currentState.isVisible = true;
      this.emitEvent('progressBarShown');
    }
  }

  hide() {
    if (this.elements.section) {
      this.elements.section.classList.add('hidden');
      this.currentState.isVisible = false;
      this.reset();
      this.emitEvent('progressBarHidden');
    }
  }

  updateProgress(data) {
    if (!data || typeof data !== 'object') {
      return;
    }

    // Throttle updates for performance
    const now = Date.now();
    if (now - this.lastUpdateTime < this.throttleTime) {
      if (this.pendingUpdate) {
        clearTimeout(this.pendingUpdate);
      }
      this.pendingUpdate = setTimeout(() => {
        this._performUpdate(data);
      }, this.throttleTime);
      return;
    }

    this._performUpdate(data);
    this.lastUpdateTime = now;
  }

  _performUpdate(data) {
    const percentage = this._validatePercentage(data.percentage);
    const text = data.text || this.currentState.text;

    // Update state
    this.currentState.percentage = percentage;
    this.currentState.text = text;

    // Update DOM elements
    this._updateProgressBar(percentage);
    this._updateProgressText(text);
    this._updateProgressPercentage(percentage);
    this._updateAccessibility(percentage, text);

    // Emit progress event
    this.emitEvent('progressUpdate', {
      percentage,
      text,
      isVisible: this.currentState.isVisible
    });
  }

  _validatePercentage(value) {
    if (value === undefined || value === null) {
      return this.currentState.percentage;
    }

    let numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) {
      return 0;
    }

    return Math.min(100, Math.max(0, numValue));
  }

  _updateProgressBar(percentage) {
    if (this.elements.bar) {
      this.elements.bar.style.width = `${percentage}%`;
    }
  }

  _updateProgressText(text) {
    if (this.elements.text) {
      this.elements.text.textContent = text;
    }
  }

  _updateProgressPercentage(percentage) {
    if (this.elements.percentage) {
      this.elements.percentage.textContent = `${Math.round(percentage)}%`;
    }
  }

  _updateAccessibility(percentage, text) {
    if (this.elements.bar) {
      this.elements.bar.setAttribute('aria-valuenow', Math.round(percentage).toString());
      this.elements.bar.setAttribute('aria-label', `${text} ${Math.round(percentage)}% complete`);
    }
  }

  getCurrentProgress() {
    return { ...this.currentState };
  }

  reset() {
    this.currentState = {
      percentage: 0,
      text: 'Starting...',
      isVisible: this.currentState.isVisible
    };

    this._updateProgressBar(0);
    this._updateProgressText('Starting...');
    this._updateProgressPercentage(0);
    this._updateAccessibility(0, 'Starting...');
  }

  syncWithAutomationState(isActive) {
    if (isActive) {
      this.show();
    } else {
      this.hide();
    }
  }

  emitEvent(eventName, detail = null) {
    const event = new CustomEvent(eventName, {
      detail,
      bubbles: true,
      cancelable: true
    });
    document.dispatchEvent(event);
  }

  destroy() {
    // Clear any pending updates
    if (this.pendingUpdate) {
      clearTimeout(this.pendingUpdate);
    }

    // Remove event listeners
    document.removeEventListener('automationStarted', () => this.show());
    document.removeEventListener('automationStopped', () => this.hide());
    document.removeEventListener('automationProgress', (event) => {
      this.updateProgress(event.detail);
    });

    // Reset state
    this.currentState = null;
    this.elements = null;
  }
}

// Animation utilities for enhanced visual effects
class ProgressBarAnimations {
  static createPulseEffect(element) {
    if (!element) return;

    element.style.animation = 'progress-pulse 2s ease-in-out infinite';
  }

  static removePulseEffect(element) {
    if (!element) return;

    element.style.animation = '';
  }

  static createGlowEffect(element, color = '#10b981') {
    if (!element) return;

    element.style.boxShadow = `0 0 10px ${color}40`;
    element.style.transition = 'box-shadow 0.3s ease';
  }

  static removeGlowEffect(element) {
    if (!element) return;

    element.style.boxShadow = '';
  }
}

// State management for progress tracking
class ProgressStateManager {
  constructor() {
    this.state = {
      currentOperation: null,
      totalSteps: 0,
      completedSteps: 0,
      operationStartTime: null,
      estimatedCompletion: null
    };
  }

  startOperation(operationName, totalSteps) {
    this.state = {
      currentOperation: operationName,
      totalSteps,
      completedSteps: 0,
      operationStartTime: Date.now(),
      estimatedCompletion: null
    };
  }

  updateProgress(completedSteps) {
    this.state.completedSteps = Math.min(completedSteps, this.state.totalSteps);
    this._calculateEstimatedCompletion();
  }

  _calculateEstimatedCompletion() {
    if (this.state.completedSteps === 0 || !this.state.operationStartTime) {
      return;
    }

    const elapsed = Date.now() - this.state.operationStartTime;
    const rate = this.state.completedSteps / elapsed;
    const remaining = this.state.totalSteps - this.state.completedSteps;

    this.state.estimatedCompletion = Date.now() + (remaining / rate);
  }

  getProgress() {
    if (this.state.totalSteps === 0) return 0;
    return (this.state.completedSteps / this.state.totalSteps) * 100;
  }

  getEstimatedTimeRemaining() {
    if (!this.state.estimatedCompletion) return null;
    return Math.max(0, this.state.estimatedCompletion - Date.now());
  }

  getState() {
    return { ...this.state };
  }

  reset() {
    this.state = {
      currentOperation: null,
      totalSteps: 0,
      completedSteps: 0,
      operationStartTime: null,
      estimatedCompletion: null
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ProgressBarComponent,
    ProgressBarAnimations,
    ProgressStateManager
  };
}

// Global availability for popup and content scripts
if (typeof window !== 'undefined') {
  window.ProgressBarComponent = ProgressBarComponent;
  window.ProgressBarAnimations = ProgressBarAnimations;
  window.ProgressStateManager = ProgressStateManager;
}