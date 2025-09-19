// Vintage-themed Onboarding System Component

class OnboardingSystem {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 4;
    this.isActive = false;
    this.onboardingData = {
      1: {
        title: 'Welcome to Editorial Chronicle',
        description: 'Transform your LinkedIn networking with professional automation that maintains the dignity and precision of classical correspondence.',
        actions: [
          { label: 'Begin Editorial Setup', primary: true, action: 'next' },
          { label: 'Skip Orientation', primary: false, action: 'skip' }
        ]
      },
      2: {
        title: 'Configure Editorial Settings',
        description: 'Establish your daily publication limits and automation preferences to ensure professional networking standards are maintained.',
        actions: [
          { label: 'Open Settings Chronicle', primary: true, action: 'openSettings' },
          { label: 'Use Default Configuration', primary: false, action: 'next' }
        ]
      },
      3: {
        title: 'Compose Message Templates',
        description: 'Create personalized connection request templates that reflect your professional voice and maintain editorial excellence.',
        actions: [
          { label: 'Create Editorial Templates', primary: true, action: 'openTemplates' },
          { label: 'Proceed with Samples', primary: false, action: 'next' }
        ]
      },
      4: {
        title: 'Editorial Operations Ready',
        description: 'Your Editorial Chronicle is now configured. Navigate to LinkedIn search results to begin your professional networking campaign.',
        actions: [
          { label: 'Launch Editorial Dashboard', primary: true, action: 'complete' },
          { label: 'Start Publishing Now', primary: false, action: 'startAutomation' }
        ]
      }
    };
  }

  // Initialize onboarding system
  init() {
    this.checkOnboardingStatus();
  }

  // Check if user needs onboarding
  async checkOnboardingStatus() {
    try {
      const result = await chrome.storage.local.get(['onboardingCompleted']);
      if (!result.onboardingCompleted) {
        this.showOnboarding();
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  }

  // Show onboarding flow
  showOnboarding() {
    if (this.isActive) {
      return;
    }

    this.isActive = true;
    this.currentStep = 1;
    this.createOnboardingModal();
    this.updateStepContent();
    this.trackOnboardingEvent('onboarding_started');
  }

  // Create onboarding modal structure
  createOnboardingModal() {
    // Remove existing modal if present
    const existingModal = document.getElementById('editorial-onboarding-modal');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'editorial-onboarding-modal';
    modal.className = 'editorial-onboarding-modal';

    // Inject vintage styles
    if (!document.getElementById('onboarding-vintage-styles')) {
      this.injectOnboardingStyles();
    }

    modal.innerHTML = `
      <div class="onboarding-overlay">
        <div class="onboarding-container">
          <div class="onboarding-header">
            <div class="onboarding-logo">
              <div class="editorial-emblem">📰</div>
              <h1 class="editorial-title">Editorial Chronicle</h1>
            </div>
            <button class="onboarding-close" type="button">&times;</button>
          </div>

          <div class="onboarding-progress">
            <div class="progress-bar">
              <div class="progress-fill" id="progress-fill"></div>
            </div>
            <p class="progress-text" id="progress-text">Step 1 of 4</p>
          </div>

          <div class="onboarding-content">
            <div class="step-number" id="step-number">1</div>
            <h2 class="step-title" id="step-title">Welcome to Editorial Chronicle</h2>
            <p class="step-description" id="step-description">Transform your LinkedIn networking with professional automation.</p>
          </div>

          <div class="onboarding-actions">
            <button class="action-secondary" id="secondary-action">Skip Orientation</button>
            <button class="action-primary" id="primary-action">Begin Editorial Setup</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.modal = modal;
    this.bindOnboardingEvents();
  }

  // Inject vintage CSS styles
  injectOnboardingStyles() {
    const styles = document.createElement('style');
    styles.id = 'onboarding-vintage-styles';
    styles.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&display=swap');

      .editorial-onboarding-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
        font-family: 'Crimson Text', Georgia, 'Times New Roman', Times, serif;
      }

      .onboarding-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(47, 47, 47, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(8px);
      }

      .onboarding-container {
        background: #F4F1DE;
        border: 3px solid #3D405B;
        border-radius: 16px;
        width: 90%;
        max-width: 600px;
        padding: 40px;
        box-shadow: 0 25px 75px rgba(47, 47, 47, 0.4), 0 10px 25px rgba(47, 47, 47, 0.2);
        animation: onboardingEnter 0.4s ease-out;
      }

      @keyframes onboardingEnter {
        from {
          opacity: 0;
          transform: scale(0.9) translateY(20px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }

      .onboarding-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 32px;
        padding-bottom: 20px;
        border-bottom: 2px solid rgba(61, 64, 91, 0.2);
      }

      .onboarding-logo {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .editorial-emblem {
        font-size: 32px;
        background: rgba(224, 122, 95, 0.1);
        padding: 12px;
        border-radius: 50%;
        border: 2px solid rgba(224, 122, 95, 0.3);
      }

      .editorial-title {
        font-size: 28px;
        font-weight: 700;
        color: #2F2F2F;
        margin: 0;
        letter-spacing: -0.02em;
      }

      .onboarding-close {
        background: none;
        border: none;
        font-size: 28px;
        color: #3D405B;
        cursor: pointer;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.2s;
      }

      .onboarding-close:hover {
        background: #3D405B;
        color: #F4F1DE;
      }

      .onboarding-progress {
        margin-bottom: 32px;
      }

      .progress-bar {
        width: 100%;
        height: 6px;
        background: rgba(61, 64, 91, 0.2);
        border-radius: 3px;
        overflow: hidden;
        margin-bottom: 8px;
      }

      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #E07A5F 0%, #D66A4A 100%);
        border-radius: 3px;
        transition: width 0.4s ease-out;
        width: 25%;
      }

      .progress-text {
        font-size: 13px;
        color: #3D405B;
        font-style: italic;
        margin: 0;
        text-align: center;
      }

      .onboarding-content {
        text-align: center;
        margin-bottom: 40px;
      }

      .step-number {
        display: inline-block;
        width: 60px;
        height: 60px;
        background: #E07A5F;
        color: #F4F1DE;
        border-radius: 50%;
        font-size: 24px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 20px;
        border: 3px solid rgba(224, 122, 95, 0.3);
      }

      .step-title {
        font-size: 26px;
        font-weight: 700;
        color: #2F2F2F;
        margin: 0 0 16px 0;
        line-height: 1.2;
      }

      .step-description {
        font-size: 16px;
        color: #3D405B;
        line-height: 1.6;
        margin: 0;
        max-width: 400px;
        margin: 0 auto;
      }

      .onboarding-actions {
        display: flex;
        justify-content: center;
        gap: 16px;
        padding-top: 24px;
        border-top: 2px solid rgba(61, 64, 91, 0.15);
      }

      .action-primary {
        padding: 14px 28px;
        background: #E07A5F;
        color: #F4F1DE;
        border: 2px solid #E07A5F;
        border-radius: 8px;
        font-family: 'Crimson Text', serif;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }

      .action-primary:hover {
        background: #D66A4A;
        border-color: #D66A4A;
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(224, 122, 95, 0.3);
      }

      .action-secondary {
        padding: 14px 28px;
        background: transparent;
        color: #3D405B;
        border: 2px solid rgba(61, 64, 91, 0.3);
        border-radius: 8px;
        font-family: 'Crimson Text', serif;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }

      .action-secondary:hover {
        background: rgba(61, 64, 91, 0.1);
        border-color: #3D405B;
      }

      @keyframes onboardingExit {
        from {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
        to {
          opacity: 0;
          transform: scale(0.9) translateY(-20px);
        }
      }
    `;

    document.head.appendChild(styles);
  }

  // Bind event listeners
  bindOnboardingEvents() {
    // Close button
    this.modal.querySelector('.onboarding-close').addEventListener('click', () => {
      this.hideOnboarding();
    });

    // Primary action button
    this.modal.querySelector('#primary-action').addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      this.handleAction(action);
    });

    // Secondary action button
    this.modal.querySelector('#secondary-action').addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      this.handleAction(action);
    });

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isActive) {
        this.hideOnboarding();
      }
    });

    // Overlay click
    this.modal.querySelector('.onboarding-overlay').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        this.hideOnboarding();
      }
    });
  }

  // Update step content
  updateStepContent() {
    const stepData = this.onboardingData[this.currentStep];

    // Update progress
    const progressFill = this.modal.querySelector('#progress-fill');
    const progressText = this.modal.querySelector('#progress-text');
    progressFill.style.width = `${(this.currentStep / this.totalSteps) * 100}%`;
    progressText.textContent = `Step ${this.currentStep} of ${this.totalSteps}`;

    // Update content
    this.modal.querySelector('#step-number').textContent = this.currentStep;
    this.modal.querySelector('#step-title').textContent = stepData.title;
    this.modal.querySelector('#step-description').textContent = stepData.description;

    // Update action buttons
    const primaryButton = this.modal.querySelector('#primary-action');
    const secondaryButton = this.modal.querySelector('#secondary-action');

    primaryButton.textContent = stepData.actions[0].label;
    primaryButton.dataset.action = stepData.actions[0].action;

    secondaryButton.textContent = stepData.actions[1].label;
    secondaryButton.dataset.action = stepData.actions[1].action;
  }

  // Handle action buttons
  async handleAction(action) {
    switch (action) {
      case 'next':
        this.nextStep();
        break;
      case 'skip':
        this.completeOnboarding();
        break;
      case 'openSettings':
        await this.openSettings();
        this.nextStep();
        break;
      case 'openTemplates':
        await this.openTemplates();
        this.nextStep();
        break;
      case 'complete':
        this.completeOnboarding();
        break;
      case 'startAutomation':
        this.completeOnboarding();
        // Could trigger automation start here
        break;
    }
  }

  // Move to next step
  nextStep() {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.updateStepContent();
      this.trackOnboardingEvent('step_completed', { step: this.currentStep - 1 });
    } else {
      this.completeOnboarding();
    }
  }

  // Open settings page
  async openSettings() {
    try {
      await chrome.tabs.create({
        url: chrome.runtime.getURL('src/settings/settings.html')
      });
      this.trackOnboardingEvent('settings_opened');
    } catch (error) {
      console.error('Error opening settings:', error);
    }
  }

  // Open templates (could be part of settings or separate page)
  async openTemplates() {
    try {
      await chrome.tabs.create({
        url: chrome.runtime.getURL('src/settings/settings.html#templates')
      });
      this.trackOnboardingEvent('templates_opened');
    } catch (error) {
      console.error('Error opening templates:', error);
    }
  }

  // Complete onboarding
  async completeOnboarding() {
    try {
      await chrome.storage.local.set({
        onboardingCompleted: true,
        onboardingCompletedDate: new Date().toISOString()
      });

      this.trackOnboardingEvent('onboarding_completed', {
        stepsCompleted: this.currentStep,
        totalSteps: this.totalSteps
      });

      this.hideOnboarding();
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  }

  // Hide onboarding modal
  hideOnboarding() {
    if (this.modal) {
      this.modal.style.animation = 'onboardingExit 0.3s ease-in';
      setTimeout(() => {
        if (this.modal && this.modal.parentNode) {
          this.modal.remove();
        }
        this.isActive = false;
      }, 300);
    }
  }

  // Reset onboarding (for testing or re-onboarding)
  async resetOnboarding() {
    try {
      await chrome.storage.local.remove(['onboardingCompleted', 'onboardingCompletedDate']);
      this.currentStep = 1;
      this.trackOnboardingEvent('onboarding_reset');
    } catch (error) {
      console.error('Error resetting onboarding:', error);
    }
  }

  // Track onboarding events for analytics
  trackOnboardingEvent(event, data = {}) {
    try {
      chrome.storage.local.get(['onboardingAnalytics'], (result) => {
        const analytics = result.onboardingAnalytics || {};
        const today = new Date().toISOString().split('T')[0];

        if (!analytics[today]) {
          analytics[today] = {};
        }

        if (!analytics[today][event]) {
          analytics[today][event] = 0;
        }

        analytics[today][event]++;

        chrome.storage.local.set({
          onboardingAnalytics: analytics,
          lastOnboardingEvent: { event, data, timestamp: new Date().toISOString() }
        });
      });
    } catch (error) {
      console.error('Error tracking onboarding event:', error);
    }
  }

  // Get onboarding analytics
  async getOnboardingAnalytics() {
    try {
      const result = await chrome.storage.local.get(['onboardingAnalytics']);
      return result.onboardingAnalytics || {};
    } catch (error) {
      console.error('Error getting onboarding analytics:', error);
      return {};
    }
  }
}

// Export for use in other components
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OnboardingSystem;
} else {
  window.OnboardingSystem = OnboardingSystem;
}