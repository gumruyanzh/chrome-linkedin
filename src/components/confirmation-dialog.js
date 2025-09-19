/**
 * Enhanced Confirmation Dialog Component
 * Provides user-friendly confirmation dialogs for automation state changes
 * with customizable styling, keyboard support, and accessibility features.
 */

export class ConfirmationDialog {
  constructor(options = {}) {
    // Configuration
    this.config = {
      enableKeyboardNavigation: options.enableKeyboardNavigation !== false,
      enableAnimations: options.enableAnimations !== false,
      autoFocus: options.autoFocus !== false,
      closeOnEscape: options.closeOnEscape !== false,
      closeOnBackdrop: options.closeOnBackdrop !== false,
      showCloseButton: options.showCloseButton !== false,
      ...options
    };

    // Dialog templates for different scenarios
    this.templates = {
      start: {
        title: 'Start Automation',
        message: 'Are you sure you want to start the LinkedIn automation?',
        confirmText: 'Start',
        cancelText: 'Cancel',
        type: 'info',
        icon: '🚀'
      },
      stop: {
        title: 'Stop Automation',
        message: 'Are you sure you want to stop the automation? This will interrupt the current process.',
        confirmText: 'Stop',
        cancelText: 'Continue',
        type: 'warning',
        icon: '⏹️'
      },
      pause: {
        title: 'Pause Automation',
        message: 'Do you want to pause the automation? You can resume it later.',
        confirmText: 'Pause',
        cancelText: 'Continue',
        type: 'info',
        icon: '⏸️'
      },
      resume: {
        title: 'Resume Automation',
        message: 'Resume the automation from where it was paused?',
        confirmText: 'Resume',
        cancelText: 'Keep Paused',
        type: 'info',
        icon: '▶️'
      },
      reset: {
        title: 'Reset Automation',
        message: 'This will reset all automation progress and statistics. This action cannot be undone.',
        confirmText: 'Reset',
        cancelText: 'Cancel',
        type: 'warning',
        icon: '🔄'
      },
      error: {
        title: 'Error Recovery',
        message: 'An error occurred. Would you like to retry the automation?',
        confirmText: 'Retry',
        cancelText: 'Stop',
        type: 'error',
        icon: '❌'
      }
    };

    this.activeDialog = null;
    this.keyboardHandler = null;
  }

  /**
   * Show confirmation dialog
   */
  async show(type = 'start', customOptions = {}) {
    // Don't show multiple dialogs
    if (this.activeDialog) {
      return false;
    }

    const template = this.templates[type] || this.templates.start;
    const options = { ...template, ...customOptions };

    return new Promise((resolve) => {
      this.activeDialog = this.createDialog(options, resolve);
      document.body.appendChild(this.activeDialog);

      if (this.config.enableAnimations) {
        this.animateIn();
      }

      if (this.config.enableKeyboardNavigation) {
        this.setupKeyboardHandlers(resolve);
      }

      if (this.config.autoFocus) {
        this.focusConfirmButton();
      }
    });
  }

