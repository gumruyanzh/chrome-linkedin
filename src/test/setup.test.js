// Test to verify testing infrastructure works
import { ChromeStorageMock, ChromeTabsMock, createChromeExtensionMock } from './chrome-mock.js';

describe('Testing Infrastructure', () => {
  test('Jest is configured correctly', () => {
    expect(true).toBe(true);
  });

  test('Chrome Storage Mock works', async () => {
    const storage = new ChromeStorageMock();

    await storage.set({ test: 'value' });
    const result = await storage.get('test');

    expect(result.test).toBe('value');
  });

  test('Chrome Tabs Mock works', async () => {
    const tabs = new ChromeTabsMock();

    tabs.createTab('https://linkedin.com', true);
    const activeTab = await tabs.query({ active: true });

    expect(activeTab).toHaveLength(1);
    expect(activeTab[0].url).toBe('https://linkedin.com');
  });

  test('Chrome Extension Mock is complete', () => {
    const chromeMock = createChromeExtensionMock();

    expect(chromeMock.storage).toBeDefined();
    expect(chromeMock.tabs).toBeDefined();
    expect(chromeMock.scripting).toBeDefined();
    expect(chromeMock.runtime).toBeDefined();
  });

  test('Global chrome object is available', () => {
    expect(global.chrome).toBeDefined();
    expect(global.chrome.storage).toBeDefined();
    expect(global.chrome.tabs).toBeDefined();
  });
});
