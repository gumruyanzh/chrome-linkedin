// LinkedIn-specific utility functions

/**
 * Detect current LinkedIn page type
 * @returns {string} Page type identifier
 */
export function detectLinkedInPageType() {
  const url = window.location.href;
  const pathname = window.location.pathname;

  if (url.includes('/search/results/people')) {
    return 'people-search';
  } else if (url.includes('/search/results/')) {
    return 'search';
  } else if (pathname.startsWith('/in/')) {
    return 'profile';
  } else if (pathname.startsWith('/mynetwork/')) {
    return 'network';
  } else if (pathname.startsWith('/messaging/')) {
    return 'messaging';
  } else if (pathname === '/' || pathname === '/feed/') {
    return 'feed';
  } else {
    return 'unknown';
  }
}

/**
 * Check if current page is LinkedIn
 * @returns {boolean} True if on LinkedIn
 */
export function isLinkedInPage() {
  return window.location.hostname.includes('linkedin.com');
}

/**
 * Get current user profile information
 * @returns {Object} User profile data
 */
export function getCurrentUserProfile() {
  try {
    const profilePhoto =
      document.querySelector('.global-nav__me-photo') ||
      document.querySelector('.nav-item__profile-member-photo');

    const profileLink =
      document.querySelector('[data-control-name="identity_welcome_message"]') ||
      document.querySelector('.global-nav__me');

    return {
      isLoggedIn: !!profileLink,
      hasPhoto: !!profilePhoto,
      profileUrl: profileLink ? profileLink.href : null,
      name: extractUserName()
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return { isLoggedIn: false };
  }
}

/**
 * Extract current user's name from the page
 * @returns {string|null} User's name
 */
function extractUserName() {
  try {
    // Try various selectors to find the user's name
    const nameSelectors = [
      '.global-nav__me-text',
      '.nav-item__profile-member-photo img[alt]',
      '.t-16.t-black.t-bold'
    ];

    for (const selector of nameSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const name = element.textContent?.trim() || element.getAttribute('alt');
        if (name && name !== 'undefined') {
          return name;
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error extracting user name:', error);
    return null;
  }
}

/**
 * Get profile information from a LinkedIn profile page
 * @returns {Object} Profile data
 */
export function getProfilePageInfo() {
  try {
    const nameElement =
      document.querySelector('.text-heading-xlarge') || document.querySelector('h1.break-words');

    const titleElement =
      document.querySelector('.text-body-medium.break-words') ||
      document.querySelector('.pv-text-details__left-panel h2');

    const locationElement =
      document.querySelector('.text-body-small.inline.t-black--light.break-words') ||
      document.querySelector('.pv-text-details__left-panel .t-black--light');

    const connectButton =
      document.querySelector('[aria-label*="Connect"]') ||
      document.querySelector('button[data-control-name="connect"]');

    // Check for pending or already connected states
    const pendingButton = document.querySelector('[aria-label*="Invitation pending"]');
    const messageButton = document.querySelector('[aria-label*="Message"]');

    // Can connect only if connect button exists and it's not pending or already connected
    const canConnect =
      !!connectButton &&
      !pendingButton &&
      connectButton.textContent?.trim() !== 'Pending' &&
      !messageButton;

    return {
      name: nameElement?.textContent?.trim() || null,
      title: titleElement?.textContent?.trim() || null,
      location: locationElement?.textContent?.trim() || null,
      canConnect: canConnect,
      connectionLevel: getConnectionLevel(),
      profileUrl: window.location.href
    };
  } catch (error) {
    console.error('Error getting profile page info:', error);
    return null;
  }
}

/**
 * Get connection level for current profile
 * @returns {string} Connection level (1st, 2nd, 3rd, etc.)
 */
function getConnectionLevel() {
  try {
    const levelElement =
      document.querySelector('.dist-value') ||
      document.querySelector('[data-test-id="connection-degree"]');

    return levelElement?.textContent?.trim() || 'unknown';
  } catch (error) {
    console.error('Error getting connection level:', error);
    return 'unknown';
  }
}

/**
 * Get search results from people search page
 * @returns {Array} Array of profile data from search results
 */
export function getSearchResults() {
  try {
    const results = [];
    const resultElements = document.querySelectorAll('[data-control-name="search_srp_result"]');

    resultElements.forEach((element, index) => {
      const profileData = extractProfileFromSearchResult(element);
      if (profileData) {
        results.push({ ...profileData, index });
      }
    });

    return results;
  } catch (error) {
    console.error('Error getting search results:', error);
    return [];
  }
}

/**
 * Extract profile data from a search result element
 * @param {Element} element - Search result element
 * @returns {Object|null} Profile data
 */
function extractProfileFromSearchResult(element) {
  try {
    const nameElement = element.querySelector('.entity-result__title-text a');
    const titleElement = element.querySelector('.entity-result__primary-subtitle');
    const locationElement = element.querySelector('.entity-result__secondary-subtitle');
    const connectButton = element.querySelector('button[aria-label*="Connect"]');

    if (!nameElement) {
      return null;
    }

    return {
      name: nameElement.textContent?.trim() || null,
      title: titleElement?.textContent?.trim() || null,
      location: locationElement?.textContent?.trim() || null,
      profileUrl: nameElement.href,
      canConnect: !!connectButton,
      element: element
    };
  } catch (error) {
    console.error('Error extracting profile from search result:', error);
    return null;
  }
}

/**
 * Simulate human-like delays
 * @param {number} min - Minimum delay in milliseconds
 * @param {number} max - Maximum delay in milliseconds
 * @returns {Promise} Promise that resolves after the delay
 */
export function humanDelay(min = 1000, max = 3000) {
  const delay = Math.random() * (max - min) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Check if automation should be paused (e.g., user is actively using the page)
 * @returns {boolean} True if automation should be paused
 */
export function shouldPauseAutomation() {
  // Check if user has been active recently
  const lastActivity = Date.now() - (window.lastUserActivity || 0);
  return lastActivity < 30000; // Pause if user was active in last 30 seconds
}

/**
 * Track user activity to pause automation when user is active
 */
export function initActivityTracking() {
  const activities = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

  activities.forEach(activity => {
    document.addEventListener(
      activity,
      () => {
        window.lastUserActivity = Date.now();
      },
      true
    );
  });
}
