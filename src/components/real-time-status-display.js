/**
 * Real-Time Status Display Component
 * Provides live status updates, progress tracking, and statistics display
 * with smooth animations and automatic data persistence.
 */

export class RealTimeStatusDisplay {
  constructor(containerElement, stateManager, options = {}) {
    this.container = containerElement;
    this.stateManager = stateManager;
    this.isDestroyed = false;

    // Configuration
    this.config = {
      updateInterval: options.updateInterval || 1000,
      enableAnimations: options.enableAnimations !== false,
      showProgress: options.showProgress !== false,
      showUptime: options.showUptime !== false,
      showStats: options.showStats !== false,
      enablePersistence: options.enablePersistence !== false,
      formatNumbers: options.formatNumbers !== false,
      ...options
    };

    // Element selectors
    this.selectors = {
      status: options.statusSelector || '#status',
      statusDot: options.statusDotSelector || '.status-dot',
      statusText: options.statusTextSelector || '.status-text',
      progressSection: options.progressSelector || '#progress-section',
      progressBar: options.progressBarSelector || '#progress-bar',
      progressText: options.progressTextSelector || '#progress-text',
      progressPercentage: options.progressPercentageSelector || '#progress-percentage',
      sentToday: options.sentTodaySelector || '#sent-today',
      accepted: options.acceptedSelector || '#accepted',
      uptime: options.uptimeSelector || '#uptime',
      ...options.selectors
    };

    // DOM elements cache
    this.elements = {};
    this.updateTimer = null;
    this.lastUpdate = 0;

    this.init();
  }

  /**
   * Initialize the status display component
   */
  init() {
    this.cacheElements();
    this.setupEventListeners();
    this.updateDisplay();
    this.startUpdateTimer();

    console.log('RealTimeStatusDisplay initialized');
  }

  /**
   * Cache DOM elements for performance
   */
  cacheElements() {
    Object.keys(this.selectors).forEach(key => {
      const selector = this.selectors[key];
      const element = this.container.querySelector(selector) || document.querySelector(selector);

      if (element) {
        this.elements[key] = element;
      } else {
        console.warn(`Element not found for selector: ${selector}`);
      }
    });
  }

  /**
   * Setup event listeners for state manager
   */
  setupEventListeners() {
    this.stateManager.addListener(this.handleStateChange.bind(this));
  }

  /**
   * Handle state changes from the state manager
   */
  handleStateChange(event, data) {
    if (this.isDestroyed) return;

    switch (event) {
      case 'stateChanged':
        this.updateStatusDisplay(data);
        break;

      case 'progressUpdated':
        this.updateProgressDisplay(data);
        break;

      case 'statsUpdated':
        this.updateStatsDisplay(data);
        break;

      case 'startupProgress':
      case 'shutdownProgress':
        this.updateTransitionProgress(data);
        break;

      case 'error':
        this.showErrorState(data);
        break;
    }
  }

  /**
   * Update the main status display
   */
  updateStatusDisplay(data = null) {
    const state = data || this.stateManager.getState();

    if (this.elements.statusDot && this.elements.statusText) {
      this.updateStatusDot(state);
      this.updateStatusText(state);
    }

    // Update progress section visibility
    if (this.elements.progressSection) {
      if (state.isActive && this.config.showProgress) {
        this.showProgressSection();
      } else {
        this.hideProgressSection();
      }
    }
  }

  /**
   * Update status dot appearance
   */
  updateStatusDot(state) {
    const dot = this.elements.statusDot;

    // Remove all status classes
    dot.className = 'w-2 h-2 rounded-full border transition-all duration-300';

    switch (state.state) {
      case 'active':
        dot.classList.add('bg-vintage-sage', 'border-vintage-accent', 'animate-pulse');
        break;
      case 'starting':
      case 'stopping':
        dot.classList.add('bg-vintage-accent', 'border-vintage-accent-light', 'animate-pulse');
        break;
      case 'paused':
        dot.classList.add('bg-vintage-paper-dark', 'border-vintage-accent');
        break;
      case 'error':
        dot.classList.add('bg-vintage-sepia', 'border-vintage-sepia-dark', 'animate-pulse');
        break;
      default:
        dot.classList.add('bg-vintage-sepia', 'border-vintage-accent');
    }
  }

