// Comprehensive LinkedIn Utility Tests
import {
  detectLinkedInPageType,
  isLinkedInPage,
  getCurrentUserProfile,
  getProfilePageInfo,
  getSearchResults,
  humanDelay,
  shouldPauseAutomation,
  initActivityTracking
} from '../utils/linkedin.js';

describe('LinkedIn Utility Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    global.window = {
      location: {
        href: 'https://www.linkedin.com/in/johndoe/',
        hostname: 'www.linkedin.com',
        pathname: '/in/johndoe/'
      },
      lastUserActivity: 0
    };

    global.document = {
      querySelector: jest.fn(),
      querySelectorAll: jest.fn(() => []),
      addEventListener: jest.fn()
    };
  });

  describe('isLinkedInPage', () => {
    test('should return true for linkedin.com URLs', () => {
      window.location.hostname = 'www.linkedin.com';
      expect(isLinkedInPage()).toBe(true);
    });

    test('should return true for linkedin.com without www', () => {
      window.location.hostname = 'linkedin.com';
      expect(isLinkedInPage()).toBe(true);
    });

    test('should return false for non-LinkedIn URLs', () => {
      window.location.hostname = 'www.google.com';
      expect(isLinkedInPage()).toBe(false);
    });
  });

  describe('detectLinkedInPageType', () => {
    test('should detect profile page', () => {
      window.location.href = 'https://www.linkedin.com/in/johndoe/';
      window.location.pathname = '/in/johndoe/';

      const pageType = detectLinkedInPageType();

      expect(pageType).toBe('profile');
    });

    test('should detect people search results page', () => {
      window.location.href = 'https://www.linkedin.com/search/results/people/?keywords=engineer';
      window.location.pathname = '/search/results/people/';

      const pageType = detectLinkedInPageType();

      expect(pageType).toBe('people-search');
    });

    test('should detect feed page', () => {
      window.location.href = 'https://www.linkedin.com/feed/';
      window.location.pathname = '/feed/';

      const pageType = detectLinkedInPageType();

      expect(pageType).toBe('feed');
    });

    test('should detect messaging page', () => {
      window.location.href = 'https://www.linkedin.com/messaging/';
      window.location.pathname = '/messaging/';

      const pageType = detectLinkedInPageType();

      expect(pageType).toBe('messaging');
    });

    test('should detect my network page', () => {
      window.location.href = 'https://www.linkedin.com/mynetwork/';
      window.location.pathname = '/mynetwork/';

      const pageType = detectLinkedInPageType();

      expect(pageType).toBe('network');
    });

    test('should return unknown for unrecognized pages', () => {
      window.location.href = 'https://www.linkedin.com/something-unknown/';
      window.location.pathname = '/something-unknown/';

      const pageType = detectLinkedInPageType();

      expect(pageType).toBe('unknown');
    });
  });

  describe('getCurrentUserProfile', () => {
    test('should return profile data when logged in', () => {
      document.querySelector.mockImplementation((selector) => {
        if (selector.includes('me-photo') || selector.includes('profile-member-photo')) {
          return { src: 'photo.jpg' };
        }
        if (selector.includes('identity_welcome_message') || selector.includes('global-nav__me')) {
          return { href: 'https://linkedin.com/in/me' };
        }
        return null;
      });

      const profile = getCurrentUserProfile();

      expect(profile.isLoggedIn).toBe(true);
    });

    test('should return isLoggedIn false when not logged in', () => {
      document.querySelector.mockReturnValue(null);

      const profile = getCurrentUserProfile();

      expect(profile.isLoggedIn).toBe(false);
    });
  });

  describe('getProfilePageInfo', () => {
    test('should extract profile information from page', () => {
      document.querySelector.mockImplementation((selector) => {
        if (selector.includes('heading-xlarge') || selector.includes('break-words')) {
          return { textContent: 'John Doe' };
        }
        if (selector.includes('body-medium')) {
          return { textContent: 'Software Engineer' };
        }
        if (selector.includes('body-small')) {
          return { textContent: 'San Francisco, CA' };
        }
        if (selector.includes('Connect')) {
          return { textContent: 'Connect' };
        }
        return null;
      });

      const profile = getProfilePageInfo();

      expect(profile).toBeDefined();
      expect(profile.name).toBe('John Doe');
    });

    test('should handle errors gracefully', () => {
      document.querySelector.mockImplementation(() => {
        throw new Error('DOM error');
      });

      const profile = getProfilePageInfo();

      expect(profile).toBeNull();
    });
  });

  describe('getSearchResults', () => {
    test('should return empty array when no results', () => {
      document.querySelectorAll.mockReturnValue([]);

      const results = getSearchResults();

      expect(results).toEqual([]);
    });

    test('should handle errors gracefully', () => {
      document.querySelectorAll.mockImplementation(() => {
        throw new Error('DOM error');
      });

      const results = getSearchResults();

      expect(results).toEqual([]);
    });
  });

  describe('humanDelay', () => {
    test('should return a promise', () => {
      const result = humanDelay(100, 200);
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe('shouldPauseAutomation', () => {
    test('should return true when user was recently active', () => {
      window.lastUserActivity = Date.now();

      expect(shouldPauseAutomation()).toBe(true);
    });

    test('should return false when user was not recently active', () => {
      window.lastUserActivity = Date.now() - 60000;

      expect(shouldPauseAutomation()).toBe(false);
    });
  });

  describe('initActivityTracking', () => {
    test('should add event listeners for user activity', () => {
      initActivityTracking();

      expect(document.addEventListener).toHaveBeenCalled();
    });
  });
});
