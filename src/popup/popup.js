// Popup script for LinkedIn Chrome Extension
document.addEventListener('DOMContentLoaded', initializePopup);

let currentSettings = null;
let isAutomationActive = false;
let helpSystem = null;
let refreshInterval = null;
let lastStatsUpdate = 0;

async function initializePopup() {
  try {
    // Show loading state
    showLoadingState();

    // Initialize help system
    if (typeof HelpSystem !== 'undefined') {
      helpSystem = new HelpSystem();
      helpSystem.init();
    }

    // Load current settings with timeout
    currentSettings = await withTimeout(getSettings(), 5000, 'Failed to load settings');

    // Check current automation state with timeout
    await withTimeout(syncAutomationState(), 3000, 'Failed to sync automation state');

    // Update UI with current status
    updateStatusDisplay();
    await updateStatsDisplay();

    // Setup event listeners
    setupEventListeners();

    // Check if we're on LinkedIn
    await checkLinkedInTab();

    // Hide loading state
    hideLoadingState();

    // Start auto-refresh if automation is active
    if (isAutomationActive) {
      startAutoRefresh();
    }
  } catch (error) {
    console.error('Error initializing popup:', error);
    hideLoadingState();
    showError('Failed to initialize extension: ' + error.message);
  }
}

function startAutoRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }

  refreshInterval = setInterval(async () => {
    try {
      // Only refresh if automation is active and popup is visible
      if (isAutomationActive && document.visibilityState === 'visible') {
        await syncAutomationState();

        // Update stats every 10 seconds to avoid overwhelming
        const now = Date.now();
        if (now - lastStatsUpdate > 10000) {
          await updateStatsDisplay();
          lastStatsUpdate = now;
        }
      }
    } catch (error) {
      console.warn('Auto-refresh error:', error);
    }
  }, 3000); // Refresh every 3 seconds
}

function stopAutoRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
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
    // Set loading state immediately
    setElementLoading('start-automation', true, isAutomationActive ? 'Stopping...' : 'Starting...');

    // Get current tab with timeout
    const [tab] = await withTimeout(
      chrome.tabs.query({ active: true, currentWindow: true }),
      2000,
      'Failed to get current tab'
    );

    if (!tab) {
      throw new Error('No active tab found');
    }

    console.log('Current tab URL:', tab.url);

    if (!tab.url || !tab.url.includes('linkedin.com')) {
      throw new Error('Please navigate to LinkedIn first');
    }

    const action = isAutomationActive ? 'STOP_AUTOMATION' : 'START_AUTOMATION';
    const actionName = isAutomationActive ? 'stop' : 'start';

    console.log(`Attempting to ${actionName} automation... Current popup state:`, isAutomationActive);

    // Send message to content script with timeout
    const response = await withTimeout(
      chrome.tabs.sendMessage(tab.id, { type: action }),
      10000,
      `Content script timeout while trying to ${actionName} automation`
    );

    console.log(`${actionName} automation response:`, response);

    if (response && response.success) {
      // Use the state returned by content script to stay in sync
      isAutomationActive = response.isActive !== undefined ? response.isActive : !isAutomationActive;
      console.log('Updated popup state to:', isAutomationActive);

      updateStatusDisplay();
      showSuccess(`Automation ${isAutomationActive ? 'started' : 'stopped'} successfully!`);

      // Handle auto-refresh based on automation state
      if (isAutomationActive) {
        setTimeout(updateStatsDisplay, 1000);
        startAutoRefresh();
      } else {
        stopAutoRefresh();
      }
    } else {
      throw new Error(response?.error || `Content script did not respond to ${actionName} request`);
    }
  } catch (error) {
    console.error('Error toggling automation:', error);

    // Provide specific error messages based on error type
    let errorMessage = 'Failed to toggle automation';

    if (error.message.includes('Could not establish connection')) {
      errorMessage = 'Content script not loaded. Please refresh the LinkedIn page.';
    } else if (error.message.includes('The message port closed')) {
      errorMessage = 'Content script connection lost. Please refresh the page.';
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Operation timed out. LinkedIn may be slow or content script not responding.';
    } else if (error.message.includes('LinkedIn')) {
      errorMessage = error.message;
    } else {
      errorMessage = `Failed to toggle automation: ${error.message}`;
    }

    showError(errorMessage);
  } finally {
    // Always reset loading state
    setElementLoading('start-automation', false);
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
  const startButton = document.getElementById('start-automation');

  if (isAutomationActive) {
    // Animate status dot with vintage styling
    statusDot.className = 'w-2 h-2 bg-vintage-sage rounded-full animate-pulse border border-vintage-accent';
    statusText.textContent = 'Active';
    statusText.classList.add('text-vintage-sage');
    statusText.classList.remove('text-vintage-sepia', 'text-vintage-accent', 'text-vintage-ink-light');

    if (startButton && !startButton.disabled) {
      startButton.textContent = 'Stop Automation';
      // Remove vintage-button class temporarily and apply stop styling
      startButton.classList.remove('vintage-button');
      startButton.classList.add(
        'w-full', 'py-vintage-sm', 'px-vintage-md', 'rounded-vintage',
        'font-newspaper', 'font-semibold', 'transition-all', 'duration-200',
        'bg-vintage-sepia-dark', 'hover:bg-vintage-sepia-darker', 'text-vintage-paper',
        'border', 'border-vintage-sepia-darker'
      );
    }
  } else {
    statusDot.className = 'w-2 h-2 bg-vintage-sepia rounded-full border border-vintage-accent';
    statusText.textContent = 'Inactive';
    statusText.classList.add('text-vintage-ink');
    statusText.classList.remove('text-vintage-sage', 'text-vintage-accent', 'text-vintage-ink-light');

    if (startButton && !startButton.disabled) {
      startButton.textContent = 'Start Automation';
      // Restore vintage-button class and remove stop styling
      startButton.classList.remove(
        'bg-vintage-sepia-dark', 'hover:bg-vintage-sepia-darker', 'text-vintage-paper',
        'border', 'border-vintage-sepia-darker'
      );
      startButton.classList.add('vintage-button');
    }
  }
}

