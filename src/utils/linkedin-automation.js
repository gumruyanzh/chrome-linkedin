// LinkedIn automation utilities for connection requests and messaging

/**
 * Find and click connect button on a LinkedIn profile
 * @param {string} customMessage - Optional custom message for connection request
 * @returns {Promise<Object>} Result of connection attempt
 */
export async function sendConnectionRequest(customMessage = null) {
  try {
    const connectButton = findConnectButton();

    if (!connectButton || !isConnectButtonClickable(connectButton)) {
      return {
        success: false,
        error: connectButton ? 'Cannot connect - already connected or pending' : 'Connect button not found',
        reason: connectButton ? 'ALREADY_CONNECTED' : 'NO_CONNECT_BUTTON'
      };
    }

    // Click the connect button
    connectButton.click();

    // Wait for potential message dialog
    await new Promise(resolve => setTimeout(resolve, 100));

    // Handle custom message if dialog appears
    if (customMessage) {
      const messageHandled = await handleConnectionMessage(customMessage);
      if (!messageHandled) {
        return {
          success: false,
          error: 'Failed to add custom message',
          reason: 'MESSAGE_FAILED'
        };
      }
    }

    // Confirm the connection request
    const confirmed = await confirmConnectionRequest();

    return {
      success: confirmed,
      timestamp: Date.now(),
      hasCustomMessage: !!customMessage,
      profileUrl: window.location.href
    };

  } catch (error) {
    console.error('Error sending connection request:', error);
    return {
      success: false,
      error: error.message,
      reason: 'EXCEPTION'
    };
  }
}

/**
 * Find connect button on the page using multiple selectors
 * @returns {Element|null} Connect button element
 */
export function findConnectButton() {
  const selectors = [
    '[aria-label*="Connect"]',
    'button[data-control-name="connect"]',
    '.pv-s-profile-actions button:has-text("Connect")',
    '.artdeco-button--primary:has-text("Connect")'
  ];

  for (const selector of selectors) {
    try {
      const button = document.querySelector(selector);
      if (button && button.textContent.includes('Connect')) {
        return button;
      }
    } catch (error) {
      continue;
    }
  }

  return null;
}

/**
 * Check if connect button is clickable (not pending or already connected)
 * @param {Element} connectButton - Connect button element
 * @returns {boolean} True if clickable
 */
export function isConnectButtonClickable(connectButton) {
  if (!connectButton) return false;

  try {
    const buttonText = connectButton.textContent?.trim().toLowerCase() || '';
    let ariaLabel = '';

    // Safely get aria-label
    if (typeof connectButton.getAttribute === 'function') {
      ariaLabel = connectButton.getAttribute('aria-label')?.toLowerCase() || '';
    }

    // Check for states that prevent connecting
    const blockedStates = [
      'pending',
      'invitation sent',
      'invitation pending',
      'message',
      'following',
      'unfollow'
    ];

    return !blockedStates.some(state =>
      buttonText.includes(state) || ariaLabel.includes(state)
    );
  } catch (error) {
    return false;
  }
}

/**
 * Handle adding custom message to connection request
 * @param {string} message - Custom message text
 * @returns {Promise<boolean>} True if message was added successfully
 */
export async function handleConnectionMessage(message) {
  try {
    // Wait for message dialog to appear
    await waitForElement('[aria-label*="Add a note"]', 3000);

    const addNoteButton = document.querySelector('[aria-label*="Add a note"]');
    if (addNoteButton) {
      addNoteButton.click();
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Find message textarea
    const messageTextarea = await waitForElement(
      'textarea[name="message"], textarea[aria-label*="message"]',
      2000
    );

    if (messageTextarea) {
      messageTextarea.value = message;
      messageTextarea.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error handling connection message:', error);
    return false;
  }
}

/**
 * Confirm connection request by clicking send button
 * @returns {Promise<boolean>} True if confirmed successfully
 */
export async function confirmConnectionRequest() {
  try {
    const sendSelectors = [
      '[aria-label*="Send invitation"]',
      'button[data-control-name="invite.send"]',
      '.artdeco-button--primary:has-text("Send")',
      'button:has-text("Send invitation")'
    ];

    for (const selector of sendSelectors) {
      try {
        const sendButton = await waitForElement(selector, 2000);
        if (sendButton && !sendButton.disabled) {
          sendButton.click();
          return true;
        }
      } catch (error) {
        continue;
      }
    }

    return false;
  } catch (error) {
    console.error('Error confirming connection request:', error);
    return false;
  }
}

/**
 * Wait for element to appear in DOM
 * @param {string} selector - CSS selector
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Element>} Element when found
 */
export function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
}

/**
 * Extract profile data from search result element
 * @param {Element} resultElement - Search result container element
 * @returns {Object|null} Profile data object
 */
export function extractProfileFromSearchResult(element) {
  try {
    const nameElement = element.querySelector('.entity-result__title-text a, .actor-name a');
    const titleElement = element.querySelector('.entity-result__primary-subtitle, .subline-level-1');
    const locationElement = element.querySelector('.entity-result__secondary-subtitle, .subline-level-2');
    const connectButton = element.querySelector('button[aria-label*="Connect"]');

    if (!nameElement) {
      return null;
    }

    // Safe check for connect button
    let canConnect = false;
    if (connectButton) {
      try {
        canConnect = isConnectButtonClickable(connectButton);
      } catch (error) {
        canConnect = false;
      }
    }

    return {
      name: nameElement.textContent?.trim() || null,
      title: titleElement?.textContent?.trim() || null,
      location: locationElement?.textContent?.trim() || null,
      profileUrl: nameElement.href || null,
      canConnect: canConnect,
      element: element,
      index: Array.from(element.parentElement?.children || []).indexOf(element)
    };
  } catch (error) {
    console.error('Error extracting profile from search result:', error);
    return null;
  }
}

/**
 * Detect if user has premium LinkedIn account
 * @returns {boolean} True if premium account detected
 */
export function hasPremiumAccount() {
  const premiumIndicators = [
    '.premium-icon',
    '[data-test-id="premium-icon"]',
    '.artdeco-icon[data-test-id="premium-icon"]'
  ];

  return premiumIndicators.some(selector =>
    document.querySelector(selector) !== null
  );
}

/**
 * Get current LinkedIn user's connection count
 * @returns {number|null} Number of connections or null if not found
 */
export function getConnectionCount() {
  try {
    const connectionElements = [
      '.pv-top-card--list-bullet li:contains("connection")',
      '.text-body-small:contains("connection")',
      '.pv-entity__summary-info .pv-entity__summary-info-v2:contains("connection")'
    ];

    for (const selector of connectionElements) {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent;
        const match = text.match(/(\d+(?:,\d+)*)\s*connection/i);
        if (match) {
          return parseInt(match[1].replace(/,/g, ''), 10);
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting connection count:', error);
    return null;
  }
}

/**
 * Check if current profile is a recruiter
 * @returns {boolean} True if recruiter indicators found
 */
export function isRecruiter() {
  const recruiterIndicators = [
    'recruiter',
    'talent acquisition',
    'hiring manager',
    'hr manager',
    'human resources'
  ];

  try {
    const titleElement = document.querySelector(
      '.text-body-medium.break-words, .pv-text-details__left-panel h2'
    );

    if (titleElement) {
      const title = titleElement.textContent.toLowerCase();
      return recruiterIndicators.some(indicator => title.includes(indicator));
    }

    return false;
  } catch (error) {
    console.error('Error checking recruiter status:', error);
    return false;
  }
}