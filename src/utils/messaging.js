// Messaging utilities for Chrome Extension communication

/**
 * Send message to background script
 * @param {Object} message - Message to send
 * @returns {Promise} Promise that resolves with response
 */
export async function sendToBackground(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, response => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else if (response && response.success === false) {
        reject(new Error(response.error));
      } else {
        resolve(response);
      }
    });
  });
}

/**
 * Send message to content script
 * @param {number} tabId - Target tab ID
 * @param {Object} message - Message to send
 * @returns {Promise} Promise that resolves with response
 */
export async function sendToContentScript(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, response => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else if (response && response.success === false) {
        reject(new Error(response.error));
      } else {
        resolve(response);
      }
    });
  });
}

/**
 * Get active LinkedIn tab
 * @returns {Promise<Object|null>} Active LinkedIn tab or null
 */
export async function getActiveLinkedInTab() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];

    if (activeTab && activeTab.url.includes('linkedin.com')) {
      return activeTab;
    }

    // If active tab is not LinkedIn, try to find any LinkedIn tab
    const linkedInTabs = await chrome.tabs.query({ url: '*://*.linkedin.com/*' });
    return linkedInTabs.length > 0 ? linkedInTabs[0] : null;
  } catch (error) {
    console.error('Error getting LinkedIn tab:', error);
    return null;
  }
}

/**
 * Message types used throughout the extension
 */
export const MESSAGE_TYPES = {
  // Background script messages
  GET_SETTINGS: 'GET_SETTINGS',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  LOG_ANALYTICS: 'LOG_ANALYTICS',
  GET_ANALYTICS: 'GET_ANALYTICS',

  // Content script messages
  START_AUTOMATION: 'START_AUTOMATION',
  STOP_AUTOMATION: 'STOP_AUTOMATION',
  GET_PAGE_INFO: 'GET_PAGE_INFO',
  SEND_CONNECTION_REQUEST: 'SEND_CONNECTION_REQUEST',
  GET_SEARCH_RESULTS: 'GET_SEARCH_RESULTS',

  // Template messages
  GET_TEMPLATES: 'GET_TEMPLATES',
  SAVE_TEMPLATE: 'SAVE_TEMPLATE',
  DELETE_TEMPLATE: 'DELETE_TEMPLATE',

  // Search messages
  GET_SAVED_SEARCHES: 'GET_SAVED_SEARCHES',
  SAVE_SEARCH: 'SAVE_SEARCH',
  DELETE_SEARCH: 'DELETE_SEARCH',

  // Queue messages
  GET_CONNECTION_QUEUE: 'GET_CONNECTION_QUEUE',
  ADD_TO_QUEUE: 'ADD_TO_QUEUE',
  REMOVE_FROM_QUEUE: 'REMOVE_FROM_QUEUE',
  PROCESS_QUEUE: 'PROCESS_QUEUE'
};

/**
 * Create a standardized message object
 * @param {string} type - Message type
 * @param {Object} data - Message data
 * @param {string} id - Optional message ID
 * @returns {Object} Formatted message
 */
export function createMessage(type, data = null, id = null) {
  return {
    type,
    data,
    id: id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now()
  };
}

/**
 * Create a standardized response object
 * @param {boolean} success - Whether the operation was successful
 * @param {*} data - Response data
 * @param {string} error - Error message if unsuccessful
 * @param {string} messageId - Original message ID
 * @returns {Object} Formatted response
 */
export function createResponse(success, data = null, error = null, messageId = null) {
  return {
    success,
    data,
    error,
    messageId,
    timestamp: Date.now()
  };
}

/**
 * Setup message listener with error handling
 * @param {Function} handler - Message handler function
 * @returns {Function} Cleanup function
 */
export function setupMessageListener(handler) {
  const wrappedHandler = (message, sender, sendResponse) => {
    try {
      const result = handler(message, sender, sendResponse);

      // If handler returns a promise, handle it
      if (result instanceof Promise) {
        result
          .then(response => {
            sendResponse(response);
          })
          .catch(error => {
            console.error('Message handler error:', error);
            sendResponse(createResponse(false, null, error.message));
          });
        return true; // Indicates async response
      }

      return result;
    } catch (error) {
      console.error('Message handler error:', error);
      sendResponse(createResponse(false, null, error.message));
      return false;
    }
  };

  chrome.runtime.onMessage.addListener(wrappedHandler);

  // Return cleanup function
  return () => {
    chrome.runtime.onMessage.removeListener(wrappedHandler);
  };
}