  /**
   * Update status text
   */
  updateStatusText(state) {
    const text = this.elements.statusText;

    // Remove all status text classes
    text.classList.remove('text-vintage-sage', 'text-vintage-sepia', 'text-vintage-accent', 'text-vintage-ink', 'text-vintage-ink-light');

    let statusText;
    let textClass;

    switch (state.state) {
      case 'active':
        statusText = 'Active';
        textClass = 'text-vintage-sage';
        break;
      case 'starting':
        statusText = 'Starting...';
        textClass = 'text-vintage-accent';
        break;
      case 'stopping':
        statusText = 'Stopping...';
        textClass = 'text-vintage-accent';
        break;
      case 'paused':
        statusText = 'Paused';
        textClass = 'text-vintage-accent';
        break;
      case 'error':
        statusText = 'Error';
        textClass = 'text-vintage-sepia';
        break;
      default:
        statusText = 'Inactive';
        textClass = 'text-vintage-ink';
    }

    if (this.config.enableAnimations) {
      this.animateTextChange(text, statusText, textClass);
    } else {
      text.textContent = statusText;
      text.classList.add(textClass);
    }
  }

  /**
   * Update progress display
   */
  updateProgressDisplay(data) {
    if (!this.config.showProgress) return;

    if (this.elements.progressBar && data.percentage !== undefined) {
      this.updateProgressBar(data.percentage);
    }

    if (this.elements.progressText && data.text) {
      this.updateProgressText(data.text);
    }

    if (this.elements.progressPercentage && data.percentage !== undefined) {
      this.updateProgressPercentage(data.percentage);
    }
  }

  /**
   * Update progress bar
   */
  updateProgressBar(percentage) {
    const bar = this.elements.progressBar;
    const clampedPercentage = Math.min(100, Math.max(0, percentage));

    if (this.config.enableAnimations) {
      bar.style.transition = 'width 0.3s ease-in-out';
    }

    bar.style.width = `${clampedPercentage}%`;

    // Add visual feedback for completion
    if (clampedPercentage === 100) {
      bar.classList.add('bg-vintage-sage');
      bar.classList.remove('bg-vintage-accent');
    } else {
      bar.classList.add('bg-vintage-accent');
      bar.classList.remove('bg-vintage-sage');
    }
  }

  /**
   * Update progress text
   */
  updateProgressText(text) {
    const element = this.elements.progressText;

    if (this.config.enableAnimations) {
      this.animateTextChange(element, text);
    } else {
      element.textContent = text;
    }
  }

  /**
   * Update progress percentage
   */
  updateProgressPercentage(percentage) {
    const element = this.elements.progressPercentage;
    const formattedPercentage = `${Math.round(percentage)}%`;

    if (this.config.enableAnimations) {
      this.animateNumberChange(element, Math.round(percentage), '%');
    } else {
      element.textContent = formattedPercentage;
    }
  }

  /**
   * Update statistics display
   */
  updateStatsDisplay(data) {
    if (!this.config.showStats) return;

    if (this.elements.sentToday && data.connectionsSent !== undefined) {
      const formatted = this.config.formatNumbers ?
        this.formatNumber(data.connectionsSent) :
        data.connectionsSent.toString();

      if (this.config.enableAnimations) {
        this.animateNumberChange(this.elements.sentToday, data.connectionsSent);
      } else {
        this.elements.sentToday.textContent = formatted;
      }
    }

    if (this.elements.accepted && data.connectionsAccepted !== undefined) {
      const formatted = this.config.formatNumbers ?
        this.formatNumber(data.connectionsAccepted) :
        data.connectionsAccepted.toString();

      if (this.config.enableAnimations) {
        this.animateNumberChange(this.elements.accepted, data.connectionsAccepted);
      } else {
        this.elements.accepted.textContent = formatted;
      }
    }
  }

  /**
   * Update transition progress (startup/shutdown)
   */
  updateTransitionProgress(data) {
    if (data.stage && this.elements.progressText) {
      const stageText = {
        'initializing': 'Initializing automation...',
        'connecting': 'Connecting to LinkedIn...',
        'ready': 'Ready to start!',
        'saving': 'Saving progress...',
        'cleanup': 'Cleaning up...',
        'complete': 'Complete!'
      };

      this.updateProgressText(stageText[data.stage] || data.stage);
    }

    if (data.percentage !== undefined) {
      this.updateProgressBar(data.percentage);
      this.updateProgressPercentage(data.percentage);
    }
  }