  /**
   * Create dialog DOM element
   */
  createDialog(options, resolve) {
    const dialog = document.createElement('div');
    dialog.className = 'confirmation-dialog fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-all duration-300';
    dialog.style.opacity = '0';

    const typeColors = {
      info: {
        border: 'border-vintage-accent',
        iconBg: 'bg-vintage-accent',
        confirmBtn: 'vintage-button'
      },
      warning: {
        border: 'border-vintage-sepia',
        iconBg: 'bg-vintage-sepia',
        confirmBtn: 'bg-vintage-sepia hover:bg-vintage-sepia-dark text-vintage-paper border border-vintage-sepia-dark'
      },
      error: {
        border: 'border-vintage-sepia-dark',
        iconBg: 'bg-vintage-sepia-dark',
        confirmBtn: 'bg-vintage-sepia-dark hover:bg-vintage-sepia-darker text-vintage-paper border border-vintage-sepia-darker'
      }
    };

    const colors = typeColors[options.type] || typeColors.info;

    dialog.innerHTML = `
      <div class="dialog-content bg-vintage-paper rounded-vintage p-vintage-lg max-w-md mx-4 border-2 ${colors.border} shadow-vintage-xl transform transition-all duration-300 scale-95">
        ${this.config.showCloseButton ? `
          <button class="close-btn absolute top-vintage-sm right-vintage-sm w-6 h-6 rounded-full bg-vintage-paper-dark hover:bg-vintage-accent text-vintage-ink hover:text-vintage-paper transition-colors duration-200 flex items-center justify-center">
            <span class="text-xs">×</span>
          </button>
        ` : ''}

        <div class="flex items-start space-x-vintage-md mb-vintage-md">
          ${options.icon ? `
            <div class="flex-shrink-0 w-10 h-10 ${colors.iconBg} rounded-vintage flex items-center justify-center text-vintage-paper">
              <span class="text-lg">${options.icon}</span>
            </div>
          ` : ''}
          <div class="flex-1">
            <h3 class="vintage-heading text-vintage-lg mb-vintage-sm text-vintage-ink font-newspaper">${options.title}</h3>
            <p class="vintage-body text-vintage-ink-light leading-relaxed">${options.message}</p>
          </div>
        </div>

        ${options.details ? `
          <div class="bg-vintage-paper-dark rounded-vintage p-vintage-md mb-vintage-md">
            <p class="vintage-body text-vintage-sm text-vintage-ink-light">${options.details}</p>
          </div>
        ` : ''}

        ${options.warning ? `
          <div class="bg-vintage-sepia bg-opacity-10 border border-vintage-sepia rounded-vintage p-vintage-md mb-vintage-md">
            <p class="vintage-body text-vintage-sm text-vintage-sepia flex items-center">
              <span class="mr-2">⚠️</span>
              ${options.warning}
            </p>
          </div>
        ` : ''}

        <div class="flex space-x-vintage-sm">
          <button class="confirm-btn ${colors.confirmBtn} flex-1 py-vintage-sm px-vintage-md rounded-vintage font-newspaper font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50">
            ${options.confirmText}
          </button>
          <button class="cancel-btn w-full py-vintage-sm px-vintage-md rounded-vintage font-newspaper font-medium transition-all duration-200 bg-vintage-paper-dark text-vintage-accent border border-vintage-accent hover:bg-vintage-accent hover:text-vintage-paper flex-1 focus:outline-none focus:ring-2 focus:ring-vintage-accent focus:ring-opacity-50">
            ${options.cancelText}
          </button>
        </div>

        ${options.showDontAskAgain ? `
          <div class="mt-vintage-md">
            <label class="flex items-center space-x-2 vintage-body text-vintage-sm text-vintage-ink-light cursor-pointer">
              <input type="checkbox" class="dont-ask-checkbox rounded border-vintage-accent text-vintage-accent focus:ring-vintage-accent focus:ring-opacity-50">
              <span>Don't ask again for this session</span>
            </label>
          </div>
        ` : ''}
      </div>
    `;

    this.setupEventListeners(dialog, resolve);

    return dialog;
  }

