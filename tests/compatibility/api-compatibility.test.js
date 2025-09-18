import { jest } from '@jest/globals';

// Mock Chrome API versions for compatibility testing
const createChromeAPISet = (version) => {
  const apis = {
    '88': {
      scripting: {
        executeScript: jest.fn(),
        insertCSS: jest.fn(),
        removeCSS: jest.fn()
      },
      action: {
        setIcon: jest.fn(),
        setBadgeText: jest.fn(),
        setTitle: jest.fn()
      },
      storage: {
        local: { get: jest.fn(), set: jest.fn(), remove: jest.fn(), clear: jest.fn() },
        sync: { get: jest.fn(), set: jest.fn(), remove: jest.fn(), clear: jest.fn() }
      },
      tabs: {
        query: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        sendMessage: jest.fn()
      },
      runtime: {
        sendMessage: jest.fn(),
        getManifest: jest.fn(),
        onMessage: { addListener: jest.fn(), removeListener: jest.fn() }
      },
      permissions: {
        request: jest.fn(),
        contains: jest.fn(),
        remove: jest.fn(),
        getAll: jest.fn()
      }
    },
    '95': {
      // All APIs from version 88 plus enhancements
      scripting: {
        executeScript: jest.fn(),
        insertCSS: jest.fn(),
        removeCSS: jest.fn(),
        registerContentScripts: jest.fn(),
        unregisterContentScripts: jest.fn()
      },
      action: {
        setIcon: jest.fn(),
        setBadgeText: jest.fn(),
        setBadgeBackgroundColor: jest.fn(),
        setTitle: jest.fn(),
        openPopup: jest.fn()
      },
      storage: {
        local: { get: jest.fn(), set: jest.fn(), remove: jest.fn(), clear: jest.fn() },
        sync: { get: jest.fn(), set: jest.fn(), remove: jest.fn(), clear: jest.fn() },
        session: { get: jest.fn(), set: jest.fn(), remove: jest.fn(), clear: jest.fn() }
      },
      tabs: {
        query: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        sendMessage: jest.fn(),
        group: jest.fn(),
        ungroup: jest.fn()
      },
      runtime: {
        sendMessage: jest.fn(),
        getManifest: jest.fn(),
        onMessage: { addListener: jest.fn(), removeListener: jest.fn() },
        getContexts: jest.fn()
      },
      permissions: {
        request: jest.fn(),
        contains: jest.fn(),
        remove: jest.fn(),
        getAll: jest.fn()
      }
    }
  };

  return apis[version] || apis['88'];
};

