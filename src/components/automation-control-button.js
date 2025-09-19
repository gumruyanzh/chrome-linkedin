/**
 * Dynamic Automation Control Button Component
 * Provides an intelligent start/stop button that adapts to automation state
 * with proper styling, loading states, and visual feedback.
 */

export class AutomationControlButton {
  constructor(buttonElement, stateManager, options = {}) {
    this.button = buttonElement;
    this.stateManager = stateManager;
    this.isDestroyed = false;

    // Configuration
    this.config = {
      showConfirmDialog: options.showConfirmDialog !== false,
      enableLoadingStates: options.enableLoadingStates !== false,
      animateTransitions: options.animateTransitions !== false,
      autoUpdateText: options.autoUpdateText !== false,
      showProgress: options.showProgress !== false,
      ...options
    };

    // Text configurations
    this.texts = {
      start: options.startText || 'Start Automation',
      stop: options.stopText || 'Stop Automation',
      starting: options.startingText || 'Starting...',
      stopping: options.stoppingText || 'Stopping...',
      paused: options.pausedText || 'Resume Automation',
      error: options.errorText || 'Retry Automation',
      disabled: options.disabledText || 'Navigate to LinkedIn',
      ...options.texts
    };

    // CSS class configurations
    this.classes = {
      base: [
        'w-full', 'py-vintage-sm', 'px-vintage-md', 'rounded-vintage',
        'font-newspaper', 'font-semibold', 'transition-all', 'duration-200',
        'border', 'focus:outline-none', 'focus:ring-2', 'focus:ring-opacity-50'
      ],
      start: [
        'vintage-button', 'hover:shadow-vintage-md',
        'focus:ring-vintage-accent'
      ],
      stop: [
        'bg-vintage-sepia-dark', 'hover:bg-vintage-sepia-darker',
        'text-vintage-paper', 'border-vintage-sepia-darker',
        'hover:shadow-vintage-md', 'focus:ring-vintage-sepia'
      ],
      loading: [
        'opacity-75', 'cursor-not-allowed'
      ],
      disabled: [
        'bg-vintage-accent', 'text-vintage-paper', 'border-vintage-accent-light',
        'opacity-75', 'cursor-not-allowed'
      ],
      error: [
        'bg-vintage-sepia', 'hover:bg-vintage-sepia-dark',
        'text-vintage-paper', 'border-vintage-sepia-dark',
        'focus:ring-vintage-sepia'
      ],
      ...options.classes
    };

    this.currentState = null;
    this.originalText = this.button.textContent;
    this.progressIndicator = null;

    this.init();
  }

