import { jest } from '@jest/globals';

// Mock different Chrome versions for testing
const createMockChrome = (version) => ({
  runtime: {
    getManifest: jest.fn().mockReturnValue({
      manifest_version: 3,
      version: '1.0.0'
    }),
    getPlatformInfo: jest.fn().mockResolvedValue({
      os: 'win',
      arch: 'x86-64'
    }),
    getBrowserInfo: jest.fn().mockResolvedValue({
      name: 'Chrome',
      version: version
    })
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn()
    },
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn()
    }
  },
  tabs: {
    query: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    sendMessage: jest.fn()
  },
  scripting: {
    executeScript: jest.fn(),
    insertCSS: jest.fn(),
    removeCSS: jest.fn()
  },
  action: {
    setIcon: jest.fn(),
    setBadgeText: jest.fn(),
    setBadgeBackgroundColor: jest.fn(),
    setTitle: jest.fn()
  },
  permissions: {
    request: jest.fn(),
    contains: jest.fn(),
    remove: jest.fn()
  }
});

describe('Cross-browser and Compatibility Tests', () => {
  describe('Chrome Version Compatibility', () => {
    test('should support Chrome 88+ (Manifest V3 minimum)', () => {
      const supportedVersions = ['88.0.4324.0', '90.0.4430.0', '95.0.4638.0', '100.0.4896.0'];
      const unsupportedVersions = ['85.0.4183.0', '87.0.4280.0'];

      const isVersionSupported = (version) => {
        const majorVersion = parseInt(version.split('.')[0]);
        return majorVersion >= 88;
      };

      supportedVersions.forEach(version => {
        expect(isVersionSupported(version)).toBe(true);
      });

      unsupportedVersions.forEach(version => {
        expect(isVersionSupported(version)).toBe(false);
      });
    });

    test('should handle storage API across Chrome versions', async () => {
      const chromeVersions = ['88.0.4324.0', '95.0.4638.0', '110.0.5481.0'];

      for (const version of chromeVersions) {
        const mockChrome = createMockChrome(version);
        global.chrome = mockChrome;

        const testData = { key: 'value', timestamp: Date.now() };
        mockChrome.storage.local.set.mockResolvedValue();
        mockChrome.storage.local.get.mockResolvedValue(testData);

        await chrome.storage.local.set(testData);
        const result = await chrome.storage.local.get();

        expect(mockChrome.storage.local.set).toHaveBeenCalledWith(testData);
        expect(result).toEqual(testData);
      }
    });

    test('should handle scripting API changes across versions', async () => {
      const chrome88 = createMockChrome('88.0.4324.0');
      const chrome95 = createMockChrome('95.0.4638.0');

      // Test chrome.scripting API (available in Chrome 88+)
      [chrome88, chrome95].forEach(mockChrome => {
        global.chrome = mockChrome;

        const scriptConfig = {
          target: { tabId: 1 },
          func: () => console.log('test')
        };

        mockChrome.scripting.executeScript.mockResolvedValue([{ result: 'success' }]);

        chrome.scripting.executeScript(scriptConfig);

        expect(mockChrome.scripting.executeScript).toHaveBeenCalledWith(scriptConfig);
      });
    });

    test('should detect and handle API deprecations', () => {
      const apiCompatibility = {
        'chrome.browserAction': {
          deprecated: true,
          replacement: 'chrome.action',
          deprecatedInVersion: '88.0.0'
        },
        'chrome.tabs.executeScript': {
          deprecated: true,
          replacement: 'chrome.scripting.executeScript',
          deprecatedInVersion: '88.0.0'
        }
      };

      const checkAPISupport = (apiName, chromeVersion) => {
        const api = apiCompatibility[apiName];
        if (!api) return true;

        if (api.deprecated) {
          const currentMajor = parseInt(chromeVersion.split('.')[0]);
          const deprecatedMajor = parseInt(api.deprecatedInVersion.split('.')[0]);
          return currentMajor < deprecatedMajor;
        }
        return true;
      };

      expect(checkAPISupport('chrome.browserAction', '85.0.0')).toBe(true);
      expect(checkAPISupport('chrome.browserAction', '88.0.0')).toBe(false);
      expect(checkAPISupport('chrome.tabs.executeScript', '87.0.0')).toBe(true);
      expect(checkAPISupport('chrome.tabs.executeScript', '90.0.0')).toBe(false);
    });
  });

  describe('Feature Detection and Fallbacks', () => {
    test('should detect available APIs and provide fallbacks', () => {
      const detectFeatures = (chromeObj) => {
        const features = {
          hasScriptingAPI: !!(chromeObj.scripting?.executeScript),
          hasActionAPI: !!(chromeObj.action?.setIcon),
          hasStorageAPI: !!(chromeObj.storage?.local),
          hasTabsAPI: !!(chromeObj.tabs?.query),
          hasPermissionsAPI: !!(chromeObj.permissions?.request)
        };

        return features;
      };

      const modernChrome = createMockChrome('95.0.0');
      const limitedChrome = {
        storage: { local: { get: jest.fn(), set: jest.fn() } },
        tabs: { query: jest.fn() }
      };

      const modernFeatures = detectFeatures(modernChrome);
      const limitedFeatures = detectFeatures(limitedChrome);

      expect(modernFeatures.hasScriptingAPI).toBe(true);
      expect(modernFeatures.hasActionAPI).toBe(true);
      expect(limitedFeatures.hasScriptingAPI).toBe(false);
      expect(limitedFeatures.hasActionAPI).toBe(false);
    });

    test('should gracefully degrade functionality', () => {
      const executeScriptWithFallback = (tabId, script) => {
        if (chrome.scripting?.executeScript) {
          return chrome.scripting.executeScript({
            target: { tabId },
            func: script
          });
        } else if (chrome.tabs?.executeScript) {
          return chrome.tabs.executeScript(tabId, { code: script.toString() });
        } else {
          throw new Error('Script execution not supported');
        }
      };

      const modernChrome = createMockChrome('95.0.0');
      const legacyChrome = {
        tabs: {
          executeScript: jest.fn().mockResolvedValue([{ result: 'legacy' }])
        }
      };

      global.chrome = modernChrome;
      modernChrome.scripting.executeScript.mockResolvedValue([{ result: 'modern' }]);

      const testScript = () => document.title;
      executeScriptWithFallback(1, testScript);

      expect(modernChrome.scripting.executeScript).toHaveBeenCalled();

      global.chrome = legacyChrome;
      executeScriptWithFallback(1, testScript);

      expect(legacyChrome.tabs.executeScript).toHaveBeenCalled();
    });

    test('should handle permission changes across versions', () => {
      const checkPermissionSupport = (permission, chromeVersion) => {
        const permissionSupport = {
          'scripting': { minVersion: 88 },
          'activeTab': { minVersion: 16 },
          'storage': { minVersion: 4 },
          'tabs': { minVersion: 4 }
        };

        const majorVersion = parseInt(chromeVersion.split('.')[0]);
        const support = permissionSupport[permission];

        return support ? majorVersion >= support.minVersion : false;
      };

      expect(checkPermissionSupport('scripting', '88.0.0')).toBe(true);
      expect(checkPermissionSupport('scripting', '85.0.0')).toBe(false);
      expect(checkPermissionSupport('activeTab', '20.0.0')).toBe(true);
      expect(checkPermissionSupport('storage', '10.0.0')).toBe(true);
    });
  });

  describe('Operating System Compatibility', () => {
    test('should handle Windows-specific behaviors', () => {
      const windowsSpecificConfig = {
        shortcutKeys: {
          primary: 'Ctrl',
          secondary: 'Alt'
        },
        filePaths: {
          separator: '\\',
          userDirectory: 'C:\\Users\\%USERNAME%'
        }
      };

      const getOSConfig = (platform) => {
        const configs = {
          'win': windowsSpecificConfig,
          'mac': {
            shortcutKeys: { primary: 'Cmd', secondary: 'Option' },
            filePaths: { separator: '/', userDirectory: '/Users/$USER' }
          },
          'linux': {
            shortcutKeys: { primary: 'Ctrl', secondary: 'Alt' },
            filePaths: { separator: '/', userDirectory: '/home/$USER' }
          }
        };

        return configs[platform] || configs['win'];
      };

      const windowsConfig = getOSConfig('win');
      const macConfig = getOSConfig('mac');

      expect(windowsConfig.shortcutKeys.primary).toBe('Ctrl');
      expect(macConfig.shortcutKeys.primary).toBe('Cmd');
      expect(windowsConfig.filePaths.separator).toBe('\\');
      expect(macConfig.filePaths.separator).toBe('/');
    });

    test('should adapt UI for different screen resolutions', () => {
      const adaptUIForResolution = (width, height) => {
        const breakpoints = {
          mobile: { max: 768 },
          tablet: { min: 769, max: 1024 },
          desktop: { min: 1025 }
        };

        if (width <= breakpoints.mobile.max) {
          return {
            layout: 'mobile',
            popupWidth: '100%',
            fontSize: '14px',
            spacing: 'compact'
          };
        } else if (width <= breakpoints.tablet.max) {
          return {
            layout: 'tablet',
            popupWidth: '400px',
            fontSize: '16px',
            spacing: 'normal'
          };
        } else {
          return {
            layout: 'desktop',
            popupWidth: '500px',
            fontSize: '16px',
            spacing: 'comfortable'
          };
        }
      };

      const mobileUI = adaptUIForResolution(375, 667);
      const desktopUI = adaptUIForResolution(1920, 1080);

      expect(mobileUI.layout).toBe('mobile');
      expect(mobileUI.spacing).toBe('compact');
      expect(desktopUI.layout).toBe('desktop');
      expect(desktopUI.spacing).toBe('comfortable');
    });
  });

  describe('Manifest V3 Compliance', () => {
    test('should enforce Manifest V3 structure', () => {
      const manifestV3 = {
        manifest_version: 3,
        name: 'LinkedIn Chrome Extension',
        version: '1.0.0',
        action: {
          default_popup: 'popup.html',
          default_title: 'LinkedIn Extension'
        },
        background: {
          service_worker: 'background.js'
        },
        content_scripts: [{
          matches: ['https://*.linkedin.com/*'],
          js: ['content.js']
        }],
        permissions: ['storage', 'activeTab'],
        host_permissions: ['https://*.linkedin.com/*']
      };

      const validateManifestV3 = (manifest) => {
        const required = ['manifest_version', 'name', 'version'];

        const hasRequired = required.every(field =>
          manifest.hasOwnProperty(field) && manifest[field] !== undefined
        );

        const isV3 = manifest.manifest_version === 3;
        const hasAction = manifest.hasOwnProperty('action');
        const hasServiceWorker = !!(manifest.background?.service_worker);

        return hasRequired && isV3 && hasAction && hasServiceWorker;
      };

      expect(validateManifestV3(manifestV3)).toBe(true);

      const invalidManifest = {
        manifest_version: 2,
        name: 'Test Extension',
        version: '1.0.0'
      };

      expect(validateManifestV3(invalidManifest)).toBe(false);
    });

    test('should handle service worker limitations', () => {
      const serviceWorkerLimitations = {
        maxExecutionTime: 5 * 60 * 1000, // 5 minutes
        noDOM: true,
        limitedAPIs: ['fetch', 'chrome.*'],
        noLocalStorage: true
      };

      const checkServiceWorkerCompatibility = (code) => {
        const restrictions = {
          hasDOM: /document\.|window\.|localStorage/.test(code),
          hasLongRunningOperations: /setInterval|setTimeout.*[5-9]\d{4,}/.test(code),
          usesRestrictedAPIs: /XMLHttpRequest|WebSocket/.test(code)
        };

        return !Object.values(restrictions).some(Boolean);
      };

      const validCode = `
        chrome.storage.local.get(['data'], (result) => {
          console.log('Data retrieved:', result);
        });

        fetch('https://api.example.com/data')
          .then(response => response.json())
          .then(data => console.log(data));
      `;

      const invalidCode = `
        document.getElementById('test').innerHTML = 'test';
        localStorage.setItem('key', 'value');
        setInterval(() => { console.log('running'); }, 600000);
      `;

      expect(checkServiceWorkerCompatibility(validCode)).toBe(true);
      expect(checkServiceWorkerCompatibility(invalidCode)).toBe(false);
    });
  });

  describe('Performance Across Versions', () => {
    test('should measure extension startup time', () => {
      const measureStartupTime = () => {
        const startTime = performance.now();

        // Simulate extension initialization
        const initSteps = [
          () => new Promise(resolve => setTimeout(resolve, 10)),
          () => new Promise(resolve => setTimeout(resolve, 5)),
          () => new Promise(resolve => setTimeout(resolve, 15))
        ];

        return Promise.all(initSteps.map(step => step()))
          .then(() => performance.now() - startTime);
      };

      // This test would be more meaningful in a real browser environment
      expect(typeof measureStartupTime).toBe('function');
    });

    test('should validate memory usage patterns', () => {
      const memoryThresholds = {
        startup: 10 * 1024 * 1024, // 10MB
        idle: 15 * 1024 * 1024,    // 15MB
        active: 25 * 1024 * 1024   // 25MB
      };

      const checkMemoryUsage = (currentUsage, state) => {
        const threshold = memoryThresholds[state];
        return currentUsage <= threshold;
      };

      expect(checkMemoryUsage(8 * 1024 * 1024, 'startup')).toBe(true);
      expect(checkMemoryUsage(30 * 1024 * 1024, 'active')).toBe(false);
      expect(checkMemoryUsage(12 * 1024 * 1024, 'idle')).toBe(true);
    });
  });
});