describe('Chrome API Compatibility Tests', () => {
  describe('Storage API Compatibility', () => {
    test('should handle storage.local across all versions', async () => {
      const versions = ['88', '95'];
      const testData = { key: 'value', timestamp: Date.now() };

      for (const version of versions) {
        const api = createChromeAPISet(version);
        global.chrome = api;

        api.storage.local.set.mockResolvedValue();
        api.storage.local.get.mockResolvedValue(testData);

        await chrome.storage.local.set(testData);
        const result = await chrome.storage.local.get();

        expect(api.storage.local.set).toHaveBeenCalledWith(testData);
        expect(result).toEqual(testData);
      }
    });

    test('should detect and use storage.session when available', async () => {
      const chromeWithSession = createChromeAPISet('95');
      const chromeWithoutSession = createChromeAPISet('88');

      const useSessionStorage = (chrome, data) => {
        if (chrome.storage.session) {
          return chrome.storage.session.set(data);
        } else {
          // Fallback to local storage with session-like behavior
          const sessionData = { ...data, _sessionOnly: true };
          return chrome.storage.local.set(sessionData);
        }
      };

      global.chrome = chromeWithSession;
      chromeWithSession.storage.session.set.mockResolvedValue();

      await useSessionStorage(chrome, { temp: 'data' });
      expect(chromeWithSession.storage.session.set).toHaveBeenCalled();

      global.chrome = chromeWithoutSession;
      chromeWithoutSession.storage.local.set.mockResolvedValue();

      await useSessionStorage(chrome, { temp: 'data' });
      expect(chromeWithoutSession.storage.local.set).toHaveBeenCalledWith({
        temp: 'data',
        _sessionOnly: true
      });
    });

    test('should handle storage quota differences', async () => {
      const storageQuotas = {
        local: 5242880, // 5MB
        sync: 102400,   // 100KB
        session: 1048576 // 1MB (Chrome 95+)
      };

      const checkStorageQuota = (data, storageType) => {
        const dataSize = JSON.stringify(data).length;
        const quota = storageQuotas[storageType];
        return dataSize <= quota;
      };

      const smallData = { small: 'data' };
      const largeData = { large: 'x'.repeat(200000) }; // ~200KB

      expect(checkStorageQuota(smallData, 'sync')).toBe(true);
      expect(checkStorageQuota(largeData, 'sync')).toBe(false);
      expect(checkStorageQuota(largeData, 'local')).toBe(true);
    });
  });

  describe('Scripting API Compatibility', () => {
    test('should use chrome.scripting when available', async () => {
      const modernChrome = createChromeAPISet('95');
      const legacyChrome = {
        storage: {
          local: { get: jest.fn(), set: jest.fn(), remove: jest.fn(), clear: jest.fn() },
        },
        tabs: { query: jest.fn() }
      };

      const executeScript = async (chrome, tabId, script) => {
        if (chrome.scripting?.executeScript) {
          return await chrome.scripting.executeScript({
            target: { tabId },
            func: script
          });
        } else {
          throw new Error('Scripting API not available');
        }
      };

      global.chrome = modernChrome;
      modernChrome.scripting.executeScript.mockResolvedValue([{ result: 'success' }]);

      const testScript = () => document.title;
      await executeScript(chrome, 1, testScript);

      expect(modernChrome.scripting.executeScript).toHaveBeenCalledWith({
        target: { tabId: 1 },
        func: testScript
      });

      global.chrome = legacyChrome;

      let errorThrown = false;
      try {
        await executeScript(chrome, 1, testScript);
      } catch (error) {
        errorThrown = true;
        expect(error.message).toBe('Scripting API not available');
      }
      expect(errorThrown).toBe(true);
    });

    test('should handle dynamic content script registration', async () => {
      const chrome95 = createChromeAPISet('95');

      const registerContentScript = (chrome, scriptConfig) => {
        if (chrome.scripting?.registerContentScripts) {
          return chrome.scripting.registerContentScripts([scriptConfig]);
        } else {
          console.warn('Dynamic content script registration not supported');
          return Promise.resolve();
        }
      };

      global.chrome = chrome95;
      chrome95.scripting.registerContentScripts.mockResolvedValue();

      const scriptConfig = {
        id: 'dynamic-script',
        matches: ['https://*.linkedin.com/*'],
        js: ['dynamic-content.js']
      };

      await registerContentScript(chrome, scriptConfig);

      expect(chrome95.scripting.registerContentScripts).toHaveBeenCalledWith([scriptConfig]);
    });

    test('should handle CSS injection compatibility', async () => {
      const versions = ['88', '95'];

      for (const version of versions) {
        const api = createChromeAPISet(version);
        global.chrome = api;

        const cssCode = '.linkedin-extension-highlight { background: yellow; }';

        api.scripting.insertCSS.mockResolvedValue();

        await chrome.scripting.insertCSS({
          target: { tabId: 1 },
          css: cssCode
        });

        expect(api.scripting.insertCSS).toHaveBeenCalledWith({
          target: { tabId: 1 },
          css: cssCode
        });
      }
    });
  });

  describe('Action API Evolution', () => {
    test('should handle basic action API features', async () => {
      const versions = ['88', '95'];

      for (const version of versions) {
        const api = createChromeAPISet(version);
        global.chrome = api;

        api.action.setIcon.mockResolvedValue();
        api.action.setBadgeText.mockResolvedValue();
        api.action.setTitle.mockResolvedValue();

        await chrome.action.setIcon({ path: 'icon.png' });
        await chrome.action.setBadgeText({ text: '5' });
        await chrome.action.setTitle({ title: 'Test Extension' });

        expect(api.action.setIcon).toHaveBeenCalled();
        expect(api.action.setBadgeText).toHaveBeenCalled();
        expect(api.action.setTitle).toHaveBeenCalled();
      }
    });

    test('should use enhanced action features when available', async () => {
      const chrome95 = createChromeAPISet('95');
      const chrome88 = createChromeAPISet('88');

      const setBadgeWithBackground = (chrome, text, color) => {
        chrome.action.setBadgeText({ text });

        if (chrome.action.setBadgeBackgroundColor) {
          return chrome.action.setBadgeBackgroundColor({ color });
        } else {
          console.warn('Badge background color not supported');
          return Promise.resolve();
        }
      };

      global.chrome = chrome95;
      chrome95.action.setBadgeText.mockResolvedValue();
      chrome95.action.setBadgeBackgroundColor.mockResolvedValue();

      await setBadgeWithBackground(chrome, '5', '#ff0000');

      expect(chrome95.action.setBadgeText).toHaveBeenCalledWith({ text: '5' });
      expect(chrome95.action.setBadgeBackgroundColor).toHaveBeenCalledWith({ color: '#ff0000' });

      global.chrome = chrome88;
      chrome88.action.setBadgeText.mockResolvedValue();

      await setBadgeWithBackground(chrome, '5', '#ff0000');

      expect(chrome88.action.setBadgeText).toHaveBeenCalledWith({ text: '5' });
      expect(chrome88.action.setBadgeBackgroundColor).toBeUndefined();
    });

    test('should handle popup opening programmatically', async () => {
      const chrome95 = createChromeAPISet('95');
      const chrome88 = createChromeAPISet('88');

      const openPopup = (chrome) => {
        if (chrome.action.openPopup) {
          return chrome.action.openPopup();
        } else {
          console.warn('Programmatic popup opening not supported');
          return Promise.reject(new Error('Not supported'));
        }
      };

      global.chrome = chrome95;
      chrome95.action.openPopup.mockResolvedValue();

      await expect(openPopup(chrome)).resolves.toBeUndefined();
      expect(chrome95.action.openPopup).toHaveBeenCalled();

      global.chrome = chrome88;

      await expect(openPopup(chrome)).rejects.toThrow('Not supported');
    });
  });

  describe('Tabs API Enhancements', () => {
    test('should handle basic tab operations across versions', async () => {
      const versions = ['88', '95'];

      for (const version of versions) {
        const api = createChromeAPISet(version);
        global.chrome = api;

        api.tabs.query.mockResolvedValue([{ id: 1, url: 'https://linkedin.com' }]);
        api.tabs.sendMessage.mockResolvedValue({ response: 'ok' });

        const tabs = await chrome.tabs.query({ active: true });
        await chrome.tabs.sendMessage(1, { type: 'test' });

        expect(api.tabs.query).toHaveBeenCalledWith({ active: true });
        expect(api.tabs.sendMessage).toHaveBeenCalledWith(1, { type: 'test' });
      }
    });

    test('should use tab grouping when available', async () => {
      const chrome95 = createChromeAPISet('95');
      const chrome88 = createChromeAPISet('88');

      const groupTabs = (chrome, tabIds, groupOptions) => {
        if (chrome.tabs.group) {
          return chrome.tabs.group({ tabIds, ...groupOptions });
        } else {
          console.warn('Tab grouping not supported');
          return Promise.resolve(null);
        }
      };

      global.chrome = chrome95;
      chrome95.tabs.group.mockResolvedValue(1);

      const groupId = await groupTabs(chrome, [1, 2, 3], { createProperties: { title: 'LinkedIn' } });

      expect(chrome95.tabs.group).toHaveBeenCalledWith({
        tabIds: [1, 2, 3],
        createProperties: { title: 'LinkedIn' }
      });
      expect(groupId).toBe(1);

      global.chrome = chrome88;

      const result = await groupTabs(chrome, [1, 2, 3], {});
      expect(result).toBeNull();
    });
  });

  describe('Runtime API Evolution', () => {
    test('should handle message passing across versions', async () => {
      const versions = ['88', '95'];

      for (const version of versions) {
        const api = createChromeAPISet(version);
        global.chrome = api;

        api.runtime.sendMessage.mockResolvedValue({ response: 'received' });

        const response = await chrome.runtime.sendMessage({ type: 'ping' });

        expect(api.runtime.sendMessage).toHaveBeenCalledWith({ type: 'ping' });
        expect(response).toEqual({ response: 'received' });
      }
    });

    test('should use getContexts when available', async () => {
      const chrome95 = createChromeAPISet('95');
      const chrome88 = createChromeAPISet('88');

      const getActiveContexts = (chrome) => {
        if (chrome.runtime.getContexts) {
          return chrome.runtime.getContexts({ contextTypes: ['TAB'] });
        } else {
          console.warn('getContexts not available');
          return Promise.resolve([]);
        }
      };

      global.chrome = chrome95;
      chrome95.runtime.getContexts.mockResolvedValue([
        { contextType: 'TAB', tabId: 1 }
      ]);

      const contexts = await getActiveContexts(chrome);

      expect(chrome95.runtime.getContexts).toHaveBeenCalledWith({
        contextTypes: ['TAB']
      });
      expect(contexts).toHaveLength(1);

      global.chrome = chrome88;

      const fallbackContexts = await getActiveContexts(chrome);
      expect(fallbackContexts).toEqual([]);
    });
  });

  describe('Permissions API Consistency', () => {
    test('should handle permission requests across versions', async () => {
      const versions = ['88', '95'];

      for (const version of versions) {
        const api = createChromeAPISet(version);
        global.chrome = api;

        api.permissions.request.mockResolvedValue(true);
        api.permissions.contains.mockResolvedValue(false);

        const requested = await chrome.permissions.request({
          permissions: ['tabs']
        });

        const hasPermission = await chrome.permissions.contains({
          permissions: ['tabs']
        });

        expect(api.permissions.request).toHaveBeenCalledWith({
          permissions: ['tabs']
        });
        expect(requested).toBe(true);
        expect(hasPermission).toBe(false);
      }
    });

    test('should validate permission compatibility', () => {
      const permissionSupport = {
        'storage': { minVersion: 4, maxVersion: null },
        'activeTab': { minVersion: 16, maxVersion: null },
        'tabs': { minVersion: 4, maxVersion: null },
        'scripting': { minVersion: 88, maxVersion: null },
        'background': { minVersion: 4, maxVersion: null }
      };

      const isPermissionSupported = (permission, chromeVersion) => {
        const support = permissionSupport[permission];
        if (!support) return false;

        const version = parseInt(chromeVersion);
        const minSupported = version >= support.minVersion;
        const maxSupported = !support.maxVersion || version <= support.maxVersion;

        return minSupported && maxSupported;
      };

      expect(isPermissionSupported('storage', '88')).toBe(true);
      expect(isPermissionSupported('scripting', '85')).toBe(false);
      expect(isPermissionSupported('activeTab', '20')).toBe(true);
    });
  });
});