// Add detailed status reporting
function updateDetailedStatus(statusInfo = null) {
  if (!statusInfo) {return;}

  const statusElement = document.getElementById('status');
  const statusText = statusElement.querySelector('span');

  if (statusInfo.isProcessing) {
    statusText.textContent = 'Processing...';
    statusText.classList.add('text-blue-600');
    statusText.classList.remove('text-green-600', 'text-red-600', 'text-yellow-600');
  } else if (statusInfo.isPaused) {
    statusText.textContent = 'Paused';
    statusText.classList.add('text-yellow-600');
    statusText.classList.remove('text-green-600', 'text-red-600', 'text-blue-600');
  } else if (statusInfo.hasError) {
    statusText.textContent = 'Error';
    statusText.classList.add('text-red-600');
    statusText.classList.remove('text-green-600', 'text-blue-600', 'text-yellow-600');
  }
}

// Progress tracking functions
function showProgressSection() {
  const progressSection = document.getElementById('progress-section');
  if (progressSection) {
    progressSection.classList.remove('hidden');
  }
}

function hideProgressSection() {
  const progressSection = document.getElementById('progress-section');
  if (progressSection) {
    progressSection.classList.add('hidden');
  }
}

function updateProgress(progressData) {
  if (!progressData) {return;}

  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');
  const progressPercentage = document.getElementById('progress-percentage');

  if (progressBar && progressData.percentage !== undefined) {
    progressBar.style.width = `${Math.min(100, Math.max(0, progressData.percentage))}%`;
  }

  if (progressText && progressData.text) {
    progressText.textContent = progressData.text;
  }

  if (progressPercentage && progressData.percentage !== undefined) {
    progressPercentage.textContent = `${Math.round(progressData.percentage)}%`;
  }

  // Show/hide progress section based on automation state
  if (isAutomationActive && progressData.percentage > 0) {
    showProgressSection();
  } else if (!isAutomationActive) {
    hideProgressSection();
  }
}