  /**
   * Show error state
   */
  showErrorState(data) {
    if (this.elements.statusText) {
      this.elements.statusText.textContent = 'Error';
      this.elements.statusText.classList.add('text-vintage-sepia');
    }

    if (this.elements.progressText && data.error) {
      this.elements.progressText.textContent = data.error;
      this.elements.progressText.classList.add('text-vintage-sepia');
    }
  }

  /**
   * Show progress section
   */
  showProgressSection() {
    if (this.elements.progressSection) {
      this.elements.progressSection.classList.remove('hidden');

      if (this.config.enableAnimations) {
        this.elements.progressSection.style.opacity = '0';
        this.elements.progressSection.style.transform = 'translateY(-10px)';

        requestAnimationFrame(() => {
          this.elements.progressSection.style.transition = 'all 0.3s ease-in-out';
          this.elements.progressSection.style.opacity = '1';
          this.elements.progressSection.style.transform = 'translateY(0)';
        });
      }
    }
  }

  /**
   * Hide progress section
   */
  hideProgressSection() {
    if (this.elements.progressSection) {
      if (this.config.enableAnimations) {
        this.elements.progressSection.style.transition = 'all 0.3s ease-in-out';
        this.elements.progressSection.style.opacity = '0';
        this.elements.progressSection.style.transform = 'translateY(-10px)';

        setTimeout(() => {
          this.elements.progressSection.classList.add('hidden');
        }, 300);
      } else {
        this.elements.progressSection.classList.add('hidden');
      }
    }
  }

  /**
   * Animate text changes
   */
  animateTextChange(element, newText, newClass = null) {
    element.style.transition = 'opacity 0.15s ease-in-out';
    element.style.opacity = '0';

    setTimeout(() => {
      element.textContent = newText;
      if (newClass) {
        element.classList.add(newClass);
      }
      element.style.opacity = '1';
    }, 150);
  }

  /**
   * Animate number changes
   */
  animateNumberChange(element, targetNumber, suffix = '') {
    const currentNumber = parseInt(element.textContent) || 0;
    const difference = targetNumber - currentNumber;
    const duration = 500; // ms
    const steps = 20;
    const increment = difference / steps;
    const stepDuration = duration / steps;

    let current = currentNumber;
    let step = 0;

    const animate = () => {
      if (step >= steps) {
        element.textContent = this.config.formatNumbers ?
          this.formatNumber(targetNumber) + suffix :
          targetNumber.toString() + suffix;
        return;
      }

      current += increment;
      step++;

      const displayValue = Math.round(current);
      element.textContent = this.config.formatNumbers ?
        this.formatNumber(displayValue) + suffix :
        displayValue.toString() + suffix;

      setTimeout(animate, stepDuration);
    };

    animate();
  }

  /**
   * Format numbers for display
   */
  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  /**
   * Update uptime display
   */
  updateUptime() {
    if (!this.config.showUptime || !this.elements.uptime) return;

    const uptime = this.stateManager.getFormattedUptime();
    this.elements.uptime.textContent = uptime;
  }

  /**
   * Start update timer for real-time updates
   */
  startUpdateTimer() {
    if (this.updateTimer) return;

    this.updateTimer = setInterval(() => {
      if (this.isDestroyed) return;

      const now = Date.now();
      if (now - this.lastUpdate >= this.config.updateInterval) {
        this.updateDisplay();
        this.updateUptime();
        this.lastUpdate = now;
      }
    }, this.config.updateInterval);
  }

  /**
   * Stop update timer
   */
  stopUpdateTimer() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
  }

  /**
   * Update entire display
   */
  updateDisplay() {
    const state = this.stateManager.getState();
    this.updateStatusDisplay(state);

    // Update stats if available
    if (this.config.showStats) {
      this.updateStatsDisplay({
        connectionsSent: state.connectionsSent,
        connectionsAccepted: state.connectionsAccepted
      });
    }

    // Update progress if available
    if (this.config.showProgress && state.currentProgress) {
      this.updateProgressDisplay(state.currentProgress);
    }
  }

  /**
   * Refresh all elements and update display
   */
  refresh() {
    this.cacheElements();
    this.updateDisplay();
  }

  /**
   * Set configuration option
   */
  setConfig(key, value) {
    this.config[key] = value;
  }

  /**
   * Get configuration option
   */
  getConfig(key) {
    return this.config[key];
  }

  /**
   * Destroy the component
   */
  destroy() {
    this.isDestroyed = true;
    this.stopUpdateTimer();

    // Clear cached elements
    this.elements = {};

    console.log('RealTimeStatusDisplay destroyed');
  }
}

export default RealTimeStatusDisplay;