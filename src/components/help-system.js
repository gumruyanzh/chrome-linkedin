// In-Extension Help System Component

class HelpSystem {
  constructor() {
    this.helpData = {
      'getting-started': {
        title: 'Getting Started',
        sections: [
          {
            title: 'First Steps',
            content: 'Navigate to LinkedIn, then click the extension icon to begin setup.'
          },
          {
            title: 'Basic Setup',
            content: 'Configure your daily limits (start with 10-15 connections/day) and create your first message template.'
          }
        ]
      },
      'automation': {
        title: 'Automation Features',
        sections: [
          {
            title: 'Starting Automation',
            content: 'Go to LinkedIn search results or "People You May Know" page, then click "Start Automation" in the extension popup.'
          },
          {
            title: 'Safety Controls',
            content: 'Use the pause button anytime to stop automation. The extension respects LinkedIn\'s rate limits automatically.'
          }
        ]
      },
      'templates': {
        title: 'Message Templates',
        sections: [
          {
            title: 'Creating Templates',
            content: 'Use variables like {firstName}, {company}, and {title} to personalize your messages.'
          },
          {
            title: 'Example Template',
            content: 'Hi {firstName}, I noticed your work at {company}. I\'d love to connect and learn more about your experience.'
          }
        ]
      },
      'analytics': {
        title: 'Analytics & Tracking',
        sections: [
          {
            title: 'Performance Metrics',
            content: 'View your acceptance rates, response times, and top-performing message templates in the dashboard.'
          },
          {
            title: 'A/B Testing',
            content: 'Test different message approaches to optimize your networking effectiveness.'
          }
        ]
      },
      'troubleshooting': {
        title: 'Troubleshooting',
        sections: [
          {
            title: 'Common Issues',
            content: 'If automation stops working: 1) Refresh LinkedIn page, 2) Check you\'re logged in, 3) Verify daily limits.'
          },
          {
            title: 'Error Codes',
            content: 'E001: Login required, E002: Rate limit reached, E003: Network issue, E004: Invalid criteria.'
          }
        ]
      }
    };

    this.isVisible = false;
    this.currentTopic = null;
  }

  // Initialize help system
  init() {
    this.createHelpModal();
    this.bindEvents();
  }