async function updateStatsDisplay() {
  try {
    // Show loading state for stats
    const sentElement = document.getElementById('sent-today');
    const acceptedElement = document.getElementById('accepted');

    sentElement.textContent = '...';
    acceptedElement.textContent = '...';

    const response = await withTimeout(
      chrome.runtime.sendMessage({ type: 'GET_ANALYTICS_SUMMARY' }),
      5000,
      'Failed to load analytics data'
    );

    if (response && response.success && response.data) {
      const analytics = response.data;

      // Animate number changes
      animateNumber(sentElement, analytics.connectionsSent || 0);
      animateNumber(acceptedElement, analytics.connectionsAccepted || 0);
    } else {
      console.warn('No analytics data available:', response);
      sentElement.textContent = '0';
      acceptedElement.textContent = '0';
    }
  } catch (error) {
    console.error('Error updating stats:', error);
    document.getElementById('sent-today').textContent = '-';
    document.getElementById('accepted').textContent = '-';
  }
}

function animateNumber(element, targetNumber) {
  const currentNumber = parseInt(element.textContent) || 0;
  const increment = Math.ceil((targetNumber - currentNumber) / 10);

  if (currentNumber === targetNumber) {
    element.textContent = targetNumber.toString();
    return;
  }

  let current = currentNumber;
  const timer = setInterval(() => {
    current += increment;
    if ((increment > 0 && current >= targetNumber) || (increment < 0 && current <= targetNumber)) {
      current = targetNumber;
      clearInterval(timer);
    }
    element.textContent = current.toString();
  }, 50);
}

async function checkLinkedInTab() {
  try {
    const [tab] = await withTimeout(
      chrome.tabs.query({ active: true, currentWindow: true }),
      2000,
      'Failed to get current tab'
    );

    const startButton = document.getElementById('start-automation');

    if (!tab || !tab.url) {
      startButton.disabled = true;
      startButton.textContent = 'No Active Tab';
      startButton.classList.add('bg-gray-400');
      startButton.classList.remove('bg-blue-600', 'hover:bg-blue-700');
      return;
    }

    if (!tab.url.includes('linkedin.com')) {
      startButton.disabled = true;
      startButton.textContent = 'Navigate to LinkedIn';
      startButton.classList.remove('vintage-button');
      startButton.classList.add(
        'w-full', 'py-vintage-sm', 'px-vintage-md', 'rounded-vintage',
        'font-newspaper', 'font-medium', 'transition-all', 'duration-200',
        'bg-vintage-accent', 'text-vintage-paper', 'border', 'border-vintage-accent-light'
      );

      // Show helpful message for non-LinkedIn pages
      if (tab.url.includes('chrome://') || tab.url.includes('chrome-extension://')) {
        startButton.textContent = 'Cannot run on this page';
      }
    } else {
      // On LinkedIn - check if it's a supported page
      if (tab.url.includes('/search/people/') || tab.url.includes('/search/results/people/')) {
        startButton.textContent = isAutomationActive ? 'Stop Automation' : 'Start Automation';
        startButton.disabled = false;
        // Remove any state-specific classes and restore default styling
        startButton.classList.remove(
          'bg-vintage-accent', 'text-vintage-paper', 'border', 'border-vintage-accent-light',
          'bg-vintage-paper-dark', 'text-vintage-accent', 'border-vintage-accent'
        );
        updateStatusDisplay(); // Refresh status when on correct page
      } else {
        startButton.textContent = 'Go to LinkedIn Search';
        startButton.disabled = true;
        startButton.classList.remove('vintage-button');
        startButton.classList.add(
          'w-full', 'py-vintage-sm', 'px-vintage-md', 'rounded-vintage',
          'font-newspaper', 'font-medium', 'transition-all', 'duration-200',
          'bg-vintage-paper-dark', 'text-vintage-accent', 'border', 'border-vintage-accent'
        );
      }
    }
  } catch (error) {
    console.error('Error checking tab:', error);
    const startButton = document.getElementById('start-automation');
    startButton.disabled = true;
    startButton.textContent = 'Tab Check Failed';
  }
}

async function getSettings() {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, response => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      if (response && response.success) {
        resolve(response.data || {});
      } else {
        // Return default settings if no response or error
        console.warn('Failed to get settings, using defaults:', response);
        resolve({
          connectionRequestsPerDay: 20,
          delayBetweenRequests: 5000,
          personalizedMessages: true,
          analyticsEnabled: true,
          safeModeEnabled: true
        });
      }
    });
  });
}

async function getAnalytics() {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: 'GET_ANALYTICS' }, response => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      if (response && response.success) {
        resolve(response.data || []);
      } else {
        console.warn('Failed to get analytics, returning empty array:', response);
        resolve([]);
      }
    });
  });
}

