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
        error: connectButton
          ? 'Cannot connect - already connected or pending'
          : 'Connect button not found',
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
    // Current LinkedIn connect button selectors (2024)
    'button[aria-label*="Invite"][aria-label*="connect"]',
    'button[aria-label*="Connect"]',
    'button[data-control-name="connect"]',
    'button[data-control-name="invite"]',
    '.artdeco-button--2[aria-label*="connect"]',
    '.search-result__actions button[aria-label*="connect"]',
    '.entity-result__actions button[aria-label*="connect"]',
    '[data-test-person-result-page-connect-button]',
    // Legacy selectors for older LinkedIn versions
    '.pv-s-profile-actions button',
    '.artdeco-button--primary',
    '.pv-s-profile-actions .artdeco-button',
    'button[data-control-name="people_connect"]'
  ];

  for (const selector of selectors) {
    try {
      const buttons = document.querySelectorAll(selector);
      for (const button of buttons) {
        const buttonText = button.textContent?.toLowerCase() || '';
        const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';

        if (
          buttonText.includes('connect') &&
          !buttonText.includes('connected') &&
          !buttonText.includes('pending')
        ) {
          return button;
        }
        if (
          ariaLabel.includes('connect') &&
          !ariaLabel.includes('connected') &&
          !ariaLabel.includes('pending')
        ) {
          return button;
        }
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
  if (!connectButton) {
    console.log('  isConnectButtonClickable: Button is null/undefined');
    return false;
  }

  try {
    const buttonText = connectButton.textContent?.trim().toLowerCase() || '';
    let ariaLabel = '';

    // Safely get aria-label
    if (typeof connectButton.getAttribute === 'function') {
      ariaLabel = connectButton.getAttribute('aria-label')?.toLowerCase() || '';
    }

    console.log('  isConnectButtonClickable: Checking button -', { buttonText, ariaLabel });

    // Check if button is disabled
    if (connectButton.disabled) {
      console.log('  isConnectButtonClickable: Button is disabled');
      return false;
    }

    // Check for states that prevent connecting
    const blockedStates = [
      'pending',
      'invitation sent',
      'invitation pending',
      'connected',
      'following',
      'unfollow'
    ];

    // Be more permissive - if the button contains "connect" text, allow it
    const hasConnectText = buttonText.includes('connect') || ariaLabel.includes('connect');
    const hasInviteText = buttonText.includes('invite') || ariaLabel.includes('invite');

    if (hasConnectText || hasInviteText) {
      // Check if any blocked states are present
      const isBlocked = blockedStates.some(state =>
        buttonText.includes(state) || ariaLabel.includes(state)
      );

      console.log('  isConnectButtonClickable: Has connect/invite text =', hasConnectText || hasInviteText);
      console.log('  isConnectButtonClickable: Is blocked =', isBlocked);

      return !isBlocked;
    }

    // Also allow buttons that just say "Connect" even without aria-label
    if (buttonText === 'connect' || buttonText === 'invite') {
      console.log('  isConnectButtonClickable: Simple connect/invite button found');
      return true;
    }

    console.log('  isConnectButtonClickable: No connect/invite text found');
    return false;
  } catch (error) {
    console.log('  isConnectButtonClickable: Error checking button:', error);
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
    // Updated selectors for add note functionality
    const addNoteSelectors = [
      '[aria-label*="Add a note"]',
      'button[aria-label*="note"]',
      '.send-invite__custom-message button',
      '.artdeco-modal [aria-label*="note"]'
    ];

    // Wait for message dialog to appear and try to find add note button
    let addNoteButton = null;
    for (const selector of addNoteSelectors) {
      try {
        addNoteButton = await waitForElement(selector, 3000);
        if (addNoteButton) {
          console.log(`Found add note button with selector: ${selector}`);
          break;
        }
      } catch (error) {
        continue;
      }
    }

    if (addNoteButton) {
      addNoteButton.click();
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Find message textarea with updated selectors
    const messageTextareaSelectors = [
      'textarea[name="message"]',
      'textarea[aria-label*="message"]',
      '#custom-message',
      '.send-invite__custom-message textarea',
      '.artdeco-modal textarea'
    ];

    let messageTextarea = null;
    for (const selector of messageTextareaSelectors) {
      try {
        messageTextarea = await waitForElement(selector, 2000);
        if (messageTextarea) {
          console.log(`Found message textarea with selector: ${selector}`);
          break;
        }
      } catch (error) {
        continue;
      }
    }

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
      // Current LinkedIn send invitation selectors (2024)
      '[aria-label*="Send invitation"]',
      '[aria-label*="Send now"]',
      'button[data-control-name="invite.send"]',
      'button[data-control-name="send_invite"]',
      '[data-test*="send-invite"]',
      'button[type="submit"]',
      '.send-invite__actions button[aria-label*="Send"]',
      '.artdeco-modal__actionbar button[aria-label*="Send"]',
      // Modal-specific selectors
      '.artdeco-modal .artdeco-button--primary',
      '.artdeco-button--primary'
    ];

    for (const selector of sendSelectors) {
      try {
        const sendButton = await waitForElement(selector, 2000);
        if (sendButton && !sendButton.disabled) {
          // Verify it's actually a send button by checking text content
          const buttonText = sendButton.textContent?.toLowerCase() || '';
          const isValidSendButton =
            buttonText.includes('send') ||
            buttonText.includes('invitation') ||
            sendButton.getAttribute('aria-label')?.toLowerCase().includes('send');

          if (isValidSendButton) {
            sendButton.click();
            return true;
          }
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
    // Updated selectors for current LinkedIn structure (2025)
    const nameSelectors = [
      // Primary selectors for current LinkedIn structure
      '.entity-result__title-text a span[aria-hidden="true"]',
      '.entity-result__title-text .app-aware-link span[aria-hidden="true"]',
      '.entity-result__title-text a',
      '.app-aware-link .entity-result__title-text',

      // Alternative selectors for different layouts
      '.search-result__info .actor-name a',
      '.artdeco-entity-lockup__title a',
      '.reusable-search__result-container .entity-result__title-text a',
      '[data-control-name="search_srp_result"] a[href*="/in/"]',

      // Broader fallback selectors
      'a[href*="/in/"] span[aria-hidden="true"]',
      '.actor-name a',
      'a[data-control-name*="people"]',
      '.search-results-container a[href*="/in/"]'
    ];

    const titleSelectors = [
      '.entity-result__primary-subtitle',
      '.entity-result__subtitle',
      '.search-result__info .subline-level-1',
      '.artdeco-entity-lockup__subtitle',
      '.subline-level-1'
    ];

    const locationSelectors = [
      '.entity-result__secondary-subtitle',
      '.search-result__info .subline-level-2',
      '.artdeco-entity-lockup__metadata',
      '.subline-level-2'
    ];

    const connectButtonSelectors = [
      // Primary Connect button patterns for 2025 LinkedIn structure
      'button[aria-label*="Invite"][aria-label*="connect"]',
      'button[aria-label*="Connect"]',
      'button[data-control-name="connect"]',
      'button[data-control-name="invite"]',

      // Updated selectors for current LinkedIn UI (2025)
      '.artdeco-button--secondary[aria-label*="connect"]',
      '.artdeco-button[aria-label*="Connect"]',
      'button[aria-label*="Invite"]',

      // More specific search result button selectors
      '.entity-result__actions button[aria-label*="connect"]',
      '.entity-result__actions button[aria-label*="Connect"]',
      '.entity-result__actions button[aria-label*="Invite"]',

      // Additional patterns for 2025 structure
      '.entity-result__item-actions button',
      '.search-result__actions-container button',
      '.entity-result button[data-control-name*="connect"]',

      // Fallback patterns - any button in the actions area
      '.search-result__actions button',
      '.entity-result__actions button',

      // Even broader fallbacks with case insensitivity
      'button[aria-label*="connect" i]',
      'button[aria-label*="Connect" i]',
      'button[aria-label*="invite" i]',

      // Text-based fallbacks
      'button:contains("Connect")',
      'button:contains("Invite")'
    ];

    const nameElement = findFirstElement(element, nameSelectors);
    const titleElement = findFirstElement(element, titleSelectors);
    const locationElement = findFirstElement(element, locationSelectors);
    const connectButton = findFirstElement(element, connectButtonSelectors);

    if (!nameElement) {
      console.log('No name element found in search result. Debugging info:');
      console.log('- Element HTML snippet:', element.outerHTML.substring(0, 200) + '...');
      console.log('- Element classes:', element.className);
      console.log('- All links in element:', Array.from(element.querySelectorAll('a')).map(a => ({
        href: a.href,
        text: a.textContent?.trim(),
        className: a.className
      })));
      return null;
    }

    const profileName = nameElement.textContent?.trim() || 'Unknown';

    // Debug: Check what buttons exist in this search result
    const allButtons = element.querySelectorAll('button');
    console.log(`Profile "${profileName}": Found ${allButtons.length} buttons in search result`);
    allButtons.forEach((btn, index) => {
      const btnText = btn.textContent?.trim() || '';
      const ariaLabel = btn.getAttribute('aria-label') || '';
      console.log(`  Button ${index + 1}: "${btnText}" (aria-label: "${ariaLabel}")`);
    });

    // Safe check for connect button
    let canConnect = false;
    if (connectButton) {
      console.log(`Profile "${profileName}": Found connect button -`, {
        text: connectButton.textContent?.trim(),
        ariaLabel: connectButton.getAttribute('aria-label'),
        className: connectButton.className
      });

      try {
        canConnect = isConnectButtonClickable(connectButton);
        console.log(`Profile "${profileName}": Can connect = ${canConnect}`);
      } catch (error) {
        console.log(`Profile "${profileName}": Error checking button clickability:`, error);
        canConnect = false;
      }
    } else {
      console.log(`Profile "${profileName}": No connect button found`);
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
 * Helper function to find first matching element from multiple selectors
 * @param {Element} parent - Parent element to search within
 * @param {Array} selectors - Array of CSS selectors to try
 * @returns {Element|null} First matching element
 */
function findFirstElement(parent, selectors) {
  for (const selector of selectors) {
    try {
      const element = parent.querySelector(selector);
      if (element) {
        return element;
      }
    } catch (error) {
      // Selector might have invalid syntax, skip it
      console.log(`Invalid selector skipped: ${selector}`, error.message);
      continue;
    }
  }
  return null;
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

  return premiumIndicators.some(selector => document.querySelector(selector) !== null);
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
