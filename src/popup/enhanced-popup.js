// Enhanced popup script with improved state management
import { getGlobalUIIntegration } from '../utils/ui-state-integration.js';

let uiIntegration = null;

// Initialize the enhanced popup system
document.addEventListener('DOMContentLoaded', initializeEnhancedPopup);

async function initializeEnhancedPopup() {
  try {
    console.log('Initializing enhanced popup system...');

    // Initialize the comprehensive UI integration
    uiIntegration = getGlobalUIIntegration({
      enableAutoInit: true,
      enableErrorHandling: true,
      enableConfirmations: true,
      enableAnimations: true,
      enablePersistence: true,
      updateInterval: 1000
    });

    await uiIntegration.init();

    // Setup additional event listeners
    setupAdditionalEventListeners();

    console.log('Enhanced popup system initialized successfully');

  } catch (error) {
    console.error('Error initializing enhanced popup:', error);

    // Fallback to basic functionality
    initializeFallbackPopup();
  }
}

function setupAdditionalEventListeners() {
  // Dashboard button
  const dashboardBtn = document.getElementById('open-dashboard');
  if (dashboardBtn) {
    dashboardBtn.addEventListener('click', openDashboard);
  }

  // Settings button
  const settingsBtn = document.getElementById('open-settings');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', openSettings);
  }

  // Help system integration
  const helpBtn = document.getElementById('help-button');
  if (helpBtn && typeof HelpSystem !== 'undefined') {
    const helpSystem = new HelpSystem();
    helpSystem.init();
    helpBtn.addEventListener('click', () => helpSystem.show());
  }

  // Quick help
  const quickHelpBtn = document.getElementById('quick-help');
  if (quickHelpBtn && typeof HelpSystem !== 'undefined') {
    quickHelpBtn.addEventListener('click', () => helpSystem.show('getting-started'));
  }

  // Listen for state manager events
  if (uiIntegration && uiIntegration.stateManager) {
    uiIntegration.addStateListener((event, data) => {
      handleStateEvent(event, data);
    });
  }
}

function handleStateEvent(event, data) {
  switch (event) {
    case 'stateChanged':
      updatePageTitle(data.newState);
      updateBrowserBadge(data);
      break;

    case 'progressUpdated':
      if (data.percentage === 100) {
        showCompletionNotification();
      }
      break;

    case 'statsUpdated':
      checkForMilestones(data);
      break;

    case 'error':
      showErrorNotification(data.error);
      break;
  }
}

function updatePageTitle(state) {
  const baseTitle = 'LinkedIn Chronicle';
  const stateText = {
    'active': 'Active',
    'paused': 'Paused',
    'error': 'Error'
  };

  document.title = stateText[state]
    ? `${baseTitle} - ${stateText[state]}`
    : baseTitle;
}

function updateBrowserBadge(data) {
  if (typeof chrome !== 'undefined' && chrome.action) {
    try {
      if (data.newState === 'active') {
        chrome.action.setBadgeText({ text: 'ON' });
        chrome.action.setBadgeBackgroundColor({ color: '#28a745' });
      } else if (data.newState === 'paused') {
        chrome.action.setBadgeText({ text: '||' });
        chrome.action.setBadgeBackgroundColor({ color: '#ffc107' });
      } else if (data.newState === 'error') {
        chrome.action.setBadgeText({ text: '!' });
        chrome.action.setBadgeBackgroundColor({ color: '#dc3545' });
      } else {
        chrome.action.setBadgeText({ text: '' });
      }
    } catch (error) {
      console.warn('Could not update browser badge:', error);
    }
  }
}

function showCompletionNotification() {
  showNotification('Automation completed successfully!', 'success');
}

function checkForMilestones(data) {
  const milestones = [10, 25, 50, 100, 250, 500];
  if (milestones.includes(data.connectionsSent)) {
    showNotification(`Milestone reached: ${data.connectionsSent} connections sent!`, 'success');
  }
}

function showErrorNotification(message) {
  showNotification(`Error: ${message}`, 'error');
}

function showNotification(message, type = 'info') {
  // Use the existing notification system or create a simple one
  console.log(`${type.toUpperCase()}: ${message}`);

  // Could also use browser notifications
  if (typeof chrome !== 'undefined' && chrome.notifications) {
    try {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon48.png'),
        title: 'LinkedIn Chronicle',
        message: message
      });
    } catch (error) {
      console.warn('Could not show browser notification:', error);
    }
  }
}

async function openDashboard() {
  try {
    await chrome.tabs.create({
      url: chrome.runtime.getURL('dashboard/dashboard.html')
    });
  } catch (error) {
    console.error('Error opening dashboard:', error);
  }
}

async function openSettings() {
  try {
    await chrome.tabs.create({
      url: chrome.runtime.getURL('settings/settings.html')
    });
  } catch (error) {
    console.error('Error opening settings:', error);
  }
}

// Fallback initialization for basic functionality
function initializeFallbackPopup() {
  console.log('Initializing fallback popup...');

  // Basic button event listeners
  const startBtn = document.getElementById('start-automation');
  if (startBtn) {
    startBtn.addEventListener('click', handleBasicToggle);
  }

  const dashboardBtn = document.getElementById('open-dashboard');
  if (dashboardBtn) {
    dashboardBtn.addEventListener('click', openDashboard);
  }

  const settingsBtn = document.getElementById('open-settings');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', openSettings);
  }
}

async function handleBasicToggle() {
  // Basic toggle functionality as fallback
  const button = document.getElementById('start-automation');
  const statusText = document.querySelector('#status .status-text');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.url || !tab.url.includes('linkedin.com')) {
      throw new Error('Please navigate to LinkedIn first');
    }

    // Determine current state
    const isActive = statusText.textContent === 'Active';
    const action = isActive ? 'STOP_AUTOMATION' : 'START_AUTOMATION';

    button.disabled = true;
    button.textContent = isActive ? 'Stopping...' : 'Starting...';

    const response = await chrome.tabs.sendMessage(tab.id, { type: action });

    if (response && response.success) {
      statusText.textContent = isActive ? 'Inactive' : 'Active';
      button.textContent = isActive ? 'Start Automation' : 'Stop Automation';

      showNotification(
        `Automation ${isActive ? 'stopped' : 'started'} successfully!`,
        'success'
      );
    } else {
      throw new Error(response?.error || 'Failed to toggle automation');
    }

  } catch (error) {
    console.error('Error in basic toggle:', error);
    showNotification(`Error: ${error.message}`, 'error');
  } finally {
    button.disabled = false;
  }
}

// Cleanup on unload
window.addEventListener('beforeunload', () => {
  if (uiIntegration) {
    uiIntegration.destroy();
  }
});

// Export for testing
export { initializeEnhancedPopup, uiIntegration };