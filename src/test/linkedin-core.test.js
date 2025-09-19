// Core LinkedIn Integration Tests - Task 2.1
// Focus on essential LinkedIn automation functionality

describe('LinkedIn Core Integration - Task 2.1', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('LinkedIn Utilities Import', () => {
    test('should import LinkedIn utility functions', async () => {
      const {
        detectLinkedInPageType,
        isLinkedInPage,
        getCurrentUserProfile,
        getProfilePageInfo,
        getSearchResults,
        humanDelay,
        initActivityTracking
      } = await import('../utils/linkedin.js');

      expect(typeof detectLinkedInPageType).toBe('function');
      expect(typeof isLinkedInPage).toBe('function');
      expect(typeof getCurrentUserProfile).toBe('function');
      expect(typeof getProfilePageInfo).toBe('function');
      expect(typeof getSearchResults).toBe('function');
      expect(typeof humanDelay).toBe('function');
      expect(typeof initActivityTracking).toBe('function');
    });

    test('should import LinkedIn automation functions', async () => {
      const {
        sendConnectionRequest,
        findConnectButton,
        isConnectButtonClickable,
        extractProfileFromSearchResult,
        hasPremiumAccount,
        getConnectionCount,
        isRecruiter
      } = await import('../utils/linkedin-automation.js');

      expect(typeof sendConnectionRequest).toBe('function');
      expect(typeof findConnectButton).toBe('function');
      expect(typeof isConnectButtonClickable).toBe('function');
      expect(typeof extractProfileFromSearchResult).toBe('function');
      expect(typeof hasPremiumAccount).toBe('function');
      expect(typeof getConnectionCount).toBe('function');
      expect(typeof isRecruiter).toBe('function');
    });
  });

  describe('Page Type Detection', () => {
    test('should detect page types based on URL patterns', async () => {
      // Mock window.location for each test case
      const originalLocation = global.window?.location;

      const testCases = [
        {
          url: 'https://www.linkedin.com/search/results/people/?keywords=developer',
          expected: 'people-search'
        },
        {
          url: 'https://www.linkedin.com/in/johndoe/',
          expected: 'profile'
        },
        {
          url: 'https://www.linkedin.com/mynetwork/',
          expected: 'network'
        },
        {
          url: 'https://www.linkedin.com/messaging/',
          expected: 'messaging'
        },
        {
          url: 'https://www.linkedin.com/feed/',
          expected: 'feed'
        }
      ];

      const { detectLinkedInPageType } = await import('../utils/linkedin.js');

      for (const testCase of testCases) {
        const urlObj = new URL(testCase.url);
        global.window = {
          location: {
            href: testCase.url,
            hostname: urlObj.hostname,
            pathname: urlObj.pathname
          }
        };

        const result = detectLinkedInPageType();
        expect(result).toBe(testCase.expected);
      }

      // Restore original location
      if (originalLocation) {
        global.window.location = originalLocation;
      }
    });
  });

  describe('DOM Element Detection', () => {
    test('should handle missing DOM elements gracefully', () => {
      // Setup basic document mock
      global.document = {
        querySelector: jest.fn(() => null),
        querySelectorAll: jest.fn(() => [])
      };

      // Dynamic import to use our mocked document
      return import('../utils/linkedin.js').then(({ getProfilePageInfo }) => {
        const result = getProfilePageInfo();
        expect(result.name).toBe(null);
        expect(result.canConnect).toBe(false);
      });
    });

    test('should extract profile data when elements exist', () => {
      const mockElements = {
        '.text-heading-xlarge': { textContent: 'John Doe' },
        '.text-body-medium.break-words': { textContent: 'Software Engineer' },
        '.text-body-small.inline.t-black--light.break-words': { textContent: 'San Francisco, CA' },
        '[aria-label*="Connect"]': { textContent: 'Connect' }
      };

      global.document = {
        querySelector: jest.fn(selector => mockElements[selector] || null),
        querySelectorAll: jest.fn(() => [])
      };

      global.window = {
        location: { href: 'https://www.linkedin.com/in/johndoe/' }
      };

      return import('../utils/linkedin.js').then(({ getProfilePageInfo }) => {
        const result = getProfilePageInfo();
        expect(result.name).toBe('John Doe');
        expect(result.title).toBe('Software Engineer');
        expect(result.location).toBe('San Francisco, CA');
        expect(result.canConnect).toBe(true);
      });
    });
  });

  describe('Connection Button Detection', () => {
    test('should identify clickable connect buttons', () => {
      const connectButton = {
        textContent: 'Connect',
        getAttribute: jest.fn(() => 'Connect with John Doe')
      };

      global.document = {
        querySelector: jest.fn(selector => {
          if (selector.includes('Connect')) {
            return connectButton;
          }
          return null;
        })
      };

      return import('../utils/linkedin-automation.js').then(
        ({ findConnectButton, isConnectButtonClickable }) => {
          const button = findConnectButton();
          expect(button).toBeTruthy();
          expect(isConnectButtonClickable(button)).toBe(true);
        }
      );
    });

    test('should reject non-clickable buttons', () => {
      const pendingButton = {
        textContent: 'Pending',
        getAttribute: jest.fn(() => 'Invitation pending')
      };

      return import('../utils/linkedin-automation.js').then(({ isConnectButtonClickable }) => {
        expect(isConnectButtonClickable(pendingButton)).toBe(false);
      });
    });
  });

  describe('Search Result Processing', () => {
    test('should extract data from search result elements', () => {
      const mockResult = {
        querySelector: jest.fn(selector => {
          if (selector.includes('title-text')) {
            return { textContent: 'Alice Smith', href: '/in/alicesmith/' };
          }
          if (selector.includes('primary-subtitle')) {
            return { textContent: 'Frontend Developer' };
          }
          if (selector.includes('secondary-subtitle')) {
            return { textContent: 'New York, NY' };
          }
          if (selector.includes('Connect')) {
            return { textContent: 'Connect' };
          }
          return null;
        })
      };

      return import('../utils/linkedin-automation.js').then(
        ({ extractProfileFromSearchResult }) => {
          const result = extractProfileFromSearchResult(mockResult);
          expect(result.name).toBe('Alice Smith');
          expect(result.title).toBe('Frontend Developer');
          expect(result.location).toBe('New York, NY');
          expect(result.profileUrl).toBe('/in/alicesmith/');
        }
      );
    });
  });

  describe('Premium Account Detection', () => {
    test('should detect premium accounts', () => {
      global.document = {
        querySelector: jest.fn(selector => {
          if (selector.includes('premium-icon')) {
            return { className: 'premium-icon' };
          }
          return null;
        })
      };

      return import('../utils/linkedin-automation.js').then(({ hasPremiumAccount }) => {
        expect(hasPremiumAccount()).toBe(true);
      });
    });

    test('should detect non-premium accounts', () => {
      global.document = {
        querySelector: jest.fn(() => null)
      };

      return import('../utils/linkedin-automation.js').then(({ hasPremiumAccount }) => {
        expect(hasPremiumAccount()).toBe(false);
      });
    });
  });

  describe('Activity Tracking', () => {
    test('should setup event listeners for activity tracking', () => {
      global.document = {
        addEventListener: jest.fn()
      };

      return import('../utils/linkedin.js').then(({ initActivityTracking }) => {
        initActivityTracking();

        const expectedEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        expect(document.addEventListener).toHaveBeenCalledTimes(expectedEvents.length);

        expectedEvents.forEach(eventType => {
          expect(document.addEventListener).toHaveBeenCalledWith(
            eventType,
            expect.any(Function),
            true
          );
        });
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle DOM errors gracefully', () => {
      global.document = {
        querySelector: jest.fn(() => {
          throw new Error('DOM error');
        })
      };

      return import('../utils/linkedin.js').then(
        ({ getCurrentUserProfile, getProfilePageInfo }) => {
          expect(() => getCurrentUserProfile()).not.toThrow();
          expect(() => getProfilePageInfo()).not.toThrow();

          const profile = getCurrentUserProfile();
          expect(profile.isLoggedIn).toBe(false);

          const profileInfo = getProfilePageInfo();
          expect(profileInfo).toBe(null);
        }
      );
    });
  });

  describe('Utility Functions', () => {
    test('humanDelay should return a promise', async () => {
      const { humanDelay } = await import('../utils/linkedin.js');
      const delayPromise = humanDelay(10, 20);
      expect(delayPromise).toBeInstanceOf(Promise);
      await delayPromise;
    });

    test('should detect recruiter profiles', () => {
      global.document = {
        querySelector: jest.fn(() => ({
          textContent: 'Senior Talent Acquisition Manager'
        }))
      };

      return import('../utils/linkedin-automation.js').then(({ isRecruiter }) => {
        expect(isRecruiter()).toBe(true);
      });
    });
  });
});
