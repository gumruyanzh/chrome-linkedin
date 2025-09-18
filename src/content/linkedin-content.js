// LinkedIn Content Script for Automation
import { sendConnectionRequest } from '../utils/linkedin-automation.js';
import { processSearchResults, extractSearchCriteria, navigateToNextPage } from '../utils/search-integration.js';
import { getSafetySettings, performSafetyCheck, createRateLimitTracker } from '../utils/safety-compliance.js';
import { trackEvent, ANALYTICS_EVENTS } from '../utils/analytics.js';

let isAutomationActive = false;
let automationInterval = null;
let rateLimitTracker = null;

// Initialize content script
initialize();

function initialize() {
  console.log('LinkedIn Automation Content Script Loaded');

  // Setup message listener for popup communication
  chrome.runtime.onMessage.addListener(handleMessage);

  // Initialize rate limit tracker
  rateLimitTracker = createRateLimitTracker();

  // Check if we're on a search results page
  if (window.location.href.includes('/search/people/')) {
    initializeSearchPage();
  }
}

async function handleMessage(request, sender, sendResponse) {
  try {
    switch (request.type) {
      case 'START_AUTOMATION':
        await startAutomation();
        sendResponse({ success: true });
        break;

      case 'STOP_AUTOMATION':
        stopAutomation();
        sendResponse({ success: true });
        break;

      case 'PROCESS_SEARCH_RESULTS':
        const results = await processSearchResults();
        sendResponse({ success: true, data: results });
        break;

      case 'SEND_CONNECTION_REQUEST':
        const result = await sendConnectionRequest(request.message);
        sendResponse({ success: true, data: result });
        break;

      default:
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  } catch (error) {
    console.error('Error handling message:', error);
    sendResponse({ success: false, error: error.message });
  }

  return true; // Keep message channel open for async response
}

async function startAutomation() {
  if (isAutomationActive) {
    console.log('Automation already active');
    return;
  }

  console.log('Starting LinkedIn automation...');
  isAutomationActive = true;

  await trackEvent(ANALYTICS_EVENTS.AUTOMATION_STARTED, {
    url: window.location.href,
    searchCriteria: extractSearchCriteria()
  });

  // Start automation loop
  automationLoop();
}

function stopAutomation() {
  console.log('Stopping LinkedIn automation...');
  isAutomationActive = false;

  if (automationInterval) {
    clearInterval(automationInterval);
    automationInterval = null;
  }

  trackEvent(ANALYTICS_EVENTS.AUTOMATION_STOPPED, {
    url: window.location.href
  });
}

async function automationLoop() {
  if (!isAutomationActive) return;

  try {
    // Perform safety check before proceeding
    const safetyCheck = await performSafetyCheck();
    if (!safetyCheck.safe) {
      console.log('Automation paused for safety:', safetyCheck.message);
      stopAutomation();
      showNotification(`Automation paused: ${safetyCheck.message}`, 'warning');
      return;
    }

    // Check if we're on a search results page
    if (window.location.href.includes('/search/people/')) {
      await processSearchPage();
    } else {
      console.log('Not on a search results page, stopping automation');
      stopAutomation();
      return;
    }

    // Schedule next iteration with human-like delay
    const delay = await rateLimitTracker.generateHumanDelay();
    automationInterval = setTimeout(automationLoop, delay);

  } catch (error) {
    console.error('Error in automation loop:', error);
    stopAutomation();
    showNotification('Automation stopped due to error', 'error');
  }
}

async function processSearchPage() {
  try {
    const profiles = await processSearchResults();
    console.log(`Found ${profiles.length} connectable profiles`);

    for (const profile of profiles) {
      if (!isAutomationActive) break;

      // Check rate limits before each connection
      const rateCheck = await rateLimitTracker.checkRateLimit();
      if (!rateCheck.allowed) {
        console.log('Rate limit reached:', rateCheck.message);
        showNotification(`Rate limit: ${rateCheck.message}`, 'info');
        stopAutomation();
        break;
      }

      // Send connection request
      const result = await sendConnectionRequest();
      rateLimitTracker.recordAttempt(result.success);

      if (result.success) {
        console.log('Connection request sent successfully');
        showNotification('Connection request sent!', 'success');
      } else {
        console.log('Connection request failed:', result.error);
      }

      // Wait between requests
      const delay = await rateLimitTracker.generateHumanDelay();
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    // Try to navigate to next page if automation is still active
    if (isAutomationActive && profiles.length > 0) {
      const navigated = await navigateToNextPage();
      if (!navigated) {
        console.log('No more pages available, stopping automation');
        stopAutomation();
        showNotification('Automation completed - no more results', 'info');
      }
    }

  } catch (error) {
    console.error('Error processing search page:', error);
    stopAutomation();
  }
}

function initializeSearchPage() {
  console.log('Initializing search results page');

  // Add automation controls to the page
  addAutomationControls();
}

function addAutomationControls() {
  // Check if controls already exist
  if (document.getElementById('linkedin-automation-controls')) {
    return;
  }

  const controls = document.createElement('div');
  controls.id = 'linkedin-automation-controls';
  controls.className = 'fixed top-4 right-4 z-50 bg-white border border-gray-300 rounded-lg p-4 shadow-lg max-w-sm';

  controls.innerHTML = `
    <div class="flex items-center justify-between mb-3">
      <h3 class="font-semibold text-gray-800">LinkedIn Automation</h3>
      <button id="close-controls" class="text-gray-500 hover:text-gray-700">×</button>
    </div>

    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-sm text-gray-600">Status:</span>
        <span id="automation-status" class="text-sm font-medium ${isAutomationActive ? 'text-green-600' : 'text-red-600'}">
          ${isAutomationActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div class="flex items-center justify-between">
        <span class="text-sm text-gray-600">Profiles found:</span>
        <span id="profiles-count" class="text-sm font-medium">-</span>
      </div>

      <button id="toggle-automation" class="w-full py-2 px-4 rounded text-sm font-medium ${
        isAutomationActive
          ? 'bg-red-500 hover:bg-red-600 text-white'
          : 'bg-blue-500 hover:bg-blue-600 text-white'
      }">
        ${isAutomationActive ? 'Stop' : 'Start'} Automation
      </button>
    </div>
  `;

  document.body.appendChild(controls);

  // Setup event listeners
  document.getElementById('close-controls').addEventListener('click', () => {
    controls.remove();
  });

  document.getElementById('toggle-automation').addEventListener('click', () => {
    if (isAutomationActive) {
      stopAutomation();
    } else {
      startAutomation();
    }
    updateControlsDisplay();
  });

  // Update initial display
  updateControlsDisplay();
}

function updateControlsDisplay() {
  const statusElement = document.getElementById('automation-status');
  const buttonElement = document.getElementById('toggle-automation');

  if (statusElement) {
    statusElement.textContent = isAutomationActive ? 'Active' : 'Inactive';
    statusElement.className = `text-sm font-medium ${isAutomationActive ? 'text-green-600' : 'text-red-600'}`;
  }

  if (buttonElement) {
    buttonElement.textContent = `${isAutomationActive ? 'Stop' : 'Start'} Automation`;
    buttonElement.className = `w-full py-2 px-4 rounded text-sm font-medium ${
      isAutomationActive
        ? 'bg-red-500 hover:bg-red-600 text-white'
        : 'bg-blue-500 hover:bg-blue-600 text-white'
    }`;
  }
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `fixed top-20 right-4 z-50 p-3 rounded-lg text-white text-sm max-w-xs ${getNotificationColor(type)}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

function getNotificationColor(type) {
  switch (type) {
    case 'success': return 'bg-green-500';
    case 'error': return 'bg-red-500';
    case 'warning': return 'bg-yellow-500';
    default: return 'bg-blue-500';
  }
}

// Handle page navigation
let lastUrl = window.location.href;
new MutationObserver(() => {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    console.log('Page navigated to:', currentUrl);

    // Stop automation if we navigate away from search results
    if (!currentUrl.includes('/search/people/') && isAutomationActive) {
      stopAutomation();
      showNotification('Automation stopped - left search page', 'info');
    }

    // Initialize search page if we navigate to search results
    if (currentUrl.includes('/search/people/')) {
      setTimeout(initializeSearchPage, 1000); // Wait for page to load
    }
  }
}).observe(document, { subtree: true, childList: true });