/**
 * Simple Framework Test
 * Basic tests to verify the UI testing framework works
 */

const TestSetup = require('./utils/test-setup');
const PuppeteerHelper = require('./utils/puppeteer-helper');

describe('Simple UI Framework Test', () => {
  let testSetup;

  beforeAll(async () => {
    jest.setTimeout(60000);
    testSetup = new TestSetup();
  });

  afterAll(async () => {
    if (testSetup) {
      await testSetup.cleanup();
    }
  });

  test('should initialize framework components', () => {
    const puppeteerHelper = new PuppeteerHelper();
    expect(puppeteerHelper).toBeDefined();
    expect(typeof puppeteerHelper.launchWithExtension).toBe('function');
    console.log('✅ PuppeteerHelper initialized');
  });

  test('should check extension build exists', async () => {
    await expect(testSetup.ensureExtensionBuilt()).resolves.not.toThrow();
    console.log('✅ Extension build verified');
  });

  test('should launch browser with extension', async () => {
    const { puppeteerHelper, extensionId, page } = await testSetup.initialize({
      headless: true,
      slowMo: 0
    });

    expect(extensionId).toBeDefined();
    expect(extensionId).toMatch(/[a-z]{32}/);
    expect(page).toBeDefined();

    console.log(`✅ Extension loaded with ID: ${extensionId}`);
  }, 40000);

  test('should take basic screenshot', async () => {
    const { puppeteerHelper } = await testSetup.setupForPopupTesting();

    const screenshot = await puppeteerHelper.takeScreenshot();
    expect(screenshot).toBeDefined();
    expect(Buffer.isBuffer(screenshot)).toBe(true);

    console.log('✅ Screenshot captured successfully');
  }, 30000);

  test('should load mock LinkedIn page', async () => {
    const { page } = await testSetup.setupForLinkedInTesting();

    const title = await page.title();
    expect(title).toContain('Mock LinkedIn');

    const searchResults = await page.$$('.search-result');
    expect(searchResults.length).toBeGreaterThan(0);

    console.log(`✅ Mock LinkedIn page loaded with ${searchResults.length} results`);
  }, 25000);

  test('should find inactive buttons', async () => {
    const { page } = await testSetup.setupForLinkedInTesting();

    const disabledButton = await page.$('#connect-btn-2');
    expect(disabledButton).toBeDefined();

    const isDisabled = await page.evaluate(
      (btn) => btn.disabled,
      disabledButton
    );
    expect(isDisabled).toBe(true);

    console.log('✅ Found and verified inactive button');
  }, 20000);

  test('should find zero loading indicators', async () => {
    const { page } = await testSetup.setupForLinkedInTesting();

    const loadingIndicator = await page.$('#loading-2');
    expect(loadingIndicator).toBeDefined();

    const text = await page.evaluate(
      (indicator) => indicator.textContent,
      loadingIndicator
    );

    const hasZeroState = text.includes('0%') ||
                        text.includes('Initializing') ||
                        text.includes('0');
    expect(hasZeroState).toBe(true);

    console.log(`✅ Found zero loading indicator: "${text}"`);
  }, 20000);
});