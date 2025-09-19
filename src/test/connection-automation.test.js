// Connection Request Automation Tests - Task 2.2
// Tests for automated connection request sending with custom messaging

import {
  sendConnectionRequest,
  findConnectButton,
  isConnectButtonClickable,
  handleConnectionMessage,
  confirmConnectionRequest,
  waitForElement
} from '../utils/linkedin-automation.js';

describe('Connection Request Automation - Task 2.2', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup basic DOM mock
    global.document = {
      querySelector: jest.fn(),
      querySelectorAll: jest.fn(() => []),
      body: {
        appendChild: jest.fn()
      }
    };

    global.window = {
      location: { href: 'https://www.linkedin.com/in/johndoe/' }
    };

    // Mock MutationObserver
    global.MutationObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      disconnect: jest.fn()
    }));
  });

  describe('Connect Button Detection and Validation', () => {
    test('should find connect button using multiple selectors', () => {
      const connectButton = {
        textContent: 'Connect',
        getAttribute: jest.fn(() => 'Connect with John Doe'),
        click: jest.fn()
      };

      global.document.querySelector = jest.fn(selector => {
        if (selector.includes('Connect')) {
          return connectButton;
        }
        return null;
      });

      const button = findConnectButton();
      expect(button).toBeTruthy();
      expect(button.textContent).toBe('Connect');
    });

    test('should return null when no connect button found', () => {
      global.document.querySelector = jest.fn(() => null);

      const button = findConnectButton();
      expect(button).toBe(null);
    });

    test('should validate clickable connect buttons', () => {
      const connectButton = {
        textContent: 'Connect',
        getAttribute: jest.fn(() => 'Connect with John Doe')
      };

      const result = isConnectButtonClickable(connectButton);
      expect(result).toBe(true);
    });

    test('should reject pending invitation buttons', () => {
      const pendingButton = {
        textContent: 'Pending',
        getAttribute: jest.fn(() => 'Invitation pending')
      };

      const result = isConnectButtonClickable(pendingButton);
      expect(result).toBe(false);
    });

    test('should reject message buttons (already connected)', () => {
      const messageButton = {
        textContent: 'Message',
        getAttribute: jest.fn(() => 'Send message to John Doe')
      };

      const result = isConnectButtonClickable(messageButton);
      expect(result).toBe(false);
    });

    test('should handle buttons without getAttribute method', () => {
      const mockButton = {
        textContent: 'Connect'
        // No getAttribute method
      };

      const result = isConnectButtonClickable(mockButton);
      expect(result).toBe(true);
    });
  });

  describe('Connection Request Sending', () => {
    test('should send connection request successfully', async () => {
      const connectButton = {
        textContent: 'Connect',
        getAttribute: jest.fn(() => 'Connect with John Doe'),
        click: jest.fn()
      };

      global.document.querySelector = jest.fn(selector => {
        if (selector.includes('Connect')) {
          return connectButton;
        }
        return null;
      });

      const result = await sendConnectionRequest();

      expect(connectButton.click).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.hasCustomMessage).toBe(false);
      expect(result.profileUrl).toBe('https://www.linkedin.com/in/johndoe/');
    });

    test('should send connection request with custom message', async () => {
      const connectButton = {
        textContent: 'Connect',
        getAttribute: jest.fn(() => 'Connect with John Doe'),
        click: jest.fn()
      };

      const addNoteButton = {
        click: jest.fn()
      };

      const messageTextarea = {
        value: '',
        dispatchEvent: jest.fn()
      };

      global.document.querySelector = jest.fn(selector => {
        if (selector.includes('Connect')) {
          return connectButton;
        }
        if (selector.includes('Add a note')) {
          return addNoteButton;
        }
        if (selector.includes('textarea')) {
          return messageTextarea;
        }
        return null;
      });

      const customMessage = 'Hi John, I would like to connect with you.';
      const result = await sendConnectionRequest(customMessage);

      expect(connectButton.click).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.hasCustomMessage).toBe(true);
    });

    test('should handle missing connect button', async () => {
      global.document.querySelector = jest.fn(() => null);

      const result = await sendConnectionRequest();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Connect button not found');
      expect(result.reason).toBe('NO_CONNECT_BUTTON');
    });

    test('should handle non-clickable connect button', async () => {
      const pendingButton = {
        textContent: 'Pending',
        getAttribute: jest.fn(() => 'Invitation pending')
      };

      global.document.querySelector = jest.fn(() => pendingButton);

      const result = await sendConnectionRequest();

      expect(result.success).toBe(false);
      expect(result.reason).toBe('ALREADY_CONNECTED');
    });

    test('should handle connection request errors', async () => {
      const connectButton = {
        textContent: 'Connect',
        getAttribute: jest.fn(() => 'Connect with John Doe'),
        click: jest.fn(() => {
          throw new Error('Click failed');
        })
      };

      global.document.querySelector = jest.fn(() => connectButton);

      const result = await sendConnectionRequest();

      expect(result.success).toBe(false);
      expect(result.reason).toBe('EXCEPTION');
    });
  });

  describe('Custom Message Handling', () => {
    test('should add custom message to connection request', async () => {
      const addNoteButton = {
        click: jest.fn()
      };

      const messageTextarea = {
        value: '',
        dispatchEvent: jest.fn()
      };

      let elementRequests = 0;
      global.document.querySelector = jest.fn(selector => {
        elementRequests++;
        if (selector.includes('Add a note')) {
          return addNoteButton;
        }
        if (selector.includes('textarea')) {
          return messageTextarea;
        }
        return null;
      });

      const message = 'Hello, I would like to connect!';
      const result = await handleConnectionMessage(message);

      expect(addNoteButton.click).toHaveBeenCalled();
      expect(messageTextarea.value).toBe(message);
      expect(messageTextarea.dispatchEvent).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test('should handle missing message textarea', async () => {
      global.document.querySelector = jest.fn(() => null);

      const result = await handleConnectionMessage('Hello!');

      expect(result).toBe(false);
    });

    test('should handle message dialog errors', async () => {
      global.document.querySelector = jest.fn(() => {
        throw new Error('DOM error');
      });

      const result = await handleConnectionMessage('Hello!');

      expect(result).toBe(false);
    });
  });

  describe('Connection Request Confirmation', () => {
    test('should confirm connection request by clicking send button', async () => {
      const sendButton = {
        disabled: false,
        click: jest.fn()
      };

      global.document.querySelector = jest.fn(selector => {
        if (selector.includes('Send')) {
          return sendButton;
        }
        return null;
      });

      const result = await confirmConnectionRequest();

      expect(sendButton.click).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test('should handle disabled send button', async () => {
      const disabledSendButton = {
        disabled: true,
        click: jest.fn()
      };

      global.document.querySelector = jest.fn(() => disabledSendButton);

      const result = await confirmConnectionRequest();

      expect(disabledSendButton.click).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    test('should handle missing send button', async () => {
      global.document.querySelector = jest.fn(() => null);

      const result = await confirmConnectionRequest();

      expect(result).toBe(false);
    });
  });

  describe('Element Waiting Utility', () => {
    test('should wait for element to appear', async () => {
      const targetElement = { id: 'test-element' };

      // Mock element appearing immediately
      global.document.querySelector = jest.fn(() => targetElement);

      const result = await waitForElement('#test-element', 1000);

      expect(result).toBe(targetElement);
    });

    test('should timeout when element does not appear', async () => {
      global.document.querySelector = jest.fn(() => null);

      await expect(waitForElement('#missing-element', 100)).rejects.toThrow(
        'Element #missing-element not found within 100ms'
      );
    });

    test('should observe DOM changes when element not immediately found', done => {
      const targetElement = { id: 'test-element' };
      let callCount = 0;

      global.document.querySelector = jest.fn(() => {
        callCount++;
        return callCount > 1 ? targetElement : null;
      });

      // Mock MutationObserver that triggers callback
      const mockCallback = jest.fn();
      global.MutationObserver = jest.fn().mockImplementation(callback => {
        setTimeout(() => {
          callback(); // Trigger the callback to simulate DOM change
        }, 10);

        return {
          observe: jest.fn(),
          disconnect: jest.fn()
        };
      });

      waitForElement('#test-element', 1000).then(result => {
        expect(result).toBe(targetElement);
        done();
      });
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete connection flow', async () => {
      const connectButton = {
        textContent: 'Connect',
        getAttribute: jest.fn(() => 'Connect with John Doe'),
        click: jest.fn()
      };

      const sendButton = {
        disabled: false,
        click: jest.fn()
      };

      global.document.querySelector = jest.fn(selector => {
        if (selector.includes('Connect')) {
          return connectButton;
        }
        if (selector.includes('Send')) {
          return sendButton;
        }
        return null;
      });

      const result = await sendConnectionRequest();

      expect(connectButton.click).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.timestamp).toBeDefined();
      expect(typeof result.timestamp).toBe('number');
    });

    test('should handle connection flow with message', async () => {
      const connectButton = {
        textContent: 'Connect',
        getAttribute: jest.fn(() => 'Connect with John Doe'),
        click: jest.fn()
      };

      const addNoteButton = {
        click: jest.fn()
      };

      const messageTextarea = {
        value: '',
        dispatchEvent: jest.fn()
      };

      const sendButton = {
        disabled: false,
        click: jest.fn()
      };

      global.document.querySelector = jest.fn(selector => {
        if (selector.includes('Connect')) {
          return connectButton;
        }
        if (selector.includes('Add a note')) {
          return addNoteButton;
        }
        if (selector.includes('textarea')) {
          return messageTextarea;
        }
        if (selector.includes('Send')) {
          return sendButton;
        }
        return null;
      });

      const message = 'I would love to connect and share ideas!';
      const result = await sendConnectionRequest(message);

      expect(result.success).toBe(true);
      expect(result.hasCustomMessage).toBe(true);
      expect(messageTextarea.value).toBe(message);
    });
  });

  describe('Error Recovery and Edge Cases', () => {
    test('should handle network delays gracefully', async () => {
      const connectButton = {
        textContent: 'Connect',
        getAttribute: jest.fn(() => 'Connect with John Doe'),
        click: jest.fn()
      };

      // Simulate slow response
      global.document.querySelector = jest.fn(selector => {
        if (selector.includes('Connect')) {
          return connectButton;
        }
        return null;
      });

      const startTime = Date.now();
      const result = await sendConnectionRequest();
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeGreaterThan(1000); // Should wait for dialog
    });

    test('should handle malformed DOM structures', async () => {
      const malformedButton = {
        // Missing expected properties
        click: jest.fn()
      };

      global.document.querySelector = jest.fn(() => malformedButton);

      const result = await sendConnectionRequest();

      expect(result.success).toBe(false);
      expect(result.reason).toBe('ALREADY_CONNECTED');
    });
  });
});
