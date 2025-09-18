// Integration Tests for Chrome API Interactions

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Comprehensive Chrome API mock
const createChromeMock = () => ({
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
      getBytesInUse: jest.fn()
    },
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
      getBytesInUse: jest.fn()
    },
    onChanged: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    }
  },
  tabs: {
    query: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    sendMessage: jest.fn(),
    onUpdated: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    onActivated: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    }
  },
  runtime: {
    sendMessage: jest.fn(),
    getURL: jest.fn(),
    getManifest: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    onInstalled: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    onStartup: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    id: 'test-extension-id'
  },
  scripting: {
    executeScript: jest.fn(),
    insertCSS: jest.fn(),
    removeCSS: jest.fn()
  },
  action: {
    setBadgeText: jest.fn(),
    setBadgeBackgroundColor: jest.fn(),
    setIcon: jest.fn(),
    setTitle: jest.fn()
  },
  permissions: {
    request: jest.fn(),
    contains: jest.fn(),
    remove: jest.fn()
  }
});

describe('Chrome API Integration Tests', () => {
  let chromeMock;

  beforeEach(() => {
    chromeMock = createChromeMock();
    global.chrome = chromeMock;

    // Setup default successful responses
    chromeMock.storage.local.get.mockResolvedValue({});
    chromeMock.storage.local.set.mockResolvedValue();
    chromeMock.storage.sync.get.mockResolvedValue({});
    chromeMock.storage.sync.set.mockResolvedValue();
    chromeMock.tabs.query.mockResolvedValue([{
      id: 1,
      url: 'https://www.linkedin.com/search/results/people/',
      active: true
    }]);
    chromeMock.runtime.getURL.mockImplementation(path => `chrome-extension://test-id/${path}`);
    chromeMock.runtime.getManifest.mockReturnValue({
      manifest_version: 3,
      name: 'LinkedIn Automation',
      version: '1.0.0'
    });
    chromeMock.permissions.contains.mockResolvedValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Storage API Integration', () => {
    test('should handle storage operations correctly', async () => {
      const { getStorageData, setStorageData, removeStorageData } = await import('../../src/utils/storage.js');

      // Test setting data
      const testData = { settings: { dailyLimit: 20 }, analytics: [{ type: 'test' }] };
      await setStorageData(testData);

      expect(chromeMock.storage.local.set).toHaveBeenCalledWith(testData);

      // Test getting data
      chromeMock.storage.local.get.mockResolvedValueOnce(testData);
      const retrievedData = await getStorageData(['settings', 'analytics']);

      expect(chromeMock.storage.local.get).toHaveBeenCalledWith(['settings', 'analytics']);
      expect(retrievedData).toEqual(testData);

      // Test removing data
      await removeStorageData('settings');
      expect(chromeMock.storage.local.remove).toHaveBeenCalledWith('settings');
    });

    test('should handle storage quota limits', async () => {
      const { setStorageData } = await import('../../src/utils/storage.js');

      // Simulate quota exceeded error
      const quotaError = new Error('Quota exceeded');
      chromeMock.storage.local.set.mockRejectedValueOnce(quotaError);

      // Should handle error gracefully
      await expect(setStorageData({ largeData: 'x'.repeat(10000) })).rejects.toThrow('Quota exceeded');
    });

    test('should sync data between local and sync storage', async () => {
      const { getStorageData, setStorageData } = await import('../../src/utils/storage.js');

      // Test sync storage
      const syncData = { userPreferences: { theme: 'dark' } };
      await setStorageData(syncData, 'sync');

      expect(chromeMock.storage.sync.set).toHaveBeenCalledWith(syncData);

      chromeMock.storage.sync.get.mockResolvedValueOnce(syncData);
      const retrievedSyncData = await getStorageData(['userPreferences'], 'sync');

      expect(chromeMock.storage.sync.get).toHaveBeenCalledWith(['userPreferences']);
      expect(retrievedSyncData).toEqual(syncData);
    });

    test('should handle storage change events', async () => {
      const { StorageChangeHandler } = await import('../../src/utils/storage-change-handler.js');

      const handler = new StorageChangeHandler();
      const changeCallback = jest.fn();

      handler.onStorageChange('settings', changeCallback);

      expect(chromeMock.storage.onChanged.addListener).toHaveBeenCalled();

      // Simulate storage change
      const changeListener = chromeMock.storage.onChanged.addListener.mock.calls[0][0];
      changeListener({ settings: { newValue: { dailyLimit: 25 }, oldValue: { dailyLimit: 20 } } }, 'local');

      expect(changeCallback).toHaveBeenCalledWith(
        { dailyLimit: 25 },
        { dailyLimit: 20 }
      );
    });
  });

  describe('Tabs API Integration', () => {
    test('should manage LinkedIn tabs correctly', async () => {
      const { TabManager } = await import('../../src/utils/tab-manager.js');

      const tabManager = new TabManager();

      // Test finding LinkedIn tabs
      chromeMock.tabs.query.mockResolvedValueOnce([
        { id: 1, url: 'https://www.linkedin.com/search/results/people/', active: true },
        { id: 2, url: 'https://www.linkedin.com/feed/', active: false },
        { id: 3, url: 'https://www.google.com/', active: false }
      ]);

      const linkedInTabs = await tabManager.findLinkedInTabs();
      expect(linkedInTabs).toHaveLength(2);
      expect(chromeMock.tabs.query).toHaveBeenCalledWith({ url: '*://*.linkedin.com/*' });

      // Test creating new tab
      const newTabUrl = 'https://www.linkedin.com/search/results/people/?keywords=engineer';
      chromeMock.tabs.create.mockResolvedValueOnce({ id: 4, url: newTabUrl });

      const newTab = await tabManager.createLinkedInTab(newTabUrl);
      expect(chromeMock.tabs.create).toHaveBeenCalledWith({ url: newTabUrl, active: false });
      expect(newTab.id).toBe(4);
    });

    test('should send messages to content scripts', async () => {
      const { ContentScriptMessenger } = await import('../../src/utils/content-script-messenger.js');

      const messenger = new ContentScriptMessenger();

      chromeMock.tabs.sendMessage.mockResolvedValueOnce({ success: true, data: 'response' });

      const response = await messenger.sendToTab(1, {
        action: 'getSearchResults',
        params: { limit: 10 }
      });

      expect(chromeMock.tabs.sendMessage).toHaveBeenCalledWith(1, {
        action: 'getSearchResults',
        params: { limit: 10 }
      });
      expect(response).toEqual({ success: true, data: 'response' });
    });

    test('should handle tab update events', async () => {
      const { TabEventHandler } = await import('../../src/utils/tab-event-handler.js');

      const handler = new TabEventHandler();
      const updateCallback = jest.fn();

      handler.onTabUpdated(updateCallback);

      expect(chromeMock.tabs.onUpdated.addListener).toHaveBeenCalled();

      // Simulate tab update
      const updateListener = chromeMock.tabs.onUpdated.addListener.mock.calls[0][0];
      updateListener(1, { status: 'complete' }, {
        id: 1,
        url: 'https://www.linkedin.com/search/results/people/',
        status: 'complete'
      });

      expect(updateCallback).toHaveBeenCalledWith(1, { status: 'complete' }, expect.any(Object));
    });
  });

  describe('Scripting API Integration', () => {
    test('should inject content scripts correctly', async () => {
      const { ContentScriptInjector } = await import('../../src/utils/content-script-injector.js');

      const injector = new ContentScriptInjector();

      chromeMock.scripting.executeScript.mockResolvedValueOnce([{
        result: { profilesFound: 5 },
        frameId: 0
      }]);

      const result = await injector.injectScript(1, {
        func: () => document.querySelectorAll('[data-control-name="search_srp_result"]').length,
        args: []
      });

      expect(chromeMock.scripting.executeScript).toHaveBeenCalledWith({
        target: { tabId: 1 },
        func: expect.any(Function),
        args: []
      });
      expect(result[0].result.profilesFound).toBe(5);
    });

    test('should inject CSS into LinkedIn pages', async () => {
      const { StyleInjector } = await import('../../src/utils/style-injector.js');

      const injector = new StyleInjector();

      const customCSS = `
        .linkedin-automation-highlight {
          border: 2px solid #0073b1;
          background-color: rgba(0, 115, 177, 0.1);
        }
      `;

      await injector.injectCSS(1, customCSS);

      expect(chromeMock.scripting.insertCSS).toHaveBeenCalledWith({
        target: { tabId: 1 },
        css: customCSS
      });
    });

    test('should handle script injection errors', async () => {
      const { ContentScriptInjector } = await import('../../src/utils/content-script-injector.js');

      const injector = new ContentScriptInjector();

      // Simulate injection error (e.g., tab closed)
      chromeMock.scripting.executeScript.mockRejectedValueOnce(
        new Error('Cannot access contents of url')
      );

      const result = await injector.injectScript(1, {
        func: () => 'test',
        args: []
      });

      expect(result).toBeNull();
    });
  });

  describe('Runtime API Integration', () => {
    test('should handle extension messaging', async () => {
      const { ExtensionMessenger } = await import('../../src/utils/extension-messenger.js');

      const messenger = new ExtensionMessenger();

      chromeMock.runtime.sendMessage.mockResolvedValueOnce({
        status: 'success',
        data: { count: 10 }
      });

      const response = await messenger.sendMessage({
        action: 'getAnalytics',
        params: { period: 'week' }
      });

      expect(chromeMock.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'getAnalytics',
        params: { period: 'week' }
      });
      expect(response).toEqual({ status: 'success', data: { count: 10 } });
    });

    test('should handle extension lifecycle events', async () => {
      const { ExtensionLifecycle } = await import('../../src/utils/extension-lifecycle.js');

      const lifecycle = new ExtensionLifecycle();
      const installCallback = jest.fn();
      const startupCallback = jest.fn();

      lifecycle.onInstalled(installCallback);
      lifecycle.onStartup(startupCallback);

      expect(chromeMock.runtime.onInstalled.addListener).toHaveBeenCalled();
      expect(chromeMock.runtime.onStartup.addListener).toHaveBeenCalled();

      // Simulate install event
      const installListener = chromeMock.runtime.onInstalled.addListener.mock.calls[0][0];
      installListener({ reason: 'install' });

      expect(installCallback).toHaveBeenCalledWith({ reason: 'install' });

      // Simulate startup event
      const startupListener = chromeMock.runtime.onStartup.addListener.mock.calls[0][0];
      startupListener();

      expect(startupCallback).toHaveBeenCalled();
    });

    test('should get extension URLs correctly', async () => {
      const { AssetManager } = await import('../../src/utils/asset-manager.js');

      const assetManager = new AssetManager();

      const popupUrl = assetManager.getPopupUrl();
      const dashboardUrl = assetManager.getDashboardUrl();

      expect(chromeMock.runtime.getURL).toHaveBeenCalledWith('popup/popup.html');
      expect(chromeMock.runtime.getURL).toHaveBeenCalledWith('dashboard/dashboard.html');
      expect(popupUrl).toBe('chrome-extension://test-id/popup/popup.html');
      expect(dashboardUrl).toBe('chrome-extension://test-id/dashboard/dashboard.html');
    });
  });

  describe('Action API Integration', () => {
    test('should update extension badge', async () => {
      const { BadgeManager } = await import('../../src/utils/badge-manager.js');

      const badgeManager = new BadgeManager();

      await badgeManager.updateBadge({
        text: '5',
        color: '#0073b1',
        title: '5 connections sent today'
      });

      expect(chromeMock.action.setBadgeText).toHaveBeenCalledWith({ text: '5' });
      expect(chromeMock.action.setBadgeBackgroundColor).toHaveBeenCalledWith({ color: '#0073b1' });
      expect(chromeMock.action.setTitle).toHaveBeenCalledWith({ title: '5 connections sent today' });
    });

    test('should update extension icon', async () => {
      const { IconManager } = await import('../../src/utils/icon-manager.js');

      const iconManager = new IconManager();

      await iconManager.setIcon('active');

      expect(chromeMock.action.setIcon).toHaveBeenCalledWith({
        path: {
          16: 'icons/icon-active-16.png',
          32: 'icons/icon-active-32.png',
          48: 'icons/icon-active-48.png',
          128: 'icons/icon-active-128.png'
        }
      });
    });
  });

  describe('Permissions API Integration', () => {
    test('should request additional permissions', async () => {
      const { PermissionManager } = await import('../../src/utils/permission-manager.js');

      const permissionManager = new PermissionManager();

      chromeMock.permissions.request.mockResolvedValueOnce(true);

      const granted = await permissionManager.requestPermission({
        origins: ['*://*.linkedin.com/*'],
        permissions: ['activeTab']
      });

      expect(chromeMock.permissions.request).toHaveBeenCalledWith({
        origins: ['*://*.linkedin.com/*'],
        permissions: ['activeTab']
      });
      expect(granted).toBe(true);
    });

    test('should check existing permissions', async () => {
      const { PermissionManager } = await import('../../src/utils/permission-manager.js');

      const permissionManager = new PermissionManager();

      chromeMock.permissions.contains.mockResolvedValueOnce(true);

      const hasPermission = await permissionManager.hasPermission({
        origins: ['*://*.linkedin.com/*']
      });

      expect(chromeMock.permissions.contains).toHaveBeenCalledWith({
        origins: ['*://*.linkedin.com/*']
      });
      expect(hasPermission).toBe(true);
    });
  });

  describe('Error Handling and Resilience', () => {
    test('should handle Chrome API unavailability', async () => {
      // Simulate Chrome API not available
      global.chrome = undefined;

      const { getStorageData } = await import('../../src/utils/storage.js');

      // Should gracefully fallback or throw appropriate error
      await expect(getStorageData('test')).rejects.toThrow();
    });

    test('should handle API call failures', async () => {
      const { setStorageData } = await import('../../src/utils/storage.js');

      // Simulate storage failure
      chromeMock.storage.local.set.mockRejectedValueOnce(new Error('Storage error'));

      await expect(setStorageData({ test: 'data' })).rejects.toThrow('Storage error');
    });

    test('should retry failed operations', async () => {
      const { ReliableMessenger } = await import('../../src/utils/reliable-messenger.js');

      const messenger = new ReliableMessenger();

      // First call fails, second succeeds
      chromeMock.runtime.sendMessage
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({ success: true });

      const response = await messenger.sendMessageWithRetry({
        action: 'test'
      }, { retries: 2, delay: 100 });

      expect(chromeMock.runtime.sendMessage).toHaveBeenCalledTimes(2);
      expect(response).toEqual({ success: true });
    });
  });

  describe('Performance and Resource Management', () => {
    test('should cleanup listeners properly', async () => {
      const { EventManager } = await import('../../src/utils/event-manager.js');

      const eventManager = new EventManager();
      const callback = jest.fn();

      // Add listeners
      eventManager.addStorageListener(callback);
      eventManager.addTabListener(callback);

      expect(chromeMock.storage.onChanged.addListener).toHaveBeenCalled();
      expect(chromeMock.tabs.onUpdated.addListener).toHaveBeenCalled();

      // Cleanup
      eventManager.removeAllListeners();

      expect(chromeMock.storage.onChanged.removeListener).toHaveBeenCalled();
      expect(chromeMock.tabs.onUpdated.removeListener).toHaveBeenCalled();
    });

    test('should batch storage operations efficiently', async () => {
      const { BatchStorageManager } = await import('../../src/utils/batch-storage-manager.js');

      const batchManager = new BatchStorageManager();

      // Queue multiple operations
      batchManager.queueSet('key1', 'value1');
      batchManager.queueSet('key2', 'value2');
      batchManager.queueSet('key3', 'value3');

      chromeMock.storage.local.set.mockResolvedValue();

      // Execute batch
      await batchManager.executeBatch();

      // Should combine operations into single API call
      expect(chromeMock.storage.local.set).toHaveBeenCalledTimes(1);
      expect(chromeMock.storage.local.set).toHaveBeenCalledWith({
        key1: 'value1',
        key2: 'value2',
        key3: 'value3'
      });
    });
  });
});