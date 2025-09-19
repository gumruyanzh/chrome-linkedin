// LinkedIn Content Script for Automation
import { sendConnectionRequest } from '../utils/linkedin-automation.js';
import {
  processSearchResults,
  extractSearchCriteria,
  navigateToNextPage
} from '../utils/search-integration.js';
import {
  getSafetySettings,
  performSafetyCheck,
  createRateLimitTracker
} from '../utils/safety-compliance.js';
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
  if (window.location.href.includes('/search/people/') || window.location.href.includes('/search/results/people/')) {
    initializeSearchPage();
  }
}

async function handleMessage(request, sender, sendResponse) {
  try {
    console.log('Content script received message:', request.type, 'Current state:', isAutomationActive);

    switch (request.type) {
      case 'START_AUTOMATION':
        await startAutomation();
        sendResponse({ success: true, isActive: isAutomationActive });
        break;

      case 'STOP_AUTOMATION':
        stopAutomation();
        sendResponse({ success: true, isActive: isAutomationActive });
        break;

      case 'RESET_AUTOMATION':
        // Force reset automation state
        console.log('Forcing automation reset...');
        isAutomationActive = false;
        if (automationInterval) {
          clearInterval(automationInterval);
          automationInterval = null;
        }
        sendResponse({ success: true, isActive: isAutomationActive });
        break;

      case 'PROCESS_SEARCH_RESULTS':
        const results = await processSearchResults();
        sendResponse({ success: true, data: results });
        break;

      case 'SEND_CONNECTION_REQUEST':
        const result = await sendConnectionRequest(request.message);
        sendResponse({ success: true, data: result });
        break;

      case 'GET_AUTOMATION_STATE':
        console.log('Popup requested automation state:', isAutomationActive);
        sendResponse({ success: true, isActive: isAutomationActive });
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
    console.log('Automation already active - stopping current automation first');
    stopAutomation();
    // Small delay to ensure cleanup is complete
    await new Promise(resolve => setTimeout(resolve, 100));
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

  // Clear any running intervals or timeouts
  if (automationInterval) {
    clearTimeout(automationInterval); // Use clearTimeout since we're using setTimeout, not setInterval
    automationInterval = null;
    console.log('Cleared automation interval/timeout');
  }

  // Update the on-page controls if they exist
  updateControlsDisplay();

  trackEvent(ANALYTICS_EVENTS.AUTOMATION_STOPPED, {
    url: window.location.href
  });
}

async function automationLoop() {
  if (!isAutomationActive) {
    return;
  }

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
    if (window.location.href.includes('/search/people/') || window.location.href.includes('/search/results/people/')) {
      const processedSuccessfully = await processSearchPage();

      // Only continue automation loop if we actually processed profiles
      if (!processedSuccessfully || !isAutomationActive) {
        console.log('No profiles to process or automation stopped, ending loop');
        return;
      }
    } else {
      console.log('Not on a search results page, stopping automation');
      stopAutomation();
      return;
    }

    // Schedule next iteration with human-like delay only if automation is still active
    if (isAutomationActive) {
      const delay = await rateLimitTracker.generateHumanDelay();
      automationInterval = setTimeout(automationLoop, delay);
    }
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

    // If no connectable profiles found, stop automation to prevent infinite loop
    if (profiles.length === 0) {
      console.log('No connectable profiles found on this page, stopping automation');
      stopAutomation();
      showNotification('No connectable profiles found - automation stopped', 'info');
      return false; // Indicate no processing was done
    }

    let connectionsAttempted = 0;

    for (const profile of profiles) {
      if (!isAutomationActive) {
        break;
      }

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
      connectionsAttempted++;

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

    // Try to navigate to next page only if we attempted connections
    if (isAutomationActive && connectionsAttempted > 0) {
      const navigated = await navigateToNextPage();
      if (!navigated) {
        console.log('No more pages available, stopping automation');
        stopAutomation();
        showNotification('Automation completed - no more results', 'info');
      }
      return true; // Indicate processing was done
    }

    return connectionsAttempted > 0;
  } catch (error) {
    console.error('Error processing search page:', error);
    stopAutomation();
    return false;
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

  // Inject vintage CSS if not already present
  if (!document.getElementById('vintage-automation-styles')) {
    const vintageStyles = document.createElement('style');
    vintageStyles.id = 'vintage-automation-styles';
    vintageStyles.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&display=swap');

      .vintage-automation-controls {
        font-family: 'Crimson Text', Georgia, 'Times New Roman', Times, serif;
        background-color: #F4F1DE;
        border: 2px solid #3D405B;
        border-opacity: 0.3;
        border-radius: 8px;
        box-shadow: 0 10px 25px -5px rgba(47, 47, 47, 0.1), 0 8px 10px -6px rgba(47, 47, 47, 0.1);
        backdrop-filter: blur(8px);
      }

      .vintage-automation-header {
        border-bottom: 1px solid #3D405B;
        border-opacity: 0.2;
        padding-bottom: 8px;
        margin-bottom: 12px;
      }

      .vintage-headline-sm {
        font-size: 16px;
        font-weight: 700;
        color: #2F2F2F;
        margin: 0;
      }

      .vintage-close-btn {
        color: #3D405B;
        font-size: 18px;
        line-height: 1;
        background: none;
        border: none;
        cursor: pointer;
        transition: color 0.2s;
      }

      .vintage-close-btn:hover {
        color: #2F2F2F;
      }

      .vintage-status-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .vintage-caption-sm {
        font-size: 12px;
        color: #3D405B;
        font-style: italic;
      }

      .vintage-status-active {
        font-size: 12px;
        font-weight: 600;
        color: #81B29A;
      }

      .vintage-status-inactive {
        font-size: 12px;
        font-weight: 600;
        color: #E07A5F;
      }

      .vintage-button-primary {
        width: 100%;
        padding: 8px 16px;
        border: 2px solid #E07A5F;
        border-radius: 6px;
        background-color: #E07A5F;
        color: #F4F1DE;
        font-family: 'Crimson Text', serif;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }

      .vintage-button-primary:hover {
        background-color: #D66A4A;
        border-color: #D66A4A;
        transform: translateY(-1px);
      }

      .vintage-button-stop {
        background-color: #81B29A;
        border-color: #81B29A;
      }

      .vintage-button-stop:hover {
        background-color: #6B9582;
        border-color: #6B9582;
      }
    `;
    document.head.appendChild(vintageStyles);
  }

  const controls = document.createElement('div');
  controls.id = 'linkedin-automation-controls';
  controls.className = 'vintage-automation-controls fixed top-4 right-4 z-50 p-4 max-w-sm';

  controls.innerHTML = `
    <div class="vintage-automation-header flex items-center justify-between">
      <h3 class="vintage-headline-sm">Editorial Automation</h3>
      <button id="close-controls" class="vintage-close-btn">×</button>
    </div>

    <div class="space-y-2">
      <div class="vintage-status-row">
        <span class="vintage-caption-sm">Press Status:</span>
        <span id="automation-status" class="${isAutomationActive ? 'vintage-status-active' : 'vintage-status-inactive'}">
          ${isAutomationActive ? 'Publishing' : 'On Hold'}
        </span>
      </div>

      <div class="vintage-status-row">
        <span class="vintage-caption-sm">Profiles found:</span>
        <span id="profiles-count" class="vintage-caption-sm font-weight-600">-</span>
      </div>

      <button id="toggle-automation" class="vintage-button-primary ${isAutomationActive ? 'vintage-button-stop' : ''}">
        ${isAutomationActive ? 'Stop Press' : 'Start Publishing'}
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
    statusElement.textContent = isAutomationActive ? 'Publishing' : 'On Hold';
    statusElement.className = isAutomationActive ? 'vintage-status-active' : 'vintage-status-inactive';
  }

  if (buttonElement) {
    buttonElement.textContent = isAutomationActive ? 'Stop Press' : 'Start Publishing';
    buttonElement.className = `vintage-button-primary ${isAutomationActive ? 'vintage-button-stop' : ''}`;
  }
}

function showNotification(message, type = 'info') {
  // Inject vintage notification styles if not already present
  if (!document.getElementById('vintage-notification-styles')) {
    const notificationStyles = document.createElement('style');
    notificationStyles.id = 'vintage-notification-styles';
    notificationStyles.textContent = `
      .vintage-notification {
        font-family: 'Crimson Text', Georgia, 'Times New Roman', Times, serif;
        background-color: #F4F1DE;
        border: 2px solid #3D405B;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(47, 47, 47, 0.15);
        animation: vintageSlideIn 0.3s ease-out;
        backdrop-filter: blur(4px);
      }

      .vintage-notification-header {
        display: flex;
        align-items: center;
        margin-bottom: 4px;
      }

      .vintage-notification-icon {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        margin-right: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: bold;
        color: #F4F1DE;
      }

      .vintage-notification-title {
        font-size: 13px;
        font-weight: 600;
        color: #2F2F2F;
      }

      .vintage-notification-message {
        font-size: 11px;
        color: #3D405B;
        font-style: italic;
        line-height: 1.3;
      }

      .vintage-notification-success .vintage-notification-icon {
        background-color: #81B29A;
      }

      .vintage-notification-error .vintage-notification-icon {
        background-color: #E07A5F;
      }

      .vintage-notification-warning .vintage-notification-icon {
        background-color: #E07A5F;
        opacity: 0.8;
      }

      .vintage-notification-info .vintage-notification-icon {
        background-color: #3D405B;
      }

      @keyframes vintageSlideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes vintageSlideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(notificationStyles);
  }

  const notification = document.createElement('div');
  notification.className = `vintage-notification vintage-notification-${type} fixed top-20 right-4 z-50 p-3 max-w-xs`;

  const notificationConfig = getNotificationConfig(type);

  notification.innerHTML = `
    <div class="vintage-notification-header">
      <div class="vintage-notification-icon">${notificationConfig.icon}</div>
      <div class="vintage-notification-title">${notificationConfig.title}</div>
    </div>
    <div class="vintage-notification-message">${message}</div>
  `;

  document.body.appendChild(notification);

  // Auto-remove after 4 seconds
  setTimeout(() => {
    notification.style.animation = 'vintageSlideOut 0.3s ease-in';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 300);
  }, 4000);
}

function getNotificationConfig(type) {
  switch (type) {
    case 'success':
      return { icon: '✓', title: 'Editorial Success' };
    case 'error':
      return { icon: '✗', title: 'Editorial Error' };
    case 'warning':
      return { icon: '⚠', title: 'Editorial Notice' };
    default:
      return { icon: 'i', title: 'Editorial Update' };
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
    if (!currentUrl.includes('/search/people/') && !currentUrl.includes('/search/results/people/') && isAutomationActive) {
      stopAutomation();
      showNotification('Automation stopped - left search page', 'info');
    }

    // Initialize search page if we navigate to search results
    if (currentUrl.includes('/search/people/') || currentUrl.includes('/search/results/people/')) {
      setTimeout(initializeSearchPage, 1000); // Wait for page to load
    }
  }
}).observe(document, { subtree: true, childList: true });