  /**
   * Setup event listeners for dialog
   */
  setupEventListeners(dialog, resolve) {
    const confirmBtn = dialog.querySelector('.confirm-btn');
    const cancelBtn = dialog.querySelector('.cancel-btn');
    const closeBtn = dialog.querySelector('.close-btn');
    const dontAskCheckbox = dialog.querySelector('.dont-ask-checkbox');

    const cleanup = (result, dontAskAgain = false) => {
      this.removeKeyboardHandlers();

      if (this.config.enableAnimations) {
        this.animateOut(() => {
          if (dialog.parentNode) {
            dialog.remove();
          }
          this.activeDialog = null;
          resolve({ confirmed: result, dontAskAgain });
        });
      } else {
        if (dialog.parentNode) {
          dialog.remove();
        }
        this.activeDialog = null;
        resolve({ confirmed: result, dontAskAgain });
      }
    };

    confirmBtn.addEventListener('click', () => {
      const dontAskAgain = dontAskCheckbox ? dontAskCheckbox.checked : false;
      cleanup(true, dontAskAgain);
    });

    cancelBtn.addEventListener('click', () => {
      const dontAskAgain = dontAskCheckbox ? dontAskCheckbox.checked : false;
      cleanup(false, dontAskAgain);
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', () => cleanup(false));
    }

    if (this.config.closeOnBackdrop) {
      dialog.addEventListener('click', (event) => {
        if (event.target === dialog) {
          cleanup(false);
        }
      });
    }

    // Prevent clicks on dialog content from closing
    const dialogContent = dialog.querySelector('.dialog-content');
    dialogContent.addEventListener('click', (event) => {
      event.stopPropagation();
    });
  }

  /**
   * Setup keyboard event handlers
   */
  setupKeyboardHandlers(resolve) {
    this.keyboardHandler = (event) => {
      if (!this.activeDialog) return;

      switch (event.key) {
        case 'Escape':
          if (this.config.closeOnEscape) {
            event.preventDefault();
            this.close(false);
          }
          break;

        case 'Enter':
          event.preventDefault();
          this.close(true);
          break;

        case 'Tab':
          this.handleTabNavigation(event);
          break;
      }
    };

    document.addEventListener('keydown', this.keyboardHandler);
  }

  /**
   * Handle tab navigation within dialog
   */
  handleTabNavigation(event) {
    const focusableElements = this.activeDialog.querySelectorAll(
      'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }

  /**
   * Remove keyboard event handlers
   */
  removeKeyboardHandlers() {
    if (this.keyboardHandler) {
      document.removeEventListener('keydown', this.keyboardHandler);
      this.keyboardHandler = null;
    }
  }

  /**
   * Focus the confirm button
   */
  focusConfirmButton() {
    if (this.activeDialog) {
      const confirmBtn = this.activeDialog.querySelector('.confirm-btn');
      if (confirmBtn) {
        setTimeout(() => confirmBtn.focus(), 100);
      }
    }
  }

  /**
   * Animate dialog in
   */
  animateIn() {
    if (!this.activeDialog) return;

    const dialog = this.activeDialog;
    const content = dialog.querySelector('.dialog-content');

    requestAnimationFrame(() => {
      dialog.style.opacity = '1';
      if (content) {
        content.style.transform = 'scale(1)';
      }
    });
  }

  /**
   * Animate dialog out
   */
  animateOut(callback) {
    if (!this.activeDialog) {
      callback();
      return;
    }

    const dialog = this.activeDialog;
    const content = dialog.querySelector('.dialog-content');

    dialog.style.opacity = '0';
    if (content) {
      content.style.transform = 'scale(0.95)';
    }

    setTimeout(callback, 300);
  }

  /**
   * Close the dialog programmatically
   */
  close(confirmed = false) {
    if (!this.activeDialog) return;

    const event = new CustomEvent('click');
    const button = confirmed ?
      this.activeDialog.querySelector('.confirm-btn') :
      this.activeDialog.querySelector('.cancel-btn');

    if (button) {
      button.dispatchEvent(event);
    }
  }

  /**
   * Check if dialog is currently open
   */
  isOpen() {
    return this.activeDialog !== null;
  }

  /**
   * Add custom template
   */
  addTemplate(name, template) {
    this.templates[name] = template;
  }

  /**
   * Remove template
   */
  removeTemplate(name) {
    delete this.templates[name];
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
}

/**
 * Utility functions for common dialog scenarios
 */

// Singleton instance for convenience
let globalDialog = null;

export function getGlobalConfirmationDialog(options = {}) {
  if (!globalDialog) {
    globalDialog = new ConfirmationDialog(options);
  }
  return globalDialog;
}

export function resetGlobalConfirmationDialog() {
  globalDialog = null;
}

// Convenience functions
export async function confirmStart(customOptions = {}) {
  const dialog = getGlobalConfirmationDialog();
  const result = await dialog.show('start', customOptions);
  return result.confirmed;
}

export async function confirmStop(customOptions = {}) {
  const dialog = getGlobalConfirmationDialog();
  const result = await dialog.show('stop', customOptions);
  return result.confirmed;
}

export async function confirmPause(customOptions = {}) {
  const dialog = getGlobalConfirmationDialog();
  const result = await dialog.show('pause', customOptions);
  return result.confirmed;
}

export async function confirmResume(customOptions = {}) {
  const dialog = getGlobalConfirmationDialog();
  const result = await dialog.show('resume', customOptions);
  return result.confirmed;
}

export async function confirmReset(customOptions = {}) {
  const dialog = getGlobalConfirmationDialog();
  const result = await dialog.show('reset', {
    details: 'All connection statistics, progress, and saved state will be permanently deleted.',
    warning: 'This action cannot be undone and will reset the entire automation state.',
    ...customOptions
  });
  return result.confirmed;
}

export async function confirmErrorRecovery(error, customOptions = {}) {
  const dialog = getGlobalConfirmationDialog();
  const result = await dialog.show('error', {
    message: `${error.message} Would you like to retry?`,
    details: 'The automation will attempt to recover and continue from where it left off.',
    ...customOptions
  });
  return result.confirmed;
}

export async function showCustomConfirmation(options) {
  const dialog = getGlobalConfirmationDialog();
  const result = await dialog.show('start', options);
  return result.confirmed;
}

export default ConfirmationDialog;