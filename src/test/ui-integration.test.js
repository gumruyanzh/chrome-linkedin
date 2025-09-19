// Integration tests for UI state management
import { ChromeStorageMock, ChromeTabsMock, createChromeExtensionMock } from './chrome-mock.js';
import { JSDOM } from 'jsdom';

describe('UI Integration Tests', () => {
  let chromeMock;
  let dom;
  let document;
  let window;

  beforeEach(() => {
    // Setup DOM environment
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head><title>LinkedIn Automation</title></head>
        <body>
          <div id="start-automation" class="w-full py-vintage-sm px-vintage-md rounded-vintage font-newspaper font-semibold transition-all duration-200 vintage-button">Start Automation</div>
          <div id="status" class="flex items-center space-x-2">
            <div class="w-2 h-2 bg-vintage-sepia rounded-full border border-vintage-accent status-dot"></div>
            <span class="text-vintage-ink status-text">Inactive</span>
          </div>
          <div id="progress-section" class="hidden">
            <div class="bg-vintage-paper-dark rounded-vintage h-2 mb-2">
              <div id="progress-bar" class="bg-vintage-accent h-2 rounded-vintage transition-all duration-300" style="width: 0%"></div>
            </div>
            <div class="flex justify-between items-center text-vintage-sm">
              <span id="progress-text" class="text-vintage-ink-light">Ready to start</span>
              <span id="progress-percentage" class="text-vintage-accent font-medium">0%</span>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-vintage-sm mb-vintage-md">
            <div class="bg-vintage-paper-dark rounded-vintage p-vintage-md text-center">
              <div id="sent-today" class="text-vintage-xl font-bold text-vintage-ink mb-1">0</div>
              <div class="text-vintage-sm text-vintage-ink-light">Sent Today</div>
            </div>
            <div class="bg-vintage-paper-dark rounded-vintage p-vintage-md text-center">
              <div id="accepted" class="text-vintage-xl font-bold text-vintage-sage mb-1">0</div>
              <div class="text-vintage-sm text-vintage-ink-light">Accepted</div>
            </div>
          </div>
        </body>
      </html>
    `);

    document = dom.window.document;
    window = dom.window;
    global.document = document;
    global.window = window;

    // Setup Chrome API mock
    chromeMock = createChromeExtensionMock();
    global.chrome = chromeMock;
  });

  afterEach(() => {
    if (dom) {
      dom.window.close();
    }
    delete global.document;
    delete global.window;
    delete global.chrome;
  });

  test('should initialize UI components successfully', async () => {
    // Import and initialize components
    const { getGlobalStateManager } = await import('../utils/enhanced-automation-state-manager.js');
    const { default: AutomationControlButton } = await import('../components/automation-control-button.js');
    const { default: RealTimeStatusDisplay } = await import('../components/real-time-status-display.js');

    // Initialize state manager
    const stateManager = getGlobalStateManager();
    await stateManager.initialize();

    // Initialize control button
    const startButton = document.getElementById('start-automation');
    const controlButton = new AutomationControlButton(startButton, stateManager, {
      showConfirmDialog: false, // Disable for testing
      enableLoadingStates: true,
      animateTransitions: false,
      autoUpdateText: true
    });

    // Initialize status display
    const statusContainer = document.getElementById('status');
    const statusDisplay = new RealTimeStatusDisplay(statusContainer, stateManager, {
      updateInterval: 100,
      enableAnimations: false,
      showProgress: true,
      showStats: true
    });

    // Verify initialization
    expect(stateManager.getState().state).toBe('inactive');
    expect(startButton.textContent).toBe('Start Automation');

    // Cleanup
    controlButton.destroy();
    statusDisplay.destroy();
    stateManager.destroy();
  });

  test('should handle full automation lifecycle', async () => {
    // Import components
    const { getGlobalStateManager } = await import('../utils/enhanced-automation-state-manager.js');
    const { default: AutomationControlButton } = await import('../components/automation-control-button.js');
    const { default: RealTimeStatusDisplay } = await import('../components/real-time-status-display.js');

    // Initialize
    const stateManager = getGlobalStateManager();
    await stateManager.initialize();

    const startButton = document.getElementById('start-automation');
    const controlButton = new AutomationControlButton(startButton, stateManager, {
      showConfirmDialog: false,
      enableLoadingStates: true
    });

    const statusContainer = document.getElementById('status');
    const statusDisplay = new RealTimeStatusDisplay(statusContainer, stateManager, {
      updateInterval: 50,
      enableAnimations: false
    });

    // Test start automation
    await stateManager.start();
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(stateManager.getState().state).toBe('active');
    expect(stateManager.getState().isActive).toBe(true);

    // Test progress update
    await stateManager.updateProgress({ percentage: 50, text: 'Processing...', count: 5 });
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(stateManager.getState().currentProgress.percentage).toBe(50);

    // Test stats update
    await stateManager.updateConnectionStats(10, 3);
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(stateManager.getState().connectionsSent).toBe(10);
    expect(stateManager.getState().connectionsAccepted).toBe(3);

    // Test pause
    await stateManager.pause();
    expect(stateManager.getState().state).toBe('paused');

    // Test resume
    await stateManager.resume();
    expect(stateManager.getState().state).toBe('active');

    // Test stop
    await stateManager.stop();
    expect(stateManager.getState().state).toBe('inactive');
    expect(stateManager.getState().isActive).toBe(false);

    // Cleanup
    controlButton.destroy();
    statusDisplay.destroy();
    stateManager.destroy();
  });

  test('should handle error scenarios gracefully', async () => {
    // Import components
    const { getGlobalStateManager } = await import('../utils/enhanced-automation-state-manager.js');
    const { default: AutomationErrorHandler } = await import('../utils/automation-error-handler.js');

    // Initialize
    const stateManager = getGlobalStateManager();
    await stateManager.initialize();

    const errorHandler = new AutomationErrorHandler(stateManager, {
      enableAutoRecovery: false, // Disable for testing
      enableUserNotifications: false,
      enableErrorReporting: false
    });

    // Test error state
    await stateManager.setState('error', { error: 'Test error' });

    expect(stateManager.getState().state).toBe('error');
    expect(stateManager.getState().errorMessage).toBe('Test error');

    // Test recovery to start
    expect(stateManager.canStart()).toBe(true);
    await stateManager.start();
    expect(stateManager.getState().state).toBe('active');

    // Cleanup
    errorHandler.destroy();
    stateManager.destroy();
  });

  test('should persist and restore state correctly', async () => {
    // Import components
    const { AutomationStateManager } = await import('../utils/enhanced-automation-state-manager.js');

    // First manager instance
    const manager1 = new AutomationStateManager({ persistenceEnabled: true });
    await manager1.initialize();
    await manager1.start();
    await manager1.updateConnectionStats(15, 5);
    await manager1.updateProgress({ percentage: 75, text: 'Almost done' });

    // Wait for persistence
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify persistence was called
    expect(chromeMock.storage.local.set).toHaveBeenCalled();

    // Create second manager instance to test restoration
    const manager2 = new AutomationStateManager({ persistenceEnabled: true });

    // Mock the persisted data for loading
    const persistedData = {
      state: 'active',
      isActive: true,
      connectionsSent: 15,
      connectionsAccepted: 5,
      currentProgress: { percentage: 75, text: 'Almost done', count: 0 },
      errorMessage: null
    };

    chromeMock.storage.local.get.mockResolvedValueOnce({
      automationState: persistedData
    });

    await manager2.initialize();

    // Verify state was restored
    const restoredState = manager2.getState();
    expect(restoredState.state).toBe('active');
    expect(restoredState.isActive).toBe(true);
    expect(restoredState.connectionsSent).toBe(15);
    expect(restoredState.connectionsAccepted).toBe(5);
    expect(restoredState.currentProgress.percentage).toBe(75);

    // Cleanup
    manager1.destroy();
    manager2.destroy();
  });
});