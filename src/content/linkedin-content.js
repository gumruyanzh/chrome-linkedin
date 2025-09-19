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
import { loadExtensionCSS, createFallbackCSS } from '../utils/css-loader.js';

let isAutomationActive = false;
let automationInterval = null;
let rateLimitTracker = null;

// Initialize content script
initialize();

async function initialize() {
  console.log('LinkedIn Automation Content Script Loaded');

  // Load CSS files first
  try {
    const cssResult = await loadExtensionCSS();
    if (!cssResult.success) {
      console.warn('Main CSS failed to load, using fallback:', cssResult.errors);
      createFallbackCSS();
    } else {
      console.log('Extension CSS loaded successfully:', cssResult.loaded);
    }
  } catch (error) {
    console.error('Error loading CSS:', error);
    createFallbackCSS();
  }

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

  // Validate page before starting automation
  const validationResult = await validatePageForAutomation();
  if (!validationResult.valid) {
    console.log('Page validation failed:', validationResult.errors);
    showNotification(`Cannot start automation: ${validationResult.errors.join(', ')}`, 'error');
    return;
  }

  isAutomationActive = true;

  await trackEvent(ANALYTICS_EVENTS.AUTOMATION_STARTED, {
    url: window.location.href,
    searchCriteria: extractSearchCriteria()
  });

  // Start automation loop
  automationLoop();
}

async function validatePageForAutomation() {
  const errors = [];

  try {
    // Check if we're on a valid LinkedIn search page
    if (!window.location.href.includes('/search/people/') && !window.location.href.includes('/search/results/people/')) {
      errors.push('Not on a LinkedIn people search page');
    }

    // Try to find search results
    const searchResults = await processSearchResults();
    if (searchResults.length === 0) {
      console.log('No search results found during validation - checking if page is still loading...');

      // Wait a bit for page to load and try again
      await new Promise(resolve => setTimeout(resolve, 2000));
      const retryResults = await processSearchResults();

      if (retryResults.length === 0) {
        errors.push('No search results found on page');
      } else {
        console.log(`Found ${retryResults.length} search results after retry`);
      }
    } else {
      console.log(`Validation found ${searchResults.length} search results`);
    }

  } catch (error) {
    console.error('Error during page validation:', error);
    errors.push('Page validation failed');
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
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

    // If no connectable profiles found, try to continue to next page instead of stopping
    if (profiles.length === 0) {
      console.log('No connectable profiles found on this page, attempting to navigate to next page');

      // Try to navigate to next page before stopping automation
      const navigated = await navigateToNextPage();
      if (navigated) {
        console.log('Navigated to next page, continuing automation');
        showNotification('No connectable profiles on this page - moving to next page', 'info');
        return true; // Continue automation on next page
      } else {
        console.log('No more pages available, stopping automation');
        stopAutomation();
        showNotification('No connectable profiles found and no more pages - automation stopped', 'info');
        return false; // Indicate no processing was done
      }
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
