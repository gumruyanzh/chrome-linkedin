// Enhanced Chrome API mocking utilities for testing

export class ChromeStorageMock {
  constructor() {
    this.data = new Map();
  }

  async get(keys = null) {
    if (keys === null) {
      return Object.fromEntries(this.data);
    }

    if (typeof keys === 'string') {
      return { [keys]: this.data.get(keys) };
    }

    if (Array.isArray(keys)) {
      const result = {};
      keys.forEach(key => {
        result[key] = this.data.get(key);
      });
      return result;
    }

    return {};
  }

  async set(items) {
    Object.entries(items).forEach(([key, value]) => {
      this.data.set(key, value);
    });
  }

  async remove(keys) {
    const keysArray = Array.isArray(keys) ? keys : [keys];
    keysArray.forEach(key => this.data.delete(key));
  }

  async clear() {
    this.data.clear();
  }
}

export class ChromeTabsMock {
  constructor() {
    this.tabs = [];
    this.currentTabId = 1;
  }

  async query(queryInfo = {}) {
    let filteredTabs = [...this.tabs];

    if (queryInfo.active !== undefined) {
      filteredTabs = filteredTabs.filter(tab => tab.active === queryInfo.active);
    }

    if (queryInfo.url) {
      filteredTabs = filteredTabs.filter(
        tab => tab.url.includes(queryInfo.url) || new RegExp(queryInfo.url).test(tab.url)
      );
    }

    return filteredTabs;
  }

  async sendMessage(tabId, message) {
    return new Promise(resolve => {
      setTimeout(() => resolve({ success: true }), 10);
    });
  }

  createTab(url, active = true) {
    const tab = {
      id: this.currentTabId++,
      url,
      active,
      title: `Tab ${this.currentTabId - 1}`
    };
    this.tabs.push(tab);
    return tab;
  }
}

export const createChromeExtensionMock = () => {
  const storageMock = new ChromeStorageMock();
  const tabsMock = new ChromeTabsMock();

  // Create Jest mock functions for storage methods
  const mockStorageLocal = {
    get: jest.fn().mockImplementation(storageMock.get.bind(storageMock)),
    set: jest.fn().mockImplementation(storageMock.set.bind(storageMock)),
    remove: jest.fn().mockImplementation(storageMock.remove.bind(storageMock)),
    clear: jest.fn().mockImplementation(storageMock.clear.bind(storageMock))
  };

  const mockStorageSync = {
    get: jest.fn().mockImplementation(storageMock.get.bind(storageMock)),
    set: jest.fn().mockImplementation(storageMock.set.bind(storageMock)),
    remove: jest.fn().mockImplementation(storageMock.remove.bind(storageMock)),
    clear: jest.fn().mockImplementation(storageMock.clear.bind(storageMock))
  };

  return {
    storage: {
      local: mockStorageLocal,
      sync: mockStorageSync
    },
    tabs: tabsMock,
    scripting: {
      executeScript: jest.fn().mockResolvedValue([{ result: null }]),
      insertCSS: jest.fn().mockResolvedValue()
    },
    runtime: {
      sendMessage: jest.fn().mockResolvedValue({ success: true }),
      onMessage: {
        addListener: jest.fn(),
        removeListener: jest.fn()
      },
      getURL: jest.fn(path => `chrome-extension://test-id/${path}`)
    }
  };
};