async function syncAutomationState() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab && tab.url && tab.url.includes('linkedin.com')) {
      // Query the content script for current automation state
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_AUTOMATION_STATE' });

      if (response && response.success) {
        const contentScriptState = response.isActive || false;
        console.log('Content script state:', contentScriptState, 'Popup state:', isAutomationActive);

        // If states are mismatched, sync to content script state
        if (isAutomationActive !== contentScriptState) {
          console.log('State mismatch detected, syncing to content script state');
          isAutomationActive = contentScriptState;
        }
      } else {
        // If content script doesn't respond, assume inactive
        console.log('Content script did not respond, assuming inactive');
        isAutomationActive = false;
      }
    } else {
      // Not on LinkedIn, automation should be inactive
      isAutomationActive = false;
    }
  } catch (error) {
    console.warn('Could not sync automation state:', error);
    // Try to reset the content script state if sync fails
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url && tab.url.includes('linkedin.com')) {
        await chrome.tabs.sendMessage(tab.id, { type: 'RESET_AUTOMATION' });
      }
    } catch (resetError) {
      console.warn('Could not reset automation state:', resetError);
    }
    isAutomationActive = false;
  }
}

function showError(message) {
  showNotification(message, 'error');
}

function showSuccess(message) {
  showNotification(message, 'success');
}

function showNotification(message, type = 'info') {
  const notificationDiv = document.createElement('div');

  const typeStyles = {
    success: 'bg-vintage-sage text-vintage-paper border-vintage-sage-dark',
    error: 'bg-vintage-sepia text-vintage-paper border-vintage-sepia-dark',
    warning: 'bg-vintage-paper text-vintage-accent border-vintage-accent',
    info: 'bg-vintage-accent text-vintage-paper border-vintage-accent-light'
  };

  const styles = typeStyles[type] || typeStyles.info;

  notificationDiv.className = `fixed top-4 left-4 right-4 ${styles} p-vintage-md rounded-vintage vintage-body text-vintage-sm z-50 transform transition-all duration-300 ease-in-out shadow-vintage-lg border font-newspaper`;
  notificationDiv.textContent = message;

  // Add to DOM with animation
  document.body.appendChild(notificationDiv);

  // Trigger animation
  requestAnimationFrame(() => {
    notificationDiv.style.transform = 'translateY(0) scale(1)';
    notificationDiv.style.opacity = '1';
  });

  setTimeout(() => {
    notificationDiv.style.transform = 'translateY(-100%) scale(0.95)';
    notificationDiv.style.opacity = '0';
    setTimeout(() => {
      if (notificationDiv.parentNode) {
        notificationDiv.remove();
      }
    }, 300);
  }, 3000);
}

function showLoadingState() {
  const loadingOverlay = document.createElement('div');
  loadingOverlay.id = 'loading-overlay';
  loadingOverlay.className =
    'fixed inset-0 bg-vintage-paper bg-opacity-95 flex items-center justify-center z-50';
  loadingOverlay.innerHTML = `
    <div class="flex flex-col items-center space-y-vintage-md">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-vintage-sepia"></div>
      <div class="vintage-body text-vintage-sm text-vintage-accent font-newspaper">Loading extension...</div>
    </div>
  `;
  document.body.appendChild(loadingOverlay);
}

function hideLoadingState() {
  const loadingOverlay = document.getElementById('loading-overlay');
  if (loadingOverlay) {
    loadingOverlay.style.opacity = '0';
    setTimeout(() => {
      if (loadingOverlay.parentNode) {
        loadingOverlay.remove();
      }
    }, 200);
  }
}

function withTimeout(promise, timeoutMs, errorMessage) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(errorMessage)), timeoutMs))
  ]);
}

function setElementLoading(elementId, isLoading, loadingText = 'Loading...') {
  const element = document.getElementById(elementId);
  if (!element) {return;}

  if (isLoading) {
    element.dataset.originalText = element.textContent;
    element.textContent = loadingText;
    element.disabled = true;
    element.classList.add('opacity-75', 'cursor-not-allowed');
  } else {
    element.textContent = element.dataset.originalText || element.textContent;
    element.disabled = false;
    element.classList.remove('opacity-75', 'cursor-not-allowed');
    delete element.dataset.originalText;
  }
}
