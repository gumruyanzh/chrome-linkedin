// Background service worker for LinkedIn Chrome Extension
// import browser from 'webextension-polyfill';

// Initialize extension
chrome.runtime.onInstalled.addListener(details => {
  if (details.reason === 'install') {
    console.log('LinkedIn Extension installed');
    initializeExtension();
  }
});

// Initialize default settings
async function initializeExtension() {
  try {
    const defaultSettings = {
      connectionRequestsPerDay: 20,
      delayBetweenRequests: 5000, // 5 seconds
      personalizedMessages: true,
      analyticsEnabled: true,
      safeModeEnabled: true
    };

    await chrome.storage.local.set({ settings: defaultSettings });
    console.log('Default settings initialized');
  } catch (error) {
    console.error('Error initializing extension:', error);
  }
}

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'GET_SETTINGS':
      handleGetSettings(sendResponse);
      break;
    case 'UPDATE_SETTINGS':
      handleUpdateSettings(message.data, sendResponse);
      break;
    case 'LOG_ANALYTICS':
      handleLogAnalytics(message.data, sendResponse);
      break;
    case 'GET_ANALYTICS':
      handleGetAnalytics(sendResponse);
      break;
    default:
      console.warn('Unknown message type:', message.type);
  }
  return true; // Indicates we will send a response asynchronously
});

// Settings management
async function handleGetSettings(sendResponse) {
  try {
    const result = await chrome.storage.local.get('settings');
    sendResponse({ success: true, data: result.settings });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function handleUpdateSettings(newSettings, sendResponse) {
  try {
    await chrome.storage.local.set({ settings: newSettings });
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Analytics logging
async function handleLogAnalytics(analyticsData, sendResponse) {
  try {
    const result = await chrome.storage.local.get('analytics');
    const analytics = result.analytics || [];

    analytics.push({
      ...analyticsData,
      timestamp: Date.now()
    });

    await chrome.storage.local.set({ analytics });
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function handleGetAnalytics(sendResponse) {
  try {
    const result = await chrome.storage.local.get('analytics');
    sendResponse({ success: true, data: result.analytics || [] });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}
