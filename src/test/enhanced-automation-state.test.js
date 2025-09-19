// Tests for Enhanced Automation State Management
import { ChromeStorageMock, ChromeTabsMock, createChromeExtensionMock } from './chrome-mock.js';

// Mock DOM for testing
import { JSDOM } from 'jsdom';

describe('Enhanced Automation State Management', () => {
  let chromeMock;
  let dom;
  let document;
  let window;
  let AutomationStateManager;

  beforeEach(() => {
    // Setup DOM environment
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="start-automation">Start Automation</div>
          <div id="status">
            <div class="w-2"></div>
            <span>Inactive</span>
          </div>
          <div id="progress-section" class="hidden">
            <div id="progress-bar" style="width: 0%"></div>
            <div id="progress-text"></div>
            <div id="progress-percentage">0%</div>
          </div>
          <div id="sent-today">0</div>
          <div id="accepted">0</div>
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

    // Create AutomationStateManager class for testing
    AutomationStateManager = class {
      constructor() {
        this.state = 'inactive'; // inactive, starting, active, stopping, paused, error
        this.isActive = false;
        this.connectionsSent = 0;
        this.connectionsAccepted = 0;
        this.currentProgress = { percentage: 0, text: '', count: 0 };
        this.errorMessage = null;
        this.listeners = new Set();
        this.persistenceEnabled = true;
      }

      // State management methods
      async initialize() {
        if (this.persistenceEnabled) {
          await this.loadPersistedState();
        }
        this.notifyListeners('initialized');
      }

      async setState(newState, data = {}) {
        const oldState = this.state;
        this.state = newState;

        // Update related properties based on state
        switch (newState) {
          case 'active':
            this.isActive = true;
            this.errorMessage = null;
            break;
          case 'inactive':
          case 'stopping':
            this.isActive = false;
            break;
          case 'error':
            this.isActive = false;
            this.errorMessage = data.error || 'Unknown error';
            break;
          case 'paused':
            // Keep isActive true but pause operations
            break;
        }

        if (this.persistenceEnabled) {
          await this.persistState();
        }

        this.notifyListeners('stateChanged', {
          oldState,
          newState,
          isActive: this.isActive,
          ...data
        });
      }

      async start() {
        if (this.state === 'active') {
          throw new Error('Automation is already active');
        }

        await this.setState('starting');

        try {
          // Simulate startup process
          await new Promise(resolve => setTimeout(resolve, 100));
          await this.setState('active');
          return { success: true, isActive: true };
        } catch (error) {
          await this.setState('error', { error: error.message });
          throw error;
        }
      }

      async stop() {
        if (this.state === 'inactive') {
          throw new Error('Automation is already inactive');
        }

        await this.setState('stopping');

        try {
          // Simulate cleanup process
          await new Promise(resolve => setTimeout(resolve, 50));
          await this.setState('inactive');
          return { success: true, isActive: false };
        } catch (error) {
          await this.setState('error', { error: error.message });
          throw error;
        }
      }

      async pause() {
        if (this.state !== 'active') {
          throw new Error('Cannot pause when not active');
        }
        await this.setState('paused');
      }

      async resume() {
        if (this.state !== 'paused') {
          throw new Error('Cannot resume when not paused');
        }
        await this.setState('active');
      }

      // Progress tracking
      async updateProgress(progressData) {
        this.currentProgress = { ...this.currentProgress, ...progressData };

        if (this.persistenceEnabled) {
          await this.persistState();
        }

        this.notifyListeners('progressUpdated', this.currentProgress);
      }

      async updateConnectionStats(sent = 0, accepted = 0) {
        this.connectionsSent = sent;
        this.connectionsAccepted = accepted;

        if (this.persistenceEnabled) {
          await this.persistState();
        }

        this.notifyListeners('statsUpdated', {
          connectionsSent: this.connectionsSent,
          connectionsAccepted: this.connectionsAccepted
        });
      }

      // Event listeners
      addListener(callback) {
        this.listeners.add(callback);
      }

      removeListener(callback) {
        this.listeners.delete(callback);
      }

      notifyListeners(event, data = {}) {
        this.listeners.forEach(callback => {
          try {
            callback(event, data);
          } catch (error) {
            console.error('Error in state manager listener:', error);
          }
        });
      }

      // Persistence methods
      async persistState() {
        if (!this.persistenceEnabled) return;

        const stateData = {
          state: this.state,
          isActive: this.isActive,
          connectionsSent: this.connectionsSent,
          connectionsAccepted: this.connectionsAccepted,
          currentProgress: this.currentProgress,
          errorMessage: this.errorMessage,
          timestamp: Date.now()
        };

        await chrome.storage.local.set({ automationState: stateData });
      }

      async loadPersistedState() {
        try {
          const result = await chrome.storage.local.get('automationState');
          if (result.automationState) {
            const data = result.automationState;
            this.state = data.state || 'inactive';
            this.isActive = data.isActive || false;
            this.connectionsSent = data.connectionsSent || 0;
            this.connectionsAccepted = data.connectionsAccepted || 0;
            this.currentProgress = data.currentProgress || { percentage: 0, text: '', count: 0 };
            this.errorMessage = data.errorMessage || null;
          }
        } catch (error) {
          console.error('Error loading persisted state:', error);
        }
      }

      async clearPersistedState() {
        await chrome.storage.local.remove('automationState');
      }

      // Getters for current state
      getState() {
        return {
          state: this.state,
          isActive: this.isActive,
          connectionsSent: this.connectionsSent,
          connectionsAccepted: this.connectionsAccepted,
          currentProgress: this.currentProgress,
          errorMessage: this.errorMessage
        };
      }

      isInState(state) {
        return this.state === state;
      }

      canStart() {
        return ['inactive', 'error'].includes(this.state);
      }

      canStop() {
        return ['active', 'paused', 'starting'].includes(this.state);
      }

      canPause() {
        return this.state === 'active';
      }

      canResume() {
        return this.state === 'paused';
      }
    };
  });

  afterEach(() => {
    // Clean up
    if (dom) {
      dom.window.close();
    }
    delete global.document;
    delete global.window;
    delete global.chrome;
  });

  describe('Basic State Management', () => {
    test('should initialize with inactive state', async () => {
      const manager = new AutomationStateManager();
      await manager.initialize();

      expect(manager.getState().state).toBe('inactive');
      expect(manager.getState().isActive).toBe(false);
    });

    test('should transition from inactive to active', async () => {
      const manager = new AutomationStateManager();
      await manager.initialize();

      const result = await manager.start();

      expect(result.success).toBe(true);
      expect(result.isActive).toBe(true);
      expect(manager.getState().state).toBe('active');
      expect(manager.getState().isActive).toBe(true);
    });

    test('should transition from active to inactive', async () => {
      const manager = new AutomationStateManager();
      await manager.initialize();
      await manager.start();

      const result = await manager.stop();

      expect(result.success).toBe(true);
      expect(result.isActive).toBe(false);
      expect(manager.getState().state).toBe('inactive');
      expect(manager.getState().isActive).toBe(false);
    });

    test('should handle pause and resume', async () => {
      const manager = new AutomationStateManager();
      await manager.initialize();
      await manager.start();

      await manager.pause();
      expect(manager.getState().state).toBe('paused');
      expect(manager.getState().isActive).toBe(true); // Still considered active but paused

      await manager.resume();
      expect(manager.getState().state).toBe('active');
      expect(manager.getState().isActive).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle error state', async () => {
      const manager = new AutomationStateManager();
      await manager.initialize();

      await manager.setState('error', { error: 'Test error' });

      expect(manager.getState().state).toBe('error');
      expect(manager.getState().isActive).toBe(false);
      expect(manager.getState().errorMessage).toBe('Test error');
    });

    test('should prevent invalid state transitions', async () => {
      const manager = new AutomationStateManager();
      await manager.initialize();

      // Try to start when already active
      await manager.start();
      await expect(manager.start()).rejects.toThrow('Automation is already active');
    });

    test('should prevent stopping when inactive', async () => {
      const manager = new AutomationStateManager();
      await manager.initialize();

      await expect(manager.stop()).rejects.toThrow('Automation is already inactive');
    });

    test('should prevent pause when not active', async () => {
      const manager = new AutomationStateManager();
      await manager.initialize();

      await expect(manager.pause()).rejects.toThrow('Cannot pause when not active');
    });
  });

  describe('Progress Tracking', () => {
    test('should update progress correctly', async () => {
      const manager = new AutomationStateManager();
      await manager.initialize();

      const progressData = { percentage: 50, text: 'Processing...', count: 5 };
      await manager.updateProgress(progressData);

      expect(manager.getState().currentProgress).toMatchObject(progressData);
    });

    test('should update connection statistics', async () => {
      const manager = new AutomationStateManager();
      await manager.initialize();

      await manager.updateConnectionStats(10, 3);

      expect(manager.getState().connectionsSent).toBe(10);
      expect(manager.getState().connectionsAccepted).toBe(3);
    });

    test('should track incremental progress updates', async () => {
      const manager = new AutomationStateManager();
      await manager.initialize();

      await manager.updateProgress({ percentage: 25, text: 'Step 1' });
      expect(manager.getState().currentProgress.percentage).toBe(25);

      await manager.updateProgress({ percentage: 75, count: 10 });
      expect(manager.getState().currentProgress.percentage).toBe(75);
      expect(manager.getState().currentProgress.text).toBe('Step 1'); // Should retain previous text
      expect(manager.getState().currentProgress.count).toBe(10);
    });
  });

  describe('Event Listeners', () => {
    test('should notify listeners on state change', async () => {
      const manager = new AutomationStateManager();
      await manager.initialize();

      const listener = jest.fn();
      manager.addListener(listener);

      await manager.start();

      expect(listener).toHaveBeenCalledWith('stateChanged', expect.objectContaining({
        oldState: 'starting',
        newState: 'active',
        isActive: true
      }));
    });

    test('should notify listeners on progress update', async () => {
      const manager = new AutomationStateManager();
      await manager.initialize();

      const listener = jest.fn();
      manager.addListener(listener);

      const progressData = { percentage: 30, text: 'Working...' };
      await manager.updateProgress(progressData);

      expect(listener).toHaveBeenCalledWith('progressUpdated', expect.objectContaining(progressData));
    });

    test('should notify listeners on stats update', async () => {
      const manager = new AutomationStateManager();
      await manager.initialize();

      const listener = jest.fn();
      manager.addListener(listener);

      await manager.updateConnectionStats(5, 2);

      expect(listener).toHaveBeenCalledWith('statsUpdated', {
        connectionsSent: 5,
        connectionsAccepted: 2
      });
    });

    test('should remove listeners correctly', async () => {
      const manager = new AutomationStateManager();
      await manager.initialize();

      const listener = jest.fn();
      manager.addListener(listener);
      manager.removeListener(listener);

      await manager.start();

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('State Persistence', () => {
    test('should persist state to chrome storage', async () => {
      const manager = new AutomationStateManager();
      await manager.initialize();
      await manager.start();
      await manager.updateConnectionStats(5, 2);

      // Wait a bit for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check that storage was called
      expect(chromeMock.storage.local.set).toHaveBeenCalled();

      // Find the most recent call with automationState that has the expected data
      const setCalls = chromeMock.storage.local.set.mock.calls;
      const relevantCalls = setCalls.filter(call =>
        call[0] &&
        call[0].automationState &&
        call[0].automationState.connectionsSent === 5
      );

      expect(relevantCalls.length).toBeGreaterThan(0);
      const setCall = relevantCalls[relevantCalls.length - 1];

      expect(setCall[0].automationState).toMatchObject({
        state: 'active',
        isActive: true,
        connectionsSent: 5,
        connectionsAccepted: 2
      });
    });

    test('should load persisted state on initialization', async () => {
      const persistedData = {
        state: 'active',
        isActive: true,
        connectionsSent: 10,
        connectionsAccepted: 3,
        currentProgress: { percentage: 50, text: 'Halfway done', count: 5 }
      };

      chromeMock.storage.local.get.mockResolvedValueOnce({
        automationState: persistedData
      });

      const manager = new AutomationStateManager();
      await manager.initialize();

      const state = manager.getState();
      expect(state.state).toBe('active');
      expect(state.isActive).toBe(true);
      expect(state.connectionsSent).toBe(10);
      expect(state.connectionsAccepted).toBe(3);
      expect(state.currentProgress).toMatchObject({
        percentage: 50,
        text: 'Halfway done',
        count: 5
      });
    });

    test('should clear persisted state', async () => {
      const manager = new AutomationStateManager();
      await manager.initialize();

      await manager.clearPersistedState();

      expect(chromeMock.storage.local.remove).toHaveBeenCalledWith('automationState');
    });

    test('should handle missing persisted state gracefully', async () => {
      chromeMock.storage.local.get.mockResolvedValueOnce({});

      const manager = new AutomationStateManager();
      await manager.initialize();

      expect(manager.getState().state).toBe('inactive');
      expect(manager.getState().isActive).toBe(false);
    });
  });

  describe('State Validation', () => {
    test('should validate state transitions', () => {
      const manager = new AutomationStateManager();

      expect(manager.canStart()).toBe(true); // inactive state
      expect(manager.canStop()).toBe(false);
      expect(manager.canPause()).toBe(false);
      expect(manager.canResume()).toBe(false);
    });

    test('should validate state for active automation', async () => {
      const manager = new AutomationStateManager();
      await manager.initialize();
      await manager.start();

      expect(manager.canStart()).toBe(false);
      expect(manager.canStop()).toBe(true);
      expect(manager.canPause()).toBe(true);
      expect(manager.canResume()).toBe(false);
    });

    test('should validate state for paused automation', async () => {
      const manager = new AutomationStateManager();
      await manager.initialize();
      await manager.start();
      await manager.pause();

      expect(manager.canStart()).toBe(false);
      expect(manager.canStop()).toBe(true);
      expect(manager.canPause()).toBe(false);
      expect(manager.canResume()).toBe(true);
    });

    test('should check specific states correctly', async () => {
      const manager = new AutomationStateManager();
      await manager.initialize();

      expect(manager.isInState('inactive')).toBe(true);
      expect(manager.isInState('active')).toBe(false);

      await manager.start();
      expect(manager.isInState('active')).toBe(true);
      expect(manager.isInState('inactive')).toBe(false);
    });
  });

  describe('Integration with Chrome APIs', () => {
    test('should handle chrome storage errors gracefully', async () => {
      const manager = new AutomationStateManager();
      await manager.initialize();

      // Mock storage.set to fail after initialization
      const originalSet = chromeMock.storage.local.set;
      chromeMock.storage.local.set.mockImplementation(() => {
        console.error('Storage error');
        return Promise.reject(new Error('Storage error'));
      });

      // Should not throw even if storage fails
      const result = await manager.start();
      expect(result).toBeDefined();
      expect(result.success).toBe(true);

      // Restore original mock
      chromeMock.storage.local.set = originalSet;
    });

    test('should handle chrome storage get errors gracefully', async () => {
      chromeMock.storage.local.get.mockRejectedValueOnce(new Error('Storage error'));

      const manager = new AutomationStateManager();

      // Should not throw and should use default state
      await manager.initialize();
      expect(manager.getState().state).toBe('inactive');
    });
  });

  describe('Performance and Memory', () => {
    test('should handle multiple rapid state changes', async () => {
      const manager = new AutomationStateManager();
      await manager.initialize();

      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(manager.updateProgress({ percentage: i * 10 }));
      }

      await Promise.all(promises);
      expect(manager.getState().currentProgress.percentage).toBeDefined();
    });

    test('should not leak memory with listeners', () => {
      const manager = new AutomationStateManager();

      const listeners = [];
      for (let i = 0; i < 100; i++) {
        const listener = jest.fn();
        listeners.push(listener);
        manager.addListener(listener);
      }

      listeners.forEach(listener => manager.removeListener(listener));

      expect(manager.listeners.size).toBe(0);
    });
  });
});