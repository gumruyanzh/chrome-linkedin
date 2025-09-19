// In-Extension Help System Component

class HelpSystem {
  constructor() {
    this.helpData = {
      'getting-started': {
        title: 'Editorial Primer',
        sections: [
          {
            title: 'Establishing Your Editorial Office',
            content: 'Access LinkedIn\'s professional network, then activate the Editorial Chronicle extension to commence your networking campaign setup.'
          },
          {
            title: 'Initial Configuration',
            content:
              'Establish your daily publication limits (recommended: 10-15 connections per edition) and compose your inaugural message template for professional correspondence.'
          }
        ]
      },
      automation: {
        title: 'Publishing Operations',
        sections: [
          {
            title: 'Initiating Publication',
            content:
              'Navigate to LinkedIn search results or "People You May Know" directory, then select "Start Publishing" from the Editorial Chronicle popup to begin automated outreach.'
          },
          {
            title: 'Editorial Oversight',
            content:
              'Utilize the "Stop Press" control to halt operations immediately. The Chronicle maintains strict adherence to LinkedIn\'s professional networking standards and rate limitations.'
          }
        ]
      },
      templates: {
        title: 'Editorial Templates',
        sections: [
          {
            title: 'Crafting Professional Correspondence',
            content:
              'Employ editorial variables including {firstName}, {company}, and {title} to personalize your networking messages with professional distinction.'
          },
          {
            title: 'Sample Editorial',
            content:
              "Dear {firstName}, I have had the privilege of observing your distinguished work at {company}. I would be honored to establish a professional connection and exchange insights regarding your expertise in the field."
          }
        ]
      },
      analytics: {
        title: 'Readership Analytics',
        sections: [
          {
            title: 'Editorial Performance Metrics',
            content:
              'Monitor your connection acceptance rates, response timeframes, and most effective message templates through the Analytics Chronicle dashboard.'
          },
          {
            title: 'Editorial Testing',
            content: 'Conduct systematic message variations to optimize your professional networking effectiveness and editorial impact.'
          }
        ]
      },
      troubleshooting: {
        title: 'Technical Support',
        sections: [
          {
            title: 'Editorial Issues',
            content:
              'If publishing operations cease: 1) Refresh the LinkedIn editorial page, 2) Verify professional account authentication, 3) Confirm daily circulation limits.'
          },
          {
            title: 'System Codes',
            content:
              'E001: Authentication required, E002: Daily circulation limit reached, E003: Network connectivity issue, E004: Invalid search criteria specified.'
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
            <h2>Editorial Help & Documentation</h2>
            <button class="help-close-btn" type="button">&times;</button>
          </div>
          <div class="help-modal-body">
            <div class="help-sidebar">
              <ul class="help-topics-list">
                ${Object.keys(this.helpData)
    .map(
      key => `
                  <li>
                    <button class="help-topic-btn" data-topic="${key}">
                      ${this.helpData[key].title}
                    </button>
                  </li>
                `
    )
    .join('')}
              </ul>
            </div>
            <div class="help-content-area">
              <div id="help-content">
                <h3>Welcome to Editorial Documentation</h3>
                <p>Select a topic from the editorial index to begin your research.</p>
                <div class="help-quick-links">
                  <h4>Editorial Index:</h4>
                  <button class="help-topic-btn" data-topic="getting-started">Editorial Primer</button>
                  <button class="help-topic-btn" data-topic="troubleshooting">Technical Support</button>
                  <a href="#" id="open-user-guide" target="_blank">Complete Documentation</a>
                </div>
              </div>
            </div>
          </div>
          <div class="help-modal-footer">
            <button class="help-support-btn" type="button">Editorial Support</button>
            <button class="help-close-btn" type="button">Close</button>
          </div>
        </div>
      </div>
    `;

    // Add vintage CSS styles
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&display=swap');

      .linkedin-ext-help-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
        display: none;
        font-family: 'Crimson Text', Georgia, 'Times New Roman', Times, serif;
      }

      .help-modal-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(47, 47, 47, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(4px);
      }

      .help-modal-content {
        background: #F4F1DE;
        border: 2px solid #3D405B;
        border-radius: 12px;
        width: 90%;
        max-width: 900px;
        height: 85%;
        max-height: 700px;
        display: flex;
        flex-direction: column;
        box-shadow: 0 20px 60px rgba(47, 47, 47, 0.3), 0 8px 20px rgba(47, 47, 47, 0.15);
      }

      .help-modal-header {
        padding: 24px;
        border-bottom: 2px solid #3D405B;
        border-opacity: 0.2;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: linear-gradient(135deg, #F4F1DE 0%, rgba(244, 241, 222, 0.8) 100%);
        border-radius: 10px 10px 0 0;
      }

      .help-modal-header h2 {
        margin: 0;
        color: #2F2F2F;
        font-size: 28px;
        font-weight: 700;
        font-family: 'Crimson Text', serif;
        letter-spacing: -0.02em;
      }

      .help-close-btn {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #3D405B;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.2s;
      }

      .help-close-btn:hover {
        background: #3D405B;
        color: #F4F1DE;
      }

      .help-modal-body {
        flex: 1;
        display: flex;
        overflow: hidden;
      }

      .help-sidebar {
        width: 220px;
        background: rgba(61, 64, 91, 0.05);
        border-right: 2px solid #3D405B;
        border-opacity: 0.15;
        overflow-y: auto;
      }

      .help-topics-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .help-topics-list li {
        border-bottom: 1px solid rgba(61, 64, 91, 0.1);
      }

      .help-topic-btn {
        width: 100%;
        padding: 16px 20px;
        text-align: left;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 14px;
        color: #2F2F2F;
        font-family: 'Crimson Text', serif;
        font-weight: 500;
        transition: all 0.2s;
        border-left: 4px solid transparent;
      }

      .help-topic-btn:hover {
        background: rgba(224, 122, 95, 0.1);
        border-left-color: #E07A5F;
        color: #2F2F2F;
      }

      .help-topic-btn.active {
        background: rgba(224, 122, 95, 0.15);
        border-left-color: #E07A5F;
        color: #2F2F2F;
        font-weight: 600;
      }

      .help-content-area {
        flex: 1;
        padding: 24px;
        overflow-y: auto;
        color: #2F2F2F;
      }

      .help-content-area h3 {
        font-size: 24px;
        font-weight: 700;
        color: #2F2F2F;
        margin: 0 0 20px 0;
        font-family: 'Crimson Text', serif;
      }

      .help-quick-links {
        margin-top: 24px;
        padding: 20px;
        background: rgba(129, 178, 154, 0.1);
        border: 1px solid rgba(129, 178, 154, 0.2);
        border-radius: 8px;
      }

      .help-quick-links h4 {
        margin: 0 0 12px 0;
        color: #2F2F2F;
        font-size: 16px;
        font-weight: 600;
        font-family: 'Crimson Text', serif;
      }

      .help-quick-links button,
      .help-quick-links a {
        display: inline-block;
        margin: 6px 12px 6px 0;
        padding: 10px 16px;
        background: #E07A5F;
        color: #F4F1DE;
        text-decoration: none;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 13px;
        font-family: 'Crimson Text', serif;
        font-weight: 600;
        transition: all 0.2s;
      }

      .help-quick-links button:hover,
      .help-quick-links a:hover {
        background: #D66A4A;
        transform: translateY(-1px);
      }

      .help-modal-footer {
        padding: 20px 24px;
        border-top: 2px solid #3D405B;
        border-opacity: 0.15;
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        background: rgba(244, 241, 222, 0.7);
        border-radius: 0 0 10px 10px;
      }

      .help-support-btn {
        padding: 12px 20px;
        background: #81B29A;
        color: #F4F1DE;
        border: 2px solid #81B29A;
        border-radius: 6px;
        cursor: pointer;
        font-family: 'Crimson Text', serif;
        font-weight: 600;
        transition: all 0.2s;
      }

      .help-support-btn:hover {
        background: #6B9582;
        border-color: #6B9582;
        transform: translateY(-1px);
      }

      .help-modal-footer .help-close-btn {
        padding: 12px 20px;
        background: transparent;
        color: #3D405B;
        border: 2px solid #3D405B;
        border-radius: 6px;
        font-family: 'Crimson Text', serif;
        font-weight: 600;
        width: auto;
        height: auto;
      }

      .help-modal-footer .help-close-btn:hover {
        background: #3D405B;
        color: #F4F1DE;
      }

      .help-section {
        margin-bottom: 24px;
      }

      .help-section h4 {
        color: #E07A5F;
        margin-bottom: 10px;
        font-size: 18px;
        font-weight: 600;
        font-family: 'Crimson Text', serif;
      }

      .help-section p {
        line-height: 1.6;
        color: #2F2F2F;
        margin-bottom: 12px;
        font-size: 14px;
        font-family: 'Crimson Text', serif;
      }

      .help-section ul {
        margin: 12px 0;
        padding-left: 20px;
        color: #2F2F2F;
      }

      .help-section li {
        margin-bottom: 8px;
        line-height: 1.5;
        font-family: 'Crimson Text', serif;
      }

      .help-section strong {
        color: #3D405B;
        font-weight: 600;
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
      btn.addEventListener('click', e => {
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
    this.modal.querySelector('#open-user-guide').addEventListener('click', e => {
      e.preventDefault();
      this.openUserGuide();
    });

    // Close on overlay click
    this.modal.querySelector('.help-modal-overlay').addEventListener('click', e => {
      if (e.target === e.currentTarget) {
        this.hide();
      }
    });

    // Keyboard events
    document.addEventListener('keydown', e => {
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
    if (!topic) {
      return;
    }

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
      ${topic.sections
    .map(
      section => `
        <div class="help-section">
          <h4>${section.title}</h4>
          <p>${section.content}</p>
        </div>
      `
    )
    .join('')}
    `;

    // Track topic view
    this.trackHelpUsage('topic_viewed', { topic: topicKey });
  }

  // Open support contact
  openSupport() {
    // Create a simple contact form or redirect to support
    const supportContent = `
      <h3>Editorial Support Bureau</h3>
      <div class="help-section">
        <h4>Require Additional Editorial Assistance?</h4>
        <p>Should you require further guidance beyond our documentation, the Editorial Support Bureau offers the following channels:</p>
        <ul>
          <li><strong>Editorial Correspondence:</strong> support@editorial-chronicle.com</li>
          <li><strong>Response Timeframe:</strong> Within 24 professional hours</li>
          <li><strong>Required Information:</strong> Chrome browser version, operating system, and comprehensive issue description</li>
        </ul>
        <h4>Pre-Contact Editorial Review:</h4>
        <ul>
          <li>Consult the Editorial FAQ compendium</li>
          <li>Refresh the LinkedIn editorial interface</li>
          <li>Deactivate and reactivate the Chronicle extension</li>
          <li>Document any system error messages encountered</li>
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
    tooltip.style.top = rect.bottom + 5 + 'px';

    // Show tooltip
    setTimeout(() => (tooltip.style.opacity = '1'), 10);

    // Hide tooltip after duration
    setTimeout(() => {
      tooltip.style.opacity = '0';
      setTimeout(() => tooltip.remove(), 300);
    }, duration);
  }

  // Track help system usage for analytics
  trackHelpUsage(action, data = {}) {
    try {
      chrome.storage.local.get(['helpUsageStats'], result => {
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
    chrome.storage.local.get(['helpUsageStats'], result => {
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