  /**
   * Initialize the button component
   */
  init() {
    this.setupEventListeners();
    this.updateButtonState();

    // Listen to state manager events
    this.stateManager.addListener(this.handleStateChange.bind(this));

    console.log('AutomationControlButton initialized');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    this.button.addEventListener('click', this.handleClick.bind(this));

    // Add keyboard support
    this.button.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.handleClick(event);
      }
    });

    // Add hover effects for better UX
    if (this.config.animateTransitions) {
      this.button.addEventListener('mouseenter', this.handleMouseEnter.bind(this));
      this.button.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    }
  }

  /**
   * Handle button click
   */
  async handleClick(event) {
    event.preventDefault();

    if (this.button.disabled || this.isDestroyed) {
      return;
    }

    const state = this.stateManager.getState();

    try {
      if (state.state === 'inactive' || state.state === 'error') {
        await this.startAutomation();
      } else if (state.state === 'active' || state.state === 'paused') {
        await this.stopAutomation();
      } else if (state.state === 'starting' || state.state === 'stopping') {
        // Already in transition, ignore click
        return;
      }
    } catch (error) {
      console.error('Error handling button click:', error);
      this.showError(error.message);
    }
  }

  /**
   * Start automation with confirmation if configured
   */
  async startAutomation() {
    if (this.config.showConfirmDialog) {
      const confirmed = await this.showConfirmDialog(
        'Start Automation',
        'Are you sure you want to start the LinkedIn automation?',
        'Start'
      );

      if (!confirmed) {
        return;
      }
    }

    try {
      await this.stateManager.start();
    } catch (error) {
      this.showError(`Failed to start automation: ${error.message}`);
      throw error;
    }
  }

  /**
   * Stop automation with confirmation if configured
   */
  async stopAutomation() {
    if (this.config.showConfirmDialog) {
      const confirmed = await this.showConfirmDialog(
        'Stop Automation',
        'Are you sure you want to stop the automation? This will interrupt the current process.',
        'Stop',
        'warning'
      );

      if (!confirmed) {
        return;
      }
    }

    try {
      await this.stateManager.stop();
    } catch (error) {
      this.showError(`Failed to stop automation: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle state changes from the state manager
   */
  handleStateChange(event, data) {
    if (this.isDestroyed) return;

    switch (event) {
      case 'stateChanged':
        this.updateButtonState();
        if (this.config.showProgress && data.newState === 'active') {
          this.showProgress();
        } else if (data.newState === 'inactive') {
          this.hideProgress();
        }
        break;

      case 'startupProgress':
      case 'shutdownProgress':
        if (this.config.enableLoadingStates) {
          this.updateLoadingProgress(data);
        }
        break;

      case 'progressUpdated':
        if (this.config.autoUpdateText && data.text) {
          this.updateProgressText(data.text);
        }
        break;

      case 'error':
        this.showError(data.error);
        break;
    }
  }

  /**
   * Update button state based on current automation state
   */
  updateButtonState() {
    const state = this.stateManager.getState();

    if (this.currentState === state.state) {
      return; // No change needed
    }

    this.currentState = state.state;

    // Remove all state-specific classes
    this.removeAllStateClasses();

    // Apply base classes
    this.button.className = '';
    this.addClasses(this.classes.base);

    // Update based on current state
    switch (state.state) {
      case 'inactive':
        this.setButtonState('start');
        break;

      case 'starting':
        this.setButtonState('loading', this.texts.starting);
        break;

      case 'active':
        this.setButtonState('stop');
        break;

      case 'stopping':
        this.setButtonState('loading', this.texts.stopping);
        break;

      case 'paused':
        this.setButtonState('start', this.texts.paused);
        break;

      case 'error':
        this.setButtonState('error', this.texts.error);
        break;

      default:
        this.setButtonState('disabled');
    }

    // Animate transition if enabled
    if (this.config.animateTransitions) {
      this.animateStateTransition();
    }
  }

  /**
   * Set button to specific state
   */
  setButtonState(stateType, customText = null) {
    // Clear previous state
    this.button.disabled = false;
    this.button.textContent = customText || this.texts[stateType] || this.originalText;

    // Apply state-specific classes and properties
    switch (stateType) {
      case 'start':
        this.addClasses(this.classes.start);
        break;

      case 'stop':
        this.addClasses(this.classes.stop);
        break;

      case 'loading':
        this.addClasses(this.classes.loading);
        this.button.disabled = true;
        if (this.config.enableLoadingStates) {
          this.addLoadingSpinner();
        }
        break;

      case 'disabled':
        this.addClasses(this.classes.disabled);
        this.button.disabled = true;
        this.button.textContent = this.texts.disabled;
        break;

      case 'error':
        this.addClasses(this.classes.error);
        break;
    }
  }

  /**
   * Add loading spinner to button
   */
  addLoadingSpinner() {
    if (this.button.querySelector('.loading-spinner')) {
      return; // Already has spinner
    }

    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner animate-spin rounded-full h-4 w-4 border-b-2 border-current inline-block mr-2';
    this.button.insertBefore(spinner, this.button.firstChild);
  }

  /**
   * Remove loading spinner
   */
  removeLoadingSpinner() {
    const spinner = this.button.querySelector('.loading-spinner');
    if (spinner) {
      spinner.remove();
    }
  }

  /**
   * Update loading progress
   */
  updateLoadingProgress(data) {
    if (data.stage && this.config.enableLoadingStates) {
      const text = data.stage === 'initializing' ? 'Initializing...' :
                   data.stage === 'connecting' ? 'Connecting...' :
                   data.stage === 'ready' ? 'Almost ready...' :
                   data.stage === 'saving' ? 'Saving...' :
                   data.stage === 'cleanup' ? 'Cleaning up...' :
                   data.stage === 'complete' ? 'Complete!' : 'Processing...';

      this.button.textContent = text;
    }
  }

  /**
   * Update progress text
   */
  updateProgressText(text) {
    if (this.currentState === 'active' && this.config.autoUpdateText) {
      this.button.textContent = `Stop (${text})`;
    }
  }

  /**
   * Show progress indicator
   */
  showProgress() {
    if (!this.config.showProgress || this.progressIndicator) {
      return;
    }

    this.progressIndicator = document.createElement('div');
    this.progressIndicator.className = 'progress-indicator h-1 bg-vintage-sage rounded-full mt-1 transition-all duration-300';
    this.progressIndicator.style.width = '0%';

    this.button.parentNode.insertBefore(this.progressIndicator, this.button.nextSibling);

    // Listen for progress updates
    this.stateManager.addListener((event, data) => {
      if (event === 'progressUpdated' && this.progressIndicator) {
        this.progressIndicator.style.width = `${data.percentage || 0}%`;
      }
    });
  }

  /**
   * Hide progress indicator
   */
  hideProgress() {
    if (this.progressIndicator) {
      this.progressIndicator.remove();
      this.progressIndicator = null;
    }
  }

  /**
   * Show confirmation dialog
   */
  async showConfirmDialog(title, message, confirmText, type = 'info') {
    return new Promise((resolve) => {
      const dialog = document.createElement('div');
      dialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';

      const typeColors = {
        info: 'border-vintage-accent',
        warning: 'border-vintage-sepia',
        error: 'border-vintage-sepia-dark'
      };

      dialog.innerHTML = `
        <div class="bg-vintage-paper rounded-vintage p-vintage-lg max-w-md mx-4 border-2 ${typeColors[type]} shadow-vintage-xl">
          <h3 class="vintage-heading text-vintage-lg mb-vintage-md text-vintage-ink">${title}</h3>
          <p class="vintage-body mb-vintage-lg text-vintage-ink-light">${message}</p>
          <div class="flex space-x-vintage-sm">
            <button class="confirm-btn vintage-button flex-1">${confirmText}</button>
            <button class="cancel-btn w-full py-vintage-sm px-vintage-md rounded-vintage font-newspaper font-medium transition-all duration-200 bg-vintage-paper-dark text-vintage-accent border border-vintage-accent hover:bg-vintage-accent hover:text-vintage-paper flex-1">Cancel</button>
          </div>
        </div>
      `;

      document.body.appendChild(dialog);

      const confirmBtn = dialog.querySelector('.confirm-btn');
      const cancelBtn = dialog.querySelector('.cancel-btn');

      const cleanup = () => {
        dialog.remove();
      };

      confirmBtn.addEventListener('click', () => {
        cleanup();
        resolve(true);
      });

      cancelBtn.addEventListener('click', () => {
        cleanup();
        resolve(false);
      });

      // Close on Escape key
      const handleKeyDown = (event) => {
        if (event.key === 'Escape') {
          cleanup();
          resolve(false);
          document.removeEventListener('keydown', handleKeyDown);
        }
      };

      document.addEventListener('keydown', handleKeyDown);
    });
  }

  /**
   * Show error message
   */
  showError(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 left-4 right-4 bg-vintage-sepia text-vintage-paper p-vintage-md rounded-vintage vintage-body text-vintage-sm z-50 transform transition-all duration-300 ease-in-out shadow-vintage-lg border border-vintage-sepia-dark font-newspaper';
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.transform = 'translateY(-100%)';
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  /**
   * Animate state transition
   */
  animateStateTransition() {
    this.button.style.transform = 'scale(0.95)';
    setTimeout(() => {
      this.button.style.transform = 'scale(1)';
    }, 100);
  }

  /**
   * Handle mouse enter for enhanced UX
   */
  handleMouseEnter() {
    if (!this.button.disabled && this.config.animateTransitions) {
      this.button.style.transform = 'translateY(-1px)';
    }
  }

  /**
   * Handle mouse leave
   */
  handleMouseLeave() {
    if (this.config.animateTransitions) {
      this.button.style.transform = 'translateY(0)';
    }
  }

  /**
   * Utility methods
   */
  addClasses(classes) {
    this.button.classList.add(...classes);
  }

  removeAllStateClasses() {
    const allStateClasses = [
      ...this.classes.start,
      ...this.classes.stop,
      ...this.classes.loading,
      ...this.classes.disabled,
      ...this.classes.error
    ];

    this.button.classList.remove(...allStateClasses);
    this.removeLoadingSpinner();
  }

  /**
   * Update button text
   */
  updateText(newText) {
    if (!this.button.disabled) {
      this.button.textContent = newText;
    }
  }

  /**
   * Enable/disable the button
   */
  setEnabled(enabled) {
    this.button.disabled = !enabled;
    if (enabled) {
      this.button.classList.remove('opacity-75', 'cursor-not-allowed');
    } else {
      this.button.classList.add('opacity-75', 'cursor-not-allowed');
    }
  }

  /**
   * Destroy the component and cleanup
   */
  destroy() {
    this.isDestroyed = true;
    this.hideProgress();
    this.removeLoadingSpinner();

    // Remove event listeners
    const newButton = this.button.cloneNode(true);
    this.button.parentNode.replaceChild(newButton, this.button);

    console.log('AutomationControlButton destroyed');
  }
}

export default AutomationControlButton;