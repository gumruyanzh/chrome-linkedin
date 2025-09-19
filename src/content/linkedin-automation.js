// Content script for LinkedIn automation
const automationState = {
  isActive: false,
  currentTask: null,
  settings: null
};

// Initialize content script
initializeContentScript();

async function initializeContentScript() {
  console.log('LinkedIn automation content script loaded');

  // Get current settings
  try {
    automationState.settings = await getSettings();
  } catch (error) {
    console.error('Error loading settings:', error);
  }

  // Listen for messages from popup and background
  chrome.runtime.onMessage.addListener(handleMessage);
}

function handleMessage(message, sender, sendResponse) {
  switch (message.type) {
    case 'START_AUTOMATION':
      startAutomation();
      sendResponse({ success: true, isActive: true });
      break;
    case 'STOP_AUTOMATION':
      stopAutomation();
      sendResponse({ success: true, isActive: false });
      break;
    case 'GET_AUTOMATION_STATE':
      sendResponse({ success: true, isActive: automationState.isActive });
      break;
    case 'GET_PAGE_INFO':
      const pageInfo = getLinkedInPageInfo();
      sendResponse({ success: true, data: pageInfo });
      break;
    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }
  return true;
}

function startAutomation() {
  if (automationState.isActive) {
    console.log('Automation already active');
    return;
  }

  console.log('Starting LinkedIn automation...');
  automationState.isActive = true;

  // Add visual indicator
  addAutomationIndicator();

  // Start automation based on current page
  const pageType = detectLinkedInPageType();
  console.log('Detected page type:', pageType);

  switch (pageType) {
    case 'search':
      handleSearchPage();
      break;
    case 'profile':
      handleProfilePage();
      break;
    case 'people-search':
      handlePeopleSearchPage();
      break;
    default:
      console.log('Page type not supported for automation');
      showNotification('Navigate to LinkedIn search or profile page to start automation');
  }
}

function stopAutomation() {
  console.log('Stopping LinkedIn automation...');
  automationState.isActive = false;

  // Remove visual indicator
  removeAutomationIndicator();

  // Clear any ongoing tasks
  if (automationState.currentTask) {
    clearTimeout(automationState.currentTask);
    automationState.currentTask = null;
  }

  showNotification('Automation stopped');
}

function detectLinkedInPageType() {
  const url = window.location.href;

  if (url.includes('/search/results/people')) {
    return 'people-search';
  } else if (url.includes('/search/')) {
    return 'search';
  } else if (url.includes('/in/')) {
    return 'profile';
  } else if (url.includes('/mynetwork/')) {
    return 'network';
  } else {
    return 'unknown';
  }
}

function handleSearchPage() {
  console.log('Handling search page automation');
  // Implementation for search page automation will be added in next tasks
  showNotification('Search page automation starting...');
}

function handleProfilePage() {
  console.log('Handling profile page automation');
  // Implementation for profile page automation will be added in next tasks
  showNotification('Profile page automation starting...');
}

function handlePeopleSearchPage() {
  console.log('Handling people search page automation');
  // Implementation for people search automation will be added in next tasks
  showNotification('People search automation starting...');
}

function getLinkedInPageInfo() {
  return {
    url: window.location.href,
    title: document.title,
    pageType: detectLinkedInPageType(),
    profileCount: document.querySelectorAll('[data-control-name="search_srp_result"]').length,
    currentUser: getCurrentUserInfo()
  };
}

function getCurrentUserInfo() {
  try {
    // Extract current user info from LinkedIn page
    const userElement =
      document.querySelector('.global-nav__me-photo') ||
      document.querySelector('.nav-item__profile-member-photo');

    return {
      hasPhoto: !!userElement,
      isLoggedIn: !!document.querySelector('.global-nav__me')
    };
  } catch (error) {
    console.error('Error getting user info:', error);
    return { isLoggedIn: false };
  }
}

function addAutomationIndicator() {
  // Remove existing indicator if present
  removeAutomationIndicator();

  const indicator = document.createElement('div');
  indicator.id = 'linkedin-automation-indicator';
  indicator.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #0073b1;
    color: white;
    padding: 8px 16px;
    border-radius: 4px;
    z-index: 10000;
    font-size: 14px;
    font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  `;
  indicator.textContent = '🤖 Automation Active';

  document.body.appendChild(indicator);
}

function removeAutomationIndicator() {
  const indicator = document.getElementById('linkedin-automation-indicator');
  if (indicator) {
    indicator.remove();
  }
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 70px;
    right: 20px;
    background: ${type === 'error' ? '#dc3545' : '#28a745'};
    color: white;
    padding: 12px 16px;
    border-radius: 4px;
    z-index: 10001;
    font-size: 14px;
    font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    max-width: 300px;
  `;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
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

async function logAnalytics(data) {
  chrome.runtime.sendMessage({
    type: 'LOG_ANALYTICS',
    data: data
  });
}
