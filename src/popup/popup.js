// Popup script for LinkedIn Chrome Extension
document.addEventListener('DOMContentLoaded', initializePopup);

let currentSettings = null;
let isAutomationActive = false;
let helpSystem = null;

async function initializePopup() {
  try {
    // Initialize help system
    if (typeof HelpSystem !== 'undefined') {
      helpSystem = new HelpSystem();
      helpSystem.init();
    }

    // Load current settings
    currentSettings = await getSettings();

    // Update UI with current status
    updateStatusDisplay();
    updateStatsDisplay();

    // Setup event listeners
    setupEventListeners();

    // Check if we're on LinkedIn
    checkLinkedInTab();
  } catch (error) {
    console.error('Error initializing popup:', error);
    showError('Failed to initialize extension');
  }
}

function setupEventListeners() {
  document.getElementById('start-automation').addEventListener('click', toggleAutomation);
  document.getElementById('open-dashboard').addEventListener('click', openDashboard);
  document.getElementById('open-settings').addEventListener('click', openSettings);

  // Help system event listeners
  const helpButton = document.getElementById('help-button');
  if (helpButton && helpSystem) {
    helpButton.addEventListener('click', () => helpSystem.show());
  }

  // Quick help for new users
  const quickHelpBtn = document.getElementById('quick-help');
  if (quickHelpBtn && helpSystem) {
    quickHelpBtn.addEventListener('click', () => helpSystem.show('getting-started'));
  }
}

async function toggleAutomation() {
  const button = document.getElementById('start-automation');

  try {
    if (!isAutomationActive) {
      // Start automation
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab.url.includes('linkedin.com')) {
        showError('Please navigate to LinkedIn first');
        return;
      }

      button.textContent = 'Stop Automation';
      button.classList.add('bg-red-600', 'hover:bg-red-700');
      button.classList.remove('bg-blue-600', 'hover:bg-blue-700');

      // Send message to content script to start automation
      await chrome.tabs.sendMessage(tab.id, { type: 'START_AUTOMATION' });

      isAutomationActive = true;
      updateStatusDisplay();
    } else {
      // Stop automation
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      button.textContent = 'Start Automation';
      button.classList.remove('bg-red-600', 'hover:bg-red-700');
      button.classList.add('bg-blue-600', 'hover:bg-blue-700');

      // Send message to content script to stop automation
      await chrome.tabs.sendMessage(tab.id, { type: 'STOP_AUTOMATION' });

      isAutomationActive = false;
      updateStatusDisplay();
    }
  } catch (error) {
    console.error('Error toggling automation:', error);
    showError('Failed to toggle automation');
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

function updateStatusDisplay() {
  const statusElement = document.getElementById('status');
  const statusDot = statusElement.querySelector('.w-2');
  const statusText = statusElement.querySelector('span');

  if (isAutomationActive) {
    statusDot.className = 'w-2 h-2 bg-green-500 rounded-full';
    statusText.textContent = 'Active';
  } else {
    statusDot.className = 'w-2 h-2 bg-red-500 rounded-full';
    statusText.textContent = 'Inactive';
  }
}

async function updateStatsDisplay() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_ANALYTICS_SUMMARY' });

    if (response.success && response.data) {
      const analytics = response.data;

      document.getElementById('sent-today').textContent = analytics.connectionsSent || 0;
      document.getElementById('accepted').textContent = analytics.connectionsAccepted || 0;
    }
  } catch (error) {
    console.error('Error updating stats:', error);
    document.getElementById('sent-today').textContent = '0';
    document.getElementById('accepted').textContent = '0';
  }
}

async function checkLinkedInTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const startButton = document.getElementById('start-automation');

    if (!tab.url.includes('linkedin.com')) {
      startButton.disabled = true;
      startButton.textContent = 'Navigate to LinkedIn';
    } else {
      startButton.disabled = false;
      startButton.textContent = 'Start Automation';
    }
  } catch (error) {
    console.error('Error checking tab:', error);
  }
}

async function getSettings() {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, response => {
      if (response.success) {
        resolve(response.data);
      } else {
        reject(new Error(response.error));
      }
    });
  });
}

async function getAnalytics() {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: 'GET_ANALYTICS' }, response => {
      if (response.success) {
        resolve(response.data);
      } else {
        reject(new Error(response.error));
      }
    });
  });
}

function showError(message) {
  // Create a simple error notification
  const errorDiv = document.createElement('div');
  errorDiv.className = 'fixed top-4 left-4 right-4 bg-red-500 text-white p-3 rounded-lg text-sm';
  errorDiv.textContent = message;

  document.body.appendChild(errorDiv);

  setTimeout(() => {
    errorDiv.remove();
  }, 3000);
}