  // Create the help modal HTML structure
  createHelpModal() {
    const helpModal = document.createElement('div');
    helpModal.id = 'linkedin-ext-help-modal';
    helpModal.className = 'linkedin-ext-help-modal';
    helpModal.innerHTML = `
      <div class="help-modal-overlay">
        <div class="help-modal-content">
          <div class="help-modal-header">
            <h2>LinkedIn Extension Help</h2>
            <button class="help-close-btn" type="button">&times;</button>
          </div>
          <div class="help-modal-body">
            <div class="help-sidebar">
              <ul class="help-topics-list">
                ${Object.keys(this.helpData).map(key => `
                  <li>
                    <button class="help-topic-btn" data-topic="${key}">
                      ${this.helpData[key].title}
                    </button>
                  </li>
                `).join('')}
              </ul>
            </div>
            <div class="help-content-area">
              <div id="help-content">
                <h3>Welcome to LinkedIn Extension Help</h3>
                <p>Select a topic from the left sidebar to get started.</p>
                <div class="help-quick-links">
                  <h4>Quick Links:</h4>
                  <button class="help-topic-btn" data-topic="getting-started">Getting Started Guide</button>
                  <button class="help-topic-btn" data-topic="troubleshooting">Troubleshooting</button>
                  <a href="#" id="open-user-guide" target="_blank">Full User Guide</a>
                </div>
              </div>
            </div>
          </div>
          <div class="help-modal-footer">
            <button class="help-support-btn" type="button">Contact Support</button>
            <button class="help-close-btn" type="button">Close</button>
          </div>
        </div>
      </div>
    `;

    // Add CSS styles
    const style = document.createElement('style');
    style.textContent = `
      .linkedin-ext-help-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
        display: none;
      }

      .help-modal-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .help-modal-content {
        background: white;
        border-radius: 8px;
        width: 90%;
        max-width: 800px;
        height: 80%;
        max-height: 600px;
        display: flex;
        flex-direction: column;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      }

      .help-modal-header {
        padding: 20px;
        border-bottom: 1px solid #e0e0e0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .help-modal-header h2 {
        margin: 0;
        color: #0073b1;
        font-size: 24px;
      }

      .help-close-btn {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #666;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .help-modal-body {
        flex: 1;
        display: flex;
        overflow: hidden;
      }

      .help-sidebar {
        width: 200px;
        background: #f5f5f5;
        border-right: 1px solid #e0e0e0;
        overflow-y: auto;
      }

      .help-topics-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .help-topics-list li {
        border-bottom: 1px solid #e0e0e0;
      }

      .help-topic-btn {
        width: 100%;
        padding: 15px;
        text-align: left;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 14px;
        color: #333;
        transition: background-color 0.2s;
      }

      .help-topic-btn:hover {
        background: #e8e8e8;
      }

      .help-topic-btn.active {
        background: #0073b1;
        color: white;
      }

      .help-content-area {
        flex: 1;
        padding: 20px;
        overflow-y: auto;
      }

      .help-quick-links {
        margin-top: 20px;
        padding: 15px;
        background: #f9f9f9;
        border-radius: 6px;
      }

      .help-quick-links h4 {
        margin: 0 0 10px 0;
        color: #333;
      }

      .help-quick-links button,
      .help-quick-links a {
        display: inline-block;
        margin: 5px 10px 5px 0;
        padding: 8px 12px;
        background: #0073b1;
        color: white;
        text-decoration: none;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
      }

      .help-quick-links button:hover,
      .help-quick-links a:hover {
        background: #005885;
      }

      .help-modal-footer {
        padding: 20px;
        border-top: 1px solid #e0e0e0;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      }

      .help-support-btn {
        padding: 10px 20px;
        background: #28a745;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }

      .help-modal-footer button {
        padding: 10px 20px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }

      .help-section {
        margin-bottom: 20px;
      }

      .help-section h4 {
        color: #0073b1;
        margin-bottom: 8px;
      }

      .help-section p {
        line-height: 1.6;
        color: #333;
        margin-bottom: 12px;
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(helpModal);
    this.modal = helpModal;
  }

  // Bind event listeners
  bindEvents() {
    // Close modal events
    this.modal.querySelectorAll('.help-close-btn').forEach(btn => {
      btn.addEventListener('click', () => this.hide());
    });

    // Topic selection events
    this.modal.querySelectorAll('.help-topic-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const topic = e.target.dataset.topic;
        if (topic) {
          this.showTopic(topic);
        }
      });
    });

    // Support button
    this.modal.querySelector('.help-support-btn').addEventListener('click', () => {
      this.openSupport();
    });

    // User guide link
    this.modal.querySelector('#open-user-guide').addEventListener('click', (e) => {
      e.preventDefault();
      this.openUserGuide();
    });

    // Close on overlay click
    this.modal.querySelector('.help-modal-overlay').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        this.hide();
      }
    });

    // Keyboard events
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.hide();
      }
    });
  }

  // Show help modal
  show(topic = null) {
    this.modal.style.display = 'block';
    this.isVisible = true;

    if (topic) {
      this.showTopic(topic);
    }

    // Track help usage
    this.trackHelpUsage('help_opened', { topic: topic || 'default' });
  }

  // Hide help modal
  hide() {
    this.modal.style.display = 'none';
    this.isVisible = false;
    this.currentTopic = null;

    // Remove active states
    this.modal.querySelectorAll('.help-topic-btn.active').forEach(btn => {
      btn.classList.remove('active');
    });
  }

  // Show specific help topic
  showTopic(topicKey) {
    const topic = this.helpData[topicKey];
    if (!topic) return;

    this.currentTopic = topicKey;

    // Update active button
    this.modal.querySelectorAll('.help-topic-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.topic === topicKey) {
        btn.classList.add('active');
      }
    });

    // Update content
    const contentArea = this.modal.querySelector('#help-content');
    contentArea.innerHTML = `
      <h3>${topic.title}</h3>
      ${topic.sections.map(section => `
        <div class="help-section">
          <h4>${section.title}</h4>
          <p>${section.content}</p>
        </div>
      `).join('')}
    `;

    // Track topic view
    this.trackHelpUsage('topic_viewed', { topic: topicKey });
  }

  // Open support contact
  openSupport() {
    // Create a simple contact form or redirect to support
    const supportContent = `
      <h3>Contact Support</h3>
      <div class="help-section">
        <h4>Need Additional Help?</h4>
        <p>If you can't find what you're looking for, here are ways to get support:</p>
        <ul>
          <li><strong>Email:</strong> support@linkedin-extension.com</li>
          <li><strong>Response Time:</strong> Within 24 hours</li>
          <li><strong>Include:</strong> Your Chrome version, OS, and detailed description of the issue</li>
        </ul>
        <h4>Before Contacting Support:</h4>
        <ul>
          <li>Check the FAQ section first</li>
          <li>Try refreshing the LinkedIn page</li>
          <li>Disable and re-enable the extension</li>
          <li>Note any error messages</li>
        </ul>
      </div>
    `;

    this.modal.querySelector('#help-content').innerHTML = supportContent;
    this.trackHelpUsage('support_contacted');
  }

  // Open user guide in new tab
  openUserGuide() {
    // In a real extension, this would open the full documentation
    const userGuideUrl = chrome.runtime.getURL('docs/USER_GUIDE.md');
    chrome.tabs.create({ url: userGuideUrl });
    this.trackHelpUsage('user_guide_opened');
  }

  // Show contextual help based on current page
  showContextualHelp() {
    const currentUrl = window.location.href;

    if (currentUrl.includes('linkedin.com/search/results/people')) {
      this.show('automation');
    } else if (currentUrl.includes('linkedin.com/mynetwork')) {
      this.show('getting-started');
    } else {
      this.show();
    }
  }

  // Quick help tooltips for specific elements
  showQuickTip(element, message, duration = 3000) {
    const tooltip = document.createElement('div');
    tooltip.className = 'linkedin-ext-tooltip';
    tooltip.textContent = message;

    tooltip.style.cssText = `
      position: absolute;
      background: #333;
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      white-space: nowrap;
      z-index: 10001;
      opacity: 0;
      transition: opacity 0.3s;
    `;

    document.body.appendChild(tooltip);

    // Position tooltip
    const rect = element.getBoundingClientRect();
    tooltip.style.left = rect.left + 'px';
    tooltip.style.top = (rect.bottom + 5) + 'px';

    // Show tooltip
    setTimeout(() => tooltip.style.opacity = '1', 10);

    // Hide tooltip after duration
    setTimeout(() => {
      tooltip.style.opacity = '0';
      setTimeout(() => tooltip.remove(), 300);
    }, duration);
  }

  // Track help system usage for analytics
  trackHelpUsage(action, data = {}) {
    try {
      chrome.storage.local.get(['helpUsageStats'], (result) => {
        const stats = result.helpUsageStats || {};
        const today = new Date().toISOString().split('T')[0];

        if (!stats[today]) {
          stats[today] = {};
        }

        if (!stats[today][action]) {
          stats[today][action] = 0;
        }

        stats[today][action]++;

        chrome.storage.local.set({ helpUsageStats: stats });
      });
    } catch (error) {
      console.error('Error tracking help usage:', error);
    }
  }

  // Get help usage statistics
  getUsageStats(callback) {
    chrome.storage.local.get(['helpUsageStats'], (result) => {
      callback(result.helpUsageStats || {});
    });
  }
}

// Export for use in other components
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HelpSystem;
} else {
  window.HelpSystem = HelpSystem;
}